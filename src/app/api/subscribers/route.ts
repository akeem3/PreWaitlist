import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAndFulfillMilestones } from "@/lib/milestones";
import { recalculatePositions, getPositionUpdate } from "@/lib/positions";
import { sendEmail } from "@/lib/email";

function generateReferralCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const body = await request.json();
  const {
    waitlist_id,
    email,
    referral_code: incomingRefCode,
    qual_answers,
  } = body;

  if (!waitlist_id || !email) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const trimmedEmail = email.trim().toLowerCase();

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }

  // Resolve referral_code → referrer_id
  let resolvedReferrerId: string | null = null;
  if (
    incomingRefCode &&
    typeof incomingRefCode === "string" &&
    incomingRefCode.trim()
  ) {
    const { data: referrer } = await supabase
      .from("subscribers")
      .select("id, waitlist_id")
      .eq("referral_code", incomingRefCode.trim())
      .single();

    if (!referrer) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 400 }
      );
    }

    if (referrer.waitlist_id !== waitlist_id) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 400 }
      );
    }

    resolvedReferrerId = referrer.id;
  }

  // Temporary position — will be corrected by recalculatePositions after insert
  const position = 1;
  const referral_code = generateReferralCode();

  const { data, error } = await supabase
    .from("subscribers")
    .insert({
      waitlist_id,
      email: trimmedEmail,
      referral_code,
      position,
      referrer_id: resolvedReferrerId,
      qual_answers:
        qual_answers && Object.keys(qual_answers).length > 0
          ? qual_answers
          : null,
    })
    .select("id, email, referral_code, position")
    .single();

  if (error) {
    if (
      error.code === "23505" &&
      error.message.includes("subscribers_waitlist_email_idx")
    ) {
      return NextResponse.json(
        { error: "This email is already on the waitlist" },
        { status: 409 }
      );
    }
    console.error("Subscriber creation error:", error);
    return NextResponse.json(
      { error: error.message, details: error.details, hint: error.hint },
      { status: 400 }
    );
  }

  // Post-insert: check for self-referral and trigger milestones
  if (resolvedReferrerId) {
    // Prevent self-referral (safety net — client shouldn't send own referral_code)
    if (resolvedReferrerId === data.id) {
      await supabase
        .from("subscribers")
        .update({ referrer_id: null })
        .eq("id", data.id);
      resolvedReferrerId = null;
    } else {
      // Count referrals and check milestones
      const { count } = await supabase
        .from("subscribers")
        .select("id", { count: "exact", head: true })
        .eq("referrer_id", resolvedReferrerId);

      await checkAndFulfillMilestones(
        resolvedReferrerId,
        waitlist_id,
        count || 0
      );
    }
  }

  // AC5: Synchronous recalculate — must complete before response returns
  const updates = await recalculatePositions(waitlist_id, supabase);
  const subscriberUpdate = getPositionUpdate(updates, data.id);
  const correctedPosition = subscriberUpdate?.new_position ?? data.position;

  // --- Confirmation email (fire-and-forget) ---
  // AC1: Send immediately after subscriber creation
  // AC6: Error handling — email failure must not block signup
  (async () => {
    const { data: waitlist } = await supabase
      .from("waitlists")
      .select("product_name, headline, subdomain, sender_name, sending_domain")
      .eq("id", waitlist_id)
      .single();

    if (!waitlist) return;

    const productName =
      waitlist.product_name || waitlist.headline || "PreWaitlist";

    const referralLink = `https://${waitlist.subdomain}.prewaitlist.com?ref=${data.referral_code}`;

    const subject = `You're #${correctedPosition} in line for ${productName}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 12px;">
          You're <strong>#${correctedPosition}</strong> in line for <strong>${productName}</strong>.
        </p>
        <p style="font-size: 14px; color: #6b6459; margin: 0 0 24px;">
          Share your referral link to move up:
        </p>
        <p style="font-size: 14px; color: #6b6459; margin: 0 0 24px;">
          <a href="${referralLink}" style="color: #0f7a5e; text-decoration: underline;">${referralLink}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #ccc9c3; margin: 24px 0;" />
        <p style="font-size: 12px; color: #6b6459; margin: 0;">
          ${productName} — powered by PreWaitlist
        </p>
      </div>
    `;

    const emailResult = await sendEmail({
      to: data.email,
      subject,
      html,
      stream: "transactional",
      senderName: waitlist.sender_name,
      productName: waitlist.product_name,
      headline: waitlist.headline,
      sendingDomain: waitlist.sending_domain,
      idempotencyKey: `confirmation-email/${data.id}`,
    });

    // AC8: Log sent event to email_events
    if (emailResult.ok) {
      await supabase.from("email_events").insert({
        subscriber_id: data.id,
        waitlist_id,
        event_type: "sent",
        event_data: { email_id: emailResult.id, type: "confirmation" },
        created_at: new Date().toISOString(),
      });
    }
  })();

  // --- Moved-up email (fire-and-forget) ---
  // AC1: Send when referrer moves up ≥1 position
  // AC2: Subject includes new position + product name
  // AC3: Body includes new position, spots moved, referral link
  // AC4: Skip if self-referral
  // AC6: Error handling — email failure must not block signup
  if (
    subscriberUpdate &&
    subscriberUpdate.spots_moved >= 1 &&
    resolvedReferrerId
  ) {
    (async () => {
      const { data: referrer } = await supabase
        .from("subscribers")
        .select("email, referral_code")
        .eq("id", resolvedReferrerId)
        .single();

      if (!referrer) return;

      const { data: waitlist } = await supabase
        .from("waitlists")
        .select(
          "product_name, headline, subdomain, sender_name, sending_domain"
        )
        .eq("id", waitlist_id)
        .single();

      if (!waitlist) return;

      const productName =
        waitlist.product_name || waitlist.headline || "PreWaitlist";

      const referralLink = `https://${waitlist.subdomain}.prewaitlist.com?ref=${referrer.referral_code}`;

      const subject = `You moved up to #${subscriberUpdate.new_position} for ${productName}!`;

      const html = `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
          <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 12px;">
            Nice! You moved up <strong>${subscriberUpdate.spots_moved} ${subscriberUpdate.spots_moved === 1 ? "spot" : "spots"}</strong> to <strong>#${subscriberUpdate.new_position}</strong> in line for <strong>${productName}</strong>.
          </p>
          <p style="font-size: 14px; color: #6b6459; margin: 0 0 24px;">
            Share your referral link to keep climbing:
          </p>
          <p style="font-size: 14px; color: #6b6459; margin: 0 0 24px;">
            <a href="${referralLink}" style="color: #0f7a5e; text-decoration: underline;">${referralLink}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #ccc9c3; margin: 24px 0;" />
          <p style="font-size: 12px; color: #6b6459; margin: 0;">
            ${productName} — powered by PreWaitlist
          </p>
        </div>
      `;

      const emailResult = await sendEmail({
        to: referrer.email,
        subject,
        html,
        stream: "transactional",
        senderName: waitlist.sender_name,
        productName: waitlist.product_name,
        headline: waitlist.headline,
        sendingDomain: waitlist.sending_domain,
        idempotencyKey: `moved-up/${resolvedReferrerId}/${subscriberUpdate.new_position}`,
      });

      // AC7: Log event to email_events
      if (emailResult.ok) {
        await supabase.from("email_events").insert({
          subscriber_id: resolvedReferrerId,
          waitlist_id,
          event_type: "sent",
          event_data: {
            email_id: emailResult.id,
            type: "moved_up",
            new_position: subscriberUpdate.new_position,
            spots_moved: subscriberUpdate.spots_moved,
          },
          created_at: new Date().toISOString(),
        });
      }
    })();
  }

  return NextResponse.json(
    {
      id: data.id,
      email: data.email,
      referral_code: data.referral_code,
      position: correctedPosition,
    },
    { status: 201 }
  );
}

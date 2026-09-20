import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndFulfillMilestones } from "@/lib/milestones";
import { recalculatePositions, getPositionUpdate } from "@/lib/positions";
import {
  sendEmail,
  buildEmailFooter,
  buildFreeEmailFooter,
  isUnsubscribed,
  interpolateEmail,
} from "@/lib/email";
import { isEmailBounced } from "@/lib/bounces";

const BRAND_GREEN = "#0F7A5E";
const TEXT_PRIMARY = "#1a1a1a";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#9ca3af";
const BG_LIGHT = "#f9fafb";
const BORDER_LIGHT = "#e5e7eb";

function generateReferralCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

function buildConfirmationEmail(opts: {
  subscriberName: string | null;
  productName: string;
  position: number;
  subscriberCount: number;
  referralLink: string;
  referralCode: string;
  rewardTiers: { threshold: number; label: string }[];
  footer: string;
  tier?: string;
  customSubject?: string;
  customBody?: string;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = opts.subscriberName?.split(" ")[0] || "there";
  const greeting = opts.subscriberName
    ? `Hi ${opts.subscriberName},`
    : "Welcome,";

  const interpolateVars: Record<string, string | number> = {
    first_name: firstName,
    position: opts.position,
    product_name: opts.productName,
    referral_link: opts.referralLink,
    referral_count: 0,
    total_signups: opts.subscriberCount,
  };

  const rewardTiersHtml =
    opts.rewardTiers.length > 0
      ? `
        <tr>
          <td style="padding: 0 40px 32px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid ${BORDER_LIGHT};">
              <tr>
                <td style="padding-top: 24px;">
                  <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: ${TEXT_SECONDARY}; font-weight: 600;">
                    How to move up:
                  </p>
                  ${opts.rewardTiers
                    .map(
                      (t) => `
                    <p style="margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: ${TEXT_SECONDARY};">
                      ${t.threshold} referral${t.threshold !== 1 ? "s" : ""}: ${t.label}
                    </p>
                  `
                    )
                    .join("")}
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      : "";

  const rewardTiersText =
    opts.rewardTiers.length > 0
      ? `\nHow to move up:\n${opts.rewardTiers.map((t) => `  ${t.threshold} referral${t.threshold !== 1 ? "s" : ""}: ${t.label}`).join("\n")}`
      : "";

  const defaultSubject = `You're #${opts.position} in line for ${opts.productName}`;
  const subject = opts.customSubject?.trim()
    ? interpolateEmail(opts.customSubject, interpolateVars)
    : defaultSubject;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Welcome to ${opts.productName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BG_LIGHT}; font-family: Arial, Helvetica, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden;">
    You're #${opts.position}. Share & Move Up to move up the waitlist.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BG_LIGHT};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          ${
            opts.tier !== "free"
              ? `
          <!-- Logo (Pro only) -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding: 0 0 24px 0;">
                <img src="https://prewaitlist.com/PreWaitlist-logo.svg" alt="PreWaitlist" width="140" height="28" style="display: block; border: 0;" />
              </td>
            </tr>
          </table>
          `
              : ""
          }

          <!-- Content card -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; border: 1px solid ${BORDER_LIGHT};">
            <!-- Greeting + Body -->
            <tr>
              <td style="padding: 40px 40px 24px 40px;">
                ${
                  opts.customBody?.trim()
                    ? interpolateEmail(opts.customBody, interpolateVars)
                        .split("\n")
                        .map(
                          (line, i) =>
                            `<p style="margin: 0 0 ${i === 0 ? "16px" : "0"} 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; color: ${TEXT_SECONDARY};">${line}</p>`
                        )
                        .join("")
                    : `<h1 style="margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif; font-size: 24px; line-height: 30px; font-weight: bold; color: ${TEXT_PRIMARY};">
                      ${greeting}
                    </h1>
                    <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; color: ${TEXT_SECONDARY};">
                      Welcome to <strong>${opts.productName}</strong>. You're on the list!
                    </p>`
                }
              </td>
            </tr>

            <!-- Position block -->
            <tr>
              <td align="center" style="padding: 0 40px 24px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BG_LIGHT}; border-radius: 8px; width: 100%;">
                  <tr>
                    <td align="center" style="padding: 24px;">
                      <p style="margin: 0 0 4px 0; font-family: Arial, sans-serif; font-size: 12px; line-height: 16px; font-weight: 700; color: ${TEXT_MUTED}; letter-spacing: 1px; text-transform: uppercase;">
                        YOUR POSITION
                      </p>
                      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 36px; line-height: 42px; font-weight: bold; color: ${BRAND_GREEN};">
                        #${opts.position}
                      </p>
                      <p style="margin: 8px 0 0 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; color: ${TEXT_MUTED};">
                        of ${opts.subscriberCount.toLocaleString()} subscriber${opts.subscriberCount !== 1 ? "s" : ""}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA button -->
            <tr>
              <td align="center" style="padding: 0 40px 32px 40px;">
                <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="border-radius: 8px; background-color: ${BRAND_GREEN};">
                      <a href="${opts.referralLink}" target="_blank" style="background-color: ${BRAND_GREEN}; border: 1px solid ${BRAND_GREEN}; border-radius: 8px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: bold; line-height: 16px; text-decoration: none; padding: 14px 28px; color: #ffffff; display: block;">
                        Share & Move Up
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${rewardTiersHtml}
          </table>

          <!-- Spacer -->
          <div style="line-height: 32px; height: 32px;">&nbsp;</div>

          <!-- Footer -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 0 40px;" align="center">
                <p style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 13px; line-height: 20px; color: ${TEXT_MUTED};">
                  You signed up at ${opts.referralLink.split("?")[0].replace("https://", "")}
                </p>
              </td>
            </tr>
          </table>
          ${opts.footer}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const bodyText = opts.customBody?.trim()
    ? interpolateEmail(opts.customBody, interpolateVars)
    : `${greeting}\n\nWelcome to ${opts.productName}. You're on the list!`;

  const text = `${bodyText}

YOUR POSITION: #${opts.position} of ${opts.subscriberCount.toLocaleString()} subscribers

Share your unique link to move up:
${opts.referralLink}
${rewardTiersText}

You signed up at ${opts.referralLink.split("?")[0].replace("https://", "")}
`;

  return { subject, html, text };
}

function buildMovedUpEmail(opts: {
  subscriberName: string | null;
  productName: string;
  newPosition: number;
  spotsMoved: number;
  referralLink: string;
  rewardTiers: { threshold: number; label: string }[];
  footer: string;
  tier?: string;
  customSubject?: string;
  customBody?: string;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = opts.subscriberName?.split(" ")[0] || "there";
  const greeting = opts.subscriberName
    ? `Hi ${opts.subscriberName},`
    : "Welcome,";

  const interpolateVars: Record<string, string | number> = {
    first_name: firstName,
    position: opts.newPosition,
    product_name: opts.productName,
    referral_link: opts.referralLink,
    spots_moved: opts.spotsMoved,
  };

  const rewardTiersHtml =
    opts.rewardTiers.length > 0
      ? `
        <tr>
          <td style="padding: 0 40px 32px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid ${BORDER_LIGHT};">
              <tr>
                <td style="padding-top: 24px;">
                  <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: ${TEXT_SECONDARY}; font-weight: 600;">
                    How to move up:
                  </p>
                  ${opts.rewardTiers
                    .map(
                      (t) => `
                    <p style="margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: ${TEXT_SECONDARY};">
                      ${t.threshold} referral${t.threshold !== 1 ? "s" : ""}: ${t.label}
                    </p>
                  `
                    )
                    .join("")}
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      : "";

  const rewardTiersText =
    opts.rewardTiers.length > 0
      ? `\nHow to move up:\n${opts.rewardTiers.map((t) => `  ${t.threshold} referral${t.threshold !== 1 ? "s" : ""}: ${t.label}`).join("\n")}`
      : "";

  const defaultSubject = `You moved up to #${opts.newPosition} for ${opts.productName}!`;
  const subject = opts.customSubject?.trim()
    ? interpolateEmail(opts.customSubject, interpolateVars)
    : defaultSubject;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>You moved up!</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BG_LIGHT}; font-family: Arial, Helvetica, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden;">
    Nice! You moved up ${opts.spotsMoved} spot${opts.spotsMoved !== 1 ? "s" : ""} to #${opts.newPosition}.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BG_LIGHT};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          ${
            opts.tier !== "free"
              ? `
          <!-- Logo (Pro only) -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding: 0 0 24px 0;">
                <img src="https://prewaitlist.com/PreWaitlist-logo.svg" alt="PreWaitlist" width="140" height="28" style="display: block; border: 0;" />
              </td>
            </tr>
          </table>
          `
              : ""
          }

          <!-- Content card -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; border: 1px solid ${BORDER_LIGHT};">
            <!-- Greeting + Body -->
            <tr>
              <td style="padding: 40px 40px 24px 40px;">
                ${
                  opts.customBody?.trim()
                    ? interpolateEmail(opts.customBody, interpolateVars)
                        .split("\n")
                        .map(
                          (line, i) =>
                            `<p style="margin: 0 0 ${i === 0 ? "16px" : "0"} 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; color: ${TEXT_SECONDARY};">${line}</p>`
                        )
                        .join("")
                    : `<h1 style="margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif; font-size: 24px; line-height: 30px; font-weight: bold; color: ${TEXT_PRIMARY};">
                      ${greeting}
                    </h1>
                    <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; color: ${TEXT_SECONDARY};">
                      Nice! You moved up <strong>${opts.spotsMoved} ${opts.spotsMoved === 1 ? "spot" : "spots"}</strong> to <strong>#${opts.newPosition}</strong> in line for <strong>${opts.productName}</strong>.
                    </p>`
                }
              </td>
            </tr>

            <!-- Position block -->
            <tr>
              <td align="center" style="padding: 0 40px 24px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BG_LIGHT}; border-radius: 8px; width: 100%;">
                  <tr>
                    <td align="center" style="padding: 24px;">
                      <p style="margin: 0 0 4px 0; font-family: Arial, sans-serif; font-size: 12px; line-height: 16px; font-weight: 700; color: ${TEXT_MUTED}; letter-spacing: 1px; text-transform: uppercase;">
                        NEW POSITION
                      </p>
                      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 36px; line-height: 42px; font-weight: bold; color: ${BRAND_GREEN};">
                        #${opts.newPosition}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA button -->
            <tr>
              <td align="center" style="padding: 0 40px 32px 40px;">
                <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="border-radius: 8px; background-color: ${BRAND_GREEN};">
                      <a href="${opts.referralLink}" target="_blank" style="background-color: ${BRAND_GREEN}; border: 1px solid ${BRAND_GREEN}; border-radius: 8px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: bold; line-height: 16px; text-decoration: none; padding: 14px 28px; color: #ffffff; display: block;">
                        Share & Move Up
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${rewardTiersHtml}
          </table>

          <!-- Spacer -->
          <div style="line-height: 32px; height: 32px;">&nbsp;</div>

          <!-- Footer -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 0 40px;" align="center">
                <p style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 13px; line-height: 20px; color: ${TEXT_MUTED};">
                  Keep sharing to keep climbing!
                </p>
              </td>
            </tr>
          </table>
          ${opts.footer}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const bodyText = opts.customBody?.trim()
    ? interpolateEmail(opts.customBody, interpolateVars)
    : `${greeting}\n\nNice! You moved up ${opts.spotsMoved} ${opts.spotsMoved === 1 ? "spot" : "spots"} to #${opts.newPosition} in line for ${opts.productName}.`;

  const text = `${bodyText}

NEW POSITION: #${opts.newPosition}

Share your referral link to keep climbing:
${opts.referralLink}
${rewardTiersText}

Keep sharing to keep climbing!
`;

  return { subject, html, text };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const body = await request.json();
  const {
    waitlist_id,
    email,
    referral_code: incomingRefCode,
    qual_answers,
    display_name,
  } = body;

  if (!waitlist_id || !email) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const trimmedEmail = email.trim().toLowerCase();

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }

  // 500 cap check — Free tier only
  const { data: waitlistRow } = await supabase
    .from("waitlists")
    .select("subscriber_count, founder_profiles!inner ( tier )")
    .eq("id", waitlist_id)
    .single();

  if (waitlistRow) {
    const founderProfile = Array.isArray(waitlistRow.founder_profiles)
      ? waitlistRow.founder_profiles[0]
      : waitlistRow.founder_profiles;
    const tier = founderProfile?.tier || "free";
    const count = waitlistRow.subscriber_count ?? 0;

    if (tier === "free" && count >= 500) {
      return NextResponse.json(
        {
          error:
            "Subscriber limit reached. Upgrade to Pro for unlimited signups.",
        },
        { status: 403 }
      );
    }
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

  const baseInsert = {
    waitlist_id,
    email: trimmedEmail,
    referral_code,
    position,
    referrer_id: resolvedReferrerId,
    qual_answers:
      qual_answers && Object.keys(qual_answers).length > 0
        ? qual_answers
        : null,
    consent_given_at: new Date().toISOString(),
    consent_ip_address: ipAddress,
  };

  // Try with display_name; fall back without it if column doesn't exist yet
  let insertResult = await supabase
    .from("subscribers")
    .insert({ ...baseInsert, display_name: display_name?.trim() || null })
    .select("id, email, referral_code, position")
    .single();

  if (
    insertResult.error?.code === "PGRST204" &&
    insertResult.error?.message?.includes("display_name")
  ) {
    insertResult = await supabase
      .from("subscribers")
      .insert(baseInsert)
      .select("id, email, referral_code, position")
      .single();
  }

  const { data, error } = insertResult;

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

  // Increment cached subscriber_count (atomic, fire-and-forget on error)
  try {
    const { error: countErr } = await supabase.rpc(
      "increment_subscriber_count",
      {
        p_waitlist_id: waitlist_id,
      }
    );
    if (countErr) {
      console.error(
        "[subscribers] increment_subscriber_count failed:",
        countErr.message
      );
    }
  } catch (e) {
    console.error("[subscribers] increment_subscriber_count threw:", e);
  }

  // --- Confirmation email (fire-and-forget) ---
  // AC1: Send immediately after subscriber creation
  // AC6: Error handling — email failure must not block signup
  after(async () => {
    try {
      const adminSupabase = createAdminClient();

      const { data: waitlist } = await adminSupabase
        .from("waitlists")
        .select(
          "product_name, headline, subdomain, sender_name, sending_domain, business_address, email_subject, email_body"
        )
        .eq("id", waitlist_id)
        .single();

      if (!waitlist) return;

      // Skip if subscriber has unsubscribed or email bounced
      if (await isUnsubscribed(adminSupabase, data.id)) return;
      if (await isEmailBounced(adminSupabase, waitlist_id, data.email)) return;

      const productName =
        waitlist.product_name || waitlist.headline || "PreWaitlist";

      // Fetch subscriber display_name
      const { data: subscriber } = await adminSupabase
        .from("subscribers")
        .select("display_name")
        .eq("id", data.id)
        .single();

      const subscriberName = subscriber?.display_name?.trim() || null;

      // Fetch subscriber count for social proof
      const { count: subscriberCount } = await adminSupabase
        .from("subscribers")
        .select("id", { count: "exact", head: true })
        .eq("waitlist_id", waitlist_id);

      // Fetch milestone rewards
      const { data: rewardTiers } = await adminSupabase
        .from("milestone_rewards")
        .select("tier_referrals, reward_label")
        .eq("waitlist_id", waitlist_id)
        .order("tier_referrals", { ascending: true });

      const referralLink = `https://${waitlist.subdomain}.prewaitlist.com?ref=${data.referral_code}`;

      // Fetch tier for email template selection
      const { data: waitlistWithTier, error: tierError } = await adminSupabase
        .from("waitlists")
        .select("founder_profiles!inner(tier)")
        .eq("id", waitlist_id)
        .single();

      const tier =
        (
          waitlistWithTier?.founder_profiles as unknown as { tier: string }[]
        )?.[0]?.tier || "free";

      if (tierError) {
        console.error("Tier query failed:", tierError.message);
      }
      console.log(`Email tier for waitlist ${waitlist_id}: ${tier}`);

      const footer =
        tier === "free"
          ? buildFreeEmailFooter(waitlist.business_address)
          : buildEmailFooter(waitlist.business_address);

      const email = buildConfirmationEmail({
        subscriberName,
        productName,
        position: correctedPosition,
        subscriberCount: subscriberCount || 1,
        referralLink,
        referralCode: data.referral_code,
        rewardTiers: (rewardTiers || []).map((t) => ({
          threshold: t.tier_referrals,
          label: t.reward_label,
        })),
        footer,
        tier,
        customSubject: waitlist.email_subject || undefined,
        customBody: waitlist.email_body || undefined,
      });

      const emailResult = await sendEmail({
        to: data.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        stream: "transactional",
        senderName: waitlist.sender_name,
        productName: waitlist.product_name,
        headline: waitlist.headline,
        sendingDomain: waitlist.sending_domain,
        idempotencyKey: `confirmation-email/${data.id}`,
      });

      // AC8: Log sent event to email_events
      if (emailResult.ok) {
        console.log(
          `Confirmation email sent to ${data.email} (id: ${emailResult.id})`
        );
        await supabase.from("email_events").insert({
          subscriber_id: data.id,
          waitlist_id,
          event_type: "sent",
          event_data: { email_id: emailResult.id, type: "confirmation" },
          created_at: new Date().toISOString(),
        });
      } else {
        console.error(
          `Confirmation email failed for ${data.email}:`,
          emailResult.error
        );
      }
    } catch (err) {
      console.error("Confirmation email IIFE failed:", err);
    }
  });

  // --- Moved-up email (fire-and-forget) ---
  // AC1: Send when referrer moves up >=1 position
  // AC2: Subject includes new position + product name
  // AC3: Body includes new position, spots moved, referral link
  // AC4: Skip if self-referral
  // AC6: Error handling — email failure must not block signup
  if (
    subscriberUpdate &&
    subscriberUpdate.spots_moved >= 1 &&
    resolvedReferrerId
  ) {
    after(async () => {
      try {
        const adminSupabase = createAdminClient();

        const { data: referrer } = await adminSupabase
          .from("subscribers")
          .select("email, referral_code, display_name")
          .eq("id", resolvedReferrerId)
          .single();

        if (!referrer) return;

        const { data: waitlist } = await adminSupabase
          .from("waitlists")
          .select(
            "product_name, headline, subdomain, sender_name, sending_domain, business_address, email_subject, email_body"
          )
          .eq("id", waitlist_id)
          .single();

        if (!waitlist) return;

        // Skip if referrer has unsubscribed or email bounced
        if (await isUnsubscribed(adminSupabase, resolvedReferrerId)) return;
        if (await isEmailBounced(adminSupabase, waitlist_id, referrer.email))
          return;

        const productName =
          waitlist.product_name || waitlist.headline || "PreWaitlist";

        const referralLink = `https://${waitlist.subdomain}.prewaitlist.com?ref=${referrer.referral_code}`;

        // Fetch milestone rewards
        const { data: rewardTiers } = await adminSupabase
          .from("milestone_rewards")
          .select("tier_referrals, reward_label")
          .eq("waitlist_id", waitlist_id)
          .order("tier_referrals", { ascending: true });

        const subscriberName = referrer.display_name?.trim() || null;

        // Fetch tier for email template selection
        const { data: waitlistWithTier, error: movedUpTierError } =
          await adminSupabase
            .from("waitlists")
            .select("founder_profiles!inner(tier)")
            .eq("id", waitlist_id)
            .single();

        const tier =
          (
            waitlistWithTier?.founder_profiles as unknown as {
              tier: string;
            }[]
          )?.[0]?.tier || "free";

        if (movedUpTierError) {
          console.error(
            "Moved-up tier query failed:",
            movedUpTierError.message
          );
        }

        const footer =
          tier === "free"
            ? buildFreeEmailFooter(waitlist.business_address)
            : buildEmailFooter(waitlist.business_address);

        const email = buildMovedUpEmail({
          subscriberName,
          productName,
          newPosition: subscriberUpdate.new_position,
          spotsMoved: subscriberUpdate.spots_moved,
          referralLink,
          rewardTiers: (rewardTiers || []).map((t) => ({
            threshold: t.tier_referrals,
            label: t.reward_label,
          })),
          footer,
          tier,
          customSubject: waitlist.email_subject || undefined,
          customBody: waitlist.email_body || undefined,
        });

        const emailResult = await sendEmail({
          to: referrer.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
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
      } catch (err) {
        console.error("Moved-up email IIFE failed:", err);
      }
    });
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

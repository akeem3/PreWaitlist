import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { resolveFromAddress } from "@/lib/email";
import { isEmailBounced } from "@/lib/bounces";

const BATCH_SIZE = 100;

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (profile?.tier !== "pro") {
    return NextResponse.json(
      { error: "Pro subscription required" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { subject, body: emailBody, segment } = body;

  if (!subject?.trim() || !emailBody?.trim()) {
    return NextResponse.json(
      { error: "Subject and body are required" },
      { status: 400 }
    );
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select(
      "id, product_name, headline, subdomain, sender_name, sending_domain, business_address"
    )
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) {
    return NextResponse.json({ error: "No waitlist found" }, { status: 404 });
  }

  let query = supabase
    .from("subscribers")
    .select("id, email, referral_code, unsubscribed_at")
    .eq("waitlist_id", waitlist.id);

  if (segment === "hot_warm") {
    query = query.in("warmth_score", ["hot", "warm"]);
  } else if (segment === "cold") {
    query = query.eq("warmth_score", "cold");
  }

  const { data: subscribers } = await query;

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json(
      { error: "No subscribers to send to" },
      { status: 400 }
    );
  }

  // Filter out unsubscribed and bounced subscribers
  const adminSupabase = createAdminClient();
  const eligible: { id: string; email: string; referral_code: string }[] = [];

  for (const sub of subscribers) {
    if (sub.unsubscribed_at) continue;
    if (await isEmailBounced(adminSupabase, waitlist.id, sub.email)) continue;
    eligible.push(sub);
  }

  if (eligible.length === 0) {
    return NextResponse.json(
      { error: "No eligible subscribers to send to" },
      { status: 400 }
    );
  }

  const from = resolveFromAddress(
    waitlist.sender_name,
    waitlist.product_name,
    waitlist.headline,
    "broadcast",
    waitlist.sending_domain
  );

  // Use shared footer with founder's business address
  // Placeholder — individual subscriber tokens aren't needed since
  // Resend's {{{RESEND_UNSUBSCRIBE_URL}}} merge tag handles per-recipient links
  const DEFAULT_ADDRESS =
    "PreWaitlist Inc., 548 Market St, Suite 35000, San Francisco, CA 94104";
  const address = waitlist.business_address?.trim() || DEFAULT_ADDRESS;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 16px;">
      ${emailBody}
      <hr style="border: none; border-top: 1px solid #ccc9c3; margin: 32px 0;" />
      <p style="font-size: 12px; color: #6b6459; margin: 0 0 8px;">
        ${address}
      </p>
      <p style="font-size: 12px; color: #6b6459; margin: 0;">
        <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #6b6459;">Unsubscribe</a>
      </p>
    </div>
  `;

  let totalSent = 0;

  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const batch = eligible.slice(i, i + BATCH_SIZE);

    const emails = batch.map((sub) => ({
      from,
      to: [sub.email],
      subject,
      html,
    }));

    const result = await resend.batch.send(emails);

    if (result.error) {
      console.error("Batch send error:", result.error);
    } else {
      totalSent += batch.length;
    }
  }

  await supabase.from("broadcasts").insert({
    waitlist_id: waitlist.id,
    subject,
    recipient_count: totalSent,
    sent_at: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    recipient_count: totalSent,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { resolveFromAddress, buildBroadcastEmailFooter } from "@/lib/email";
import { generateUnsubscribeUrl } from "@/lib/unsubscribe";
import { isEmailBounced } from "@/lib/bounces";
import { requirePro } from "@/lib/tier-gating";

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

  const tierCheck = requirePro(profile?.tier ?? "free", "Broadcast");
  if (!tierCheck.allowed) {
    return NextResponse.json({ error: tierCheck.reason }, { status: 403 });
  }

  const body = await req.json();
  const { subject, body: emailBody, segment, waitlist_id } = body;

  if (!waitlist_id) {
    return NextResponse.json(
      { error: "waitlist_id is required" },
      { status: 400 }
    );
  }

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
    .eq("id", waitlist_id)
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

  let totalSent = 0;

  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const batch = eligible.slice(i, i + BATCH_SIZE);

    const emails = batch.map((sub) => {
      const unsubscribeUrl = generateUnsubscribeUrl(sub.id);
      const footer = buildBroadcastEmailFooter(
        sub.id,
        waitlist.business_address
      );

      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 16px;">
          ${emailBody}
          ${footer}
        </div>
      `;

      return {
        from,
        to: [sub.email],
        subject,
        html,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });

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

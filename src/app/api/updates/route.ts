import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/tier-gating";
import { resend } from "@/lib/resend";
import { resolveFromAddress, buildEmailFooter } from "@/lib/email";
import { generateUnsubscribeUrl } from "@/lib/unsubscribe";

const MAX_BODY_LENGTH = 2000;

export async function POST(request: NextRequest) {
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
    .maybeSingle();

  const tierCheck = requirePro(profile?.tier ?? "free", "Founder updates");
  if (!tierCheck.allowed) {
    return NextResponse.json({ error: tierCheck.reason }, { status: 403 });
  }

  const body = await request.json();
  const text = (body?.body ?? "").trim();

  if (!text) {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }

  if (text.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: `Body must be under ${MAX_BODY_LENGTH} characters` },
      { status: 400 }
    );
  }

  const { data: waitlist, error: waitlistError } = await supabase
    .from("waitlists")
    .select(
      "id, subdomain, name, product_name, headline, sender_name, sending_domain, business_address"
    )
    .eq("founder_id", user.id)
    .single();

  if (waitlistError || !waitlist) {
    return NextResponse.json({ error: "No waitlist found" }, { status: 400 });
  }

  const { data: update, error: insertError } = await supabase
    .from("founder_updates")
    .insert({
      waitlist_id: waitlist.id,
      body: text,
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    return NextResponse.json(
      {
        error: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      },
      { status: 400 }
    );
  }

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email")
    .eq("waitlist_id", waitlist.id);

  if (subscribers && subscribers.length > 0) {
    const from = resolveFromAddress(
      waitlist.sender_name,
      waitlist.product_name,
      waitlist.headline,
      "broadcast",
      waitlist.sending_domain
    );

    const productName =
      waitlist.product_name || waitlist.headline || waitlist.subdomain;
    const footerHtml = buildEmailFooter(waitlist.business_address);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Update from ${productName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 40px;">
                <p style="margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; color: #4b5563; white-space: pre-wrap;">${text}</p>
              </td>
            </tr>
          </table>
          <div style="line-height: 32px; height: 32px;">&nbsp;</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 0 40px;" align="center">
                ${footerHtml}
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const BATCH_SIZE = 100;
    const batchEmails = [];

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      const emails = batch.map((sub) => ({
        from,
        to: sub.email,
        subject: `Update from ${productName}`,
        html,
        text,
        headers: {
          "List-Unsubscribe": `<${generateUnsubscribeUrl(sub.id)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }));
      batchEmails.push(...emails);
    }

    try {
      await resend.batch.send(batchEmails);

      await supabase
        .from("founder_updates")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", update.id);
    } catch {
      console.error("Failed to send update emails");
    }
  }

  return NextResponse.json({ id: update.id }, { status: 201 });
}

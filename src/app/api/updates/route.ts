import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePro } from "@/lib/tier-gating";
import {
  resolveFromAddress,
  buildBroadcastEmailFooter,
  escapeHtml,
  sendBatchWithRetry,
} from "@/lib/email";
import { generateUnsubscribeUrl } from "@/lib/unsubscribe";
import { isEmailBounced } from "@/lib/bounces";

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

  if (text.length < 10) {
    return NextResponse.json(
      { error: "Body must be at least 10 characters" },
      { status: 400 }
    );
  }

  if (text.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: `Body must be under ${MAX_BODY_LENGTH} characters` },
      { status: 400 }
    );
  }

  let wlQuery = supabase
    .from("waitlists")
    .select(
      "id, subdomain, name, product_name, headline, sender_name, sending_domain, business_address"
    )
    .eq("founder_id", user.id);

  if (typeof body?.waitlist_id === "string" && body.waitlist_id) {
    wlQuery = wlQuery.eq("id", body.waitlist_id);
  }

  const { data: waitlists, error: waitlistError } = await wlQuery;

  if (waitlistError || !waitlists || waitlists.length === 0) {
    return NextResponse.json({ error: "No waitlist found" }, { status: 400 });
  }

  if (waitlists.length > 1 && !body?.waitlist_id) {
    return NextResponse.json(
      { error: "waitlist_id is required when multiple waitlists exist" },
      { status: 400 }
    );
  }

  const waitlist = waitlists[0];

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

  let totalSent = 0;
  let sendError: string | null = null;

  try {
    const { data: subscribers } = await supabase
      .from("subscribers")
      .select("id, email, unsubscribed_at")
      .eq("waitlist_id", waitlist.id);

    const adminSupabase = createAdminClient();
    const eligible: { id: string; email: string }[] = [];

    for (const sub of subscribers ?? []) {
      if (sub.unsubscribed_at) continue;
      if (await isEmailBounced(adminSupabase, waitlist.id, sub.email)) continue;
      eligible.push({ id: sub.id, email: sub.email });
    }

    if (eligible.length === 0) {
      sendError = "No eligible recipients";
    }

    const from = resolveFromAddress(
      waitlist.sender_name,
      waitlist.product_name,
      waitlist.headline,
      "broadcast",
      waitlist.sending_domain
    );

    const productName =
      waitlist.product_name || waitlist.headline || waitlist.subdomain;
    const safeText = escapeHtml(text);

    const BATCH_SIZE = 100;

    for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
      const batch = eligible.slice(i, i + BATCH_SIZE);

      try {
        const emails = batch.map((sub) => {
          const unsubscribeUrl = generateUnsubscribeUrl(sub.id);
          const footerHtml = buildBroadcastEmailFooter(
            sub.id,
            waitlist.business_address
          );

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
                <p style="margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; color: #4b5563; white-space: pre-wrap;">${safeText}</p>
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

          return {
            from,
            to: sub.email,
            subject: `Update from ${productName}`,
            html,
            text,
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
            tags: [
              { name: "waitlist_id", value: waitlist.id },
              { name: "subscriber_id", value: sub.id },
            ],
          };
        });

        // 3.1e: transient rate-limit retries happen inside.
        const result = await sendBatchWithRetry(emails);

        if (result.error) {
          sendError = result.error.message ?? "Batch send failed";
          console.error("Batch send error:", result.error);
        } else {
          totalSent += batch.length;
        }
      } catch (err) {
        sendError = err instanceof Error ? err.message : "Batch send failed";
        console.error("Update batch send failed:", err);
      }
    }

    if (totalSent > 0) {
      await supabase
        .from("founder_updates")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", update.id);
    }
  } catch (err) {
    sendError = err instanceof Error ? err.message : "Email dispatch failed";
    console.error("Update email phase failed:", err);
  }

  return NextResponse.json(
    {
      id: update.id,
      emailSent: totalSent > 0,
      emailError: totalSent > 0 ? null : (sendError ?? "Email dispatch failed"),
    },
    { status: 201 }
  );
}

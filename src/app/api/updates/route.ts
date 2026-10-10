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
import {
  UPDATE_CTA_LABEL,
  buildEmailShell,
  derivePreheader,
} from "@/lib/email-template";

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

  // Story 19.4 M10: malformed JSON must not throw a raw SyntaxError — null
  // falls through to the existing body validation below (400 + string).
  const body = await request.json().catch(() => null);
  // Non-string bodies must 400 on validation, not crash into a TypeError 500.
  const text = (typeof body?.body === "string" ? body.body : "").trim();

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
    console.error("[API POST /updates] insert failed:", insertError.message);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  let totalSent = 0;
  let sendError: string | null = null;

  try {
    const { data: subscribers, error: subscribersError } = await supabase
      .from("subscribers")
      .select("id, email, unsubscribed_at")
      .eq("waitlist_id", waitlist.id);

    // D4 (investigate 2026-10-03): a failed read must NOT masquerade as
    // "No eligible recipients" — fail loud with the real cause. Caught by the
    // outer catch below, which sets sendError from this message.
    if (subscribersError) {
      console.error("Update subscriber fetch failed", subscribersError);
      throw new Error("Failed to load subscribers");
    }

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

          // Prompt #8 (2026-10-10): shared HTML-email shell (brand header,
          // hidden preheader, card layout) replaces the hand-rolled
          // template; CTA button links the public waitlist page where the
          // update also appears (founder decision 2026-10-10).
          const html = buildEmailShell({
            title: `Update from ${productName}`,
            preheader: derivePreheader(text),
            brandName: productName,
            bodyHtml: `<p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; color: #4b5563; white-space: pre-wrap;">${safeText}</p>`,
            cta: {
              url: `https://${waitlist.subdomain}.prewaitlist.com`,
              label: UPDATE_CTA_LABEL,
            },
            footerHtml,
          });

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

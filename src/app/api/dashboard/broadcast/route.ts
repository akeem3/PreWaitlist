import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveFromAddress,
  buildBroadcastEmailFooterWithUrl,
  sendBatchWithRetry,
} from "@/lib/email";
import {
  generateUnsubscribeUrl,
  hasUnsubscribeSecret,
} from "@/lib/unsubscribe";
import { requirePro } from "@/lib/tier-gating";
import { sanitizeEmailHtml } from "@/lib/sanitize";
import {
  BROADCAST_BODY_MAX,
  BROADCAST_SUBJECT_MAX,
} from "@/lib/broadcast-limits";
import {
  BROADCAST_CTA_LABEL,
  buildEmailShell,
  derivePreheader,
  htmlToText,
  validateCtaUrl,
} from "@/lib/email-template";

// Story 17.0 AC1 (B13): server-side length caps, shared with the compose
// client (Story 17.2). Implementation lives in the dependency-free
// `broadcast-limits` module so the Client Component can import it without
// pulling this route's server-only chain into the browser bundle.
export { BROADCAST_SUBJECT_MAX, BROADCAST_BODY_MAX };

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

  // Story 19.4 M19: malformed JSON must not throw a raw SyntaxError — null
  // falls through to the existing waitlist_id validation (400 + string).
  const body = await req.json().catch(() => null);
  const {
    subject,
    body: emailBody,
    segment,
    waitlist_id,
    cta_url,
  } = body ?? {};

  if (!waitlist_id) {
    return NextResponse.json(
      { error: "waitlist_id is required" },
      { status: 400 }
    );
  }

  const subjectText = typeof subject === "string" ? subject.trim() : "";
  const bodyText = typeof emailBody === "string" ? emailBody.trim() : "";

  if (!subjectText || !bodyText) {
    return NextResponse.json(
      { error: "Subject and body are required" },
      { status: 400 }
    );
  }

  if (
    subjectText.length > BROADCAST_SUBJECT_MAX ||
    bodyText.length > BROADCAST_BODY_MAX
  ) {
    return NextResponse.json(
      {
        error: `Subject must be ≤ ${BROADCAST_SUBJECT_MAX} characters and body ≤ ${BROADCAST_BODY_MAX} characters`,
      },
      { status: 400 }
    );
  }

  // Optional per-broadcast CTA link (Prompt #8, founder decision 2026-10-10).
  // Validated before any DB read — cheap check, and an invalid link must
  // 400 before we touch subscribers. Rejects non-http(s) schemes so a
  // crafted `javascript:` URL can never reach the rendered href.
  const ctaCheck = validateCtaUrl(cta_url);
  if (!ctaCheck.ok) {
    return NextResponse.json({ error: ctaCheck.error }, { status: 400 });
  }
  const ctaUrl = ctaCheck.url;

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

  // Filter out unsubscribed and bounced subscribers (Story 17.0 AC5/B12:
  // single batched bounced_emails query, not N+1 isEmailBounced calls).
  // Mirrors isEmailBounced() semantics: hard bounces suppress forever,
  // soft bounces only within 24h.
  const adminSupabase = createAdminClient();
  const eligible: { id: string; email: string; referral_code: string }[] = [];

  // Story 19.4 M21: fail closed — sending when the bounce-suppression read
  // failed would email hard-bounced addresses (deliverability + compliance).
  const { data: bouncedRows, error: bouncedError } = await adminSupabase
    .from("bounced_emails")
    .select("email, bounce_type, created_at")
    .eq("waitlist_id", waitlist.id);

  if (bouncedError) {
    console.error(
      "[API POST /broadcast] bounced_emails read failed:",
      bouncedError.message
    );
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  const softCutoff = Date.now() - 24 * 60 * 60 * 1000;
  const bouncedSet = new Set(
    (bouncedRows ?? [])
      .filter(
        (row) =>
          row.bounce_type === "hard" ||
          new Date(row.created_at).getTime() > softCutoff
      )
      .map((row) => row.email)
  );

  for (const sub of subscribers) {
    if (sub.unsubscribed_at) continue;
    if (bouncedSet.has(sub.email)) continue;
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

  // Story 17.0 AC4 (B14) fail-fast: a missing UNSUBSCRIBE_SECRET must fail
  // the request BEFORE any batch.send, not mid-chunk — probed without
  // generating a URL so no subscriber gets a double generateUnsubscribeUrl.
  if (!hasUnsubscribeSecret()) {
    console.error("Broadcast blocked: unsubscribe secret missing");
    return NextResponse.json(
      { error: "Email service misconfigured (unsubscribe secret)" },
      { status: 500 }
    );
  }

  // Story 17.0 AC3 (B9): per-chunk idempotency keys, unique per logical
  // send (UUID per request), ≤256 chars, 24h Resend window.
  const requestId = randomUUID();

  // Story 17.0 AC2 (B4): honest per-chunk outcome tracking.
  const errors: string[] = [];
  let totalSent = 0;
  let batchesAttempted = 0;

  // Story 17.5 AC1-AC3: sanitize founder HTML once (not per-recipient) —
  // same helper as the compose preview, so preview === send. Never
  // wholesale-escape (B8): intentional formatting survives.
  const safeBody = sanitizeEmailHtml(emailBody);

  // Prompt #8: HTML-email-grade shell (doctype/table/600px card/brand header/
  // hidden preheader/CTA) replaces the old bare <div>. Shared with the
  // compose preview via `email-template` so preview === send. Preheader +
  // plain-text part are derived from the body — no extra copy authored.
  const brandName =
    waitlist.product_name || waitlist.headline || waitlist.subdomain;
  const preheader = derivePreheader(bodyText);
  const plainText = htmlToText(bodyText);

  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const batch = eligible.slice(i, i + BATCH_SIZE);
    const chunkIndex = i / BATCH_SIZE;

    const emails = batch.map((sub) => {
      // Single unsubscribe generation per recipient, reused for header + footer.
      const unsubscribeUrl = generateUnsubscribeUrl(sub.id);
      const footer = buildBroadcastEmailFooterWithUrl(
        unsubscribeUrl,
        waitlist.business_address
      );

      const html = buildEmailShell({
        title: subjectText,
        preheader,
        brandName,
        bodyHtml: safeBody,
        cta: ctaUrl ? { url: ctaUrl, label: BROADCAST_CTA_LABEL } : null,
        footerHtml: footer,
      });

      return {
        from,
        to: [sub.email],
        subject,
        html,
        text: plainText,
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

    batchesAttempted += 1;
    // 3.1e: transient rate-limit retries happen inside (same chunk key).
    const result = await sendBatchWithRetry(emails, {
      idempotencyKey: `broadcast/${waitlist.id}/${requestId}/chunk-${chunkIndex}`,
    });

    if (result.error) {
      const message = result.error.message ?? "Batch failed";
      console.error("Batch send error:", result.error);
      errors.push(`Chunk ${chunkIndex}: ${message}`);
    } else {
      totalSent += batch.length;
    }
  }

  // Story 17.0 AC6 (B10 partial): never silently drop history.
  const { error: insertError } = await supabase.from("broadcasts").insert({
    waitlist_id: waitlist.id,
    subject,
    recipient_count: totalSent,
    sent_at: new Date().toISOString(),
  });
  if (insertError) {
    console.error("broadcasts insert failed:", insertError);
    errors.push(`History insert failed: ${insertError.message}`);
  }

  if (batchesAttempted > 0 && totalSent === 0) {
    return NextResponse.json(
      {
        ok: false,
        recipient_count: 0,
        errors: errors.length ? errors : ["All batches failed"],
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    recipient_count: totalSent,
    errors: errors.length ? errors : undefined,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { resend } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";

if (!process.env.RESEND_WEBHOOK_SECRET) {
  console.error(
    "RESEND_WEBHOOK_SECRET is not set — webhook signature verification will fail"
  );
}

const SUPPORTED_EVENT_TYPES = new Set([
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "complained",
]);

const EVENT_TYPE_MAP: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "bounced",
  "email.delivery_delayed": "delivered",
};

export async function POST(req: NextRequest) {
  const payload = await req.text();

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 401 }
    );
  }

  let event: Record<string, unknown>;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET!,
    }) as unknown as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const eventType = event.type as string;
  const mappedType = EVENT_TYPE_MAP[eventType];

  if (!mappedType || !SUPPORTED_EVENT_TYPES.has(mappedType)) {
    return NextResponse.json({ received: true });
  }

  const data = event.data as Record<string, unknown> | undefined;
  const to = data?.to as string[] | undefined;
  const email = to?.[0];
  if (!email) {
    return NextResponse.json({ received: true });
  }

  const createdAt = (event.created_at as string) || new Date().toISOString();

  // AC4/AC7: send-time targeting. Resend has no metadata field — tags are the
  // mechanism, and webhook payloads expose them as a key/value object.
  const tags = data?.tags as Record<string, string> | undefined;
  const legacyMeta = data?.metadata as Record<string, string> | undefined;
  const targetWaitlistId = tags?.waitlist_id ?? legacyMeta?.waitlist_id;
  const targetSubscriberId = tags?.subscriber_id ?? legacyMeta?.subscriber_id;

  after(async () => {
    try {
      const supabase = createAdminClient();

      // AC4: resolve every matching subscriber row, or only the send-time
      // target when tags are present. Never .limit(1).single() — that picks
      // an arbitrary waitlist when the same email exists on multiple.
      let matchQuery = supabase
        .from("subscribers")
        .select("id, waitlist_id")
        .eq("email", email);

      if (targetWaitlistId) {
        matchQuery = matchQuery.eq("waitlist_id", targetWaitlistId);
      }
      if (targetSubscriberId) {
        matchQuery = matchQuery.eq("id", targetSubscriberId);
      }

      const { data: matches, error: matchError } = await matchQuery;

      if (matchError) {
        console.error(
          `Webhook: subscriber lookup failed: ${matchError.message}`
        );
        return;
      }

      if (!matches || matches.length === 0) {
        console.warn(`Webhook: subscriber not found for ${email}`);
        return;
      }

      for (const subscriber of matches) {
        // AC5: cheap per-waitlist idempotency pre-check. The race window is
        // closed by email_events_svix_uidx (sql-writeups) — see 23505 below.
        const { data: existing } = await supabase
          .from("email_events")
          .select("id")
          .eq("waitlist_id", subscriber.waitlist_id)
          .filter("event_data->>'svix_id'", "eq", svixId)
          .limit(1);

        if (existing && existing.length > 0) {
          continue;
        }

        const { error: insertError } = await supabase
          .from("email_events")
          .insert({
            subscriber_id: subscriber.id,
            waitlist_id: subscriber.waitlist_id,
            event_type: mappedType,
            event_data: { ...data, svix_id: svixId },
            created_at: createdAt,
          });

        // AC5: unique-index race loser — the winning delivery already recorded
        // this event (and ran its side effects). Ack and move on.
        if (insertError) {
          if (insertError.code === "23505") {
            continue;
          }
          console.error(
            `Webhook: email_events insert failed: ${insertError.message}`
          );
          continue;
        }

        console.log(
          `Webhook: recorded ${mappedType} event for ${email} (svix: ${svixId})`
        );

        // AC6: side effects scoped to each resolved subscriber's waitlist row
        if (mappedType === "bounced" || mappedType === "complained") {
          const bounceType = determineBounceType(
            data as Record<string, unknown>
          );

          const { error: bounceError } = await supabase
            .from("bounced_emails")
            .insert({
              waitlist_id: subscriber.waitlist_id,
              email,
              email_type: "transactional",
              bounce_type: bounceType,
            });

          if (bounceError) {
            console.error(
              `Webhook: bounced_emails insert failed: ${bounceError.message}`
            );
          }
        }

        if (mappedType === "complained") {
          await supabase
            .from("subscribers")
            .update({ unsubscribed_at: createdAt })
            .eq("id", subscriber.id)
            .is("unsubscribed_at", null);
        }
      }
    } catch (err) {
      console.error("Webhook after() callback failed:", err);
    }
  });

  return NextResponse.json({ received: true });
}

function determineBounceType(data: Record<string, unknown>): "hard" | "soft" {
  // Complaints are always treated as hard bounces
  if ("complaint" in data || data.type === "complained") return "hard";

  // Resend's bounce payload: data.bounce.type = "Permanent" | "Transient" | "Undetermined"
  const bounce = data.bounce as { type?: string; subType?: string } | undefined;

  if (bounce?.type === "Permanent") return "hard";

  return "soft";
}

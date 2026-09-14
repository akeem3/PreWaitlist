import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { resend } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";

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
      { status: 400 }
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
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
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

  after(async () => {
    const supabase = createAdminClient();

    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("id, waitlist_id")
      .eq("email", email)
      .limit(1)
      .single();

    if (!subscriber) {
      console.warn(`Webhook: subscriber not found for ${email}`);
      return;
    }

    const { data: existing } = await supabase
      .from("email_events")
      .select("id")
      .eq("waitlist_id", subscriber.waitlist_id)
      .filter("event_data->>'svix_id'", "eq", svixId)
      .limit(1);

    if (existing && existing.length > 0) {
      return;
    }

    await supabase.from("email_events").insert({
      subscriber_id: subscriber.id,
      waitlist_id: subscriber.waitlist_id,
      event_type: mappedType,
      event_data: { ...data, svix_id: svixId },
      created_at: createdAt,
    });

    // Bounce/complain handling: insert into bounced_emails
    if (mappedType === "bounced" || mappedType === "complained") {
      const emailData = data as Record<string, unknown>;
      const bounceType = determineBounceType(emailData);

      await supabase.from("bounced_emails").insert({
        waitlist_id: subscriber.waitlist_id,
        email,
        email_type: "transactional",
        bounce_type: bounceType,
      });
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

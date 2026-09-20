import { NextResponse, type NextRequest } from "next/server";
import { Paddle, type EventEntity } from "@paddle/paddle-node-sdk";
import { createAdminClient } from "@/lib/supabase/admin";

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

const SUPPORTED_EVENTS = new Set([
  "subscription.created",
  "subscription.activated",
  "subscription.canceled",
  "subscription.past_due",
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("paddle-signature") ?? "";

  if (!process.env.PADDLE_WEBHOOK_SECRET) {
    console.error("PADDLE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: EventEntity;
  try {
    event = await paddle.webhooks.unmarshal(
      body,
      process.env.PADDLE_WEBHOOK_SECRET,
      signature
    );
  } catch (err) {
    console.error("Paddle webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!event.eventType || !SUPPORTED_EVENTS.has(event.eventType)) {
    return NextResponse.json({ received: true });
  }

  const data = event.data as {
    id: string;
    status: string;
    customData: { user_id?: string; waitlist_id?: string } | null;
  };

  const userId = data.customData?.user_id;
  if (!userId) {
    console.error(
      "Paddle webhook missing user_id in customData",
      event.eventType
    );
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  switch (event.eventType) {
    case "subscription.created":
    case "subscription.activated": {
      const { error } = await admin
        .from("founder_profiles")
        .update({
          tier: "pro",
          paddle_subscription_id: data.id,
        })
        .eq("id", userId);

      if (error) {
        console.error("Failed to update tier to pro", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      break;
    }

    case "subscription.canceled": {
      const { error } = await admin
        .from("founder_profiles")
        .update({
          tier: "free",
          paddle_subscription_id: null,
        })
        .eq("id", userId);

      if (error) {
        console.error("Failed to revert tier to free", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      break;
    }

    case "subscription.past_due": {
      break;
    }
  }

  return NextResponse.json({ received: true });
}

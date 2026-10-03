import { NextResponse, type NextRequest } from "next/server";
import { Paddle, type EventEntity } from "@paddle/paddle-node-sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { archiveSurplusWaitlists } from "@/lib/archive-surplus";

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

const SUPPORTED_EVENTS = new Set([
  "subscription.created",
  "subscription.activated",
  "subscription.updated",
  "subscription.canceled",
  "subscription.past_due",
  "transaction.completed",
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

  console.info("Paddle webhook received", {
    eventType: event.eventType,
    eventId: event.eventId,
    supported: SUPPORTED_EVENTS.has(event.eventType ?? ""),
  });

  if (!event.eventType || !SUPPORTED_EVENTS.has(event.eventType)) {
    return NextResponse.json({ received: true });
  }

  const data = event.data as {
    id: string;
    status: string;
    customerId: string;
    customData: { user_id?: string; waitlist_id?: string } | null;
    nextBilledAt?: string | null;
    scheduledChange?: {
      action: string;
      effectiveAt: string;
      resumeAt?: string | null;
    } | null;
  };

  const userId = data.customData?.user_id;
  if (!userId) {
    console.error("Paddle webhook missing user_id in customData", {
      eventType: event.eventType,
      eventId: event.eventId,
      dataId: data.id,
      customData: data.customData ?? null,
    });
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
          paddle_customer_id: data.customerId,
          paddle_subscription_status: data.status ?? "active",
          paddle_next_billed_at: data.nextBilledAt ?? null,
        })
        .eq("id", userId);

      if (error) {
        console.error("Failed to update tier to pro", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      console.info("Tier upgraded via subscription event", {
        userId,
        eventType: event.eventType,
        subscriptionId: data.id,
        customerId: data.customerId,
      });
      break;
    }

    case "transaction.completed": {
      const txData = event.data as {
        id: string;
        customerId: string;
        customData: { user_id?: string; waitlist_id?: string } | null;
        subscriptionId?: string | null;
      };
      const txUserId = txData.customData?.user_id;
      if (!txUserId) {
        console.error("Paddle transaction.completed missing user_id", {
          dataId: txData.id,
          customData: txData.customData ?? null,
        });
        return NextResponse.json({ received: true });
      }

      const { data: profile, error: profileError } = await admin
        .from("founder_profiles")
        .select("paddle_subscription_id, paddle_subscription_status")
        .eq("id", txUserId)
        .maybeSingle();

      if (profileError) {
        console.error("Failed to load profile for transaction guard", {
          userId: txUserId,
          error: profileError.message,
        });
        return NextResponse.json(
          { error: profileError.message },
          {
            status: 500,
          }
        );
      }

      // Out-of-order guard: a transaction for the SAME subscription that is
      // already canceled must not re-upgrade the founder (late/duplicate
      // delivery after subscription.canceled). A different subscription id is
      // a genuine re-subscribe and still upgrades.
      if (
        profile?.paddle_subscription_status === "canceled" &&
        txData.subscriptionId &&
        txData.subscriptionId === profile.paddle_subscription_id
      ) {
        console.info(
          "Ignoring transaction.completed for canceled subscription",
          {
            userId: txUserId,
            transactionId: txData.id,
            subscriptionId: txData.subscriptionId,
          }
        );
        return NextResponse.json({ received: true });
      }

      const txUpdate: Record<string, string | null> = {
        tier: "pro",
        paddle_customer_id: txData.customerId,
      };
      // Only write subscription id when present — never null out an id
      // already set by subscription.created if this event races first/without one.
      if (txData.subscriptionId) {
        txUpdate.paddle_subscription_id = txData.subscriptionId;
      }

      const { error } = await admin
        .from("founder_profiles")
        .update(txUpdate)
        .eq("id", txUserId);

      if (error) {
        console.error("Failed to update tier to pro via transaction", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      console.info("Tier upgraded via transaction.completed", {
        userId: txUserId,
        transactionId: txData.id,
        subscriptionId: txData.subscriptionId ?? null,
      });
      break;
    }

    case "subscription.updated": {
      // Paddle sends subscription.updated for portal actions immediately:
      // a portal cancel lands here with status "active" + a scheduled_change
      // {action:"cancel"} — the founder keeps Pro until effective_at, and
      // subscription.canceled fires at period end to do the downgrade.
      // Downgrade ONLY when this event is already the effective end-state.
      const sc = data.scheduledChange ?? null;
      const update: Record<string, unknown> = {
        paddle_subscription_status: data.status,
        scheduled_change: sc
          ? { action: sc.action, effective_at: sc.effectiveAt }
          : null,
        paddle_next_billed_at: data.nextBilledAt ?? null,
      };

      if (data.status === "canceled") {
        update.tier = "free";
        update.paddle_next_billed_at = null;
        // NOTE: paddle_subscription_id / paddle_customer_id are deliberately
        // preserved (not nulled) so invoice history stays visible post-cancel
        // (Paddle presents canceled subs the same way). Gating keys off
        // tier + paddle_subscription_status, never id presence.
      }

      const { error } = await admin
        .from("founder_profiles")
        .update(update)
        .eq("id", userId);

      if (error) {
        console.error("Failed to persist subscription.updated", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      console.info("Subscription updated persisted", {
        userId,
        status: data.status,
        scheduledChange: sc ?? null,
        nextBilledAt: data.nextBilledAt ?? null,
      });

      if (data.status === "canceled") {
        try {
          await archiveSurplusWaitlists(admin, userId);
        } catch (err) {
          console.error("Surplus archive failed after downgrade", err);
          return NextResponse.json(
            { error: "Failed to archive surplus waitlists" },
            { status: 500 }
          );
        }
      }
      break;
    }

    case "subscription.canceled": {
      const { error } = await admin
        .from("founder_profiles")
        .update({
          tier: "free",
          // Ids preserved for post-cancel invoice history (see note above).
          paddle_subscription_status: "canceled",
          scheduled_change: null,
          paddle_next_billed_at: null,
        })
        .eq("id", userId);

      if (error) {
        console.error("Failed to revert tier to free", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      console.info("Tier reverted via subscription.canceled", { userId });

      try {
        await archiveSurplusWaitlists(admin, userId);
      } catch (err) {
        console.error("Surplus archive failed after canceled event", err);
        return NextResponse.json(
          { error: "Failed to archive surplus waitlists" },
          { status: 500 }
        );
      }
      break;
    }

    case "subscription.past_due": {
      // 2.2: payment failed — KEEP Pro (dunning window) and surface status
      // so the billing page can show the "Update payment" portal banner.
      const { error } = await admin
        .from("founder_profiles")
        .update({ paddle_subscription_status: "past_due" })
        .eq("id", userId);

      if (error) {
        console.error("Failed to persist past_due status", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      console.info("Status set to past_due (tier kept pro)", { userId });
      break;
    }
  }

  return NextResponse.json({ received: true });
}

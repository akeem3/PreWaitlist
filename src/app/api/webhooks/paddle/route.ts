import { NextResponse, type NextRequest } from "next/server";
import { Paddle, type EventEntity } from "@paddle/paddle-node-sdk";
import { createAdminClient } from "@/lib/supabase/admin";

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

/**
 * 2.5 surplus policy (founder decision 2026-09-29): when a founder downgrades
 * to Free with more than one active waitlist, all but the NEWEST ACTIVE one
 * are archived — reusing the existing `is_archived` → `/gone` public-page
 * guard, so surplus lists stop accepting signups while staying fully
 * recoverable via unarchive. Manual archive choices are preserved (we only
 * ever touch currently-active rows), and re-upgrading never auto-unarchives
 * (archive state stays founder-controlled).
 *
 * Throws on failure so the webhook 500s and Paddle retries the whole event —
 * the tier update is idempotent, the archive is not otherwise recoverable.
 */
async function archiveSurplusWaitlists(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<void> {
  const { data: lists, error } = await admin
    .from("waitlists")
    .select("id, is_archived, created_at")
    .eq("founder_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Surplus lookup failed: ${error.message}`);
  }

  const active = (lists ?? []).filter((l) => !l.is_archived);
  if (active.length <= 1) return;

  const toArchive = active.slice(1).map((l) => l.id);
  const { error: archiveError } = await admin
    .from("waitlists")
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
    })
    .in("id", toArchive);

  if (archiveError) {
    throw new Error(`Surplus archive failed: ${archiveError.message}`);
  }
  console.info("Surplus waitlists archived on downgrade", {
    userId,
    archived: toArchive.length,
    kept: active[0].id,
  });
}

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
        update.paddle_subscription_id = null;
        update.paddle_customer_id = null;
        update.paddle_next_billed_at = null;
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
          paddle_subscription_id: null,
          paddle_customer_id: null,
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

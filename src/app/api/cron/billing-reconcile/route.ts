import { NextResponse } from "next/server";
import { Paddle } from "@paddle/paddle-node-sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { archiveSurplusWaitlists } from "@/lib/archive-surplus";

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

/**
 * Daily reconciliation (defense-in-depth, 2026-10-03): the Paddle webhook is
 * the primary tier state machine; this cron catches any event it missed so a
 * founder can never keep Pro after their subscription ended (or stay free
 * after re-subscribing). Mirror of `subscription.canceled` / `created`
 * semantics — see src/app/api/webhooks/paddle/route.ts.
 *
 * Safety rules:
 * - Downgrade ONLY on an API-confirmed status of "canceled" — never on an
 *   API error, timeout, or deleted-subscription exception.
 * - Pro rows keep Pro on active/trialing/past_due/paused (dunning keeps Pro,
 *   matching the webhook's past_due handler).
 * - Free rows with a stored subscription id are re-checked for missed
 *   upgrade events (canceled rows are a no-op; live ones heal to Pro).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const proResult = await admin
    .from("founder_profiles")
    .select("id, tier, paddle_subscription_id, paddle_subscription_status")
    .eq("tier", "pro")
    .not("paddle_subscription_id", "is", null);

  const freeResult = await admin
    .from("founder_profiles")
    .select("id, tier, paddle_subscription_id, paddle_subscription_status")
    .eq("tier", "free")
    .not("paddle_subscription_id", "is", null);

  if (proResult.error || freeResult.error) {
    const err = proResult.error ?? freeResult.error;
    console.error("Billing reconcile profile lookup failed", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }

  const rows = [...(proResult.data ?? []), ...(freeResult.data ?? [])] as {
    id: string;
    tier: string;
    paddle_subscription_id: string;
    paddle_subscription_status: string | null;
  }[];

  const summary = {
    checked: 0,
    downgraded: 0,
    upgraded: 0,
    healed: 0,
    skipped: 0,
    errors: 0,
  };

  for (const row of rows) {
    summary.checked += 1;

    let live: { status: string };
    try {
      live = await paddle.subscriptions.get(row.paddle_subscription_id);
    } catch (err) {
      // Deleted/unknown subscription or API failure — never a downgrade
      // trigger. Logged for observability; retried on the next cron run.
      summary.errors += 1;
      console.error("Billing reconcile: Paddle lookup failed", {
        userId: row.id,
        subscriptionId: row.paddle_subscription_id,
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    try {
      if (live.status === "canceled") {
        if (row.tier !== "free") {
          const { error } = await admin
            .from("founder_profiles")
            .update({
              tier: "free",
              paddle_subscription_status: "canceled",
              scheduled_change: null,
              paddle_next_billed_at: null,
            })
            .eq("id", row.id);

          if (error) {
            summary.errors += 1;
            console.error("Billing reconcile: downgrade failed", {
              userId: row.id,
              error: error.message,
            });
            continue;
          }

          summary.downgraded += 1;
          console.info("Billing reconcile: downgraded to free", {
            userId: row.id,
            subscriptionId: row.paddle_subscription_id,
          });

          // Same 2.5 surplus policy as the webhook path.
          try {
            await archiveSurplusWaitlists(admin, row.id);
          } catch (err) {
            summary.errors += 1;
            console.error(
              "Billing reconcile: surplus archive failed after downgrade",
              {
                userId: row.id,
                error: err instanceof Error ? err.message : err,
              }
            );
          }
        } else {
          summary.skipped += 1;
        }
        continue;
      }

      // active | trialing | past_due | paused → must be Pro.
      if (row.tier !== "pro") {
        const { error } = await admin
          .from("founder_profiles")
          .update({
            tier: "pro",
            paddle_subscription_status: live.status,
          })
          .eq("id", row.id);

        if (error) {
          summary.errors += 1;
          console.error("Billing reconcile: upgrade failed", {
            userId: row.id,
            error: error.message,
          });
          continue;
        }

        summary.upgraded += 1;
        console.info("Billing reconcile: healed missed upgrade to pro", {
          userId: row.id,
          subscriptionId: row.paddle_subscription_id,
          status: live.status,
        });
        continue;
      }

      if (row.paddle_subscription_status !== live.status) {
        const { error } = await admin
          .from("founder_profiles")
          .update({ paddle_subscription_status: live.status })
          .eq("id", row.id);

        if (error) {
          summary.errors += 1;
          console.error("Billing reconcile: status sync failed", {
            userId: row.id,
            error: error.message,
          });
          continue;
        }

        summary.healed += 1;
        console.info("Billing reconcile: synced subscription status", {
          userId: row.id,
          from: row.paddle_subscription_status,
          to: live.status,
        });
        continue;
      }

      summary.skipped += 1;
    } catch (err) {
      summary.errors += 1;
      console.error("Billing reconcile: unexpected failure", {
        userId: row.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.info("Billing reconcile finished", summary);
  return NextResponse.json(summary);
}

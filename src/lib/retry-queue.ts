import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import type { Stream } from "@/lib/from-address";

/**
 * 3.1 daily-quota parking. Resend `daily_quota_exceeded` clears at midnight
 * UTC, so the failed send is parked in `email_retry_queue` (SQL:
 * `docs/stories/sql-writeups/revenue-phase3-email-retry-queue.sql`,
 * founder-run) and a cron worker re-sends it. `monthly_quota` is never
 * parked (dead-lettered by the caller); `rate_limit` retries inline in
 * `sendEmail`. Stale-email risk is capped ~24h by construction.
 */

export interface EnqueueRow {
  waitlist_id: string;
  subscriber_id?: string | null;
  to_email: string;
  subject: string;
  html: string;
  text_payload?: string | null;
  stream?: string;
  sender_name?: string | null;
  product_name?: string | null;
  headline?: string | null;
  sending_domain?: string | null;
  idempotency_key: string;
  email_type: string;
  not_before?: string;
}

interface QueueRow extends EnqueueRow {
  id: string;
  attempts: number;
  max_attempts: number;
}

export function nextMidnightUtc(from: Date = new Date()): string {
  const d = new Date(from.getTime());
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

/** Never throws — a parking failure must not break the signup that triggered it. */
export async function enqueueEmailRetry(
  supabase: SupabaseClient,
  row: EnqueueRow
): Promise<void> {
  const { error } = await supabase.from("email_retry_queue").insert({
    waitlist_id: row.waitlist_id,
    subscriber_id: row.subscriber_id ?? null,
    to_email: row.to_email,
    subject: row.subject,
    html: row.html,
    text_payload: row.text_payload ?? null,
    stream: row.stream ?? "transactional",
    sender_name: row.sender_name ?? null,
    product_name: row.product_name ?? null,
    headline: row.headline ?? null,
    sending_domain: row.sending_domain ?? null,
    idempotency_key: row.idempotency_key,
    email_type: row.email_type,
    not_before: row.not_before ?? nextMidnightUtc(),
  });
  if (error) {
    console.error("[retry-queue] enqueue failed:", error.message);
  }
}

async function deadLetter(
  supabase: SupabaseClient,
  row: QueueRow,
  error: string,
  errorName?: string
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("email_retry_queue")
    .delete()
    .eq("id", row.id);
  if (deleteError) {
    console.error(
      "[retry-queue] dead-letter delete failed:",
      deleteError.message
    );
  }

  const event: Record<string, unknown> = {
    waitlist_id: row.waitlist_id,
    event_type: "failed",
    event_data: {
      type: row.email_type,
      error,
      error_name: errorName ?? null,
      retried: row.attempts > 0,
    },
    created_at: new Date().toISOString(),
  };
  if (row.subscriber_id) {
    event.subscriber_id = row.subscriber_id;
  }
  const { error: logError } = await supabase.from("email_events").insert(event);
  if (logError) {
    console.error("[retry-queue] dead-letter log failed:", logError.message);
  }

  // Quota dead-letters warn the founder (once/day via the warned flag).
  if (errorName === "daily_quota_exceeded") {
    await maybeWarnFounderQuota(supabase, row.waitlist_id, "daily");
  } else if (errorName === "monthly_quota_exceeded") {
    await maybeWarnFounderQuota(supabase, row.waitlist_id, "monthly");
  }
}

const QUOTA_ERROR_NAMES = [
  "daily_quota_exceeded",
  "monthly_quota_exceeded",
  "rate_limit_exceeded",
];

function startOfTodayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * 3.1d: best-effort founder warning, at most once per UTC day per waitlist.
 * Copy approved verbatim 2026-09-29 (see revenue plan copy gaps). Never
 * throws. The email rides the same Resend account that just failed, so it
 * can itself 429 — the dashboard banner (email-health API) is the reliable
 * leg, and the warned flag is marked regardless of send outcome.
 */
export async function maybeWarnFounderQuota(
  supabase: SupabaseClient,
  waitlistId: string,
  kind: "daily" | "monthly"
): Promise<void> {
  try {
    const today = startOfTodayUtc();
    const { data: rows } = await supabase
      .from("email_events")
      .select("id, event_data")
      .eq("waitlist_id", waitlistId)
      .in("event_type", ["failed", "delivery_delayed"])
      .gte("created_at", today);

    const quotaRows = (
      (rows ?? []) as {
        id: string;
        event_data?: { error_name?: string; warned?: boolean } | null;
      }[]
    ).filter((r) => QUOTA_ERROR_NAMES.includes(r.event_data?.error_name ?? ""));
    if (quotaRows.length === 0) return;
    if (quotaRows.some((r) => r.event_data?.warned === true)) return;

    const { data: wl } = await supabase
      .from("waitlists")
      .select("founder_id")
      .eq("id", waitlistId)
      .single();
    const founderId = (wl as unknown as { founder_id?: string } | null)
      ?.founder_id;
    if (!founderId) return;

    const { data: authUser } = await supabase.auth.admin.getUserById(founderId);
    const founderEmail = authUser?.user?.email;
    if (!founderEmail) return;

    const kindLabel = kind === "daily" ? "daily" : "monthly";
    await sendEmail({
      to: founderEmail,
      subject: "Your waitlist emails hit the Resend quota",
      html: `<p style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 24px; color: #1a1a1a;">Some of your PreWaitlist emails failed to send (${kindLabel} quota). Daily-quota emails retry automatically after midnight UTC. Monthly-quota failures need a Resend plan upgrade — reply to this email if you need help.</p>`,
      text: `Some of your PreWaitlist emails failed to send (${kindLabel} quota). Daily-quota emails retry automatically after midnight UTC. Monthly-quota failures need a Resend plan upgrade — reply to this email if you need help.`,
      stream: "transactional",
      idempotencyKey: `quota-warning/${waitlistId}/${today.slice(0, 10)}`,
      waitlistId,
    });

    for (const r of quotaRows) {
      const { error: markError } = await supabase
        .from("email_events")
        .update({ event_data: { ...(r.event_data ?? {}), warned: true } })
        .eq("id", r.id);
      if (markError) {
        console.error(
          "[retry-queue] warn-flag update failed:",
          markError.message
        );
      }
    }
  } catch (err) {
    console.error("[retry-queue] founder quota warning failed:", err);
  }
}

export async function drainEmailRetryQueue(
  supabase: SupabaseClient,
  limit = 100
): Promise<{
  processed: number;
  sent: number;
  reparked: number;
  deadLettered: number;
}> {
  const now = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from("email_retry_queue")
    .select("*")
    .lte("not_before", now)
    .order("not_before", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[retry-queue] drain select failed:", error.message);
    return { processed: 0, sent: 0, reparked: 0, deadLettered: 0 };
  }

  let sent = 0;
  let reparked = 0;
  let deadLettered = 0;
  const due = ((rows ?? []) as QueueRow[]).filter(
    (r) => r.attempts < r.max_attempts
  );

  for (const row of due) {
    const result = await sendEmail({
      to: row.to_email,
      subject: row.subject,
      html: row.html,
      text: row.text_payload ?? undefined,
      stream: (row.stream ?? "transactional") as Stream,
      senderName: row.sender_name ?? null,
      productName: row.product_name ?? null,
      headline: row.headline ?? null,
      sendingDomain: row.sending_domain ?? null,
      idempotencyKey: row.idempotency_key,
      subscriberId: row.subscriber_id ?? undefined,
      waitlistId: row.waitlist_id,
    });

    if (result.ok) {
      const { error: deleteError } = await supabase
        .from("email_retry_queue")
        .delete()
        .eq("id", row.id);
      if (deleteError) {
        console.error("[retry-queue] sent-delete failed:", deleteError.message);
      }
      if (row.subscriber_id) {
        await supabase.from("email_events").insert({
          subscriber_id: row.subscriber_id,
          waitlist_id: row.waitlist_id,
          event_type: "sent",
          event_data: {
            email_id: result.id,
            type: row.email_type,
            retried: true,
          },
          created_at: new Date().toISOString(),
        });
      }
      sent++;
    } else if (result.errorKind === "daily_quota") {
      const attempts = row.attempts + 1;
      if (attempts >= row.max_attempts) {
        await deadLetter(
          supabase,
          { ...row, attempts },
          result.error ?? "daily quota still exceeded",
          result.errorName
        );
        deadLettered++;
      } else {
        const { error: parkError } = await supabase
          .from("email_retry_queue")
          .update({ attempts, not_before: nextMidnightUtc() })
          .eq("id", row.id);
        if (parkError) {
          console.error("[retry-queue] re-park failed:", parkError.message);
        }
        reparked++;
      }
    } else {
      await deadLetter(
        supabase,
        row,
        result.error ?? "send failed",
        result.errorName
      );
      deadLettered++;
    }
  }

  return { processed: due.length, sent, reparked, deadLettered };
}

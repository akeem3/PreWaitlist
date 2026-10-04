import type { createAdminClient } from "@/lib/supabase/admin";

/**
 * 2.5 surplus policy (founder decision 2026-09-29): when a founder downgrades
 * to Free with more than one active waitlist, all but the NEWEST ACTIVE one
 * are archived — reusing the existing `is_archived` → `/gone` public-page
 * guard, so surplus lists stop accepting signups while staying fully
 * recoverable via unarchive. Manual archive choices are preserved (we only
 * ever touch currently-active rows), and re-upgrading never auto-unarchives
 * (archive state stays founder-controlled).
 *
 * Shared by the Paddle webhook (event-driven downgrade) and the daily
 * billing-reconcile cron (missed-webhook fallback).
 *
 * Throws on failure so callers can fail the webhook/cron run — the tier
 * update is idempotent, the archive is not otherwise recoverable.
 */
export async function archiveSurplusWaitlists(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<void> {
  const { data: lists, error } = await admin
    .from("waitlists")
    .select("id, is_archived, created_at")
    .eq("founder_id", userId)
    .order("created_at", { ascending: false })
    // Tiebreaker: identical created_at must still pick a deterministic
    // "newest" across Paddle retries.
    .order("id", { ascending: false });

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

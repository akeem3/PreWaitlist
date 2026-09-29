-- Revenue Lifecycle Fix Plan — Phase 2 follow-up (audit I2/I3)
-- ============================================================
-- FOUNDER GATE: Run this file in Supabase Dashboard → SQL Editor
-- BEFORE deploying the archived-aware counts (profile waitlistCount +
-- POST free-slot gate). The application code filters
-- `.eq("is_archived", false)`; rows created before the 12.2.1 migration
-- carry is_archived = NULL, and `= false` does NOT match NULL — without
-- this backfill, legacy lists vanish from the count (a free founder with
-- one legacy list could create a second free list).
--
-- Idempotent: safe to re-run — only touches NULL rows.
-- ============================================================

-- Backfill: pre-12.2.1 rows predate the archive feature, so NULL = active.
UPDATE public.waitlists
SET is_archived = false
WHERE is_archived IS NULL;

-- ------------------------------------------------------------
-- VERIFICATION PROBE (run after the UPDATE, expect 0):
-- ------------------------------------------------------------
-- SELECT COUNT(*) AS null_archived_rows
-- FROM public.waitlists
-- WHERE is_archived IS NULL;

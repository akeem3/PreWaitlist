-- Story 16.6: position_boost schema migration
-- ============================================================
-- FOUNDER GATE (AC5): Run this file in Supabase Dashboard → SQL Editor
-- BEFORE deploying Story 16.7 application code. Story 16.7 writes
-- subscribers.position_boost; without this migration that write fails
-- with PGRST204 (unknown column). Also run it locally before testing 16.7.
--
-- Idempotent (AC4): safe to re-run — ADD COLUMN IF NOT EXISTS +
-- CREATE OR REPLACE FUNCTION.
--
-- Pre-flight (story Risk #3): if you suspect the live function body has
-- drifted from docs/stories/sql-writeups/epic12-position-recalculation.sql,
-- compare first:  select prosrc from pg_proc
--                 where proname = 'recalculate_positions';
-- This file re-creates the epic12 body verbatim plus the new boost key.
-- ============================================================

-- ------------------------------------------------------------
-- AC1(a): durable skip-the-line flag
-- ------------------------------------------------------------
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS position_boost boolean NOT NULL DEFAULT false;

-- AC1(b): backfill choice = NONE.
-- Historical `position = 1` rows are ordinary rank-1 subscribers, not
-- proven skip-the-line winners — boosting them would promote the wrong
-- people. Only future milestone awards (Story 16.7) set the flag.
-- Optional precise backfill (uncomment only if product wants historical
-- skip-the-line entries honored):
-- UPDATE public.subscribers s
-- SET position_boost = true
-- WHERE s.milestones_earned IS NOT NULL
--   AND EXISTS (
--     SELECT 1 FROM jsonb_array_elements(s.milestones_earned) AS e
--     WHERE lower(coalesce(e.value->>'label', '')) LIKE '%skip the line%'
--   );

-- AC1(c): no index (default) — full scans of ≤500 rows per waitlist
-- (product cap) do not benefit from a boolean index.

-- ------------------------------------------------------------
-- AC2 + AC3: RPC honors position_boost while keeping the exact
-- contract used by src/lib/positions.ts (PositionUpdate[]).
--
-- Body = epic12-position-recalculation.sql verbatim, with ONE change:
-- `s.position_boost DESC` added as the LEADING ORDER BY key in the
-- `ranked` CTE. Referral ordering stays the live-count CTE expression
-- `COALESCE(rc.count, 0) DESC` (there is no subscribers.referral_count
-- column — count is computed from referrer_id per waitlist), then
-- s.created_at ASC, matching AC2's referral_count DESC → created_at ASC.
--
-- Boolean ordering (Postgres): false < true, so DESC places
-- `position_boost = true` FIRST — boosted subscribers rank above
-- non-boosted peers regardless of equal-or-fewer referrals; ties within
-- each group follow referral count, then signup date.
--
-- Unchanged: SECURITY DEFINER, p_waitlist_id uuid argument,
-- RETURNS TABLE(subscriber_id uuid, old_position integer,
-- new_position integer, spots_moved integer), SET search_path = ''.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_positions(p_waitlist_id uuid)
RETURNS TABLE(subscriber_id uuid, old_position integer, new_position integer, spots_moved integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH current_positions AS (
    SELECT s.id, s.position AS old_pos
    FROM public.subscribers s
    WHERE s.waitlist_id = p_waitlist_id
  ),
  referral_counts AS (
    SELECT s.referrer_id AS referrer_id, COUNT(*) AS count
    FROM public.subscribers s
    WHERE s.waitlist_id = p_waitlist_id AND s.referrer_id IS NOT NULL
    GROUP BY s.referrer_id
  ),
  ranked AS (
    SELECT
      s.id,
      cp.old_pos,
      ROW_NUMBER() OVER (
        ORDER BY
          s.position_boost DESC,
          COALESCE(rc.count, 0) DESC,
          s.created_at ASC
      )::integer AS new_pos
    FROM public.subscribers s
    LEFT JOIN referral_counts rc ON rc.referrer_id = s.id
    LEFT JOIN current_positions cp ON cp.id = s.id
    WHERE s.waitlist_id = p_waitlist_id
  )
  UPDATE public.subscribers sub
  SET position = ranked.new_pos
  FROM ranked
  WHERE sub.id = ranked.id
  RETURNING
    sub.id,
    COALESCE(ranked.old_pos, 0),
    ranked.new_pos,
    COALESCE(ranked.old_pos, 0) - ranked.new_pos;
END;
$$;

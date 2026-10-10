-- Revenue Lifecycle Fix Plan — Phase 6: subscriber protections + atomic cap
-- Run in Supabase SQL Editor (founder-run gate).
--
-- Safe to run ANY TIME (before or after the code deploy):
--   * With the old code, the new increment function behaves identically
--     (p_cap defaults to NULL = uncapped) — it just returns the new count
--     instead of void, which the old route ignores.
--   * With the new code, a legacy database (this file not yet run) logs a
--     claim error and falls back to the old post-insert increment.
-- HOW TO RUN: paste and run the whole file at once. DDL (§§1–3) runs first
-- and the verification probes (§4) are plain SELECTs with no transaction
-- commands, so nothing can roll back the DDL. (2026-10-09: removed bare
-- BEGIN/ROLLBACK wrappers that wiped the DDL when the file ran as one
-- implicit transaction — every prior full-file run "succeeded" yet persisted
-- nothing for exactly this reason.)
--
-- Sections:
--   1. increment_subscriber_count(p_waitlist_id, p_cap) — atomic claim
--   2. decrement_subscriber_count(p_waitlist_id) — claim release
--   3. email_normalized generated column + case-insensitive unique index

-- ============================================================
-- 1. Atomic cap-aware increment (replaces the 1-arg void fn)
-- ============================================================

-- Drop BOTH possible old signatures first: keeping an old overload would
-- make single-arg calls ambiguous (PostgREST PGRST203) once the new
-- default-arg function exists. IF EXISTS keeps re-runs idempotent.
DROP FUNCTION IF EXISTS increment_subscriber_count(uuid, integer);
DROP FUNCTION IF EXISTS increment_subscriber_count(uuid);

CREATE FUNCTION increment_subscriber_count(
  p_waitlist_id uuid,
  p_cap integer DEFAULT NULL
) RETURNS integer AS $$
  DECLARE
    new_count integer;
  BEGIN
    UPDATE waitlists
    SET subscriber_count = subscriber_count + 1
    WHERE id = p_waitlist_id
      AND (p_cap IS NULL OR subscriber_count < p_cap)
    RETURNING subscriber_count INTO new_count;

    -- NULL = no slot (cap reached, or waitlist missing).
    -- Caller treats NULL as "capped" and rejects the signup.
    RETURN new_count;
  END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. Claim release (signup insert failed after a successful claim)
-- ============================================================

CREATE OR REPLACE FUNCTION decrement_subscriber_count(p_waitlist_id uuid)
RETURNS void AS $$
  UPDATE waitlists
  SET subscriber_count = GREATEST(subscriber_count - 1, 0)
  WHERE id = p_waitlist_id;
$$ LANGUAGE sql;

-- ============================================================
-- 3. email_normalized — case-insensitive per-waitlist uniqueness
-- ============================================================

-- STORED generated column: lower(email). The API already lowercases input;
-- this makes the invariant explicit and indexable.
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS email_normalized text
  GENERATED ALWAYS AS (lower(email)) STORED;

-- PROBE (run manually first if in doubt) — must return 0 rows before the
-- unique index can be created:
--   SELECT waitlist_id, lower(email) AS email, count(*), array_agg(id)
--   FROM subscribers
--   GROUP BY 1, 2
--   HAVING count(*) > 1;
-- If it returns rows: keep the earliest subscriber per group (lowest
-- position / created_at), remove the rest, then re-run this file.

CREATE UNIQUE INDEX IF NOT EXISTS subscribers_waitlist_email_normalized_idx
  ON subscribers (waitlist_id, email_normalized);

-- Note: the pre-existing case-sensitive index subscribers_waitlist_email_idx
-- stays as-is; both constraint names contain "email", which the API uses to
-- distinguish duplicate-email 23505s from referral_code collisions.

-- ============================================================
-- Verification probes
-- ============================================================

-- 1) Functions exist with the expected signatures:
--    expect: decrement_subscriber_count(uuid)
--            increment_subscriber_count(uuid, integer)
SELECT p.oid::regprocedure AS fn
FROM pg_proc p
WHERE p.proname IN ('increment_subscriber_count', 'decrement_subscriber_count')
ORDER BY 1;

-- 2) Missing-waitlist call returns NULL (read-only probe: the call updates
--    zero rows, so no transaction wrapper is needed here):
SELECT increment_subscriber_count(
  '00000000-0000-0000-0000-000000000000'::uuid,
  500
);

-- 3) Cap behavior on a real waitlist (real writes — uncomment and run as a
--    SEPARATE paste together with its BEGIN/ROLLBACK, never with the DDL):
--    Replace <waitlist-id> with one of yours.
-- BEGIN;
-- UPDATE waitlists SET subscriber_count = 499 WHERE id = '<waitlist-id>';
-- SELECT increment_subscriber_count('<waitlist-id>', 500);  -- expect 500
-- SELECT increment_subscriber_count('<waitlist-id>', 500);  -- expect NULL (capped)
-- SELECT decrement_subscriber_count('<waitlist-id>');       -- expect count back to 500
-- ROLLBACK;

-- 4) Column + index exist:
SELECT column_name, generation_expression
FROM information_schema.columns
WHERE table_name = 'subscribers' AND column_name = 'email_normalized';

SELECT indexname
FROM pg_indexes
WHERE indexname = 'subscribers_waitlist_email_normalized_idx';

-- Revenue Lifecycle Fix Plan — Phase 2: billing correctness
-- ============================================================
-- FOUNDER GATE: Run this file in Supabase Dashboard → SQL Editor
-- BEFORE deploying Phase 2 application code (Stories 2.1/2.2/2.4).
-- The webhook writes scheduled_change / paddle_subscription_status /
-- paddle_next_billed_at; the profile API reads them. Without this
-- migration those writes fail with PGRST204 (unknown column).
-- The profile GET degrades gracefully pre-migration (falls back to
-- tier-only select), so running it any time before deploy is safe.
--
-- Idempotent: safe to re-run — ADD COLUMN IF NOT EXISTS.
-- ============================================================

-- 2.1: scheduled cancel/pause visibility (Paddle subscription.updated)
-- Shape written by the webhook: { "action": "cancel"|"pause"|"resume",
-- "effective_at": "<ISO 8601>" } — null when nothing is scheduled.
ALTER TABLE public.founder_profiles
  ADD COLUMN IF NOT EXISTS scheduled_change jsonb;

-- 2.2: subscription status for dunning banners
-- ('active' | 'past_due' | 'paused' | 'trialing' | 'canceled') — null until
-- the first subscription event lands.
ALTER TABLE public.founder_profiles
  ADD COLUMN IF NOT EXISTS paddle_subscription_status text;

-- 2.4: next billing date for the "renews on" line
ALTER TABLE public.founder_profiles
  ADD COLUMN IF NOT EXISTS paddle_next_billed_at timestamptz;

-- ------------------------------------------------------------
-- Verification probe (expect 3 rows):
-- ------------------------------------------------------------
-- SELECT column_name, data_type
--   FROM information_schema.columns
--  WHERE table_name = 'founder_profiles'
--    AND column_name IN ('scheduled_change',
--                        'paddle_subscription_status',
--                        'paddle_next_billed_at');

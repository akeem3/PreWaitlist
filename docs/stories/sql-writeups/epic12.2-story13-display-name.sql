-- Story 12.2.13: Add display_name column to subscribers table
-- Idempotent: safe to run multiple times

ALTER TABLE public.subscribers
ADD COLUMN IF NOT EXISTS display_name text;

-- Verify: This query should return 1 row with column_name = 'display_name'
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'subscribers' AND column_name = 'display_name';

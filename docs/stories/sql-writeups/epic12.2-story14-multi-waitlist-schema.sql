-- Story 12.2.14 — Multi-Waitlist Schema Migration
-- Drop the unique index on waitlists(founder_id) to allow multiple waitlists per founder.
-- The unique constraint on waitlists(subdomain) is untouched.
-- RLS policies use founder_id = auth.uid() row-level filters, not the index.
-- Idempotent: safe to run multiple times.

-- 1. Drop the unique index if it exists
DROP INDEX IF EXISTS public.waitlists_founder_id_idx;

-- 2. Create a non-unique B-tree index on founder_id (fast lookups, multiple rows allowed)
CREATE INDEX IF NOT EXISTS waitlists_founder_id_idx ON public.waitlists(founder_id);

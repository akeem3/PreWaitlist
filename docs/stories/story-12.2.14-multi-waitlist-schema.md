# Story 12.2.14 — Schema Migration for Multi-Waitlist

**Epic:** 12.2 — Gap Fixes
**Status:** ready
**Depends on:** —
**Design Refs:** — (no UI)

## Story

As the system, I need the database schema updated to support multiple waitlists per founder so that Pro-tier founders can manage more than one waitlist from a single account.

## Acceptance Criteria (EARS)

- AC1: The unique index `waitlists_founder_id_idx` on `waitlists(founder_id)` shall be dropped and replaced with a non-unique B-tree index on `founder_id`.
- AC2: The unique constraint on `waitlists(subdomain)` shall remain unchanged — subdomains must still be globally unique.
- AC3: All existing RLS policies on `waitlists` shall continue to function correctly — they use `founder_id = auth.uid()` row-level filters, not the index.
- AC4: The migration SQL shall be idempotent (safe to run multiple times without error).
- AC5: All existing rows shall be unaffected — no data loss, no column changes.
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC5) SQL migration — drop unique index, create regular index · T2 (AC6) Lint + build

## Out of Scope

API route changes (Story 12.2.15), UI changes (Story 12.2.16), tier enforcement (Story 12.2.15).

## Implementation Details

### T1: SQL migration

Create a new SQL file at `docs/stories/sql-writeups/epic12.2-story14-multi-waitlist-schema.sql`:

```sql
-- Story 12.2.14: Remove single-waitlist constraint
-- Idempotent: safe to run multiple times

-- Step 1: Drop the unique index if it exists
DROP INDEX IF EXISTS public.waitlists_founder_id_idx;

-- Step 2: Create a non-unique index (allows multiple waitlists per founder)
CREATE INDEX IF NOT EXISTS waitlists_founder_id_idx ON public.waitlists(founder_id);

-- Verify: This query should return 1 row with indisunique = false
-- SELECT indexdef FROM pg_indexes WHERE tablename = 'waitlists' AND indexname = 'waitlists_founder_id_idx';
```

**What this does:**

- `DROP INDEX IF EXISTS` removes the unique constraint that prevented multiple waitlists per founder
- `CREATE INDEX IF NOT EXISTS` creates a regular B-tree index for query performance
- The `subdomain` UNIQUE constraint is untouched — subdomains remain globally unique
- RLS policies (`founder_id = auth.uid()`) are row-level filters, not index-dependent

**Execute in Supabase Dashboard:**

1. Go to SQL Editor
2. Paste the SQL above
3. Click "Run"
4. Verify with: `SELECT indexdef FROM pg_indexes WHERE tablename = 'waitlists' AND indexname = 'waitlists_founder_id_idx';`
5. Expected output: `CREATE INDEX waitlists_founder_id_idx ON public.waitlists USING btree (founder_id)` (no UNIQUE)

### T2: Lint + build

Run `pnpm lint` and `pnpm build` to confirm no regressions.

## Verification

1. SQL executes without error in Supabase SQL Editor
2. `pg_indexes` query shows non-unique index on `founder_id`
3. Existing waitlists are unchanged (query `SELECT * FROM waitlists` — all rows intact)
4. RLS still works: founder can only see own waitlists
5. `pnpm lint` and `pnpm build` pass with zero errors

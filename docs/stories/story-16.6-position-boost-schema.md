# Story 16.6 — position_boost Schema Migration

**Status:** ready
**Epic:** 16 — Leaderboard & Founder Updates Engine Fix
**Depends on:** —
**Design Refs:** — (SQL only)
**Source:** [Audit §3 claim 4 / issue 5](../scans/engine-audit-5-engines.md), [PRD REQ-6.8.3](../PRD.md) (skip the line), [epic12-position-recalculation.sql](sql-writeups/epic12-position-recalculation.sql), [Epic 16 Standing Decision L4](../epics/epic-16-leaderboard-updates-engine-fix.md)

## Story

As a platform, I want a durable skip-the-line flag on subscribers and an RPC that honors it so milestone perks survive every position recalculation.

## Acceptance Criteria (EARS)

- AC1: The system shall ship SQL (file under `docs/stories/sql-writeups/`) that: (a) adds `position_boost boolean not null default false` to `public.subscribers`; (b) either backfills `position_boost = true` only where `milestones_earned` contains an entry whose label matches skip-the-line semantics, **or** documents why backfill is skipped (recommend **no backfill** of arbitrary `position = 1` rows — only future milestone awards set the flag; record choice in SQL comments); (c) creates an index only if required (default: **no index** at ≤500 subs).
- AC2: The migration shall replace `public.recalculate_positions(p_waitlist_id uuid)` so ordering is: **`position_boost DESC`**, then `referral_count DESC`, then `created_at ASC` — boosted subscribers rank above non-boosted peers regardless of equal-or-fewer referrals; ties among boosted (or among non-boosted) follow referral/date rules.
- AC3: The RPC shall remain `SECURITY DEFINER`, accept the same `p_waitlist_id uuid` argument, and return the same row shape `{ subscriber_id, old_position, new_position, spots_moved }[]` (if shape must change, annotate and update `src/lib/positions.ts` in Story 16.7).
- AC4: The SQL file shall be idempotent for Supabase SQL Editor (`ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`) — safe to re-run.
- AC5: Story verification / PR description shall instruct the founder to run the SQL **before** deploying Story 16.7 application code.
- AC6: Lint and build shall pass with zero errors (SQL/docs only — lint still runs for safety).

## Tasks

- T1 (AC1) Column migration
- T2 (AC2–AC3) RPC rewrite
- T3 (AC4–AC5) Idempotency + run instructions
- T4 (AC6) Lint + build

## Out of Scope

- Application code that sets `position_boost` (Story 16.7)
- Public leaderboard milestone badge display (Standing Decision L5 — deferred)
- Changing referral_count computation or signup flow
- RLS / column grants (Epic 14)

## Dev Notes

### Existing RPC

File: `docs/stories/sql-writeups/epic12-position-recalculation.sql`

- Function `public.recalculate_positions(p_waitlist_id uuid)` — verify exact `ORDER BY` when writing migration (expected: `referral_count DESC, created_at ASC`).
- Caller: `src/lib/positions.ts` → `supabase.rpc("recalculate_positions", { p_waitlist_id: waitlistId })`.
- Invoked from `src/app/api/subscribers/route.ts:597` after every signup (and milestone path runs **before** that at L588 — clobber order).

### Clobber root cause (do not re-break)

```
POST /api/subscribers
  → checkAndFulfillMilestones(referrer, …)   // may set position: 1 today
  → recalculatePositions(waitlist)           // overwrites ALL positions from ORDER BY
```

`milestones.ts` writing `position: 1` is useless until RPC orders by a durable flag (16.7 sets the flag; this story makes RPC honor it).

### T1 — column

```sql
-- docs/stories/sql-writeups/epic16-story6-position-boost.sql
-- Run in Supabase SQL Editor BEFORE deploying Story 16.7.

alter table public.subscribers
  add column if not exists position_boost boolean not null default false;

-- Backfill choice: NONE for position = 1 (would boost unrelated rank-1 rows).
-- Optional precise backfill (uncomment only if product wants historical skip-the-line honored):
-- update public.subscribers s
-- set position_boost = true
-- where s.milestones_earned is not null
--   and exists (
--     select 1 from jsonb_array_elements(s.milestones_earned) as e
--     where lower(coalesce(e->>'label','')) like '%skip the line%'
--   );

-- No index by default (≤500 rows per waitlist product cap).
```

### T2 — RPC

```sql
create or replace function public.recalculate_positions(p_waitlist_id uuid)
returns table (
  subscriber_id uuid,
  old_position integer,
  new_position integer,
  spots_moved integer
)
language sql
security definer
set search_path = public
as $$
  with ranked as (
    select
      s.id,
      s.position as old_pos,
      row_number() over (
        order by
          s.position_boost desc,
          s.referral_count desc,
          s.created_at asc
      )::int as new_pos
    from subscribers s
    where s.waitlist_id = p_waitlist_id
  ),
  updated as (
    update subscribers s
    set position = r.new_pos
    from ranked r
    where s.id = r.id
    returning s.id, r.old_pos, r.new_pos
  )
  select
    u.id as subscriber_id,
    u.old_pos as old_position,
    u.new_pos as new_position,
    (u.old_pos - u.new_pos) as spots_moved
  from updated u;
$$;
```

**Match existing return contract exactly** — read current function body first; only insert `s.position_boost desc` as the leading `ORDER BY` key. Keep column aliases identical so `positions.ts` `PositionUpdate` type stays valid (AC3).

`position_boost` boolean DESC in Postgres: `true` sorts before `false` in DESC — boosted first. Confirm with a comment in the SQL file.

### T3 — idempotency + founder gate (AC4–AC5)

- `add column if not exists` + `create or replace function` only.
- PR checklist: "Founder: run `epic16-story6-position-boost.sql` in Supabase before merging 16.7 to production."
- Local dev: same SQL before testing 16.7.

### T4 — lint/build

`pnpm lint && pnpm build`.

## Files to Create/Modify

| File                                                         | Change            |
| ------------------------------------------------------------ | ----------------- |
| `docs/stories/sql-writeups/epic16-story6-position-boost.sql` | **New** migration |

No TypeScript changes in this story.

## Risk

- **Deploy order:** 16.7 code writing `position_boost` fails with PGRST204 (unknown column) if SQL not run — hard gate.
- RPC rewrite must not drop `security definer` or change param name (SSR client relies on both).
- If existing production RPC differs from `epic12-position-recalculation.sql`, prefer `create or replace` full body from **live** schema dump over trusting stale file — verify in Supabase before shipping.

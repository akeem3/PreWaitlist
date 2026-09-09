# Story 11.7 — Schema Migration — Sprint 3 Columns

**Epic:** 11 — Warmth Tracking Engine
**Status:** ready
**Depends on:** —
**Design Refs:** None (database-only change)

## Story

As a developer, I want all Sprint 3 database schema additions in a single migration so that subsequent stories can depend on the correct columns existing.

## Acceptance Criteria (EARS)

- AC1: The system shall apply a SQL migration that adds all Sprint 3 columns and tables.
- AC2: The migration shall add `event_data jsonb DEFAULT NULL` to the `email_events` table.
- AC3: The migration shall add `sender_name text DEFAULT NULL` to the `waitlists` table.
- AC4: The migration shall add `cold_threshold integer DEFAULT 40` to the `waitlists` table.
- AC5: The migration shall add `sending_domain text DEFAULT NULL` to the `waitlists` table.
- AC6: The migration shall add `paddle_subscription_id text DEFAULT NULL` to the `founder_profiles` table.
- AC7: The migration shall create the `broadcasts` table: `{ id uuid PK, waitlist_id uuid FK, subject text NOT NULL, sent_at timestamptz, recipient_count integer, created_at timestamptz DEFAULT now() }`.
- AC8: The migration shall add `subscriber_count integer DEFAULT 0` to the `waitlists` table (cached counter for 500-cap check).
- AC9: The migration shall DROP and recreate the `email_events.event_type` CHECK constraint to add `complained`, `failed`, and `delivery_delayed` to the allowed values. New constraint: `CHECK (event_type IN ('sent','delivered','opened','clicked','bounced','complained','failed','delivery_delayed'))`.
- AC10: All columns shall be nullable or have defaults — no NOT NULL without defaults (avoids breaking existing rows).
- AC11: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC10) Write SQL migration file · T2 (AC11) Lint + build

## Out of Scope

Data backfill, column removals, index additions (add in subsequent stories if needed).

## Implementation Details

### T1: Write SQL migration file

- **New file:** `docs/stories/sql-writeups/epic11-story7-sprint3-schema.sql`
- Run against Supabase SQL editor or via `supabase db push`
- All columns use nullable or DEFAULT — safe to apply on tables with existing data

#### AC2 — `event_data` on `email_events`

Current schema (from `epic7-story6-warmth-schema.sql` line 36-42):

```sql
CREATE TABLE public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  waitlist_id uuid NOT NULL REFERENCES public.waitlists(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced')),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Migration:

```sql
ALTER TABLE public.email_events
ADD COLUMN IF NOT EXISTS event_data jsonb DEFAULT NULL;
```

#### AC3 — `sender_name` on `waitlists`

```sql
ALTER TABLE public.waitlists
ADD COLUMN IF NOT EXISTS sender_name text DEFAULT NULL;
```

#### AC4 — `cold_threshold` on `waitlists`

```sql
ALTER TABLE public.waitlists
ADD COLUMN IF NOT EXISTS cold_threshold integer DEFAULT 40;
```

#### AC5 — `sending_domain` on `waitlists`

```sql
ALTER TABLE public.waitlists
ADD COLUMN IF NOT EXISTS sending_domain text DEFAULT NULL;
```

#### AC6 — `paddle_subscription_id` on `founder_profiles`

```sql
ALTER TABLE public.founder_profiles
ADD COLUMN IF NOT EXISTS paddle_subscription_id text DEFAULT NULL;
```

#### AC7 — `broadcasts` table

```sql
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id uuid NOT NULL REFERENCES public.waitlists(id) ON DELETE CASCADE,
  subject text NOT NULL,
  sent_at timestamptz,
  recipient_count integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS broadcasts_waitlist_id_idx ON public.broadcasts(waitlist_id);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founders manage own broadcasts"
  ON public.broadcasts FOR ALL
  USING (waitlist_id IN (SELECT id FROM public.waitlists WHERE founder_id = auth.uid()))
  WITH CHECK (waitlist_id IN (SELECT id FROM public.waitlists WHERE founder_id = auth.uid()));
```

No public insert — founders access via authenticated API only.

#### AC8 — `subscriber_count` on `waitlists`

```sql
ALTER TABLE public.waitlists
ADD COLUMN IF NOT EXISTS subscriber_count integer DEFAULT 0;
```

#### AC9 — `event_type` CHECK constraint update

Current constraint only allows 5 values. Must DROP then ADD (Postgres does not support `ALTER CONSTRAINT`):

```sql
ALTER TABLE public.email_events
DROP CONSTRAINT IF EXISTS email_events_event_type_check;

ALTER TABLE public.email_events
ADD CONSTRAINT email_events_event_type_check
  CHECK (event_type IN ('sent','delivered','opened','clicked','bounced','complained','failed','delivery_delayed'));
```

#### AC10 — Safety check

All columns above are nullable or have DEFAULT values. No `NOT NULL` without defaults.

### T2: Lint + build

- Run `pnpm lint` and `pnpm build`
- SQL files are not linted, but ensure no TypeScript changes break the build

## Verification

1. Open Supabase SQL editor
2. Paste the migration SQL and run it
3. Verify each column exists: `SELECT column_name FROM information_schema.columns WHERE table_name = 'email_events' AND column_name = 'event_data';`
4. Verify `broadcasts` table exists: `SELECT table_name FROM information_schema.tables WHERE table_name = 'broadcasts';`
5. Verify CHECK constraint: `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'email_events_event_type_check';`
6. Run `pnpm lint` and `pnpm build` — verify zero errors

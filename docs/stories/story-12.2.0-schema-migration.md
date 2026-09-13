# Story 12.2.0 — Schema Migration

**Epic:** 12.2 — Gap Fixes
**Status:** ready
**Depends on:** —
**Design Refs:** —

## Story

As the system, I need new database columns and tables to support consent tracking, archive status, and bounce suppression.

## Acceptance Criteria (EARS)

- AC1: The `subscribers` table shall have a new column `consent_given_at timestamptz nullable` — set on signup when the consent checkbox is checked.
- AC2: The `subscribers` table shall have a new column `consent_ip_address text nullable` — captures IP at signup for GDPR audit trail.
- AC3: The `subscribers` table shall have a new column `unsubscribed_at timestamptz nullable` — set when subscriber clicks unsubscribe link.
- AC4: The `waitlists` table shall have a new column `is_archived boolean default false` — set when founder archives the waitlist.
- AC5: The `waitlists` table shall have a new column `archived_at timestamptz nullable` — set when archived.
- AC6: A new table `bounced_emails` shall be created with columns: `id uuid primary key default gen_random_uuid()`, `waitlist_id uuid not null references waitlists(id) on delete cascade`, `email text not null`, `email_type text not null check (email_type in ('confirmation','broadcast'))`, `bounce_type text not null check (bounce_type in ('hard','soft'))`, `created_at timestamptz not null default now()`.
- AC7: RLS policies on `bounced_emails`: founders can manage own (select, insert, delete), service role can insert.
- AC8: All columns shall be nullable or have defaults — no migration shall break existing rows.
- AC9: The migration SQL shall be idempotent (use `IF NOT EXISTS` / `IF EXISTS`).
- AC10: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC5) Subscribers and waitlists columns · T2 (AC6-AC7) Bounced emails table + RLS · T3 (AC8-AC9) Idempotency + defaults · T4 (AC10) Lint + build

## Out of Scope

Consent checkbox UI (Story 12.2.5), unsubscribe UI (Story 12.2.6), bounce handling logic (Story 12.2.7).

## Implementation Details

### T1: Subscribers and waitlists columns

Run in Supabase Dashboard SQL Editor:

```sql
-- Subscribers: consent + unsubscribe columns
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS consent_given_at timestamptz;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS consent_ip_address text;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;

-- Waitlists: archive columns
ALTER TABLE waitlists ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
ALTER TABLE waitlists ADD COLUMN IF NOT EXISTS archived_at timestamptz;
```

### T2: Bounced emails table + RLS

```sql
CREATE TABLE IF NOT EXISTS bounced_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id uuid NOT NULL REFERENCES waitlists(id) ON DELETE CASCADE,
  email text NOT NULL,
  email_type text NOT NULL CHECK (email_type IN ('confirmation', 'broadcast')),
  bounce_type text NOT NULL CHECK (bounce_type IN ('hard', 'soft')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_bounced_emails_lookup
  ON bounced_emails (waitlist_id, email, bounce_type);

-- RLS
ALTER TABLE bounced_emails ENABLE ROW LEVEL SECURITY;

-- Founders can manage their own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'founders_manage_own_bounced'
    AND tablename = 'bounced_emails'
  ) THEN
    CREATE POLICY founders_manage_own_bounced ON bounced_emails
      FOR ALL
      USING (
        waitlist_id IN (
          SELECT w.id FROM waitlists w
          JOIN founder_profiles fp ON w.founder_id = fp.id
          WHERE fp.user_id = auth.uid()
        )
      )
      WITH CHECK (
        waitlist_id IN (
          SELECT w.id FROM waitlists w
          JOIN founder_profiles fp ON w.founder_id = fp.id
          WHERE fp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Service role can insert (webhook needs bypass)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'service_role_insert_bounced'
    AND tablename = 'bounced_emails'
  ) THEN
    CREATE POLICY service_role_insert_bounced ON bounced_emails
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
```

### T3: Idempotency + defaults

All statements use `IF NOT EXISTS` / `IF EXISTS`. Existing rows get:

- `NULL` for nullable columns (consent_given_at, consent_ip_address, unsubscribed_at, archived_at)
- `false` for `is_archived` (via DEFAULT)

No data migration needed — new columns are backwards-compatible.

### T4: Lint + build

Run `pnpm lint` and `pnpm build`. No code changes expected — this is a schema-only story.

## Verification

1. Run migration SQL in Supabase Dashboard SQL Editor
2. Verify: `SELECT column_name FROM information_schema.columns WHERE table_name = 'subscribers' AND column_name IN ('consent_given_at', 'consent_ip_address', 'unsubscribed_at');` — returns 3 rows
3. Verify: `SELECT column_name FROM information_schema.columns WHERE table_name = 'waitlists' AND column_name IN ('is_archived', 'archived_at');` — returns 2 rows
4. Verify: `SELECT table_name FROM information_schema.tables WHERE table_name = 'bounced_emails';` — returns 1 row
5. Verify: `SELECT policyname FROM pg_policies WHERE tablename = 'bounced_emails';` — returns 2 policies
6. Verify existing data is untouched (no NULLs introduced in non-new columns)
7. `pnpm lint` and `pnpm build` pass with zero errors

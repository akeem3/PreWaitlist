-- Epic 12.2 Story 0: Bounced Emails Table
-- Run in Supabase Dashboard SQL Editor
-- Idempotent: safe to run multiple times

-- 1. Bounced emails table
CREATE TABLE IF NOT EXISTS bounced_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id uuid NOT NULL REFERENCES waitlists(id) ON DELETE CASCADE,
  email text NOT NULL,
  email_type text NOT NULL CHECK (email_type IN ('confirmation', 'broadcast')),
  bounce_type text NOT NULL CHECK (bounce_type IN ('hard', 'soft')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Index for fast lookups (check before every email send)
CREATE INDEX IF NOT EXISTS idx_bounced_emails_lookup
  ON bounced_emails (waitlist_id, email, bounce_type);

-- 3. RLS policies
ALTER TABLE bounced_emails ENABLE ROW LEVEL SECURITY;

-- Founders can manage their own bounced emails
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
          SELECT id FROM waitlists WHERE founder_id = auth.uid()
        )
      )
      WITH CHECK (
        waitlist_id IN (
          SELECT id FROM waitlists WHERE founder_id = auth.uid()
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

-- 4. Add consent and archive columns (idempotent)
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS consent_given_at timestamptz;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS consent_ip_address text;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;

ALTER TABLE waitlists ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
ALTER TABLE waitlists ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 5. Business address column for CAN-SPAM
ALTER TABLE waitlists ADD COLUMN IF NOT EXISTS business_address text;

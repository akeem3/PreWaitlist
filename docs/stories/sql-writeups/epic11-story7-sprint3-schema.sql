-- Story 11.7: Sprint 3 Schema Migration
-- Adds all Sprint 3 columns and tables in a single migration.
-- All columns are nullable or have defaults — safe on tables with existing data.
-- Run in Supabase Dashboard → SQL Editor.

-- AC2: event_data on email_events (webhook payload storage)
ALTER TABLE public.email_events
ADD COLUMN IF NOT EXISTS event_data jsonb DEFAULT NULL;

-- AC3: sender_name on waitlists (custom sender for broadcasts)
ALTER TABLE public.waitlists
ADD COLUMN IF NOT EXISTS sender_name text DEFAULT NULL;

-- AC4: cold_threshold on waitlists (configurable warning threshold, default 40%)
ALTER TABLE public.waitlists
ADD COLUMN IF NOT EXISTS cold_threshold integer DEFAULT 40;

-- AC5: sending_domain on waitlists (custom domain for email sending)
ALTER TABLE public.waitlists
ADD COLUMN IF NOT EXISTS sending_domain text DEFAULT NULL;

-- AC6: paddle_subscription_id on founder_profiles (Paddle billing integration)
ALTER TABLE public.founder_profiles
ADD COLUMN IF NOT EXISTS paddle_subscription_id text DEFAULT NULL;

-- AC7: broadcasts table (broadcast history for dashboard activity feed)
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'founders manage own broadcasts'
  ) THEN
    CREATE POLICY "founders manage own broadcasts"
      ON public.broadcasts FOR ALL
      USING (waitlist_id IN (SELECT id FROM public.waitlists WHERE founder_id = auth.uid()))
      WITH CHECK (waitlist_id IN (SELECT id FROM public.waitlists WHERE founder_id = auth.uid()));
  END IF;
END $$;

-- AC8: subscriber_count on waitlists (cached counter for 500-cap check)
ALTER TABLE public.waitlists
ADD COLUMN IF NOT EXISTS subscriber_count integer DEFAULT 0;

-- AC9: Update email_events.event_type CHECK constraint
-- Postgres does not support ALTER CONSTRAINT — must DROP then ADD.
-- Uses the auto-generated constraint name: {table}_{column}_check
ALTER TABLE public.email_events
DROP CONSTRAINT IF EXISTS email_events_event_type_check;

ALTER TABLE public.email_events
ADD CONSTRAINT email_events_event_type_check
  CHECK (event_type IN ('sent','delivered','opened','clicked','bounced','complained','failed','delivery_delayed'));

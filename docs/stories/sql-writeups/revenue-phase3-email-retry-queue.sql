-- Revenue lifecycle fix plan, Phase 3.1: daily-quota retry parking.
-- FOUNDER-RUN in Supabase SQL Editor BEFORE deploying Phase 3.1.
-- Idempotent (IF NOT EXISTS everywhere). Safe to run any time.
--
-- Why: Resend `daily_quota_exceeded` clears at midnight UTC, so a parked
-- retry recovers the email ~hours late instead of losing it. `monthly_quota`
-- is never parked (dead-lettered in code). `rate_limit` retries inline.
--
-- Verification probe (expect 1 row, table exists):
--   SELECT COUNT(*) FROM public.email_retry_queue;

CREATE TABLE IF NOT EXISTS public.email_retry_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id uuid NOT NULL REFERENCES public.waitlists(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES public.subscribers(id) ON DELETE SET NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  html text NOT NULL,
  text_payload text,
  stream text NOT NULL DEFAULT 'transactional',
  sender_name text,
  product_name text,
  headline text,
  sending_domain text,
  idempotency_key text NOT NULL,
  email_type text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  not_before timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_retry_queue_due_idx
  ON public.email_retry_queue(not_before)
  WHERE attempts < max_attempts;

ALTER TABLE public.email_retry_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'founders manage own email_retry_queue'
  ) THEN
    CREATE POLICY "founders manage own email_retry_queue"
      ON public.email_retry_queue FOR ALL
      USING (waitlist_id IN (SELECT id FROM public.waitlists WHERE founder_id = auth.uid()))
      WITH CHECK (waitlist_id IN (SELECT id FROM public.waitlists WHERE founder_id = auth.uid()));
  END IF;
END $$;

 -- Story 12.2: Email customization columns on waitlists
-- The code references email_subject, email_sender_name, email_body
-- but no migration was ever created for these columns.
-- Idempotent: safe to run multiple times.

ALTER TABLE public.waitlists
  ADD COLUMN IF NOT EXISTS email_subject text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_sender_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_body text DEFAULT NULL;

-- Epic 15 Story 15.2: race-safe webhook idempotency + bounce capture fix
-- Run in Supabase SQL Editor before relying on AC5/AC6.
-- Until the index runs, the application-level svix-id pre-check still prevents
-- duplicates in low-volume/sequential delivery; the index closes the race.

CREATE UNIQUE INDEX IF NOT EXISTS email_events_svix_uidx
  ON email_events (waitlist_id, (event_data ->> 'svix_id'))
  WHERE event_data ->> 'svix_id' IS NOT NULL;

-- AC6: the webhook writes email_type = 'transactional' (documented decision,
-- see MEMORY Epic 12.2), but the original CHECK only allowed
-- ('confirmation','broadcast') — every webhook bounce insert violated it and
-- failed silently (23514), so bounce suppression never persisted. Widen any
-- check constraint on email_type that lacks 'transactional'. Existing rows
-- only contain allowed values, so validation passes.
DO $$
DECLARE
  con RECORD;
BEGIN
  FOR con IN
    SELECT c.conname, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'bounced_emails'::regclass
      AND c.contype = 'c'
      AND a.attname = 'email_type'
  LOOP
    IF con.def NOT LIKE '%transactional%' THEN
      EXECUTE format('ALTER TABLE bounced_emails DROP CONSTRAINT %I', con.conname);
      EXECUTE 'ALTER TABLE bounced_emails ADD CONSTRAINT bounced_emails_email_type_check '
              || 'CHECK (email_type IN (''confirmation'', ''broadcast'', ''transactional''))';
      EXIT;
    END IF;
  END LOOP;
END $$;

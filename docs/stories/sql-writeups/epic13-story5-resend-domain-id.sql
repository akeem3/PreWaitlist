-- Story 13.5: Add resend_domain_id to waitlists
-- Required for Resend domain verification flow

ALTER TABLE waitlists
ADD COLUMN IF NOT EXISTS resend_domain_id text DEFAULT NULL;

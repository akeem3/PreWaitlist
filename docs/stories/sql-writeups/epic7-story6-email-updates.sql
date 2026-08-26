-- Story 7.6: Add sent_at column to founder_updates table
-- Tracks when an update was dispatched to subscribers via email.
-- NULL = email not yet sent. Updated after Resend batch send completes.

ALTER TABLE founder_updates
ADD COLUMN sent_at TIMESTAMPTZ;

-- Add a comment for clarity
COMMENT ON COLUMN founder_updates.sent_at IS 'Timestamp when update was dispatched to subscribers via email. NULL = not yet sent.';

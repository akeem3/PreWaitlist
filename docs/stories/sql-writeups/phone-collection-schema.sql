-- Phone Number Collection: waitlists.phone_mode + subscribers.phone
-- Idempotent: safe to run multiple times
-- FOUNDER: run this in the Supabase SQL Editor BEFORE deploying the phone feature.

-- 1. Founder-configurable signup mode: 'off' (default) | 'optional' | 'required'
ALTER TABLE public.waitlists
ADD COLUMN IF NOT EXISTS phone_mode text NOT NULL DEFAULT 'off';

ALTER TABLE public.waitlists DROP CONSTRAINT IF EXISTS waitlists_phone_mode_check;
ALTER TABLE public.waitlists
ADD CONSTRAINT waitlists_phone_mode_check
CHECK (phone_mode IN ('off', 'optional', 'required'));

-- 2. Subscriber phone number, E.164 format (e.g. +15551234567). Nullable, no check
--    (display_name precedent). Written by service-role server code only.

ALTER TABLE public.subscribers
ADD COLUMN IF NOT EXISTS phone text;

-- Verify — should return 2 rows:
-- SELECT table_name, column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE (table_name = 'waitlists' AND column_name = 'phone_mode')
--    OR (table_name = 'subscribers' AND column_name = 'phone');

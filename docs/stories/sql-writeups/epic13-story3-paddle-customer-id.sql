-- Story 13.3: Add paddle_customer_id to founder_profiles
-- Required for Paddle customer portal session creation

ALTER TABLE founder_profiles
ADD COLUMN IF NOT EXISTS paddle_customer_id text DEFAULT NULL;

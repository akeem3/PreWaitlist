-- Story 7.6: Milestone fulfillment schema changes
-- Adds milestones_earned and milestones_notified columns to subscribers table

-- Milestones earned: tracks which tiers each subscriber has reached
ALTER TABLE public.subscribers
ADD COLUMN milestones_earned jsonb;

COMMENT ON COLUMN public.subscribers.milestones_earned
IS 'JSON array of earned milestones: [{"threshold": 5, "label": "Early access", "earned_at": "2026-08-25T..."}]';

-- Milestones notified: tracks which milestone emails have been sent
ALTER TABLE public.subscribers
ADD COLUMN milestones_notified jsonb;

COMMENT ON COLUMN public.subscribers.milestones_notified
IS 'JSON array of notified thresholds: [5, 10, 25]. Prevents duplicate emails.';

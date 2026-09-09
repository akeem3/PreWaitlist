-- FIX: milestone_rewards tier_referrals check constraint
-- The DB still has the old constraint: check (tier_referrals in (3, 10, 25))
-- The onboarding code now allows any positive integer (1, 5, 10, 25, etc.)
-- This migration drops the old constraint and adds the correct one.
-- Run this in Supabase Dashboard → SQL Editor

-- Drop the old constraint
ALTER TABLE public.milestone_rewards
  DROP CONSTRAINT IF EXISTS milestone_rewards_tier_referrals_check;

-- Add the correct constraint: any positive integer
ALTER TABLE public.milestone_rewards
  ADD CONSTRAINT milestone_rewards_tier_referrals_check CHECK (tier_referrals > 0);

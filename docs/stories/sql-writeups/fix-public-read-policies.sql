-- FIX: Add public read policies for public waitlist pages
-- Without these, anonymous visitors get 404 because RLS blocks all reads.
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================
-- waitlists: public read for subdomain pages
-- ============================================
-- Existing policy only allows founders. Anonymous visitors need SELECT access.
CREATE POLICY "public read access for waitlist pages"
  ON public.waitlists FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- qualification_questions: public read for inline questions
-- ============================================
-- Existing policy only allows founders. Anonymous visitors need SELECT access.
CREATE POLICY "public read access for qualification questions"
  ON public.qualification_questions FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- milestone_rewards: public read for leaderboard badges
-- ============================================
-- Existing policy only allows founders. Anonymous visitors need SELECT access.
CREATE POLICY "public read access for milestone rewards"
  ON public.milestone_rewards FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- founder_updates: public read for updates feed
-- ============================================
-- Existing policy only allows founders. Anonymous visitors need SELECT access.
CREATE POLICY "public read access for founder updates"
  ON public.founder_updates FOR SELECT
  TO anon, authenticated
  USING (true);

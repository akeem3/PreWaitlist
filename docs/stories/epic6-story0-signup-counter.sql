-- Story 6.0 T2: Signup counter columns
-- Run this in Supabase Dashboard → SQL Editor

-- Add signup counter columns to waitlists table
ALTER TABLE public.waitlists
  ADD COLUMN IF NOT EXISTS signup_counter_enabled boolean not null default false,
  ADD COLUMN IF NOT EXISTS signup_counter_threshold integer not null default 10;

-- Profile settings columns for founder_profiles
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE public.founder_profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text;

-- Update the RLS policy to allow founders to update their own profile
-- (existing "founders manage own profile" policy already covers this via FOR ALL)

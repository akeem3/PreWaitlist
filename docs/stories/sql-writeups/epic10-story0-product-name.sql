-- Story 10.0: Add product_name column to waitlists table
-- Run this in Supabase Dashboard → SQL Editor

-- Add product_name column (nullable, no default — NULL means "fall back to headline")
alter table public.waitlists
  add column if not exists product_name text;

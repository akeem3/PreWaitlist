-- Story 7.0: Subscribers table + RLS
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================
-- TABLE
-- ============================================

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  email text not null,
  referral_code text not null unique,
  referrer_id uuid references public.subscribers(id) on delete set null,
  position integer not null,
  qual_answers jsonb,
  created_at timestamptz not null default now(),
  constraint email_format check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================
-- INDEXES
-- ============================================

-- Unique constraint: one subscriber per email per waitlist
create unique index subscribers_waitlist_email_idx on public.subscribers(waitlist_id, email);

-- Fast referral code lookups
create index subscribers_referral_code_idx on public.subscribers(referral_code);

-- Fast referral count queries (referrer_id is not unique — one subscriber can refer many)
create index subscribers_referrer_id_idx on public.subscribers(referrer_id);

-- ============================================
-- ROW-LEVEL SECURITY
-- ============================================

alter table public.subscribers enable row level security;

-- Founders manage their own waitlist's subscribers (join through waitlists to check ownership)
create policy "founders manage own waitlist's subscribers"
  on public.subscribers for all
  using (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()))
  with check (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()));

-- Public read access for leaderboard (anonymous users can view subscribers for a waitlist)
create policy "public read access for leaderboard"
  on public.subscribers for select
  using (true);

-- Public insert access for email capture (anonymous visitors can sign up for waitlists)
create policy "public can insert subscribers"
  on public.subscribers for insert
  to anon
  with check (true);

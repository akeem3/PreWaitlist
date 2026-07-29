-- Story 0.3: Supabase schema + RLS
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- founders extends auth.users via a 1:1 profile row
create table public.founder_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free','pro','growth')),
  ref_param text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  acquisition_captured_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.waitlists (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founder_profiles(id) on delete cascade,
  name text,
  tagline text,
  subdomain text not null unique,
  template text not null default 'minimal' check (template in ('minimal','bold','dark')),
  headline text,
  subheadline text,
  cta_text text,
  logo_url text,
  brand_color text not null default '#0F7A5E',
  qualification_enabled boolean not null default false,
  milestone_rewards_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  constraint subdomain_format check (subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$')
);
create unique index waitlists_founder_id_idx on public.waitlists(founder_id);

create table public.qualification_questions (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('multiple_choice','free_text')),
  sort_order smallint not null default 0
);

create table public.milestone_rewards (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  tier_referrals smallint not null check (tier_referrals in (3,10,25)),
  reward_label text not null,
  unique (waitlist_id, tier_referrals)
);

create table public.founder_updates (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- ROW-LEVEL SECURITY
-- ============================================

alter table public.founder_profiles enable row level security;
alter table public.waitlists enable row level security;
alter table public.qualification_questions enable row level security;
alter table public.milestone_rewards enable row level security;
alter table public.founder_updates enable row level security;

-- founder_profiles: founders manage own profile
create policy "founders manage own profile"
  on public.founder_profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- waitlists: founders manage own waitlist
create policy "founders manage own waitlist"
  on public.waitlists for all
  using (founder_id = auth.uid())
  with check (founder_id = auth.uid());

-- qualification_questions: founders manage own waitlist's questions
create policy "founders manage own waitlist's questions"
  on public.qualification_questions for all
  using (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()))
  with check (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()));

-- milestone_rewards: founders manage own waitlist's rewards
create policy "founders manage own waitlist's rewards"
  on public.milestone_rewards for all
  using (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()))
  with check (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()));

-- founder_updates: founders manage own waitlist's updates
create policy "founders manage own waitlist's updates"
  on public.founder_updates for all
  using (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()))
  with check (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()));

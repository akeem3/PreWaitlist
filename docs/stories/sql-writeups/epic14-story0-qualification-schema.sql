-- Story 14.0: Qualification schema, answer-key migration, privacy
-- Run this in Supabase Dashboard → SQL Editor BEFORE deploying Story 14.0/14.1 code.
-- Epic 14 — Qualification Engine Fix & Hardening

-- ============================================
-- AC1: options jsonb on qualification_questions
-- (a) nullable options for multiple-choice choices
-- (b) question_type CHECK already ('multiple_choice','free_text') — keep as-is
-- (c) do NOT add a required column
-- ============================================

alter table public.qualification_questions
  add column if not exists options jsonb;

-- ============================================
-- AC2: Rewrite subscribers.qual_answers keys
-- from question_text → qualification_questions.id
-- Match on waitlist_id + question_text.
-- Unmappable keys are DROPPED (not left as text keys).
-- ============================================

do $$
declare
  sub record;
  qa jsonb;
  pair record;
  q_id uuid;
  new_qa jsonb;
  remapped int := 0;
  dropped_keys int := 0;
  unmapped_rows int := 0;
begin
  for sub in
    select id, waitlist_id, qual_answers
    from public.subscribers
    where qual_answers is not null
      and jsonb_typeof(qual_answers) = 'object'
      and qual_answers <> '{}'::jsonb
  loop
    qa := sub.qual_answers;
    new_qa := '{}'::jsonb;

    for pair in
      select key, value
      from jsonb_each(qa)
    loop
      select id into q_id
      from public.qualification_questions
      where waitlist_id = sub.waitlist_id
        and question_text = pair.key
      limit 1;

      if q_id is not null then
        new_qa := new_qa || jsonb_build_object(q_id::text, pair.value);
        remapped := remapped + 1;
      else
        -- No matching question for this text key — drop it (AC2)
        dropped_keys := dropped_keys + 1;
      end if;
    end loop;

    if new_qa = '{}'::jsonb then
      -- All keys unmapped — store null rather than empty object
      update public.subscribers
      set qual_answers = null
      where id = sub.id;
      unmapped_rows := unmapped_rows + 1;
    elsif new_qa <> qa then
      update public.subscribers
      set qual_answers = new_qa
      where id = sub.id;
    end if;
  end loop;

  raise notice 'qual_answers remap: % keys remapped, % keys dropped, % rows nulled',
    remapped, dropped_keys, unmapped_rows;
end $$;

-- ============================================
-- AC3: Drop public USING (true) SELECT on subscribers
-- Public reads must move to server-only admin paths (AC8).
-- ============================================

drop policy if exists "public read access for leaderboard" on public.subscribers;

-- Defense in depth: revoke anon SELECT grant on subscribers.
-- Founders keep access via the founders-manage policy + authenticated grant.
revoke select on table public.subscribers from anon;

grant select on table public.subscribers to authenticated;

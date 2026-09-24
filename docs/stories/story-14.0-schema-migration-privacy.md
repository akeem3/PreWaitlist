# Story 14.0 — Schema, Answer-Key Migration, Server Caps, Privacy

**Status:** ready
**Epic:** 14 — Qualification Engine Fix & Hardening
**Depends on:** —

## Story

As a platform, I want qualification data modeled with stable `question_id` keys, tier caps enforced on the server, and subscriber PII closed to anon PostgREST so that answer keys survive renames, Free/Pro limits hold under API abuse, and `qual_answers`/emails are never world-readable.

## Acceptance Criteria (EARS)

- AC1: The system shall ship SQL under `docs/stories/sql-writeups/` that: (a) adds nullable `options jsonb` to `qualification_questions`; (b) keeps `question_type` CHECK as `('multiple_choice','free_text')` (PRD §7.4); (c) does **not** add a `required` column.
- AC2: The migration shall rewrite every `subscribers.qual_answers` key from matching `question_text` to the owning `qualification_questions.id` (match on `waitlist_id` + `question_text`); unmappable keys shall be dropped, not left as text keys.
- AC3: The migration shall drop the public `USING (true)` SELECT policy on `subscribers` and replace public read paths with server-only access that never exposes `qual_answers` to anon consumers.
- AC4: `POST /api/waitlist` and `PATCH /api/waitlist` shall reject `questions.length` above the founder's tier cap (Free=2, Pro=5) with **400** and a JSON error — server-side via `founder_profiles.tier`, not the client.
- AC5: Question create/update shall persist `question_type` and, when `multiple_choice`, a non-empty `options` array (min 2 non-empty strings); `free_text` shall store `options = null`.
- AC6: `GET /api/waitlist` shall return questions as `{ id, text, type, options }` and shall **not** synthesize a `required` flag.
- AC7: The orphaned route `src/app/api/leaderboard/[subdomain]/route.ts` shall be deleted; exclusive tests updated or removed.
- AC8: Public leaderboard and other public subscriber reads shall keep working after the RLS change via server-only/admin path or SECURITY DEFINER RPC returning only safe columns — never `qual_answers`, never raw email to anon.
- AC9: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Write + run migration SQL
T2 (AC3, AC8) Drop public SELECT RLS + rework public subscriber reads
T3 (AC4-AC5) Server tier cap + type/options validation on POST/PATCH
T4 (AC6) GET /api/waitlist response shape (no required)
T5 (AC7) Delete orphaned leaderboard API route
T6 (AC9) Lint + build

## Dev Notes

- **SQL file:** `docs/stories/sql-writeups/epic14-story0-qualification-schema.sql` — founder must run in Supabase SQL Editor **before** deploying dependent code (Phase 0 hard gate).
- **Key migration sketch:** per waitlist build `question_text → id` map from `qualification_questions`; for each subscriber with non-null `qual_answers`, remap keys; drop keys with no match.
- **RLS:** `docs/stories/sql-writeups/epic7-story0-subscribers.sql` has `USING (true)` public SELECT. After drop, server components that used anon PostgREST on `subscribers` (public leaderboard page, public page qualified-count) must switch to `createAdminClient()` with **explicit column lists** excluding `qual_answers` (and raw email where only anonymized display is needed). Never ship service role to the client.
- **Server cap:** in POST/PATCH, load tier via `founder_profiles` join on `waitlists.founder_id` before question insert/delete+reinsert. Wire shared `getTierLimits` from `src/lib/tier-gating.ts` (currently unused for this path).
- **GET shape change** is breaking for Step 4a/context until 14.1 lands — ship 14.0 + 14.1 in the same release train.
- **Partial deferral OK:** stopping overview `qual_answers` select (`dashboard/page.tsx`) can wait for 14.4 if it does not block the RLS drop.
- **Related leak:** orphaned API currently returns full `qual_answers` + raw email to anyone with a subdomain (`leaderboard/[subdomain]/route.ts`) — delete is the fix, not patch.

## Files to Create/Modify

- `docs/stories/sql-writeups/epic14-story0-qualification-schema.sql` — new migration
- `src/app/api/waitlist/route.ts` — cap, type/options, GET shape
- `src/lib/tier-gating.ts` — consumed by waitlist API
- `src/lib/supabase/*` or public page server paths — admin/client column lists
- `src/app/api/leaderboard/[subdomain]/route.ts` — **delete**
- Public leaderboard / waitlist page server fetches — post-RLS read path

## Out of Scope

- Builder UI, public form rendering, settings editor, dashboard redesign, CSV (Stories 14.1–14.4)

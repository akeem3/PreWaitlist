# Story 14.4 — CSV Export, Tests, Cleanup & Doc Sync

**Status:** done
**Epic:** 14 — Qualification Engine Fix & Hardening**
**Depends on:** 14.0, 14.1, 14.2, 14.3

**Completed:** 2026-09-25 — all AC1–AC7 implemented and verified (uncommitted at time of move; gates in Phase 5 of execution). See epic doc Story 14.4 Dev Notes for the per-task implementation summary. **Prompt #3 audit (same day):** passed after 2 fixes — subscriber detail now resolves id-keyed answers to `question_text` labels (missed Epic 14 remap consumer, new static test), and the qual-page redirect mock lost a net-new TS2556 type error. Re-gates: lint 0/5, clean build, suite 481/7 = exact baseline.

## Story

As a founder, I want qualification answers in CSV export; as a maintainer, I want tests, dead-code cleanup, and docs that lock the fixed qualification behavior in.

## Acceptance Criteria (EARS)

- AC1: `GET /api/subscribers/export` shall include `qual_answers` in the select and append **one CSV column per configured question** (header = `question_text`); values resolved via `question_id`; missing answers = empty cell; free-text commas/quotes escaped per CSV rules.
- AC2: The system shall have tests covering: (a) `QualificationPanel` MC bar %/counts, free-text list, zero-response and no-questions empty states (Story 9.7 AC4 debt); (b) aggregation API happy path with id-keyed answers (12.3.4 / 9.7 AC11 debt); (c) server tier cap 400; (d) `EmailCaptureForm` posts `question_id` keys; (e) CSV includes question columns.
- AC3: Dead/duplicated code shall be removed or wired: unused `waitlist-page-content` qualification props; no remaining production path that writes text-keyed answers; hardcoded `MAX_QUESTIONS` replaced by shared tier limits.
- AC4: Overview dashboard shall not select `qual_answers` when unused (`dashboard/page.tsx`).
- AC5: Qualification page default waitlist shall be deterministic (wid param or newest — align Story 12.4.0 AC3 / "newest" intent); fix unordered `maybeSingle()` if still present.
- AC6: PRD §7.4 `qualification_questions` shall document `options jsonb`; Story 7.3 AC6 gap noted fixed in Epic 14; audit §1 gains "fixed in Epic 14" pointer; MEMORY.md gets Epic 14 row on completion.
- AC7: Lint, build, and test suite shall pass with **no new failures** (baseline: dashboard-archive 4, subscriber-table 3, flaky billing in full suite).

## Tasks

T1 (AC1) CSV qualification columns + escaping
T2 (AC2) Tests: panel, aggregation, cap, email-capture, CSV
T3 (AC3-AC5) Cleanup dead code + overview select + default waitlist
T4 (AC6) PRD / audit / MEMORY sync
T5 (AC7) Lint + build + full test run

## Dev Notes

- No dedicated CSV test file exists — add `src/__tests__/api/csv-export.test.ts` (or project convention).
- Product vision requires qual answers in export — cite in PR description.
- CSV headers are **data** (question text), not UI copy — no COPY GAP.
- Run SQL-dependent behaviors only if Supabase mock supports `options` / id keys — extend `supabase-mock` if needed (pattern from Epic 8).
- When moving story to `completed/` after execution, follow repo convention of completed stories under `docs/stories/completed/`.

## Files to Create/Modify

- `src/app/api/subscribers/export/route.ts` — question columns
- `src/__tests__/api/csv-export.test.ts` — new
- `src/__tests__/components/dashboard-qualification-page.test.tsx` — expand
- `src/__tests__/components/email-capture-form.test.tsx` — id-key assertions
- `src/__tests__/api/…` — waitlist cap test
- `src/app/dashboard/page.tsx` — drop unused `qual_answers` select
- `src/app/dashboard/qualification/page.tsx` — default waitlist
- `docs/PRD.md` §7.4, `docs/scans/engine-audit-5-engines.md` §1, `.memory/MEMORY.md`

## Out of Scope

- Other engines (broadcast, warmth, updates, leaderboard sort) — separate audit priorities

# Story 14.3 — Qualification Dashboard Redesign

**Status:** ready
**Epic:** 14 — Qualification Engine Fix & Hardening
**Depends on:** 14.0

## Story

As a founder, I want one card per qualification question with the right visualization per type — bars + % for multiple choice, a response list for free-text — so that I can act on real subscriber answers.

## Acceptance Criteria (EARS)

- AC1: `GET /api/dashboard/qualification` shall return per question `{ id, text, type, options, respondentCount, answers: [{ value, count, percent }] }` plus a top-level respondent total; aggregation keyed by `question_id`.
- AC2: `/dashboard/qualification` shall render **one card per question** (12.3.2 AC2) at dashboard content width (e.g. `max-w-6xl` pattern), not a lone `max-w-2xl` card.
- AC3: For `multiple_choice`, each card shall show horizontal bars with **count and percent of respondents** (denominator = respondents who answered that question, not `count/maxCount`); top answer `bg-accent`, others `bg-muted` (design guide).
- AC4: For `free_text`, the card shall show a **response list/table** (answer text, optional count) as the primary viz — not closed-ended frequency bars; long answers truncated with accessible full text.
- AC5: Each card shall show total **respondents** for that question (12.3.2 AC3).
- AC6: Questions with zero responses shall show **"No responses yet"** (12.3.2 AC4 verbatim).
- AC7: When no questions are configured, show **"No qualification questions configured. Add questions during onboarding to collect subscriber data."** (12.3.2 AC5 verbatim) — optional CTA label is **COPY GAP**.
- AC8: Zero/n=1 states shall never show 100%-full bars from `count/maxCount` math.
- AC9: Overview homepage embed (`dashboard/client.tsx` half-width cell) shall use the same corrected panel; long free-text labels shall not crush layout.
- AC10: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Aggregation API: id keys, percent, respondents, type/options
T2 (AC2-AC5) Panel redesign: per-question cards, MC bars, free-text list
T3 (AC6-AC7) Empty states (verbatim AC copy)
T4 (AC8-AC9) Bar math fix + overview embed parity
T5 (AC10) Lint + build

## Dev Notes

- **COPY GAP:** page subtitle/stats line, free-text list column headers, any new "N respondents" phrasing — prefer numbers + existing AC strings only.
- Tie-break secondary sort: `count desc`, then `value asc`.
- Aggregation may still read `qual_answers` client-side in the route for MVP scale (<500); select minimal columns; full SQL GROUP BY is optional (partially addresses 12.1.9 AC3).
- Loading skeleton: derive from known question count when available — avoid misleading fixed 3.
- Design source: `docs/design/dashboard-design-guide.md` §8 ASCII only (no HF SVG) — follow section hierarchy: title, respondent total, up to 5 options, show-all if needed.
- Panel file is **root** `components/dashboard/qualification-panel.tsx`.
- Empty-state / type-stats text must match 12.3.2 ACs already in `completed/story-12.3.2-dashboard-qualification.md`.

## Files to Create/Modify

- `src/app/api/dashboard/qualification/route.ts` — response shape
- `components/dashboard/qualification-panel.tsx` — redesign
- `src/app/dashboard/qualification/client.tsx` — layout width, props
- `src/app/dashboard/client.tsx` — overview embed
- `src/__tests__/components/dashboard-qualification-page.test.tsx` — extend

## Out of Scope

- Settings editor link (14.2 AC4)
- CSV export (14.4)

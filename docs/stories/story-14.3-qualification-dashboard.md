# Story 14.3 — Qualification Dashboard Redesign

**Status:** done
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

## Implementation Notes (added on completion)

**Status:** done — commits `d3843f0` (API + panel redesign), `e51dcc6` (dashboard shell redesign), `25d99f1` (brand accents). Gates green (lint 0/5, build, full suite at exact 7-failure baseline).

**Shipped beyond the original ACs**, driven by design-guide §8 + founder design decisions (2026-09-24):

- **Shared panel shell (new):** `components/dashboard/panel.tsx` exports `Panel` (chrome + optional `PanelHeader`), `PanelHeader` (h3 `.text-h4` title + `action` slot), and `panelChrome` (`rounded-[var(--card-radius)] border border-border bg-card p-5`) — adopted by `signup-chart.tsx`, `warmth-panel.tsx`, `top-referrers.tsx` for unified overview zones (founder decision: unified zones, not bento/right-rail). Structural AC9 parity.
- **`qualification-panel.tsx` variant prop** `page | overview` (default `page`):
  - **page** (qualifications route): meta line **`N respondents · M questions`** (middot, singularized: "1 respondent · 1 question" — founder-approved copy pattern) above a **2-column card grid** (`grid-cols-1 md:grid-cols-2`).
  - **overview** (dashboard embed): `Panel` titled **"Qualification Breakdown"** (guide §8, founder-approved) with meta line, **max 2 questions**, `border-t` dividers, and **"View all →"** link to `/dashboard/qualification?wid=`.
- **Per-question card:** ordinal badge (`h-5 w-5 rounded-full`) + TypeBadge chip ("Free text" / "Multiple choice") + per-card respondent count (right) + question text (`text-sm font-medium`) + viz.
- **Viz rules preserved:** MC bars only when `respondentCount >= 2` (AC8) with top answer `bg-accent`/others `bg-muted` (AC3); n=1 MC renders styled `bg-muted/40` answer rows, never 100% bars; free-text = response list with `(count)` only when `> 1` (AC4); empty = "No responses yet" (AC6) / verbatim no-questions state (AC7).
- **Overview h1:** `dashboard/client.tsx` renders non-empty `<h1 className="text-h2 text-foreground">Overview</h1>` (sidebar label — founder-approved verbatim); all card radii normalized to `rounded-[var(--card-radius)]`.
- **Brand accents (founder decision: accent green `#0F7A5E`, white cards + smart accents):**
  - ordinal badges `bg-accent/10 text-accent` (mirrors empty-state numbered circles)
  - both "View all →" links (teaser + TopReferrers parity) `text-accent hover:text-accent/80`
  - "Edit questions" solid accent CTA `bg-accent text-accent-foreground hover:bg-accent/90`
  - stat deltas via new `DeltaText` in `dashboard/client.tsx`: up (`↑`) `text-accent`, down (`↓`) `text-destructive`, flat (`—`) `text-muted-foreground`
  - `docs/design/dashboard-design-guide.md` §9 Color Rules #2–#4 amended to sanction these uses; white-card rule unchanged. Never used founder `brand_color` (public-page only).
- **Copy additions were founder-approved verbatim:** h1 "Overview", teaser title "Qualification Breakdown", meta line pattern "N respondents · M questions" — no other user-facing copy invented.

**Tests added/extended:** `dashboard-qualification-panel.test.tsx` (14 tests: AC2 grid, meta line, singularization, type badges, overview title/link, 2-question cap, badge accent, link accent), `api/qualification-aggregation.test.ts` (AC1 shape), `dashboard-qualification-page.test.tsx` (AC2 width, CTA href + solid-accent classes), `dashboard-stat-cards.test.tsx` (delta tone assertions).

## Files to Create/Modify

- `src/app/api/dashboard/qualification/route.ts` — response shape ✓ (id keys, percent, respondents, type/options, `respondentTotal`)
- `components/dashboard/qualification-panel.tsx` — redesign (variant page/overview, cards, badges, meta, teaser) ✓
- `components/dashboard/panel.tsx` — **created** shared shell (`Panel`/`PanelHeader`/`panelChrome`)
- `components/dashboard/signup-chart.tsx`, `warmth-panel.tsx`, `top-referrers.tsx` — adopted Panel shell ✓
- `src/app/dashboard/qualification/client.tsx` — layout width, props, primary CTA ✓
- `src/app/dashboard/client.tsx` — overview embed, `<h1>Overview</h1>`, `DeltaText` ✓
- `src/__tests__/components/dashboard-qualification-page.test.tsx` — extended ✓
- `src/__tests__/components/dashboard-qualification-panel.test.tsx` — extended ✓
- `src/__tests__/components/dashboard-stat-cards.test.tsx` — delta-tone test ✓
- `docs/design/dashboard-design-guide.md` §9 — Color Rules amendment ✓

## Out of Scope

- Settings editor link (14.2 AC4)
- CSV export (14.4)

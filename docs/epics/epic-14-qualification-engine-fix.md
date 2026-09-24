# Epic 14 — Qualification Engine Fix & Hardening

**Status:** in-progress
**Source:** [PRD §6.9 Step 4 Decision](../PRD.md#64-onboarding-step-4-qualification-decision-f-b1-qual-decision-variant), [PRD §6.10 Step 4a Configure Questions](../PRD.md#65-onboarding-step-4a-configure-qualification-questions-f-b1), [PRD §7.4 Data Model](../PRD.md#74-data-model--implementation-grade), [Five-Engine Audit §1](../scans/engine-audit-5-engines.md#1-qualification--%EF%B8%8F-partial-verified-rescan-confidence-97)

## Design References

| Reference                                                                             | File                                                              |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Qualification Breakdown panel (ASCII mock only — no high-fidelity SVG exists)         | `docs/design/dashboard-design-guide.md` §8 (lines 230–251)        |
| Onboarding Step 4 / 4a (no dedicated HF SVGs; flow covered by Epic 4 design analysis) | `docs/design/design-analysis.md`                                  |
| Dashboard shell / section page patterns                                               | `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg` |

## Goal

Repair the qualification engine end-to-end so founders can configure free-text **and** multiple-choice questions during onboarding **and** after launch, subscribers answer with stable `question_id`-keyed data, answers are private by default, and the dashboard renders the right visualization for each question type. The engine ships with server-enforced tier caps, CSV export of answers, post-onboarding settings editing (fulfilling the REQ-6.9.1 promise), and regression tests covering the paths that previously failed silently.

## Definition of Done

A Free founder can create up to 2 questions (Pro: 5) as free-text or multiple-choice during onboarding or later from waitlist settings; a subscriber can answer them on the public page; answers persist keyed by `question_id`; anon clients cannot read `qual_answers` (or raw emails) via PostgREST; the qualification dashboard shows per-question cards with bar charts + % + respondent totals for choice questions and a response list for free-text; CSV export includes one column per question; the orphaned leaderboard API is gone; server rejects over-cap question saves; `pnpm lint`, `pnpm build`, and the test suite pass with no new failures.

## Standing Decisions (locked — do not relitigate)

| #   | Decision                                                                                                         | Rationale                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | Add **Multiple Choice** question types; render **free-text as a response list/table**, not frequency bars        | Story 4.5 AC5 never built; survey-tool research (SurveyJS/Qualtrics/SurveyMonkey) — bars only chart closed-ended data |
| 2   | Migrate `qual_answers` keys from question **text** → **`question_id`**                                           | Story 7.3 AC6; renames/orphan/duplicate-text safety                                                                   |
| 3   | Build **post-onboarding question editor** in waitlist settings                                                   | REQ-6.9.1 copy promises it (`onboarding/4/page.tsx:183`); 12.2.2 out-scoped it circularly                             |
| 4   | **Drop `required`** — all questions always optional; remove required UI + synthesized flag                       | No DB column exists; GET synthesizes always-true; public page hardcodes false                                         |
| 5   | Close **both privacy leaks**: subscribers RLS `USING (true)` + orphaned leaderboard API returning `qual_answers` | PII exposure via anon PostgREST                                                                                       |

**Copy rule:** Agent never invents user-facing copy. Strings marked **COPY GAP** in stories require founder approval before shipping.

## Story Index

| ID   | Title                                              | Depends on | Status |
| ---- | -------------------------------------------------- | ---------- | ------ |
| 14.0 | Schema, Answer-Key Migration, Server Caps, Privacy | —          | done   |
| 14.1 | Question Builder + Public Capture (MC + free-text) | 14.0       | done   |
| 14.2 | Settings Question Editor (post-onboarding)         | 14.0, 14.1 | done   |
| 14.3 | Qualification Dashboard Redesign                   | 14.0       | done   |
| 14.4 | CSV Export, Tests, Cleanup & Doc Sync              | 14.0–14.3  | ready  |

**Execution order:** 14.0 first (foundation — run SQL before deploy). Then 14.1 + 14.3 in parallel. Then 14.2 (reuses shared editor from 14.1). Then 14.4 last.

Stories must be executed in dependency order; 14.0's migration SQL is a hard gate for every later story. Status workflow: `ready` → `in-progress` → `done` (or `blocked`).

---

### Story 14.0 — Schema, Answer-Key Migration, Server Caps, Privacy

**Status:** done
**Design Refs:** — (no SVG; infrastructure story)
**Story:** As a founder/subscriber/platform, I want qualification data modeled correctly, capped server-side, and private so that answer keys stay stable, tier rules hold under API abuse, and PII is not world-readable.

**Acceptance Criteria (EARS):**

- AC1: The system shall ship SQL (file under `docs/stories/sql-writeups/`) that: (a) adds `options jsonb` (nullable) to `qualification_questions` for multiple-choice choices; (b) leaves `question_type` CHECK as `('multiple_choice','free_text')` (already present in PRD §7.4); (c) does **not** add a `required` column.
- AC2: The migration shall rewrite every `subscribers.qual_answers` object key from matching `question_text` to the owning `qualification_questions.id` (match on `waitlist_id` + `question_text`); unmappable keys shall be dropped, not left as text keys.
- AC3: The migration shall drop the public `USING (true)` SELECT policy on `subscribers` (`epic7-story0-subscribers.sql:45-48` pattern) and replace public read paths with server-only access that never selects `qual_answers` for anonymous consumers.
- AC4: `POST /api/waitlist` and `PATCH /api/waitlist` shall reject `questions.length` above the founder's tier cap (Free=2, Pro=5) with **400** and a JSON error — server-side, reading `founder_profiles.tier`, not trusting the client.
- AC5: `POST`/`PATCH` question upsert shall persist `question_type` (`free_text` | `multiple_choice`) and, when `multiple_choice`, a non-empty `options` array (min 2 non-empty strings); `free_text` shall store `options = null`.
- AC6: `GET /api/waitlist` shall return questions as `{ id, text, type, options }` and shall **not** synthesize a `required` flag.
- AC7: The orphaned route `src/app/api/leaderboard/[subdomain]/route.ts` shall be deleted (and any tests that exclusively target it updated or removed).
- AC8: Existing public leaderboard page and any other public subscriber reads shall continue to work after RLS change (via server component/admin path or a SECURITY DEFINER RPC returning only safe columns: position, anonymized email, referral counts — never `qual_answers`, never raw email to anon).
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1–AC2) Write + run migration SQL · T2 (AC3, AC8) RLS + public read rework · T3 (AC4–AC5) Server cap + type/options validation · T4 (AC6) GET response shape · T5 (AC7) Delete orphaned leaderboard API · T6 (AC9) Lint + build

**Out of scope:** Builder UI, public form rendering, settings editor, dashboard redesign, CSV (14.1–14.4).

**Dev Notes:**

- **SQL file:** `docs/stories/sql-writeups/epic14-story0-qualification-schema.sql` — user must run in Supabase SQL Editor **before** deploying dependent code.
- **Key migration sketch:** for each waitlist, build `text → id` map from `qualification_questions`; for each subscriber with non-null `qual_answers`, remap keys; drop keys with no match.
- **RLS:** dropping public SELECT breaks any client that used anon PostgREST on `subscribers`. Audit shows public leaderboard page (`page.tsx:55,66`) and public page qualified-count use select — switch those server components to `createAdminClient()` (service role, server-only) with **explicit column lists** that exclude `qual_answers` and full email where only anonymized display is needed. Never expose service role to client.
- **Server cap:** load tier via `founder_profiles` join on `waitlists.founder_id` in POST/PATCH before insert/delete+reinsert. Use shared `getTierLimits` from `src/lib/tier-gating.ts` (currently dead — wire it here).
- **GET shape change** is breaking for Step 4a / onboarding context until 14.1 updates consumers — land 14.0 API + 14.1 UI in same release train, or feature-flag response. Prefer shipping 14.0+14.1 together.
- **Privacy related:** also stop selecting `qual_answers` on overview dashboard query if still present (`dashboard/page.tsx`) — cleanup may defer to 14.4 if not blocking RLS.

---

### Story 14.1 — Question Builder + Public Capture (MC + free-text)

**Status:** done
**Design Refs:** Onboarding Step 4a flow (Epic 4 analysis); public form via Story 7.2/7.3 patterns
**Story:** As a founder, I want to create free-text or multiple-choice questions in onboarding Step 4a so that subscribers can answer in the format that fits each question; as a subscriber, I want those questions rendered correctly with stable answer keys.

**Acceptance Criteria (EARS):**

- AC1: Step 4a shall offer a question-type control per question: **Free text** | **Multiple choice** (Story 4.5 AC5).
- AC2: When type is Multiple choice, the builder shall show an editable options list (add/remove option rows, minimum 2 options) persisted as `options` via PATCH.
- AC3: The builder shall **not** render a required/optional toggle; all questions are optional (Standing Decision 4).
- AC4: The tier cap badge shall be tier-aware — Free shows the Free cap copy, Pro shows the Pro cap copy; the hardcoded `FREE — 2 questions max` at `4a/page.tsx:136-138` shall not appear for Pro founders.
- AC5: At Free cap, "Add question" shall remain an upsell that fires `triggerUpgrade("qual_question")` (REQ-6.10.1) — preserve existing working path at `4a:195`.
- AC6: The public waitlist page shall map questions to the form as `{ id, text, type, options }` — **not** `{ text, required: false }` (`(public)/[subdomain]/page.tsx:76-79` replaced).
- AC7: `EmailCaptureForm` shall key `qual_answers` by **`question.id`** (Story 7.3 AC6); empty optional answers omitted.
- AC8: Free-text questions shall render as text inputs; multiple-choice questions shall render as radio groups (or equivalent single-select controls) with `aria` labels; only one option selectable.
- AC9: The "(optional)" indicator on the public form shall use `text-muted-foreground` (Story 7.3 AC4 / REQ-6.10.4) — replace `text-status-warm` at `email-capture-form.tsx:243`; LivePreview shall match.
- AC10: Client question cap shall use shared `getTierLimits` (or API-provided cap), not a private hardcoded `MAX_QUESTIONS` map that can drift (`email-capture-form.tsx:26-29`).
- AC11: `POST /api/subscribers` shall validate `qual_answers` keys against the waitlist's `qualification_questions.id` set; unknown keys dropped or 400 (choose drop for lenient public UX; document choice).
- AC12: LivePreview shall render MC questions as choice lists and free-text as inputs, matching public page structure (shared `WaitlistTemplateContent` / capture path where applicable).
- AC13: Wherever the example question text appears, it shall read `What are you currently using?` **verbatim** — no rephrased placeholder variant (REQ-6.10.3).
- AC14: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1–AC5) 4a builder type + options + tier badge · T2 (AC6–AC8) Public page + form id-keys + MC render · T3 (AC9–AC10) Optional color + shared caps · T4 (AC11) Subscriber API key validation · T5 (AC12–AC13) Preview parity + verbatim example copy · T6 (AC14) Lint + build

**Out of scope:** Settings editor (14.2), dashboard charts (14.3), CSV (14.4).

**Dev Notes:**

- **COPY GAP:** MC type selector labels, option row placeholders, Pro tier badge wording, any new helper text under type selector — **ask founder before shipping**.
- Builder state on `Question` interface: extend to `{ id?: string; text: string; type: "free_text" | "multiple_choice"; options?: string[] }`; drop `required`.
- Onboarding context `form.questions` type must update; flushToAPI sends `type` + `options`.
- Tests: update `email-capture-form.test.tsx:223-225` (currently cements text keys) to assert `question_id` keys; add MC render test.
- Step 4 decision page copy at `4/page.tsx:183` stays valid because 14.2 builds the settings editor — do not remove promise.

---

### Story 14.2 — Settings Question Editor (post-onboarding)

**Status:** done
**Design Refs:** Settings hub patterns (`docs` three-level hierarchy); no HF SVG for editor
**Story:** As a founder after onboarding, I want to edit my waitlist's qualification questions from settings so that the product keeps the promise made on Step 4 ("Add questions later from settings").

**Acceptance Criteria (EARS):**

- AC1: The system shall provide a waitlist-scoped settings surface for qualification questions (recommended: section under `/dashboard/[waitlistId]/settings` or `/dashboard/settings/waitlists` detail — pick existing settings hierarchy; document choice in PR).
- AC2: The editor shall reuse the same question-building UI as Step 4a (extract shared component from 14.1 — single implementation, not a fork).
- AC3: Save shall `PATCH /api/waitlist` with full `questions` array; server cap + validation from 14.0 apply.
- AC4: The qualification dashboard page shall include an **Edit questions** control that navigates to this settings surface (Story 12.3.2 AC5 CTA intent — label **COPY GAP**).
- AC5: When the waitlist has existing subscribers, editing questions that would orphan answers shall be non-destructive: `question_id` keys on old answers remain (no key rewrite on edit); renaming text is safe; deleting a question leaves orphan keys that dashboard/CSV ignore (document; no destructive cascade required).
- AC6: The editor shall enforce Free/Pro caps and fire the existing upgrade modal at Free cap (same `triggerUpgrade("qual_question")` path).
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC2) Extract shared `QuestionEditor` from 4a · T2 (AC1, AC3) Settings route + save · T3 (AC4) Dashboard CTA · T4 (AC5–AC6) Orphan safety + tier upsell · T5 (AC7) Lint + build

**Out of scope:** Changing public form behavior (already 14.1); analytics on edits.

**Dev Notes:**

- **COPY GAP:** settings section heading, description, save button, success toast, empty-state, dashboard "Edit questions" label — founder approval required.
- Circular debt to break: 12.3.2 out-scoped editing → pointed at 12.2.2; 12.2.2 out-scoped it. This story is the resolution.
- Import path gotcha: shared editor should live under `components/onboarding/` or `components/settings/` with relative imports consistent with repo (`components/` at project root).
- Depends on 14.1 for the MC/options builder UI to extract.
- **Status: implemented** (commits `d3843f0`, `25d99f1`) — AC1 choice documented here (ships to `dev`, no PR): settings surface = **qualification tab inside `/dashboard/[waitlistId]/settings`** (`src/app/dashboard/[waitlistId]/settings/client.tsx`). Shared editor extracted to root **`components/onboarding/question-editor.tsx`** (single implementation; Step 4a reduced to a consumer). PATCH made **id-preserving** in `src/app/api/waitlist/route.ts`. AC4 CTA = "Edit questions" link, styled as solid accent primary button (`bg-accent text-accent-foreground`) per design guide §9.

---

### Story 14.3 — Qualification Dashboard Redesign

**Status:** done
**Design Refs:** `docs/design/dashboard-design-guide.md` §8 Qualification Breakdown (bars, top answer accent, max-5 + Show all); Story 12.3.2 AC2–AC5
**Story:** As a founder, I want the qualification dashboard to show the right chart per question type with percentages and respondent totals so that I can act on subscriber answers.

**Acceptance Criteria (EARS):**

- AC1: `GET /api/dashboard/qualification` shall return per question: `{ id, text, type, options, respondentCount, answers: [{ value, count, percent }] }` plus a top-level total respondent count; answers aggregated by `question_id` key.
- AC2: The page shall render **one card per question** (12.3.2 AC2) on `/dashboard/qualification` with page width consistent with other dashboard sections (not `max-w-2xl` lone card — align to dashboard content width, e.g. `max-w-6xl` pattern used elsewhere).
- AC3: For `multiple_choice` questions, each card shall show horizontal bars with **count and percentage** of respondents; bar width = share of respondents (not `count/maxCount`); top answer `bg-accent`, others `bg-muted` (design guide).
- AC4: For `free_text` questions, the card shall show a **response list/table** (answer text, optional count), not closed-ended frequency bars as the primary viz (Standing Decision 1 + research); long answers truncated with accessible full text.
- AC5: Each card shall show total **respondents** for that question (12.3.2 AC3).
- AC6: Questions with zero responses shall show **"No responses yet"** (12.3.2 AC4 verbatim).
- AC7: When no questions are configured, the page shall show: **"No qualification questions configured. Add questions during onboarding to collect subscriber data."** (12.3.2 AC5 verbatim) **COPY GAP:** CTA button label if added beyond AC5 text.
- AC8: Empty/zero states and overview embed shall not show 100%-full bars for n=1 (fix `count/maxCount` bug).
- AC9: Overview homepage embed (`dashboard/client.tsx` half-width cell) shall use the same corrected panel; long free-text labels shall not crush layout.
- AC10: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Aggregation API rework (id keys, %, respondents, type) · T2 (AC2–AC5) Panel redesign MC bars + free-text list · T3 (AC6–AC7) Empty states · T4 (AC8–AC9) Overview embed + bar math · T5 (AC10) Lint + build

**Out of scope:** Settings editor link (14.2 AC4); CSV (14.4).

**Dev Notes:**

- **COPY GAP:** page subtitle/stats line, free-text list column headers, any "N respondents" formatting beyond raw number if new phrasing invented — prefer minimal: show number + existing AC strings.
- Prefer secondary sort on ties: `count desc`, then `value asc` (audit claim 16).
- Aggregation may still load subscribers with `qual_answers` for MVP scale (<500) — optional: select only needed columns; full SQL aggregation is nice-to-have, not AC (12.1.9 AC3 debt may be partially addressed by column minimization).
- Loading skeleton: match actual question count when known, or generic 1–3 groups — avoid misleading fixed 3 if trivial.
- Panel file: `components/dashboard/qualification-panel.tsx` (project root `components/`, not `src/components/`).
- **Status: implemented** (commits `d3843f0`, `e51dcc6`, `25d99f1`) — beyond the original ACs, per design-guide §8 + founder design decisions:
  - **Shared panel shell** `components/dashboard/panel.tsx` (`Panel`, `PanelHeader`, `panelChrome` = `rounded-[var(--card-radius)] border border-border bg-card p-5`) adopted by `signup-chart.tsx`, `warmth-panel.tsx`, `top-referrers.tsx` — structural AC9 parity.
  - **`qualification-panel.tsx` variant prop** `page | overview` (default `page`): page = meta line `N respondents · M questions` (middot, singularized — founder-approved copy pattern) + **2-column question-card grid**; overview = titled **"Qualification Breakdown"** panel (guide §8 title, founder-approved) + **max 2 questions** + divider `border-t` + "View all →".
  - **Per-question card** = ordinal badge + TypeBadge ("Free text"/"Multiple choice") + per-card respondent count + question text + viz (MC bars only when `respondentCount >= 2`, styled answer rows for n=1 — AC8).
  - Overview got non-empty `<h1>Overview</h1>` (`.text-h2`, sidebar label — founder-approved verbatim).
  - **Brand accents** (founder decision 2026-09-24, "keep white cards + smart accents"): ordinal badges `bg-accent/10 text-accent`, both "View all →" links `text-accent hover:text-accent/80`, "Edit questions" solid accent CTA, stat deltas up `text-accent` / down `text-destructive` / flat `text-muted-foreground` (`DeltaText` in `dashboard/client.tsx`). Guide §9 Color Rules #2–#4 amended to sanction these uses; white-card rule unchanged.
  - **Tests:** `dashboard-qualification-panel.test.tsx` (14 incl. badge/link accent), `api/qualification-aggregation.test.ts`, extended `dashboard-qualification-page.test.tsx` (incl. solid-CTA assertion), `dashboard-stat-cards.test.tsx` delta-tone assertion.

---

### Story 14.4 — CSV Export, Tests, Cleanup & Doc Sync

**Status:** ready
**Design Refs:** —
**Story:** As a founder, I want qualification answers in CSV export and as a maintainer I want tests and docs that lock the fixed behavior in.

**Acceptance Criteria (EARS):**

- AC1: `GET /api/subscribers/export` shall include `qual_answers` in the select and append **one CSV column per configured question** (header = `question_text`); values resolved via `question_id`; missing answers empty cell; CSV escaping for commas/quotes in free-text.
- AC2: The system shall have tests for: (a) `QualificationPanel` — MC bar %/counts, free-text list, zero-response and no-questions empty states (Story 9.7 AC4 debt); (b) aggregation API happy path with id-keyed answers (Story 12.3.4 / 9.7 AC11 debt); (c) server tier cap 400; (d) `EmailCaptureForm` posts `question_id` keys; (e) CSV includes question columns.
- AC3: Dead/duplicated code shall be removed or wired: unused `waitlist-page-content` qualification props; no remaining text-keyed answer production paths; hardcoded `MAX_QUESTIONS` replaced by shared limits.
- AC4: Overview dashboard query shall not select `qual_answers` when unused (`dashboard/page.tsx` waste — audit #17).
- AC5: Default waitlist selection for qualification page shall be deterministic and match Story 12.4.0 AC3 intent (**newest** / explicit `wid` param) — fix unordered `maybeSingle()` if still present.
- AC6: PRD §7.4 `qualification_questions` snippet shall document `options jsonb`; Story 7.3 AC6 status noted; audit file §1 may gain "fixed in Epic 14" pointer; MEMORY.md Epic 14 row added on completion.
- AC7: Lint, build, and `pnpm test` pass with no **new** failures (known baseline: dashboard-archive 4, subscriber-table 3, flaky billing).

**Tasks:** T1 (AC1) CSV columns · T2 (AC2) Test suite · T3 (AC3–AC5) Cleanup + default waitlist · T4 (AC6) Doc sync · T5 (AC7) Lint + build + tests

**Out of scope:** Fixing unrelated engines (broadcast/warmth/updates/leaderboard sort) — those are other audit priorities.

**Dev Notes:**

- Zero CSV tests exist today — add `src/__tests__/api/csv-export.test.ts` (or project convention).
- Vision line ~171 requires qual answers in export — cite in PR.
- Copy for CSV: headers are data (question text), not UI copy — no COPY GAP.

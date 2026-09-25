# Five-Engine Deep Scan Audit

**Date:** 2026-09-24
**Scope:** Qualification · Warmth · Leaderboard · Founder Updates · Broadcasting
**Method:** Parallel deep scans of code, docs (PRD + stories + MEMORY), and tests. Read-only — no changes made.
**Goal:** Understand how each engine currently works and whether it satisfies its worth and relevance to this app.
**Update:** Qualification + Warmth + Leaderboard + Founder Updates + Broadcasting sections re-verified via dedicated line-level rescans + web research (2026-09-24) — see §1, §2, §3, §4, and §5.

---

## Executive Summary

| Engine          | Verdict                          | One-line reason                                                                                                                                                                                                                                         |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Qualification   | ⚠️ **Partial (verified)**        | Pipeline works; dashboard renders wrong chart type for free-text (100%-bars at n=1), no post-onboarding edit, no server cap, text-keyed answers, PII exposed — full detail §1                                                                           |
| Warmth          | ⚠️ **Partial (verified)**        | Display + unit-tested pure math work; **cron never scheduled** so scores never update in prod; batch referral miscount, decay uses all events (incl. sent/delivered), 2 dead signals, Story 11.2 badge never landed on subscriber list — full detail §2 |
| Leaderboard     | ⚠️ **Partial (verified)**        | Public ✅ (rank/mask/page/neighborhood); dashboard sort inverted (test locks bug), no pagination (12.3.1 status lie), skip-the-line boost dead, RLS/API leak, quality-score meaning split three ways — full detail §3                                   |
| Founder Updates | ⚠️ **Partial (verified)**        | Works ≤100 subs single-waitlist; >100 send fails silently (batch flatten), no unsub/bounce filter, multi-waitlist `.single()` broken, no visible unsubscribe link, zero API tests — full detail §4                                                      |
| Broadcasting    | ❌ **Not functional (verified)** | Client omits `waitlist_id` → **every send 400s**; segments `.single()` breaks multi-waitlist; count ≠ eligible; zero send-path tests — full detail §5                                                                                                   |

**None of the five are fully production-ready as-is.** Broadcasting is hard-broken; Warmth doesn't run in prod; the other three work on the happy path with compliance/privacy and multi-waitlist gaps.

### Cross-cutting themes

| Theme                                                                                   | Affected engines                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-waitlist `.single()` breaks** (multi-waitlist shipped but APIs not migrated)    | Updates, Broadcast segments                                                                                                                                                                                                  |
| **RLS `USING(true)` public read leaks PII** (`qual_answers`, raw emails, update bodies) | Qualification, Leaderboard, Updates                                                                                                                                                                                          |
| **Resend Batch cap 100 mishandled**                                                     | Updates (flattened array) vs Broadcast (correct — copy this pattern)                                                                                                                                                         |
| **Zero/fake tests on critical send paths**                                              | Broadcast, Updates API, milestones, dashboard leaderboard sort                                                                                                                                                               |
| **Story marked "done" but ACs unmet**                                                   | Leaderboard pagination (12.3.1); Updates — 12.1.4 AC2 API min, 12.1.10 AC5 flow tests, 7.6 AC2 brand color (§4.7); qualification — 12.3.2 AC2-AC5, 12.4.0 AC3, 9.7 AC4/AC11, 12.1.9 AC3, 4.5 AC2/AC5-AC7, 7.3 AC4-AC6 (§1.8) |
| **Doc/MEMORY drift**                                                                    | Broadcast merge-tag claim (12.3 AC5 + MEMORY vs custom HMAC/PRD L400), leaderboard file paths, sender chain, 12.4 AC6 default, 12.3/12.4/12.5/12.6 `status: ready` in `completed/` (§5.7)                                    |

---

## 1. Qualification — ⚠️ PARTIAL (verified rescan, confidence 97%)

> **Status:** Re-verified 2026-09-24 with a dedicated line-level rescan (every claim re-read at source), full PRD + story AC cross-reference, dashboard UI analysis, and web research (survey-dashboard best practices + waitlist competitors). Supersedes the initial parallel-scan findings below.

> **Fixed in Epic 14 (2026-09-24/25, stories 14.0–14.4):** qualification debts from this §1/§1.8 audit are closed — server tier cap returns 400 (REQ-6.10.1/2), answers keyed by question `id` with server-side sanitization dropping unknown keys (Story 7.3 AC6; 14.1 AC11), Multiple Choice type + `options jsonb` persisted (Story 4.5 AC5), shared `getTierLimits` replaced the hardcoded `MAX_QUESTIONS` map (Story 7.3 AC5), settings question editor shipped (Claim 1), public `subscribers` anon SELECT revoked + orphaned leaderboard API deleted (Claim 5), panel redesigned with cards/percentages/free-text lists plus test coverage (Stories 12.3.2, 9.6/9.7 AC4/AC11), deterministic newest-first default waitlist on the qualification page (Story 12.4.0 AC3), CSV export includes qual answer columns (Vision :171), dead `waitlist-page-content` qualification props removed (Claim 6), "(optional)" now `text-muted-foreground` (Claim 12), `required` synthesis removed from GET question shape (Claim 3), subscriber detail resolves id-keyed answers to `question_text` labels (was rendering raw ids after the key remap; found + fixed by the 14.4 Prompt #3 audit). **Still open (outside Epic 14 scope):** REQ-6.10.3 placeholder copy, Story 12.1.9 AC3 aggregation full-table load, Story 9.6/9.7 AC24 expandable subscriber row, and the dashboard **overview** default waitlist still oldest-first (`dashboard/page.tsx` orders `created_at asc` + `[0]` — Claim 9 remains partial; only the qualification page was made newest-first in 14.4 AC5).

### 1.1 Claim-by-claim verification (initial scan → rescan)

| #   | Claim                                                                | Verdict                    | Evidence                                                                                                                                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | No settings UI to edit questions post-onboarding; copy promises it   | ✅ **CONFIRMED**           | `onboarding/4/page.tsx:183` verbatim: `Just email. Add questions later from settings.` Zero question-editing UI under `dashboard/**`. Story 12.2.2 Out of Scope: `qualification question editing`.                                                                                                        |
| 2   | Tier cap (Free 2/Pro 5) client-only                                  | ✅ **CONFIRMED**           | Cap in `4a/page.tsx:14-21` + `email-capture-form.tsx:26-29`. POST `route.ts:117-127` / PATCH `:228-249` insert any array length — no server check.                                                                                                                                                        |
| 3   | `required` never persisted                                           | ✅ **CONFIRMED**           | Schema `epic0.story03-supabase-schema.sql:39-45` has no `required` column. GET synthesizes `required: question_type === "free_text"` = always true (`api/waitlist/route.ts:399`). Public page hardcodes `required: false` (`(public)/[subdomain]/page.tsx:78`). Form hardcodes "(optional)".              |
| 4   | Answers keyed by question **text**, not ID                           | ✅ **CONFIRMED**           | `email-capture-form.tsx:232,236` keys by `q.text`; aggregation `dashboard/qualification/route.ts:56-57` matches `question_text`. Story 7.3 AC6 verbatim: `{ "question_id": "answer_text" }`. Test `email-capture-form.test.tsx:223-225` cements the wrong shape.                                          |
| 5   | `qual_answers` publicly exposed                                      | ✅ **CONFIRMED (refined)** | Exposure is `epic7-story0-subscribers.sql:45-48` `USING (true)` on **subscribers** (all columns → anon PostgREST), not `fix-public-read-policies.sql` as first attributed. Plus leaderboard API `route.ts:28,53` selects/returns raw `qual_answers`; public leaderboard page `page.tsx:55,66` selects it. |
| 6   | Dead code triple (tier-gating caps, unused props, `multiple_choice`) | ✅ **CONFIRMED**           | `getTierLimits`/`TIER_LIMITS` zero imports; `waitlist-page-content.tsx:21-22` props declared but not destructured (`:27-40`); `multiple_choice` only in SQL CHECK — API always writes `free_text` (`route.ts:123,242`).                                                                                   |
| 7   | CSV export omits qual answers                                        | ✅ **CONFIRMED**           | `export/route.ts:29` select omits `qual_answers`; `:58` header `Email,Name,Position,Referrals,Warmth,Signup Date`. Vision line 171 requires them.                                                                                                                                                         |
| 8   | Epic 9 AC24 expandable row dead                                      | ✅ **CONFIRMED**           | `dashboard/client.tsx` (519 lines) has no `<table>`/expand logic. Detail page `subscribers/[id]/page.tsx:122-139` shows answers only via full navigation.                                                                                                                                                 |
| 9   | Default-waitlist selection inconsistent                              | ✅ **CONFIRMED**           | Qual page `maybeSingle()` unordered (`page.tsx:24`); overview picks **oldest** (`created_at asc` + `[0]`, `dashboard/page.tsx:26,42`); shell picks **newest** (`shell.tsx:68-70`). Story 12.4.0 AC3 says newest; story's own status table admits `defaults to first`.                                     |
| 10  | Aggregation loads all subscribers into JS memory                     | ✅ **CONFIRMED**           | `dashboard/qualification/route.ts:46-65` — full select + Map count. Story 12.1.9 AC3 unmet (Dev Notes rationalized `<500 acceptable`).                                                                                                                                                                    |
| 11  | Upgrade modal wiring at Free cap                                     | ✅ **CONFIRMED — WORKS**   | `upgrade-modal.tsx:17` `qual_question` trigger; `4a:195` `triggerUpgrade("qual_question")`; `onboarding-client-layout.tsx:226-269` provides context + renders modal → Paddle checkout. End-to-end verified.                                                                                               |
| 12  | "(optional)" color mismatch                                          | ✅ **CONFIRMED**           | Form `text-status-warm` (`email-capture-form.tsx:243`) vs Story 7.3 AC4 + REQ-6.10.4 required `text-muted-foreground`; LivePreview uses `cardText` = correct on light (`live-preview.tsx:190-192,237`) — preview and public form disagree.                                                                |
| 13  | Tests thin                                                           | ✅ **CONFIRMED**           | See §1.5.                                                                                                                                                                                                                                                                                                 |

### 1.2 Data flow (verified)

```
ONBOARDING CONFIG
  /onboarding/4  → PATCH { qualification_enabled }          (page.tsx:90-96)
  /onboarding/4a → PATCH { questions: [{text, required}] }
                      client cap: get_max_questions(form.tier)  [Free 2 / Pro 5]
                      at_cap → triggerUpgrade("qual_question")  (4a:195) ✅ works
                        ↓
  POST/PATCH /api/waitlist  (route.ts)
    POST  117-127: maps {text} → {question_text, question_type:"free_text", sort_order}
                   DROPS `required` — no tier/length validation
    PATCH 228-249: DELETE all + re-insert same shape — no tier/length validation
    GET   394-401: rehydrates as { text, required: question_type === "free_text" } (= always true)

PUBLIC CAPTURE
  /[subdomain]/page.tsx:76-79  maps questions → { text, required: false }   (hardcoded!)
  EmailCaptureForm
    visibleQuestions = qualificationEnabled ? filter non-empty .slice(0, MAX_QUESTIONS[tier]||2) : []
    keys answers by q.text (232,236); always renders "(optional)" text-status-warm (243)
    body.qual_answers = non-empty answers only
                        ↓
  POST /api/subscribers (428+) — stores jsonb as-is or null (436, 527-530)
    NO key validation, NO required-answer enforcement, NO tier re-check

READ PATHS
  GET /api/dashboard/qualification?waitlist_id=
    → questions (36-40) + ALL subscribers w/ non-null qual_answers (46-50)
    → JS Map count by question_text, sort count desc (52-64)
    → { questions: [{question, answers:[{value,count}]}] } + Cache-Control 30s
  QualificationPanel → bars width = count/maxCount (NOT share of respondents)
    embedded on /dashboard (client.tsx:494-497, HALF-WIDTH 2-col grid)
    and /dashboard/qualification (client.tsx:17, max-w-2xl)
  Subscriber detail → Object.entries(qual_answers) as dl (122-139)
  CSV export → DOES NOT select/export qual_answers
  Leaderboard API → returns raw qual_answers (orphaned; only tests import it)
  Public leaderboard → selects qual_answers only for "qualified" count (83-91)
  Warmth → non-empty qual_answers → +8 score (lib/warmth.ts:41,154-156)
```

### 1.3 What's implemented (works)

| Area                                                                  | Evidence                                                              |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Schema: `qualification_questions` + `waitlists.qualification_enabled` | `epic0.story03-supabase-schema.sql:39-45` (matches PRD §7.4 :456-462) |
| RLS + public SELECT on questions (anon page read)                     | `fix-public-read-policies.sql:18-21`, PRD:543-545                     |
| Step 4 decision (enable/disable) — REQ-6.9.2/3                        | `onboarding/4/page.tsx:95,108-111` ✅ all of Story 4.4 AC1-AC9        |
| Step 4a builder (add/edit/remove, tier cap UI, required toggle)       | `onboarding/4a/page.tsx`                                              |
| **Upgrade modal at Free cap — end-to-end**                            | `4a:195` → `upgrade-modal.tsx:17` → Paddle                            |
| Persist via flushToAPI → delete+insert                                | `context.tsx:321-324`, `api/waitlist/route.ts:117-127,228-249`        |
| LivePreview shows questions + "(optional)" when `!required`           | `live-preview.tsx:237-239`                                            |
| Inline questions on public page, `aria-label` a11y                    | `email-capture-form.tsx`                                              |
| `qual_answers` captured on signup                                     | `api/subscribers/route.ts:436,527-530`                                |
| Aggregation API: auth + waitlist scoping + cache headers              | `api/dashboard/qualification/route.ts`                                |
| Waitlist scoping wiring (`?wid=` page→client→panel)                   | Story 12.4.0 AC1-AC2 ✅                                               |
| QualificationPanel: bars + loading + 2 empty states                   | `components/dashboard/qualification-panel.tsx`                        |
| Side effects: "qualified" referral count + warmth +8                  | `leaderboard/page.tsx:83-91`; `warmth.ts:41,154-156`                  |
| Subscriber detail shows answers                                       | `subscribers/[id]/page.tsx:122-139`                                   |

### 1.4 Broken / missing

| #   | Sev | Issue                                                                                                                                                            | Evidence                                      |
| --- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1   | 🔴  | **No settings UI to edit questions post-onboarding** — copy at `4/page.tsx:183` promises it; story 12.2.2 out-scoped it; 12.3.2 points back at 12.2.2 (circular) | grep `dashboard/**` = zero editor             |
| 2   | 🔴  | **Server-side tier cap not enforced** — patched client saves unlimited questions                                                                                 | POST 117-127 / PATCH 228-249, no length check |
| 3   | 🔴  | **`required` broken end-to-end** — no DB column; GET synthesizes always-true (`:399`); public page hardcodes `false` (`page.tsx:78`); form ignores flag          | schema `:39-45`                               |
| 4   | 🔴  | **Answers keyed by question text** (Story 7.3 AC6 said `question_id`) — rename orphans answers, duplicates/case-variants split buckets                           | form `:232,236`; aggregation `:56-57`         |
| 5   | 🔴  | **`qual_answers` world-readable** — `epic7-story0-subscribers.sql:45-48` `USING(true)` on all subscriber columns; leaderboard API returns raw answers            | PostgREST anon bypasses page masks            |
| 6   | 🔴  | **Dashboard UI fundamentally wrong for the data type** — exact-string free-text rendered as frequency bars (see §1.6)                                            | `qualification-panel.tsx`                     |
| 7   | 🟠  | **Story 12.3.2 AC2-AC5 unmet** — no per-question cards, no %, no respondent total, wrong empty-state copy, no edit CTA                                           | panel `:68,83,97`                             |
| 8   | 🟠  | Dead/duplicated code: `tier-gating.ts` caps never imported; `waitlist-page-content` props dead; `multiple_choice` never written/rendered                         | grep                                          |
| 9   | 🟠  | Epic 9 AC24 expandable qual row dead — subscriber table removed                                                                                                  | `dashboard/client.tsx`                        |
| 10  | 🟠  | CSV omits qual answers; **zero CSV tests**                                                                                                                       | `export/route.ts:29,58`                       |
| 11  | 🟠  | Default-waitlist: qual page unordered / overview oldest / shell newest — Story 12.4.0 AC3 unmet                                                                  | §1.1 claim 9                                  |
| 12  | 🟠  | **Hardcoded "FREE — 2 questions max" badge on Step 4a even for Pro**                                                                                             | `4a/page.tsx:136-138` **(new)**               |
| 13  | 🟡  | Aggregation loads all subscribers into JS (12.1.9 AC3 unmet)                                                                                                     | `route.ts:46-65`                              |
| 14  | 🟡  | "(optional)" color `text-status-warm` vs AC-required `text-muted-foreground`; preview and form disagree                                                          | `email-capture-form.tsx:243`                  |
| 15  | 🟡  | Required flag **flips on reload** — fresh 4a questions `false`, after GET always `true`; LivePreview "(optional)" hides post-refresh                             | `4a:30,32` vs `route.ts:399` **(new)**        |
| 16  | 🟡  | Answer tie-order unstable (Map insertion order, no secondary sort)                                                                                               | `route.ts:63` **(new)**                       |
| 17  | 🟡  | Overview loads `qual_answers` for every row but never renders it (wasted payload)                                                                                | `dashboard/page.tsx:56` **(new)**             |
| 18  | 🟡  | Story AC drift: 4.5 AC2 says **no delete** (code has delete); 4.5 AC5 MC/FT dropdown **never built**; 4.5 AC6/AC7 scaffolding defaults wrong                     | story vs `4a` **(new)**                       |

### 1.5 Tests inventory

| Test file                               | Covers                                                                                                                                                 | Gap                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `dashboard-qualification-page.test.tsx` | Heading + waitlistId prop                                                                                                                              | **Mocks the panel** — never exercises real rendering                     |
| `api/dashboard-scoping.test.ts`         | 400 when `waitlist_id` missing only                                                                                                                    | No happy-path, no auth, no distribution assertion (Story 9.7 AC11 unmet) |
| `email-capture-form.test.tsx`           | Render, gate, text-keyed body                                                                                                                          | Cements wrong AC6 shape; no color/required tests                         |
| `lib/warmth.test.ts:39-42`              | qual → +8 signal                                                                                                                                       | —                                                                        |
| **Missing entirely**                    | QualificationPanel distribution/empty states (9.7 AC4); aggregation happy path (12.3.4 AC2); **any CSV test**; server tier cap; `required` persistence | Largest holes: panel, aggregation, CSV                                   |

### 1.6 Dashboard UI deficiency analysis (the "not done right" surface)

**Page shell — `dashboard/qualification/client.tsx`**

- `mx-auto max-w-2xl px-6 py-8` (`:15`) ≈ 672px vs overview's `max-w-6xl` — one lone card in whitespace
- Heading only (`:16`) — no description, no respondent count, no "Edit questions" link
- Empty-state copy wrong vs 12.3.2 AC5; design guide's CTA (`Link to onboarding step 4a`, guide:384) missing (`:68`)
- Zero-response copy `"No answers yet"` vs AC4 `"No responses yet"` (`:83`)

**Panel — `components/dashboard/qualification-panel.tsx`**

| Deficiency                                                                                                                                         | Line                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Bar width = `count/maxCount` not share of respondents — **count=1 renders 100% full bar** (screenshot: "Good (1)" and "Great (1)" both full-width) | 76, 92               |
| **No percentage, no "N respondents"** — Story 12.3.2 AC3 requires both; label is only `{value} ({count})`                                          | 97                   |
| Free-text bucketed by exact string → 50 unique answers = 50 one-count rows in arbitrary tie order                                                  | `route.ts:57-63`     |
| No truncation — long answers `shrink-0` crush the bar / overflow                                                                                   | 87-98                |
| All bars `bg-accent` — guide says top answer accent, rest `bg-muted`                                                                               | 90                   |
| No per-question cards (AC2), no edit CTA, no drill-through to subscribers                                                                          | —                    |
| Loading skeleton always 3 question groups regardless of actual count                                                                               | 47-62                |
| On overview sits in **half-width** `md:grid-cols-2` cell — worst layout for long free-text labels                                                  | `client.tsx:493-497` |

**Vs sibling panels** (SignupChart / WarmthPanel / TopReferrers): those all have header controls or right-side links, show %, offer CTAs in empty states, and handle mobile. QualificationPanel has **none** of the three.

**Design reference status:** **No high-fidelity SVG exists** for this surface — Story 7.3 explicitly notes none; Sprint 2 folder zero matches. Only an ASCII mock in `dashboard-design-guide.md:230-251`, and the implementation diverges from _that_ too (bar colors, max-5 + "Show all →", empty-state CTA).

### 1.7 Web research — where docs/code are wrong

**What best-in-class does with free-text answers:**

| Source             | Practice                                                                                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SurveyJS Analytics | Free-text → **word clouds and response tables**; bars reserved for closed-ended; sort / hide-empty / top-N controls                                                                                        |
| Qualtrics          | Text entry → **"Open text"** field type; visualized via Text iQ topics/sentiment, response tables — **not exact-string frequency bars**; wrong-widget-for-data-type is a documented dashboard anti-pattern |
| SurveyMonkey       | Open-ended → **comment list** ("Responses" view), individual-response browse, tagging/themes, word cloud                                                                                                   |
| SmartSurvey        | Match visual to data type; KPIs top, open text below as text                                                                                                                                               |
| QuestionPro        | Word cloud for open text; show/hide empty text responses option                                                                                                                                            |

**Waitlist competitors:** KickoffLabs has "Post Signup Questions" but its dashboard shows leads/reports/referrals — no qual-answer bars. Viral Loops dashboard = participants/referrals/conversions + top influencers. **No waitlist competitor ships free-text frequency bars.**

**Factual disagreements this creates:**

1. **Category error:** engine only supports `free_text` yet renders closed-ended-style bars. **Story 4.5 AC5 (Multiple Choice vs Free-text dropdown) was the correct design and was never built.** Without choice questions there is nothing chartable.
2. **Story 12.3.2 AC3 (count + %)** — even if implemented, percentages of exact free-text buckets stay weak. Research says: free text → **response table/list**; keep bars only for choice-type questions.
3. **Text-keyed answers worsen bucketing** — case/whitespace variants split ("good" vs "Good"); renames orphan data.
4. **No respondent total, hide-empty, top-N, sort control** — all standard defaults in SurveyJS/Qualtrics/QuestionPro.
5. **Vision positions qualification as "who's serious"** (trust signal) — current surface lets a founder **act** on nothing: no drill-through, no export, no edit.

### 1.8 PRD / story AC debt

| Source          | Status                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-6.9.1-3     | ✅ copy + navigation + enable flag                                                                                                                       |
| REQ-6.10.1/2    | ⚠️ caps client-only; server accepts unlimited                                                                                                            |
| REQ-6.10.3      | ⚠️ placeholder is `e.g. "…"` not verbatim default; preview default `"Your question here"`                                                                |
| REQ-6.10.4      | ⚠️ preview correct color; **public form wrong** (`text-status-warm`)                                                                                     |
| Story 4.4 AC1-9 | ✅ all met                                                                                                                                               |
| Story 4.5       | AC1 ✅ · **AC2 ❌ (code has delete; AC said none)** · AC3/4 ⚠️ client-only · **AC5 ❌ MC/FT dropdown never built** · **AC6/AC7 ❌ scaffolding defaults** |
| Story 7.3       | **AC4 ❌ color · AC5 ❌ hardcoded MAX_QUESTIONS map · AC6 ❌ question_id keys**                                                                          |
| Story 12.3.2    | AC1 ✅ · **AC2 ❌ cards · AC3 ❌ % + totals · AC4 ❌ copy · AC5 ❌ copy/CTA · AC6 ⚠️ width**                                                             |
| Story 12.4.0    | AC1-2 ✅ · **AC3 ❌ default waitlist** (story's own status table self-contradicts)                                                                       |
| Story 9.6/9.7   | AC10-13 ⚠️ partial · **AC24 ❌ dead · AC4 ❌ panel tests · AC11 ❌ API tests**                                                                           |
| Story 12.1.9    | **AC3 ❌ full-table load still present**                                                                                                                 |
| Vision :171     | **❌ CSV omits qual answers**                                                                                                                            |

### 1.9 Verdict

**Pipeline: works end-to-end** (configure → capture → store → aggregate → display → warmth +8); upgrade modal at Free cap correctly wired.

**Product surface: unfinished on every non-happy-path dimension:**

- **Trust/accuracy** — no server cap, `required` dropped, text-keyed answers, no input validation
- **Privacy** — `qual_answers` world-readable via RLS + orphaned leaderboard API still returns it
- **Completeness** — promised post-onboarding editing never built; CSV omits the data; story AC debt across 4.5 / 7.3 / 12.3.2 / 12.4.0 / 9.6 / 9.7 / 12.1.9
- **Dashboard UX** — wrong chart type for the data, 100%-bars for n=1, no %, no totals, no cards, no CTA, wrong empty-state copy, no design SVG ever existed for it
- **Research-backed conclusion:** before polishing the panel, decide the data model — **add Multiple Choice question types** (Story 4.5 AC5, matches every survey tool's chartable path) so bars/percentages mean something; render free-text as a **response table/list** (SurveyMonkey/Qualtrics pattern), not frequency bars

### 1.10 Open questions before fix work

1. **Data model first:** add Multiple Choice question types (per Story 4.5 AC5 + research), or keep free-text-only and redesign the panel as a response table?
2. Should `required` become a real DB column, or drop the required UI and standardize always-optional?
3. Is public `qual_answers` exposure (RLS + leaderboard API) intentional, or a leak to close?
4. Migrate answer keys from question text → `question_id` (Story 7.3 AC6) — yes/no? (blocks safe question editing)
5. Post-onboarding question editing: build it (removes the broken promise at `4/page.tsx:183`), or amend the copy?
6. ~~Does 4a fire `qual_question` upgrade trigger?~~ **Resolved: yes, works end-to-end.**

---

## 2. Warmth — ⚠️ PARTIAL (verified rescan, confidence 96%)

> **Status:** Re-verified 2026-09-24 with a dedicated line-level rescan (every claim re-read at source), full story AC cross-reference (11.0–11.7 + 12.3.3), tests inventory, and web research (Resend event types, Apple MPP, lead-scoring decay practice, Vercel crons, waitlist competitors). Supersedes the initial parallel-scan findings below.

### 2.1 Claim-by-claim verification (initial scan → rescan)

| #   | Claim                                                                    | Verdict                                                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Nothing schedules `/api/cron/warmth` — scores never update in prod       | ✅ **CONFIRMED**                                            | `vercel.json` has only `git.deploymentEnabled` — no `crons` array. No `.github/` workflows, no `supabase/functions/`, no pg_cron SQL. Vercel docs: crons configured via `vercel.json` `crons[]` or dashboard/CLI — none in repo. Endpoint itself is fine (`cron/warmth/route.ts:4-28` Bearer `CRON_SECRET`).                                                                                                                                                                                                                                 |
| 2   | `batchRecalculateWarmth` mis-applies +15 referral signal                 | ✅ **CONFIRMED (mechanism refined)**                        | `warmth.ts:123-146`: `referrerIds` = referrers of subscribers **in the current 500-row page only**; count query finds all rows with those `referrer_id`s, but **updates only loop current-page rows** (`:150-175`). Subscriber S gets correct `refCount` only if ≥1 of S's referrals shares S's page. Cross-page referrals → S scored with `refCount=0`. Plus **no `.order()` on `.range()`** (`:101-104`) → unstable page order can split referrer/referral across pages.                                                                   |
| 3   | Decay day-59 boundary off-by-one                                         | ✅ **CONFIRMED**                                            | `warmth.ts:64`: `daysSince >= no_penalty_max (59)` applies −25 **at day 59**. Stories 11.1 AC3 / 11.5 AC2 both say **0–59 = no penalty**, 60–89 = −25. Should be `>= 60` (or `> 59`). `DECAY.penalty_max: 89` declared (`:15`) but **never read**.                                                                                                                                                                                                                                                                                           |
| 4   | Webhook tests missing                                                    | ✅ **CONFIRMED**                                            | Story 11.6 AC1 promises `webhook-resend.test.ts` (valid/401-idempotent/unknown-type). Glob `**/*webhook*` under `src/__tests__/` = **0 files**. Also missing: `warmth-badge`, `warmth-filter`, `warmth-panel`, `batchRecalculate`, cron tests.                                                                                                                                                                                                                                                                                               |
| 5   | Warmth depends on public URL + Vercel schedule — not local               | ✅ **CONFIRMED (documented)**                               | MEMORY Epic 12: webhooks need public URL; cron needs Vercel schedule. Accurate but understated — **prod schedule is also missing** (claim 1).                                                                                                                                                                                                                                                                                                                                                                                                |
| 6   | Badge colors: green=hot, orange=warm, blue=cold                          | ⚠️ **PARTIAL / split**                                      | `/dashboard/warmth` badge: hot=`bg-accent/10 text-accent` (green) ✅, warm=`bg-status-warm`, cold=`bg-status-cold` (`warmth/client.tsx:48-52`). **Panel bars use `bg-status-hot` (#d0492f red-orange), not green** (`warmth-panel.tsx:113,167`) — Story 11.3 AC3 requires bars = badge colors (green/amber/blue) → violated. Story 11.2 Dev Notes still reference `client.tsx:577-595` — **file is 519 lines; badge never existed on main dashboard**.                                                                                       |
| 7   | Badges in subscriber table (Story 11.2)                                  | ❌ **NOT ON SUBSCRIBER LIST**                               | Grep `WarmthBadge` → only `dashboard/warmth/client.tsx:40`. Main `dashboard/client.tsx` has **no subscriber table, no badge column, no warmth filter dropdown**. Story 11.2 AC1–AC5 target a subscriber-list column that was removed with the old dashboard table; ACs are dead as written.                                                                                                                                                                                                                                                  |
| 8   | Opens NOT tracked (Apple MPP)                                            | ✅ **CONFIRMED — code correct, vision wrong**               | Webhook maps `email.opened` → stored (`route.ts:24`) but `calculateWarmthScore` never reads `opened` (`warmth.ts:32-36` only `clicked`/`replied`). Research: MPP preloads pixels for 40–50%+ of clients (Apple legal, Email on Acid, DMA/Litmus >50–95% MPP-affected opens) — **excluding opens from scoring is right; vision Module 4 :150 ("without open tracking… Warm, not Hot") is the outdated claim**.                                                                                                                                |
| 9   | Decay starts at 60 days                                                  | ⚠️ **INTENDED but wrong at boundary + wrong event set**     | Intended 60 per MEMORY/stories; code penalizes from day **59** (claim 3). Worse: `calculateDecay` uses **max `created_at` over ALL `email_events`** (`warmth.ts:54-56`) — includes `sent`/`delivered`/`opened`. Any outbound confirmation/broadcast **resets the decay clock** even with zero engagement. Story 11.5 AC1 says engagement events only (click/reply/referral); AC3 says any `email_events.created_at` — **ACs self-contradict; code follows AC3**. Referrals never create `email_events` → **referrals do not prevent decay**. |
| 10  | Tiers: hot ≥70, warm ≥40, cold >0, unscored=null                         | ✅ **CONFIRMED**                                            | `assignTier` `warmth.ts:72-77`. Note Story 11.1 AC5 says Cold `<40` (would include 0) while AC6 says 0→Unscored — code resolves via `score > 0` + `null`. **Decayed-to-zero → null → "Unscored", not "Cold"** — cold% (warning banner `warning-banner.tsx:22`, segments, settings) systematically undercounts the most disengaged.                                                                                                                                                                                                           |
| 11  | Dead signals: `email_reply` +10, `leaderboard_visit` +5                  | ✅ **CONFIRMED**                                            | `warmth.ts:6,9,35-36`. Resend docs event types: sent/delivered/opened/clicked/bounced/complained/failed/delivery_delayed/received/scheduled/suppressed — **no reply event** (reply is inbound; `email.received` ≠ reply-to-our-send). `page_views` never inserted anywhere in `src/` (only comment at `api/profile/route.ts:212`). Story 11.1 T1 itself notes leaderboard visit "currently NOT populated".                                                                                                                                   |
| 12  | Webhook multi-waitlist misattribution                                    | ✅ **CONFIRMED (new)**                                      | `webhooks/resend/route.ts:81-86` `.eq("email",…).limit(1).single()` — same email on N waitlists → arbitrary single row receives all events. Idempotency filter `event_data->>'svix_id'` (`:97`) has **no unique constraint** (race) and no GIN index on `event_data`.                                                                                                                                                                                                                                                                        |
| 13  | Story 11.0 AC: invalid signature → 401                                   | ❌ **CODE RETURNS 400**                                     | Story 11.0:55 + 11.6 AC1/AC40 say **401**; code returns **400** on missing headers (`:42`) and invalid signature (`:58`). AC debt, not runtime bug.                                                                                                                                                                                                                                                                                                                                                                                          |
| 14  | Story 11.3 AC6 "viewing available to all founders" vs free-tier decision | ⚠️ **RECONCILED BY LATER DECISION, STORY STALE**            | 2026-09-22: free sees warmth numbers + upgrade nudge. `warmth-panel.tsx:81-135` free branch: bars + counts + "Upgrade to target segments" badge ✅. But `/dashboard/warmth` page fully Pro-gated (`warmth/page.tsx:34-42` returns fake zeros). Story 11.3 AC6 wording ("no longer locked for any tier") never updated after 12.3.3 AC6.                                                                                                                                                                                                      |
| 15  | Settings helper: "below this score… Range 20–80"                         | ❌ **WRONG COPY**                                           | `settings/client.tsx:335` verbatim. `cold_threshold` is the **cold-% warning threshold** (10-min subscribers, `warning-banner.tsx:33-36`; Story 11.4 AC1/AC5 default 40%, range 20–80%) — **not** a per-subscriber score cutoff. Tier cutoffs are hardcoded 70/40 in `assignTier`.                                                                                                                                                                                                                                                           |
| 16  | WarningBanner fallback fetch breaks without `waitlist_id`                | ✅ **CONFIRMED but dead path**                              | `warning-banner.tsx:41` `fetch("/api/dashboard/warmth")` with no `?waitlist_id=` → route returns 400 (`dashboard/warmth/route.ts:18-22`). Dashboard always passes `warmthData` prop (`client.tsx:483-486`) so fallback never runs in production UI — latent bug if prop removed.                                                                                                                                                                                                                                                             |
| 17  | Public `/api/warmth/[subdomain]` orphaned                                | ✅ **CONFIRMED**                                            | Production panel switched to `/api/dashboard/warmth` (Story 11.3 T2). Only consumer: `src/__tests__/api/warmth.test.ts`. No page/component import of the public route.                                                                                                                                                                                                                                                                                                                                                                       |
| 18  | Dashboard warmth API loads all scores into JS                            | ✅ **CONFIRMED**                                            | `dashboard/warmth/route.ts:38-47` full `select("warmth_score")` + 4× `.filter().length`. Same anti-pattern as qualification aggregation (12.1.9 AC3 debt). Cache-Control 30s present (`:56-59`).                                                                                                                                                                                                                                                                                                                                             |
| 19  | Broadcast segments consume warmth + multi-waitlist `.single()`           | ✅ **CONFIRMED**                                            | `segments/route.ts:15-19` `.single()` on waitlists (ignores `?wid=` sidebar always sends); `:25-40` counts by `warmth_score`. **No `requirePro`** — Free reads segment counts. **No unsub/bounced filter** → UI count ≠ send-time eligible (`broadcast/route.ts` filters at send). Send path itself has `requirePro` (`broadcast/route.ts:29`).                                                                                                                                                                                              |
| 20  | Story/epic status drift                                                  | ✅ **CONFIRMED**                                            | Epic 11 story index: 11.7/11.0/11.1/11.3–11.6 = `ready`, only 11.2 = `done`. Story files mostly `Status: ready` with Dev Notes `NOT STARTED` (e.g. epic :67,:140) while MEMORY table says all ✅ done. Code for 11.0–11.7 exists.                                                                                                                                                                                                                                                                                                            |
| 21  | Score stored as tier string not numeric                                  | ✅ **CONFIRMED**                                            | Column `warmth_score` text check hot/warm/cold/null; `updates.push({ warmth_score: tier })` (`warmth.ts:161`). Numeric score is transient — founders never see 0–100, only tier labels.                                                                                                                                                                                                                                                                                                                                                      |
| 22  | Theoretical max ~53 / Hot rare without opens                             | ✅ **CONFIRMED — Hot nearly unreachable for organic lists** | Weights: click+5, referral+15, qual+8, (dead +10 reply, dead +5 visit). Hot needs ≥70: e.g. 5 referrals + qual = 83, or 14 clicks. Story 11.1 notes max ~53 for one-of-each; vision's "opens get you Hot" path was never replaced. Research: waitlist peers (KickoffLabs/Viral Loops) expose **action/lead scores for founders' campaigns** but not an email-warmth tier per subscriber — differentiator intact if scoring actually runs.                                                                                                    |

### 2.2 Data flow (verified)

```
EMAIL EVENTS (partial — only outbound send → engagement)
  Resend webhook POST /api/webhooks/resend
    Svix verify (req.text() raw; invalid → 400 not 401)
    map: sent|delivered|opened|clicked|bounced|complained (+failed→bounced)
    resolve email → subscriber .limit(1).single()   ← multi-waitlist arbitrary
    idempotency: event_data->>'svix_id' filter (no unique index)
    after(): insert email_events; bounce→bounced_emails; complained→unsubscribed_at
    ✗ never inserts page_views; ✗ no reply event exists

SCORE PRODUCTION (DEAD IN PROD)
  GET /api/cron/warmth  (CRON_SECRET Bearer — endpoint ready)
    ✗ nothing in repo/dashboard schedules it (no vercel.json crons)
    → batchRecalculateWarmth()  warmth.ts:83-185
         page subscribers .range(0,499) … +500   [NO ORDER BY]
         load email_events for page ids (ALL types: sent/delivered/…)
         refCount = count referrals of referrers seen ON THIS PAGE only  ← bug
         score = clicks*5 + replies*10 + refCount*15 + qual?8 − decay
         decay: lastEvent = max(created_at) over ALL events
                ≥90d → −999 (clamp 0); ≥59d → −25; else 0   ← off-by-one
         tier = assignTier(score): ≥70 hot, ≥40 warm, >0 cold, else null
         UPDATE subscribers.warmth_score = tier  (sequential, per-row)

READ / DISPLAY
  GET /api/dashboard/warmth?waitlist_id=  → counts (auth + owner + 30s cache)
  WarningBanner (≥10 subs, cold% ≥ cold_threshold) → re-engagement CTA
  WarmthPanel 4 bars — free: numbers + upgrade badge; pro: full bars
  Overview stat card hot/warm/cold + link to /dashboard/warmth
  /dashboard/warmth table — Pro only (free: fake zeros + overlay)
  Broadcast segments: hot_warm / cold counts → send filters warmth_score
  GET /api/warmth/[subdomain] — public counts (ORPHANED; tests only)
```

### 2.3 What's implemented (works)

| Area                                                                                               | Evidence                                                                                                   |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Pure score math + clamp + tier assignment                                                          | `src/lib/warmth.ts` — 19 unit tests green (signals, clamp 0/100, decay windows 30/70/95, non-click ignore) |
| Webhook: Svix verify, raw body, after() offload, bounce/complaint side effects                     | `webhooks/resend/route.ts`                                                                                 |
| Admin client bypasses RLS for webhook/cron                                                         | `src/lib/supabase/admin.ts`                                                                                |
| Cron endpoint + CRON_SECRET auth                                                                   | `api/cron/warmth/route.ts:4-28`                                                                            |
| Schema: `warmth_score`, `email_events` + `event_data`, `cold_threshold`, `bounced_emails`          | `epic11-story7-sprint3.sql` + Story 11.7                                                                   |
| WarmthPanel: 4 bars, count+%, em-dash empty, skeleton, free numbers + upgrade nudge                | `warmth-panel.tsx`                                                                                         |
| Overview warmth stat card + `/dashboard/warmth` link (pro) / upgrade (free)                        | `dashboard/client.tsx:419-474`                                                                             |
| WarningBanner: threshold, ≥10 min, design-token warning styles, re-engagement copy                 | `warning-banner.tsx`, wired `client.tsx:483-486`                                                           |
| `/dashboard/warmth`: summary row, cold%, filter, sort, paginate, WarmthBadge, Pro gate, empty copy | `warmth/page.tsx` + `warmth/client.tsx`                                                                    |
| Settings warmth tab: `cold_threshold` input, Pro-gated edit                                        | `settings/client.tsx:293-335`                                                                              |
| Broadcast segmentation by tier + send-time `requirePro`                                            | `broadcast/route.ts:29,69-72`                                                                              |
| Free-tier decision: panel numbers visible, no lock overlay on panel                                | `warmth-panel.tsx:81-135`; MEMORY 2026-09-22                                                               |
| Dashboard warmth endpoint: auth, owner check, required `waitlist_id`, cache headers                | `dashboard/warmth/route.ts`                                                                                |

### 2.4 Broken / missing

| #   | Sev | Issue                                                                                                                                                                                                                            | Evidence                                         |
| --- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | ✅  | **Cron never scheduled** (→ fixed Epic 15.1, prod verify pending) — `batchRecalculateWarmth` never runs in production; `warmth_score` stays at whatever manual/one-off state; segments + warning + panel show stale/null         | `vercel.json` no `crons`; no workflow/pg_cron    |
| 2   | ✅  | **Batch referral count page-scoped** (→ fixed Epic 15.0) — `+15` applied only when a subscriber's referrals share their 500-row page; no `.order()` makes split worse                                                            | `warmth.ts:101-146,152`                          |
| 3   | ✅  | **Decay reads ALL email_events** (→ fixed Epic 15.0, clicked-only) — `sent`/`delivered` reset the 60-day clock; cold detection dead for anyone receiving any email; referrals never reset decay; contradicts Story 11.5 AC1      | `warmth.ts:54-56` vs `story-11.5` AC1            |
| 4   | ✅  | **Story 11.2 never delivered where written** (→ fixed Epic 15.6, ACs rewritten to warmth page) — no warmth badge column / filter on any subscriber list (main dashboard has no table); only `/dashboard/warmth` has badge+filter | grep `WarmthBadge` → 1 file                      |
| 5   | ✅  | Decay off-by-one (→ fixed Epic 15.0): −25 at day 59 (AC: 0–59 free); `penalty_max: 89` dead                                                                                                                                      | `warmth.ts:64`                                   |
| 6   | ✅  | Decayed-to-zero → **Unscored not Cold** (→ fixed Epic 15.0, force-Cold on engaged-zero) → warning/segments undercount disengaged                                                                                                 | `assignTier` `:75-76`                            |
| 7   | ✅  | **2 of 5 declared signals dead** (→ fixed Epic 15.0, weights dropped; vision amended 15.6): `email_reply` (Resend has no reply webhook), `leaderboard_visit` (`page_views` never written) — story still lists them as AC2 points | `warmth.ts:6,9`; Resend event-types docs         |
| 8   | ✅  | Webhook multi-waitlist (→ fixed Epic 15.2, SQL index run pending): `.limit(1).single()` attributes events to arbitrary waitlist; idempotency race (no unique on svix_id)                                                         | `webhooks/resend/route.ts:81-98`                 |
| 9   | ✅  | **Zero webhook / cron / batch / panel tests** (→ fixed Epic 15.5 tests + 15.2 401s) — Story 11.6 AC1/AC3/AC5 unmet; invalid-signature 401 promised vs 400 shipped                                                                | glob; story 11.6                                 |
| 10  | ✅  | Settings helper copy (→ fixed Epic 15.4) describes score cutoff; actually cold-% warning threshold                                                                                                                               | `settings/client.tsx:335`                        |
| 11  | ✅  | Segments (→ fixed Epic 15.3; bounce exclusion deferred to Epic 17.1): `.single()` multi-waitlist break, no `?wid=`, no `requirePro`, counts include unsub/bounced                                                                | `segments/route.ts`                              |
| 12  | ✅  | Hot bar `bg-status-hot` (→ fixed Epic 15.4, now `bg-accent`) ≠ Hot badge green — Story 11.3 AC3                                                                                                                                  | `warmth-panel.tsx:113` vs `warmth/client.tsx:49` |
| 13  | ✅  | Story 11.3 AC6 vs 12.3.3 AC6 + 2026-09-22 decision unreconciled in story text (→ fixed Epic 15.6 AC6)                                                                                                                            | story files                                      |
| 14  | ✅  | WarningBanner no-`waitlist_id` fallback → 400 (latent) (→ fixed Epic 15.4, props-only)                                                                                                                                           | `warning-banner.tsx:41`                          |
| 15  | 🟡  | Public warmth API orphaned                                                                                                                                                                                                       | only `api/warmth.test.ts` imports                |
| 16  | ✅  | Dashboard warmth API full-table load into JS (→ fixed Epic 15.4, head counts) (12.1.9 pattern)                                                                                                                                   | `dashboard/warmth/route.ts:38-47`                |
| 17  | ✅  | Epic/story status drift (→ fixed Epic 15.6): index `ready`, Dev Notes `NOT STARTED`, MEMORY `done`                                                                                                                               | epic-11 + story frontmatter                      |
| 18  | 🟡  | Local/dev: no webhook without public URL, no cron without Vercel — warmth untestable E2E locally                                                                                                                                 | MEMORY Epic 12                                   |
| 19  | 🟢  | Sequential per-row UPDATE in batch (N round-trips/page) — slow but correct                                                                                                                                                       | `warmth.ts:170-175`                              |
| 20  | ✅  | Story 11.0/11.6 say 401; code 400 (→ fixed Epic 15.2, code now 401; 11.6 AC1 amended 15.6)                                                                                                                                       | AC drift only                                    |

### 2.5 Tests inventory

| Test file                                          | Covers                                                                                                                                                                                                                                                                                                                                       | Gap                                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `lib/warmth.test.ts` (29 after Story 15.0)         | clicks, referrals, qual, multi-signal, clamp 0/100, decay 30/70/95d, most-recent-event, non-click ignore, assignTier bounds, day ≥60 boundary, engaged-zero Cold (15.0/15.5)                                                                                                                                                                 | no batch path in this file (see `warmth-batch.test.ts`); decay uses `clicked` only per 15.0 |
| `components/dashboard-warmth-page.test.tsx` (13)   | heading, summary, cold%, emails, badges, filter, sort, empty, pagination, Pro overlay, Never, referral counts                                                                                                                                                                                                                                | Covers `WarmthClient` only                                                                  |
| `api/warmth.test.ts` (4)                           | public `[subdomain]` counts, 404, zeros, null→unscored                                                                                                                                                                                                                                                                                       | API is **orphaned** in prod                                                                 |
| `dashboard-tier-gating.test.tsx`                   | WarmthPanel free/pro render + empty                                                                                                                                                                                                                                                                                                          | —                                                                                           |
| `dashboard-scoping.test.ts`                        | warmth GET 400 when `waitlist_id` missing                                                                                                                                                                                                                                                                                                    | —                                                                                           |
| **Missing at audit time** (→ filled by Story 15.5) | webhook route (`webhook-resend.test.ts`, 7); cron route (`cron-warmth.test.ts`, 3); batch (`warmth-batch.test.ts`, 5); **WarmthPanel** (`warmth-panel.test.tsx`, 5); **WarningBanner** (`warning-banner.test.tsx`, 5); segments (`dashboard-segments.test.ts`, 4); badge/filter → `dashboard-warmth-page.test.tsx` (not separate 11.6 files) | Remaining gap: none in warmth surface (15.5)                                                |

### 2.6 Dashboard UI deficiency analysis

**Panel — `components/dashboard/warmth-panel.tsx`**

- Free tier is a `<button>` wrapping the whole card → upgrade path; counts visible per 2026-09-22 ✅
- Hot bar `bg-status-hot` (#d0492f) vs badge `bg-accent` green — same tier, two colors (AC3)
- Unscored bar `bg-muted` — fine; but decayed-to-zero people land here instead of Cold
- No drill-through: bars not clickable → no "show me the Cold subscribers" action (vision :131 "Show me all Cold" lives only as filter on Pro `/dashboard/warmth`)

**Stat card — `dashboard/client.tsx:419-474`**

- Hot number uses `text-status-hot` (red-orange) while badge for Hot is green — inconsistent again
- Free: same numbers, upgrade CTA replaces link — matches decision

**`/dashboard/warmth` page — `warmth/client.tsx`**

- Free: fake `—` grid + opacity-50 + overlay (12.3.3 AC6) — **hides the numbers free users are told they can see on the overview**; overview vs page disagree for Free
- Warmth column header sort default `asc` puts Hot first (order map) — OK
- Full emails in table — fine for founder tool
- Last Engagement: server computes `MAX(created_at)` over **all** email_events including `sent` — same "delivered counts as engagement" lie as decay (`warmth/page.tsx:73-84`)

**Settings — `settings/client.tsx:335`**

- Helper teaches the wrong mental model (score cutoff vs list-health %)

**Design reference:** `docs/design/sprint-3-design-specs.md` S2/S3/S7 only — no high-fidelity SVG for warmth surfaces (consistent with Sprint 3 being spec-md driven).

### 2.7 Web research — where docs/code are wrong

**Searches run:** Resend webhook event types · Apple MPP open reliability · lead scoring decay thresholds · Vercel cron `vercel.json` · waitlist competitor warmth/engagement scores.

| Source                                         | Practice                                                                                                                                                                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resend docs `webhooks/event-types`             | Email events: bounced, delivery_delayed, delivered, opened, clicked, received, scheduled, sent, suppressed, complained, failed — **no `replied`**                                                                                       |
| Apple MPP legal + Email on Acid + DMA/Litmus   | Pixel preloading; MPP-affected opens commonly >50–95%; "do not use raw opens alone for engagement scoring"                                                                                                                              |
| Marketo / Pardot / Sellerlogic / Rox / Artemis | Decay on inactivity (30/60/90d windows common); **negative signals** (unsub, spam, bounce) subtract points; don't zero-out too aggressively (keep history); decay behavioral not firmographic                                           |
| Vercel Cron docs                               | Schedule = `vercel.json` `"crons": [{ path, schedule }]` or dashboard/CLI `vercel crons add`; production deploys only                                                                                                                   |
| KickoffLabs / Viral Loops                      | Rank/points/lead-score for **referral actions**; engagement segments exist in ESPs (Campaign Monitor) — **none ship per-subscriber Hot/Warm/Cold from email engagement as a waitlist product feature** — our differentiator claim holds |

**Factual disagreements this creates:**

1. **Vision Module 4 :150 is wrong:** "Elevated from v1.1 — warmth incomplete without opens; without open tracking subscriber shows Warm not Hot." Research says opens are the _least_ trustworthy signal post-MPP; **code's exclusion is correct, vision should be amended**, not the reverse. Hot rarity is a **weighting** problem (too few reachable points), not an opens problem.
2. **Story 11.1 AC2 still mandates `email_reply (+10)` and `leaderboard_visit (+5)`** that Resend/our pipeline cannot deliver — either implement inbound-reply tracking (`email.received` + threading) and page-view middleware, or **drop the weights and rewrite AC2**.
3. **Story 11.5 AC1 (engagement events only) vs AC3 (any email_events) vs code (AC3):** cold detection is structurally broken — `sent`/`delivered` are not engagement. **Code should filter to `clicked` (and `replied` if ever real); amend AC3.**
4. **No negative signals:** bounce/complaint/unsub are stored (`bounced_emails`, `unsubscribed_at`) but never subtract warmth. Industry standard: −20 spam, −30 unsub-style penalties. A bounced subscriber can still show Hot if old clicks exist.
5. **Decay shape:** single flat −25 at 60d then hard zero at 90d is cruder than industry (multiplicative or stepped 30/60/90). Acceptable for MVP **if** day-59 bug fixed and engagement-only events used; long waitlists (6–12mo) will mass-zero at 90d — MEMORY already rejected 30d decay as unfair; **90d hard reset may be equally unfair for slow launches** — consider decay-to-floor not zero.
6. **Cold vs Unscored taxonomy:** decay-to-zero → Unscored makes `cold_threshold` warning miss the coldest cohort. Research (engagement segments) treats inactive-with-history as cold/engaged-vs-not, not "unknown."
7. **Cron:** without `vercel.json` crons entry the endpoint is dead code — research confirms this is the _only_ supported scheduling path in-repo.
8. **Differentiator intact:** no waitlist competitor sells email-warmth tiers — worth fixing production pipeline before polishing UI.

### 2.8 PRD / story AC debt

| Source                                | Status                                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Story 11.0 AC1-AC8                    | ⚠️ built; **signature failure 401→code 400**; no webhook tests (11.6)                              |
| Story 11.1 AC1-AC4, AC7               | ✅ math/clamp/storage                                                                              |
| Story 11.1 AC2                        | ❌ **reply +10 and leaderboard_visit +5 unimplementable/dead**                                     |
| Story 11.1 AC3                        | ❌ **day-59 off-by-one**                                                                           |
| Story 11.1 AC5 vs AC6                 | ⚠️ Cold `<40` includes 0 vs AC6 Unscored — code follows AC6                                        |
| Story 11.1 AC8                        | ❌ **cron endpoint exists, never scheduled**                                                       |
| Story 11.2 AC1-AC5                    | ❌ **no subscriber-list badge/filter/column** — surface removed; only warmth page has badge+filter |
| Story 11.2 status `done (color bugs)` | ❌ misleading — color fix applied only on warmth page                                              |
| Story 11.3 AC1-AC2, AC4-AC5           | ✅ bars, counts+%, API, em-dash                                                                    |
| Story 11.3 AC3                        | ❌ **hot bar ≠ hot badge color**                                                                   |
| Story 11.3 AC6                        | ⚠️ panel unlocked for free ✅; page still Pro-gated (12.3.3 AC6) — stories unreconciled            |
| Story 11.4 AC1-AC6                    | ✅ banner + threshold + min-10 + settings field (copy wrong — not in AC)                           |
| Story 11.5 AC1                        | ❌ decay uses all events not engagement set                                                        |
| Story 11.5 AC2                        | ❌ off-by-one at 59                                                                                |
| Story 11.5 AC3                        | ✅ literally implemented — **but AC3 contradicts AC1**                                             |
| Story 11.5 AC4-AC6                    | ✅ zero-event, batch-applied, lint                                                                 |
| Story 11.6 AC1                        | ❌ **no webhook tests**                                                                            |
| Story 11.6 AC2                        | ✅ unit tests exist                                                                                |
| Story 11.6 AC3-AC5                    | ❌ no badge/filter/panel test files as specified (warmth-page tests partially cover)               |
| Story 11.7 AC1-AC11                   | ✅ SQL exists + applied (MEMORY)                                                                   |
| Story 12.3.3 AC1-AC9                  | ✅ all met (route, summary, table, sort, filter, Pro gate, empty, layout, lint)                    |
| Vision Module 3 :130                  | ⚠️ opens in formula — **research says remove from vision**                                         |
| Vision :131                           | ⚠️ cold filter exists only on Pro page, not main dashboard                                         |
| Vision :150                           | ❌ **outdated — amend vision**                                                                     |
| MEMORY Epic 11 table `all done`       | ❌ vs epic index `ready` / AC gaps above                                                           |

### 2.9 Verdict

**PARTIAL — display layer and pure functions are real; the production pipeline does not run, and three of five signals or decay rules are wrong.**

- **What works:** webhook ingestion (with side effects), schema, pure `calculateWarmthScore`/`assignTier` (29 tests after Story 15.0), panel/stat-card/warning/settings UI, Pro warmth page, segment-aware broadcast send, free-tier number visibility.
- **What is dead:** daily recalculation (unscheduled cron) → **in production, warmth tiers do not update**; `email_reply` and `leaderboard_visit` weights; Story 11.2 subscriber-list badge/filter (wrong surface).
- **What is wrong even if cron ran:** page-scoped referral counts, decay on `sent`/`delivered`, day-59 penalty, decay-to-Unscored, hot bar color, settings helper copy, multi-waitlist webhook attribution, segments `.single()`.
- **Research-backed:** keep excluding opens (amend vision :150); drop or implement dead signals; decay on engagement-only events; consider negative bounce/unsub signals and a non-zero decay floor for long waitlists.

**Must-fix (priority):** ① schedule cron (`vercel.json` crons + verify dashboard) ② fix batch referral counting + add `.order("id")` ③ decay only engagement events + fix day ≥60 ④ decide Cold-vs-Unscored for zero-score ⑤ webhook tests + batch tests ⑥ rewrite Story 11.2 ACs or rebuild badge on a real list ⑦ amend vision/story ACs for opens/reply/visit ⑧ segments `?wid=` + requirePro + suppression counts ⑨ settings copy.

**Update — Epic 15 (2026-09-25):** all nine must-fix items addressed — ① cron scheduled in `vercel.json` `0 5 * * *` UTC (prod dashboard verification pending) ② batch referral counting + `.order("id")` fixed (15.0) ③ clicked-only decay + day ≥60 boundary (15.0) ④ engaged-zero forced Cold (15.0) ⑤ webhook/cron/batch/panel/banner/segments tests added (15.2 + 15.5, 24 new) ⑥ Story 11.2 ACs rewritten to `/dashboard/warmth` (15.6) ⑦ vision + Story 11.1/11.5 ACs amended for opens/reply/visit (15.0 + 15.6) ⑧ segments `?wid=` + `requirePro` + unsub-excluded counts (15.3; bounce exclusion deferred to Epic 17.1) ⑨ settings copy fixed (15.4). Additionally fixed: hot bar/badge alignment, warning-banner 400, head-count API, `if (waitlist_id)` client guard (15.4); webhook 401s + multi-waitlist attribution + svix unique index (15.2, SQL run pending); status drift (15.6). **Residual debt (open):** negative bounce/unsub signals (research item 4), 90-day hard-reset floor debate (item 5), orphaned public `/api/warmth/[subdomain]` (finding 15), local webhook/cron E2E (finding 18), sequential batch updates (finding 19, 🟢), vision `:131` cold-filter surface (Pro warmth page only), Hot ≥70 calibration without opens (question 6).

### 2.10 Open questions before fix work

1. **Schedule mechanism:** add `"crons": [{ "path": "/api/cron/warmth", "schedule": "0 5 * * *" }]` to `vercel.json`, or dashboard-only cron? (Either way must verify in Vercel prod UI — not visible from repo.)
2. **Decay event set:** filter to `clicked` only, or `clicked + complained`? What about referrals — should referral activity reset decay via a derived event?
3. **Zero after decay:** keep Unscored (current) or force `cold` so warning% includes fully lapsed subscribers?
4. **Dead signals:** delete `email_reply`/`leaderboard_visit` weights + rewrite 11.1 AC2, or build inbound-reply + page-view tracking?
5. **Story 11.2:** rewrite ACs to target `/dashboard/warmth` only, or restore a subscriber table with badge column on overview?
6. **Hot threshold:** without opens, is ≥70 calibrated? Lower to ≥50, add negative signals, or accept Hot is rare until v1.1?
7. **90-day hard reset:** fair for 6-month waitlists? (MEMORY rejected 30d as unfair; 90d may need a floor.)
8. **Vision :150 + Module 3 opens:** amend vision docs now, or leave as known debt?

---

## 3. Leaderboard — ⚠️ PARTIAL (verified rescan, confidence 95%)

> **Status:** Re-verified 2026-09-24 with a dedicated line-level rescan (every claim re-read at source), full PRD + story AC cross-reference, tests inventory, and web research (waitlist competitor patterns + leaderboard UX/privacy best practices). Supersedes the initial parallel-scan findings below.

### 3.1 Claim-by-claim verification (initial scan → rescan)

| #   | Claim                                                | Verdict          | Evidence                                                                                                                                                                                                                             |
| --- | ---------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Dashboard sort double-inversion on Referrals/Quality | ✅ **CONFIRMED** | `client.tsx:107-111` desc comparators + `:121` flip + `:130` first-click `desc` → first click: arrow ↓, data ASC; second: arrow ↑, data DESC. **Rank/Name/Email/Date are correct** — only `referral_count` + `quality_score` invert. |
| 2   | Test certifies the bug + wrong comment               | ✅ **CONFIRMED** | `dashboard-leaderboard-page.test.tsx:99-112` expects `user2` first after Referrals click; comment `// referral_count=3` but `makeRows` gives user2=1.                                                                                |
| 3   | Dashboard pagination missing (12.3.1 AC5/AC6)        | ✅ **CONFIRMED** | No `page` state in `client.tsx`; footer is `` `${totalCount} subscribers` `` (`:317-320`), not “Showing 1–10 of 42”. Story file `Status: ready` vs epic `Status: done` (see §3.4).                                                   |
| 4   | Skip-the-line boost dead                             | ✅ **CONFIRMED** | `milestones.ts:133-134` sets `position:1` → `subscribers/route.ts:597` `recalculatePositions()` clobbers (order 588→597).                                                                                                            |
| 5   | RLS `USING(true)` on subscribers                     | ✅ **CONFIRMED** | `epic7-story0-subscribers.sql:45-48` — all columns, all waitlists, anon PostgREST.                                                                                                                                                   |
| 6   | API returns raw `qual_answers` + `referral_code`     | ✅ **CONFIRMED** | `api/leaderboard/[subdomain]/route.ts:28,51,53`.                                                                                                                                                                                     |
| 7   | Dashboard 7-col fixed grid, no breakpoints           | ✅ **CONFIRMED** | `client.tsx:213,280` `grid-cols-[48px_1fr_1fr_100px_100px_120px_120px]` (Name+Email = 7 cols).                                                                                                                                       |
| 8   | Dashboard full emails vs AC2 anonymized              | ✅ **CONFIRMED** | `:294` full email; test `:44-48` asserts full email. Research says AC is likely wrong — see §3.7.                                                                                                                                    |
| 9   | Quality score ≠ engagement-weighted; 3 meanings      | ✅ **CONFIRMED** | Dashboard: `page.tsx:108-111` share-of-total; public: `qualified_count` raw; vision :114: engagement-weighted (qual + open + return).                                                                                                |
| 10  | Public milestone badges never built                  | ✅ **CONFIRMED** | Story 7.5 Out of scope; no badges in `leaderboard-client.tsx`. PRD L63/72 still promise “milestone display”.                                                                                                                         |
| 11  | No leaderboard link on public waitlist page          | ✅ **CONFIRMED** | Only entry: `thank-you/page.tsx:164`. Research: industry-normal (see §3.7) — severity softened.                                                                                                                                      |
| 12  | Unauth `?subscriber_id=` reveals full local-part     | ✅ **CONFIRMED** | `leaderboard/page.tsx:100-106` — no ownership check; any UUID → full email prefix as “your” name.                                                                                                                                    |
| 13  | Zero `milestones.ts` tests                           | ✅ **CONFIRMED** | no test file; `maskName` untested directly (only `anonymizeEmail` in misleadingly named file).                                                                                                                                       |
| 14  | Doc drift (View More, design paths)                  | ✅ **CONFIRMED** | AC10 “View More” vs Prev/Next; `High-fidelity-svgs/Leaderboard.svg` **does not exist** (only `High-fidelity-Sprit2/public_leaderboard_HF3.svg`).                                                                                     |
| 15  | Dead API + unused selects                            | ✅ **CONFIRMED** | only tests import route; `milestone_rewards_enabled`, `referral_code` unused on public page.                                                                                                                                         |
| —   | N+1 clean                                            | ✅ **CONFIRMED** | public 1 query; dashboard/API 2 queries; `milestones.ts` bounded loop ≤5 tiers.                                                                                                                                                      |

### 3.2 Data flow (verified)

```
SIGNUP
  POST /api/subscribers
    ├─ generateReferralCode()  → 8-char hex from UUID (lines 23-25)
    ├─ resolve incoming referral_code → referrer_id (487-515)
    │    validates: exists, same waitlist; self-ref nullified post-insert (575-580)
    ├─ insert subscriber with referrer_id
    ├─ checkAndFulfillMilestones(referrer, count) → src/lib/milestones.ts
    │    may set position:1 for "skip the line" (milestones.ts:133-134)  ← then clobbered
    └─ recalculatePositions(waitlist) RPC → src/lib/positions.ts
         (ROW_NUMBER OVER referral_count DESC, created_at ASC)  ← clobbers boost at :597

REFERRAL COUNTING (never stored — always computed)
  • Public:   1 query + in-memory Map  (page.tsx:52-95)           (no N+1)
  • Dashboard: subscribers + batch .in("referrer_id", ids) = 2     (page.tsx:58-75)
  • API:      same 2-query pattern                                 (route.ts:26-45)

RANK DISPLAY
  • Public  /:subdomain/leaderboard → referral_count DESC, created_at ASC  (page.tsx:118-124)
              maskName (j•••m) | display_name | own-row full local-part
              PAGE_SIZE=10, NEIGHBORHOOD_SIZE=5, toggle full/neighborhood
  • Dashboard /dashboard/leaderboard → canonical rank (:120-127) + client re-sort
              (Referrals/Quality first-click INVERTED; other cols OK)
  • API GET /api/leaderboard/[subdomain] → dead code (tests only); returns qual_answers

ENTRY
  thank-you/page.tsx:164 "See where you rank →" ?subscriber_id=
  public waitlist page: no leaderboard link
```

### 3.3 What's implemented (works)

| Area                                                                           | Evidence                                                        |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Public canonical sort (referral DESC, `created_at ASC`) — Story 7.5 AC5        | `leaderboard/page.tsx:118-124`                                  |
| Masking (`maskName`: `s•••h`), `display_name` precedence, own-row reveal       | `page.tsx:12-16,102-109`                                        |
| Page-based pagination (PAGE_SIZE=10) + "Showing X–Y of Z"                      | `leaderboard-client.tsx:15,48-53,144`                           |
| Neighborhood "your position" view (5 above/below, clamped, toggle)             | `leaderboard-client.tsx:38-46,110-212` (tests)                  |
| Responsive 3/4-col grid, Quality column hidden on mobile                       | `leaderboard-client.tsx:93-105,132-134`                         |
| Tier-gated PoweredByFooter, founder-updates exclusion (REQ-6.15.4)             | `page.tsx:163-170`                                              |
| Referral engine: 8-char code gen, validated resolution, batch 2-query, 7 tests | `api/subscribers/route.ts`                                      |
| Dashboard auth + `?wid=` ownership scoping, batch counts, canonical rank       | `dashboard/leaderboard/page.tsx:16-27,58-75,120-127`            |
| Dashboard milestone progress (x/y, next tier, ✓Complete)                       | `client.tsx:58-66`                                              |
| Dashboard sortable headers + search + subscriber-detail links + CSV            | `client.tsx:22-49,138-169`                                      |
| Milestones: earn/notify-once/accumulator, congratulatory emails                | `milestones.ts:105-172`                                         |
| Public leaderboard tests green (~10 client + mask/API coverage)                | `leaderboard-client.test.tsx`, `leaderboard-mask-name.test.tsx` |

### 3.4 Broken / missing

| #   | Sev | Issue                                                                                                                                                                                                                        | Evidence                                        |
| --- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | 🔴  | **Dashboard sort double-inversion** — first click on Referrals/Quality sorts ASC while showing ↓; second click desc while ↑                                                                                                  | `client.tsx:107-111` + `:121` + `:130`          |
| 2   | 🔴  | **Test certifies the bug** — asserts inverted order with wrong comment (`user2 // referral_count=3` but user2=1)                                                                                                             | `dashboard-leaderboard-page.test.tsx:99-112`    |
| 3   | 🔴  | **Dashboard pagination missing** — Story 12.3.1 AC5/AC6 unmet; footer = "N subscribers" not "Showing 1–10 of 42"                                                                                                             | `client.tsx` (no page state)                    |
| 4   | 🔴  | **Story 12.3.1 status lie** — story file `Status: ready`, epic `Status: done`, partial code shipped (rank/sort/quality/search/CSV; no pagination; 7 cols vs AC's 5)                                                          | `story-12.3.1:3` vs `epic-12.3:73`              |
| 5   | 🔴  | **"Skip the line" position boost dead** — `milestones.ts:133-134` sets `position:1`, then `route.ts:597` `recalculatePositions()` clobbers it                                                                                | order of ops 588 → 597                          |
| 6   | 🟠  | **RLS column-level exposure** — `USING(true)` on all `subscribers` columns; anon key can `SELECT email` across all waitlists, bypassing page-level masks                                                                     | `epic7-story0-subscribers.sql:45-48`            |
| 7   | 🟠  | API route exposes raw `qual_answers` + `referral_code` publicly (also dead code)                                                                                                                                             | `api/leaderboard/[subdomain]/route.ts:28,51,53` |
| 8   | 🟠  | **Out-of-scope built:** 12.3.1 Out of scope = “CSV export, search/filter” — both implemented (scope creep)                                                                                                                   | `client.tsx:138-169,175-210`                    |
| 9   | 🟠  | **Schema myth:** AC4 treats `quality_score` as a stored column — no such column; computed per-request as share-of-total                                                                                                      | `page.tsx:108-111`                              |
| 10  | 🟠  | Dashboard mobile: fixed 7-col grid, no breakpoints/overflow — breaks <~900px                                                                                                                                                 | `client.tsx:213,280`                            |
| 11  | 🟠  | Dashboard shows **full emails**; Story 12.3.1 AC2 requires anonymized — **research says AC is wrong, code may be right** (see §3.7)                                                                                          | `client.tsx:294`                                |
| 12  | 🟡  | **"Quality score" = share of total referrals** (monotonic clone of referral count), not PRD vision's engagement-weighted formula; three different "quality" meanings across surfaces                                         | `page.tsx:108-111`, vision :114                 |
| 13  | 🟡  | PRD promises public leaderboard "milestone display"/badges — never built                                                                                                                                                     | PRD L63/72; story 7.5 deferred                  |
| 14  | 🟡  | Public waitlist page has **no leaderboard link** — research: thank-you-only is industry-normal; severity softened                                                                                                            | grep = 0 matches; §3.7                          |
| 15  | 🟡  | Unauth `?subscriber_id=` reveals another user's full email local-part if UUID leaks                                                                                                                                          | `leaderboard/page.tsx:100-106`                  |
| 16  | 🟡  | **Two mask functions diverge:** `maskName` (`j•••m`, no domain) vs `anonymizeEmail` (`j••••n@domain`); test file `leaderboard-mask-name.test.tsx` only tests `anonymizeEmail`                                                | `page.tsx:12-16`, `format.ts`                   |
| 17  | 🟡  | Zero tests for `milestones.ts`; server-rank sort untested; `maskName` only tested via copy-paste duplicate                                                                                                                   | glob                                            |
| 18  | 🟡  | **Warmth `leaderboard_visit: +5` dead** — weight declared, `page_views` never written                                                                                                                                        | `warmth.ts:9`; no insert path                   |
| 19  | 🟡  | Dashboard 7-column table exceeds 12.3.1's 5-column AC (Name column added without AC)                                                                                                                                         | `client.tsx:213`                                |
| 20  | 🟢  | Doc drift: "View More" vs Prev/Next; headers `text-body-sm` vs `text-xs`; `gap-8` vs `gap-4/md:gap-6`; wrong design path `High-fidelity-svgs/Leaderboard.svg` (file missing); stale `dashboard-referral-column` MEMORY entry | §docs cross-ref                                 |
| 21  | 🟢  | Dead code: `/api/leaderboard/[subdomain]` zero production consumers; unused selects (`milestone_rewards_enabled`, `referral_code`)                                                                                           | repo grep                                       |
| 22  | 🟢  | Epic 14 will delete leaderboard API (AC7) — dependency note for later                                                                                                                                                        | `epic-14-qualification-engine-fix.md`           |

**N+1 verdict:** ✅ clean everywhere in leaderboard path (1–2 queries); only bounded loop-query in `milestones.ts` (≤5 tiers).

### 3.5 Tests inventory

| Test file                                   | Covers                                                                                                     | Gap                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `leaderboard-client.test.tsx` (~10)         | render, referral counts, qualified count, empty, pagination, neighborhood (5 cases), toggle                | ✅ solid for public client                                     |
| `leaderboard-mask-name.test.tsx`            | `anonymizeEmail` only (misleading filename)                                                                | **`maskName` itself untested**                                 |
| `dashboard-leaderboard-page.test.tsx` (~14) | render, sort (enshrines bug), search, milestone progress, email links                                      | **No pagination tests** (feature absent); sort assertion wrong |
| `api/leaderboard.test.ts` (4)               | ranked array, empty subdomain, anonymized email in API                                                     | API is dead code; no `qual_answers` leak assertion             |
| **Missing entirely**                        | `milestones.ts` (earn/notify/skip-the-line); server-rank sort; public page RSC; skip-the-line order-of-ops | Largest holes: milestones, sort correctness                    |

### 3.6 Dashboard UI deficiency analysis (the "not done right" surface)

**Page shell — `dashboard/leaderboard/client.tsx`**

- 7-column fixed grid `grid-cols-[48px_1fr_1fr_100px_100px_120px_120px]` (`:213,280`) — no `md:`/`lg:` breakpoints, no horizontal overflow wrapper → breaks <~900px
- No pagination — renders all rows; footer is static count (`:317-320`)
- CSV Export button + search bar present but story Out of scope said neither
- Full emails in Email column (`:294`) linked to subscriber detail — fine for founder, conflicts with AC2 wording

**Sort logic (`:81-132`)**

- `referral_count` / `quality_score` comparators already DESC (`b - a`); `handleSort` first non-rank click sets `sortDir="desc"`; final `sortDir === "asc" ? cmp : -cmp` flips again → **inverted first click**
- Rank/Name/Email/Date use ASC comparators → correct on first click
- Test at `:99-112` locks the inverted expectation with a wrong comment

**Vs public leaderboard:** public has correct pagination, neighborhood view, responsive grid, masking; dashboard has none of those four and adds broken sort.

**Design reference status:** Story 12.3.1 Design Ref `docs/design/High-fidelity-svgs/Leaderboard.svg` **does not exist**. Only public SVG is `docs/design/High-fidelity-Sprit2/public_leaderboard_HF3.svg`. Dashboard leaderboard never had a high-fidelity design — only `dashboard-design-guide.md` ASCII patterns (and guide's Top Referrers panel is a different surface).

### 3.7 Web research — where docs/code are wrong

**What best-in-class does (searches: waitlist leaderboard privacy/GDPR · KickoffLabs/Viral Loops/Waitlister patterns · neighborhood/pagination UX · quality-score definition · public email display norms):**

| Source                                | Practice                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| UI Patterns / WANDR / vocab.design    | Pin reader's own row + ~5 neighbors; fetch neighborhood first; local rank > global rank     |
| Waitlister                            | Neighborhood view (“who's ahead, who's behind”), points from actions, top 3–20 configurable |
| KickoffLabs                           | Score-ordered queue persists; verified referrals; fraud flags; leaderboard on status page   |
| Catch of a Lifetime                   | Public leaderboard **opt-in default OFF**; first name + metro only; never email             |
| CheddaBoards / 1v1 / Horus / CivicFKT | Display name / gamertag public; **“email never shown publicly”**                            |
| AMTOBA / SML                          | Opt-in to online leaderboard; privacy-by-default reveal                                     |
| LaunchList                            | Leaderboard typically on thank-you/status page; some show unlocked milestone tiers          |
| ReferralHero / vision model           | Quality ≠ volume — engagement/verified behavior matters                                     |

**Factual disagreements this creates:**

1. **Public identity:** we default everyone onto the board with masked email and no opt-in. Research favors **opt-in default OFF** for any identity display. Code is better than full-email peers but lags the privacy-by-default pattern.
2. **Dashboard “anonymized email” (12.3.1 AC2):** founder dashboards need full email for outreach; anonymity is a _public_ concern. **AC is likely wrong, implementation right** — amend AC2 rather than hide founder email.
3. **Quality score three-way split:** vision :114 engagement-weighted (qual + open + return); dashboard share-of-total (= rank clone, adds zero signal); public raw qualified count. Waitlister/KickoffLabs use **points from actions**. Share-of-total should be renamed “Share %” or replaced with the vision formula — current label is a product lie.
4. **Skip-the-line:** KickoffLabs score-ordered queue is durable; our `position:1` is clobbered by RPC 9 lines later — design fights itself.
5. **Fraud:** Waitlister fingerprint/Turnstile, KickoffLabs fake-entry flags — we have none. Out of scope today; Sprint 4 risk if rewards get valuable.
6. **Milestone badges:** LaunchList notes top boards show unlocked tiers; PRD still promises them — build or edit PRD.
7. **Entry from waitlist page only via thank-you:** industry-normal (Waitlister/KickoffLabs status/thank-you) — **softens** original audit #11; not a must-fix.
8. **“View More” vs Prev/Next:** Prev/Next is fine UX; Story AC10 wording is stale, implementation OK.

**What we do better than peers:** dual public columns (referrals + “qualified”) **if** vision quality formula ships — Waitlister only shows referral counts/points; vision claim “no competitor shows both” still holds only when quality is real engagement, not share %.

### 3.8 PRD / story AC debt

| Source                       | Status                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| Story 7.5 AC1-AC9, AC11-AC13 | ✅ met (route, RSC, rank/mask/sort, responsive, empty, footer, lint)                     |
| Story 7.5 AC10               | ⚠️ "View More" → implemented as Prev/Next; counter wording differs (“Showing 1–10 of N”) |
| Story 7.5 Out of scope       | ✅ milestone badges correctly deferred; ⚠️ PRD L63/72 still promise them                 |
| Story 12.3.1 AC1             | ✅ heading + route                                                                       |
| Story 12.3.1 AC2             | ⚠️ code shows full email; research says **amend AC** not code (§3.7)                     |
| Story 12.3.1 AC3             | ✅ server rank correct; ⚠️ client re-sort inverted for Referrals/Quality                 |
| Story 12.3.1 AC4             | ⚠️ no `quality_score` column — value synthesized as share-of-total                       |
| Story 12.3.1 AC5-AC6         | ❌ pagination + “Showing X–Y of Z” **not built**                                         |
| Story 12.3.1 AC7-AC9         | ✅ empty state, layout (post-12.3.5 shell), lint                                         |
| Story 12.3.1 Out of scope    | ❌ CSV + search **built anyway** (scope creep)                                           |
| Story 12.3.1 status          | ❌ file `ready` vs epic `done` — inconsistent                                            |
| Story 12.3.4 AC1             | ⚠️ “pagination works” in test AC — no pagination tests exist                             |
| Epic 7 story 7.0 AC5         | ✅ API exists but orphaned; Epic 14.0 will delete it                                     |
| PRD L63/72                   | ⚠️ “milestone display” never built on public board                                       |
| PRD REQ-6.15.4               | ✅ no founder updates on leaderboard                                                     |
| Vision :111/:114             | ❌ engagement-weighted quality score never implemented; share-of-total substituted       |
| Vision :358                  | ⚠️ masked email (not Subscriber #142) — ✅ matches `maskName`                            |

### 3.9 Verdict

**PARTIAL — public core works; dashboard and privacy do not.**

- **Public leaderboard: YES** — ranking, masking, pagination, responsiveness, neighborhood view correct + test-backed. Deviations: AC10 wording, missing milestone badges, unauth `subscriber_id` reveal, no public-page link (industry-normal).
- **Referral engine: YES** — code gen, validation, self-ref nullification, batch pattern, 7 tests.
- **Dashboard leaderboard: PARTIAL** — sort inverted (test enshrines it), no pagination (AC5/AC6 + status lie), full emails (AC wording disputed), mobile overflow, out-of-scope CSV/search.
- **Milestones: PARTIAL** — earn/notify/progress work; skip-the-line boost dead-on-arrival; zero unit tests; public badges never built.
- **API route: orphaned** — tested but unconsumed; would leak `qual_answers` if wired.
- **Quality score: product debt** — three meanings; share-of-total is a monotonic clone of referral count and misleads under the label “Quality”.

**Must-fix (priority):** ① sort inversion + test (#1+#2) ② pagination **or** amend AC5/AC6 + fix story status (#3+#4) ③ skip-the-line order-of-ops (#5) ④ RLS/API exposure — shared with Epic 14.0 (#6+#7) ⑤ resolve quality-score definition (#12) ⑥ design-path + AC wording cleanup (#20).

### 3.10 Open questions before fix work

1. Is public leaderboard **opt-in** (research default OFF) or keep default-on with mask? (product decision)
2. Dashboard: keep full email (founder tool) and **amend 12.3.1 AC2**, or anonymize?
3. Quality score: implement vision engagement-weighted formula, or rename to “Share %” and drop the differentiation claim until warm/click data exists?
4. Pagination: build AC5/AC6, or amend story to match “show all + search” reality?
5. Skip-the-line: make RPC respect a durable boost flag, or drop string-match `position:1` hack?
6. Public milestone badges: build (PRD) or edit PRD/story (deferred)?

---

## 4. Founder Updates — ⚠️ PARTIAL (verified rescan, confidence 97%)

> **Status:** Re-verified 2026-09-24 with a dedicated line-level rescan (every claim re-read at source), full PRD + story AC cross-reference (REQ-6.15.1–4, Story 7.6/7.7/12.1.4/12.1.10), tests inventory, and web research (CAN-SPAM FTC guide, Resend Batch API limits, product-update email best practices, waitlist competitors, HTML email injection). Supersedes the initial parallel-scan findings below.

### 4.1 Claim-by-claim verification (initial scan → rescan)

| #   | Claim                                                   | Verdict                | Evidence                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | >100 subscribers → send fails silently (batch flatten)  | ✅ **CONFIRMED**       | `route.ts:131-148` loops chunks of 100 but `batchEmails.push(...emails)` flattens all into one array; single `resend.batch.send(batchEmails)` at `:151` — Resend docs: **max 100 per request**; `catch` at `:157` only `console.error`, `sent_at` stays null. Broadcast route correctly sends inside the loop (`broadcast/route.ts:111-147`).                                                                    |
| 2   | Multi-waitlist Pro founders cannot publish              | ✅ **CONFIRMED**       | `route.ts:47-53` `.single()` on waitlists by `founder_id` → 400 when 2+ rows; client sends only `{ body }` (`client.tsx:37`), no `waitlist_id`; bare `/dashboard/updates` → `page.tsx:38-41` `maybeSingle()` unordered null → redirect `/onboarding/1`.                                                                                                                                                          |
| 3   | Unsubscribe + bounce suppression NOT applied            | ✅ **CONFIRMED**       | `route.ts:79-82` selects `id, email` only — no `.is("unsubscribed_at", null)` / bounce filter; broadcast route applies both (`broadcast/route.ts:84-99`).                                                                                                                                                                                                                                                        |
| 4   | No visible unsubscribe link in email HTML (header only) | ✅ **CONFIRMED**       | HTML footer = `buildEmailFooter(waitlist.business_address)` = address only; `List-Unsubscribe` + `List-Unsubscribe-Post` headers at `:143-144` but no in-body link. CAN-SPAM requires "clear and conspicuous" mechanism.                                                                                                                                                                                         |
| 5   | Raw `${text}` HTML interpolation, unescaped             | ✅ **CONFIRMED**       | `route.ts:112` interpolates `text` into `white-space: pre-wrap` `<p>`; no `escapeHtml`/`sanitize` anywhere under `src/`.                                                                                                                                                                                                                                                                                         |
| 6   | Email send errors invisible to founder                  | ✅ **CONFIRMED**       | `route.ts:157-159` `catch { console.error }` only; API still returns `201 { id }` (`:162`); client shows **"Published!"** (`client.tsx:81`) even when send failed.                                                                                                                                                                                                                                               |
| 7   | `LatestUpdateCard` not dark-template-aware              | ✅ **CONFIRMED**       | `updates-feed.tsx:13-15` hardcoded `bg-card text-foreground border-border`; no `template` prop; white card on `dark` template.                                                                                                                                                                                                                                                                                   |
| 8   | Zero API tests; Story 12.1.10 AC5 flow tests absent     | ✅ **CONFIRMED**       | Glob `**/api/**/*update*` = 0; compose test file only checks render (textarea, button, disabled empty, char count, empty/list heading) — no `userEvent`, no fetch mock, no success-message assertion, no error-display assertion. AC5 promises "publish button calls API, success message, error display". Stale fixtures `waitlistName`/`logoUrl` in `baseProps` (`test.tsx:34-38`) not in component interface. |
| 9   | `sent_at` never surfaced                                | ✅ **CONFIRMED**       | Written at `route.ts:153-156`; all other selects use `id, body, created_at` only (page history, public latest, profile export `id, body, created_at`). Zero reads of `sent_at` in `src/`.                                                                                                                                                                                                                        |
| 10  | Pro gating + sender chain undocumented in PRD §6.15     | ✅ **CONFIRMED**       | PRD REQ-6.15.1 says "product name as the sender"; code has `requirePro` (`route.ts:28-31`) + `resolveFromAddress(senderName, productName, headline, …)` prefers `senderName` (`email.ts`). Neither documented in §6.15 (`PRD.md:372-377`).                                                                                                                                                                       |
| 11  | Stale story metadata / fixtures                         | ✅ **CONFIRMED**       | 7.6 + 7.7 frontmatter `status: ready` while in `completed/`; 12.1.4 `**Status:** ready`; 12.1.4 Out of Scope says `email sending (deferred to Epic 12)` but email shipped in 7.6; test fixtures `waitlistName`/`logoUrl` unused.                                                                                                                                                                                 |
| 12  | Client min 10 vs API min 1 validation mismatch          | ✅ **CONFIRMED (new)** | Story 12.1.4 AC2: min 10; client `isValid = charCount >= 10` (`client.tsx:25`); API only rejects empty after trim (`route.ts:36-38`) — 1–9 chars accepted if API hit directly.                                                                                                                                                                                                                                   |
| 13  | Story 7.6 AC2 brand color + headline in email NOT met   | ✅ **CONFIRMED (new)** | AC2: "branded with the waitlist's headline and brand color". Email HTML uses hardcoded `#f9fafb/#ffffff/#4b5563` (`route.ts:104-112`); no `brand_color` in waitlist select (`:50`); headline only appears in sender fallback chain, not in email body.                                                                                                                                                           |
| 14  | No confirmation before send; "Published!" overclaims    | ✅ **CONFIRMED (new)** | Compose has no `window.confirm` (broadcast has one); optimistic prepend uses local `body` + `now` as `created_at`; success copy "Published!" fires on 201 even when `sent_at` null (insert-only success).                                                                                                                                                                                                        |

### 4.2 Data flow (verified)

```
Compose UI (/dashboard/updates, Pro only)
  → POST /api/updates { body }                    ← client sends NO waitlist_id
    → auth (401) → requirePro (403) → validate body (400, non-empty, ≤2000)
                                              ↑ client enforces min 10; API accepts min 1
    → resolve founder's waitlist (.single())      ← multi-waitlist → 400 "No waitlist found"
    → INSERT founder_updates (waitlist_id, body)  [created_at = now()]
    → fetch ALL subscribers (id, email only)      ← NO unsubscribed_at / isEmailBounced filter
    → build HTML (unescaped ${text}; no brand color; no headline; address-only footer)
    → loop chunks of 100, FLATTEN into one array  ← Resend cap 100 → fail if >100
    → resend.batch.send(all)                      [marketing stream: updates@]
         per email: List-Unsubscribe header ONLY (no visible body link)
    → success: UPDATE founder_updates SET sent_at = now()
    → failure: catch → console.error only         [REQ-6.15.2 ✓ — sent_at stays NULL]
  → 201 { id }  → client shows "Published!"       ← overclaims if email failed

Public page (/:subdomain, anon via public-read RLS)
  → SELECT latest founder_updates (ORDER created_at DESC LIMIT 1)
  → render <LatestUpdateCard> ABOVE email capture form      [REQ-6.15.3 ✓]
  → no updates → nothing rendered
  → leaderboard: no updates                        [REQ-6.15.4 ✓]
  → onboarding preview: does NOT show latest update (preview ≠ public page)
```

`sent_at` is write-only: stored on success but **never selected/displayed anywhere**.

### 4.3 What's implemented (works)

| Area                                                                                                         | Evidence                                                                                  |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Schema + `sent_at` migration + founder RLS + public-read                                                     | `epic0.story03-...sql:55-60`, `epic7-story6-...sql`, `fix-public-read-policies.sql:36-39` |
| Compose page: auth, Pro gate, 10-item history, client 10–2000 validation, success/error, optimistic prepend  | `dashboard/updates/page.tsx`, `client.tsx` (Story 12.1.4 AC1–AC7)                         |
| Sidebar nav: ENGAGEMENT section, `?wid=` scoping, free lock → upgrade modal (`updates` trigger)              | `sidebar.tsx:173,309,318`                                                                 |
| POST: auth/validate/insert, HTML email, CAN-SPAM address, one-click unsubscribe header, `sent_at` on success | `api/updates/route.ts`                                                                    |
| Public display: latest-only, conditional card above form, correct typography, leaderboard exclusion          | `[subdomain]/page.tsx:62-68,118-120`; `waitlist-template-content.tsx:105-109`             |
| No edit/delete anywhere (by design)                                                                          | consistent code + docs                                                                    |
| 9 render-level tests (compose + card)                                                                        | 2 test files                                                                              |

### 4.4 Broken / missing

| #   | Sev | Issue                                                                                                                                                                                                           | Evidence                                                                      |
| --- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | 🔴  | **>100 subscribers → send fails silently** — loop slices into chunks then **flattens into one array**, single `batch.send()` (Resend cap 100). Emails never go, `sent_at` null, only `console.error`            | `route.ts:131-159` (compare correct chunking in `broadcast/route.ts:111-147`) |
| 2   | 🔴  | **Multi-waitlist Pro founders cannot publish** — `.single()` → 400; no `waitlist_id` accepted/sent; bare URL redirects to onboarding                                                                            | `route.ts:47-57`; `page.tsx:38-41`                                            |
| 3   | 🔴  | **Unsubscribe + bounce suppression NOT applied** — emails everyone (broadcast route does both correctly)                                                                                                        | `route.ts:79-82` vs `broadcast/route.ts:84-92`                                |
| 4   | 🟠  | No visible unsubscribe link in email HTML (header only) — CAN-SPAM "clear and conspicuous" + Gmail/Yahoo bulk-sender visible-link gap                                                                           | footer = `buildEmailFooter` (address only)                                    |
| 5   | 🟠  | Raw `${text}` HTML interpolation, unescaped                                                                                                                                                                     | `route.ts:112`                                                                |
| 6   | 🟠  | Email send errors invisible to founder (console only); "Published!" overclaims on insert-only success                                                                                                           | `route.ts:157-159`, `client.tsx:81`                                           |
| 7   | 🟠  | `LatestUpdateCard` not dark-template-aware (white card on dark page)                                                                                                                                            | `updates-feed.tsx:13-15`, no `template` prop                                  |
| 8   | 🟠  | Zero API tests; promised success/error flow tests absent (Story 12.1.10 AC5)                                                                                                                                    | no `api/updates` test file; compose test has no fetch/userEvent               |
| 9   | 🟠  | Story 7.6 AC2 brand color + headline not in email (hardcoded greys; no brand_color selected)                                                                                                                    | `route.ts:50,104-112`                                                         |
| 10  | 🟡  | Client min 10 vs API min 1 (Story 12.1.4 AC2 only client-enforced)                                                                                                                                              | `client.tsx:25` vs `route.ts:36-38`                                           |
| 11  | 🟡  | Subscriber fetch error → silent skip of send, still 201; `generateUnsubscribeUrl` outside `try` (missing `UNSUBSCRIBE_SECRET` → unhandled throw after insert)                                                   | `route.ts:79-84,143,150`                                                      |
| 12  | 🟡  | `sent_at` never surfaced (observability gap; REQ met but useless in practice)                                                                                                                                   | all selects use `id, body, created_at`                                        |
| 13  | 🟡  | Pro gating + sender-chain changes undocumented in PRD §6.15                                                                                                                                                     | `PRD.md:372-377`                                                              |
| 14  | 🟡  | No subject line control (always `Update from {productName}`); no CTA in email body                                                                                                                              | `route.ts:139`; research §4.6                                                 |
| 15  | 🟢  | Stale story metadata (7.6/7.7/12.1.4 `status: ready`; "email deferred"; "notify button"); stale test fixtures (`waitlistName`, `logoUrl`); `to: sub.email` string vs broadcast array (both valid, inconsistent) | story frontmatter, `route.ts:138`                                             |

**Not gaps (by design):** no edit/delete, no rich text, plain text only, no scheduling, no full on-page feed, no leaderboard display.

### 4.5 Tests inventory

| Test file                                | Covers                                                                                                                                                                 | Gap                                                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `dashboard-updates-compose.test.tsx` (6) | textarea placeholder, Publish button, disabled empty, char count, recent-list heading, empty-state                                                                     | No `userEvent` click → no API call / success / error assertions (AC5 unmet); stale `waitlistName`/`logoUrl` props |
| `latest-update-card.test.tsx` (3)        | card render, body/timestamp, no-update                                                                                                                                 | No dark-template variant                                                                                          |
| **Missing entirely**                     | `/api/updates` route (auth 401, Pro 403, validation 400, `.single()` multi-waitlist, batch chunking, suppression, `sent_at` on success/fail); HTML escaping; dark card | Batch flatten + no-suppression + min-1 bugs shipped undetected                                                    |

### 4.6 Web research — where docs/code are wrong

**Queries run:** CAN-SPAM FTC guide 16 CFR 316 unsubscribe · Resend Batch API limit 100 · product update/changelog email subject CTA best practices · waitlist competitor update feeds (KickoffLabs/Viral Loops) · HTML email injection escaping.

1. **Resend Batch API:** max **100 emails per request**; entire request fails if any address invalid or count exceeds 100. Confirms bug #1: flattened array >100 → total silent failure. Broadcast's per-chunk `send()` is the correct pattern.
2. **CAN-SPAM (FTC):** every commercial message must have a **clear and conspicuous** unsubscribe mechanism — postal address AND a functioning opt-out. `List-Unsubscribe` header is one-click for mail clients but FTC text emphasizes visible notice; Gmail/Yahoo bulk-sender rules (2024+) require a **one-click unsubscribe link in the message body** for bulk marketing. Header-only is a compliance risk on a marketing stream.
3. **Product update email best practice:** subject should be specific/benefit-oriented (not generic "Update from X"); include a **CTA button** back to the product/waitlist; keep brand color/headline for recognition. Our email: fixed subject, no CTA, no brand color — Story 7.6 AC2 half-unmet, research independently agrees.
4. **Competitors (KickoffLabs/Viral Loops):** email-first updates with optional on-page snippets; both suppress unsubscribed/bounced; both respect provider send limits. Confirms suppression gap (#3) is an industry baseline, not a nice-to-have.
5. **HTML injection:** user-authored body must be HTML-escaped before interpolation (or rendered as `textContent`). Our `${text}` into HTML is a stored-XSS vector on subscribers' mail clients (rendered HTML) — escape or use a sanitizer.

### 4.7 PRD / story AC debt

| Source                    | Status                                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| PRD REQ-6.15.1            | ⚠️ dispatch works ≤100; sender = `senderName` first (not product name); no Pro-gate mention (code enforces) |
| PRD REQ-6.15.2            | ✅ `sent_at` null on failure; ⚠️ never read back                                                            |
| PRD REQ-6.15.3            | ✅ latest-only card above form; conditional empty                                                           |
| PRD REQ-6.15.4            | ✅ leaderboard excludes updates                                                                             |
| Story 7.6 AC1             | ✅ Resend send after insert                                                                                 |
| Story 7.6 AC2             | ❌ no brand color, no headline in email; sender uses `senderName` fallback chain                            |
| Story 7.6 AC3–AC7         | ✅ sent_at column, card, empty, leaderboard, lint                                                           |
| Story 7.6 status          | ❌ frontmatter `ready` while in `completed/`                                                                |
| Story 7.7 AC1–AC7         | ✅ fetch, card, conditional, position, typography, leaderboard, lint                                        |
| Story 7.7 status          | ❌ frontmatter `ready` while in `completed/`                                                                |
| Story 12.1.4 AC1          | ✅ compose page                                                                                             |
| Story 12.1.4 AC2          | ⚠️ client min 10; API min 1                                                                                 |
| Story 12.1.4 AC3–AC7      | ✅ publish body-only, success clear, error, 10-item reverse chrono, date                                    |
| Story 12.1.4 AC8          | ✅ sidebar link enabled                                                                                     |
| Story 12.1.4 Out of Scope | ❌ "email sending deferred to Epic 12" — stale (email shipped in 7.6)                                       |
| Story 12.1.4 status       | ❌ `ready` while completed                                                                                  |
| Story 12.1.10 AC5         | ❌ promises "publish calls API, success message, error display" tests — render-only shipped                 |

### 4.8 Verdict

**PARTIAL — happy path only.** For a **single-waitlist Pro founder with ≤100 subscribers**, the full loop works and satisfies REQs 6.15.1–6.15.4: compose → store → batch email → `sent_at` → latest card above form. Schema, RLS, tier gating, CAN-SPAM address, one-click header all present.

Fails two realistic production scenarios — **lists >100** (batch limit bypassed, silent failure) and **multi-waitlist Pro accounts** (hard 400 / onboarding redirect) — and **ignores opt-outs/bounces** (compliance defect on a marketing stream). Secondary: no visible unsubscribe link, no HTML escape, founder told "Published!" when email may have failed, zero API tests let bugs #1–#3 ship.

**Minimum to green:** chunked `batch.send` per 100 (copy broadcast), `waitlist_id` end-to-end, `unsubscribed_at`/`isEmailBounced` filters, visible unsubscribe link in body, HTML-escape `${text}`, API success/error/validation/multi-waitlist tests, fix Story 7.6 AC2 brand color (or amend AC), amend stale story statuses + 12.1.10 AC5.

### 4.9 Open questions before fix work

1. Visible unsubscribe: reuse `generateUnsubscribeUrl` in body footer (mirror broadcast), or rely on header + amend compliance note?
2. Brand color/headline in email (7.6 AC2): implement (select `brand_color`, inject), or amend AC to match "minimal branded" reality?
3. Subject line: keep fixed `Update from {productName}` (consistent, low spam risk) or let founder edit (broadcast-style)?
4. Multi-waitlist: accept optional `waitlist_id` in POST body + `.eq("founder_id").eq("id")`, or require `?wid=` like dashboard APIs?
5. "Published!" copy: change to "Saved — emails sending" / surface `sent_at` failure, or keep optimistic and log only?
6. Onboarding preview: add latest-update card for preview=public parity, or document as dynamic-only (not previewable)?

### 4.10 Confidence

**97%** — every line-level claim re-read at source; AC debt checked against PRD + stories 7.6/7.7/12.1.4/12.1.10; web research confirms Resend 100-cap and CAN-SPAM visible-unsubscribe requirements. Not 100% because: Resend production failure behavior under exact >100 payload not live-tested (docs + code contrast only), and whether any email client degrades header-only unsubscribe without body link is client-dependent (research says Gmail bulk policy requires body link — not empirically verified against our sending volume).

---

## 5. Broadcasting — ❌ NOT FUNCTIONAL (verified rescan, confidence 98%)

> **Status:** Re-verified 2026-09-24 with a dedicated line-level rescan (every claim re-read at source), full PRD + story AC cross-reference (REQ-7.1a.1, PRD L123/L171, Story 12.3/12.4/12.5/12.6/12.1.8/12.2.7), tests inventory, and web research (Resend Batch API limits, `{{{RESEND_UNSUBSCRIBE_URL}}}` + Audiences dependency, Gmail/Yahoo RFC 8058 one-click unsubscribe, deliverable-vs-total recipient-count UX, founder-authored HTML email sanitization). Supersedes the initial parallel-scan findings below.

### 5.1 Claim-by-claim verification (initial scan → rescan)

| #   | Claim                                                                               | Verdict                                          | Evidence                                                                                                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Client omits `waitlist_id` → every send 400s                                        | ✅ **CONFIRMED**                                 | `client.tsx:24-26` destructure only `{ productName, senderName }` — `waitlistId` prop unused; body at `:77` = `{ subject, body, segment }`; API requires `waitlist_id` at `route.ts:35-42` → **400 on every send.** Story 12.3 T4 sketch also omitted `waitlist_id` (`story-12.3:102`) — bug inherited from story code.             |
| 2   | Segments endpoint ignores `?wid=` + `.single()` → multi-waitlist 404                | ✅ **CONFIRMED**                                 | `segments/route.ts:15-19` `.single()` by `founder_id`, no query param, no `maybeSingle`. Page accepts `?wid=` (`page.tsx:32-42`) and sidebar always attaches it — segments route cannot see it. Same pattern as Updates multi-waitlist break (§4).                                                                                  |
| 3   | Zero tests on broadcast send path                                                   | ✅ **CONFIRMED**                                 | Glob `src/__tests__/**/*broadcast*` = **0 files**. No client, route, or segments tests. Nearby coverage only: `tier-gating.test.ts` (8), `bounces.test.ts` (3), `unsubscribe.test.ts` (6) — none exercise send.                                                                                                                     |
| 4   | All batches fail → still `ok:true` + `recipient_count:0` + insert                   | ✅ **CONFIRMED**                                 | `route.ts:142-159` logs `result.error`, continues; insert always runs; response always `{ ok: true, recipient_count: totalSent }` even when `totalSent === 0`. Insert `.error` unchecked. No try/catch around `resend.batch.send` — a throw (not `result.error`) 500s unhandled.                                                    |
| 5   | `{{{RESEND_UNSUBSCRIBE_URL}}}` documented but never used                            | ✅ **CONFIRMED — docs wrong, code likely right** | Story 12.3 AC5 (`story-12.3:18`) + MEMORY:780 claim Resend merge tag. Code uses custom HMAC (`route.ts:115-136` + `email.ts:130-146` + RFC 8058 headers). PRD L398/400: **never use Resend Audiences** — merge tag requires Audiences. Custom HMAC is the correct architecture; amend Story 12.3 AC5 + MEMORY, not the code (§5.7). |
| 6   | N+1 sequential bounce lookups                                                       | ✅ **CONFIRMED**                                 | `route.ts:88-92` `for…of` + `await isEmailBounced` per subscriber — one query each. Correct suppression, poor scale on large lists.                                                                                                                                                                                                 |
| 7   | Segments API has no `requirePro`                                                    | ✅ **CONFIRMED**                                 | `segments/route.ts:4-23` auth-only. Free can read segment counts if they hit the endpoint (page/POST still gated).                                                                                                                                                                                                                  |
| 8   | Segment counts include unsub/bounced → UI ≠ send-time eligible                      | ✅ **CONFIRMED**                                 | Counts = raw `COUNT(*)` by warmth (`segments/route.ts:25-40`); send filters `unsubscribed_at` + bounce (`route.ts:84-99`). Confirm dialog uses UI count (`client.tsx:66-68`) which can overstate recipients. Klaviyo-style "expected recipients" missing (§5.6).                                                                    |
| 9   | Preview From fabricated `sarah.jones@…`                                             | ⚠️ **PARTIALLY OUTDATED**                        | Initial claim stale: 12.1.8 made local-part dynamic from `senderName` (`client.tsx:41-43`). Still wrong: hardcodes `@prewaitlist.com`, ignores `sending_domain`, never calls `resolveFromAddress()`; page doesn't select `sending_domain` (`page.tsx:36`). Story 12.1.8 AC3 was only half-met.                                      |
| 10  | Success copy ≠ AC7; "delivered" overclaims                                          | ✅ **CONFIRMED**                                 | Code: `"Sent to {n}…"` + `"has been delivered"` (`client.tsx:108-113`). Story 12.3 AC7: `"Email sent to {N} subscribers."` Batch API accepts-then-queues; "delivered" ≠ inbox delivery (§5.6).                                                                                                                                      |
| 11  | Story 12.6 AC4 `{sender_name}@{domain}` vs code `updates@{domain}`                  | ✅ **CONFIRMED (out of primary scope)**          | `email.ts:59-67` uses stream prefix `notifications`/`updates` — intentional stream separation (MEMORY:273). Contradicts 12.6 AC4 wording if that AC means local-part = sender_name. See §5.7.                                                                                                                                       |
| 12  | 12.4 AC6 default cold vs 12.1.8 default all — docs unreconciled                     | ✅ **CONFIRMED**                                 | Code default `"all"` (`client.tsx:37`) = 12.1.8 AC1 (supersedes). Story files still disagree (`story-12.4:19` vs `story-12.1.8:14`). PRD L123 agrees with code ("all").                                                                                                                                                             |
| 13  | `broadcasts` write-only — no history UI                                             | ✅ **CONFIRMED**                                 | Insert `route.ts:149-154`; zero `SELECT` on `broadcasts` in `src/`. Schema comment promises "dashboard activity feed" (`epic11-story7:26`). Insert result ignored.                                                                                                                                                                  |
| 14  | Unsubscribe page test is fake                                                       | ✅ **CONFIRMED**                                 | `unsubscribe-page.test.tsx` renders literal JSX in the test file — never imports the route/page component. False confidence. Real coverage: token unit tests in `unsubscribe.test.ts` only.                                                                                                                                         |
| 15  | Free hitting `/dashboard/broadcast` URL silently redirected                         | ✅ **CONFIRMED**                                 | `page.tsx:28-30` `redirect("/dashboard")` — no upgrade prompt. AC8 upgrade prompt only on sidebar lock click (`sidebar.tsx:307,314-325` → modal). Direct URL = silent bounce.                                                                                                                                                       |
| 16  | No server-side idempotency / double-submit guard                                    | ✅ **CONFIRMED**                                 | Only client `sending` flag (`client.tsx:31,219`). No request idempotency key (Resend batch supports one — unused). Double-click after reset or second tab can re-send.                                                                                                                                                              |
| 17  | (new) `generateUnsubscribeUrl` called twice per recipient                           | ✅ **NEW**                                       | Header path `route.ts:115` + again inside `buildBroadcastEmailFooter` (`email.ts:135`). Same token; wasteful. Throws if `UNSUBSCRIBE_SECRET` missing → 500 during map, before that chunk's send.                                                                                                                                    |
| 18  | (new) Dead `subscriberCount` prop path                                              | ✅ **NEW**                                       | Page computes count (`page.tsx:48-51,60`); client interface declares it (`client.tsx:21`) but **never destructures or uses it** — segments API is sole count source. Dead plumbing.                                                                                                                                                 |
| 19  | (new) No subject/body length caps; preview `dangerouslySetInnerHTML`                | ✅ **NEW**                                       | Client + API only `trim()` non-empty (`client.tsx:64,219`; `route.ts:44-49`). 12.1.8 Out of Scope explicitly deferred length validation. Preview HTML at `client.tsx:240-242` is founder-only (not recipient XSS) — needs sanitize, not wholesale escape (§5.6).                                                                    |
| 20  | (new) Story status lies: 12.3/12.4/12.5 frontmatter `status: ready` in `completed/` | ✅ **NEW**                                       | `story-12.3:4`, `story-12.4:4`, `story-12.5:4` all `ready`; sprint-3-plan table marks 12.3/12.4 ✅ done. Inconsistent metadata.                                                                                                                                                                                                     |

### 5.2 Data flow (verified)

```
/dashboard/broadcast (page.tsx, server)
  ├─ auth → tier gate (free → redirect /dashboard, no upgrade prompt)   ← AC8 gap for direct URL
  ├─ waitlist fetch (?wid= or maybeSingle) → subscriberCount
  └─ BroadcastClient { waitlistId, productName, …, subscriberCount }    ← waitlistId UNUSED by client
       ├─ GET /api/dashboard/broadcast/segments → {all, hot_warm, cold}
       │     auth only (no requirePro); .single() ignores ?wid=; counts raw (no unsub/bounce)
       ├─ segment pills default "all" (12.1.8 / PRD L123)
       ├─ window.confirm(activeCount)                                    ← UI count ≠ eligible count
       └─ POST /api/dashboard/broadcast {subject, body, segment}         ← NO waitlist_id → 400 EVERY TIME

POST /api/dashboard/broadcast (route.ts)
  ├─ auth (401) → requirePro (403) → waitlist_id required (400) ← fails here from real client
  ├─ subject/body trim non-empty (400); no max length
  ├─ waitlist fetch (founder-scoped, .single) → sender_name, sending_domain, business_address
  ├─ subscribers by segment (hot_warm | cold | all); unscored only in "all"
  ├─ filter unsubscribed_at + isEmailBounced (admin) — sequential N+1
  ├─ resolveFromAddress(..., "broadcast", sending_domain) → Name <updates@domain|prewaitlist.com>
  ├─ chunk eligible BATCH_SIZE=100 → resend.batch.send() per chunk   ← correct (vs Updates flatten bug)
  │    per email: raw ${emailBody} + footer (address + HMAC unsub)
  │    + List-Unsubscribe + List-Unsubscribe-Post headers (RFC 8058)
  │    generateUnsubscribeUrl called twice (header + footer)
  ├─ batch result.error → console only; totalSent += only on success; always return ok:true
  └─ insert broadcasts (result unchecked) → write-only history
```

### 5.3 What's implemented (works in code)

| Area                                                                                                 | Evidence                                                      |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Compose UI: subject/HTML/preview/segment pills/confirm/success — token-compliant                     | `broadcast/client.tsx`                                        |
| Three-layer Pro gating (sidebar lock+modal, page redirect, `requirePro` 403)                         | `sidebar.tsx:307,314-325`, `page.tsx:28-30`, `route.ts:29-32` |
| Warmth segmentation: `hot_warm` / `cold` / `all`; unscored only in "all"; default `"all"`            | `route.ts:69-73`; `client.tsx:37` (PRD L123, 12.1.8)          |
| Suppression at send time: `unsubscribed_at` + `isEmailBounced` (admin client)                        | `route.ts:84-99`                                              |
| **Correct BATCH_SIZE=100 chunking** (send inside loop) — REQ-7.1a.1                                  | `route.ts:111-147`                                            |
| Stream separation: broadcast → `updates@`, transactional → `notifications@`, custom `sending_domain` | `email.ts:59-67`                                              |
| sender_name fallback chain: senderName → productName → headline → "PreWaitlist"                      | `email.ts:53-57` (12.5 AC6)                                   |
| CAN-SPAM: address footer + **visible** HMAC unsubscribe + RFC 8058 List-Unsubscribe headers          | `route.ts:114-137`; `email.ts:130-146` (PRD L171)             |
| Unsubscribe lifecycle: one-click API, confirmation page, resubscribe                                 | `api/unsubscribe/route.ts`, `unsubscribe/page.tsx`            |
| Bounce rules: hard permanent, soft 24h                                                               | `src/lib/bounces.ts` (3 tests)                                |
| `broadcasts` table + RLS owner-only                                                                  | `epic11-story7-sprint3-schema.sql:27-50`                      |
| Tier-gating utility tests + sidebar lock → upgrade modal (`broadcast` trigger)                       | `tier-gating.test.ts`, `sidebar.tsx:314-325`                  |
| Confirmation dialog before send (12.1.8 AC2, PRD L123)                                               | `client.tsx:66-69`                                            |

### 5.4 Broken / missing

| #   | Sev | Issue                                                                                                                                                                             | Evidence                                              |
| --- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | 🔴  | **Client never sends `waitlist_id`** — prop accepted but unused; API hard-requires it → **every send 400s. Engine cannot send anything.**                                         | `client.tsx:24-26,74-78` vs `route.ts:35-42`          |
| 2   | 🔴  | Segments: no `?wid=` + `.single()` → 404/zero counts for multi-waitlist (sidebar always sends `?wid=`)                                                                            | `segments/route.ts:15-19`                             |
| 3   | 🔴  | **Zero tests** on broadcast route/client/segments — root cause #1 shipped undetected                                                                                              | glob `**/*broadcast*` = 0                             |
| 4   | 🟠  | Failure path lies: all batches fail → still `ok:true, recipient_count:0` + history row; insert error ignored; no try/catch around `batch.send` throw                              | `route.ts:140-159`                                    |
| 5   | 🟠  | Story 12.3 AC5 + MEMORY claim `{{{RESEND_UNSUBSCRIBE_URL}}}` — not implemented; **code's custom HMAC is correct** under PRD "never Audiences"; docs must be amended, not code     | docs vs `route.ts:115-136`, PRD L398/400              |
| 6   | 🟠  | Confirm count ≠ eligible count (segments omit unsub/bounce; send includes them) — founder may think they emailed N when fewer were eligible                                       | `segments/route.ts:25-40` vs `route.ts:84-99`         |
| 7   | 🟠  | N+1 sequential bounce queries per recipient                                                                                                                                       | `route.ts:88-92`                                      |
| 8   | 🟡  | Segments API no `requirePro` — Free can read counts                                                                                                                               | `segments/route.ts`                                   |
| 9   | 🟡  | Preview From: local-part from senderName but domain hardcoded `@prewaitlist.com`; ignores `sending_domain`; not `resolveFromAddress()` format; page omits `sending_domain` select | `client.tsx:41-43`; `page.tsx:36`; `email.ts:46-70`   |
| 10  | 🟡  | Success copy ≠ Story 12.3 AC7; "delivered" overclaims (accepted ≠ delivered)                                                                                                      | `client.tsx:108-113`                                  |
| 11  | 🟡  | Story 12.6 AC4 local-part wording vs `updates@`/`notifications@` stream prefixes (intentional separation)                                                                         | `email.ts:59-67` vs 12.6 AC4                          |
| 12  | 🟡  | 12.4 AC6 (default cold) vs 12.1.8 AC1 + code + PRD L123 (default all) — story docs unreconciled                                                                                   | story files + `client.tsx:37`                         |
| 13  | 🟡  | `broadcasts` written, never read — no history UI; insert result ignored                                                                                                           | `route.ts:149`                                        |
| 14  | 🟡  | Unsubscribe **page** test is fake (literal markup, no component import)                                                                                                           | `unsubscribe-page.test.tsx`                           |
| 15  | 🟡  | Free direct URL → silent `redirect("/dashboard")` — no upgrade prompt (AC8 only on sidebar)                                                                                       | `page.tsx:28-30` vs `story-12.3:21`                   |
| 16  | 🟡  | No server-side idempotency / Resend idempotency key — double-send possible                                                                                                        | `route.ts`                                            |
| 17  | 🟡  | `generateUnsubscribeUrl` ×2 per recipient; throws → 500 if `UNSUBSCRIBE_SECRET` unset                                                                                             | `route.ts:115` + `email.ts:135`; `unsubscribe.ts:3-8` |
| 18  | 🟡  | Dead `subscriberCount` prop (page fetches, client never uses)                                                                                                                     | `page.tsx:48-60`; `client.tsx:21,24-26`               |
| 19  | 🟡  | No subject/body max length (explicitly Out of Scope in 12.1.8 — still a product gap before scale)                                                                                 | `client.tsx` / `route.ts`                             |
| 20  | 🟡  | Stories 12.3/12.4/12.5 frontmatter `status: ready` while in `completed/` + sprint plan says done                                                                                  | story frontmatter                                     |

**RLS:** no defects — `broadcasts` owner-only; waitlist/subscriber reads owner-scoped on send path; bounce/unsub via admin client intentional.

**HTML body:** intentional raw interpolation (`placeholder: "HTML is supported"`) — do **not** wholesale-escape; sanitize scripts/iframes/event handlers for founder-authored HTML (§5.6).

### 5.5 Tests inventory

| Area                      | Tests                                                           | Gap                                         |
| ------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| Broadcast API route       | **0**                                                           | happy path, 400/401/403, segments, chunking |
| Broadcast client          | **0**                                                           | waitlist_id payload, confirm, success/error |
| Segments API              | **0**                                                           | wid, tier gate, counts vs eligible          |
| `email.ts` resolve/footer | **0**                                                           | stream separation, address fallback         |
| Tier gating               | 8 (`tier-gating.test.ts`)                                       | ✅ covers requirePro reason strings         |
| Bounces                   | 3 (`bounces.test.ts`)                                           | ✅ rule matrix                              |
| Unsubscribe tokens        | 6 (`unsubscribe.test.ts`)                                       | ✅ HMAC verify                              |
| Unsubscribe **page**      | 3 (`unsubscribe-page.test.tsx`) — **fake**, no component import | false confidence                            |
| Sidebar Broadcast lock    | present (sidebar tests)                                         | upgrade-modal trigger path                  |

### 5.6 Web research (broadcast-specific)

| Topic                                   | Finding                                                                                                                                                        | Implication for this codebase                                                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Resend Batch API                        | Max **100 emails/request**; entire batch can fail if any address invalid; supports optional idempotency key.                                                   | Chunking ✅ correct; still need fail-loud on `result.error`; consider idempotency key (#16).                                          |
| `{{{RESEND_UNSUBSCRIBE_URL}}}`          | Resend merge tag tied to **Audiences** contact records / marketing product.                                                                                    | Project standing decision **never use Audiences** (PRD L398/400) → custom HMAC is **correct**; Story 12.3 AC5 + MEMORY:780 are wrong. |
| Gmail/Yahoo bulk senders (≥5k/day)      | RFC 8058 `List-Unsubscribe` + `List-Unsubscribe-Post` one-click required; enforcement tightened post-2025; visible unsubscribe in body expected by users/ISPs. | Broadcast already has headers **and** visible footer link — **meets** PRD L171. Updates path does **not** (§4).                       |
| CAN-SPAM                                | Physical postal address + clear unsubscribe in every commercial email.                                                                                         | Address footer + HMAC link ✅ (broadcast).                                                                                            |
| Competitor count UX (Klaviyo/Mailchimp) | UIs show **deliverable / non-suppressed** recipient expectation before send (unsub + bounce removed), not raw list size.                                       | Segments counts should subtract unsub/bounce → "Send to N" truthful (#6).                                                             |
| Competitor sequences (KickoffLabs etc.) | Pre-launch tools emphasize full-list + segmented re-engagement; drip deferred — matches product vision.                                                        | Architecture fit OK.                                                                                                                  |
| Founder-authored HTML                   | Sanitize dangerous nodes (script/iframe/on*); do not escape all markup (destroys intended HTML email feature).                                                 | Preview + send path: sanitize, not `escapeHtml` wholesale.                                                                            |
| "Delivered" wording                     | ESPs distinguish accepted/queued vs delivered/bounced (webhook `delivered` event exists in Epic 11).                                                           | Success copy "has been delivered" overclaims before webhooks fire (#10).                                                              |

### 5.7 PRD / story AC debt

| Source             | Status                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRD L123           | ✅ default "all" + confirmation dialog — matches code                                                                                                    |
| PRD L171           | ✅ List-Unsubscribe RFC 8058 + visible link in every broadcast — matches code (headers + footer)                                                         |
| PRD REQ-7.1a.1     | ✅ Batch Send API, not Audiences — matches code; implies AC5 merge-tag wording is wrong                                                                  |
| PRD L398/400       | ✅ never Audiences — code correct; docs claiming Resend merge tag violate standing decision                                                              |
| Story 12.3 AC1     | ✅ Pro active / Free locked (sidebar)                                                                                                                    |
| Story 12.3 AC2     | ✅ compose screen (subject, HTML body, preview, send)                                                                                                    |
| Story 12.3 AC3     | ✅ "Send to {N}" via segments (dynamic) — but N is unfiltered count                                                                                      |
| Story 12.3 AC4     | ⚠️ Batch API wired but **client never reaches it** (missing waitlist_id)                                                                                 |
| Story 12.3 AC5     | ❌ `{{{RESEND_UNSUBSCRIBE_URL}}}` **not used** — **amend AC** to custom HMAC + List-Unsubscribe headers (code + PRD correct)                             |
| Story 12.3 AC6     | ✅ physical address footer                                                                                                                               |
| Story 12.3 AC7     | ⚠️ confirmation exists; wording ≠ `"Email sent to {N} subscribers."`; "delivered" overclaim                                                              |
| Story 12.3 AC8     | ⚠️ sidebar lock → upgrade modal ✅; **direct URL silent redirect** ❌                                                                                    |
| Story 12.3 AC9     | ✅ insert into `broadcasts` (result unchecked; never read)                                                                                               |
| Story 12.3 status  | ❌ frontmatter `ready` in `completed/`                                                                                                                   |
| Story 12.4 AC1-AC5 | ✅ selector, counts, filter on warmth_score, confirmation includes segment name (client sets sentSegment)                                                |
| Story 12.4 AC6     | ❌ default cold — **superseded** by 12.1.8 AC1 + PRD L123 default all; **amend or delete** 12.4 AC6                                                      |
| Story 12.4 status  | ❌ frontmatter `ready` in `completed/`                                                                                                                   |
| Story 12.5 AC3-AC6 | ✅ sender_name → resolveFromAddress fallback chain used on broadcast send path                                                                           |
| Story 12.5 status  | ❌ frontmatter `ready` in `completed/`                                                                                                                   |
| Story 12.1.8 AC1   | ✅ default "all"                                                                                                                                         |
| Story 12.1.8 AC2   | ✅ confirmation dialog (wording matches story)                                                                                                           |
| Story 12.1.8 AC3   | ⚠️ partial — dynamic local-part only; domain still hardcoded, no sending_domain, not resolveFromAddress format                                           |
| Story 12.2.7       | ✅ unsubscribe mechanism shared with broadcast HMAC links                                                                                                |
| Story 12.6         | ⚠️ status `ready` in `completed/`; AC4 local-part vs stream-prefix local-part needs wording reconcile (stream separation is the better product decision) |

### 5.8 Verdict

**NOT production-ready — hard-broken send path.**

Architecture is sound and nearly all requirements are **coded**: correct Batch-100 chunking (unlike Updates), stream separation, CAN-SPAM footer + visible HMAC unsubscribe + RFC 8058 headers, warmth segments, three-layer Pro gating, send-time unsub/bounce suppression. But:

1. **The client omits `waitlist_id` → every real send 400s.** No broadcast can go out.
2. **Segments `.single()` + no `?wid=`** breaks counts for multi-waitlist founders.
3. **Zero tests** on the send path let #1 ship.
4. **Failure handling returns success** (`ok:true`, count 0) when every batch fails.
5. **Docs lie about the unsubscribe mechanism** (Resend merge tag) in a direction that would _violate_ the standing "never Audiences" decision if "fixed" in code.

**Minimum to green:** (a) client sends `waitlist_id` (prop already present), (b) segments accepts `?wid=` + `maybeSingle`, (c) API/client tests for happy path + 400/401/403 + segment filter + chunking + total-failure, (d) fail loudly when `totalSent === 0` or all batches error, (e) amend Story 12.3 AC5 → custom HMAC, delete/amend 12.4 AC6, fix MEMORY:780/865, (f) segments counts exclude unsub/bounce (or show "of N deliverable"), (g) correct preview domain via `resolveFromAddress` + `sending_domain`.

### 5.9 Open questions before fix work

1. Fix client only, or also pass `waitlist_id` explicitly from page→client as required prop validation?
2. Segment counts: subtract unsub/bounce at query time, or show raw + "N will be skipped"?
3. Total batch failure: 502 to client vs 200 with `{ ok:false, sent:0, errors:[…] }` — which error UX?
4. Preview From: match `resolveFromAddress()` exactly (quoted display name + angle addr), or keep simplified form with correct domain?
5. History UI for `broadcasts` — build now or defer (write-only table)?
6. Idempotency: Resend idempotency key per request, or accept double-send risk for MVP?
7. Subject/body max lengths — set limits with 12.1.8's deferred validation, or leave free-form?
8. Free direct-URL: redirect as-is (current) or route through upgrade modal for AC8 completeness?

---

## Cross-Cutting Findings

### 1. Multi-waitlist `.single()` breakage

Multi-waitlist shipped in Stories 12.2.14–12.2.18, but these APIs were never migrated:

- `POST /api/updates` — `.single()` → 400 (Updates)
- `/dashboard/updates` bare URL — `maybeSingle()` null → onboarding redirect
- `GET /api/dashboard/broadcast/segments` — `.single()` → 404, zero counts
- Qualification default-waitlist selection inconsistent across pages

**Fix pattern:** accept/require `waitlist_id` or `?wid=` (as `/api/waitlist` already does).

### 2. RLS `USING(true)` PII exposure

Public-read policies added for the public page leak full columns to anyone with the anon key:

- `subscribers` — all columns (raw emails) across ALL waitlists
- `qual_answers` — returned by leaderboard API + selectable on public leaderboard
- `founder_updates`, `qualification_questions`, `milestone_rewards` — same pattern

App-level queries scope correctly, but PostgREST bypasses every page-level mask. **Highest-impact architectural issue.** Consider column-level grants or view-based exposure.

### 3. Resend Batch API cap 100

- **Broadcast:** ✅ correct — `send()` called inside chunk loop
- **Updates:** ❌ chunks flattened into one array, single `send()` → fails silently >100
- Confirmation emails correctly use Emails API (single), not Batch — matches decisions

### 4. Test coverage holes on critical paths

| Missing tests                                                                   | Consequence                                            |
| ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Broadcast route/client/segments/email.ts                                        | `waitlist_id` bug shipped                              |
| `/api/updates` API                                                              | batch flattening + no-suppression + min-1 bugs shipped |
| `milestones.ts`                                                                 | skip-the-line clobber undetected                       |
| Dashboard leaderboard sort                                                      | test **enshrines** inverted sort                       |
| Warmth cron (unscheduled) + scoring bugs (referral page-scope, all-event decay) | undetected — no batch/cron tests                       |
| `unsubscribe-page.test.tsx` is fake                                             | false confidence                                       |

### 5. Story "done" but ACs unmet

- Story 12.3.1 — pagination (AC5/AC6) + anonymization (AC2) missing, marked done
- Story 7.7/12.1.10 — promised API success/error flow tests, shipped render-only
- Story 7.6 AC2 — brand color/headline in email never implemented; 7.6/7.7/12.1.4 frontmatter `status: ready` while in `completed/`
- Story 7.6 AC2 — brand color/headline in email never implemented; 7.6/7.7/12.1.4 frontmatter `status: ready` while in `completed/`
- Qualification post-onboarding edit — promised in copy (REQ-6.9.1), never built
- PRD public leaderboard "milestone display" — never built
- Story 11.2 — badge/filter on subscriber list never built (wrong/removed surface), marked done
- Story 11.1 AC2 — reply/leaderboard_visit weights unimplementable; AC3 day-59 bug
- Story 11.5 AC1 vs AC3 contradiction; 11.6 AC1/AC3-5 webhook+panel tests absent
- Vision Module 3/4 opens claims outdated post-MPP (code correctly excludes opens)

### 6. Doc/MEMORY drift

- MEMORY:865 + Story 12.3 AC5: `{{{RESEND_UNSUBSCRIBE_URL}}}` merge tag — **not used** (custom HMAC)
- MEMORY test list: `dashboard-referral-column` — file doesn't exist
- Leaderboard file paths, header sizes (`text-body-sm` vs `text-xs`), `gap-8` vs `gap-4`
- Story 7.5 "View More" vs implemented Prev/Next
- PRD §6.15 missing Pro gate + sender chain changes
- Story 7.6/7.7 frontmatter `status: ready` while in `completed/`; 12.1.4 Out of Scope "email deferred" stale

---

## Per-Engine File Reference

### Qualification (verified — see §1)

- `src/app/onboarding/4/page.tsx` — enable/disable decision; **:183 broken settings promise**
- `src/app/onboarding/4a/page.tsx` — question builder, client tier cap; **:136-138 hardcoded FREE badge; :195 upgrade trigger (works)**
- `src/app/api/waitlist/route.ts` — persist (drops `required`, no tier check :117-127,228-249); restore synthesizes `required: true` (:399)
- `src/app/(public)/[subdomain]/page.tsx` — **:78 hardcodes `required: false`**
- `src/app/api/subscribers/route.ts` — `qual_answers` capture (no validation, :436,527-530)
- `src/app/api/dashboard/qualification/route.ts` — aggregation (full load + JS count :46-65; text-keyed :56-57)
- `components/dashboard/qualification-panel.tsx` — display (**count/maxCount bars :76,92; no % :97**)
- `src/app/dashboard/qualification/page.tsx` + `client.tsx` — page shell (`max-w-2xl`, wrong empty copy :68,:83)
- `components/share/email-capture-form.tsx` — public inline questions (text keys :232,236; wrong "(optional)" color :243; hardcoded `MAX_QUESTIONS` :26-29)
- `components/onboarding/live-preview.tsx` — preview "(optional)" (:237-239, correct color)
- `docs/stories/sql-writeups/epic7-story0-subscribers.sql:45-48` — **RLS `USING(true)` PII exposure**
- `src/app/api/leaderboard/[subdomain]/route.ts` — orphaned, returns raw `qual_answers` (:53)
- `src/app/api/subscribers/export/route.ts` — CSV omits qual (:29,:58)
- `src/lib/tier-gating.ts` — unused cap definitions (dead)
- `docs/dashboard-design-guide.md:230-251,384` — only design reference (ASCII mock; implementation diverges)
- Tests: `dashboard-qualification-page.test.tsx` (mocks panel), `dashboard-scoping.test.ts` (400 only), `email-capture-form.test.tsx`, `warmth.test.ts:39-42` — **missing: panel rendering, aggregation happy path, CSV**

### Warmth (verified — see §2)

- `src/lib/warmth.ts` — score math, decay (**all-events bug :54-56; day-59 :64; page-scoped referrals :123-146**)
- `src/app/api/webhooks/resend/route.ts` — Svix webhook (**400 not 401; multi-waitlist `.single()` :81-86**)
- `src/app/api/cron/warmth/route.ts` — daily batch (**UNSCHEDULED — no `vercel.json` crons**)
- `src/lib/supabase/admin.ts` — service-role client
- `components/dashboard/warmth-panel.tsx` — 4-bar distribution (**hot bar ≠ badge green**)
- `components/dashboard/warning-banner.tsx` — cold% warning (**fallback fetch missing `waitlist_id` :41**)
- `src/app/api/dashboard/warmth/route.ts` — auth counts (full load :38-47)
- `src/app/api/warmth/[subdomain]/route.ts` — **orphaned public API**
- `src/app/dashboard/warmth/{page,client}.tsx` — Pro page + WarmthBadge + filter
- `src/app/dashboard/[waitlistId]/settings/client.tsx:335` — **wrong cold_threshold helper copy**
- `src/app/api/dashboard/broadcast/segments/route.ts` — segment counts (`.single()`, no tier gate)
- Tests: `warmth.test.ts` (29), `dashboard-warmth-page.test.tsx` (13), `api/warmth.test.ts` (4) + webhook/cron/batch/panel/banner/segments suites added by Stories 15.2/15.5

### Leaderboard

- `src/app/(public)/[subdomain]/leaderboard/page.tsx` + `leaderboard-client.tsx` — public (works)
- `src/app/dashboard/leaderboard/page.tsx` + `client.tsx` — dashboard (sort bug, no pagination)
- `src/app/api/leaderboard/[subdomain]/route.ts` — dead code, leaks `qual_answers`
- `src/app/api/subscribers/route.ts` — referral code gen/resolution
- `src/lib/milestones.ts`, `src/lib/positions.ts` — milestones + rank RPC
- Tests: `leaderboard-client.test.tsx` (11), `dashboard-leaderboard-page.test.tsx` (14, bug locked in), `leaderboard.test.ts` (4), referral tests (7)

### Founder Updates (verified — see §4)

- `src/app/dashboard/updates/page.tsx` + `client.tsx` — compose UI (**`.maybeSingle()` bare URL → onboarding; min 10 client-only; no waitlist_id sent**)
- `src/app/api/updates/route.ts` — POST (**batch flatten :131-151; no unsub/bounce :79-82; unescaped :112; silent catch :157; `.single()` :47-53**)
- `components/public/updates-feed.tsx` — LatestUpdateCard (**no dark template :13-15**)
- `components/share/waitlist-template-content.tsx:105-109` — slot above form
- `src/lib/email.ts` — footers (`buildEmailFooter` address-only), `resolveFromAddress`
- `src/app/api/profile/export/route.ts` — updates export omits `sent_at`
- Tests: `dashboard-updates-compose.test.tsx` (6, render-only, stale props), `latest-update-card.test.tsx` (3) — **no API tests**

### Broadcasting

- `src/app/dashboard/broadcast/page.tsx` + `client.tsx` — compose (**missing `waitlist_id`**)
- `src/app/api/dashboard/broadcast/route.ts` — send (**correct** chunking + suppression; always `ok:true`; N+1 bounce; dual unsub gen)
- `src/app/api/dashboard/broadcast/segments/route.ts` — counts (**no `wid`, `.single()`, no tier gate, no unsub/bounce filter**)
- `src/lib/email.ts` — `resolveFromAddress`, `buildBroadcastEmailFooter` (HMAC + address)
- `src/lib/unsubscribe.ts`, `src/lib/bounces.ts`
- `src/app/api/unsubscribe/route.ts`, `src/app/unsubscribe/page.tsx`
- Tests: tier-gating (8), sidebar lock, bounces (3), unsubscribe tokens (6) — **no send-path tests**; `unsubscribe-page.test.tsx` fake

### Broadcasting (verified — see §5)

- `src/app/dashboard/broadcast/page.tsx` — Pro gate, `?wid=`, dead `subscriberCount` (**no `sending_domain` select**)
- `src/app/dashboard/broadcast/client.tsx` — compose (**`waitlistId` unused → POST omits `waitlist_id` → 400**; preview domain hardcoded)
- `src/app/api/dashboard/broadcast/route.ts` — send (chunking + suppression correct; fail path lies)
- `src/app/api/dashboard/broadcast/segments/route.ts` — counts (`.single()`, no `wid`, no tier, unfiltered)
- `src/lib/email.ts` (`resolveFromAddress`, `buildBroadcastEmailFooter`), `src/lib/unsubscribe.ts`, `src/lib/bounces.ts`, `src/lib/tier-gating.ts`
- `components/dashboard/sidebar.tsx:307,314-325` — Free lock → upgrade modal (`broadcast` trigger)
- Stories: `story-12.3`, `story-12.4`, `story-12.5`, `story-12.1.8`, `story-12.2.7` (+ PRD L123/L171/REQ-7.1a.1/L398-400)
- Tests: **0 send-path**; tier-gating (8), bounces (3), unsubscribe tokens (6); fake page test

---

## Recommended Fix Priority

1. **Broadcasting (hard-broken)** — send `waitlist_id` from client; segments `?wid=` + exclude unsub/bounce from counts; fail loudly when total sent = 0; API/client tests (happy + 400/401/403 + segment + chunking + total failure); preview `resolveFromAddress` + `sending_domain`; **amend docs not code** for unsubscribe (Story 12.3 AC5 → custom HMAC, delete 12.4 AC6, fix MEMORY:780/865); fix story `status` frontmatter; optional: idempotency key, subject/body caps, `broadcasts` history read.
2. **Warmth cron (silently dead) + scoring correctness** — add `vercel.json` `crons` entry for `/api/cron/warmth` (and confirm in Vercel dashboard); fix `batchRecalculateWarmth` page-scoped referral counts + add `.order("id")`; decay **engagement events only** (`clicked`, not `sent`/`delivered`) + fix day-59 → `>= 60`; decide Cold vs Unscored at 0; webhook + batch tests (11.6 AC1); segments `?wid=` + `requirePro`; settings helper copy; amend vision :150 and Story 11.1 AC2 dead signals.
3. **Founder Updates (compliance + scale)** — chunked `batch.send` per 100 (copy broadcast pattern); apply `unsubscribed_at`/`isEmailBounced` filters; `waitlist_id` end-to-end; visible unsubscribe link in body; HTML-escape `${text}`; API tests (401/403/400 multi-waitlist/validation, success `sent_at`, fail path); amend Story 7.6 AC2 + 12.1.10 AC5 + stale statuses; surface send failure to founder (not just "Published!").
4. **Leaderboard (correctness)** — fix dashboard sort double-inversion + fix the enshrining test; add pagination (or amend AC); fix skip-the-line clobber; close RLS `subscribers` column exposure.
5. **Qualification (data model first, then UX)** — decisions: (a) add Multiple Choice question types (Story 4.5 AC5 + survey-tool research: bars only chartable for closed-ended), (b) migrate answer keys to `question_id` (7.3 AC6), (c) redesign panel: response table/list for free-text, % + respondent totals for choice questions (12.3.2 AC3), per-question cards, fix empty-state copy/CTA. Then: settings edit UI (or remove promise at `4/page.tsx:183`); server-side tier cap; decide `required` persistence; close `qual_answers` RLS exposure + leaderboard API leak; CSV qual columns; fix Pro FREE-badge (`4a:136-138`); panel + aggregation + CSV tests.

### Suggested execution route

Each engine fix set fits the existing prompt workflow:

- `investigate [broadcast waitlist_id bug]` — Prompt #8 for the hard-broken send path
- `scan` → `execute` → `audit` per fix story once stories are written
- `create-epic` if you want a consolidated "Engine Hardening" epic covering all five

---

_Scan method updated: five engines all line-level verified 2026-09-24. Next: no code changes until founder directs fix work (suggest `investigate [broadcast waitlist_id bug]` or a fix epic)._

_Scan method: parallel read-only deep scans of code, PRD, story files, MEMORY, and tests. Qualification, Warmth, Leaderboard, Founder Updates, and Broadcasting sections re-verified via dedicated line-level rescans + web research on 2026-09-24 — Broadcasting confidence 98% (client `waitlist_id` 400, segments multi-waitlist, Batch-100 correct, custom HMAC vs `{{{RESEND_UNSUBSCRIBE_URL}}}` + Audiences standing decision, RFC 8058, eligible-count UX). Founder Updates confidence 97% (Resend Batch 100-cap, CAN-SPAM visible unsubscribe, product-update email best practices, competitor suppression baselines, HTML injection). Warmth 96%. Qualification 97%, Leaderboard 95%. All claims reference file paths and line numbers as of commit `211085f` (dev/main). No code was modified during this audit._

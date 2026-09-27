# Story 14.2 — Settings Question Editor (post-onboarding)

**Status:** done
**Epic:** 14 — Qualification Engine Fix & Hardening
**Depends on:** 14.0, 14.1

## Story

As a founder after onboarding, I want to edit qualification questions from waitlist settings so that the product keeps the Step 4 promise: "Add questions later from settings."

## Acceptance Criteria (EARS)

- AC1: The system shall provide a waitlist-scoped settings surface for qualification questions within the existing settings hierarchy (`/dashboard/[waitlistId]/settings` or `/dashboard/settings/waitlists` detail — document choice in PR).
- AC2: The editor shall reuse the Step 4a question-building UI via a **shared component** extracted in 14.1 — single implementation, not a fork.
- AC3: Save shall `PATCH /api/waitlist` with the full `questions` array; server cap + type/options validation from 14.0 apply.
- AC4: `/dashboard/qualification` shall include an **Edit questions** control that navigates to this settings surface (label **COPY GAP**).
- AC5: Edits shall be non-destructive when subscribers exist: answers keep `question_id` keys (no key rewrite on rename); deleting a question leaves orphan keys that dashboard/CSV ignore — no destructive cascade required.
- AC6: The editor shall enforce Free/Pro caps and fire the existing upgrade modal at Free cap (`triggerUpgrade("qual_question")`).
- AC7: Lint and build shall pass with zero errors.

## Tasks

T1 (AC2) Extract shared `QuestionEditor` from 4a
T2 (AC1, AC3) Settings route + load/save via PATCH
T3 (AC4) Qualification dashboard CTA link
T4 (AC5-AC6) Orphan-answer safety + tier upsell
T5 (AC7) Lint + build

## Dev Notes

- **COPY GAP (stop-and-ask):** settings heading, description, save button, success toast, empty state, dashboard "Edit questions" label.
- Breaks circular debt: 12.3.2 out-scoped editing → 12.2.2 out-scoped it → this story is the resolution (REQ-6.9.1).
- Shared component location: `components/onboarding/` or `components/settings/` at project **root** `components/`, consistent with repo import style.
- Load existing questions with `id`, `type`, `options` from `GET /api/waitlist`; seed editor state; dirty-check optional.

## Implementation Notes (added on completion)

- **Status: done** — commits `d3843f0` (implementation) + `25d99f1` (CTA accent), gates green.
- **AC1 choice (documented here, no PR — work ships to `dev`):** settings surface = **qualification tab inside `/dashboard/[waitlistId]/settings`** (`src/app/dashboard/[waitlistId]/settings/client.tsx`, +143 lines) — not the `/dashboard/settings/waitlists` detail route.
- **AC2:** shared editor extracted to **`components/onboarding/question-editor.tsx`** (330 lines, single implementation); `src/app/onboarding/4a/page.tsx` reduced −294 lines to consume it.
- **AC3:** save path `PATCH /api/waitlist` made **id-preserving** (no delete+reinsert of unchanged questions — `src/app/api/waitlist/route.ts` +103) so existing `question_id` answer keys stay stable (AC5).
- **AC4:** "Edit questions" link on `/dashboard/qualification` → `/dashboard/{id}/settings?tab=qualification`; styled as **solid accent primary CTA** (`bg-accent text-accent-foreground hover:bg-accent/90`) per design guide §9.
- **AC6:** Free-cap upsell reuses `triggerUpgrade("qual_question")` inside the shared editor.
- Tests: `src/__tests__/components/dashboard-qualification-page.test.tsx` (incl. solid-CTA class assertion).

## Files to Create/Modify

- `components/onboarding/question-editor.tsx` — shared editor (extracted from 4a) _(created)_
- `src/app/onboarding/4a/page.tsx` — consume shared editor ✓
- `src/app/dashboard/[waitlistId]/settings/client.tsx` — qualification tab (chosen surface) ✓
- `src/app/dashboard/qualification/client.tsx` — Edit questions CTA ✓
- `src/app/api/waitlist/route.ts` — id-preserving PATCH ✓

## Out of Scope

- Public form behavior changes (14.1)
- Edit analytics

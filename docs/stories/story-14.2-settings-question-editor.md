# Story 14.2 — Settings Question Editor (post-onboarding)

**Status:** ready
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

## Files to Create/Modify

- `components/…/question-editor.tsx` — shared editor (extracted from 4a)
- `src/app/onboarding/4a/page.tsx` — consume shared editor
- `src/app/dashboard/[waitlistId]/settings/…` (or equivalent) — new qualification section
- `src/app/dashboard/qualification/client.tsx` — Edit questions CTA
- `src/app/api/waitlist/route.ts` — already covered by 14.0; verify PATCH path only

## Out of Scope

- Public form behavior changes (14.1)
- Edit analytics

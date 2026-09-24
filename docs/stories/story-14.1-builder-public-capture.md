# Story 14.1 — Question Builder + Public Capture (MC + free-text)

**Status:** ready
**Epic:** 14 — Qualification Engine Fix & Hardening
**Depends on:** 14.0

## Story

As a founder, I want free-text **and** multiple-choice questions in onboarding Step 4a (always optional) so that subscribers answer in the right format; as a subscriber, I want those questions rendered correctly with answers keyed by `question_id`.

## Acceptance Criteria (EARS)

- AC1: Step 4a shall offer a per-question type control: **Free text** | **Multiple choice** (Story 4.5 AC5 — never built).
- AC2: When type is Multiple choice, the builder shall show an editable options list (add/remove, minimum 2 options) persisted as `options` via PATCH.
- AC3: The builder shall **not** render a required/optional toggle; all questions are optional (Standing Decision 4).
- AC4: The tier cap badge shall be tier-aware — Free shows Free cap copy, Pro shows Pro cap copy; hardcoded `FREE — 2 questions max` (`4a/page.tsx:136-138`) shall not appear for Pro.
- AC5: At Free cap, Add question shall remain an upsell firing `triggerUpgrade("qual_question")` (REQ-6.10.1) — preserve path at `4a:195`.
- AC6: The public waitlist page shall map questions to `{ id, text, type, options }` — not `{ text, required: false }` (`(public)/[subdomain]/page.tsx:76-79` replaced).
- AC7: `EmailCaptureForm` shall key `qual_answers` by **`question.id`** (Story 7.3 AC6); empty optional answers omitted.
- AC8: Free-text shall render as text inputs; multiple-choice as radio groups (or equivalent single-select) with accessible labels; one option selectable.
- AC9: The "(optional)" indicator shall use `text-muted-foreground` (Story 7.3 AC4 / REQ-6.10.4) — replace `text-status-warm` at `email-capture-form.tsx:243`; LivePreview shall match.
- AC10: Client question cap shall use shared `getTierLimits` (or API-provided cap), not a private hardcoded `MAX_QUESTIONS` map (`email-capture-form.tsx:26-29`).
- AC11: `POST /api/subscribers` shall validate `qual_answers` keys against the waitlist's `qualification_questions.id` set; unknown keys dropped (documented lenient choice).
- AC12: LivePreview / shared `WaitlistTemplateContent` path shall render MC as choice lists and free-text as inputs, matching the public page.
- AC13: Wherever the example question text appears, it shall read `What are you currently using?` **verbatim** — no rephrased placeholder variant (REQ-6.10.3; audit: public placeholder and preview default currently differ).
- AC14: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC5) 4a builder: type selector, options editor, tier-aware badge, upsell
T2 (AC6-AC8) Public page + EmailCaptureForm id-keys + MC radio render
T3 (AC9-AC10) Optional color token + shared tier caps
T4 (AC11) Subscriber API validates question_id keys
T5 (AC12-AC13) LivePreview / template parity + verbatim example copy
T6 (AC14) Lint + build

## Dev Notes

- **COPY GAP (stop-and-ask):** MC type labels, option placeholders, Pro tier badge wording, helper text under type selector — founder approval before ship.
- Extend onboarding `Question` to `{ id?, text, type: "free_text" | "multiple_choice", options?: string[] }`; drop `required`.
- Update `form.questions` type + flushToAPI body to send `type` + `options`.
- Tests: rewrite `email-capture-form.test.tsx` cases that cement text keys (`:223-225`); add MC render + submission test.
- Step 4 promise at `4/page.tsx:183` ("Add questions later from settings") stays — 14.2 fulfills it; do not delete copy.
- `components/` lives at **project root**, not `src/components/` — relative imports from app routes.

## Files to Create/Modify

- `src/app/onboarding/4a/page.tsx` — type + options UI, tier badge
- `src/app/onboarding/context.tsx` — Question type + questions field
- `src/app/(public)/[subdomain]/page.tsx` — question mapping
- `components/public/email-capture-form.tsx` — id keys, MC radios, color, caps
- `src/app/api/subscribers/route.ts` — key validation
- `components/onboarding/live-preview.tsx` + `components/share/waitlist-template-content.tsx` — preview parity
- `src/__tests__/components/email-capture-form.test.tsx` (+ new MC tests)

## Out of Scope

- Settings editor (14.2), dashboard charts (14.3), CSV (14.4)

# Story 10.2 — Accessibility Fixes

**Epic:** 10 — Public Waitlist Page & Onboarding Redesign
**Status:** ready
**Depends on:** —
**Design Refs:** None (accessibility compliance)

## Story

As a user relying on assistive technology, I want all form inputs on the public waitlist page and onboarding steps to have proper labels so that screen readers can announce their purpose.

## Acceptance Criteria (EARS)

- AC1: Every `<input type="email">` in `email-capture-form.tsx` shall have an `aria-label="Email address"` attribute.
- AC2: Every dynamic question `<input type="text">` in `email-capture-form.tsx` shall have an `aria-label` attribute set to the question text.
- AC3: The name `<input type="text">` on the thank-you page shall have an `aria-label="First name"` attribute.
- AC4: Every `<label>` in onboarding Step 1 and Step 3 shall be associated with its input via `htmlFor`/`id` pairing. Clicking the label shall focus the corresponding input.
- AC5: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Add aria-label to email inputs · T2 (AC2) Add aria-label to question inputs · T3 (AC3) Add aria-label to name input · T4 (AC4) Add htmlFor/id pairing to onboarding labels · T5 (AC5) Lint + build

## Out of Scope

Keyboard navigation improvements, focus trap management, color contrast fixes (separate concern).

## Implementation Details

### T1: Add aria-label to email inputs

- File: `components/public/email-capture-form.tsx:146,208`
- Both email inputs (with-questions and no-questions variants) lack `aria-label`
- Add `aria-label="Email address"` and `aria-describedby` pointing to error message `<p>` for WCAG 3.3.1 compliance

### T2: Add aria-label to question inputs

- File: `components/public/email-capture-form.tsx:169`
- Question text inputs use `placeholder` as only label
- Add `aria-label={question.text}` to each
- Also add `aria-describedby` for error messages

### T3: Add aria-label to name input

- File: `src/app/(public)/[subdomain]/thank-you/page.tsx:120-124`
- Name input has no `aria-label`
- Add `aria-label="First name"`

### T4: Add htmlFor/id pairing to onboarding labels

- File: `src/app/onboarding/1/page.tsx:277,292,306`
- None of the three field groups have `htmlFor`/`id` pairing
- Add `htmlFor="headline"` + `id="headline"`, `htmlFor="subheadline"` + `id="subheadline"`, `htmlFor="slug"` + `id="slug"`
- Repeat for Step 3 fields

### T5: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors

## Verification

1. Test email inputs with screen reader — verify "Email address" is announced
2. Test question inputs with screen reader — verify question text is announced
3. Test name input on thank-you page with screen reader — verify "First name" is announced
4. Click on labels in Step 1 — verify focus moves to corresponding input
5. Run `pnpm lint` and `pnpm build` — verify zero errors

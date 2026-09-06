# Story 10.5 — Onboarding Field Architecture

**Epic:** 10 — Public Waitlist Page & Onboarding Redesign
**Status:** ready
**Depends on:** 10.0
**Design Refs:** None (field architecture cleanup)

## Story

As a founder, I want onboarding Step 1 to have clear, accurate labels ("Product Name" and "Subdomain") so that I understand what each field is for without confusion.

## Acceptance Criteria (EARS)

- AC1: The `OnboardingFormState` interface shall include a `productName: string` field.
- AC2: Onboarding Step 1 shall display a "Product Name" field (not "Headline") with placeholder "e.g. Buildly".
- AC3: Onboarding Step 1 shall display a "Subdomain" field (not "tagline") with placeholder showing the derived slug.
- AC4: The LivePreview shall use `productName` for internal display (e.g., dashboard title, email sender fallback) and `headline` for the public page heading.
- AC5: The `flushToAPI` function shall send `product_name` in the POST body.
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Add productName to OnboardingFormState · T2 (AC2-AC3) Rename Step 1 labels · T3 (AC4) Update LivePreview to use productName · T4 (AC5) Update flushToAPI · T5 (AC6) Lint + build

## Out of Scope

Changing the Step 3 layout, modifying the template selector, removing fields, adding new fields beyond productName.

## Implementation Details

### T1: Add productName to OnboardingFormState

- File: `src/app/onboarding/context.tsx:30-48`
- Add `productName: string` to `OnboardingFormState`
- Default: `""`
- Also add to localStorage persistence and flushToAPI

### T2: Rename Step 1 labels

- File: `src/app/onboarding/1/page.tsx:277-278`
- Change label "Headline" to "Product Name"
- Change placeholder to "e.g. Buildly"
- Change label "tagline" (line 306-307) to "Subdomain"
- Keep the fields in Step 1 — just fix the labels
- Note: web research confirms "Headline = value reminder, not brand name" — separating product name from headline is correct

### T3: Update LivePreview to use productName

- File: `components/onboarding/live-preview.tsx`
- Wherever the preview reads `form.headline` for internal display (dashboard title, email sender), use `form.productName || form.headline` as fallback

### T4: Update flushToAPI

- File: `src/app/onboarding/context.tsx:264-280`
- In `flushToAPI`, add `product_name: data.productName || undefined` to the POST body

### T5: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors

## Verification

1. Test OnboardingFormState — verify `productName` field exists
2. Test Step 1 — verify label says "Product Name" with placeholder "e.g. Buildly"
3. Test Step 1 — verify label says "Subdomain" with slug placeholder
4. Test LivePreview — verify `productName` is used for internal display
5. Test flushToAPI — verify `product_name` is sent in POST body
6. Run `pnpm lint` and `pnpm build` — verify zero errors

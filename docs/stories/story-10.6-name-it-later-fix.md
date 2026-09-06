# Story 10.6 — "I'll Name It Later" Fix

**Epic:** 10 — Public Waitlist Page & Onboarding Redesign
**Status:** ready
**Depends on:** 10.5
**Design Refs:** None (UX improvement based on competitor research)

## Story

As a founder who wants to explore the product before committing to a name, I want "I'll name it later" to generate a readable URL, auto-fill a default headline and subheadline, and keep the slug input editable so that I can proceed without friction and change my mind later.

## Acceptance Criteria (EARS)

- AC1: Clicking "I'll name it later" shall generate a slug in the format `{adjective}-{noun}-{4hex}` (e.g., `brave-fox-x7k2`) instead of a raw 8-char hex string.
- AC2: Clicking "I'll name it later" shall auto-fill the headline with "My Waitlist" and the subheadline with "Join the waitlist", then advance to Step 2 without requiring manual input.
- AC3: The slug input shall remain editable after clicking "I'll name it later". The user can type over the generated slug.
- AC4: After clicking "I'll name it later", a message shall appear: "Your page will be at **{slug}.prewaitlist.com** — you can change this anytime in Settings".
- AC5: The page header shall read "What's your product called?" with helper text "Don't worry — you can change all of this later".
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Replace UUID fallback with readable slug generator · T2 (AC2) Auto-fill headline/subheadline and advance on skip · T3 (AC3) Keep slug input editable after skip · T4 (AC4) Show generated URL with explanation · T5 (AC5) Update header and helper text · T6 (AC6) Lint + build

## Out of Scope

Dashboard slug editing (future story), email-based slug generation, slug uniqueness guarantee beyond 4-hex collision probability.

## Implementation Details

### T1: Replace UUID fallback with readable slug generator

- File: `src/app/onboarding/1/page.tsx:19-21`
- Replace `generateFallbackSlug()` which uses `crypto.randomUUID().slice(0, 8)` (opaque hex)
- New implementation uses `{adjective}-{noun}-{4hex}` pattern (e.g., `brave-fox-x7k2`)
- Web research: 40-60% drop on naming steps — readable slugs reduce friction

### T2: Auto-fill headline/subheadline and advance on skip

- File: `src/app/onboarding/1/page.tsx:174-182`
- In `handleNameLater`, also call `form.updateField("headline", "My Waitlist")` and `form.updateField("subheadline", "Join the waitlist")`, then `router.push("/onboarding/2")`
- Currently only sets slug

### T3: Keep slug input editable after skip

- File: `src/app/onboarding/1/page.tsx:316`
- Remove `usedFallback` from disabled condition: `disabled={isSubmitting}` (remove `|| usedFallback`)
- Currently locks the input after skip

### T4: Show generated URL with explanation

- File: `src/app/onboarding/1/page.tsx:319-334`
- Enhance URL preview section
- After skip, show: "Your page will be at **{slug}.prewaitlist.com**" in accent color, with "You can change this anytime in Settings" in muted-foreground below
- Currently just shows raw URL

### T5: Update header and helper text

- File: `src/app/onboarding/1/page.tsx:264-273`
- Change "What are you building?" to "What's your product called?"
- Add helper: "Don't worry — you can change all of this later" in muted-foreground
- Currently has no helper text below the "I'll name it later" button

### T6: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors

## Verification

1. Click "I'll name it later" — verify slug is `{adjective}-{noun}-{4hex}` format
2. Click "I'll name it later" — verify headline is "My Waitlist" and subheadline is "Join the waitlist"
3. Click "I'll name it later" — verify slug input remains editable
4. Click "I'll name it later" — verify URL message appears with explanation
5. Test Step 1 header — verify it says "What's your product called?" with helper text
6. Run `pnpm lint` and `pnpm build` — verify zero errors

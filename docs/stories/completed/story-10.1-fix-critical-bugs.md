# Story 10.1 — Fix Critical Bugs

**Epic:** 10 — Public Waitlist Page & Onboarding Redesign
**Status:** ready
**Depends on:** 10.0
**Design Refs:** None (bug fixes)

## Story

As a developer, I want 7 critical bugs fixed across the public page, onboarding context, live preview, and thank-you page so that the product functions correctly.

## Acceptance Criteria (EARS)

- AC1: The `PoweredByFooter` component shall render different classes for dark and light templates. Dark mode shall use `bg-dark-template-bg text-dark-template-text`. Light mode shall use `bg-card text-foreground`.
- AC2: The `signup_counter_enabled` field shall be persistable as `false` in the API. When the founder disables the signup counter toggle, the PATCH request shall include `signup_counter_enabled: false` (not omit it).
- AC3: The `AuthedOnboardingProvider` shall map all camelCase field names to their snake_case API equivalents before sending PATCH requests. The mapping shall include: `brandColor` → `brand_color`, `ctaText` → `cta_text`, `signupCounterEnabled` → `signup_counter_enabled`, `signupCounterThreshold` → `signup_counter_threshold`, `emailSubject` → `email_subject`, `emailSenderName` → `email_sender_name`, `emailBody` → `email_body`.
- AC4: The LivePreview signup counter shall display a value derived from the onboarding context, not a hardcoded `1189`.
- AC5: The "What should we call you?" input on the thank-you page shall either be wired to a state variable and save handler, or be removed entirely. A non-functional decorative input shall not ship.
- AC6: The referral count on the thank-you page shall reflect the actual referral count from the server, not a hardcoded `0`.
- AC7: The template prop passed to `WaitlistTemplateContent` on the thank-you page shall reflect the actual waitlist template from the server, not a hardcoded `"minimal"`.
- AC8: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Fix PoweredByFooter dark/light conditional · T2 (AC2) Fix signup_counter_enabled false→undefined · T3 (AC3) Fix camelCase→snake_case mapping · T4 (AC4) Fix hardcoded signup counter · T5 (AC5) Wire up or remove thank-you name input · T6 (AC6) Fix hardcoded referral count · T7 (AC7) Fix hardcoded template · T8 (AC8) Lint + build

## Out of Scope

New features, layout changes, design system normalization (Story 10.3), accessibility fixes (Story 10.2).

## Implementation Details

### T1: Fix PoweredByFooter dark/light conditional

- File: `components/share/powered-by-footer.tsx:31-33`
- Bug: The `isDark` ternary on line 31 produces identical class `text-muted-foreground` in both branches
- Fix: Change to `isDark ? "text-dark-template-text" : "text-foreground"`
- Note: The border logic on lines 19-23 already differentiates correctly

### T2: Fix signup_counter_enabled false→undefined

- File: `src/app/onboarding/context.tsx:274`
- Bug: `data.signupCounterEnabled || undefined` drops `false`
- Fix: Change to `?? undefined` (nullish coalescing preserves `false`)
- **Also fix line 273:** `qualification_enabled` has the same `|| undefined` bug — change to `?? undefined`

### T3: Fix camelCase→snake_case mapping

- File: `src/app/onboarding/context.tsx:401`
- Bug: PATCH mapping only converts `brandColor` → `brand_color`
- Missing mappings: `ctaText` → `cta_text`, `logoUrl` → `logo_url`, `milestoneRewards` → `milestone_rewards`, `signupCounterEnabled` → `signup_counter_enabled`, `signupCounterThreshold` → `signup_counter_threshold`, `emailSubject` → `email_subject`, `emailSenderName` → `email_sender_name`, `emailBody` → `email_body`, `qualificationEnabled` → `qualification_enabled`
- Fix: Create a `FIELD_MAP` constant

### T4: Fix hardcoded signup counter

- File: `components/onboarding/live-preview.tsx:387`
- Bug: Hardcoded `signupCounter={1189}`
- Fix: Replace with `signupCounter={form.signupCounterEnabled ? form.signupCounterThreshold : 0}` or similar context-driven value
- Note: The component also has `style={{ backgroundColor: brandColor }}` on lines 171, 255 — this is dynamic and acceptable per Tailwind docs (inline styles for runtime values)

### T5: Wire up or remove thank-you name input

- File: `src/app/(public)/[subdomain]/thank-you/page.tsx:120-124`
- Bug: Name input has no `value`, `onChange`, or `onBlur`
- Fix: Either wire to state + save handler, or remove entirely
- **Also fix line 29:** DB query does not select `template` field — must add `template, brand_color, logo_url, cta_text` to the select

### T6: Fix hardcoded referral count

- File: `src/app/(public)/[subdomain]/thank-you/page.tsx:129`
- Bug: Hardcoded referral count `"0"`
- Fix: Server component must query `subscribers` table for referral count where `referrer_id` matches current subscriber's ID. Pass as prop to client component.

### T7: Fix hardcoded template

- File: `src/app/(public)/[subdomain]/thank-you/page.tsx:162`
- Bug: `template="minimal"` hardcoded
- Fix: Server component must read `template` from waitlist record and pass as prop. Replace `template="minimal"` with `template={waitlist.template}`.

### T8: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors

## Verification

1. Test PoweredByFooter with dark template — verify different classes render
2. Test signup counter toggle OFF → PATCH — verify `signup_counter_enabled: false` is sent
3. Test all camelCase→snake_case mappings — verify PATCH sends correct snake_case keys
4. Test LivePreview with signup counter enabled — verify dynamic value renders
5. Test thank-you page — verify name input works or is removed
6. Test thank-you page — verify referral count is real, not hardcoded
7. Test thank-you page — verify template matches waitlist record
8. Run `pnpm lint` and `pnpm build` — verify zero errors

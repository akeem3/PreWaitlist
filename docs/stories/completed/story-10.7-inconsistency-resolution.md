# Story 10.7 — Inconsistency Resolution

**Epic:** 10 — Public Waitlist Page & Onboarding Redesign
**Status:** ready
**Depends on:** 10.1, 10.3
**Design Refs:** None (consistency pass)

## Story

As a developer, I want all input heights, focus border patterns, error display patterns, and type definitions unified across the public page and onboarding steps so that the codebase is consistent and maintainable.

## Acceptance Criteria (EARS)

- AC1: All input fields across public waitlist page and onboarding Steps 1–3 shall use the same height: `h-10` (40px, the `--input-height` token).
- AC2: All input focus states shall use the same pattern: `focus:border-accent focus:ring-1 focus:ring-accent`.
- AC3: Error display in `email-capture-form.tsx` shall use inline JSX (not `alert()`).
- AC4: The LivePreview question form spacing shall match the EmailCaptureForm spacing (reconcile `gap-3` vs `mt-4`).
- AC5: The `PoweredByFooter` component shall not accept a `brandColor` prop (dead prop — never used).
- AC6: The `MilestoneReward` type shall be unified: `{ threshold: number; label: string }` everywhere. The `{ name, value }` variant in LivePreview shall be replaced.
- AC7: The question type shall be unified: adopt `{ text: string; required: boolean }` everywhere. The `OptionalQuestion` variant with `optional: boolean` shall be removed.
- AC8: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Unify input heights · T2 (AC2) Unify focus border patterns · T3 (AC3) Replace alert() with inline JSX · T4 (AC4) Align question form spacing · T5 (AC5) Remove dead brandColor prop · T6 (AC6) Unify MilestoneReward types · T7 (AC7) Unify question types · T8 (AC8) Lint + build

## Out of Scope

Changes to dashboard components, marketing pages, or any file outside the public waitlist page and onboarding scope.

## Implementation Details

### T1: Unify input heights

- Files: `email-capture-form.tsx`, `waitlist-template-content.tsx`, `live-preview.tsx`, `onboarding/1/page.tsx`, `onboarding/3/page.tsx`
- Three different input height systems exist: `h-15` (onboarding), `h-[52px]` (thank-you), `h-10`/`h-11` (email-capture-form)
- Standardize all to `h-10` (40px, the `--input-height` token)

### T2: Unify focus border patterns

- Replace inconsistent focus patterns with `focus:border-accent focus:ring-1 focus:ring-accent` everywhere
- Currently two patterns exist: `focus:border-accent focus:ring-1 focus:ring-accent` (email-capture-form) vs `focus:border-accent focus:outline-none` (onboarding)

### T3: Replace alert() with inline JSX

- File: `components/public/email-capture-form.tsx`
- Replace `alert()` error calls with inline error message JSX (e.g., `<p className="text-sm text-destructive">{error}</p>`)
- Web research: errors must use `role="alert"` or `aria-live` for screen reader announcement

### T4: Align question form spacing

- Reconcile `gap-3` in LivePreview question form with `mt-4` in EmailCaptureForm
- Use `gap-3` consistently

### T5: Remove dead brandColor prop

- File: `components/share/powered-by-footer.tsx`
- Remove `brandColor` from props interface and function signature
- Dead prop — never used

### T6: Unify MilestoneReward types

- File: `components/onboarding/live-preview.tsx`
- Change `{ name: string; value: string }` to `{ threshold: number; label: string }` for milestone rewards
- Update all references

### T7: Unify question types

- File: `components/public/email-capture-form.tsx`
- Change `OptionalQuestion` type to match `QualificationQuestion` from context (`{ text: string; required: boolean }`)
- Remove the `optional` boolean variant

### T8: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors

## Verification

1. Test all input fields — verify h-10 height
2. Test all input focus states — verify consistent pattern
3. Test email-capture-form errors — verify inline JSX, not alert()
4. Test question form spacing — verify gap-3 is consistent
5. Test PoweredByFooter — verify brandColor prop is removed
6. Test MilestoneReward type — verify { threshold, label } everywhere
7. Test question type — verify { text, required } everywhere
8. Run `pnpm lint` and `pnpm build` — verify zero errors

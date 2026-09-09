# Story 10.3 — Design System Normalization

**Epic:** 10 — Public Waitlist Page & Onboarding Redesign
**Status:** ready
**Depends on:** —
**Design Refs:** `src/app/globals.css` (design system tokens)

## Story

As a developer, I want all inline styles, arbitrary Tailwind values, and hardcoded hex fallbacks replaced with design system tokens so that the codebase is consistent and maintainable.

## Acceptance Criteria (EARS)

- AC1: The `live-preview.tsx` component shall contain zero `style={{ ... }}` inline style blocks. All styling shall use Tailwind utility classes referencing design system tokens.
- AC2: All onboarding input fields shall use `h-10` (40px, the `--input-height` token) instead of `h-15` (60px).
- AC3: The onboarding submit button shall use a standard design system button size (e.g., `h-10` or `h-12`) instead of `h-14.75 w-114.5`.
- AC4: The thank-you page name input shall use `--input-height` token instead of `h-[52px]` and `--card-radius` token instead of `rounded-[12px]`.
- AC5: No element in the public waitlist page or onboarding Steps 1–3 shall use `text-[10px]` or `text-[11px]`. The minimum font size shall be `text-xs` (12px).
- AC6: No component shall use hardcoded hex color fallbacks (e.g., `#FAF8F4`, `#1A1A1A`) in inline styles. All colors shall reference CSS custom properties via Tailwind utility classes.
- AC7: All conditional class logic in affected files shall use the `cn()` utility from `components/lib/cn.ts`.
- AC8: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Replace inline styles in live-preview.tsx · T2 (AC2) Replace h-15 inputs with h-10 · T3 (AC3) Replace arbitrary button sizes · T4 (AC4) Replace thank-you input arbitrary values · T5 (AC5) Replace sub-12px font sizes · T6 (AC6) Replace hardcoded hex fallbacks · T7 (AC7) Add cn() usage · T8 (AC8) Lint + build

## Out of Scope

Changes to the marketing pages, dashboard components, or any file outside the public waitlist page and onboarding Steps 1–3 scope.

## Implementation Details

### T1: Replace inline styles in live-preview.tsx

- File: `components/onboarding/live-preview.tsx`
- 17 inline `style={{}}` blocks at lines 50, 62, 75, 83, 91, 100, 112, 171, 255, 311, 313, 322, 342, 361, 367, 374, 380
- Replace `style={{ background: 'var(--color-background)' }}` with `bg-background`
- Replace `style={{ color: 'var(--color-foreground)' }}` with `text-foreground`
- Use utility class names (not `var()` arbitrary values) per MEMORY.md Tailwind v4 rule
- **Exception:** `style={{ backgroundColor: brandColor }}` on lines 171, 255 is dynamic (runtime value) — acceptable per Tailwind docs. Use CSS variable approach if possible: `style={{ '--brand-color': brandColor }}` then `bg-[var(--brand-color)]`

### T2: Replace h-15 inputs with h-10

- File: `src/app/onboarding/1/page.tsx:286,300,317`
- Replace `h-15` with `h-10` on all three inputs
- `h-15` is not a standard Tailwind utility

### T3: Replace arbitrary button sizes

- File: `src/app/onboarding/1/page.tsx:345`
- Replace `h-14.75 w-114.5` with standard button sizes
- Use the `Button` component's existing variants (md or lg) instead of arbitrary fractional values

### T4: Replace thank-you input arbitrary values

- File: `src/app/(public)/[subdomain]/thank-you/page.tsx:120`
- Replace `h-[52px]` with `h-10`
- Replace `rounded-[12px]` with `rounded-(--card-radius)`

### T5: Replace sub-12px font sizes

- File: `components/share/waitlist-template-content.tsx:114,121`
- Replace `text-[10px]` with `text-xs` (12px)
- Replace `text-[11px]` with `text-2xs` (11px, defined in MEMORY.md typography system)

### T6: Replace hardcoded hex fallbacks

- File: `components/onboarding/live-preview.tsx`
- Replace hardcoded hex values with Tailwind utility classes (e.g., `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-accent`)
- Also fix `components/share/waitlist-template-content.tsx:58` — replace inline `style={{ height: isBold ? 48 : 40 }}` with `className="max-h-12 object-contain"`

### T7: Add cn() usage

- Add `import { cn } from "@/lib/cn"` to all affected files
- Replace ternary class logic with `cn()` calls

### T8: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors

## Verification

1. Test live-preview.tsx — verify zero inline style blocks (except dynamic brandColor)
2. Test onboarding inputs — verify h-10 height
3. Test onboarding submit button — verify standard size
4. Test thank-you page input — verify design system tokens
5. Test public page — verify minimum font size is text-xs
6. Test all components — verify no hardcoded hex in inline styles
7. Test conditional classes — verify cn() is used
8. Run `pnpm lint` and `pnpm build` — verify zero errors

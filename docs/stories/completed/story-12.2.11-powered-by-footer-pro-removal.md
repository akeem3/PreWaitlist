# Story 12.2.11 — PoweredByFooter Pro Removal

**Epic:** 12.2 — Gap Fixes
**Status:** done
**Depends on:** —
**Design Refs:** —

## Story

As a Pro-tier founder, I want the "Powered by PreWaitlist" footer hidden on my public pages so that my brand looks independent.

## Acceptance Criteria (EARS)

- AC1: The leaderboard page (`/:subdomain/leaderboard`) shall not render `PoweredByFooter` when the waitlist's tier is `pro`.
- AC2: The leaderboard page shall pass the correct `template` prop from the waitlist data (not hardcoded `"minimal"`).
- AC3: The leaderboard page shall pass the `standalone` prop to `PoweredByFooter` so it inherits the parent background.
- AC4: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC3) Fix leaderboard PoweredByFooter · T2 (AC4) Lint + build

## Out of Scope

Changes to other pages' footer logic (already correct). Footer visual design changes.

## Implementation Details

### T1: Fix leaderboard PoweredByFooter

- **File to modify:** `src/app/(public)/[subdomain]/leaderboard/page.tsx`

Current broken code (around line 112):

```tsx
<PoweredByFooter template="minimal" />
```

This hardcodes the template and renders for ALL tiers. Fix:

```tsx
<PoweredByFooter template={waitlist.template} standalone />
```

The `PoweredByFooter` component already handles the tier gate internally — it only renders when `tier === "free"`. The leaderboard page just needs to pass the correct props.

Verify the waitlist query selects `template` and the parent page passes it to `WaitlistPageContent` or directly to the footer.

### T2: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Leaderboard page with Free tier → footer renders with correct template
2. Leaderboard page with Pro tier → footer does NOT render
3. Footer inherits parent background (no white band on warm ivory)
4. `pnpm lint` and `pnpm build` pass with zero errors

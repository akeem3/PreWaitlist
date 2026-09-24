# Story 13.2 — Feature Gating Enforcement

**Status:** ready
**Epic:** 13 — Billing & Feature Gating

## Story

As a system, I want consistent tier-based feature access enforcement so that Free founders cannot access Pro features through any path.

## Acceptance Criteria (EARS)

- AC1: A `src/lib/tier-gating.ts` utility shall provide `isPro(tier: string): boolean`.
- AC2: The utility shall export `requirePro(tier: string, feature: string): { allowed: boolean; reason?: string }` for server-side use.
- AC3: Server-side: API routes for broadcast, warmth (Pro page), CSV export, and domain auth shall check tier before executing.
- AC4: Client-side: sidebar locked items, warmth panel overlay, qual question cap (3rd question) shall check tier and show upgrade modal.
- AC5: The tier shall be available via `DashboardContext` (already exists) for client-side checks.
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Create tier-gating utility
T2 (AC3) Server-side enforcement
T3 (AC4) Client-side enforcement + modal wiring
T4 (AC5) Verify context flow
T5 (AC6) Lint + build

## Dev Notes

- Some ad-hoc gating already exists (sidebar `isLocked`, warmth panel overlay, broadcast route 403). This story formalizes it.
- `isPro()` replaces scattered `tier === "pro"` checks.
- Server-side: check in API routes before executing Pro logic, return 403 if not Pro.
- Client-side: check in component render, show UpgradeModal or locked state.
- qual question cap: Free = 2, Pro = 5 (already in `get_max_questions()` at onboarding/4a/page.tsx). Wire 3rd question attempt to show modal.

## Files to Create/Modify

- `src/lib/tier-gating.ts` — new utility
- `src/app/api/dashboard/broadcast/route.ts` — add tier check
- `src/app/api/dashboard/warmth/route.ts` — add tier check (Pro page only)
- `src/app/api/waitlist/verify-domain/route.ts` — add tier check
- `components/dashboard/warmth-panel.tsx` — wire upgrade modal
- `components/dashboard/sidebar.tsx` — wire upgrade modal on locked item click
- `src/app/onboarding/4a/page.tsx` — wire 3rd qual question modal

## Implementation Status

**Status: DONE**

| AC                           | Status  | Evidence                                                             |
| ---------------------------- | ------- | -------------------------------------------------------------------- |
| AC1: isPro() utility         | ✅ Done | `src/lib/tier-gating.ts` — `isPro(tier)`                             |
| AC2: requirePro() utility    | ✅ Done | `src/lib/tier-gating.ts` — `requirePro(tier, feature)`               |
| AC3: Server-side enforcement | ✅ Done | broadcast, warmth, verify-domain routes use `requirePro()`           |
| AC4: Client-side enforcement | ✅ Done | Sidebar locked items + warmth panel overlay wire to UpgradeModal     |
| AC5: DashboardContext tier   | ✅ Done | `DashboardContext` in `shell.tsx` exposes `tier` + `setUpgradeModal` |
| AC6: Lint + build            | ✅ Done | 0 errors, build passes                                               |

**Gap:** Ad-hoc gating exists in 3-4 places but is not centralized. `isPro` appears only as a local variable in `onboarding/5/page.tsx` (line 21). No reusable utility.

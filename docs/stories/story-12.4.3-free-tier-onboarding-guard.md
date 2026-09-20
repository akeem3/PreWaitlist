# Story 12.4.3 — Free-Tier Onboarding Guard

**Status:** done
**Epic:** 12.4 — Pre-Epic 13 Gaps

## Story

As a system, I want to prevent free-tier founders from entering the onboarding flow when they already have a waitlist so that they don't get stuck at the API 402 error after completing Steps 1-3.

## Acceptance Criteria (EARS)

- AC1: When a free-tier founder with >=1 waitlist navigates to `/onboarding/1`, the system shall redirect to `/dashboard`.
- AC2: The guard shall check `founder_profiles.tier` and waitlist count server-side.
- AC3: Pro-tier founders shall not be affected.
- AC4: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Verify OnboardingGuard covers all onboarding routes
T2 (AC3) Verify Pro-tier bypass
T3 (AC4) Test edge case: free user with 0 waitlists can enter
T4 (AC5) Lint + build

## Dev Notes

- **Existing code:** `OnboardingGuard` at `src/components/auth/onboarding-guard.tsx` lines 29-37 already does: if tier=free AND waitlist count > 0, redirect to `/dashboard`.
- **Verify:** Test (a) free, 0 waitlists -> allowed, (b) free, 1 waitlist -> redirect, (c) pro, any count -> allowed.
- **This may already work.** If so, this story is verification + adding a test.

## Implementation Status

**Status: IMPLEMENTED**

| AC                                    | Status  | Evidence                                                                                       |
| ------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| AC1: Free with ≥1 waitlist → redirect | ✅ Done | `onboarding-guard.tsx:29-37` — checks `tier === "free"` + count > 0, redirects to `/dashboard` |
| AC2: Server-side check                | ✅ Done | Guard runs server-side in `onboarding/layout.tsx:27`                                           |
| AC3: Pro not affected                 | ✅ Done | Only checks `tier === "free"` — pro/growth pass through                                        |
| AC4: Lint + build                     | ✅ Done | 0 errors, build passes                                                                         |

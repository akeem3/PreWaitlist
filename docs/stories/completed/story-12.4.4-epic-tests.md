# Story 12.4.4 — Epic 12.4 Tests

**Status:** done
**Epic:** 12.4 — Pre-Epic 13 Gaps

## Story

As a developer, I want tests for the pre-Epic 13 gap fixes so that I can verify correctness and prevent regressions.

## Acceptance Criteria (EARS)

- AC1: Test for `POST /api/subscribers` verifying subscriber_count is incremented.
- AC2: Test for qualification page verifying it passes waitlistId.
- AC3: Test for DashboardContext verifying activeWaitlistId is exposed.
- AC4: Test for onboarding guard verifying free-tier redirect.
- AC5: Lint and build shall pass with zero errors.
- AC6: Total test count shall increase by at least 4.

## Tasks

T1 (AC1) subscriber_count increment test
T2 (AC2) Qualification page scoping test
T3 (AC3) DashboardContext test
T4 (AC4) Onboarding guard test
T5 (AC5-AC6) Lint + build + count

## Dev Notes

- Test files: `src/__tests__/api/` for routes, `src/__tests__/components/` for components.
- subscriber_count test: mock Supabase, POST /api/subscribers, verify update call.
- onboarding guard test: render guard with mocked responses for different tier/count, verify redirect.

## Implementation Status

**Status: IMPLEMENTED**

| AC                           | Status  | Evidence                                                                                               |
| ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| AC1: subscriber_count test   | ✅ Done | `subscribers.test.ts` — "increments subscriber_count via RPC after successful insert" (7 total tests)  |
| AC2: Qualification page test | ✅ Done | `dashboard-qualification-page.test.tsx` — "passes waitlistId to qualification panel" (3 total tests)   |
| AC3: DashboardContext test   | ✅ Done | `dashboard-context.test.tsx` — 4 tests: tier, activeWaitlistId, null context, update (NEW FILE)        |
| AC4: Onboarding guard test   | ✅ Done | `onboarding-guard.test.tsx` — 4 tests: free+0 allowed, free+1 redirect, pro allowed, unauth (NEW FILE) |
| AC5: Lint + build            | ✅ Done | 0 errors, build passes                                                                                 |
| AC6: +4 tests                | ✅ Done | 18 new tests across 4 files (was 302, now 320)                                                         |

**New files:** `dashboard-context.test.tsx`, `onboarding-guard.test.tsx`

# Story 12.4.4 — Epic 12.4 Tests

**Status:** ready
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

**Status: NOT IMPLEMENTED**

| AC                           | Status      | Evidence                                                                                  |
| ---------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| AC1: subscriber_count test   | ❌ Not done | `subscribers.test.ts` (187 lines, 5 tests) does not test count increment                  |
| AC2: Qualification page test | ❌ Not done | `dashboard-qualification-page.test.tsx` tests heading + subdomain, not waitlistId passing |
| AC3: DashboardContext test   | ❌ Not done | No context test file exists                                                               |
| AC4: Onboarding guard test   | ❌ Not done | No guard test file exists                                                                 |
| AC5: Lint + build            | ⏳ Pending  | —                                                                                         |
| AC6: +4 tests                | ❌ Not done | 54 test files exist currently                                                             |

**Gap:** Depends on stories 12.4.0–12.4.2 being implemented first. Tests cannot be written until the code they test exists.

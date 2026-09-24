# Story 13.6 — Epic 13 Tests

**Status:** ready
**Epic:** 13 — Billing & Feature Gating

## Story

As a developer, I want comprehensive tests for billing and feature gating so that I can verify correctness and prevent regressions.

## Acceptance Criteria (EARS)

- AC1: API route tests for `POST /api/billing/checkout` covering: creates checkout session, returns error for unauthenticated.
- AC2: API route tests for `POST /api/webhooks/paddle` covering: subscription.created updates tier, subscription.canceled reverts to free, invalid signature rejected.
- AC3: Component tests for upgrade modal: renders for each trigger, dismiss behavior, cooldown logic.
- AC4: API route tests for `POST /api/subscribers` covering: returns 403 when Free tier cap hit (500), allows Pro tier past cap.
- AC5: Component tests for feature gating: Pro features locked for Free, unlocked for Pro.
- AC6: Lint and build shall pass with zero errors.
- AC7: Total test count shall increase by at least 15.

## Tasks

T1 (AC1-AC2) Billing API tests
T2 (AC3) Upgrade modal tests
T3 (AC4) Subscriber cap tests
T4 (AC5) Feature gating tests
T5 (AC6-AC7) Lint + build + count

## Dev Notes

- Mock Paddle SDK in tests (vi.mock("@paddle/paddle-js")).
- Mock Supabase for tier checks and updates.
- Test the webhook handler with synthetic Paddle payloads.
- Test cooldown: set localStorage, verify modal doesn't show within 7 days.
- Test cap: mock waitlist with subscriber_count=500, verify 403 response.

## Files to Create

- `src/__tests__/api/billing-checkout.test.ts` — new
- `src/__tests__/api/paddle-webhook.test.ts` — new
- `src/__tests__/components/upgrade-modal.test.tsx` — new
- `src/__tests__/api/subscribers-cap.test.ts` — new
- `src/__tests__/components/feature-gating.test.tsx` — new

## Implementation Status

**Status: NOT IMPLEMENTED**

| AC                          | Status      | Evidence                        |
| --------------------------- | ----------- | ------------------------------- |
| AC1: Billing checkout tests | ❌ Not done | No test files exist for billing |
| AC2: Paddle webhook tests   | ❌ Not done | —                               |
| AC3: Upgrade modal tests    | ❌ Not done | —                               |
| AC4: Subscriber cap tests   | ❌ Not done | —                               |
| AC5: Feature gating tests   | ❌ Not done | —                               |
| AC6: Lint + build           | ⏳ Pending  | —                               |
| AC7: +15 tests              | ❌ Not done | —                               |

**Gap:** Depends on stories 13.0–13.5 being implemented first. All 5 test files listed above need to be created.

# Story 11.6 — Epic 11 Tests

**Epic:** 11 — Warmth Tracking Engine
**Status:** done
**Depends on:** 11.0–11.5
**Design Refs:** None

## Story

As a developer, I want comprehensive tests for the warmth tracking engine so that I can verify correctness and prevent regressions.

## Acceptance Criteria (EARS)

- AC1: The system shall have API route tests for `POST /api/webhooks/resend` covering: valid event storage, signature verification failure (401), missing svix headers (401), idempotent handling (duplicate event), event type validation — `src/__tests__/api/webhook-resend.test.ts` (7 tests, Story 15.5).
- AC2: The system shall have unit tests for `calculateWarmthScore()` covering: score with multiple signals, score clamping (0–100), tier assignment (Hot/Warm/Cold/Unscored), time decay application, zero-event subscriber — `src/__tests__/lib/warmth.test.ts` and `src/__tests__/lib/warmth-batch.test.ts`.
- AC3: The system shall have component tests for the warmth badge rendering (Hot/Warm/Cold/Unscored variants) — `src/__tests__/components/dashboard-warmth-page.test.tsx`.
- AC4: The system shall have component tests for the warmth filter dropdown (dropdown renders, tier filtering verified) — `src/__tests__/components/dashboard-warmth-page.test.tsx`.
- AC5: The system shall have component tests for the warmth distribution panel (real data, empty state) and warning-banner threshold logic — `src/__tests__/components/warmth-panel.test.tsx` and `src/__tests__/components/warning-banner.test.tsx` (Story 15.5).
- AC6: Lint and build shall pass with zero errors.
- AC7: Total test count for Sprint 3 shall be ≥250 (current: 527).

## Tasks

T1 (AC1) Webhook route tests · T2 (AC2) Warmth calculation unit tests · T3 (AC3-AC4) Warmth badge + filter component tests · T4 (AC5) Warmth panel component tests · T5 (AC6-AC7) Lint + build + count verification

## Out of Scope

E2E tests (manual testing for MVP), load/stress testing.

## Implementation Details

### T1: Webhook route tests

> **Shipped (Story 15.5):** `src/__tests__/api/webhook-resend.test.ts` — 7 tests: missing headers 401 (:84), signature failure 401 (:99), valid click storage with svix id (:112), idempotent skip on duplicate (:147), unknown event type 200 (:161), unknown subscriber 200 (:171), multi-waitlist attribution (:183). The `vi.mock("svix")` snippet below is obsolete — the route verifies via the Resend SDK.

- **New file:** `src/__tests__/api/webhook-resend.test.ts`
- Mock: Supabase client, Svix verification, `req.text()`

Test cases:

1. **Valid event storage:** POST with valid Svix signature + email.clicked event → row created in email_events with correct event_type, subscriber_id, waitlist_id
2. **Signature verification failure (AC1):** POST with invalid Svix signature → 401 Unauthorized
3. **Idempotent handling (AC5):** POST same Svix message ID twice → only one row in email_events
4. **Event type validation:** POST with unknown event type (e.g., `email.spam`) → handled gracefully (skip or 400)
5. **Unknown subscriber:** POST with email not in subscribers table → 200 (skip, don't fail webhook)
6. **Missing headers:** POST without svix-id/svix-timestamp/svix-signature → 401

```typescript
// Mock pattern
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Mock Svix verification to succeed/fail
vi.mock("svix", () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: vi.fn(), // or throw for failure case
  })),
}));
```

### T2: Warmth calculation unit tests

> **Shipped (Story 15.0):** `src/__tests__/lib/warmth.test.ts` (29 tests) + `src/__tests__/lib/warmth-batch.test.ts` (5). Signatures evolved with Story 15.0 — e.g. `assignTier(score, hadEngagement)` and clicked-only decay reference; the sample test below shows the pre-15.0 signature.

- **New file:** `src/__tests__/lib/warmth.test.ts`
- Pure function tests — no DB calls (mock Supabase)

Test cases:

1. **Score with multiple signals:** Subscriber with 2 clicks (10) + 1 referral (15) + qual answers (8) = 33 → tier = "cold"
2. **Score clamping at 100:** Subscriber with many events → score caps at 100, never exceeds
3. **Score clamping at 0:** Subscriber with decay penalty > raw score → score = 0, never negative
4. **Tier assignment thresholds:** score=70 → "hot", score=69 → "warm", score=39 → "cold", score=0 → null
5. **Time decay at 60 days:** Last event 70 days ago → -25 penalty applied
6. **Time decay at 90 days:** Last event 100 days ago → score resets to 0
7. **Zero-event subscriber:** No events → score = 0, tier = null (Unscored)
8. **No decay for recent activity:** Last event 10 days ago → no penalty

```typescript
// Test the pure functions
import { calculateWarmthScore, assignTier } from "@/lib/warmth";

test("assignTier returns correct tiers", () => {
  expect(assignTier(70)).toBe("hot");
  expect(assignTier(69)).toBe("warm");
  expect(assignTier(39)).toBe("cold");
  expect(assignTier(0)).toBeNull();
});
```

### T3: Warmth badge + filter component tests

> **Superseded:** `warmth-badge.test.tsx` and `warmth-filter.test.tsx` were never created — badge + filter coverage lives in `src/__tests__/components/dashboard-warmth-page.test.tsx` (badge assertions at :61, filter tests at :67-79).

- **New file:** `src/__tests__/components/warmth-badge.test.tsx`
- **New file:** `src/__tests__/components/warmth-filter.test.tsx`

#### Warmth badge tests

Test cases:

1. Renders "Hot" with green class when score="hot"
2. Renders "Warm" with amber class when score="warm"
3. Renders "Cold" with blue class when score="cold"
4. Renders "Unscored" with grey class when score=null

#### Warmth filter tests

Test cases:

1. Renders all 5 options (All, Hot, Warm, Cold, Unscored)
2. Selecting "Hot" calls onChange with "hot"
3. Selecting "All" calls onChange with empty string or null
4. Default value is "All"

### T4: Warmth panel component tests

> **Shipped (Story 15.5):** `src/__tests__/components/warmth-panel.test.tsx` (5 tests) — props-based (`warmthData`, no fetch mock; the panel stopped fetching in Story 15.4) — plus `src/__tests__/components/warning-banner.test.tsx` (5 tests).

- **New file:** `src/__tests__/components/warmth-panel.test.tsx`
- Mock: `fetch` for `/api/dashboard/warmth`

Test cases:

1. **Real data:** Mock fetch returns `{ hot: 10, warm: 5, cold: 3, unscored: 2, total: 20 }` → renders 4 bars with correct counts
2. **Empty state:** Mock fetch returns `{ hot: 0, warm: 0, cold: 0, unscored: 0, total: 0 }` → renders em-dashes
3. **Bar widths:** Hot bar width = 50% (10/20), Warm = 25% (5/20), etc.
4. **No blur/lock:** Panel renders without blur overlay for any tier

### T5: Lint + build + count verification

- Run `pnpm lint` and `pnpm build`
- Run `pnpm test` and count total tests
- Baseline at writing: 231 tests → delivered: **527 tests** (520 pass, 7 pre-existing baseline failures)
- Sprint 3 target: ≥250 — met (527)

## Verification

1. Run `pnpm test` — 527 tests, 520 pass (7 pre-existing baseline failures: dashboard-archive 4, dashboard-subscriber-table 3)
2. Target ≥250 met (527)
3. Coverage map: webhook route → `webhook-resend.test.ts`; calc/decay/batch → `warmth.test.ts` + `warmth-batch.test.ts`; badge + filter → `dashboard-warmth-page.test.tsx`; panel + banner → `warmth-panel.test.tsx` + `warning-banner.test.tsx`; segments → `dashboard-segments.test.ts`
4. Run `pnpm lint` and `pnpm build` — verify zero errors

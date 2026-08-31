---
id: epic8.story05
epic: epic-8-thank-you-referral-loop
title: Epic 8 Tests
status: ready
depends_on:
  [epic8.story00, epic8.story01, epic8.story02, epic8.story03, epic8.story04]
updated: 2026-08-17
---

# Story 8.5 — Epic 8 Tests

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As the founder, I want comprehensive tests for all Epic 8 components and API routes so that the thank-you page, referral link generation, referral tracking, share buttons, and dashboard referral column work correctly and don't regress.

## Test Infrastructure

- **Unit/Component tests:** Vitest + `@testing-library/react` + `@testing-library/user-event`
- **E2E tests:** Playwright
- **Config:** `vitest.config.mts` (happy-dom environment, `src/**/*.test.{ts,tsx}`)
- **Setup:** `src/__tests__/setup.ts` (clipboard mock, cleanup after each test)
- **Test location:** `src/__tests__/components/` for component tests, `src/__tests__/api/` for API route tests, `tests/e2e/` for e2e tests
- **Run commands:** `pnpm test` (vitest), `pnpm test:e2e` (playwright)

## Acceptance Criteria (EARS)

- AC1: The system shall have component tests for the thank-you page (`components/share/thank-you-page.tsx` or page route) covering: renders position number, renders referral link, renders "Referred by a friend" when referrer_id present, renders PoweredByFooter when tier = Free.
- AC2: The system shall have component tests for `components/share/referral-link.tsx` covering: renders full referral URL, copies to clipboard on click, shows "Copied!" feedback, reverts after 2 seconds.
- AC3: The system shall have component tests for `components/share/share-buttons.tsx` covering: renders Twitter button with correct URL, renders LinkedIn button with correct URL, renders Copy Link button, copies to clipboard on click.
- AC4: The system shall have component tests for the referred variant display covering: shows "Referred by a friend" heading when ref param present, shows referrer email (anonymized), does not show referred section for direct signups.
- AC5: The system shall have API route tests for referral tracking in `POST /api/subscribers` covering: stores referrer_id on valid referral, increments referrer's referral count, rejects invalid referrer_id (returns 400), rejects self-referral (returns 400), rejects cross-waitlist referrer_id (returns 400).
- AC6: The system shall have API route tests for `GET /api/subscribers/:id/referrals` covering: returns referral_count and referrals list, returns 404 for unknown subscriber, returns 401 without auth.
- AC7: The system shall have component tests for dashboard referral column covering: renders referral count for each subscriber, displays "0" for subscribers with no referrals.
- AC8: The system shall have an e2e test (`tests/e2e/thank-you-flow.spec.ts`) covering: subscriber sees thank-you page after signup, page shows position and referral link, share buttons are present.
- AC9: All tests shall pass with `pnpm test` and `pnpm test:e2e` (if e2e env configured).
- AC10: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1): Thank-you page component tests
- T2 (AC2): Referral link component tests
- T3 (AC3): Share buttons component tests
- T4 (AC4): Referred variant display tests
- T5 (AC5): Referral tracking API tests
- T6 (AC6): GET /api/subscribers/:id/referrals route tests
- T7 (AC7): Dashboard referral column tests
- T8 (AC8): E2E thank-you flow test
- T9 (AC9-AC10): Run all tests + lint + build

## Out of scope

Tests for Epic 7 features (covered in Story 7.7), tests for Epic 10 dashboard features, tests for Epic 11 email features.

## Dev Notes

### T1 — Thank-You Page Tests

Create `src/__tests__/components/thank-you-page.test.tsx`.

**Test cases:**

1. `it("renders position number")` — render with mock subscriber data (position: 42), assert "You're #42 in line" visible
2. `it("renders referral link")` — render with mock referral_code, assert full URL visible in input
3. `it("renders Referred by a friend when referrer exists")` — render with referrer_id set, assert heading visible
4. `it("does not render referred section for direct signup")` — render without referrer_id, assert no "Referred by" heading
5. `it("renders PoweredByFooter when tier is free")` — render with tier="free", assert footer visible

**Mock data:**

```ts
const mockSubscriber = {
  id: "test-id",
  email: "test@example.com",
  position: 42,
  referral_code: "abc12345",
  referrer_id: null,
  waitlists: {
    subdomain: "test",
    founder_profiles: { tier: "free" },
  },
};
```

### T2 — Referral Link Tests

Create `src/__tests__/components/referral-link.test.tsx`.

**Test cases:**

1. `it("renders full referral URL")` — render with url prop, assert input value matches
2. `it("copies URL to clipboard on click")` — click copy button, assert `navigator.clipboard.writeText` called with url
3. `it("shows Copied! feedback")` — click copy, assert button text changes to "Copied!"
4. `it("reverts after 2 seconds")` — click copy, advance timers by 2000ms, assert button text reverts to "Copy"

**Mock clipboard:**

```ts
const writeTextMock = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: writeTextMock },
  writable: true,
  configurable: true,
});
```

### T3 — Share Buttons Tests

Create `src/__tests__/components/share-buttons.test.tsx`.

**Test cases:**

1. `it("renders Twitter link with correct URL")` — assert href contains `twitter.com/intent/tweet`
2. `it("renders LinkedIn link with correct URL")` — assert href contains `linkedin.com/sharing/share-offsite`
3. `it("renders Copy Link button")` — assert button exists
4. `it("copies to clipboard on Copy Link click")` — click, assert clipboard.writeText called

### T4 — Referred Variant Tests

Create `src/__tests__/components/referred-variant.test.tsx`.

**Test cases:**

1. `it("shows Referred by a friend when referrer_id present")` — render with referrer, assert heading
2. `it("shows anonymized referrer email")` — render with referrer email "friend@example.com", assert "f••••m@example.com"
3. `it("does not show referred section when referrer_id is null")` — render without referrer, assert no heading

### T5 — Referral Tracking API Tests

Create `src/__tests__/api/subscribers-referral.test.ts`.

**Test cases:**

1. `it("stores referrer_id on valid referral")` — mock Supabase, send valid referrer_id, assert insert includes it
2. `it("rejects invalid referrer_id")` — send non-existent referrer_id, assert 400
3. `it("rejects self-referral")` — send referrer_id matching own id (after insert), assert handled
4. `it("rejects cross-waitlist referrer_id")` — send referrer from different waitlist, assert 400

### T6 — GET /api/subscribers/:id/referrals Tests

Create `src/__tests__/api/subscribers-referrals.test.ts`.

**Test cases:**

1. `it("returns referral_count and referrals list")` — mock data, assert shape
2. `it("returns 404 for unknown subscriber")` — mock no subscriber
3. `it("returns 401 without auth")` — mock auth error

### T7 — Dashboard Referral Column Tests

Create `src/__tests__/components/dashboard-referral-column.test.tsx`.

**Test cases:**

1. `it("renders referral count for each subscriber")` — render table with mock data, assert counts visible
2. `it("displays 0 for subscribers with no referrals")` — render subscriber with referral_count=0, assert "0" visible

### T8 — E2E Thank-You Flow

Create `tests/e2e/thank-you-flow.spec.ts`.

**Test flow:**

```ts
test("subscriber sees thank-you page after signup", async ({ page }) => {
  // Complete signup
  await page.goto("/test-subdomain");
  await page.fill('input[type="email"]', "test@example.com");
  await page.click('button[type="submit"]');

  // Verify thank-you page
  await page.waitForURL(/thank-you/);
  await expect(page.locator("h1")).toContainText(/in the line/i);
  await expect(page.locator("input[readonly]")).toBeVisible(); // referral link
});
```

### T9 — Run All Tests

```bash
pnpm test
pnpm test:e2e  # if env configured
pnpm lint
pnpm build
```

**Files created:**

- `src/__tests__/components/thank-you-page.test.tsx`
- `src/__tests__/components/referral-link.test.tsx`
- `src/__tests__/components/share-buttons.test.tsx`
- `src/__tests__/components/referred-variant.test.tsx`
- `src/__tests__/api/subscribers-referral.test.ts`
- `src/__tests__/api/subscribers-referrals.test.ts`
- `src/__tests__/components/dashboard-referral-column.test.tsx`
- `tests/e2e/thank-you-flow.spec.ts`

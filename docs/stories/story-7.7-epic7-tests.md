---
id: epic7.story07
epic: epic-7-public-waitlist-page
title: Epic 7 Tests
status: ready
depends_on:
  [
    epic7.story00,
    epic7.story01,
    epic7.story02,
    epic7.story03,
    epic7.story04,
    epic7.story05,
    epic7.story06,
  ]
updated: 2026-08-17
---

# Story 7.7 — Epic 7 Tests

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As the founder, I want comprehensive tests for all Epic 7 components and API routes so that the public waitlist page, email capture, qualification questions, leaderboard, and updates feed work correctly and don't regress.

## Test Infrastructure

- **Unit/Component tests:** Vitest + `@testing-library/react` + `@testing-library/user-event`
- **E2E tests:** Playwright
- **Config:** `vitest.config.mts` (happy-dom environment, `src/**/*.test.{ts,tsx}`)
- **Setup:** `src/__tests__/setup.ts` (clipboard mock, cleanup after each test)
- **Test location:** `src/__tests__/components/` for component tests, `src/__tests__/api/` for API route tests, `tests/e2e/` for e2e tests
- **Run commands:** `pnpm test` (vitest), `pnpm test:e2e` (playwright)

## Acceptance Criteria (EARS)

- AC1: The system shall have component tests for `components/public/email-capture-form.tsx` covering: renders email input with placeholder, validates email format (shows error on invalid), shows loading state during submission, displays error on 409 duplicate email, calls onSubmit with correct email value, clears error on input change.
- AC2: The system shall have component tests for `components/public/updates-feed.tsx` covering: renders list of updates with body and timestamp, sorts by newest first, returns null when no updates exist.
- AC3: The system shall have component tests for the leaderboard display covering: renders ranked list, sorts by referral count descending, anonymizes emails correctly (`"john@example.com"` → `"j••••m@example.com"`), displays milestone badges when thresholds reached.
- AC4: The system shall have API route tests for `POST /api/subscribers` covering: creates subscriber with valid data (returns 201 with id, email, referral_code, position), returns 409 on duplicate email with correct error message, generates unique 8-char referral_code, assigns sequential position (1, 2, 3...), stores qual_answers when provided, rejects invalid email format (returns 400).
- AC5: The system shall have API route tests for `GET /api/leaderboard/:subdomain` covering: returns subscribers ranked by referral count, returns empty array for unknown subdomain, anonymizes emails in response.
- AC6: The system shall have API route tests for `GET /api/subscribers/:id` covering: returns subscriber with position and referral count, returns 404 for unknown subscriber, enforces founder ownership (returns 401 without auth).
- AC7: The system shall have an e2e test (`tests/e2e/public-waitlist.spec.ts`) covering: visitor can land on `/:subdomain`, page displays headline, visitor can fill email and submit, redirect to thank-you page after submission.
- AC8: All tests shall pass with `pnpm test` and `pnpm test:e2e` (if e2e env configured).
- AC9: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1): Email capture form component tests
- T2 (AC2): Updates feed component tests
- T3 (AC3): Leaderboard display tests
- T4 (AC4): POST /api/subscribers route tests
- T5 (AC5): GET /api/leaderboard/:subdomain route tests
- T6 (AC6): GET /api/subscribers/:id route tests
- T7 (AC7): E2E public waitlist flow test
- T8 (AC8-AC9): Run all tests + lint + build

## Out of scope

Tests for Epic 8 features (thank-you page, referral tracking, share buttons — covered in Story 8.5), tests for Epic 10 dashboard features, tests for Epic 11 email features.

## Dev Notes

### T1 — Email Capture Form Tests

Create `src/__tests__/components/email-capture-form.test.tsx`.

**Mock `fetch` globally:**

```ts
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);
```

**Test cases:**

1. `it("renders email input with placeholder")` — render with props, assert input exists with placeholder "Email address"
2. `it("displays error for invalid email")` — type "invalid", submit, assert error message
3. `it("shows loading state during submission")` — mock fetch to delay, submit, assert button is disabled and spinner visible
4. `it("displays error on 409 duplicate email")` — mock fetch to return 409, assert error text "This email is already on the waitlist"
5. `it("calls fetch with correct body")` — submit form, assert fetch called with `{ waitlist_id, email, referrer_id }`
6. `it("clears error on input change")` — trigger error, type new character, assert error cleared

**Pattern reference:** `src/__tests__/components/share-copy-link.test.tsx`

### T2 — Updates Feed Tests

Create `src/__tests__/components/updates-feed.test.tsx`.

**Test cases:**

1. `it("renders updates with body and timestamp")` — render with mock data, assert body text and formatted date visible
2. `it("renders nothing when updates array is empty")` — render with `[]`, assert no section element
3. `it("sorts updates newest first")` — render with out-of-order dates, assert DOM order matches

### T3 — Leaderboard Display Tests

Create `src/__tests__/components/leaderboard-display.test.tsx`.

**Test cases:**

1. `it("renders subscribers ranked by referral count")` — render with mock data, assert order
2. `it("anonymizes emails correctly")` — test `anonymizeEmail` function: `"john@example.com"` → `"j••••m@example.com"`, `"ab@example.com"` → `"a••••b@example.com"`
3. `it("displays milestone badges when thresholds reached")` — render with subscriber at 10 referrals and milestone at 10, assert badge visible

### T4 — POST /api/subscribers Tests

Create `src/__tests__/api/subscribers.test.ts`.

**Mock Supabase client:**

```ts
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
```

**Test cases:**

1. `it("creates subscriber with valid data")` — mock Supabase insert to return data, assert 201 response with correct shape
2. `it("returns 409 on duplicate email")` — mock Supabase insert to throw 23505 error, assert 409 with message
3. `it("generates unique referral_code")` — assert code is 8 chars alphanumeric
4. `it("assigns sequential position")` — mock max position query, assert position = max + 1
5. `it("stores qual_answers when provided")` — include qual_answers in body, assert insert called with them
6. `it("rejects invalid email")` — send invalid email, assert 400 response

### T5 — GET /api/leaderboard/:subdomain Tests

Create `src/__tests__/api/leaderboard.test.ts`.

**Test cases:**

1. `it("returns subscribers ranked by referral count")` — mock data, assert sorted response
2. `it("returns empty array for unknown subdomain")` — mock no waitlist found, assert `[]`
3. `it("anonymizes emails")` — assert emails are anonymized in response

### T6 — GET /api/subscribers/:id Tests

Create `src/__tests__/api/subscribers-id.test.ts`.

**Test cases:**

1. `it("returns subscriber with position and referral count")` — mock data, assert shape
2. `it("returns 404 for unknown subscriber")` — mock no subscriber found
3. `it("returns 401 without auth")` — mock auth error, assert 401

### T7 — E2E Public Waitlist Flow

Create `tests/e2e/public-waitlist.spec.ts`.

**Test flow:**

```ts
test("visitor can sign up for waitlist", async ({ page }) => {
  await page.goto("/test-subdomain");
  await expect(page.locator("h1")).toContainText(/waitlist/i);
  await page.fill('input[type="email"]', "test@example.com");
  await page.click('button[type="submit"]');
  await page.waitForURL(/thank-you/);
  await expect(page).toHaveURL(/subscriber_id/);
});
```

### T8 — Run All Tests

```bash
pnpm test
pnpm test:e2e  # if env configured
pnpm lint
pnpm build
```

**Files created:**

- `src/__tests__/components/email-capture-form.test.tsx`
- `src/__tests__/components/updates-feed.test.tsx`
- `src/__tests__/components/leaderboard-display.test.tsx`
- `src/__tests__/api/subscribers.test.ts`
- `src/__tests__/api/leaderboard.test.ts`
- `src/__tests__/api/subscribers-id.test.ts`
- `tests/e2e/public-waitlist.spec.ts`

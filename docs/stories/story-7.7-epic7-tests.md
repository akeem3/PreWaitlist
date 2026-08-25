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

## Current State — Components That Exist

| Component               | File                                             | Notes                                                                            |
| ----------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| EmailCaptureForm        | `components/public/email-capture-form.tsx`       | Raw `<input>`/`<button>` elements, template-specific props                       |
| WaitlistPageContent     | `components/public/waitlist-page-content.tsx`    | Uses `WaitlistTemplateContent`, conditional dark bg                              |
| WaitlistTemplateContent | `components/share/waitlist-template-content.tsx` | Shared template (logo, headline, subheadline, form slot, counter, milestones)    |
| LivePreview             | `components/onboarding/live-preview.tsx`         | Uses `WaitlistTemplateContent`, `PreviewQuestionForm` with `flex flex-col gap-3` |
| SocialProofCounter      | `components/public/social-proof-counter.tsx`     | May exist — verify before writing tests                                          |
| LeaderboardTable        | `components/public/leaderboard-table.tsx`        | May exist — verify before writing tests                                          |

## Acceptance Criteria (EARS)

- AC1: The system shall have component tests for the email capture form (`components/public/email-capture-form.tsx`) covering: renders email input with placeholder, validates email format (shows error on invalid), shows loading state during submission, displays error on 409 duplicate email, calls onSubmit with correct email value, clears error on input change.
- AC2: The system shall have component tests for `components/share/waitlist-template-content.tsx` covering: renders headline and subheadline, renders logo when provided, renders form slot, conditionally renders milestone rewards.
- AC3: The system shall have component tests for the leaderboard display (whatever component exists after Story 7.5) covering: renders ranked list, sorts by referral count descending, anonymizes emails correctly, displays milestone badges when thresholds reached.
- AC4: The system shall have component tests for the social proof counter (if it exists as a separate component) covering: displays subscriber count, displays "X people ahead of you" text. If counter is inline in `email-capture-form.tsx`, test it there instead.
- AC5: The system shall have API route tests for `POST /api/subscribers` covering: creates subscriber with valid data (returns 201 with id, email, referral_code, position), returns 409 on duplicate email with correct error message, generates unique 8-char referral_code, assigns sequential position (1, 2, 3...), stores qual_answers when provided, rejects invalid email format (returns 400).
- AC6: The system shall have API route tests for `GET /api/leaderboard/:subdomain` covering: returns subscribers ranked by referral count, returns empty array for unknown subdomain, anonymizes emails in response.
- AC7: The system shall have API route tests for `GET /api/subscribers/:id` covering: returns subscriber with position and referral count, returns 404 for unknown subscriber, enforces founder ownership (returns 401 without auth).
- AC8: The system shall have an e2e test (`tests/e2e/public-waitlist.spec.ts`) covering: visitor can land on `/:subdomain`, page displays headline, visitor can fill email and submit, redirect to thank-you page after submission.
- AC9: All tests shall pass with `pnpm test` and `pnpm test:e2e` (if e2e env configured).
- AC10: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1): Email capture form component tests
- T2 (AC2): WaitlistTemplateContent component tests
- T3 (AC3): Leaderboard display tests
- T4 (AC4): Social proof counter tests (or inline tests in email-capture-form)
- T5 (AC5): POST /api/subscribers route tests
- T6 (AC6): GET /api/leaderboard/:subdomain route tests
- T7 (AC7): GET /api/subscribers/:id route tests
- T8 (AC8): E2E public waitlist flow test
- T9 (AC9-AC10): Run all tests + lint + build

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

### T2 — WaitlistTemplateContent Tests

Create `src/__tests__/components/waitlist-template-content.test.tsx`.

**Test cases:**

1. `it("renders headline and subheadline")` — render with mock waitlist data, assert text visible
2. `it("renders logo when logo_url provided")` — render with `logo_url`, assert `<img>` present
3. `it("renders form slot")` — render with `<div data-testid="form" />` as `formSlot`, assert slot rendered
4. `it("conditionally renders milestone rewards")` — render with milestones enabled, assert reward labels visible; render with disabled, assert not visible

### T3 — Leaderboard Display Tests

Create `src/__tests__/components/leaderboard-display.test.tsx` (or whatever the component is named after Story 7.5).

**Note:** The leaderboard component may not exist yet. If Story 7.5 hasn't been implemented when this test story runs, skip this task and note it as blocked.

**Test cases:**

1. `it("renders subscribers ranked by referral count")` — render with mock data, assert order
2. `it("anonymizes emails correctly")` — test `anonymizeEmail` function: `"john@example.com"` → `"j••••m@example.com"`, `"ab@example.com"` → `"a••••b@example.com"`
3. `it("displays milestone badges when thresholds reached")` — render with subscriber at 10 referrals and milestone at 10, assert badge visible

### T4 — Social Proof Counter Tests

**Note:** If the counter is inline in `email-capture-form.tsx` (not a separate component), test it as part of T1 instead.

If separate component exists:

1. `it("renders subscriber count")` — render with count=42, assert "42 people" visible
2. `it("renders position text")` — render with position=15, assert "15 of 42" or "15 people ahead" visible

### T5 — POST /api/subscribers Tests

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

### T6 — GET /api/leaderboard/:subdomain Tests

Create `src/__tests__/api/leaderboard.test.ts`.

**Test cases:**

1. `it("returns subscribers ranked by referral count")` — mock data, assert sorted response
2. `it("returns empty array for unknown subdomain")` — mock no waitlist found, assert `[]`
3. `it("anonymizes emails")` — assert emails are anonymized in response

### T7 — GET /api/subscribers/:id Tests

Create `src/__tests__/api/subscribers-id.test.ts`.

**Test cases:**

1. `it("returns subscriber with position and referral count")` — mock data, assert shape
2. `it("returns 404 for unknown subscriber")` — mock no subscriber found
3. `it("returns 401 without auth")` — mock auth error, assert 401

### T8 — E2E Public Waitlist Flow

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

### T9 — Run All Tests

```bash
pnpm test
pnpm test:e2e  # if env configured
pnpm lint
pnpm build
```

**Files created:**

- `src/__tests__/components/email-capture-form.test.tsx`
- `src/__tests__/components/waitlist-template-content.test.tsx`
- `src/__tests__/components/leaderboard-display.test.tsx` (or skipped if component doesn't exist)
- `src/__tests__/api/subscribers.test.ts`
- `src/__tests__/api/leaderboard.test.ts`
- `src/__tests__/api/subscribers-id.test.ts`
- `tests/e2e/public-waitlist.spec.ts`

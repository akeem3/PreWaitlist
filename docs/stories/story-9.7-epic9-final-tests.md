---
id: epic9.story07
epic: epic-9-dashboard-restructure
title: Epic 9 Final Tests
status: ready
depends_on:
  [
    epic9.story00,
    epic9.story01,
    epic9.story02,
    epic9.story03,
    epic9.story04,
    epic9.story06,
  ]
updated: 2026-09-05
---

# Story 9.7 — Epic 9 Final Tests

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As the founder, I want comprehensive tests covering every Epic 9 component, page, and API endpoint — including the remediation work from Story 9.6 — so that the entire dashboard is regression-proof and production-ready.

## Test Infrastructure

- **Unit/Component tests:** Vitest + `@testing-library/react` + `@testing-library/user-event`
- **Config:** `vitest.config.mts` (happy-dom environment, `src/**/*.test.{ts,tsx}`)
- **Setup:** `src/__tests__/setup.ts` (clipboard mock, cleanup after each test)
- **Test location:** `src/__tests__/components/` for component tests, `src/__tests__/api/` for API route tests
- **Run command:** `pnpm test` (vitest)

## Acceptance Criteria (EARS)

- AC1: The system shall have component tests for the dashboard sidebar covering: renders all 8 navigation items, active state highlighting, disabled/locked states, mobile hamburger toggle, sign-out button.
- AC2: The system shall have component tests for stat cards covering: renders 4 cards (Total Signups, Referrals, Today, Warmth), displays real subscriber count, displays referral percentage, displays today count, shows warmth locked state, shows em-dash when no data.
- AC3: The system shall have component tests for the signups-over-time chart covering: renders chart with data, renders empty state, 30d/All Time toggle, tooltip content.
- AC4: The system shall have component tests for the qualification breakdown panel covering: renders question + answer bars, empty state (no questions), empty state (no answers).
- AC5: The system shall have component tests for the top referrers panel covering: renders top 5, sorts by quality score, empty state (0 referrers), CTA in empty state.
- AC6: The system shall have component tests for the warmth distribution panel covering: renders 4 bars (Hot/Warm/Cold/Unscored), locked state for Free tier, live data for Pro tier, em-dash when no data.
- AC7: The system shall have component tests for the subscriber table covering: renders all columns (#, Email, Date, Referrals, Quality, Warmth), search filters by email, warmth filter dropdown, sort by position/referrals/quality, expandable row shows qual answers, row click navigation, empty state.
- AC8: The system shall have component tests for CSV export covering: button visible for Pro tier, button hidden for Free tier, CSV contains all 7 columns, CSV filename format.
- AC9: The system shall have component tests for the subscriber detail page covering: renders subscriber info, renders referral data, renders qualification answers, back button, not found state.
- AC10: The system shall have API route tests for `/api/dashboard/chart` covering: returns daily counts, handles empty data, requires auth.
- AC11: The system shall have API route tests for `/api/dashboard/qualification` covering: returns question distributions, handles no questions, requires auth.
- AC12: The system shall have API route tests for `/api/warmth/[subdomain]` covering: returns warmth counts, handles missing waitlist.
- AC13: All tests shall pass with `pnpm test`.
- AC14: Lint and build shall pass with zero errors.
- AC15: Total test count across the project shall be ≥200.

## Tasks

### Test Coverage Map

| #   | Test File                                | Covers                               | ACs       |
| --- | ---------------------------------------- | ------------------------------------ | --------- |
| T1  | `dashboard-sidebar.test.tsx`             | Sidebar component (Story 9.0)        | AC1       |
| T2  | `dashboard-stat-cards.test.tsx`          | Stat cards (Story 9.1)               | AC2       |
| T3  | `dashboard-signup-chart.test.tsx`        | Signups-over-time chart (Story 9.6)  | AC3       |
| T4  | `dashboard-qualification-panel.test.tsx` | Qualification breakdown (Story 9.6)  | AC4       |
| T5  | `dashboard-top-referrers.test.tsx`       | Top referrers panel (Story 9.6)      | AC5       |
| T6  | `dashboard-warmth-panel.test.tsx`        | Warmth distribution (Story 9.6)      | AC6       |
| T7  | `dashboard-subscriber-table.test.tsx`    | Subscriber table (Stories 9.2 + 9.6) | AC7       |
| T8  | `dashboard-csv-export.test.tsx`          | CSV export (Story 9.3)               | AC8       |
| T9  | `dashboard-subscriber-detail.test.tsx`   | Subscriber detail (Story 9.4)        | AC9       |
| T10 | `api-dashboard-chart.test.ts`            | Chart API route (Story 9.6)          | AC10      |
| T11 | `api-dashboard-qualification.test.ts`    | Qualification API route (Story 9.6)  | AC11      |
| T12 | `api-warmth-route.test.ts`               | Warmth API route (existing)          | AC12      |
| T13 | Run all tests + lint + build             | Full verification                    | AC13-AC15 |

---

## Out of Scope

- E2E tests (Playwright — not in Sprint 2 scope)
- Tests for Epic 7 features (covered in Story 7.8)
- Tests for Epic 8 features (covered in Story 8.5)
- Tests for Epic 10 features
- Performance/load testing
- Visual regression testing

---

## Dev Notes

### T1 — Sidebar Component Tests

File: `src/__tests__/components/dashboard-sidebar.test.tsx`

**Test cases:**

1. `renders all 8 navigation items` — Overview, Subscribers, Qualification, Leaderboard, Warmth, Updates, Broadcast, Settings
2. `highlights active navigation item` — Overview has `bg-accent rounded-full` when pathname is `/dashboard`
3. `disables Warmth and Broadcast items` — `opacity-50 cursor-not-allowed`, no `href`
4. `disables Qualification, Leaderboard, Updates, Settings items` — `opacity-50 cursor-not-allowed`, no `href`
5. `toggles mobile sidebar on hamburger click` — click hamburger → sidebar slides in
6. `calls onClose when overlay clicked` — mobile overlay click triggers `onClose`
7. `renders sign-out button` — sign-out button visible in sidebar bottom

**Mocks:** `next/navigation` (usePathname), `next/image`, `next/link`

### T2 — Stat Cards Tests

File: `src/__tests__/components/dashboard-stat-cards.test.tsx`

**Test cases:**

1. `renders 4 stat cards` — Total Signups, Referrals, Today, Warmth
2. `displays subscriber count` — given 42 subscribers, shows "42"
3. `displays referral percentage` — given 10/50 referred, shows "20%"
4. `displays today count` — given 3 signups today, shows "3"
5. `shows em-dash when total is 0` — empty subscribers → "—"
6. `shows warmth card locked state` — lock icon overlay present
7. `formats large numbers correctly` — 1000+ subscribers display without comma issues

**Data:** Mock subscriber array with controlled `created_at` dates and `referral_count` values.

### T3 — Signups-Over-Time Chart Tests

File: `src/__tests__/components/dashboard-signup-chart.test.tsx`

**Test cases:**

1. `renders chart with data` — bars present in DOM
2. `renders empty state message` — empty data array → "No signups in this period"
3. `renders 30d toggle as active by default` — default toggle state
4. `switches to All Time on click` — toggle click triggers callback or state change
5. `displays tooltip on bar hover` — Recharts tooltip component

**Mocks:** Recharts (mock with simplified div-based rendering), fetch for API data.

### T4 — Qualification Panel Tests

File: `src/__tests__/components/dashboard-qualification-panel.test.tsx`

**Test cases:**

1. `renders question text` — question string displayed
2. `renders answer bars` — each answer shown with count
3. `shows empty state when no questions` — "No qualification questions configured"
4. `shows empty state when no answers` — "No answers yet" when questions exist but answers are empty

### T5 — Top Referrers Panel Tests

File: `src/__tests__/components/dashboard-top-referrers.test.tsx`

**Test cases:**

1. `renders top 5 referrers` — 5 items max displayed
2. `sorts by quality score descending` — highest quality first
3. `shows empty state when 0 referrers` — "Share your link to get referrals"
4. `truncates long emails` — email overflow handled
5. `shows referral count badge` — count displayed for each referrer

### T6 — Warmth Panel Tests

File: `src/__tests__/components/dashboard-warmth-panel.test.tsx`

**Test cases:**

1. `renders 4 warmth bars` — Hot, Warm, Cold, Unscored
2. `shows locked state for free tier` — blur overlay + lock icon + "Pro" badge
3. `shows live data for pro tier` — real counts displayed
4. `shows em-dashes when no data` — null data → all bars show "—"
5. `renders bar widths proportional to total` — bar width = count/total × 100%

### T7 — Subscriber Table Tests

File: `src/__tests__/components/dashboard-subscriber-table.test.tsx`

**Test cases:**

1. `renders all 6 columns` — #, Email, Date, Referrals, Quality, Warmth
2. `search filters by email` — type "test" → only matching rows
3. `warmth filter filters by warmth score` — select "Hot" → only hot subscribers
4. `warmth filter "All" shows all subscribers` — default state
5. `sort by position ascending` — default sort
6. `sort by referrals descending on click` — header click toggles
7. `sort by quality score descending` — quality column sortable
8. `expands row on click to show qual answers` — first click expands
9. `navigates to detail on second click` — second click → `/dashboard/subscribers/:id`
10. `shows empty state` — "No subscribers yet"
11. `renders subscriber count` — "X subscribers" above table

### T8 — CSV Export Tests

File: `src/__tests__/components/dashboard-csv-export.test.tsx`

**Test cases:**

1. `button visible for pro tier` — tier="pro" → button rendered
2. `button hidden for free tier` — tier="free" → button not rendered
3. `CSV contains all 7 columns` — headers: Position, Email, Referral Code, Referrals, Quality Score, Warmth, Signup Date
4. `CSV filename matches format` — `subscribers-{subdomain}-{YYYY-MM-DD}.csv`
5. `CSV handles null quality score` — null → empty string in CSV
6. `CSV handles null warmth` — null → "Unscored" in CSV

**Mocks:** `URL.createObjectURL`, `document.createElement`, `navigator.clipboard`

### T9 — Subscriber Detail Page Tests

File: `src/__tests__/components/dashboard-subscriber-detail.test.tsx`

**Test cases:**

1. `renders subscriber position, email, signup date` — all fields displayed
2. `renders referral count and list` — referred subscribers listed
3. `renders qualification answers` — key-value pairs displayed
4. `back button links to /dashboard` — navigation correct
5. `shows not found for invalid ID` — error state rendered
6. `renders empty qual answers gracefully` — null qual_answers → no section

### T10 — Chart API Route Tests

File: `src/__tests__/api/api-dashboard-chart.test.ts`

**Test cases:**

1. `returns daily signup counts` — mock Supabase query, verify response shape
2. `returns empty array when no signups` — empty data
3. `requires authentication` — no auth → 401
4. `handles range=all parameter` — no date filter applied
5. `handles range=30d parameter` — date filter applied

**Mocks:** `@/lib/supabase/server` (createClient mock)

### T11 — Qualification API Route Tests

File: `src/__tests__/api/api-dashboard-qualification.test.ts`

**Test cases:**

1. `returns question distributions` — mock data, verify response shape
2. `returns empty questions when none exist` — empty data
3. `requires authentication` — no auth → 401

### T12 — Warmth API Route Tests

File: `src/__tests__/api/api-warmth-route.test.ts`

**Test cases:**

1. `returns warmth counts` — mock subscribers with warmth_score values
2. `returns 404 for missing waitlist` — invalid subdomain
3. `counts unscored correctly` — null warmth_score → unscored count

### T13 — Full Verification

```bash
pnpm test
pnpm lint
pnpm build
```

All must pass with zero errors. Total test count ≥200.

---

## Test Data Patterns

### Subscriber Mock Factory

```ts
function createMockSubscriber(overrides: Partial<Subscriber> = {}): Subscriber {
  return {
    id: crypto.randomUUID(),
    email: "test@example.com",
    position: 1,
    referral_code: "abc12345",
    referral_count: 0,
    created_at: new Date().toISOString(),
    warmth_score: null,
    quality_score: null,
    qual_answers: null,
    ...overrides,
  };
}
```

### Subscriber Array Mock

```ts
const mockSubscribers = [
  createMockSubscriber({
    email: "alice@example.com",
    referral_count: 5,
    warmth_score: "hot",
  }),
  createMockSubscriber({
    email: "bob@example.com",
    referral_count: 2,
    warmth_score: "warm",
  }),
  createMockSubscriber({
    email: "charlie@example.com",
    referral_count: 0,
    warmth_score: "cold",
  }),
  createMockSubscriber({
    email: "diana@example.com",
    referral_count: 0,
    warmth_score: null,
  }),
];
```

### Qualification Data Mock

```ts
const mockQualificationData = [
  {
    question: "How did you hear about us?",
    answers: [
      { value: "Twitter", count: 15 },
      { value: "Friend", count: 8 },
      { value: "Google", count: 5 },
    ],
  },
  {
    question: "What's your role?",
    answers: [
      { value: "Founder", count: 20 },
      { value: "Developer", count: 10 },
    ],
  },
];
```

### Warmth Data Mock

```ts
const mockWarmthData = { hot: 12, warm: 25, cold: 8, unscored: 5, total: 50 };
```

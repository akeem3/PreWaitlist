# Story 12.3.4 — Epic 12.3 Tests

**Epic:** 12.3 — Dashboard Section Pages
**Status:** ready
**Depends on:** 12.3.0–12.3.3
**Design Refs:** — (no UI)

## Story

As the developer, I want comprehensive tests for the new dashboard section pages so that navigation, data display, and tier gating work correctly.

## Acceptance Criteria (EARS)

- AC1: The system shall have component tests for the leaderboard page covering: renders ranked subscribers, pagination works, empty state, quality score display.
- AC2: The system shall have component tests for the qualification page covering: renders question cards, bar chart distribution, empty states.
- AC3: The system shall have component tests for the warmth page covering: summary stats, subscriber warmth table, tier gate, empty state.
- AC4: The system shall have tests for sidebar nav item unlocking: all items clickable, correct hrefs, Warmth locked for Free.
- AC5: All tests shall pass with `pnpm test`.
- AC6: Lint and build shall pass with zero errors.
- AC7: Total test count across the project shall be ≥280.

## Tasks

T1 (AC1) Leaderboard page tests · T2 (AC2) Qualification page tests · T3 (AC3) Warmth page tests · T4 (AC4) Sidebar unlock tests · T5 (AC5-AC7) Full verification

## Out of Scope

E2E navigation tests, API route tests.

## Implementation Details

### T1: Leaderboard page tests

- **New file:** `src/__tests__/components/dashboard-leaderboard.test.tsx`
- Mock `next/navigation`, `next/image`, `next/link`
- Test: renders heading, renders ranked rows, pagination prev/next, empty state, quality score shows "—" for null

### T2: Qualification page tests

- **New file:** `src/__tests__/components/dashboard-qualification-page.test.tsx`
- Mock fetch for `/api/dashboard/qualification`
- Test: renders question cards, empty state (no questions), zero-response state

### T3: Warmth page tests

- **New file:** `src/__tests__/components/dashboard-warmth-page.test.tsx`
- Test: summary stats rendered, tier gate (locked for free), table renders rows, filter dropdown present

### T4: Sidebar unlock tests

- **Update:** `src/__tests__/components/dashboard-sidebar-redesign.test.tsx`
- Add tests: Updates/Qualification/Leaderboard have correct `href` attributes
- Add test: Warmth is locked for free, unlocked for pro
- Remove or update "Coming soon" assertions

### T5: Full verification

```bash
pnpm test
pnpm lint
pnpm build
```

Verify ≥280 tests pass.

## Verification

1. All new test files created in `src/__tests__/`
2. `pnpm test` — all tests pass (≥280 total)
3. `pnpm lint` — zero errors
4. `pnpm build` — zero errors

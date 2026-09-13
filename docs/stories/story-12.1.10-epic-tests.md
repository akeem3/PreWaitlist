# Story 12.1.10 — Epic 12.1 Tests

**Epic:** 12.1 — Dashboard Overhaul
**Status:** ready
**Depends on:** 12.1.0–12.1.9
**Design Refs:** — (no UI)

## Story

As the founder, I want comprehensive tests covering every Epic 12.1 component and page so that the dashboard overhaul is regression-proof and production-ready.

## Test Infrastructure

Vitest + @testing-library/react for component tests. Config: `vitest.config.mts` (happy-dom, `src/**/*.test.{ts,tsx}`). Test location: `src/__tests__/components/` for component tests, `src/__tests__/api/` for API route tests. Setup: `src/__tests__/setup.ts`. Pattern: `@testing-library/react` + `@testing-library/user-event` + `vitest`.

## Acceptance Criteria (EARS)

- AC1: The system shall have component tests for the redesigned sidebar covering: renders all grouped nav items, "Coming soon" labels on disabled items, tooltip on locked items, no dropdown chevron, no upgrade button, active state highlighting.
- AC2: The system shall have component tests for the empty state covering: renders welcome heading when 0 subscribers, renders guidance steps, renders ghost stat cards, does not render checklist, renders data view when subscribers exist.
- AC3: The system shall have component tests for stat card upgrades covering: renders 4 cards, displays comparison deltas, displays warmth summary, responsive grid layout.
- AC4: The system shall have component tests for tier gating covering: WarmthPanel locked overlay for Free, WarmthPanel live data for Pro, warmth stat card lock icon for Free.
- AC5: The system shall have component tests for founder updates compose UI covering: renders textarea, publish button calls API, success message, error display, recent updates list.
- AC6: The system shall have component tests for mobile responsiveness covering: table overflow wrapper, responsive stat card grid, responsive panel grid.
- AC7: The system shall have component tests for settings covering: error handling on save, button feedback states.
- AC8: The system shall have API route tests for `GET /api/dashboard/stats` covering: returns current and previous counts, handles empty data, requires auth.
- AC9: All tests shall pass with `pnpm test`.
- AC10: Lint and build shall pass with zero errors.
- AC11: Total test count across the project shall be ≥270.

## Tasks

T1 (AC1) Sidebar tests · T2 (AC2) Empty state tests · T3 (AC3) Stat card tests · T4 (AC4) Tier gating tests · T5 (AC5) Updates compose tests · T6 (AC6) Mobile responsiveness tests · T7 (AC7) Settings tests · T8 (AC8) Stats API tests · T9 (AC9-AC11) Full verification

## Out of Scope

E2E tests (Playwright), tests for Story 12.1.7 (token compliance — visual, not functional), tests for Story 12.1.8 (broadcast fixes — integration-level).

## Implementation Details

### T1: Sidebar tests

- **New file:** `src/__tests__/components/dashboard-sidebar-redesign.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Sidebar } from "../../../components/dashboard/sidebar";

// Mock usePathname
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("Sidebar Redesign", () => {
  it("renders grouped section headers", () => {
    render(<Sidebar waitlistName="Test" logoUrl={null} isOpen={false} onClose={vi.fn()} onSignOut={vi.fn()} tier="free" />);
    expect(screen.getByText("COMMAND CENTER")).toBeDefined();
    expect(screen.getByText("INSIGHTS")).toBeDefined();
    expect(screen.getByText("ENGAGEMENT")).toBeDefined();
    expect(screen.getByText("CONFIG")).toBeDefined();
  });

  it("shows 'Coming soon' on disabled items", () => {
    render(<Sidebar waitlistName="Test" logoUrl={null} isOpen={false} onClose={vi.fn()} onSignOut={vi.fn()} tier="free" />);
    expect(screen.getAllByText("Coming soon").length).toBeGreaterThanOrEqual(2);
  });

  it("shows lock icon with tooltip on locked items", () => {
    render(<Sidebar waitlistName="Test" logoUrl={null} isOpen={false} onClose={vi.fn()} onSignOut={vi.fn()} tier="free" />);
    const warmth = screen.getByText("Warmth").closest("span");
    expect(warmth?.getAttribute("title")).toBe("Pro feature — upgrade to unlock");
  });

  it("does not render upgrade button", () => {
    render(<Sidebar waitlistName="Test" logoUrl={null} isOpen={false} onClose={vi.fn()} onSignOut={vi.fn()} tier="free" />);
    expect(screen.queryByText("Upgrade to pro")).toBeNull();
  });

  it("does not render dropdown chevron on product name", () => {
    render(<Sidebar waitlistName="Test" logoUrl={null} isOpen={false} onClose={vi.fn()} onSignOut={vi.fn()} tier="free" />);
    // Product name button should not have the chevron SVG
  });

  it("highlights active nav item", () => {
    render(<Sidebar waitlistName="Test" logoUrl={null} isOpen={false} onClose={vi.fn()} onSignOut={vi.fn()} tier="free" />);
    const overview = screen.getByText("Overview").closest("a");
    expect(overview?.className).toContain("bg-accent");
  });
});
```

### T2: Empty state tests

- **New file:** `src/__tests__/components/dashboard-empty-state.test.tsx`

Test with empty `subscribers` array:

- Renders welcome heading with subdomain
- Renders Copy Link button
- Renders View Public Page link
- Renders 3 guidance steps
- Renders ghost stat cards with em-dashes
- Does NOT render checklist
- Does NOT render "Preview" text

Test with non-empty `subscribers` array:

- Renders data view (chart, table)
- Does NOT render welcome heading

### T3: Stat card tests

- **New file:** `src/__tests__/components/dashboard-stat-cards.test.tsx`

- Renders 4 stat card sections
- Displays delta text (↑/↓/—) based on statsData
- Displays warmth summary when data available
- Shows "—" when no warmth data

### T4: Tier gating tests

- **New file:** `src/__tests__/components/dashboard-tier-gating.test.tsx`

- WarmthPanel with `tier="free"`: renders locked overlay with "Pro" badge
- WarmthPanel with `tier="pro"`: renders live data bars
- Stat card with `tier="free"`: renders lock icon
- Stat card with `tier="pro"`: no lock icon

### T5: Updates compose tests

- **New file:** `src/__tests__/components/dashboard-updates-compose.test.tsx`

- Renders textarea with placeholder
- Publish button disabled when < 10 chars
- Publish button enabled when ≥ 10 chars
- Successful publish: clears textarea, shows "Published!"
- Failed publish: shows error message
- Renders recent updates list with dates

### T6: Mobile responsiveness tests

- **New file:** `src/__tests__/components/dashboard-mobile-responsive.test.tsx`

- Table container has `overflow-x-auto` class
- Stat card grid has `grid-cols-2` class
- Panel grid has `grid-cols-1` class (mobile) or `md:grid-cols-2`

### T7: Settings tests

- **New file:** `src/__tests__/components/dashboard-settings.test.tsx`

- Upgrade button shows "Paddle billing coming soon" title
- Manage billing button shows same title
- Save failure shows error message
- Save success shows success message

### T8: Stats API tests

- **New file:** `src/__tests__/api/dashboard-stats.test.tsx`

Mock Supabase client:

- Returns current and previous counts
- Handles empty data (all zeros)
- Returns 401 when unauthenticated

### T9: Full verification

Run all checks:

```bash
pnpm test
pnpm lint
pnpm build
```

Verify ≥270 tests pass.

## Verification

1. All new test files created in `src/__tests__/`
2. `pnpm test` — all tests pass (≥270 total)
3. `pnpm lint` — zero errors
4. `pnpm build` — zero errors
5. Test coverage for all 11 stories in Epic 12.1

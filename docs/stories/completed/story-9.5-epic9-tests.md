---
id: epic9.story05
epic: epic-9-dashboard-restructure
title: Epic 9 Tests
status: ready
depends_on:
  [epic9.story00, epic9.story01, epic9.story02, epic9.story03, epic9.story04]
updated: 2026-08-31
---

# Story 9.5 — Epic 9 Tests

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As the founder, I want comprehensive tests for all Epic 9 components and pages so that the dashboard layout, stat cards, subscriber table, CSV export, and subscriber detail page work correctly and don't regress.

## Test Infrastructure

- **Unit/Component tests:** Vitest + `@testing-library/react` + `@testing-library/user-event`
- **Config:** `vitest.config.mts` (happy-dom environment, `src/**/*.test.{ts,tsx}`)
- **Setup:** `src/__tests__/setup.ts` (clipboard mock, cleanup after each test)
- **Test location:** `src/__tests__/components/` for component tests
- **Run command:** `pnpm test` (vitest)

## Acceptance Criteria (EARS)

- AC1: The system shall have component tests for the dashboard sidebar (`components/dashboard/sidebar.tsx`) covering: renders all navigation items, active state highlighting, disabled state for Broadcasts/Settings, mobile hamburger toggle.
- AC2: The system shall have component tests for stat cards covering: renders 4 cards, displays real subscriber count, displays referral percentage, displays warmth counts, shows em-dash when no data.
- AC3: The system shall have component tests for subscriber table covering: renders table columns, search filters by email, sort by position, sort by referrals, empty state message, row click navigation.
- AC4: The system shall have component tests for CSV export covering: button visible for Pro tier, button hidden for Free tier, CSV content format, filename format.
- AC5: The system shall have component tests for subscriber detail page covering: renders subscriber info, renders referral data, renders qualification answers, back button navigation, not found state.
- AC6: All tests shall pass with `pnpm test`.
- AC7: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1): Sidebar component tests
- T2 (AC2): Stat cards tests
- T3 (AC3): Subscriber table tests
- T4 (AC4): CSV export tests
- T5 (AC5): Subscriber detail page tests
- T6 (AC6-AC7): Run all tests + lint + build

## Out of scope

Tests for Epic 7 features (public waitlist page — covered in Story 7.8), tests for Epic 8 features (thank-you page — covered in Story 8.5), tests for Epic 10 features.

## Dev Notes

### T1 — Sidebar Component Tests

Create `src/__tests__/components/dashboard-sidebar.test.tsx`.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Sidebar } from "../../../components/dashboard/sidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: (props: any) => <a {...props}>{props.children}</a>,
}));

describe("Sidebar", () => {
  const defaultProps = {
    waitlistName: "My Waitlist",
    logoUrl: null,
    isOpen: false,
    onClose: vi.fn(),
  };

  it("renders all navigation items", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Subscribers")).toBeInTheDocument();
    expect(screen.getByText("Broadcasts")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("highlights active navigation item", () => {
    render(<Sidebar {...defaultProps} />);
    const overview = screen.getByText("Overview");
    expect(overview).toHaveClass("font-semibold");
  });

  it("disables Broadcasts and Settings items", () => {
    render(<Sidebar {...defaultProps} />);
    const broadcasts = screen.getByText("Broadcasts");
    const settings = screen.getByText("Settings");
    expect(broadcasts).toHaveClass("opacity-50");
    expect(settings).toHaveClass("opacity-50");
    expect(broadcasts).not.toHaveAttribute("href");
    expect(settings).not.toHaveAttribute("href");
  });

  it("toggles mobile sidebar", () => {
    const { rerender } = render(<Sidebar {...defaultProps} isOpen={false} />);
    const aside = screen.getByRole("complementary");
    expect(aside).toHaveClass("-translate-x-full");

    rerender(<Sidebar {...defaultProps} isOpen={true} />);
    expect(aside).toHaveClass("translate-x-0");
  });
});
```

**Status:** not started — no sidebar component or test exists. `components/dashboard/` directory does not exist.

### T2 — Stat Cards Tests

Create `src/__tests__/components/dashboard-stat-cards.test.tsx`.

Test cases:

- Renders 4 cards (Total Signups, Referrals, Hot, Warm)
- Displays actual subscriber count when data exists
- Displays referral percentage correctly
- Displays warmth counts
- Shows em-dash when no data (empty array)

**Status:** not started — stat cards are inline in `client.tsx:248-267`. After Story 9.1, they should be extracted or tested via the parent component.

### T3 — Subscriber Table Tests

Create `src/__tests__/components/dashboard-subscriber-table.test.tsx`.

Test cases:

- Renders 4 columns (#, Email, Date, Referrals)
- Search filters subscribers by email
- Sort by position (default)
- Sort by referrals (click header)
- Empty state message when no subscribers
- Row click triggers navigation

**Status:** not started — subscriber table is inline in `client.tsx:360-428`, not a separate component. After Story 9.2, test via parent or extract.

### T4 — CSV Export Tests

Create `src/__tests__/components/dashboard-csv-export.test.tsx`.

Test cases:

- Button visible when tier is "pro"
- Button hidden when tier is "free"
- CSV content contains correct headers
- CSV filename matches `subscribers-{subdomain}-{YYYY-MM-DD}.csv` format

Mock `URL.createObjectURL` and `document.createElement`.

**Status:** not started — no CSV export component or test exists.

### T5 — Subscriber Detail Page Tests

Create `src/__tests__/components/dashboard-subscriber-detail.test.tsx`.

Test cases:

- Renders subscriber position, email, signup date
- Renders referral count and list
- Renders qualification answers
- Back button links to `/dashboard`
- Shows "Subscriber not found" for invalid ID

**Status:** not started — no subscriber detail page or test exists.

### T6 — Run All Tests + Lint + Build

```bash
pnpm test
pnpm lint
pnpm build
```

**Status:** existing tests pass (166 tests across 16 files), but no Epic 9 tests exist yet.

**Existing dashboard test:** `src/__tests__/components/dashboard-referral-column.test.tsx` exists but tests Sprint 1 referral column feature, not Epic 9 components.

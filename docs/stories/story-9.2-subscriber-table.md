---
id: epic9.story02
epic: epic-9-dashboard-restructure
title: Subscriber Table Design Alignment
status: ready
depends_on: [epic9.story00]
updated: 2026-08-31
---

# Story 9.2 — Subscriber Table Design Alignment

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg`, `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`

**Story:** As a founder, I want a properly designed subscriber table with search and sorting so that I can manage my subscribers effectively.

## Design Specs (from SVG analysis)

**Active state table (Dashboard_active_state_HF5.svg):**

- Search input above table: placeholder "Search by email", text input with border
- Column order: # (position), Email, Date, Referrals
- Table header: `text-body-sm font-medium` (14px), `text-muted-foreground`
- Table rows: `text-body-sm`, email in `text-foreground`, date in `text-muted-foreground`
- Referrals column: right-aligned, `font-medium` for non-zero, `text-muted-foreground` for zero
- Row hover: subtle background change
- "Export CSV" button: top-right of table area, secondary variant
- Empty state: "No subscribers yet. Share your link to get started." centered

**Current implementation (client.tsx:360-428):**

- 6 columns: Name, Email, Position, Warmth, Referrals, Date
- No search input
- Sort works on position and referral_count
- Rows not clickable
- No subscriber count display
- No "Export CSV" button (that's Story 9.3)

## Acceptance Criteria (EARS)

- AC1: The subscriber table shall display columns: #, Email, Date, Referrals (following design order).
- AC2: The table shall include a search input above the table that filters subscribers by email.
- AC3: The table shall sort by position (default) and referral count (click column header to toggle).
- AC4: Each row shall be clickable, navigating to `/dashboard/subscribers/:id`.
- AC5: The empty state shall display "No subscribers yet. Share your link to get started."
- AC6: The table shall display the total subscriber count above the table (e.g., "12 subscribers").
- AC7: The table shall be styled with white background (`bg-card`), rounded corners, and border.
- AC8: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC2): Table columns redesign + search input
- T2 (AC3): Sort by position/referrals with correct default
- T3 (AC4): Row click navigation to subscriber detail
- T4 (AC5-AC6): Empty state + subscriber count display
- T5 (AC7-AC8): Styling alignment + lint + build

## Out of scope

Warmth column (not in design SVG), name column (subscribers don't have names), bulk actions (select/delete), pagination (Sprint 2 shows all subscribers), CSV export button (Story 9.3).

## Dev Notes

### T1 — Table Columns + Search Input

Replace current 6-column grid with 4-column design-aligned layout:

```tsx
const TABLE_COLUMNS = [
  { label: "#", field: "position", sortable: true },
  { label: "Email", field: "email", sortable: false },
  { label: "Date", field: "created_at", sortable: false },
  { label: "Referrals", field: "referral_count", sortable: true },
];
```

Search input above table:

```tsx
const [searchQuery, setSearchQuery] = useState("");

const filteredSubscribers = useMemo(() => {
  if (!searchQuery) return sortedSubscribers;
  return sortedSubscribers.filter((s) =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [sortedSubscribers, searchQuery]);
```

```tsx
<input
  type="text"
  placeholder="Search by email"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="mb-4 w-full rounded-lg border border-border bg-card px-4 py-2 text-body-sm text-foreground placeholder:text-muted-foreground"
/>
```

**Status:** not started — no search functionality exists. Design shows search input at top of main content area.

### T2 — Sort by Position/Referrals

Change default sort from `referral_count` to `position`:

```diff
- const [sortField, setSortField] = useState<"position" | "referral_count">("referral_count");
+ const [sortField, setSortField] = useState<"position" | "referral_count">("position");
- const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
+ const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
```

Position ascending = lowest position number first (top of waitlist).

**Status:** partially exists — sorting works (`client.tsx:65-91`) but default is `referral_count` desc. Need to change default to `position` asc.

### T3 — Row Click Navigation

Add `useRouter` and `onClick` to rows:

```tsx
import { useRouter } from "next/navigation";

const router = useRouter();

// On each row:
<div
  key={sub.id}
  onClick={() => router.push(`/dashboard/subscribers/${sub.id}`)}
  className="grid grid-cols-4 gap-4 border-b border-border px-5 py-3 last:border-b-0 cursor-pointer hover:bg-muted/30 transition-colors"
>
```

**Status:** not started — rows are not clickable (`client.tsx:393-419`). No `router.push` on row click.

### T4 — Empty State + Subscriber Count

Subscriber count above table:

```tsx
<p className="mb-4 text-body-sm text-muted-foreground">
  {filteredSubscribers.length} subscriber
  {filteredSubscribers.length !== 1 ? "s" : ""}
</p>
```

Empty state already exists (`client.tsx:421-427`). Keep the message: "No subscribers yet. Share your link to get started."

**Status:** empty state exists, but subscriber count is not displayed. Need to add count.

### T5 — Styling

Reuse existing card styling. Column alignment: # column centered, Email left-aligned, Date left-aligned, Referrals right-aligned.

```tsx
// # column
<span className="text-body-sm text-muted-foreground text-center">{sub.position}</span>
// Email column
<span className="text-body-sm text-foreground truncate">{sub.email}</span>
// Date column
<span className="text-body-sm text-muted-foreground">
  {new Date(sub.created_at).toLocaleDateString()}
</span>
// Referrals column
<span className={`text-right text-body-sm ${sub.referral_count === 0 ? "text-muted-foreground" : "font-medium text-foreground"}`}>
  {sub.referral_count}
</span>
```

**Files modified:**

- `src/app/dashboard/client.tsx` (replace table columns, add search, add row click, add count)

**Available components:** None needed — inline table
**Available tokens:** `bg-card`, `rounded-[var(--card-radius)]`, `border-border`, `text-body-sm`, `text-foreground`, `text-muted-foreground`

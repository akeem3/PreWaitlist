# Story 16.5 — Dashboard Leaderboard Pagination

**Status:** ready
**Epic:** 16 — Leaderboard & Founder Updates Engine Fix
**Depends on:** 16.4
**Design Refs:** Story 12.3.1 AC5/AC6 (verbatim counter copy); public pattern `leaderboard-client.tsx` PAGE_SIZE=10 + prev/next + "Showing X–Y of Z"
**Source:** [Audit §3 claims 3 / issue 3](../scans/engine-audit-5-engines.md), [Story 12.3.1](../stories/completed/story-12.3.1-dashboard-leaderboard.md), [Epic 16 Standing Decision L1](../epics/epic-16-leaderboard-updates-engine-fix.md)

## Story

As a founder with hundreds of subscribers, I want the dashboard leaderboard paginated with a clear range counter so the table stays scannable and meets Story 12.3.1.

## Acceptance Criteria (EARS)

- AC1: The dashboard leaderboard client shall paginate with `PAGE_SIZE = 10` rows per page (constant), `page` state (0-indexed), prev/next controls — mirror `src/app/(public)/[subdomain]/leaderboard/leaderboard-client.tsx` L15/L29-53.
- AC2: Footer shall show **"Showing X–Y of Z subscribers"** when unfiltered (Story 12.3.1 AC6); search-active footer may show result count (existing search footer behavior) but must not regress AC1/AC2 for the default view.
- AC3: Prev shall be disabled on first page; next disabled on last page; pagination shall operate on the **sorted+filtered** array so sort/search and page interact correctly (reset `page` to 0 when search or sortKey changes — avoid empty pages after re-sort).
- AC4: Empty state (no subscribers / no search matches) shall remain (Story 12.3.1 AC7) and hide or neutralize pagination controls when total pages ≤ 1.
- AC5: Rank display shall remain canonical server rank (`row.rank`), not page-relative index.
- AC6: Story 12.3.1 AC5/AC6 shall be satisfied by this implementation (currently unmet — audit §3.4 #3).
- AC7: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) page state + slice
- T2 (AC2) footer counter
- T3 (AC3–AC5) controls + reset + rank
- T4 (AC6–AC7) verify ACs + lint/build

## Out of Scope

- Neighborhood "your position" view (public leaderboard only)
- Server-side pagination API / URL query page param
- Changing PAGE_SIZE from 10
- Mobile grid breakpoints (not in Standing Decisions)
- Sort correctness (16.4 — assume landed first)

## Dev Notes

### Current state

`src/app/dashboard/leaderboard/client.tsx`:

- No `page` state; renders full `sorted.map(...)` (L274+).
- Footer L317-321: `` `${totalCount} subscribers` `` or `` `${sorted.length} results` `` when searching — **not** "Showing X–Y of Z".

### T1 — state + slice

```ts
const PAGE_SIZE = 10;

const [page, setPage] = useState(0);

// after sorted memo:
const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
const safePage = Math.min(page, Math.max(totalPages - 1, 0));
const start = safePage * PAGE_SIZE;
const visible = sorted.slice(start, start + PAGE_SIZE);
const rangeStart = sorted.length === 0 ? 0 : start + 1;
const rangeEnd = Math.min(start + PAGE_SIZE, sorted.length);
```

Render `visible` instead of `sorted` in the rows map.

### T2 — footer (AC2)

Default (no search):

```tsx
Showing {rangeStart}–{rangeEnd} of {sorted.length} subscribers
```

Use en dash `–` (U+2013), matching public board / Story 12.3.1 AC6 wording **"Showing 1–10 of 42 subscribers"**. This string is **pre-approved** in Story 12.3.1 — not a COPY GAP.

When `search` non-empty: keep `` `${sorted.length} result(s)` `` (existing) or show "Showing X–Y of Z results" — either is fine; do not break AC2 default path.

`totalCount` prop can remain for header/summary use; range counter uses **filtered/sorted length** so search + page agree.

### T3 — controls + reset + rank

```tsx
<div className="flex items-center justify-between border-t border-border px-5 py-3">
  <span className="text-xs text-muted-foreground">
    {/* footer text per T2 */}
  </span>
  {totalPages > 1 && (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={safePage === 0}
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        className="..."
      >
        Previous
      </button>
      <button
        type="button"
        disabled={safePage >= totalPages - 1}
        onClick={() => setPage((p) => p + 1)}
        className="..."
      >
        Next
      </button>
    </div>
  )}
</div>
```

**Reset page on search/sort (AC3):**

```ts
function handleSort(key: SortKey) {
  setPage(0); // with setSortKey/setSortDir in same handler
  // ...
}

// search input onChange:
onChange={(e) => {
  setSearch(e.target.value);
  setPage(0);
}}
```

Avoid `useEffect` + `setPage(0)` on deps if ESLint `react-hooks/set-state-in-effect` fires — set inside event handlers (MEMORY gotcha).

**Button labels:** "Previous"/"Next" are standard UI labels (public board uses Prev/Next pattern); Story 12.3.1 does not prescribe exact button copy — if founder wants different labels, mark COPY GAP; default ship Prev/Next consistent with public. **COPY GAP note:** Story 7.5 AC10 said "View More" but public shipped Prev/Next — do not reintroduce "View More" on dashboard.

**Rank (AC5):** keep `{row.rank}` in the rank cell (not `start + i + 1`).

### T4 — verify

1. 25 rows → page 1 shows ranks of first 10 after current sort; footer "Showing 1–10 of 25 subscribers"
2. Next → "Showing 11–20 of 25 subscribers"; Prev enabled
3. Last page partial (21–25); Next disabled
4. Search narrowing to 3 rows → controls hidden (`totalPages <= 1`); empty search → empty state
5. Change sort while on page 2 → back to page 1
6. `pnpm lint && pnpm test -- dashboard-leaderboard && pnpm build`

### Tests (with this story or 16.8 note)

Add to `dashboard-leaderboard-page.test.tsx`:

- 25-row fixture: initial page length 10 links; click Next → next 10; footer string exact match
- Prev disabled on first render
- Sort/search resets to first page

Story 12.3.4 AC claimed pagination tests — none exist (audit §3.8); this story closes that gap for leaderboard.

## Files to Create/Modify

| File                                                           | Change                                      |
| -------------------------------------------------------------- | ------------------------------------------- |
| `src/app/dashboard/leaderboard/client.tsx`                     | page state, slice, footer, prev/next, reset |
| `src/__tests__/components/dashboard-leaderboard-page.test.tsx` | Pagination cases                            |

## Risk

- Interaction with search: filtering after slice vs before — always filter+sort first, then slice (T1 order).
- Large lists still load all rows server-side (existing page.tsx) — pagination is **client-side only** (acceptable at ≤500 cap; no API change).
- 16.4 must land first so page numbers reflect correct global order.

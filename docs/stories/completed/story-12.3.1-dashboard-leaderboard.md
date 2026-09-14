# Story 12.3.1 — Dashboard Leaderboard Page

**Epic:** 12.3 — Dashboard Section Pages
**Status:** ready
**Depends on:** 12.3.0
**Design Refs:** `docs/design/High-fidelity-svgs/Leaderboard.svg`

## Story

As the founder, I want to see a ranked leaderboard of my subscribers sorted by referral count so that I can identify my most engaged advocates.

## Acceptance Criteria (EARS)

- AC1: The page shall display at `/dashboard/leaderboard` with a "Leaderboard" heading.
- AC2: The page shall show a table with columns: Rank, Email (anonymized), Referrals, Quality Score, Signup Date.
- AC3: Subscribers shall be ranked by referral count (descending), with ties broken by signup date (earlier = higher rank).
- AC4: The quality score column shall show the subscriber's `quality_score` value (or "—" if null).
- AC5: The table shall be paginated with 10 rows per page and prev/next navigation.
- AC6: The page shall show a total subscriber count ("Showing 1–10 of 42 subscribers").
- AC7: When the waitlist has zero subscribers, the page shall show an empty state.
- AC8: The page shall reuse the Sidebar component and match the dashboard layout.
- AC9: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC3) Create leaderboard page with ranking · T2 (AC4-AC6) Quality score + pagination · T3 (AC7) Empty state · T4 (AC8) Layout + sidebar · T5 (AC9) Lint + build

## Out of Scope

CSV export, search/filter.

## Implementation Details

### T1-T4: Leaderboard page

**New files:**

- `src/app/dashboard/leaderboard/page.tsx` (server component)
- `src/app/dashboard/leaderboard/client.tsx` (client component)

**Server component** (`page.tsx`):

- Auth check + waitlist fetch (same pattern as `dashboard/page.tsx`)
- Fetch subscribers with `referral_code` and `created_at`
- Compute referral counts via batch query (same pattern as `dashboard/page.tsx` lines 46-63)
- Compute quality scores (same pattern as lines 75-81)
- Rank by `referral_count DESC, created_at ASC`
- Pass ranked data to `LeaderboardClient`

**Client component** (`client.tsx`):

- Accept `{ rows, totalCount, waitlistName, logoUrl, tier }` props
- Render Sidebar + main content area
- Table with columns: `[60px_1fr_100px_100px_120px]` (Rank, Email, Referrals, Quality, Date)
- Pagination: `page` state, `PAGE_SIZE = 10`, prev/next buttons
- "Showing X–Y of Z subscribers" counter
- Anonymize emails using `anonymizeEmail` from `@/lib/format`
- Empty state: "No subscribers yet. Share your waitlist to get started."

### T5: Lint + build

## Verification

1. Navigate to `/dashboard/leaderboard` — shows ranked subscriber table
2. Pagination works (prev/next, "Showing X–Y of Z")
3. Empty state shows when no subscribers
4. Quality score shows "—" for subscribers with null score
5. Layout matches dashboard (sidebar + main content)
6. `pnpm lint` and `pnpm build` pass

# Story 12.3.3 — Dashboard Warmth Page

**Epic:** 12.3 — Dashboard Section Pages
**Status:** ready
**Depends on:** 12.3.0
**Design Refs:** —

## Story

As the founder, I want a dedicated warmth page showing detailed distribution and per-subscriber warmth scores so that I can analyze list engagement beyond the overview panel.

## Acceptance Criteria (EARS)

- AC1: The page shall display at `/dashboard/warmth` with a "Warmth" heading.
- AC2: The page shall show a summary row: total subscribers, count per tier (Hot/Warm/Cold/Unscored), and the cold percentage.
- AC3: The page shall show a subscriber table with columns: Email, Warmth Tier (badge), Last Engagement (date or "Never"), Referrals.
- AC4: The table shall be sortable by warmth tier and referral count.
- AC5: The table shall include a warmth filter dropdown (All, Hot, Warm, Cold, Unscored).
- AC6: The page shall be gated to Pro tier only — Free users shall see a locked overlay.
- AC7: When the waitlist has zero subscribers, the page shall show: "No subscribers yet. Warmth data will appear once people join your waitlist."
- AC8: The page shall reuse the Sidebar component and match the dashboard layout.
- AC9: Lint and build shall pass with zero errors.

> **Dev Notes (2026-09-25 — warmth restructure):** AC2 and AC5 are superseded — the summary row counts Hot/Warm/Cold only (no Unscored; cold % denominator = total), and the filter dropdown is All/Hot/Warm/Cold. Original AC text retained above for history. **[AMENDED 2026-09-25]**

## Tasks

T1 (AC1-AC2) Create warmth page with summary stats · T2 (AC3-AC5) Subscriber warmth table with sort + filter · T3 (AC6) Pro tier gate · T4 (AC7) Empty state · T5 (AC8) Layout + sidebar · T6 (AC9) Lint + build

## Out of Scope

Warmth trend charts, real-time score updates, warmth decay visualization.

## Implementation Details

### T1-T5: Warmth page

**New files:**

- `src/app/dashboard/warmth/page.tsx` (server component)
- `src/app/dashboard/warmth/client.tsx` (client component)

**Server component** (`page.tsx`):

- Auth check + waitlist fetch
- Tier check: fetch from `founder_profiles` — if `tier !== "pro"`, pass `tier="free"` to client
- Fetch subscribers with `warmth_score`, `created_at`
- Fetch warmth distribution from `/api/dashboard/warmth` logic (or compute inline: count by tier)
- For "Last Engagement": query `email_events` for `MAX(created_at)` per subscriber (or use a left join)
- Pass data to `WarmthClient`

**Client component** (`client.tsx`):

- Accept `{ subscribers, warmthSummary, tier, waitlistName, logoUrl }` props
- Render Sidebar + main content area
- **Summary row:** ~~4~~ **3** stat-like cards showing Hot/Warm/Cold counts + cold percentage (~~Unscored removed 2026-09-25~~)
- **Subscriber table:** columns `[1fr_120px_140px_100px]` (Email, Warmth, Last Engagement, Referrals)
  - Warmth column: badge with tier colors (~~Hot=green, Warm=amber, Cold=blue, Unscored=grey~~ shipped: Hot=`bg-status-hot`, Warm=`bg-status-warm`, Cold=`bg-status-cold`, white text — founder token revert 2026-09-25; no Unscored)
  - Sort by warmth tier and referrals (clickable headers)
  - Filter dropdown: All, Hot, Warm, Cold (~~Unscored~~ removed 2026-09-25)
  - Pagination (10 per page)
- **Tier gate:** If `tier === "free"`, render locked overlay (same pattern as `WarmthPanel`)
- **Empty state:** "No subscribers yet..."

### Warmth badge colors (matching Story 11.2):

- Hot: `bg-accent/10 text-accent`
- Warm: `bg-warning/10 text-warning`
- Cold: `bg-info/10 text-info`
- ~~Unscored: `bg-muted text-muted-foreground`~~ (no Unscored badge since 2026-09-25)

### T6: Lint + build

## Verification

1. Navigate to `/dashboard/warmth` as Pro — shows summary + subscriber table
2. Free tier sees locked overlay
3. Sort by warmth tier and referrals works
4. Filter dropdown filters rows correctly
5. Empty state shows when no subscribers
6. "Last Engagement" shows date or "Never"
7. Layout matches dashboard (sidebar + main content)
8. `pnpm lint` and `pnpm build` pass

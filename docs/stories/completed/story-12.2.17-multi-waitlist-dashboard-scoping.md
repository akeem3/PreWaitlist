# Story 12.2.17 — Dashboard Scoped to Active Waitlist

**Epic:** 12.2 — Gap Fixes
**Status:** ready
**Depends on:** 12.2.16
**Design Refs:** — (uses existing design system tokens)

## Story

As a founder with multiple waitlists, I want the dashboard to show data only for the currently selected waitlist so that I can manage each waitlist independently without confusion.

## Acceptance Criteria (EARS)

- AC1: All dashboard API routes (`/api/dashboard/chart`, `/api/dashboard/stats`, `/api/dashboard/qualification`, `/api/dashboard/warmth`, `/api/dashboard/broadcast`, `/api/dashboard/email-events`) shall accept a `waitlist_id` query parameter and scope results to that waitlist.
- AC2: If `waitlist_id` is missing from a dashboard API request, return HTTP 400 with `{ error: "waitlist_id is required" }`.
- AC3: The dashboard page (`/dashboard`) shall read the active `waitlist_id` from the URL search params (`?wid=xxx`) and pass it to all child components.
- AC4: The subscriber table shall show only subscribers for the active waitlist.
- AC5: The stat cards (Total Signups, Referral %, Today, Warmth) shall reflect the active waitlist's data.
- AC6: Switching waitlists via the sidebar dropdown shall refresh all dashboard data without a full page reload (uses `router.refresh()` after navigation).
- AC7: The sidebar nav links shall include the active `waitlist_id` as a `wid` search param (e.g., `/dashboard/leaderboard?wid=xxx`).
- AC8: The live URL bar shall show the active waitlist's subdomain.
- AC9: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Update all dashboard API routes to accept + validate waitlist_id · T2 (AC3-AC5) Dashboard page + components scoped to active waitlist · T3 (AC6) Refresh on switch · T4 (AC7) Nav links with wid param · T5 (AC8) Live URL bar · T6 (AC9) Lint + build

## Out of Scope

Sidebar switcher UI (Story 12.2.16), API route creation (Story 12.2.15).

## Implementation Details

### T1: Update all dashboard API routes

Each dashboard API route must:

1. Read `waitlist_id` from `searchParams`
2. Return 400 if missing
3. Filter all queries by `waitlist_id`

**Routes to update:**

#### `src/app/api/dashboard/chart/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const waitlistId = searchParams.get("waitlist_id");

  if (!waitlistId) {
    return NextResponse.json(
      { error: "waitlist_id is required" },
      { status: 400 }
    );
  }

  // Add .eq("waitlist_id", waitlistId) to all queries
  // ... existing code with waitlist_id filter
}
```

#### `src/app/api/dashboard/stats/route.ts`

Same pattern — read `waitlist_id`, return 400 if missing, filter queries.

#### `src/app/api/dashboard/qualification/route.ts`

Same pattern.

#### `src/app/api/dashboard/warmth/route.ts`

Same pattern.

#### `src/app/api/dashboard/broadcast/route.ts`

Same pattern.

#### `src/app/api/dashboard/email-events/route.ts`

Same pattern.

**Common pattern for all routes:**

```typescript
const waitlistId = searchParams.get("waitlist_id");
if (!waitlistId) {
  return NextResponse.json({ error: "waitlist_id is required" }, { status: 400 });
}

// Then in every query:
.eq("waitlist_id", waitlistId)
```

### T2: Dashboard page — scope to active waitlist

**File to modify:** `src/app/dashboard/page.tsx`

Read `wid` from search params and pass to child components:

```typescript
import { searchParams } from "next/navigation";

// In the server component:
export default async function DashboardPage(props: {
  searchParams: Promise<{ wid?: string }>;
}) {
  const params = await props.searchParams;
  const activeWaitlistId = params.wid;

  // If no wid param, use the first waitlist from layout
  // (layout already ensures at least one waitlist exists)
  // The waitlistId is already available from layout context

  // Pass waitlistId to all child components
  return (
    <div>
      <DashboardClient
        waitlistId={activeWaitlistId ?? /* fallback from layout */}
        // ... other props
      />
    </div>
  );
}
```

**File to modify:** `src/app/dashboard/client.tsx`

Update `DashboardClient` to use the passed `waitlistId` in all API calls:

```typescript
// In fetch calls, add waitlist_id param:
const chartRes = await fetch(`/api/dashboard/chart?waitlist_id=${waitlistId}`);
const statsRes = await fetch(`/api/dashboard/stats?waitlist_id=${waitlistId}`);
// ... etc for all dashboard API calls
```

**File to modify:** `src/app/dashboard/subscribers/page.tsx` (if it exists)

Same pattern — pass `waitlistId` to subscriber table queries.

### T3: Refresh on switch

The sidebar switcher (Story 12.2.16) already calls `router.push("/dashboard")` + `router.refresh()`. To make data refresh properly:

1. The `?wid=xxx` param changes the data source
2. `router.refresh()` re-fetches server components
3. Client components re-fetch their API calls when `waitlistId` prop changes

**Ensure useEffect dependencies include `waitlistId`:**

```typescript
useEffect(() => {
  fetchData(waitlistId);
}, [waitlistId]);
```

### T4: Nav links with wid param

**File to modify:** `components/dashboard/sidebar.tsx`

Update all nav item hrefs to include `?wid={activeWaitlistId}`:

```typescript
const navItems = [
  { label: "Overview", href: `/dashboard?wid=${activeWaitlistId}`, icon: ... },
  { label: "Subscribers", href: `/dashboard/subscribers?wid=${activeWaitlistId}`, icon: ... },
  { label: "Leaderboard", href: `/dashboard/leaderboard?wid=${activeWaitlistId}`, icon: ... },
  { label: "Qualification", href: `/dashboard/qualification?wid=${activeWaitlistId}`, icon: ... },
  { label: "Warmth", href: `/dashboard/warmth?wid=${activeWaitlistId}`, icon: ... },
  // ... etc
];
```

**Important:** The `wid` param must be preserved across navigation. When the user clicks a nav item, the `wid` stays in the URL.

### T5: Live URL bar

**File to modify:** `src/app/dashboard/client.tsx` (or wherever the live URL bar is rendered)

Update to show the active waitlist's subdomain:

```typescript
// Find the active waitlist from the waitlists array
const activeWaitlist = waitlists.find((w) => w.id === activeWaitlistId);
const subdomain = activeWaitlist?.subdomain ?? "your-subdomain";

// Render:
<a
  href={`https://${subdomain}.prewaitlist.com`}
  target="_blank"
  rel="noopener noreferrer"
>
  {subdomain}.prewaitlist.com
</a>
```

### T6: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Visit `/dashboard?wid=<id1>` → shows data for waitlist 1
2. Visit `/dashboard?wid=<id2>` → shows data for waitlist 2
3. Click sidebar nav → `wid` param preserved in URL
4. Switch waitlist via dropdown → dashboard refreshes with new data
5. Stat cards, chart, subscriber table all reflect active waitlist
6. Live URL bar shows correct subdomain
7. API routes return 400 if `waitlist_id` missing
8. API routes return correct data when `waitlist_id` provided
9. `pnpm lint` and `pnpm build` pass with zero errors

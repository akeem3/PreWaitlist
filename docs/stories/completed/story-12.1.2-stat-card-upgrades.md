# Story 12.1.2 — Stat Card Upgrades

**Epic:** 12.1 — Dashboard Overhaul
**Status:** ready
**Depends on:** 12.1.0
**Design Refs:** `docs/design/High-fidelity-svgs/Dashboard_active_state_HF5.svg`

## Story

As a founder, I want stat cards with comparison deltas and warmth data so that numbers become insights, not just facts.

## Acceptance Criteria (EARS)

- AC1: The dashboard shall display 4 stat cards: Total Signups, Referral %, Today, Warmth.
- AC2: Each stat card (except Warmth) shall show a comparison delta below the value: "↑ X% vs last week" for positive, "↓ X% vs last week" for negative, "—" when no prior data.
- AC3: The comparison delta shall be computed by a new API endpoint `GET /api/dashboard/stats` that returns `{ current: { total, referrals, today }, previous: { total, referrals, today } }` where `previous` is the count from 7–14 days ago.
- AC4: The Warmth stat card shall show the actual warmth distribution: "{hot} Hot, {warm} Warm, {cold} Cold" — not a hardcoded em-dash.
- AC5: The Warmth stat card shall fetch from the existing `/api/dashboard/warmth` endpoint (shared with WarmthPanel).
- AC6: Stat cards shall use design system tokens: `bg-card`, `rounded-(--card-radius)`, `border-border`.
- AC7: The stat card grid shall use `grid-cols-2` on mobile and `grid-cols-4` on desktop.
- AC8: Lint and build shall pass with zero errors.

## Tasks

T1 (AC3) Create `GET /api/dashboard/stats` endpoint · T2 (AC1-AC2) Redesign stat cards with deltas · T3 (AC4-AC5) Connect warmth stat card to real data · T4 (AC6-AC7) Responsive grid + token styling · T5 (AC8) Lint + build

## Out of Scope

Sparklines (not in design SVG), visual hierarchy differences between cards, real-time updates.

## Implementation Details

### T1: Create `GET /api/dashboard/stats` endpoint

- **New file:** `src/app/api/dashboard/stats/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get waitlist
  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) {
    return NextResponse.json({ error: "No waitlist" }, { status: 404 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Current period: last 7 days
  const { count: currentTotal } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("waitlist_id", waitlist.id)
    .gte("created_at", sevenDaysAgo.toISOString());

  const { count: currentToday } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("waitlist_id", waitlist.id)
    .gte(
      "created_at",
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    );

  const { count: currentReferrals } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("waitlist_id", waitlist.id)
    .not("referrer_id", "is", null)
    .gte("created_at", sevenDaysAgo.toISOString());

  // Previous period: day 7–14
  const { count: previousTotal } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("waitlist_id", waitlist.id)
    .gte("created_at", fourteenDaysAgo.toISOString())
    .lt("created_at", sevenDaysAgo.toISOString());

  const { count: previousReferrals } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("waitlist_id", waitlist.id)
    .not("referrer_id", "is", null)
    .gte("created_at", fourteenDaysAgo.toISOString())
    .lt("created_at", sevenDaysAgo.toISOString());

  return NextResponse.json({
    current: {
      total: currentTotal ?? 0,
      referrals: currentReferrals ?? 0,
      today: currentToday ?? 0,
    },
    previous: {
      total: previousTotal ?? 0,
      referrals: previousReferrals ?? 0,
    },
  });
}
```

### T2: Redesign stat cards with deltas

- **File to modify:** `src/app/dashboard/client.tsx`

Add a new state for stats data. Fetch on mount:

```typescript
const [statsData, setStatsData] = useState<{
  current: { total: number; referrals: number; today: number };
  previous: { total: number; referrals: number };
} | null>(null);

useEffect(() => {
  fetch("/api/dashboard/stats")
    .then((r) => r.json())
    .then(setStatsData)
    .catch(() => {});
}, []);
```

Helper to compute delta:

```typescript
function computeDelta(current: number, previous: number): string {
  if (previous === 0 && current === 0) return "—";
  if (previous === 0) return "↑ new";
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return `↑ ${pct}% vs last week`;
  if (pct < 0) return `↓ ${Math.abs(pct)}% vs last week`;
  return "— no change";
}
```

Replace the stat card grid with:

```tsx
<div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
  {/* Total Signups */}
  <div className="rounded-(--card-radius) border border-border bg-card px-4 py-3 text-center">
    <div className="mb-1 text-h3 text-foreground">
      {stats ? formatStat(stats.totalSignups) : "—"}
    </div>
    <div className="text-caption text-muted-foreground">Total signups</div>
    {statsData && (
      <div className="mt-1 text-xs text-muted-foreground">
        {computeDelta(statsData.current.total, statsData.previous.total)}
      </div>
    )}
  </div>

  {/* Referral % */}
  <div className="rounded-(--card-radius) border border-border bg-card px-4 py-3 text-center">
    <div className="mb-1 text-h3 text-foreground">
      {stats && stats.referralPercentage !== null
        ? `${stats.referralPercentage}%`
        : "—"}
    </div>
    <div className="text-caption text-muted-foreground">Referral %</div>
    {statsData && (
      <div className="mt-1 text-xs text-muted-foreground">
        {computeDelta(
          statsData.current.referrals,
          statsData.previous.referrals
        )}
      </div>
    )}
  </div>

  {/* Today */}
  <div className="rounded-(--card-radius) border border-border bg-card px-4 py-3 text-center">
    <div className="mb-1 text-h3 text-foreground">
      {stats ? formatStat(stats.todaySignups) : "—"}
    </div>
    <div className="text-caption text-muted-foreground">Today</div>
  </div>

  {/* Warmth — AC4, AC5 */}
  <div className="rounded-(--card-radius) border border-border bg-card px-4 py-3 text-center">
    <div className="mb-1 text-h3 text-foreground">
      {warmthData ? (
        <span className="text-body-sm font-medium">
          {warmthData.hot} Hot, {warmthData.warm} Warm
        </span>
      ) : (
        "—"
      )}
    </div>
    <div className="text-caption text-muted-foreground">Warmth</div>
  </div>
</div>
```

### T3: Connect warmth stat card to real data

The warmth data is fetched by `WarmthPanel` from `/api/dashboard/warmth`. To share it:

- Option A (recommended): Lift the fetch to `client.tsx` and pass as prop to both `WarmthPanel` and the stat card.
- Option B: Fetch independently in the stat card (duplicate request).

For Option A, add warmth state:

```typescript
const [warmthData, setWarmthData] = useState<{
  hot: number;
  warm: number;
  cold: number;
  unscored: number;
} | null>(null);

useEffect(() => {
  fetch("/api/dashboard/warmth")
    .then((r) => r.json())
    .then(setWarmthData)
    .catch(() => {});
}, []);
```

Then pass to `<WarmthPanel warmthData={warmthData} />` and use in the stat card.

**Note:** This overlaps with Story 12.1.8 (shared warmth fetch). If implementing both, use a single shared fetch. For now, the duplicate fetch is acceptable — it will be deduped in 12.1.8.

### T4: Responsive grid + token styling

- Change `grid-cols-4` to `grid-cols-2 lg:grid-cols-4` for mobile responsiveness.
- Verify tokens: `bg-card`, `border-border`, `rounded-(--card-radius)` are used consistently.

### T5: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Dashboard shows 4 stat cards in a row on desktop, 2×2 on mobile
2. Total Signups card shows delta: "↑ X% vs last week" or "—" if no prior data
3. Referral % card shows delta comparison
4. Today card shows today's count (no delta)
5. Warmth card shows "X Hot, Y Warm" from real data (or "—" if no warmth data)
6. `pnpm lint` and `pnpm build` pass with zero errors

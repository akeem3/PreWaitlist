# Story 12.1.9 — Data & Performance

**Epic:** 12.1 — Dashboard Overhaul
**Status:** done
**Depends on:** 12.1.2
**Design Refs:** —

## Story

As a founder, I want the dashboard to load fast and use efficient data patterns.

## Acceptance Criteria (EARS)

- AC1: The `/api/dashboard/chart`, `/api/dashboard/qualification`, and `/api/dashboard/warmth` endpoints shall include `Cache-Control: s-maxage=30, stale-while-revalidate=60` headers.
- AC2: The warmth data shall be fetched once in the dashboard page component and distributed to WarningBanner, WarmthPanel, and Warmth stat card via props (no duplicate fetches).
- AC3: The qualification API endpoint shall not load all subscribers into memory for counting — use Supabase aggregate queries instead of in-memory `.filter().length`.
- AC4: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Cache headers on API routes · T2 (AC2) Shared warmth data distribution · T3 (AC3) Optimize qualification query · T4 (AC4) Lint + build

## Out of Scope

Supabase realtime subscriptions, subscriber table virtualization, SWR/React Query integration.

## Implementation Details

### T1: Cache headers on API routes

- **Files to modify:**
  - `src/app/api/dashboard/chart/route.ts`
  - `src/app/api/dashboard/qualification/route.ts`
  - `src/app/api/dashboard/warmth/route.ts`

Add cache headers to each GET handler:

```typescript
// Before the return statement:
const response = NextResponse.json(data);
response.headers.set("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
return response;
```

This caches responses for 30 seconds on CDN/edge, with stale-while-revalidate for 60 seconds (serves stale data while revalidating in background).

### T2: Shared warmth data distribution

- **File to modify:** `src/app/dashboard/client.tsx`

If not already done in Story 12.1.8, lift warmth data fetch to `client.tsx`:

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

Pass to all consumers:

- `<WarningBanner warmthData={warmthData} />`
- `<WarmthPanel tier={tier} warmthData={warmthData} />`
- Stat card reads from `warmthData` directly

Modify `WarningBanner` and `WarmthPanel` to accept `warmthData` prop and remove their internal fetch calls.

### T3: Optimize qualification query

- **File to modify:** `src/app/api/dashboard/qualification/route.ts`

Currently, the qualification endpoint may load all subscribers into memory and count answers in JavaScript. Replace with Supabase aggregate queries:

```typescript
// Instead of loading all subscribers:
const { data: subscribers } = await supabase
  .from("subscribers")
  .select("qual_answers");

// Use a database function or RPC for aggregation:
// Option A: Create a Supabase RPC function
// Option B: Use .rpc() with a SQL function

// For MVP, a reasonable compromise is to limit the query:
const { data: subscribers } = await supabase
  .from("subscribers")
  .select("qual_answers")
  .eq("waitlist_id", waitlistId)
  .not("qual_answers", "is", null);
```

If the subscriber count is small (<500), in-memory counting is acceptable. The key optimization is avoiding `COUNT(*)` and only fetching `qual_answers` (not full rows).

### T4: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Open Network tab on dashboard → `/api/dashboard/chart`, `/api/dashboard/qualification`, `/api/dashboard/warmth` show `Cache-Control` header
2. Only 1 warmth fetch in Network tab (shared across components)
3. Qualification endpoint doesn't load all subscriber columns
4. Dashboard loads faster (subjective improvement)
5. `pnpm lint` and `pnpm build` pass with zero errors

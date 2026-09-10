# Story 12.4 — Warmth-Segmented Broadcast (Pro)

**Epic:** 12 — Email System
**Status:** ready
**Depends on:** 11.1, 12.3
**Design Refs:** None (extends Story 12.3 compose screen)

## Story

As a Pro founder, I want to send a broadcast to a specific warmth segment (Hot+Warm or Cold) so that I can target re-engagement emails to cold subscribers.

## Acceptance Criteria (EARS)

- AC1: The broadcast compose screen shall include a segment selector: "All subscribers", "Hot + Warm only", "Cold only".
- AC2: The segment selector shall show the count for each segment ("All (234)", "Hot + Warm (180)", "Cold (54)").
- AC3: Selecting a segment shall filter the recipient list before sending.
- AC4: The send confirmation shall show the segment name and count ("Sent to 54 cold subscribers").
- AC5: The segment filter shall use the `warmth_score` column on subscribers.
- AC6: The "Cold only" segment shall be the default selection (primary use case: re-engagement before launch week).
- AC7: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Add segment selector with counts to compose screen · T2 (AC3-AC4) Filter recipients by warmth tier before sending · T3 (AC5-AC6) Verify warmth_score query + default selection · T4 (AC7) Lint + build

## Out of Scope

Email customisation (Story 12.5), warmth trend charts (v1.1), per-segment email templates (v1.1)

## Implementation Details

### T1: Add segment selector with counts to compose screen

- **File to modify:** `src/app/dashboard/broadcast/page.tsx` (created in Story 12.3)

Add a segment selector above the subscriber count. The selector shows three options with counts.

```typescript
// New state
const [segment, setSegment] = useState<"all" | "hot_warm" | "cold">("cold"); // AC6: Default to cold

// Fetch segment counts on mount
useEffect(() => {
  async function fetchCounts() {
    const res = await fetch("/api/dashboard/broadcast/segments");
    if (res.ok) {
      const data = await res.json();
      setCounts(data);
    }
  }
  fetchCounts();
}, []);

// Segment counts state
const [counts, setCounts] = useState({
  all: 0,
  hot_warm: 0,
  cold: 0,
});
```

**Segment selector UI (radio buttons or segmented control):**

```tsx
<div className="mb-4">
  <label className="text-label text-foreground mb-2 block">Send to</label>
  <div className="flex gap-2">
    {[
      { value: "all", label: `All (${counts.all})` },
      { value: "hot_warm", label: `Hot + Warm (${counts.hot_warm})` },
      { value: "cold", label: `Cold (${counts.cold})` },
    ].map((option) => (
      <button
        key={option.value}
        onClick={() => setSegment(option.value as typeof segment)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          segment === option.value
            ? "bg-accent text-white"
            : "bg-card text-muted-foreground border border-border hover:border-foreground/20"
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
</div>
```

**Update subscriber count display:**

```tsx
<p className="text-body text-muted-foreground mb-4">
  Send to{" "}
  <span className="font-medium text-foreground">
    {segment === "all"
      ? counts.all
      : segment === "hot_warm"
        ? counts.hot_warm
        : counts.cold}
  </span>{" "}
  subscribers
  {segment !== "all" && (
    <span className="text-muted-foreground">
      {" "}
      ({segment === "hot_warm" ? "hot + warm" : "cold"} segment)
    </span>
  )}
</p>
```

### T2: Filter recipients by warmth tier before sending

- **New file:** `src/app/api/dashboard/broadcast/segments/route.ts` (GET endpoint for counts)
- **Modify:** `src/app/api/dashboard/broadcast/route.ts` (add segment parameter)

**Segments API endpoint:**

```typescript
// GET /api/dashboard/broadcast/segments
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .single();

  if (!waitlist)
    return NextResponse.json({ error: "No waitlist" }, { status: 404 });

  // Count by warmth tier
  const [allResult, hotWarmResult, coldResult] = await Promise.all([
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id),
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id)
      .in("warmth_score", ["hot", "warm"]),
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id)
      .eq("warmth_score", "cold"),
  ]);

  return NextResponse.json({
    all: allResult.count ?? 0,
    hot_warm: (hotWarmResult.count ?? 0) + (coldResult.count ?? 0),
    cold: coldResult.count ?? 0,
  });
}
```

**Modify broadcast API to accept segment:**

```typescript
// In src/app/api/dashboard/broadcast/route.ts — POST handler
const { subject, body, segment } = await req.json();

// Build subscriber query based on segment
let query = supabase
  .from("subscribers")
  .select("email")
  .eq("waitlist_id", waitlist.id);

if (segment === "hot_warm") {
  query = query.in("warmth_score", ["hot", "warm"]);
} else if (segment === "cold") {
  query = query.eq("warmth_score", "cold");
}
// "all" = no filter

const { data: subscribers } = await query;
```

### T3: Verify warmth_score query + default selection

**AC5:** The `warmth_score` column stores the tier string ("hot", "warm", "cold", or null). The filter queries:

- `in("warmth_score", ["hot", "warm"])` — Hot + Warm segment
- `eq("warmth_score", "cold")` — Cold segment
- No filter — All subscribers (includes unscored/null)

**AC6:** Default selection is "Cold only" — the primary use case for targeted re-engagement before launch week.

**Edge case:** Subscribers with `warmth_score = null` (unscored) are included in "All" but excluded from both "Hot + Warm" and "Cold" segments. This is correct — unscored subscribers have no engagement data yet.

### T4: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any TypeScript errors

## Verification

1. Create `src/app/api/dashboard/broadcast/segments/route.ts`
2. Modify `src/app/dashboard/broadcast/page.tsx` — add segment selector
3. Modify `src/app/api/dashboard/broadcast/route.ts` — add segment parameter
4. As Pro founder, navigate to Broadcast compose screen
5. Verify segment selector shows three options with correct counts
6. Verify "Cold" is selected by default
7. Change to "All" → verify subscriber count updates to total
8. Change to "Hot + Warm" → verify count shows only hot + warm subscribers
9. Change to "Cold" → verify count shows only cold subscribers
10. Send a broadcast with "Cold only" segment → verify only cold subscribers receive the email
11. Verify confirmation shows "Sent to {N} cold subscribers"
12. Check `broadcasts` table has correct recipient_count
13. Run `pnpm lint` and `pnpm build` — verify zero errors

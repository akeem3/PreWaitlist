---
id: epic8.story04
epic: epic-8-thank-you-referral-loop
title: Dashboard Subscriber Referral Column
status: ready
depends_on: [epic8.story02]
updated: 2026-08-17
---

# Story 8.4 — Dashboard Subscriber Referral Column

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`

**Story:** As a founder, I want to see referral data for each subscriber in my dashboard so that I can understand which subscribers are driving growth.

## Design Specs (from SVG analysis)

- **Dashboard subscriber table:** Existing table in dashboard with columns for position, email, signup date
- **New column:** "Referrals" column showing the number of subscribers each subscriber has referred
- **Referral count display:** Integer number, right-aligned
- **Zero referrals:** Display "0" in `text-muted-foreground`

## Acceptance Criteria (EARS)

- AC1: The dashboard subscriber table shall include a "Referrals" column displaying the referral count for each subscriber.
- AC2: The referral count shall be computed by counting `subscribers` where `referrer_id` matches the subscriber's `id`.
- AC3: The referral count shall be displayed as an integer, right-aligned in the column.
- AC4: Subscribers with zero referrals shall display "0" in the muted foreground color.
- AC5: The dashboard shall fetch referral counts for all visible subscribers in a single query (not N+1).
- AC6: The referral column shall be sortable by referral count (descending by default).
- AC7: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC4): Add Referrals column to subscriber table
- T2 (AC5): Batch referral count query
- T3 (AC6): Sort by referral count
- T4 (AC7): Lint + build verification

## Out of scope

Referral analytics charts (Sprint 3), individual subscriber detail view (Sprint 3), referral leaderboard in dashboard (Sprint 3).

## Dev Notes

### T1 — Add Referrals Column

The dashboard subscriber table is in `src/app/dashboard/client.tsx`. Add a new column.

**Current table structure (from `dashboard/client.tsx`):**
The subscriber table currently shows: position, email, signup date.

**Add column:**

```tsx
<th className="text-left text-caption text-muted-foreground font-medium">
  Referrals
</th>

<td className="text-right text-body-sm text-foreground">
  {subscriber.referral_count}
</td>
```

**Styling for zero referrals:**

```tsx
<td
  className={cn(
    "text-right text-body-sm",
    subscriber.referral_count === 0
      ? "text-muted-foreground"
      : "text-foreground font-medium"
  )}
>
  {subscriber.referral_count}
</td>
```

### T2 — Batch Referral Count Query

The dashboard currently fetches subscribers without referral counts. Add a batch query.

**In `src/app/dashboard/page.tsx` (server component):**

```ts
// Fetch subscribers with referral counts
const { data: subscribers } = await supabase
  .from("subscribers")
  .select("id, email, position, created_at")
  .eq("waitlist_id", waitlist.id)
  .order("position", { ascending: true });

// Batch fetch referral counts
const subscriberIds = subscribers?.map((s) => s.id) || [];
const { data: referralCounts } = await supabase
  .from("subscribers")
  .select("referrer_id")
  .in("referrer_id", subscriberIds);

// Compute counts
const countMap = new Map<string, number>();
referralCounts?.forEach((r) => {
  countMap.set(r.referrer_id, (countMap.get(r.referrer_id) || 0) + 1);
});

// Merge into subscriber data
const subscribersWithCounts = subscribers?.map((s) => ({
  ...s,
  referral_count: countMap.get(s.id) || 0,
}));
```

**Pass to client component:**

```tsx
<DashboardClient
  subscribers={subscribersWithCounts}
  // ... other props
/>
```

### T3 — Sort by Referral Count

The table should be sortable by clicking the "Referrals" column header.

**Client-side sort:**

```ts
const [sortField, setSortField] = useState<"position" | "referral_count">(
  "position"
);
const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

const sortedSubscribers = [...subscribers].sort((a, b) => {
  if (sortField === "referral_count") {
    return sortDir === "desc"
      ? b.referral_count - a.referral_count
      : a.referral_count - b.referral_count;
  }
  return sortDir === "asc" ? a.position - b.position : b.position - a.position;
});
```

### T4 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files modified:**

- `src/app/dashboard/page.tsx` (add referral count query)
- `src/app/dashboard/client.tsx` (add Referrals column + sort)

**Available utilities:** `cn()` ✓, `createClient()` ✓

# Story 12.1.3 — Tier Gating Consistency

**Epic:** 12.1 — Dashboard Overhaul
**Status:** ready
**Depends on:** 12.1.0
**Design Refs:** `docs/design/High-fidelity-svgs/Dashboard_Empty_state_HF4.svg`

## Story

As a founder, I want locked features to be consistently locked everywhere so that the dashboard feels trustworthy and coherent.

## Acceptance Criteria (EARS)

- AC1: The WarmthPanel component shall display a locked overlay for Free tier: greyed-out bars with reduced opacity, a "Pro" badge, and text "Upgrade to Pro to see warmth scores".
- AC2: The WarmthPanel shall accept a `tier` prop. When `tier === "free"`, render the locked overlay. When `tier === "pro"`, render live data (current behavior).
- AC3: The Warmth stat card (from Story 12.1.2) shall show a lock icon next to "Warmth" label when `tier === "free"`.
- AC4: The CSV Export button shall remain hidden for Free tier (current behavior at line 483 of `client.tsx` — already correct).
- AC5: The sidebar locked items (Warmth, Broadcast) shall show tooltips (covered in Story 12.1.0 AC4).
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) WarmthPanel locked overlay with tier prop · T2 (AC3) Warmth stat card lock icon · T3 (AC4) Verify CSV export behavior · T4 (AC6) Lint + build

## Out of Scope

Upgrade modal trigger (Paddle billing is Epic 13), subscriber count cap enforcement, broadcast locked state changes.

## Implementation Details

### T1: WarmthPanel locked overlay with tier prop

- **File to modify:** `components/dashboard/warmth-panel.tsx`

Add `tier` prop:

```typescript
interface WarmthPanelProps {
  tier?: string;
  warmthData?: {
    hot: number;
    warm: number;
    cold: number;
    unscored: number;
  } | null;
}
```

When `tier === "free"`, render a locked overlay:

```tsx
export default function WarmthPanel({ tier = "free", warmthData }: WarmthPanelProps) {
  if (tier === "free") {
    return (
      <div className="rounded-(--card-radius) border border-border bg-card p-5 relative">
        <h3 className="mb-4 text-body-sm font-semibold text-foreground">Warmth Distribution</h3>
        <div className="space-y-3 opacity-50">
          {/* Render bars at 0% width */}
          {["Hot", "Warm", "Cold", "Unscored"].map((label) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-16 text-caption text-muted-foreground">{label}</span>
              <div className="h-2 flex-1 rounded-full bg-muted" />
              <span className="w-8 text-caption text-muted-foreground">—</span>
            </div>
          ))}
        </div>
        {/* Locked overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-(--card-radius) bg-card/80">
          <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
            Pro
          </span>
          <p className="text-body-sm text-muted-foreground">
            Upgrade to Pro to see warmth scores
          </p>
        </div>
      </div>
    );
  }

  // Existing live data rendering for Pro tier
  return ( /* ... existing JSX ... */ );
}
```

**Important:** The `WarmthPanel` currently fetches its own data. When `tier === "free"`, skip the fetch entirely (no point fetching data that won't be shown).

### T2: Warmth stat card lock icon

- **File to modify:** `src/app/dashboard/client.tsx`

In the Warmth stat card (from Story 12.1.2), when `tier === "free"`, show a lock icon:

```tsx
{
  /* Warmth stat card */
}
<div className="rounded-(--card-radius) border border-border bg-card px-4 py-3 text-center">
  <div className="mb-1 text-h3 text-foreground flex items-center justify-center gap-1.5">
    {tier === "free" && (
      <svg
        width="14"
        height="14"
        viewBox="0 0 12 12"
        fill="none"
        className="text-muted-foreground"
      >
        <rect
          x="2.5"
          y="5"
          width="7"
          height="5.5"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path
          d="M4 5V3.5C4 2.4 4.9 1.5 6 1.5C7.1 1.5 8 2.4 8 3.5V5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    )}
    {warmthData && tier === "pro" ? (
      <span className="text-body-sm font-medium">
        {warmthData.hot} Hot, {warmthData.warm} Warm
      </span>
    ) : (
      "—"
    )}
  </div>
  <div className="text-caption text-muted-foreground">Warmth</div>
</div>;
```

### T3: Verify CSV export behavior

Line 483 in `client.tsx`: `{tier === "pro" && ( ... )}` — this already hides the CSV export button for Free tier. Verify it works correctly with no changes needed.

### T4: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Free tier founder: WarmthPanel shows locked overlay with "Pro" badge and upgrade text
2. Free tier founder: Warmth stat card shows lock icon and "—"
3. Pro tier founder: WarmthPanel shows live data bars
4. Pro tier founder: Warmth stat card shows "X Hot, Y Warm"
5. CSV Export button visible only for Pro tier
6. Sidebar locked items show tooltips (from Story 12.1.0)
7. `pnpm lint` and `pnpm build` pass with zero errors

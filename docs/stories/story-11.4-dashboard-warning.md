# Story 11.4 — Dashboard Warning State

**Epic:** 11 — Warmth Tracking Engine
**Status:** ready
**Depends on:** 11.1
**Design Refs:** `docs/design/sprint-3-design-specs.md` — S7, `docs/design/dashboard-design-guide.md`

## Story

As a founder, I want to be alerted when my list health is declining (high cold %) so that I can take action before launch.

## Acceptance Criteria (EARS)

- AC1: The dashboard shall display a warning banner when the cold subscriber percentage exceeds a configurable threshold (default: 40%).
- AC2: The warning banner shall use the design system's warning styling: `bg-yellow-50 border border-yellow-200 text-yellow-800`.
- AC3: The banner shall show: "⚠️ {X}% of your list has gone cold. Consider sending a re-engagement email."
- AC4: The warning shall only appear when there are ≥10 subscribers (avoid warning on tiny lists).
- AC5: The threshold shall be configurable in Settings (default 40%, range 20–80%).
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC3) Create warning banner component · T2 (AC4) Minimum subscriber threshold · T3 (AC5) Threshold configuration in Settings · T4 (AC6) Lint + build

## Out of Scope

Automated email alerts to founder (was Growth tier, now deferred), warmth trend alerts (v1.1).

## Implementation Details

### T1: Create warning banner component

- **New file:** `components/dashboard/cold-warning-banner.tsx`

```typescript
"use client";

interface ColdWarningBannerProps {
  coldCount: number;
  totalCount: number;
}

export function ColdWarningBanner({ coldCount, totalCount }: ColdWarningBannerProps) {
  // AC1: Calculate cold percentage
  const coldPercent = Math.round((coldCount / totalCount) * 100);

  // AC2: Warning styling
  return (
    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
      <p className="text-sm text-yellow-800">
        ⚠️ {coldPercent}% of your list has gone cold. Consider sending a re-engagement email.
      </p>
    </div>
  );
}
```

**Placement:** Top of main content area, below the stat cards row in `src/app/dashboard/client.tsx`.

Wire into dashboard:

```typescript
// In DashboardClient, after stat cards row
{coldWarning && <ColdWarningBanner coldCount={warmthData.cold} totalCount={warmthData.total} />}
```

### T2: Minimum subscriber threshold (AC4)

- File: `components/dashboard/cold-warning-banner.tsx` (or parent)

Only show banner when `totalCount >= 10`:

```typescript
// In DashboardClient
const showColdWarning =
  warmthData && warmthData.total >= 10 && warmthData.cold > 0;
```

### T3: Threshold configuration in Settings

- **Depends on:** Story 11.7 must add `cold_threshold` column to `waitlists` (integer, default 40)

#### Settings page

- **New file:** `src/app/dashboard/settings/page.tsx`

```typescript
"use client";

export default function SettingsPage() {
  // Fetch waitlist settings including cold_threshold
  // Form with slider or number input (range 20-80, default 40)
  // Save handler: PATCH /api/waitlist with cold_threshold
}
```

#### Update sidebar

- File: `components/dashboard/sidebar.tsx` (lines 200-214)
- Remove the disabled/locked state from Settings nav item
- Settings should be accessible to all tiers

#### Wire threshold into warning logic

- File: `src/app/dashboard/client.tsx`

```typescript
// Fetch cold_threshold from waitlist settings
// Use it instead of hardcoded 40%
const showColdWarning =
  warmthData &&
  warmthData.total >= 10 &&
  (warmthData.cold / warmthData.total) * 100 >= coldThreshold;
```

### T4: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors

## Verification

1. Create the warning banner component
2. Wire it into dashboard below stat cards
3. Test: 20 subscribers, 10 cold (50%) → banner appears
4. Test: 5 subscribers, 3 cold (60%) → banner does NOT appear (below threshold of 10)
5. Create settings page with threshold slider
6. Change threshold to 60% → verify banner disappears (was showing at 50%)
7. Run `pnpm lint` and `pnpm build` — verify zero errors

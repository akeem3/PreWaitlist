# Story 11.3 — Warmth Distribution Panel (Real Data)

**Epic:** 11 — Warmth Tracking Engine
**Status:** ready (3 blocking issues — see Dev Notes)
**Depends on:** 11.1
**Design Refs:** `docs/design/sprint-3-design-specs.md` — S3, `docs/design/dashboard-design-guide.md`

## Story

As a founder, I want the warmth distribution panel to show real data so that I can see the health of my list at a glance.

## Acceptance Criteria (EARS)

- AC1: The warmth distribution panel shall display four horizontal bars: Hot, Warm, Cold, Unscored.
- AC2: Each bar shall show the count of subscribers in that tier and the percentage of total.
- AC3: The bars shall use the same color scheme as the warmth badges (green/amber/blue/grey).
- AC4: The panel shall fetch data from `GET /api/dashboard/warmth` which returns `{ hot: number, warm: number, cold: number, unscored: number }`.
- AC5: When the waitlist has zero subscribers, the panel shall show em-dashes (not zeros).
- AC6: The panel shall no longer be blurred or locked for any tier — warmth viewing is available to all founders.
- AC7: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC3) Fix bar colors to use design tokens · T2 (AC4) Swap API endpoint from public to authenticated · T3 (AC5-AC6) Remove blur/lock, fix empty state · T4 (AC7) Lint + build

## Out of Scope

Warmth trend charts (v1.1), real-time score updates (daily batch in Story 11.1).

## Implementation Details

### Status: Partially Implemented — 3 Blocking Issues

The `WarmthPanel` component at `components/dashboard/warmth-panel.tsx` (148 lines) has real bar rendering but 3 blocking issues must be fixed.

### Current Props Interface (lines 13-16)

```typescript
interface WarmthPanelProps {
  tier: string; // Must be removed — warmth visible to all tiers
  subdomain: string; // Must be removed — using authenticated endpoint
}
```

### T1: Fix bar colors to use design tokens

- File: `components/dashboard/warmth-panel.tsx` (lines 122, 128, 134, 140)

**Current (wrong — hardcoded colors):**

```typescript
<WarmthBar label="Hot" count={hot} total={total} color="bg-red-500" />
<WarmthBar label="Warm" count={warm} total={total} color="bg-amber-500" />
<WarmthBar label="Cold" count={cold} total={total} color="bg-blue-500" />
<WarmthBar label="Unscored" count={unscored} total={total} color="bg-gray-400" />
```

**Required (correct — design tokens from globals.css):**

```typescript
<WarmthBar label="Hot" count={hot} total={total} color="bg-status-hot" />
<WarmthBar label="Warm" count={warm} total={total} color="bg-status-warm" />
<WarmthBar label="Cold" count={cold} total={total} color="bg-status-cold" />
<WarmthBar label="Unscored" count={unscored} total={total} color="bg-muted" />
```

Design tokens in `globals.css` lines 33-35:

- `--color-status-hot: #d0492f` → use as `bg-status-hot`
- `--color-status-warm: #c7841a` → use as `bg-status-warm`
- `--color-status-cold: #3b6fa6` → use as `bg-status-cold`

### T2: Swap API endpoint from public to authenticated

- File: `components/dashboard/warmth-panel.tsx` (line 91)

**Current (wrong — public endpoint):**

```typescript
const res = await fetch(`/api/warmth/${subdomain}`);
```

**Required (correct — authenticated endpoint):**

```typescript
const res = await fetch("/api/dashboard/warmth");
```

The correct endpoint exists at `src/app/api/dashboard/warmth/route.ts` (44 lines). It:

- Authenticates via `supabase.auth.getUser()`
- Returns `{ hot, warm, cold, unscored, total }` — same shape

**Also remove `subdomain` from props and fetch call.**

### T3: Remove blur/lock + fix empty state

- File: `components/dashboard/warmth-panel.tsx`

#### Remove blur/lock (AC6)

Current code (lines 18-51): `LockedOverlay` component exists.
Current code (line 116): `isFree ? "pointer-events-none blur-[2px]" : ""`
Current code (line 144): `{isFree && <LockedOverlay />}`

**Actions:**

1. Delete `LockedOverlay` component (lines 18-51)
2. Remove the `isFree` conditional blur from line 116
3. Remove the `{isFree && <LockedOverlay />}` render from line 144
4. Remove the `tier` prop from the interface and all usages

#### Empty state (AC5)

Current code (line 70): `{total > 0 ? count : "—"}` — already correct (em-dash when total=0).

**Verify:** When total = 0, all bars show em-dash. No changes needed.

### T4: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors

## Verification

1. Fix bar colors: Hot=green, Warm=amber, Cold=blue, Unscored=grey
2. Swap API endpoint to `/api/dashboard/warmth`
3. Remove `LockedOverlay` component and all blur/lock logic
4. Remove `tier` and `subdomain` from props interface
5. Open dashboard → warmth panel → verify real data loads (not placeholder)
6. Verify no blur overlay on free tier
7. Test with 0 subscribers → verify em-dashes (not zeros)
8. Run `pnpm lint` and `pnpm build` — verify zero errors

# Story 12.1.5 — Mobile Responsiveness Fix

**Epic:** 12.1 — Dashboard Overhaul
**Status:** ready
**Depends on:** —
**Design Refs:** `docs/design/High-fidelity-svgs/Dashboard_active_state_HF5.svg`

## Story

As a founder using a mobile device, I want the subscriber table and dashboard layout to work properly on small screens.

## Acceptance Criteria (EARS)

- AC1: The subscriber table shall be wrapped in `overflow-x-auto` to enable horizontal scrolling on mobile.
- AC2: The stat card grid shall use `grid-cols-2` on mobile viewports (≤768px).
- AC3: The qualification panel and warmth panel grid (`grid-cols-2` at line 451 of `client.tsx`) shall stack to `grid-cols-1` on mobile.
- AC4: The header bar (subdomain + copy + share) shall wrap gracefully on mobile — use `flex-wrap` or stack vertically.
- AC5: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Table overflow wrapper · T2 (AC2-AC3) Responsive grids · T3 (AC4) Header wrap · T4 (AC5) Lint + build

## Out of Scope

Subscriber table pagination (PRD explicitly excludes from Sprint 3.1), table column hiding on mobile, mobile-specific navigation patterns beyond existing hamburger.

## Implementation Details

### T1: Table overflow wrapper

- **File to modify:** `src/app/dashboard/client.tsx`

Wrap the subscriber table container (line 456) with an overflow wrapper:

```tsx
{/* Before (line 456): */}
<div className="rounded-(--card-radius) border border-border bg-card">

{/* After: */}
<div className="rounded-(--card-radius) border border-border bg-card">
  {/* ... search, filters ... */}
  <div className="overflow-x-auto">
    {/* table grid and rows */}
  </div>
</div>
```

The `grid-cols-6` table grid (line 495) will scroll horizontally on narrow screens instead of overflowing.

### T2: Responsive grids

- **Stat card grid (line 408):** Change `grid-cols-4` to `grid-cols-2 lg:grid-cols-4`
- **Panel grid (line 451):** Change `grid-cols-2` to `grid-cols-1 md:grid-cols-2`

```tsx
{/* Stat cards */}
<div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

{/* Panels */}
<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
```

### T3: Header wrap

- **File to modify:** `src/app/dashboard/client.tsx`

The header bar (lines 270–329) contains the subdomain, copy button, and Twitter share button. On mobile, these may overflow. Add `flex-wrap`:

```tsx
<div className="border-b border-border bg-background px-6 py-4">
  <div className="flex flex-wrap items-center gap-3">
    {/* subdomain, copy, share */}
  </div>
</div>
```

### T4: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Resize browser to 375px width (mobile)
2. Stat cards show in 2×2 grid
3. Subscriber table scrolls horizontally
4. Qualification and warmth panels stack vertically
5. Header bar wraps without overflow
6. Sidebar hamburger still works
7. `pnpm lint` and `pnpm build` pass with zero errors

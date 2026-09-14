# Story 12.2.12 — Dashboard Auto-Refresh

**Epic:** 12.2 — Gap Fixes
**Status:** ready
**Depends on:** —
**Design Refs:** —

## Story

As a founder checking my dashboard, I want the data to refresh automatically so that I see current stats without manually reloading the page.

## Acceptance Criteria (EARS)

- AC1: The dashboard client component shall call `router.refresh()` when the browser tab regains visibility (from `visibilitychange` event).
- AC2: The dashboard client component shall call `router.refresh()` on a 60-second interval while the tab is visible.
- AC3: The interval shall be cleared when the component unmounts or the tab becomes hidden.
- AC4: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC3) Add visibility + interval refresh · T2 (AC4) Lint + build

## Out of Scope

Real-time WebSocket updates. Per-section granular refresh. Optimistic UI updates.

## Implementation Details

### T1: Add visibility + interval refresh

- **File to modify:** `src/app/dashboard/client.tsx`

Add two refresh mechanisms to the dashboard client component:

**Visibility refresh:**

```typescript
useEffect(() => {
  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      router.refresh();
    }
  }
  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () =>
    document.removeEventListener("visibilitychange", handleVisibilityChange);
}, [router]);
```

**Interval refresh (60s):**

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (document.visibilityState === "visible") {
      router.refresh();
    }
  }, 60_000);
  return () => clearInterval(interval);
}, [router]);
```

Key details:

- `router` from `useRouter()` (already imported from `next/navigation`)
- Both effects clean up on unmount
- Interval only fires when tab is visible (avoids wasted refreshes)
- 60s is long enough to avoid hammering the server, short enough to feel fresh

### T2: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Open dashboard, switch to another tab, switch back → data refreshes
2. Leave dashboard open for 60s → data refreshes automatically
3. Navigate away from dashboard → no lingering intervals
4. `pnpm lint` and `pnpm build` pass with zero errors

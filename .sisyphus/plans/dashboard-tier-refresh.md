# Plan: Dashboard Sidebar Tier Refresh Mechanism

## Problem

After a Paddle upgrade, the sidebar stays locked (Broadcast/Warmth/Updates show lock icons, "Upgrade to Pro" CTA remains) until a full navigation or the overview page's 60s/visibility `router.refresh()` happens to re-run the layout.

## Root Cause

```
layout.tsx (server) ──tier prop──► shell.tsx ──tier prop──► Sidebar
                                      │
                                      └──► DashboardContext.tier (read-only)
```

1. **Sidebar tier is a frozen server prop** — fetched once in `src/app/dashboard/layout.tsx:41-45`, passed through `shell.tsx:151` with no state/setter.
2. **Sidebar sits outside `DashboardContext.Provider`** (`shell.tsx:145-155` vs `179-187`) — receives tier as a plain prop only.
3. **No `setTier` exists** anywhere — context value is immutable.
4. **Billing page polls `/api/profile` successfully** (`billing/client.tsx:45-56`) but only updates local state — never propagates to shell/context/sidebar.
5. **`paddle-checkout-opened` has exactly one listener** — billing page only (`billing/client.tsx:78`).
6. **Dashboard `UpgradeModal` does no post-checkout work** — dispatches event and closes; no polling, no `router.refresh()`.
7. **`usePaddleUpgrade` polling exists** but is only wired into onboarding (`onboarding-client-layout.tsx`), not the dashboard shell.
8. **Overview-only safety net** — `dashboard/client.tsx:168-190` refreshes on visibility/60s but only while `/dashboard` overview is mounted.

## Goal

After any tier change (upgrade, cancel/downgrade), the sidebar and all dashboard chrome update **within seconds** without requiring a full page reload — on any dashboard route.

## Design

### Architecture: Shell owns tier as client state

Make `DashboardShell` the single client-side source of truth for tier:

```
layout.tsx (server, initial seed)
        │
        ▼
shell.tsx: useState(tier)  ◄── refreshTier() / polling / events
        │
        ├──► Sidebar (prop)           ← re-renders on state change
        └──► DashboardContext.tier    ← consumers via useDashboardTier()
```

### Data flow after upgrade

```
Paddle checkout opens
  → UpgradeModal dispatches "paddle-checkout-opened"
  → Shell listener starts polling GET /api/profile (2s × 30 = 60s max)
  → Webhook writes founder_profiles.tier = "pro"
  → Poll detects tier change
  → setTier("pro") + router.refresh()
  → Sidebar unlocks immediately
  → Context consumers (stat cards, TopReferrers, etc.) update
  → Server-gated pages (broadcast/updates) correct on next nav/refresh
```

Also trigger on:

- `?upgraded=1` query param (Paddle successUrl return, any dashboard route)
- `tier-changed` custom event (dispatched by billing page after its poll succeeds)
- Optional: BroadcastChannel for cross-tab sync

## Implementation Steps

### Step 1 — Shell: tier as state + refresh primitives

**File:** `src/app/dashboard/shell.tsx`

1. Change tier prop handling to state:

   ```ts
   const [tier, setTier] = useState(serverTierProp);
   ```

   Rename incoming prop to `serverTier` to avoid shadowing.

2. Add refs for polling:

   ```ts
   const tierRef = useRef(tier);
   const pollingRef = useRef<Interval | null>(null);
   const pollingTimeoutRef = useRef<Timeout | null>(null);
   ```

   Keep `tierRef.current` in sync via a lightweight assignment (not `useEffect` — avoid `react-hooks/set-state-in-effect`).

3. Add `stopTierPolling()`:
   - Clear interval + timeout, null both refs.

4. Add `startTierPolling()`:
   - Call `stopTierPolling()` first (idempotent).
   - `setInterval` every **2000ms**:
     - `fetch("/api/profile")`
     - If `data.tier` exists and `!== tierRef.current`:
       - `setTier(data.tier)`
       - `tierRef.current = data.tier`
       - `stopTierPolling()`
       - `router.refresh()` (syncs server layout prop + server-gated pages)
       - Dispatch `tier-changed` with `{ detail: { tier } }` (for billing page + other listeners)
   - Hard cap: `setTimeout(stopTierPolling, 60_000)` (align with `usePaddleUpgrade`, not billing's 30s).
   - Failures: silent, keep polling until cap.

5. Add `refreshTier()` (one-shot, no polling):
   - Same fetch logic as one poll iteration.
   - Useful for billing cancel return, manual refresh, etc.

6. Wire event listeners in a single `useEffect`:
   - `paddle-checkout-opened` → `startTierPolling()`
   - `tier-changed` → if `e.detail.tier !== tierRef.current`, `setTier` + sync ref + `router.refresh()`
   - On mount: if `searchParams.get("upgraded") === "1"` → `startTierPolling()` + `history.replaceState` to strip param
   - Cleanup: remove listeners, `stopTierPolling()`

7. Update context value:

   ```ts
   value={{
     tier,                    // now state-backed
     activeWaitlistId,
     setUpgradeModal,
     refreshTier,             // new
     startTierPolling,        // new (optional exposure)
   }}
   ```

8. Pass state `tier` to `<Sidebar tier={tier}>` (line 151) — already reads the variable, just now it's state.

9. Keep `useDashboardTier()` returning `ctx?.tier` — no signature change.

10. Add `useRefreshTier()` hook export for consumers:
    ```ts
    export function useRefreshTier() {
      const ctx = useContext(DashboardContext);
      return ctx?.refreshTier ?? null;
    }
    ```

### Step 2 — Billing page: dispatch tier-changed on successful poll

**File:** `src/app/dashboard/settings/billing/client.tsx`

1. In `startPolling` success branch (line 49-52), after `setProfile(data)`:

   ```ts
   window.dispatchEvent(
     new CustomEvent("tier-changed", { detail: { tier: data.tier } })
   );
   ```

   Shell listener will pick this up and update sidebar.

2. Optionally simplify: billing can now rely on context tier for display after shell updates. Keep local `profile.tier` as immediate optimistic display until event propagates (harmless dual-write for one tick).

3. Keep existing `?upgraded=1` handling OR remove it if shell handles it globally — **prefer shell-only** to avoid double-polling. Billing's mount effect (lines 63-70) can be simplified to just strip the param (shell starts polling).

4. On `handleManageBilling` return from Paddle portal (cancel may have occurred): call `refreshTier` from context if available, else leave to next visibility refresh. **Check `CancellationFlow` for post-cancel refresh** — if it doesn't dispatch, add `tier-changed` dispatch with `tier: "free"` after successful cancel API call.

### Step 3 — UpgradeModal: no structural change

**File:** `components/dashboard/upgrade-modal.tsx`

- Already dispatches `paddle-checkout-opened` (line 87). ✓
- No changes required — shell now listens globally.
- Verify `onOpenChange(false)` before checkout opens doesn't matter (it doesn't — shell owns the polling, not the modal).

### Step 4 — Cross-tab sync (recommended, low cost)

**File:** `src/app/dashboard/shell.tsx`

1. On successful tier change (poll or event), post:
   ```ts
   try {
     const bc = new BroadcastChannel("prewaitlist-tier");
     bc.postMessage({ tier: newTier });
     bc.close();
   } catch {}
   ```
2. On shell mount, open channel once:
   ```ts
   const bc = new BroadcastChannel("prewaitlist-tier");
   bc.onmessage = (e) => {
     if (e.data?.tier && e.data.tier !== tierRef.current) {
       setTier(e.data.tier);
       tierRef.current = e.data.tier;
       router.refresh();
     }
   };
   ```
3. Cleanup: `bc.close()` on unmount.
4. Wrap in try/catch — BroadcastChannel unsupported in some happy-dom test environments.

**Decision:** Include this — it's ~15 lines and fixes the "upgrade in tab A, tab B still locked" case with zero extra deps.

### Step 5 — Server-gated pages self-correct

No code change needed:

- `broadcast/page.tsx` and `updates/page.tsx` re-query tier per request → correct on next navigation.
- `router.refresh()` after tier change re-runs layout RSC → server prop catches up to state (or state already ahead — both same value).
- `warmth/page.tsx` soft gate → correct on refresh/navigation.

### Step 6 — Tests

**New file:** `src/__tests__/components/dashboard-tier-refresh.test.tsx`

Test cases:

1. Shell initializes tier from `serverTier` prop.
2. `paddle-checkout-opened` event starts polling (mock fetch → returns `{ tier: "pro" }` → sidebar unlocks).
3. Polling stops after success (advance timers, no further fetches).
4. Polling stops after 60s cap even if still free.
5. `tier-changed` event with new tier updates state + calls `router.refresh()`.
6. `?upgraded=1` on mount starts polling + strips param.
7. `refreshTier()` one-shot fetch updates state.
8. Cleanup on unmount clears interval + removes listeners.
9. Sidebar renders unlocked nav items when tier state = "pro" (may already be covered by sidebar tests — extend if not).

**Update if needed:**

- `src/__tests__/components/dashboard-auto-refresh.test.tsx` — should be unaffected (overview page logic untouched).
- Existing sidebar/billing tests — verify no regressions from prop rename (`serverTier`).

**Mocks needed:**

- `next/navigation` (router.refresh, useSearchParams)
- `global.fetch` for `/api/profile`
- Fake timers for polling intervals

### Step 7 — Verification

1. `pnpm lint` — 0 errors (watch for `react-hooks/set-state-in-effect` — use ref sync, not effect).
2. `pnpm test` — all pass, baseline ≥317 (was 317+ before this work; pre-existing 7 failures + flaky billing webhook test remain).
3. Manual E2E:
   - Local: free account → click locked Broadcast → complete sandbox checkout → observe sidebar unlock within ~2-4s without full reload.
   - Verify on non-overheiew route (e.g. `/dashboard/settings/broadcast` wait — broadcast redirects free; use `/dashboard/warmth` or `/dashboard/settings`).
   - Verify `?upgraded=1` return path.
   - Verify billing page still shows Pro cards immediately.
   - Verify cancel → tier reverts to free on sidebar (if CancellationFlow dispatches).

## Files to Modify

| File                                                       | Change                                                                              |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/app/dashboard/shell.tsx`                              | **Primary** — tier state, polling, events, context expansion, BroadcastChannel      |
| `src/app/dashboard/settings/billing/client.tsx`            | Dispatch `tier-changed` on poll success; simplify `?upgraded=1` if shell handles it |
| `components/billing/cancellation-flow.tsx`                 | Check post-cancel; dispatch `tier-changed` with `"free"` if missing                 |
| `src/__tests__/components/dashboard-tier-refresh.test.tsx` | **New** — unit tests for mechanism                                                  |
| `src/__tests__/components/dashboard-auto-refresh.test.tsx` | Touch only if shell changes affect it (unlikely)                                    |

**No changes:** `upgrade-modal.tsx`, `use-paddle-upgrade.ts`, `layout.tsx`, `sidebar.tsx`, server pages.

## Edge Cases Handled

| Case                                    | Handling                                                                                                             |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Webhook race (redirect before DB write) | Polling retries every 2s until tier appears or 60s cap                                                               |
| Multiple checkout opens                 | `startTierPolling` clears prior interval first                                                                       |
| Already-pro user opens checkout         | Poll sees `tier === tierRef` → no-op, keeps polling until cap (checkout API returns 400 "Already subscribed" anyway) |
| API failures during poll                | Silent catch, continue until cap                                                                                     |
| Unmount mid-poll                        | Cleanup clears interval + timeout + listeners + BroadcastChannel                                                     |
| Cancel/downgrade                        | Webhook writes free → next poll or `tier-changed` from billing cancel flow                                           |
| Cross-tab upgrade                       | BroadcastChannel syncs tier + `router.refresh()`                                                                     |
| `react-hooks/set-state-in-effect`       | Tier ref synced via direct assignment in setters, not `useEffect`                                                    |
| Sidebar outside Provider                | Receives tier as prop from same state — re-renders correctly                                                         |
| Server-gated pages                      | Correct on next navigation; `router.refresh()` after change accelerates                                              |

## Out of Scope

- Introducing SWR/React Query (project uses none — stay consistent).
- Changing how server pages fetch tier (keep per-request queries).
- Onboarding upgrade flow (already works via `usePaddleUpgrade` + form context).
- Overview page's existing visibility/60s refresh (keep as-is safety net).
- Paddle webhook changes (already correct — destination URL is ops fix).

## Defaults Chosen (flag if you disagree)

1. **Polling: 2s interval, 60s cap** — matches `usePaddleUpgrade`, gives webhook + redirect race ample time.
2. **Include BroadcastChannel cross-tab** — ~15 lines, no deps, fixes multi-tab.
3. **Shell owns polling globally** — billing keeps thin local state for immediate paint but dispatches event; avoids logic duplication drift.
4. **`router.refresh()` on every tier change** — keeps server RSC props in sync; cheap enough on tier-only changes.

## Success Criteria

- [ ] Upgrade from any dashboard route unlocks sidebar within ≤5s (post-webhook) without full page reload
- [ ] `useDashboardTier()` consumers (stat cards, TopReferrers, Add Waitlist) update in same tick
- [ ] Billing page and sidebar show consistent tier after upgrade
- [ ] `?upgraded=1` return starts polling on any dashboard route, not just billing
- [ ] Cancel/downgrade re-locks sidebar
- [ ] Cross-tab: upgrade in one tab updates the other
- [ ] `pnpm lint` clean, tests pass, no new warnings

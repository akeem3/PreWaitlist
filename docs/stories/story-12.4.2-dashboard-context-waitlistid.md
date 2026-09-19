# Story 12.4.2 — Expose activeWaitlistId in DashboardContext

**Status:** ready
**Epic:** 12.4 — Pre-Epic 13 Gaps

## Story

As a dashboard child component, I want to access the active waitlist ID via context so that I don't need to parse URL params or receive it as a prop.

## Acceptance Criteria (EARS)

- AC1: The `DashboardContext` in `src/app/dashboard/shell.tsx` shall include `activeWaitlistId: string` alongside `tier`.
- AC2: A `useActiveWaitlistId()` hook shall be exported from `shell.tsx`.
- AC3: The `activeWaitlistId` shall update when the user switches waitlists.
- AC4: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Extend DashboardContext + export hook
T2 (AC3) Verify context updates on switch
T3 (AC4) Lint + build

## Dev Notes

- **Current state:** `DashboardContext` at `shell.tsx:16-20` only has `{ tier: string }`. The `activeWaitlistId` is managed as local state (line 53-87) but not exposed.
- **Change:** Extend `DashboardContextValue` to `{ tier: string; activeWaitlistId: string }`. Update Provider value.
- **New hook:** `export function useActiveWaitlistId(): string | null { return useContext(DashboardContext)?.activeWaitlistId ?? null; }`
- **Existing `useDashboardTier()` hook** at line 22-25 — follow the same pattern.
- This is quality-of-life, not a blocker. Pages working via `?wid=` URL param don't need to change.

# Epic 12.4 — Pre-Epic 13 Gaps

**Status:** ready
**Source:** [Epic 13 audit](./sprint-3-plan.md), [multi-waitlist implementation audit](./epic-12.2-gap-fixes.md)

## Goal

Close the implementation gaps that block Epic 13 (Billing & Feature Gating) from working correctly. These are wiring bugs, missing data flows, and test coverage gaps that exist because Epics 11-12.3 were built ahead of schedule and some cross-cutting concerns were missed.

## Definition of Done

All 5 gaps closed. The qualification dashboard page works with multi-waitlist scoping. The `subscriber_count` cached counter is incremented/decremented on every subscriber insert/delete. The `DashboardContext` exposes `activeWaitlistId` to all dashboard children. Free-tier founders cannot enter onboarding when they already have a waitlist. Multi-waitlist scoping has test coverage. Lint and build pass with zero errors.

## Story Index

| ID     | Title                                       | Depends on    | Status |
| ------ | ------------------------------------------- | ------------- | ------ |
| 12.4.0 | Fix Qualification Page Waitlist Scoping     | —             | ready  |
| 12.4.1 | Wire subscriber_count Increment/Decrement   | —             | ready  |
| 12.4.2 | Expose activeWaitlistId in DashboardContext | —             | ready  |
| 12.4.3 | Free-Tier Onboarding Guard                  | —             | ready  |
| 12.4.4 | Epic 12.4 Tests                             | 12.4.0–12.4.3 | ready  |

> **Note:** Story 12.4.2 had a self-dependency (`12.4.2` depends on `12.4.2`) — corrected to `—`.

---

### Story 12.4.0 — Fix Qualification Page Waitlist Scoping

**Status:** ready
**Story:** As a founder with multiple waitlists, I want the qualification dashboard page to show data for the active waitlist so that I don't see stale or empty data.

**Acceptance Criteria (EARS):**

- AC1: The qualification page (`src/app/dashboard/qualification/page.tsx`) shall pass `waitlistId` to `QualificationClient` as a prop.
- AC2: The `QualificationPanel` component shall use the `waitlistId` prop to scope its API call to `GET /api/dashboard/qualification?waitlist_id={id}`.
- AC3: When no `wid` URL param is present, the qualification page shall default to the founder's most recently created waitlist (matching the shell's default behavior).
- AC4: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Pass waitlistId to client + verify API call scopes correctly · T2 (AC3) Default waitlist selection · T3 (AC4) Lint + build

**Dev Notes:**

- **Root cause:** `src/app/dashboard/qualification/page.tsx` line 27 renders `<QualificationClient subdomain={waitlist.subdomain} />` without passing `waitlistId`. The `QualificationPanel` component (`components/dashboard/qualification-panel.tsx` line 17) accepts `waitlistId` as optional and uses it in its API call (line 31). Without it, the API returns 400 "waitlist_id is required".
- Fix: Add `waitlistId={waitlist.id}` to the `<QualificationClient>` render. The page already resolves the correct waitlist via `wid` search param (lines 16-24).
- File: `src/app/dashboard/qualification/page.tsx` (28 lines — single-line fix)
- **Status: NOT IMPLEMENTED** — qualification-panel.tsx accepts `waitlistId` and uses it in fetch (component ready), but page.tsx never passes it. The `QualificationClient` at `client.tsx` also doesn't accept or forward `waitlistId`. Two files need changes: `page.tsx` (pass prop) and `client.tsx` (accept + forward prop).

---

### Story 12.4.1 — Wire subscriber_count Increment/Decrement

**Status:** ready
**Story:** As a system, I need the cached `subscriber_count` on the `waitlists` table to stay accurate so that the 500-signup cap check (Epic 13) works correctly.

**Acceptance Criteria (EARS):**

- AC1: After a successful subscriber insert in `POST /api/subscribers`, the system shall increment `waitlists.subscriber_count` by 1 for the target waitlist.
- AC2: After a subscriber is deleted (if any delete path exists), the system shall decrement `waitlists.subscriber_count` by 1.
- AC3: The increment shall use an atomic SQL operation (`UPDATE waitlists SET subscriber_count = subscriber_count + 1 WHERE id = $1`), not a read-modify-write.
- AC4: The increment shall happen AFTER the subscriber insert succeeds, in the same request lifecycle (not deferred to a background job).
- AC5: If the increment fails, the subscriber shall still be created (the count is an optimization, not a constraint). The error shall be logged.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1, AC3-AC5) Add atomic increment after subscriber insert · T2 (AC2) Add decrement on delete (if applicable) · T3 (AC6) Lint + build

**Dev Notes:**

- **Column exists:** `waitlists.subscriber_count integer DEFAULT 0` was created in Story 11.7 schema migration. No new migration needed.
- **Increment location:** `src/app/api/subscribers/route.ts` — after the successful subscriber insert (around line 489-520, after the fire-and-forget email IIFE). The waitlist ID is available as `waitlist_id` from the request body.
- **SQL:** `await supabase.from('waitlists').update({ subscriber_count: (currentCount ?? 0) + 1 }).eq('id', waitlist_id)` or use an RPC function for atomicity: `await supabase.rpc('increment_subscriber_count', { p_waitlist_id: waitlist_id })`.
- **Prefer RPC for atomicity:** If using `update({ subscriber_count: count + 1 })`, there's a race condition with concurrent signups. An RPC function `increment_subscriber_count(p_waitlist_id uuid)` with `UPDATE waitlists SET subscriber_count = subscriber_count + 1 WHERE id = p_waitlist_id` is atomic.
- **Decrement:** Check if any subscriber delete paths exist. The `DELETE /api/waitlist` route cascades to subscribers (foreign key), but doesn't explicitly decrement counts. For MVP, the 500-cap only matters for inserts. Deletions are rare (admin action) and the count will self-correct on next recalculation.
- **No existing RPC function:** Create one if needed: `CREATE OR REPLACE FUNCTION increment_subscriber_count(p_waitlist_id uuid) RETURNS void AS $$ UPDATE waitlists SET subscriber_count = subscriber_count + 1 WHERE id = p_waitlist_id; $$ LANGUAGE sql;`
- **Alternative (simpler):** Use Supabase's `.rpc()` or a direct `UPDATE` with a check. Since signups are low-volume (one founder's waitlist), the race condition is theoretical but correct to handle.
- **Status: NOT IMPLEMENTED** — Zero references to `subscriber_count` exist anywhere in `src/`. The column exists in DB (Story 11.7 migration) but no code reads or writes it. No RPC function exists. `src/app/api/subscribers/route.ts` (837 lines) has no increment logic after insert.

---

### Story 12.4.2 — Expose activeWaitlistId in DashboardContext

**Status:** ready
**Story:** As a dashboard child component, I want to access the active waitlist ID via context so that I don't need to parse URL params or receive it as a prop.

**Acceptance Criteria (EARS):**

- AC1: The `DashboardContext` in `src/app/dashboard/shell.tsx` shall include `activeWaitlistId: string` alongside `tier`.
- AC2: A `useActiveWaitlistId()` hook shall be exported from `shell.tsx` for child components to consume.
- AC3: The `activeWaitlistId` shall update when the user switches waitlists via the sidebar switcher.
- AC4: All existing dashboard pages that currently read `waitlistId` from props or URL params shall be updated to use the context hook (where practical — no need to change pages that already work correctly via `?wid=` URL param).
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Extend DashboardContext + export hook · T2 (AC3) Verify context updates on switch · T3 (AC4) Audit child components for adoption opportunity · T4 (AC5) Lint + build

**Dev Notes:**

- **Current state:** `DashboardContext` at `shell.tsx:16-20` only contains `{ tier: string }`. The `activeWaitlistId` is managed as local state in `DashboardShell` (line 53-87) but not exposed via context.
- **Change:** Extend `DashboardContextValue` to `{ tier: string; activeWaitlistId: string }`. Update the `DashboardContext.Provider` value at line 125 to include `activeWaitlistId`.
- **New hook:** `export function useActiveWaitlistId(): string | null { const ctx = useContext(DashboardContext); return ctx?.activeWaitlistId ?? null; }`
- **Adoption priority:** This is a quality-of-life improvement, not a blocker. Pages that already work via `?wid=` URL param don't need to change. The main beneficiary is any future component that needs the active waitlist ID without prop drilling.
- **Existing `useDashboardTier()` hook:** Already exists at line 22-25. Follow the same pattern for `useActiveWaitlistId()`.
- **Status: NOT IMPLEMENTED** — `DashboardContext` has only `{ tier: string }`. `activeWaitlistId` exists as local state in `DashboardShell` (line 53-82, aliased as `effectiveId`) but is NOT exposed via context. `useDashboardTier()` hook exists (lines 30-33) but no `useActiveWaitlistId()` hook exists. Only `dashboard/client.tsx` consumes `useDashboardTier` — no context consumer accesses `activeWaitlistId`.

---

### Story 12.4.3 — Free-Tier Onboarding Guard

**Status:** ready
**Story:** As a system, I want to prevent free-tier founders from entering the onboarding flow when they already have a waitlist so that they don't get stuck at the API 402 error after completing Steps 1-3.

**Acceptance Criteria (EARS):**

- AC1: When a free-tier founder with ≥1 waitlist navigates to `/onboarding/1`, the system shall redirect them to `/dashboard`.
- AC2: The guard shall check `founder_profiles.tier` and `waitlists` count server-side before rendering the onboarding layout.
- AC3: Pro-tier founders shall not be affected — they can create multiple waitlists.
- AC4: The existing `OnboardingGuard` at `src/components/auth/onboarding-guard.tsx` already has the tier + count check logic (lines 29-37). Verify it works correctly and covers the `/onboarding/1` route specifically.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Verify or fix OnboardingGuard covers all onboarding routes · T2 (AC3) Verify Pro-tier bypass works · T3 (AC4) Test edge case: free user with 0 waitlists can enter onboarding · T4 (AC5) Lint + build

**Dev Notes:**

- **Existing code:** `OnboardingGuard` at `src/components/auth/onboarding-guard.tsx` lines 29-37 already does: if tier=free AND waitlist count > 0, redirect to `/dashboard`. This should already work.
- **Potential gap:** The guard wraps the onboarding layout (`src/app/onboarding/layout.tsx`). If a free user navigates directly to `/onboarding/1` with no waitlist, they should be allowed through (they need to create their first waitlist). The guard only blocks when count > 0.
- **Verify:** Test that the guard correctly handles: (a) free user, 0 waitlists → allowed, (b) free user, 1 waitlist → redirect to /dashboard, (c) pro user, any count → allowed.
- **This may already work.** If so, this story is just verification + adding a test.
- **Status: FULLY IMPLEMENTED** — `OnboardingGuard` at `src/components/auth/onboarding-guard.tsx` (41 lines) checks `tier === "free"` and waitlist count > 0, redirects to `/dashboard`. Wraps onboarding layout at `src/app/onboarding/layout.tsx` lines 27-29. Pro-tier bypass works (only checks `tier === "free"`). Free user with 0 waitlists allowed through. No code changes needed — only test coverage missing.

---

### Story 12.4.4 — Epic 12.4 Tests

**Status:** ready
**Story:** As a developer, I want tests for the pre-Epic 13 gap fixes so that I can verify correctness and prevent regressions.

**Acceptance Criteria (EARS):**

- AC1: The system shall have a test for `POST /api/subscribers` verifying that `subscriber_count` is incremented on the waitlist after a successful insert.
- AC2: The system shall have a test for the qualification page verifying it passes `waitlistId` to the client component.
- AC3: The system shall have a test for `DashboardContext` verifying `activeWaitlistId` is exposed via context.
- AC4: The system shall have a test for the onboarding guard verifying free-tier redirect behavior.
- AC5: Lint and build shall pass with zero errors.
- AC6: Total test count shall increase by at least 4.

**Tasks:** T1 (AC1) subscriber_count increment test · T2 (AC2) Qualification page scoping test · T3 (AC3) DashboardContext test · T4 (AC4) Onboarding guard test · T5 (AC5-AC6) Lint + build + count

**Dev Notes:**

- Test files go in `src/__tests__/api/` for route tests and `src/__tests__/components/` for component tests.
- For the subscriber_count test: mock Supabase, call POST /api/subscribers, verify the update call was made with incremented count.
- For the onboarding guard test: render the guard with mocked Supabase responses for different tier/count combinations, verify redirect behavior.
- **Status: NOT IMPLEMENTED** — No tests exist for subscriber_count increment, qualification page waitlistId passing, DashboardContext activeWaitlistId, or onboarding guard redirect behavior. Existing `dashboard-qualification-page.test.tsx` (36 lines, 2 tests) only tests heading render and subdomain passing — not waitlistId. 54 test files total in `src/__tests__/`.

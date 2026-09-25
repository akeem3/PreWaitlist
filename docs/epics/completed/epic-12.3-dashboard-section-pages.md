# Epic 12.3 — Dashboard Section Pages

**Status:** done
**Source:** [Dashboard Overhaul Plan](../dashboard-overhaul-plan.md), [Sprint Gap Analysis](../sprint-gap-analysis.md)

## Design References

| Reference                | File                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| Dashboard — active state | `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg` |
| Public leaderboard       | `docs/design/High-fidelity-svgs/Leaderboard.svg`                  |

## Goal

Complete the dashboard navigation by building the missing section pages (Leaderboard, Qualification, Warmth), unlocking the Updates page, and extracting the Sidebar into a shared layout. This epic wires up every sidebar nav item to a real page and fixes three navigation bugs: full page reloads on sidebar click, Sidebar disappearing on Broadcast, and Broadcast locked on the Updates page.

## Definition of Done

Every sidebar nav item navigates to a working page without full page reloads. Sidebar persists across all `/dashboard/*` routes via a shared layout. Qualification shows a question-by-question answer breakdown. Leaderboard shows ranked subscribers. Warmth shows detailed distribution and per-subscriber warmth. Updates is unlocked and clickable. No "Coming soon" labels remain. Broadcast is accessible (not locked) for all tiers.

## Story Index

| ID     | Title                                    | Depends on    | Status |
| ------ | ---------------------------------------- | ------------- | ------ |
| 12.3.0 | Unlock Sidebar Nav Items                 | —             | done   |
| 12.3.1 | Dashboard Leaderboard Page               | 12.3.0        | done   |
| 12.3.2 | Dashboard Qualification Page             | 12.3.0        | done   |
| 12.3.3 | Dashboard Warmth Page                    | 12.3.0        | done   |
| 12.3.4 | Epic 12.3 Tests                          | 12.3.0–12.3.3 | done   |
| 12.3.5 | Dashboard Shared Layout & Navigation Fix | 12.3.0–12.3.4 | done   |

Work through these in order. Story 12.3.0 unlocks the sidebar nav items so subsequent stories have somewhere to navigate to. Stories 12.3.1–12.3.3 are independent of each other. Story 12.3.4 is the final test pass. Story 12.3.5 extracts the Sidebar into a shared layout, fixing navigation bugs (full page reloads, Sidebar disappearing on Broadcast, Broadcast locked on Updates).

---

### Story 12.3.0 — Unlock Sidebar Nav Items

**Status:** done
**Story:** As the founder, I want every sidebar nav item to be clickable and navigate to a real page so that the dashboard feels complete.

**Acceptance Criteria (EARS):**

- AC1: The "Updates" nav item shall be clickable (no "Coming soon" label) and navigate to `/dashboard/updates`.
- AC2: The "Qualification" nav item shall be clickable (no "Coming soon" label) and navigate to `/dashboard/qualification`.
- AC3: The "Leaderboard" nav item shall be clickable (no "Coming soon" label) and navigate to `/dashboard/leaderboard`.
- AC4: The "Warmth" nav item shall be clickable for Pro tier and navigate to `/dashboard/warmth`. For Free tier, it shall remain locked with the "Pro feature" tooltip.
- AC5: All four nav items (Updates, Qualification, Leaderboard, Warmth) shall have corresponding route pages that render without errors (even if placeholder content for stories 12.3.1–12.3.3).
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC4) Update sidebar nav items — remove "Coming soon", set hrefs, unlock for appropriate tiers · T2 (AC5) Create placeholder route pages for qualification, leaderboard, warmth · T3 (AC6) Lint + build

**Out of scope:** Full page content (covered by stories 12.3.1–12.3.3).

**Dev Notes:**

- **File:** `components/dashboard/sidebar.tsx`
- Removed `disabled: true` from Qualification, Leaderboard, and Updates nav items
- Removed `locked: true` from Warmth nav item (it's already conditionally locked via the `isLocked` check at line 346: `item.label === "Warmth" && tier === "free"`)
- Set `href` values: Qualification → `/dashboard/qualification`, Leaderboard → `/dashboard/leaderboard`, Warmth → `/dashboard/warmth`
- Removed "Coming soon" labels from the items
- Created stub pages at:
  - `src/app/dashboard/qualification/page.tsx`
  - `src/app/dashboard/leaderboard/page.tsx`
  - `src/app/dashboard/warmth/page.tsx`
- Each stub page: server component with auth check, renders a placeholder with the section heading
- The Warmth page checks tier — redirects Free users to `/dashboard`
- **Note:** These stub pages were later superseded by the full implementations in stories 12.3.1–12.3.3, which reuse the same routes

---

### Story 12.3.1 — Dashboard Leaderboard Page

**Status:** done
**Story:** As the founder, I want to see a ranked leaderboard of my subscribers sorted by referral count so that I can identify my most engaged advocates.

**Acceptance Criteria (EARS):**

- AC1: The page shall display at `/dashboard/leaderboard` with a "Leaderboard" heading.
- AC2: The page shall show a table with columns: Rank, Email (anonymized), Referrals, Quality Score, Signup Date.
- AC3: Subscribers shall be ranked by referral count (descending), with ties broken by signup date (earlier = higher rank).
- AC4: The quality score column shall show the subscriber's `quality_score` value (or "—" if null).
- AC5: The table shall be paginated with 10 rows per page and prev/next navigation.
- AC6: The page shall show a total subscriber count ("Showing 1–10 of 42 subscribers").
- AC7: When the waitlist has zero subscribers, the page shall show an empty state: "No subscribers yet. Share your waitlist to get started."
- AC8: The page shall reuse the Sidebar component and match the dashboard layout (left sidebar + main content).
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Create leaderboard page with server-side data fetch + ranking · T2 (AC4-AC6) Quality score column + pagination · T3 (AC7) Empty state · T4 (AC8) Layout + sidebar · T5 (AC9) Lint + build

**Out of scope:** CSV export (already exists on subscriber table), search/filter (not needed for leaderboard view).

**Dev Notes:**

- **Files created:**
  - `src/app/dashboard/leaderboard/page.tsx` (server component)
  - `src/app/dashboard/leaderboard/client.tsx` (client component)
- Server component: auth check + waitlist fetch, subscribers with `referral_code` and `created_at`, batch referral count query, quality scores, rank by `referral_count DESC, created_at ASC`
- Client component: table with columns `[80px_1fr_100px_120px_140px]` (Rank, Email, Referrals, Quality, Date), pagination (10/page), "Showing X–Y of Z" counter
- Anonymized emails via `anonymizeEmail` from `@/lib/format`
- Empty state: "No subscribers yet. Share your waitlist to get started."
- **Post-12.3.5:** Sidebar removed from client component — layout provides it via `DashboardShell`. Props simplified to remove `waitlistName`/`logoUrl` (layout handles these). Page passes only `rows`, `totalCount` to client.

---

### Story 12.3.2 — Dashboard Qualification Page

**Status:** done
**Story:** As the founder, I want to see a detailed breakdown of how subscribers answered my qualification questions so that I understand my audience.

**Acceptance Criteria (EARS):**

- AC1: The page shall display at `/dashboard/qualification` with a "Qualification" heading.
- AC2: The page shall show each qualification question as a separate card.
- AC3: Each question card shall display: the question text, a horizontal bar chart showing answer distribution (answer text + count + percentage), and total number of respondents for that question.
- AC4: Questions with zero responses shall show "No responses yet" instead of the bar chart.
- AC5: When no qualification questions are configured, the page shall show: "No qualification questions configured. Add questions during onboarding to collect subscriber data."
- AC6: The page shall reuse the Sidebar component and match the dashboard layout.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Create qualification page with server-side data fetch · T2 (AC4-AC5) Empty states · T3 (AC6) Layout + sidebar · T4 (AC7) Lint + build

**Out of scope:** Editing qualification questions after onboarding (covered by Epic 12.2 Story 12.2.2).

**Dev Notes:**

- **Files created:**
  - `src/app/dashboard/qualification/page.tsx` (server component)
  - `src/app/dashboard/qualification/client.tsx` (client component)
- Server component: auth check + waitlist fetch, fetches qualification questions via `GET /api/dashboard/qualification`, passes `subdomain` to client
- Client component: renders `QualificationPanel` component with `subdomain` prop. QualificationPanel fetches from `/api/dashboard/qualification` and renders bar charts
- Data shape: `{ questions: [{ question: string, answers: [{ value, count }] }] }`
- Empty states: zero questions → "No qualification questions configured…", zero responses per question → "No responses yet"
- **Post-12.3.5:** Sidebar removed from client component — layout provides it via `DashboardShell`. Props simplified to `subdomain` only.

---

### Story 12.3.3 — Dashboard Warmth Page

**Status:** done
**Story:** As the founder, I want a dedicated warmth page showing detailed distribution and per-subscriber warmth scores so that I can analyze list engagement beyond the overview panel.

**Acceptance Criteria (EARS):**

- AC1: The page shall display at `/dashboard/warmth` with a "Warmth" heading.
- AC2: The page shall show a summary row: total subscribers, count per tier (~~Hot/Warm/Cold/Unscored~~ Hot/Warm/Cold), and the cold percentage. **[AMENDED 2026-09-25 — warmth restructure: Unscored removed]**
- AC3: The page shall show a subscriber table with columns: Email, Warmth Tier (badge), Last Engagement (date or "Never"), Referrals.
- AC4: The table shall be sortable by warmth tier and referral count.
- AC5: The table shall include a warmth filter dropdown (~~All, Hot, Warm, Cold, Unscored~~ All, Hot, Warm, Cold) — same as the overview subscriber table. **[AMENDED 2026-09-25 — warmth restructure: Unscored removed]**
- AC6: The page shall be gated to Pro tier only — Free users shall see a locked overlay with "Upgrade to Pro to view warmth details."
- AC7: When the waitlist has zero subscribers, the page shall show: "No subscribers yet. Warmth data will appear once people join your waitlist."
- AC8: The page shall reuse the Sidebar component and match the dashboard layout.
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Create warmth page with summary stats · T2 (AC3-AC5) Subscriber warmth table with sort + filter · T3 (AC6) Pro tier gate · T4 (AC7) Empty state · T5 (AC8) Layout + sidebar · T6 (AC9) Lint + build

**Out of scope:** Warmth trend charts (post-MVP), real-time score updates (daily batch is sufficient), warmth decay visualization.

**Dev Notes:**

- **Files created:**
  - `src/app/dashboard/warmth/page.tsx` (server component)
  - `src/app/dashboard/warmth/client.tsx` (client component)
- Server component: auth check + waitlist fetch, tier check (redirect Free users to `/dashboard`), subscribers with `warmth_score` and `created_at`, warmth distribution computation
- Client component: summary row (total, ~~Hot/Warm/Cold/Unscored~~ Hot/Warm/Cold counts, cold %), subscriber table with columns (Email, Warmth, Last Engagement, Referrals), filter dropdown (All/Hot/Warm/Cold), sort by warmth tier + referrals, pagination
- Tier gate: `tier === "free"` renders locked overlay with "Upgrade to Pro to view warmth details."
- Badge colors (matching Story 11.2 ~~as originally written~~ as amended 2026-09-25): Hot = `bg-status-hot text-white`, Warm = `bg-status-warm text-white`, Cold = `bg-status-cold text-white` (~~Unscored = `bg-muted text-muted-foreground`~~ Unscored removed — warmth restructure)
- Empty state: "No subscribers yet. Warmth data will appear once people join your waitlist."
- **Post-12.3.5:** Sidebar removed from client component — layout provides it via `DashboardShell`. Props simplified to `subscribers`, `warmthSummary`, `tier` only (removed `waitlistName`, `logoUrl`).

---

### Story 12.3.4 — Epic 12.3 Tests

**Status:** done
**Story:** As the developer, I want comprehensive tests for the new dashboard section pages so that navigation, data display, and tier gating work correctly.

**Acceptance Criteria (EARS):**

- AC1: The system shall have component tests for the leaderboard page covering: renders ranked subscribers, pagination works, empty state, quality score display.
- AC2: The system shall have component tests for the qualification page covering: renders question cards, bar chart distribution, empty states (no questions, no responses).
- AC3: The system shall have component tests for the warmth page covering: summary stats, subscriber warmth table, tier gate (locked for Free), empty state.
- AC4: The system shall have tests for sidebar nav item unlocking: all items clickable, correct hrefs, Warmth locked for Free.
- AC5: All tests shall pass with `pnpm test`.
- AC6: Lint and build shall pass with zero errors.
- AC7: Total test count across the project shall be ≥280.

**Tasks:** T1 (AC1) Leaderboard page tests · T2 (AC2) Qualification page tests · T3 (AC3) Warmth page tests · T4 (AC4) Sidebar unlock tests · T5 (AC5-AC7) Full verification

**Out of scope:** E2E navigation tests, API route tests (already covered by existing tests).

**Dev Notes:**

- **Test files created/updated:**
  - `src/__tests__/components/dashboard-leaderboard-page.test.tsx` (new)
  - `src/__tests__/components/dashboard-qualification-page.test.tsx` (new)
  - `src/__tests__/components/dashboard-warmth-page.test.tsx` (new)
  - `src/__tests__/components/dashboard-sidebar-redesign.test.tsx` (updated)
- Mocked `next/navigation` (usePathname, useRouter), `next/image`, `next/link` per existing patterns
- Used `@testing-library/react` + `@testing-library/user-event`
- Sidebar unlock tests: verified href attributes on nav items, Warmth locked for free, unlocked for pro
- **Post-12.3.5:** Tests simplified — removed Sidebar-specific assertions, removed `waitlistName`/`logoUrl` from client component props, removed supabase mocks where layout now handles auth. Updated leaderboard, qualification, and warmth test files.

---

### Story 12.3.5 — Dashboard Shared Layout & Navigation Fix

**Status:** done
**Story:** As the developer, I want the Sidebar, hamburger menu, and sign-out logic extracted into a shared dashboard layout so that navigation persists across routes without full page reloads, and the Sidebar is consistent on every page.

**Acceptance Criteria (EARS):**

- AC1: The Sidebar shall be rendered exactly once per `/dashboard/*` route via a shared layout, not by individual section client components.
- AC2: Clicking a sidebar nav item shall navigate via client-side routing (no full page reload). The URL changes, the Sidebar stays mounted, only the content area swaps.
- AC3: The Sidebar shall appear on the Broadcast page (`/dashboard/broadcast`) without requiring `broadcast/client.tsx` to render it.
- AC4: The Sidebar shall receive the correct `tier` value on every page — including Updates (`/dashboard/updates`) — so that Broadcast and Warmth lock states are accurate.
- AC5: `waitlistName` and `logoUrl` shall be fetched in the layout and passed through `DashboardShell`, not fetched independently by each section client.
- AC6: The `loading.tsx` skeleton shall not render a duplicate Sidebar.
- AC7: All section client components (client.tsx, leaderboard/client.tsx, qualification/client.tsx, warmth/client.tsx, updates/client.tsx, settings/client.tsx, broadcast/client.tsx) shall NOT render Sidebar, hamburger, or sign-out logic.
- AC8: Lint, build, and all existing tests shall pass.

**Tasks:** T1 (AC1-AC2) Create `layout.tsx` + `shell.tsx` · T2 (AC3-AC4) Verify Broadcast + Updates tier flow · T3 (AC5) Remove `waitlistName`/`logoUrl` from section props · T4 (AC6) Fix `loading.tsx` · T5 (AC7) Strip Sidebar from all section clients · T6 (AC8) Update tests + lint + build

**Out of scope:** Eliminating redundant auth/data fetches across layout + individual pages (layout fetches auth/waitlist/tier, each page also fetches — wasteful but not broken).

**Bugs Fixed:**

1. **Full page reloads on sidebar click:** Each section client rendered its own `<Sidebar>` + `<main>` wrapper. Clicking a sidebar link caused a full server roundtrip because the Sidebar unmounted and remounted. Fix: shared layout keeps Sidebar mounted; only children swap.
2. **Sidebar disappears on Broadcast:** `broadcast/client.tsx` never rendered Sidebar — it only rendered a centered card. Fix: layout provides Sidebar to all routes including broadcast.
3. **Broadcast locked on Updates:** `updates/client.tsx` rendered `<Sidebar>` without `tier` prop (defaulted to `"free"`), so Broadcast was always locked. Fix: layout always passes the correct tier.

**Dev Notes:**

- **New files:**
  - `src/app/dashboard/layout.tsx` — server component. Fetches auth (user), waitlist (`id, subdomain, product_name, logo_url`), and profile (`tier`) from Supabase. Renders `<DashboardShell>` with `{children}`.
  - `src/app/dashboard/shell.tsx` — client component. Accepts `{ children, waitlistName, logoUrl, tier }`. Renders `<Sidebar>`, hamburger button (mobile), and `<main className="min-h-screen lg:ml-67">{children}</main>`. Handles `isSidebarOpen` state and `handleSignOut`.
- **Modified files (Sidebar stripped):**
  - `src/app/dashboard/client.tsx` — removed Sidebar, hamburger, isSidebarOpen, handleSignOut, createClient import
  - `src/app/dashboard/leaderboard/client.tsx` — removed Sidebar, hamburger, isSidebarOpen, handleSignOut
  - `src/app/dashboard/qualification/client.tsx` — removed Sidebar, hamburger, isSidebarOpen, handleSignOut
  - `src/app/dashboard/warmth/client.tsx` — removed Sidebar, hamburger, isSidebarOpen, handleSignOut (kept `tier` prop for lock overlay)
  - `src/app/dashboard/updates/client.tsx` — removed Sidebar, hamburger, isSidebarOpen, handleSignOut, createClient import (was root cause of bug #3)
  - `src/app/dashboard/settings/client.tsx` — removed Sidebar, hamburger, isSidebarOpen, handleSignOut, createClient import
- **Modified files (props simplified):**
  - `src/app/dashboard/page.tsx` — removed `waitlistName`, `logoUrl` from DashboardClient props
  - `src/app/dashboard/leaderboard/page.tsx` — removed `waitlistName`, `logoUrl` from LeaderboardClient props
  - `src/app/dashboard/qualification/page.tsx` — removed `waitlistName`, `logoUrl` from QualificationClient props
  - `src/app/dashboard/warmth/page.tsx` — removed `waitlistName`, `logoUrl` from WarmthClient props
  - `src/app/dashboard/updates/page.tsx` — removed `waitlistName`, `logoUrl` from client props
  - `src/app/dashboard/settings/page.tsx` — removed `waitlistName`, `logoUrl` from client props
- **Fixed file:**
  - `src/app/dashboard/loading.tsx` — removed embedded sidebar skeleton + `<main>` wrapper. Now renders only a content-area skeleton (no double-sidebar during loading).
- **Tests updated:**
  - `src/__tests__/components/dashboard-qualification-page.test.tsx` — removed Sidebar/supabase mocks, simplified props
  - `src/__tests__/components/dashboard-warmth-page.test.tsx` — removed `waitlistName`/`logoUrl` from props
  - `src/__tests__/components/dashboard-leaderboard-page.test.tsx` — removed `waitlistName`/`logoUrl`/`tier` from props, removed supabase mock
- **Architecture pattern:** Next.js App Router layout persists across route navigations. The layout at `src/app/dashboard/layout.tsx` wraps all `/dashboard/*` children in `<DashboardShell>`. When a user clicks a sidebar link, Next.js swaps only the `children` (page content) while the layout (Sidebar + hamburger + sign-out) stays mounted. This eliminates full page reloads.
- **Auth pattern note:** Each page still does its own auth + data fetch (redundant with layout). This is harmless but wasteful — could be optimized by passing data from layout to children via `React.use()` or context. Not in scope for this story.

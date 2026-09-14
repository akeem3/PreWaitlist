# Epic 12.3 — Dashboard Section Pages

**Status:** ready
**Source:** [Dashboard Overhaul Plan](../dashboard-overhaul-plan.md), [Sprint Gap Analysis](../sprint-gap-analysis.md)

## Design References

| Reference                | File                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| Dashboard — active state | `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg` |
| Public leaderboard       | `docs/design/High-fidelity-svgs/Leaderboard.svg`                  |

## Goal

Complete the dashboard navigation by building the missing section pages (Leaderboard, Qualification, Warmth) and unlocking the Updates page. Currently, the sidebar shows "Coming soon" on Qualification, Leaderboard, and Updates — even though Updates and Qualification already have components built. This epic wires up every sidebar nav item to a real page so the dashboard is a complete command center, not just an overview.

## Definition of Done

Every sidebar nav item navigates to a working page. Qualification shows a question-by-question answer breakdown. Leaderboard shows ranked subscribers. Warmth shows detailed distribution and per-subscriber warmth. Updates is unlocked and clickable. No "Coming soon" labels remain on any nav item.

## Story Index

| ID     | Title                        | Depends on    | Status |
| ------ | ---------------------------- | ------------- | ------ |
| 12.3.0 | Unlock Sidebar Nav Items     | —             | ready  |
| 12.3.1 | Dashboard Leaderboard Page   | 12.3.0        | ready  |
| 12.3.2 | Dashboard Qualification Page | 12.3.0        | ready  |
| 12.3.3 | Dashboard Warmth Page        | 12.3.0        | ready  |
| 12.3.4 | Epic 12.3 Tests              | 12.3.0–12.3.3 | ready  |

Work through these in order. Story 12.3.0 unlocks the sidebar nav items so subsequent stories have somewhere to navigate to. Stories 12.3.1–12.3.3 are independent of each other. Story 12.3.4 is the final test pass.

---

### Story 12.3.0 — Unlock Sidebar Nav Items

**Status:** ready
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
- Remove `disabled: true` from Qualification, Leaderboard, and Updates nav items
- Remove `locked: true` from Warmth nav item (it's already conditionally locked via the `isLocked` check at line 346: `item.label === "Warmth" && tier === "free"`)
- Set `href` values: Qualification → `/dashboard/qualification`, Leaderboard → `/dashboard/leaderboard`, Warmth → `/dashboard/warmth`
- Remove "Coming soon" labels from the items
- Create stub pages at:
  - `src/app/dashboard/qualification/page.tsx`
  - `src/app/dashboard/leaderboard/page.tsx`
  - `src/app/dashboard/warmth/page.tsx`
- Each stub page: server component with auth check, renders a placeholder with the section heading
- The Warmth page should check tier — redirect Free users to `/dashboard`

---

### Story 12.3.1 — Dashboard Leaderboard Page

**Status:** ready
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

- Create `src/app/dashboard/leaderboard/page.tsx` (server component)
- Reuse the ranking logic from `src/app/(public)/[subdomain]/leaderboard/page.tsx` (lines 30-60) — same `referral_count DESC, created_at ASC` ordering
- Anonymize emails using `anonymizeEmail` from `src/lib/format.ts`
- Quality score: already computed in `src/app/dashboard/page.tsx` (lines 75-81) — `Math.round((s.referral_count / totalReferrals) * 100)`
- Client component: `src/app/dashboard/leaderboard/client.tsx`
- Reuse pagination pattern from public leaderboard's `LeaderboardClient`
- Table columns: `[60px_1fr_100px_100px_120px]` (Rank, Email, Referrals, Quality, Date)

---

### Story 12.3.2 — Dashboard Qualification Page

**Status:** ready
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

- Create `src/app/dashboard/qualification/page.tsx` (server component)
- The `QualificationPanel` component (`components/dashboard/qualification-panel.tsx`) already fetches from `/api/dashboard/qualification` and renders bar charts — either reuse it directly or extract its rendering logic into the new page
- Since `QualificationPanel` is a client component that fetches its own data, the simplest approach is to render it inside the new page with the same `subdomain` prop
- Data source: `GET /api/dashboard/qualification` returns `{ questions: [{ question: string, answers: [{ value, count }] }] }`
- Bar chart colors: use `bg-accent` for bars, matching the existing panel design

---

### Story 12.3.3 — Dashboard Warmth Page

**Status:** ready
**Story:** As the founder, I want a dedicated warmth page showing detailed distribution and per-subscriber warmth scores so that I can analyze list engagement beyond the overview panel.

**Acceptance Criteria (EARS):**

- AC1: The page shall display at `/dashboard/warmth` with a "Warmth" heading.
- AC2: The page shall show a summary row: total subscribers, count per tier (Hot/Warm/Cold/Unscored), and the cold percentage.
- AC3: The page shall show a subscriber table with columns: Email, Warmth Tier (badge), Last Engagement (date or "Never"), Referrals.
- AC4: The table shall be sortable by warmth tier and referral count.
- AC5: The table shall include a warmth filter dropdown (All, Hot, Warm, Cold, Unscored) — same as the overview subscriber table.
- AC6: The page shall be gated to Pro tier only — Free users shall see a locked overlay with "Upgrade to Pro to view warmth details."
- AC7: When the waitlist has zero subscribers, the page shall show: "No subscribers yet. Warmth data will appear once people join your waitlist."
- AC8: The page shall reuse the Sidebar component and match the dashboard layout.
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Create warmth page with summary stats · T2 (AC3-AC5) Subscriber warmth table with sort + filter · T3 (AC6) Pro tier gate · T4 (AC7) Empty state · T5 (AC8) Layout + sidebar · T6 (AC9) Lint + build

**Out of scope:** Warmth trend charts (post-MVP), real-time score updates (daily batch is sufficient), warmth decay visualization.

**Dev Notes:**

- Create `src/app/dashboard/warmth/page.tsx` (server component)
- Data source: `GET /api/dashboard/warmth` for summary, subscriber list with `warmth_score` column for the table
- The `WarmthPanel` component already has the bar chart rendering — can be reused for the summary section
- The subscriber table can reuse patterns from `src/app/dashboard/client.tsx` (sort, filter, pagination)
- Tier gate: check `tier` from `founder_profiles` — if "free", render locked overlay (same pattern as WarmthPanel)
- Warmth badge colors: Hot = `bg-accent/10 text-accent`, Warm = `bg-warning/10 text-warning`, Cold = `bg-info/10 text-info`, Unscored = `bg-muted text-muted-foreground` (matching Story 11.2 badge colors)
- "Last Engagement" column: query `email_events` for MAX(created_at) per subscriber, or show "Never" if no events

---

### Story 12.3.4 — Epic 12.3 Tests

**Status:** ready
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

- Mock `next/navigation` (usePathname, useRouter) in all tests
- Mock `next/image` and `next/link` per existing test patterns
- Use `@testing-library/react` + `@testing-library/user-event`
- Test files: `src/__tests__/components/dashboard-leaderboard.test.tsx`, `dashboard-qualification.test.tsx`, `dashboard-warmth.test.tsx`
- Existing sidebar tests (`dashboard-sidebar-redesign.test.tsx`) need updates: add tests for unlocked nav items with correct hrefs
- For warmth tier gate test: render with `tier="free"` and verify locked overlay appears

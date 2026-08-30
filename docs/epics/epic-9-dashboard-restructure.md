# Epic 9 — Dashboard Restructure

**Status:** ready
**Source:** [PRD S2a Sprint 2](../PRD.md#2a-sprint-2--public-page-dashboard-active), [PRD S7.5 Route/Handler List](../PRD.md#75-route--handler-list), [PRD S7.6 Component Tree](../PRD.md#76-component-tree-high-level)

## Design References

| Reference                | File                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| Dashboard — empty state  | `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg`  |
| Dashboard — active state | `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg` |

## Goal

Restructure the founder dashboard from a top-tab layout to a left-sidebar navigation pattern matching the Sprint 2 design spec. The dashboard provides founders with real subscriber data, CSV export, and a subscriber detail view.

## Definition of Done

The dashboard displays a persistent left sidebar with navigation (Overview, Subscribers, Broadcasts, Settings). The main content area shows stat cards with real subscriber counts, a subscriber table with search and sorting, and a CSV export button for Pro tier founders. The subscriber detail page shows individual subscriber information, qualification answers, and referral chain.

## Story Index

| ID  | Title                             | Depends on | Status | Story File                                                  |
| --- | --------------------------------- | ---------- | ------ | ----------------------------------------------------------- |
| 9.0 | Dashboard Layout Shell            | —          | ready  | [story-9.0](../stories/story-9.0-dashboard-layout-shell.md) |
| 9.1 | Stat Cards with Real Data         | 9.0        | ready  | [story-9.1](../stories/story-9.1-stat-cards.md)             |
| 9.2 | Subscriber Table Design Alignment | 9.0        | ready  | [story-9.2](../stories/story-9.2-subscriber-table.md)       |
| 9.3 | CSV Export (Pro Tier)             | 9.2        | ready  | [story-9.3](../stories/story-9.3-csv-export.md)             |
| 9.4 | Subscriber Detail Page            | 9.2        | ready  | [story-9.4](../stories/story-9.4-subscriber-detail.md)      |
| 9.5 | Epic 9 Tests                      | 9.0–9.4    | ready  | [story-9.5](../stories/story-9.5-epic9-tests.md)            |

Work through these in dependency order, one at a time. Story 9.0 must be complete before 9.1 and 9.2 begin. Story 9.2 must be complete before 9.3 and 9.4 begin. Story 9.5 must be the last story — it tests everything built in 9.0–9.4.

---

### Story 9.0 — Dashboard Layout Shell

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg`, `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`

**Story:** As a founder, I want the dashboard to use a left-sidebar navigation layout so that I can easily navigate between dashboard sections.

**Acceptance Criteria (EARS):**

- AC1: The dashboard shall render a persistent left sidebar with a width of 268px.
- AC2: The sidebar shall display the PreWaitlist logo and waitlist name at the top.
- AC3: The sidebar shall display navigation items: Overview, Subscribers, Broadcasts (placeholder), Settings (placeholder).
- AC4: The Overview and Subscribers items shall be clickable links. Broadcasts and Settings shall be visually present but disabled (grayed out, no hover effect).
- AC5: The main content area shall have a background color of `#FAF8F4` (warm ivory).
- AC6: The sidebar shall collapse to a hamburger menu on mobile viewports (≤768px).
- AC7: The active navigation item shall be visually highlighted (bold text, accent color indicator).
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Create sidebar component + navigation items · T2 (AC4) Disabled state for placeholder items · T3 (AC5-AC6) Main content area + mobile responsive · T4 (AC7) Active state highlighting · T5 (AC8) Lint + build

**Out of scope:** Sidebar sign-out button (keep existing header sign-out), sidebar search/filter (Story 9.2), sidebar subscriber list (Story 9.2).

**Dev Notes:**

- T1: Create `components/dashboard/sidebar.tsx`. Use existing design system tokens. Logo: `public/PreWaitlist-logo.svg` or fallback icon. Sidebar bg: `#FCFCFB` (from design SVG — design-analysis.md confirmed this provides visual distinction). Nav items: `text-body-sm`, inactive: `text-muted-foreground`, active: `text-foreground font-semibold`. **Status: not started — `components/dashboard/` directory does not exist. Current `NAV_TABS` in `client.tsx:24-29` has the nav structure but renders as top tabs.**
- T2: Disabled items: `opacity-50 cursor-not-allowed`. No hover effect. No `href` attribute. **Status: not started — current all 4 tabs are clickable links to `/dashboard` (`client.tsx:189-203`).**
- T3: Main content area: `ml-[268px]` on desktop, full-width on mobile. Use `@media (max-width: 768px)` or Tailwind responsive classes. **Status: not started — current dashboard uses top tabs (`client.tsx:104-204`), will need full restructure. Main content bg already correct (`bg-background` = `#FAF8F4`).**
- T4: Active item: Left border accent (`border-l-2 border-accent`), bold text, `bg-accent/5` background. **Status: not started — current nav tabs have basic active state (`client.tsx:193-197`: bold text only), will be replaced.**

**Scope note:** Current dashboard has 5 extra sections not in Epic 9 scope: Getting-started checklist (`client.tsx:281-331`), Chart placeholder (`client.tsx:333-338`), Qualification breakdown panel (`client.tsx:341-357`), Warmth distribution panel (`client.tsx:341-357`), Share prompt card (`client.tsx:269-279`). These may be removed or restructured during Story 9.0 but are not explicitly in scope.

---

### Story 9.1 — Stat Cards with Real Data

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg`, `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`

**Story:** As a founder, I want to see real subscriber statistics in my dashboard so that I can track my waitlist performance.

**Acceptance Criteria (EARS):**

- AC1: The dashboard shall display 4 stat cards: Total Signups, Referrals, Hot, Warm. (Note: design SVG shows "Page Views" and "Heat Score" labels — follow PRD data model: Hot = warmth_score='hot' count, Warm = warmth_score='warm' count.)
- AC2: The Total Signups card shall show the actual subscriber count for the founder's waitlist.
- AC3: The Referrals card shall show the percentage of subscribers who were referred (referred_count / total_count × 100).
- AC4: The Hot and Warm cards shall show the count of subscribers with `warmth_score` of 'hot' and 'warm' respectively.
- AC5: When no data exists (empty waitlist), stat cards shall display em-dashes (—) instead of 0.
- AC6: Stat cards shall be styled with white background (`bg-card`), rounded corners (`rounded-[var(--card-radius)]`), and border (`border-border`). (Note: design SVG shows green background (`bg-accent`) for stat cards. Verify with design during implementation.)
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Total Signups card with real data · T2 (AC3) Referrals percentage card · T3 (AC4) Hot/Warm warmth cards · T4 (AC5) Empty state em-dash rendering · T5 (AC6-AC7) Styling + lint

**Out of scope:** Cold/Unscored stat cards (not in design SVG), chart/signups-over-time (placeholder), qualification breakdown panel (not in Sprint 2 scope).

**Dev Notes:**

- T1: In `src/app/dashboard/page.tsx`, query `subscribers` table with `waitlist_id` matching founder's waitlist. Count rows. Pass count to client component. **Status: not started — current `page.tsx:28-32` queries subscribers (id, email, position, created_at) but doesn't count them separately; `client.tsx:251` shows hardcoded `"— —"`. Need to add count query or derive from array length.**
- T2: Calculate referral percentage: `(count where referrer_id IS NOT NULL) / total_count * 100`. Handle division by zero (show em-dash). **Status: not started — `client.tsx:252` shows hardcoded `"—%"`. Referral counts are computed in `page.tsx:36-51` but only per-subscriber, not total.**
- T3: `warmth_score` column exists on subscribers table (added in Story 7.6 migration). Query: `SELECT warmth_score, COUNT(*) FROM subscribers WHERE waitlist_id = $1 GROUP BY warmth_score`. **Status: schema exists (`subscribers.warmth_score`), API route queries it (`src/app/api/warmth/[subdomain]/route.ts:22-29`), but `page.tsx` does NOT select `warmth_score` — need to add to query at `page.tsx:30`. Dashboard does not display warmth data — `client.tsx:253-255` shows hardcoded `"—"`.**
- T4: In client component: `if (count === 0 || count === undefined) return "—"`. Never render "0". **Status: not started — current implementation always shows em-dash regardless of data (`client.tsx:251-255`). Need conditional rendering.**
- T5: Use existing design system tokens. Card radius: `var(--card-radius)`. Text: `text-h3` for value, `text-caption` for label. **Status: tokens exist in `client.tsx:259-266` — `text-h3` and `text-caption` classes used, `bg-card`, `rounded-[var(--card-radius)]`, `border-border` applied. Note: design shows green bg (`bg-accent`) for stat cards, not white (`bg-card`). Verify with design.**

**Current dashboard has 5 stat cards** (`client.tsx:250-256`: total signups, referral, hot, warm, cold). Design SVG shows 4 cards. Story should align with design (4 cards: Total Signups, Referrals, Hot, Warm) — remove "cold" card.

---

### Story 9.2 — Subscriber Table Design Alignment

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg`, `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`

**Story:** As a founder, I want a properly designed subscriber table with search and sorting so that I can manage my subscribers effectively.

**Acceptance Criteria (EARS):**

- AC1: The subscriber table shall display columns: Position, Email, Referrals, Date. (Note: design SVG shows column order as #, Email, Date, Referrals — follow design order.)
- AC2: The table shall include a search input above the table that filters subscribers by email.
- AC3: The table shall sort by position (default) and referral count (click column header to toggle).
- AC4: Each row shall be clickable, navigating to `/dashboard/subscribers/:id`.
- AC5: The empty state shall display "No subscribers yet. Share your link to get started."
- AC6: The table shall display the total subscriber count above the table (e.g., "12 subscribers").
- AC7: The table shall be styled with white background (`bg-card`), rounded corners, and border.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Table columns + search input · T2 (AC3) Sort by position/referrals · T3 (AC4) Row click navigation · T4 (AC5-AC6) Empty state + subscriber count · T5 (AC7-AC8) Styling + lint

**Out of scope:** Warmth column (not in design SVG), name column (subscribers don't have names), bulk actions (select/delete), pagination (Sprint 2 shows all subscribers).

**Dev Notes:**

- T1: Search input: `input type="text"` with placeholder "Search by email". Filter: `subscribers.filter(s => s.email.includes(searchQuery))`. Use `useState` for search query. **Status: not started — no search functionality exists. Design shows search input at top of main content area (`design-analysis.md:1050`).**
- T2: Sort state: `useState<"position" | "referral_count">("position")`. Click header toggles sort direction. **Status: partially exists — sorting works on position and referral_count (`client.tsx:65-91`), but default is `referral_count` (`client.tsx:66`), not `position`. Need to change default.**
- T3: `router.push(`/dashboard/subscribers/${sub.id}`)` on row click. Add `cursor-pointer` to rows. **Status: not started — rows are not clickable (`client.tsx:393-419`). No `router.push` on row click.**
- T4: Empty state: centered message with `text-muted-foreground`. Count: "X subscribers" above table. **Status: empty state exists (`client.tsx:421-427`), but subscriber count is not displayed. Need to add count display.**
- T5: Reuse existing table styling from current dashboard. **Status: styling exists (`client.tsx:360-428`) — uses `bg-card`, `rounded-[var(--card-radius)]`, `border-border`. Will need column adjustments (remove Name and Warmth columns per design).**

**Current table has 6 columns** (`client.tsx:49-56`: Name, Email, Position, Warmth, Referrals, Date). Design SVG shows 4 columns (#, Email, Date, Referrals). Story should remove Name and Warmth columns. Note: design column order is #, Email, Date, Referrals (not Position, Email, Referrals, Date as AC1 states). Follow design order.

---

### Story 9.3 — CSV Export (Pro Tier)

**Status:** ready
**Design Refs:** — (no UI — API endpoint + button)

**Story:** As a Pro tier founder, I want to export my subscriber data as a CSV file so that I can analyze it in spreadsheet software.

**Acceptance Criteria (EARS):**

- AC1: The dashboard shall display a "Export CSV" button when the founder's tier is Pro.
- AC2: The button shall not render when tier is Free.
- AC3: Clicking the button shall download a CSV file containing: position, email, referral_code, referral_count, warmth_score, created_at.
- AC4: The CSV file shall be named `subscribers-{subdomain}-{YYYY-MM-DD}.csv`.
- AC5: The API endpoint shall return 403 if tier is not Pro.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Conditional button render based on tier · T2 (AC3-AC4) CSV generation + download · T3 (AC5) API route with tier check · T4 (AC6) Lint + build

**Out of scope:** CSV export for Free tier (upsell opportunity), custom column selection, filtered export (Sprint 2 exports all).

**Dev Notes:**

- T1: Pass `tier` from server component (query `waitlists.tier` column). Conditionally render button: `{tier === "pro" && <button>Export CSV</button>}`. **Status: not started — `page.tsx:17-18` queries `waitlists` but selects `id, headline, subdomain, template, status, logo_url` — does NOT select `tier`. Need to add `tier` to select.**
- T2: Client-side CSV generation: convert subscriber array to CSV string, create Blob, trigger download via `URL.createObjectURL`. Use `new Date().toISOString().split("T")[0]` for date. **Status: not started.**
- T3: `GET /api/subscribers/export?waitlist_id=xxx` — check tier, query subscribers, return CSV with `Content-Type: text/csv` header. **Status: not started — no export API route exists. Existing API routes: `POST /api/subscribers` (create), `GET /api/subscribers/[id]` (read), `GET /api/subscribers/[id]/referrals` (read referrals).**
- T4: Button styling: `btn-secondary` variant, small size. Position: top-right of table area. **Status: not started.**

---

### Story 9.4 — Subscriber Detail Page

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`

**Story:** As a founder, I want to view detailed information about an individual subscriber so that I can understand their engagement and referral impact.

**Acceptance Criteria (EARS):**

- AC1: The system shall render `/dashboard/subscribers/:id` as a protected route (requires auth).
- AC2: The page shall display the subscriber's position, email, and signup date.
- AC3: The page shall display the subscriber's referral count and list of referred subscribers (if any).
- AC4: The page shall display the subscriber's qualification answers (if any questions were asked).
- AC5: The page shall include a back button returning to `/dashboard`.
- AC6: The page shall display "Subscriber not found" if the ID doesn't belong to the founder's waitlist.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Route + auth check + subscriber info · T2 (AC3) Referral data display · T3 (AC4) Qualification answers display · T4 (AC5-AC6) Back button + not found state · T5 (AC7) Lint + build

**Out of scope:** Position history (Sprint 2 doesn't track changes), warmth score display (not in design SVG), edit subscriber (founders don't edit subscribers).

**Dev Notes:**

- T1: Create `src/app/dashboard/subscribers/[id]/page.tsx`. Server component: check auth, query subscriber by ID + waitlist_id (RLS enforced). Display: position (large), email, signup date. **Status: not started — `src/app/dashboard/subscribers/` directory does not exist. However, API routes exist: `GET /api/subscribers/[id]` (`src/app/api/subscribers/[id]/route.ts`) and `GET /api/subscribers/[id]/referrals` (`src/app/api/subscribers/[id]/referrals/route.ts`). Can reuse query logic.**
- T2: Query `subscribers` where `referrer_id = this_subscriber.id`. Display count + list of referred emails. **Status: not started — `GET /api/subscribers/[id]/referrals` route exists and returns referred subscribers. Can reuse.**
- T3: Query `qualification_answers` table (if exists) or `qual_answers` JSONB column on subscribers. Display questions and answers. **Status: not started — `qualification_questions` table exists in schema (Story 2.1), but answers storage format needs verification. Check `subscribers` table for `qual_answers` column.**
- T4: Back button: `router.back()` or `Link href="/dashboard"`. Not found: redirect to `/dashboard` or show error message. **Status: not started.**

---

### Story 9.5 — Epic 9 Tests

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As the founder, I want comprehensive tests for all Epic 9 components and pages so that the dashboard layout, stat cards, subscriber table, CSV export, and subscriber detail page work correctly and don't regress.

**Test Infrastructure:** Vitest + @testing-library/react for component tests. Config: `vitest.config.mts` (happy-dom, `src/**/*.test.{ts,tsx}`). Test location: `src/__tests__/components/` for unit tests. Setup: `src/__tests__/setup.ts`. Pattern: `@testing-library/react` + `@testing-library/user-event` + `vitest`.

**Acceptance Criteria (EARS):**

- AC1: The system shall have component tests for the dashboard sidebar (`components/dashboard/sidebar.tsx`) covering: renders all navigation items, active state highlighting, disabled state for Broadcasts/Settings, mobile hamburger toggle.
- AC2: The system shall have component tests for stat cards covering: renders 4 cards, displays real subscriber count, displays referral percentage, displays warmth counts, shows em-dash when no data.
- AC3: The system shall have component tests for subscriber table covering: renders table columns, search filters by email, sort by position, sort by referrals, empty state message, row click navigation.
- AC4: The system shall have component tests for CSV export covering: button visible for Pro tier, button hidden for Free tier, CSV content format, filename format.
- AC5: The system shall have component tests for subscriber detail page covering: renders subscriber info, renders referral data, renders qualification answers, back button navigation, not found state.
- AC6: All tests shall pass with `pnpm test`.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Sidebar component tests · T2 (AC2) Stat cards tests · T3 (AC3) Subscriber table tests · T4 (AC4) CSV export tests · T5 (AC5) Subscriber detail page tests · T6 (AC6-AC7) Run all tests + lint + build

**Out of scope:** Tests for Epic 7 features (public waitlist page — covered in Story 7.8), tests for Epic 8 features (thank-you page — covered in Story 8.5), tests for Epic 10 features.

**Dev Notes:**

- T1: Create `src/__tests__/components/dashboard-sidebar.test.tsx`. Mock `usePathname` from `next/navigation`. Test nav item rendering, active state, disabled state. **Status: not started — no sidebar component or test exists. `components/dashboard/` directory does not exist.**
- T2: Create `src/__tests__/components/dashboard-stat-cards.test.tsx`. Mock subscriber data. Test count calculation, percentage calculation, em-dash rendering. **Status: not started — no stat cards component or test exists. Stat cards are inline in `client.tsx:248-267`.**
- T3: Create `src/__tests__/components/dashboard-subscriber-table.test.tsx`. Mock subscriber array. Test search filtering, sort toggling, empty state, row click handler. **Status: not started — subscriber table is inline in `client.tsx:360-428`, not a separate component.**
- T4: Create `src/__tests__/components/dashboard-csv-export.test.tsx`. Mock `navigator.clipboard` and `URL.createObjectURL`. Test conditional rendering by tier, CSV content format. **Status: not started — no CSV export component or test exists.**
- T5: Create `src/__tests__/components/dashboard-subscriber-detail.test.tsx`. Mock subscriber data with referrals and qual answers. Test rendering of all sections, back button. **Status: not started — no subscriber detail page or test exists.**
- T6: Run `pnpm test` for unit tests, `pnpm lint` for linting, `pnpm build` for build verification. **Status: existing tests pass (86 tests across 8 files), but no Epic 9 tests exist yet.**

**Existing dashboard test:** `src/__tests__/components/dashboard-referral-column.test.tsx` exists but tests Sprint 1 referral column feature, not Epic 9 components.

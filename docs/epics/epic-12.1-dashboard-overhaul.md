# Epic 12.1 — Dashboard Overhaul

**Status:** ready
**Source:** [PRD §2b Sprint 3.1](../PRD.md#2b-sprint-31--dashboard-overhaul), [Dashboard Overhaul Plan](../dashboard-overhaul-plan.md), [Sprint Gap Analysis](../sprint-gap-analysis.md)

## Design References

| Reference                | File                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| Dashboard — empty state  | `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg`  |
| Dashboard — active state | `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg` |

## Goal

Redesign the founder dashboard from a bare functional shell into a complete command center. Empty states guide founders to action. Stat cards show insights, not just numbers. Tier gating is consistent. The sidebar navigation is clear and purposeful. Mobile works. The founder updates compose UI is built. Design token compliance is enforced across all dashboard surfaces.

## Definition of Done

A new founder sees a welcoming empty state with clear next steps and a progress indicator. An active founder sees stat cards with comparison deltas, a subscriber table that works on mobile, consistent locked/unlocked states across all features, and the founder updates compose UI. All hardcoded colors are replaced with design system tokens. All 22 identified dashboard issues are resolved. Tests pass.

## Story Index

| ID      | Title                           | Depends on    | Status |
| ------- | ------------------------------- | ------------- | ------ |
| 12.1.0  | Sidebar Redesign                | —             | ready  |
| 12.1.1  | Empty State Redesign            | 12.1.0        | ready  |
| 12.1.2  | Stat Card Upgrades              | 12.1.0        | ready  |
| 12.1.3  | Tier Gating Consistency         | 12.1.0        | ready  |
| 12.1.4  | Founder Updates Compose UI      | 12.1.0        | ready  |
| 12.1.5  | Mobile Responsiveness Fix       | —             | ready  |
| 12.1.6  | Settings & Bug Fixes            | —             | ready  |
| 12.1.7  | Design Token Compliance         | —             | ready  |
| 12.1.8  | Broadcast & Duplicate API Fixes | —             | ready  |
| 12.1.9  | Data & Performance              | 12.1.2        | ready  |
| 12.1.10 | Epic 12.1 Tests                 | 12.1.0–12.1.9 | ready  |

Work through these in dependency order, one at a time. Story 12.1.0 is the foundation — sidebar redesign affects layout for all subsequent stories. Stories 12.1.1–12.1.4 depend on 12.1.0 (new sidebar structure). Stories 12.1.5–12.1.8 are independent fixes. Story 12.1.9 depends on 12.1.2 (stat cards need to exist for data optimization). Story 12.1.10 is the final test pass covering everything.

---

### Story 12.1.0 — Sidebar Redesign

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg`, `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`

**Story:** As a founder, I want the sidebar to use grouped navigation with clear labels and tooltips so that I can easily find and understand each section.

**Acceptance Criteria (EARS):**

- AC1: The sidebar shall group navigation items into 4 sections: COMMAND CENTER (Overview, Subscribers), INSIGHTS (Qualification, Leaderboard, Warmth), ENGAGEMENT (Updates, Broadcast), CONFIG (Settings).
- AC2: Section headers shall use `text-overline` styling with `text-muted-foreground` color and uppercase letter-spacing.
- AC3: Disabled items (Qualification, Leaderboard, Updates) shall display a "Coming soon" label in `text-xs text-muted-foreground` to the right of the nav label.
- AC4: Locked items (Warmth, Broadcast for Free tier) shall display a lock icon and a tooltip on hover reading "Pro feature — upgrade to unlock".
- AC5: The product name button at the top shall NOT display a dropdown chevron arrow — single waitlist only.
- AC6: The "Upgrade to Pro" button at the bottom shall be removed from the sidebar (upgrade CTA will be contextual in other stories).
- AC7: The active nav item shall use a green pill background (`bg-accent text-accent-foreground`) matching current behavior.
- AC8: The sidebar shall remain 268px (`w-67`) on desktop, hamburger on mobile.
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Grouped nav sections with overline headers · T2 (AC3) "Coming soon" labels on disabled items · T3 (AC4) Tooltip on locked items · T4 (AC5-AC6) Remove dropdown chevron and upgrade button · T5 (AC7-AC8) Verify active state and responsive behavior · T6 (AC9) Lint + build

**Out of scope:** Sidebar subscriber count badge, sidebar search, sign-out button relocation (keep existing), new nav items beyond current 8.

**Dev Notes:**

- T1: Restructure `NAV_ITEMS` in `components/dashboard/sidebar.tsx` into groups. Add section headers as non-clickable elements between groups. Current flat array at line 18–215 needs restructure. Use `text-overline` CSS preset for section headers.
- T2: For disabled items (line 86–177), add a `<span className="ml-auto text-xs text-muted-foreground">Coming soon</span>` after the label. Current disabled items at lines 347–356 have no explanation.
- T3: Locked items (lines 312–344) already show lock icon. Add `title` attribute for native tooltip: `title="Pro feature — upgrade to unlock"`. No custom tooltip component needed for MVP.
- T4: Remove the chevron SVG (lines 280–297) from the product button. Remove the "Upgrade to Pro" Link (lines 379–384). Keep sign-out button.
- T5: Active state (lines 364–369) already uses `bg-accent text-accent-foreground` — verify it works with grouped layout.
- T6: Sidebar bg `bg-[#FCFCFB]` at line 239 will be fixed in Story 12.1.7 (token compliance).

**Issue mapping:** A1 (grouped nav), A2 (duplicate links — Subscribers becomes anchor or dedicated page), A3 (disabled labels), A5 (dead upgrade button), A6 (dead link), A7 (dropdown arrow).

---

### Story 12.1.1 — Empty State Redesign

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg`

**Story:** As a new founder, I want a welcoming empty state with clear next steps so that I know what to do after onboarding.

**Acceptance Criteria (EARS):**

- AC1: When `subscribers.length === 0`, the dashboard shall display: a welcome heading ("Your waitlist is live at {subdomain}.prewaitlist.com"), a Copy Link button, and a View Public Page button.
- AC2: The empty state shall include a "What to do next" section with 3 benefit-led steps: "Share your page in 1–2 relevant communities", "Tell 5 people personally — personal asks convert 3x better", "Post on social with your referral link".
- AC3: The empty state shall show ghost stat cards (greyed with em-dash values) below the guidance section to preview what the dashboard will look like.
- AC4: The "Preview — this is what it'll look like once signups arrive" text (line 404–406 of `client.tsx`) shall be removed.
- AC5: The onboarding checklist (`CHECKLIST_ITEMS` at lines 79–90 of `client.tsx`) and its rendering (lines 359–402) shall be removed entirely.
- AC6: When subscribers exist, the dashboard shall skip the empty state and render stat cards, chart, and table directly (current behavior for the data sections).
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Welcome heading + action buttons + guidance steps · T2 (AC3) Ghost stat cards for empty state · T3 (AC4-AC5) Remove preview text and checklist · T4 (AC6) Conditional rendering logic · T5 (AC7) Lint + build

**Out of scope:** Onboarding progress bar (deferred to separate enhancement), persistent checklist state, copy-to-clipboard behavior (reuse existing `handleCopy`).

**Dev Notes:**

- T1: Replace lines 333–406 in `client.tsx` with new empty state. Use `text-h2` for heading. Copy Link button reuses existing `handleCopy` function. View Public Page button: `<Link href="https://${liveUrl}" target="_blank">`. Guidance steps: ordered list with `text-body-sm`, numbers in `text-accent font-medium`.
- T2: Render the existing stat card grid (lines 408–437) but always show em-dashes when `subscribers.length === 0`. The current `formatStat` function already handles this.
- T3: Remove `CHECKLIST_ITEMS` constant (lines 79–90), `checkedItems` state (line 114), and the checklist rendering (lines 359–402). Remove "Preview" paragraph (lines 404–406).
- T4: Use `subscribers.length === 0` as the condition. When >0, skip the welcome/guidance section and render chart + table directly.

**Issue mapping:** B1 (misplaced onboarding content), B2 (checklist state not persisted — removed entirely), B3 (preview label contradictory — removed), B4 (weak guidance — replaced with benefit-led steps).

---

### Story 12.1.2 — Stat Card Upgrades

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`

**Story:** As a founder, I want stat cards with comparison deltas and warmth data so that numbers become insights, not just facts.

**Acceptance Criteria (EARS):**

- AC1: The dashboard shall display 4 stat cards: Total Signups, Referral %, Today, Warmth.
- AC2: Each stat card (except Warmth) shall show a comparison delta below the value: "↑ X% vs last week" for positive, "↓ X% vs last week" for negative, "—" when no prior data.
- AC3: The comparison delta shall be computed by a new API endpoint `GET /api/dashboard/stats` that returns `{ current: { total, referrals, today }, previous: { total, referrals, today } }` where `previous` is the count from 7 days ago to 14 days ago.
- AC4: The Warmth stat card shall show the actual warmth distribution summary: "{hot} Hot, {warm} Warm, {cold} Cold" — not a hardcoded em-dash.
- AC5: The Warmth stat card shall fetch from the existing `/api/dashboard/warmth` endpoint (shared with WarmthPanel).
- AC6: Stat cards shall use design system tokens: `bg-card`, `rounded-[var(--card-radius)]`, `border-border`.
- AC7: The stat card grid shall use `grid-cols-2` on mobile and `grid-cols-4` on desktop for responsive layout.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC3) Create `GET /api/dashboard/stats` endpoint · T2 (AC1-AC2) Redesign stat cards with deltas · T3 (AC4-AC5) Connect warmth stat card to real data · T4 (AC6-AC7) Responsive grid + token styling · T5 (AC8) Lint + build

**Out of scope:** Sparklines (not in design SVG), visual hierarchy differences between cards, real-time updates.

**Dev Notes:**

- T1: Create `src/app/api/dashboard/stats/route.ts`. Query subscribers table: `current` = last 7 days counts, `previous` = day 7–14 counts. Compute delta percentages. Handle division by zero. Require auth via `createClient`.
- T2: Replace the stat card grid (lines 408–437 in `client.tsx`). Each card: value in `text-h3`, label in `text-caption text-muted-foreground`, delta in `text-xs` with conditional color (`text-accent` for up, `text-destructive` for down, `text-muted-foreground` for neutral).
- T3: Pass warmth data from server component or fetch client-side from `/api/dashboard/warmth`. Display: `{hot} Hot, {warm} Warm, {cold} Cold` in `text-body-sm`.
- T4: Current grid at line 408 uses `grid-cols-4`. Change to `grid-cols-2 lg:grid-cols-4` for mobile. Verify tokens match existing card styling.

**Issue mapping:** C1 (no comparison deltas), C2 (warmth hardcoded "—"), C3 (no sparklines — out of scope per PRD), C4 (visual hierarchy — deferred).

---

### Story 12.1.3 — Tier Gating Consistency

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg`

**Story:** As a founder, I want locked features to be consistently locked everywhere so that the dashboard feels trustworthy and coherent.

**Acceptance Criteria (EARS):**

- AC1: The WarmthPanel component shall display a locked overlay for Free tier: greyed-out bars with a blur effect, a "Pro" badge, and text "Upgrade to Pro to see warmth scores".
- AC2: The WarmthPanel shall accept a `tier` prop. When `tier === "free"`, render the locked overlay. When `tier === "pro"`, render live data (current behavior).
- AC3: The Warmth stat card (from Story 12.1.2) shall show a lock icon next to "Warmth" label when `tier === "free"`.
- AC4: The CSV Export button shall remain hidden for Free tier (current behavior at line 483 of `client.tsx` — already correct).
- AC5: The sidebar locked items (Warmth, Broadcast) shall show tooltips (covered in Story 12.1.0 AC4).
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) WarmthPanel locked overlay with tier prop · T2 (AC3) Warmth stat card lock icon · T3 (AC4) Verify CSV export behavior · T4 (AC6) Lint + build

**Out of scope:** Upgrade modal trigger (Paddle billing is Sprint 3 — Epic 13), subscriber count cap enforcement, broadcast locked state changes.

**Dev Notes:**

- T1: Modify `components/dashboard/warmth-panel.tsx`. Add `tier?: string` prop. When `tier === "free"`, render: container with `opacity-50`, bars at 0% width, overlay with lock icon SVG + "Upgrade to Pro" text. Use `relative` positioning on container, `absolute inset-0` for overlay.
- T2: In `client.tsx` stat card grid, when `tier === "free"`, add a small lock icon (reuse the SVG from sidebar) next to the "Warmth" label text.
- T3: Line 483 already has `{tier === "pro" && (...)}` — verify this works correctly.

**Issue mapping:** A4 (warmth lock inconsistency), C2 (warmth stat card), D2 (CSV export — already correct).

---

### Story 12.1.4 — Founder Updates Compose UI

**Status:** ready
**Design Refs:** —

**Story:** As a founder, I want a page to compose and publish updates to my waitlist page so that I can keep my subscribers informed.

**Acceptance Criteria (EARS):**

- AC1: The system shall render `/dashboard/updates` as a new page with a compose form.
- AC2: The page shall include a textarea for the update body (min 10 characters, max 2000 characters).
- AC3: The page shall include a "Publish" button that calls `POST /api/updates` with `{ body: string }`.
- AC4: On successful publish, the page shall show a success message and clear the textarea.
- AC5: On error, the page shall display the error message from the API response.
- AC6: The page shall display the 10 most recent updates in reverse chronological order below the compose form.
- AC7: Each update shall show the body text and created_at date.
- AC8: The sidebar "Updates" nav item (currently disabled) shall link to `/dashboard/updates` and be enabled.
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Updates compose page with textarea · T2 (AC3-AC5) Publish button + API call + error handling · T3 (AC6-AC7) Recent updates feed · T4 (AC8) Enable sidebar nav item · T5 (AC9) Lint + build

**Out of scope:** Rich text editor, image attachments, edit/delete updates, email sending (deferred to Epic 12), update scheduling.

**Dev Notes:**

- T1: Create `src/app/dashboard/updates/page.tsx` (server component for auth check) + `src/app/dashboard/updates/client.tsx` (client component for form). Reuse Sidebar component. Textarea: use design system `Textarea` from `components/ui/textarea.tsx`.
- T2: `POST /api/updates` already exists (created in Epic 5). Body: `{ body: string }`. Success returns `{ id: string }`. Error returns `{ error: string }`.
- T3: Query `founder_updates` table: `SELECT * FROM founder_updates WHERE waitlist_id = $1 ORDER BY created_at DESC LIMIT 10`. Pass from server to client.
- T4: In `sidebar.tsx`, change the Updates item from `disabled: true, href: "#"` to `href: "/dashboard/updates"`. Remove from disabled group.

**Issue mapping:** M9 (founder updates compose UI — must-have from gap analysis).

---

### Story 12.1.5 — Mobile Responsiveness Fix

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`

**Story:** As a founder using a mobile device, I want the subscriber table and dashboard layout to work properly on small screens.

**Acceptance Criteria (EARS):**

- AC1: The subscriber table shall be wrapped in `overflow-x-auto` to enable horizontal scrolling on mobile.
- AC2: The stat card grid shall use `grid-cols-2` on mobile viewports (≤768px).
- AC3: The qualification panel and warmth panel grid (`grid-cols-2` at line 451 of `client.tsx`) shall stack to `grid-cols-1` on mobile.
- AC4: The header bar (subdomain + copy + share) shall wrap gracefully on mobile — use `flex-wrap` or stack vertically.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Table overflow wrapper · T2 (AC2-AC3) Responsive grids · T3 (AC4) Header wrap · T4 (AC5) Lint + build

**Out of scope:** Subscriber table pagination (PRD explicitly excludes from Sprint 3.1), table column hiding on mobile, mobile-specific navigation patterns beyond existing hamburger.

**Dev Notes:**

- T1: Wrap the subscriber table container (line 456 in `client.tsx`) with `<div className="overflow-x-auto">`. The grid at line 495 (`grid-cols-6`) will scroll horizontally on narrow screens.
- T2: Line 408: change `grid-cols-4` to `grid-cols-2 lg:grid-cols-4`. Line 451: change `grid-cols-2` to `grid-cols-1 md:grid-cols-2`.
- T3: Line 270: add `flex-wrap` to the header flex container, or change to `flex flex-col gap-2 sm:flex-row sm:items-center`.

**Issue mapping:** D2 (mobile table overflow), C4 (stat card responsive — partially).

---

### Story 12.1.6 — Settings & Bug Fixes

**Status:** ready
**Design Refs:** —

**Story:** As a founder, I want the settings page buttons to work and known bugs to be fixed so that the dashboard feels polished.

**Acceptance Criteria (EARS):**

- AC1: The "Upgrade to Pro" button in settings (line 207–212 of `settings/client.tsx`) shall display a tooltip or note: "Paddle billing coming soon" — it must not be a dead button with no feedback.
- AC2: The "Manage billing" button for Pro users (lines 214–219) shall display a tooltip or note: "Paddle billing coming soon".
- AC3: The settings save functions (`handleSaveSenderName`, `handleSaveThreshold`) shall have try/catch error handling with user-visible error feedback (currently missing — line 43–77 has no catch block).
- AC4: The `wshrink-0` typo in `qualification-panel.tsx` line 88 shall be fixed to `shrink-0`.
- AC5: The loading skeleton sidebar width (`w-60` at line 4 of `loading.tsx`) shall match the actual sidebar width (`w-67`).
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Settings button feedback · T2 (AC3) Error handling on settings save · T3 (AC4) Fix wshrink-0 typo · T4 (AC5) Fix loading skeleton width · T5 (AC6) Lint + build

**Out of scope:** Paddle checkout integration (Epic 13), billing management page, danger zone (archive/delete).

**Dev Notes:**

- T1: Replace the dead buttons with a `<button disabled title="Paddle billing coming soon">` pattern. Or show inline text below the button: "Coming soon — Paddle integration is in progress."
- T2: Wrap `fetch` calls in try/catch. Add `const [error, setError] = useState<string | null>(null)` state. Display error below the save button: `{error && <p className="text-xs text-destructive">{error}</p>}`.
- T3: Line 88 of `qualification-panel.tsx`: change `wshrink-0` to `shrink-0`.
- T4: Line 4 of `loading.tsx`: change `w-60` to `w-67` to match sidebar width.

**Issue mapping:** A5 (dead settings buttons), E5 (no error handling on save), typo fix, loading skeleton width.

---

### Story 12.1.7 — Design Token Compliance

**Status:** ready
**Design Refs:** —

**Story:** As the founder, I want all dashboard components to use design system tokens so that the UI is consistent and maintainable.

**Acceptance Criteria (EARS):**

- AC1: The sidebar background `bg-[#FCFCFB]` (line 239 of `sidebar.tsx`) shall be replaced with a design system token. Use `bg-background` or add a new token `--color-sidebar` if needed.
- AC2: The WarningBanner yellow colors (`border-yellow-200`, `bg-yellow-50`, `text-yellow-600`, `text-yellow-800` at line 36 of `warning-banner.tsx`) shall be replaced with design system tokens. Add `--color-warning-border`, `--color-warning-bg`, `--color-warning-text` tokens to `globals.css` if no existing tokens match.
- AC3: The Recharts hardcoded colors `#6b6b6b` and `#e0ddd8` (lines 106–108 of `signup-chart.tsx`) shall use CSS custom properties. Since Recharts requires inline hex values, reference the token's computed value or use `var()` syntax.
- AC4: The email event log badge colors (`bg-green-100 text-green-800`, etc.) if still hardcoded shall use design system tokens.
- AC5: All new code in this epic shall use design system tokens exclusively — no hardcoded hex values.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Sidebar bg token · T2 (AC2) Warning banner tokens · T3 (AC3) Chart axis colors · T4 (AC4) Badge colors audit · T5 (AC5) Final audit · T6 (AC6) Lint + build

**Out of scope:** Adding new semantic tokens beyond warning colors (future design system expansion), changing existing token values.

**Dev Notes:**

- T1: Check if `--color-background` (#FAF8F4) is appropriate for sidebar. If sidebar needs a distinct shade, add `--color-sidebar: #FCFCFB` to `@theme inline` in `globals.css` and use `bg-sidebar`.
- T2: Add to `globals.css` `@theme inline`: `--color-warning-border: #fbbf24`, `--color-warning-bg: #fefce8`, `--color-warning-text: #92400e`. Use as `border-warning-border`, `bg-warning-bg`, `text-warning-text`.
- T3: Recharts `tick={{ fill: "..." }}` requires a string value. Use `getComputedStyle(document.documentElement).getPropertyValue('--color-muted-foreground')` or hardcode the token's hex value with a comment. The simpler approach: use the hex values from the tokens (`#6B6459` for muted-foreground, `#CCC9C3` for border) with a `// token: --color-muted-foreground` comment.
- T4: Search for `bg-green-`, `bg-red-`, `bg-yellow-`, `text-green-`, `text-red-` in dashboard components. Replace with token-based classes.

**Issue mapping:** F1 (sidebar bg), F2 (warning banner), F3 (chart colors), F4 (badge colors).

---

### Story 12.1.8 — Broadcast & Duplicate API Fixes

**Status:** ready
**Design Refs:** —

**Story:** As a founder, I want the broadcast page to default to "all" subscribers and show a confirmation before sending, and I want duplicate API calls eliminated.

**Acceptance Criteria (EARS):**

- AC1: The broadcast segment selector shall default to "all" (currently defaults to "cold" at line 37 of `broadcast/client.tsx`).
- AC2: A confirmation dialog shall appear before sending a broadcast: "Send this email to {count} subscribers? This cannot be undone."
- AC3: The broadcast preview shall use the actual sender name (currently hardcoded `updates@prewaitlist.com` at line 226 of `broadcast/client.tsx`).
- AC4: The WarningBanner and WarmthPanel shall share warmth data via a single fetch instead of both calling `/api/dashboard/warmth` independently.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Default segment to "all" · T2 (AC2) Confirmation dialog · T3 (AC3) Dynamic sender in preview · T4 (AC4) Shared warmth data fetch · T5 (AC5) Lint + build

**Out of scope:** Subject/body length validation (G4 — low priority), broadcast scheduling, email template editor.

**Dev Notes:**

- T1: Line 37 of `broadcast/client.tsx`: change `useState<"all" | "hot_warm" | "cold">("cold")` to `("all")`.
- T2: Before `handleSend` executes, show a native `window.confirm()` or a custom modal: "Send this email to {activeCount} subscribers? This cannot be undone." Only proceed if confirmed.
- T3: Line 226: change hardcoded `updates@prewaitlist.com` to `{displayName.toLowerCase().replace(/\s+/g, ".")}@prewaitlist.com` or use the sender name variable. The `displayName` is already computed at line 40.
- T4: Lift warmth data fetch to `client.tsx` (dashboard page). Pass `warmthData` as a prop to both `WarningBanner` and `WarmthPanel`. Both components accept data as props instead of fetching independently. This eliminates the duplicate `/api/dashboard/warmth` call.

**Issue mapping:** G1 (default segment), G2 (no confirmation), G3 (hardcoded sender), E1 (duplicate warmth fetch).

---

### Story 12.1.9 — Data & Performance

**Status:** ready
**Design Refs:** —

**Story:** As a founder, I want the dashboard to load fast and use efficient data patterns.

**Acceptance Criteria (EARS):**

- AC1: The `/api/dashboard/chart`, `/api/dashboard/qualification`, and `/api/dashboard/warmth` endpoints shall include `Cache-Control: s-maxage=30, stale-while-revalidate=60` headers.
- AC2: The warmth data shall be fetched once in the dashboard page component and distributed to WarningBanner, WarmthPanel, and Warmth stat card via props (no duplicate fetches).
- AC3: The qualification API endpoint shall not load all subscribers into memory for counting — use Supabase aggregate queries instead of in-memory `.filter().length`.
- AC4: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Cache headers on API routes · T2 (AC2) Shared warmth data distribution · T3 (AC3) Optimize qualification query · T4 (AC4) Lint + build

**Out of scope:** Supabase realtime subscriptions, subscriber table virtualization (PRD excludes pagination from Sprint 3.1), SWR/React Query integration.

**Dev Notes:**

- T1: In each API route handler, add `response.headers.set("Cache-Control", "s-maxage=30, stale-while-revalidate=60")` before returning.
- T2: In `src/app/dashboard/page.tsx`, fetch warmth data server-side (or in a single client-side useEffect) and pass to child components. Modify `WarningBanner` and `WarmthPanel` to accept warmth data as props instead of fetching internally.
- T3: In `src/app/api/dashboard/qualification/route.ts`, replace any in-memory counting with Supabase `select('question, answer, count(*)').group()` aggregate queries.

**Issue mapping:** E2 (no caching), E1 (duplicate fetch — shared with 12.1.8), E3 (qualification memory load).

---

### Story 12.1.10 — Epic 12.1 Tests

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As the founder, I want comprehensive tests covering every Epic 12.1 component and page so that the dashboard overhaul is regression-proof and production-ready.

**Test Infrastructure:** Vitest + @testing-library/react for component tests. Config: `vitest.config.mts` (happy-dom, `src/**/*.test.{ts,tsx}`). Test location: `src/__tests__/components/` for component tests, `src/__tests__/api/` for API route tests. Setup: `src/__tests__/setup.ts`. Pattern: `@testing-library/react` + `@testing-library/user-event` + `vitest`.

**Acceptance Criteria (EARS):**

- AC1: The system shall have component tests for the redesigned sidebar covering: renders all grouped nav items, "Coming soon" labels on disabled items, tooltip on locked items, no dropdown chevron, no upgrade button, active state highlighting.
- AC2: The system shall have component tests for the empty state covering: renders welcome heading when 0 subscribers, renders guidance steps, renders ghost stat cards, does not render checklist, renders data view when subscribers exist.
- AC3: The system shall have component tests for stat card upgrades covering: renders 4 cards, displays comparison deltas, displays warmth summary, responsive grid layout.
- AC4: The system shall have component tests for tier gating covering: WarmthPanel locked overlay for Free, WarmthPanel live data for Pro, warmth stat card lock icon for Free.
- AC5: The system shall have component tests for founder updates compose UI covering: renders textarea, publish button calls API, success message, error display, recent updates list.
- AC6: The system shall have component tests for mobile responsiveness covering: table overflow wrapper, responsive stat card grid, responsive panel grid.
- AC7: The system shall have component tests for settings covering: error handling on save, button feedback states.
- AC8: The system shall have API route tests for `GET /api/dashboard/stats` covering: returns current and previous counts, handles empty data, requires auth.
- AC9: All tests shall pass with `pnpm test`.
- AC10: Lint and build shall pass with zero errors.
- AC11: Total test count across the project shall be ≥270.

**Tasks:** T1 (AC1) Sidebar tests · T2 (AC2) Empty state tests · T3 (AC3) Stat card tests · T4 (AC4) Tier gating tests · T5 (AC5) Updates compose tests · T6 (AC6) Mobile responsiveness tests · T7 (AC7) Settings tests · T8 (AC8) Stats API tests · T9 (AC9-AC11) Full verification

**Out of scope:** E2E tests (Playwright), tests for Epic 12.1.7 (token compliance — visual, not functional), tests for Epic 12.1.8 (broadcast fixes — integration-level).

**Dev Notes:**

- T1: Create `src/__tests__/components/dashboard-sidebar-redesign.test.tsx`. Mock `usePathname`. Test grouped sections, labels, tooltips, chevron absence.
- T2: Create `src/__tests__/components/dashboard-empty-state.test.tsx`. Mock empty subscribers array. Test welcome heading, guidance steps, ghost cards, checklist absence.
- T3: Create `src/__tests__/components/dashboard-stat-cards.test.tsx`. Mock stats data with deltas. Test delta rendering, warmth summary.
- T4: Create `src/__tests__/components/dashboard-tier-gating.test.tsx`. Mock tier prop. Test locked overlay, lock icon.
- T5: Create `src/__tests__/components/dashboard-updates-compose.test.tsx`. Mock fetch. Test form submission, success/error states.
- T6: Create `src/__tests__/components/dashboard-mobile-responsive.test.tsx`. Test overflow wrapper exists, grid classes are correct.
- T7: Create `src/__tests__/components/dashboard-settings.test.tsx`. Mock fetch failure. Test error display.
- T8: Create `src/__tests__/api/dashboard-stats.test.tsx`. Mock Supabase. Test response shape, auth check.
- T9: Run `pnpm test`, `pnpm lint`, `pnpm build`. Verify ≥270 tests pass.

**Issue mapping:** Comprehensive test coverage for all 11 stories in Epic 12.1.

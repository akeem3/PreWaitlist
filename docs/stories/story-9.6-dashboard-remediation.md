---
id: epic9.story06
epic: epic-9-dashboard-restructure
title: Dashboard Remediation — MVP Gap Fill
status: done
depends_on:
  [epic9.story00, epic9.story01, epic9.story02, epic9.story03, epic9.story04]
updated: 2026-09-05
---

# Story 9.6 — Dashboard Remediation — MVP Gap Fill

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg`, `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`
**Design Guide:** `docs/design/dashboard-design-guide.md` — **Mandatory.** All implementation MUST comply with this guide.

**Story:** As the founder, I want the dashboard to close the remaining gaps between what's built and what the MVP spec requires — including a signups-over-time chart, qualification breakdown, referral quality scores, top referrers panel, warmth distribution, enhanced subscriber table, and a loading skeleton — so that the dashboard is feature-complete for Sprint 2 launch.

## Background & Rationale

Stories 9.0–9.5 built the layout shell, stat cards, subscriber table, CSV export, and subscriber detail page. A comprehensive scan against the MVP vision (`docs/product-vision-mvp-waitlist-tool.md` Module 5) and design SVGs identified 12 functional gaps. This story closes every one of them in a single, phased implementation.

**MVP features covered by this story:**

| Feature                       | MVP Grade | Source        |
| ----------------------------- | --------- | ------------- |
| Signups-over-time chart       | 🔵 Core   | Module 5 L165 |
| Qualification breakdown panel | 🔵 Core   | Module 5 L168 |
| Referral quality score        | 🔵 Core   | Module 5 L166 |
| Top referrers list            | 🔵 Core   | Module 5 L166 |
| Warmth distribution summary   | 🔵 Core   | Module 5 L169 |
| Subscriber list enhancements  | 🔵 Core   | Module 5 L170 |
| CSV export enhancements       | 🔵 Core   | Module 5 L171 |

**Design decisions documented:**

- Chart time range: **30-day default with "All Time" toggle** (Spynra, MakeEmWait, Fabricate pattern)
- Top referrers: **always visible in nav, panel shows when ≥1 referrer exists** (Refgrow, FluxBilling pattern)
- Quality score: **transparent formula — `referrals_driven / total_referrals × 100`** — documented in both `docs/PRD.md` and `docs/product-vision-mvp-waitlist-tool.md`
- Warmth distribution: **locked placeholder for Free tier, real data for Pro** (PRD standing decision)

---

## Design Guide Compliance (MANDATORY)

All implementation in this story MUST comply with `docs/design/dashboard-design-guide.md`. The design guide is the authoritative source for:

- **Layout structure:** Zone system (sidebar 268px, top bar 56–64px, content grid 12-col), F-pattern vertical flow (KPI strip → chart → panels → table)
- **Card/panel styling:** `bg-card`, `border-border`, `rounded-[var(--card-radius)]`, `p-5`, no shadows — borders only
- **KPI card anatomy:** 28–32px semibold number, 12px muted label, one comparison delta
- **Chart design:** Bar chart (not line), `bg-accent` fill, no gridlines (or subtle `#E0DDD8`), Y-axis starts at zero, no legend, tooltip on hover
- **Table design:** Sticky header, 48–52px row height, left-align text, right-align numbers, sort indicators, row hover `hover:bg-muted/30`
- **Color discipline:** Accent (#0f7a5e) for CTAs + active states + chart bars only; status badges (Hot/Warm/Cold/Unscored) use specific color tokens; no colored card backgrounds
- **Typography:** KPI values 28–32px semibold, section headings 18px semibold, table 14px regular, captions 12px muted
- **Spacing:** 24px between sections, 16px between cards in a row, 24px card padding, 12–16px table row padding
- **Empty states:** Every component has a helpful message + CTA, never dead ends
- **Loading states:** Skeleton screens (`bg-muted animate-pulse`), no spinners
- **Mobile:** Cards stack vertically, chart scrolls horizontally, sidebar as overlay, touch targets ≥44px
- **Anti-patterns:** No colored card backgrounds, no pie charts, no 3D charts, no centered data text, no spinners

**Verification gate:** Before marking any task complete, run through the Component Checklist in `docs/design/dashboard-design-guide.md` §16. Every item must pass.

---

## Acceptance Criteria (EARS)

### Data Layer

- AC1: The `Subscriber` interface in `client.tsx` shall include `warmth_score: string | null`, `quality_score: number | null`, and `qual_answers: Record<string, string> | null`.
- AC2: The server component `page.tsx` shall fetch `warmth_score` and `qual_answers` for every subscriber in the main query.
- AC3: The server component shall compute `quality_score` for each subscriber server-side: `(subscriber.referral_count / total_referrals × 100)` rounded to nearest integer, or `null` when `total_referrals === 0`.

### Signups-Over-Time Chart

- AC4: The dashboard shall display a bar chart showing daily signup counts for the founder's waitlist.
- AC5: The chart shall default to a 30-day rolling window from today.
- AC6: The chart shall provide an "All Time" toggle that displays all historical signups.
- AC7: Each bar shall display the date and count on hover (tooltip).
- AC8: The chart shall use design system tokens: `bg-card`, `border-border`, `rounded-[var(--card-radius)]`.
- AC9: When no signups exist in the selected range, the chart shall display "No signups in this period" with an em-dash.

### Qualification Breakdown Panel

- AC10: The dashboard shall display a "Qualification Breakdown" card showing each qualification question and its answer distribution.
- AC11: For each question, the panel shall show the question text and a horizontal bar with the count of subscribers who gave each answer.
- AC12: When no qualification questions exist, the panel shall display "No qualification questions configured."
- AC13: When questions exist but no subscribers have answered, the panel shall display "No answers yet."

### Referral Quality Score + Top Referrers

- AC14: The subscriber table shall include a "Quality" column showing each subscriber's quality score as a percentage (e.g. "42%").
- AC15: The quality score column shall be sortable (default: descending).
- AC16: A "Top Referrers" panel shall display the top 5 subscribers ranked by quality score, showing email, referral count, and quality percentage.
- AC17: The top referrers panel shall only render when ≥1 subscriber has `referral_count > 0`. When 0 referrers exist, display "Share your link to get referrals" CTA.
- AC18: The quality score formula shall be documented in `docs/PRD.md` and `docs/product-vision-mvp-waitlist-tool.md`.

### Warmth Distribution

- AC19: The dashboard shall display a "Warmth Distribution" card showing Hot, Warm, Cold, and Unscored counts as horizontal bars.
- AC20: The warmth distribution card shall show a neutral placeholder for all tiers (greyed layout with "Warmth tracking coming in a future update" message). The warmth engine ships in Sprint 3 — viewing is available on all tiers per the product spec.
- AC21: For Pro tier, the card shall display the real warmth distribution data from the existing `/api/warmth/[subdomain]` endpoint.
- AC22: When no subscribers exist, the card shall display em-dashes for all categories.

### Subscriber Table Enhancements

- AC23: The subscriber table shall include a "Warmth" column showing a colored badge: Hot (red), Warm (yellow), Cold (blue), Unscored (gray).
- AC24: The subscriber table shall include an expandable row detail showing `qual_answers` as key-value pairs when the user clicks a row.
- AC25: The table shall include a warmth filter dropdown above the table: "All", "Hot", "Warm", "Cold", "Unscored" — defaulting to "All".
- AC26: The warmth filter shall filter the displayed subscriber list client-side.

### CSV Export Enhancement

- AC27: The CSV export shall include columns: Position, Email, Referral Code, Referrals, Quality Score, Warmth, Date.
- AC28: The CSV headers shall be human-readable: "Position", "Email", "Referral Code", "Referrals", "Quality Score", "Warmth", "Signup Date".

### Loading State

- AC29: The dashboard shall render a loading skeleton (`src/app/dashboard/loading.tsx`) with placeholder bars for stat cards, chart, and table while data is being fetched.
- AC30: The loading skeleton shall use design system tokens (`bg-muted`, `animate-pulse`).

### Final Verification

- AC31: Lint and build shall pass with zero errors.
- AC32: All existing tests (166+) shall continue to pass.

---

## Tasks

### Phase 1 — Data Layer (AC1-AC3)

**T1 (AC1-AC3):** Extend `Subscriber` interface and server-side data fetching.

- File: `src/app/dashboard/client.tsx` — extend interface:
  ```ts
  interface Subscriber {
    id: string;
    email: string;
    position: number;
    referral_code: string;
    referral_count: number;
    created_at: string;
    warmth_score: string | null;
    quality_score: number | null;
    qual_answers: Record<string, string> | null;
  }
  ```
- File: `src/app/dashboard/page.tsx` — add `warmth_score`, `qual_answers` to subscriber select query; compute `quality_score` server-side:
  ```ts
  const totalReferrals = subscribersWithCounts.reduce(
    (sum, s) => sum + s.referral_count,
    0
  );
  const subscribersWithQuality = subscribersWithCounts.map((s) => ({
    ...s,
    quality_score:
      totalReferrals > 0
        ? Math.round((s.referral_count / totalReferrals) * 100)
        : null,
  }));
  ```
- Pass `subscribersWithQuality` to client component.
- Verify: `pnpm lint` passes. Design guide compliance: §5 (KPI card anatomy), §9 (color system).

### Phase 2 — Signups-Over-Time Chart (AC4-AC9)

**T2 (AC4-AC9):** Build the signups-over-time bar chart.

- **Install dependency:** `pnpm add recharts` (Recharts — React charting library, widely used, MIT licensed)
- **Create API endpoint:** `src/app/api/dashboard/chart/route.ts`
  - `GET /api/dashboard/chart?range=30d`
  - Auth: require authenticated founder
  - Query: `SELECT date(created_at) as day, COUNT(*) as count FROM subscribers WHERE waitlist_id = $1 AND created_at >= NOW() - INTERVAL '30 days' GROUP BY day ORDER BY day ASC`
  - For `range=all`: omit date filter
  - Return: `{ days: [{ date: "2026-09-01", count: 5 }, ...] }`
- **Create chart component:** `components/dashboard/signup-chart.tsx`
  - Client component (`"use client"`)
  - Props: `data: { date: string; count: number }[]`
  - Render: Recharts `BarChart` with `Bar` (fill: `var(--color-accent)`), `XAxis` (date labels), `YAxis` (count), `Tooltip` (shows date + count on hover)
  - Design tokens: wrap in `bg-card rounded-[var(--card-radius)] border border-border p-5`
  - 30d/All Time toggle: two buttons above chart, active state uses `bg-accent text-accent-foreground`
  - Empty state: centered `text-muted-foreground` — "No signups in this period"
  - Mobile: chart scrolls horizontally, min-width 400px
- **Wire into dashboard:** In `client.tsx`, fetch chart data from API on mount, pass to `SignupChart`
- Verify: `pnpm lint` passes. Design guide compliance: §6 (chart design), §4 (card/panel styling), §11 (spacing).

### Phase 3 — Qualification Breakdown Panel (AC10-AC13)

**T3 (AC10-AC13):** Build the qualification breakdown panel.

- **Create API endpoint:** `src/app/api/dashboard/qualification/route.ts`
  - `GET /api/dashboard/qualification`
  - Auth: require authenticated founder
  - Query: for each qualification question in the founder's waitlist, count answer distribution from `subscribers.qual_answers`
  - Return: `{ questions: [{ question: string, answers: [{ value: string, count: number }] }] }`
- **Create panel component:** `components/dashboard/qualification-panel.tsx`
  - Client component
  - Props: `data: { question: string; answers: { value: string; count: number }[] }[]`
  - Render: for each question, show question text (bold) + horizontal bars for each answer (bar width proportional to count, count label)
  - Design tokens: `bg-card rounded-[var(--card-radius)] border border-border p-5`
  - Empty state (no questions): "No qualification questions configured"
  - Empty state (no answers): "No answers yet"
  - Mobile: stacked layout
- **Wire into dashboard:** Fetch on mount, render below chart
- Verify: `pnpm lint` passes. Design guide compliance: §8 (qualification panel design), §4 (card/panel styling).

### Phase 4 — Referral Quality Score + Top Referrers (AC14-AC18)

**T4 (AC14-AC18):** Add quality score to subscriber table and build top referrers panel.

- **Subscriber table quality column:**
  - In `client.tsx`, add "Quality" column to `TABLE_COLUMNS`
  - Render: percentage string (e.g. "42%") or "—" when null
  - Sortable: click header toggles sort by `quality_score`
  - Default sort: descending (show highest quality first)
- **Top referrers panel:** `components/dashboard/top-referrers.tsx`
  - Client component
  - Props: `subscribers: Subscriber[]`
  - Logic: filter subscribers where `referral_count > 0`, sort by `quality_score` desc, take top 5
  - Render: list of 5 items, each showing: email (truncated), referral count badge, quality score percentage
  - Empty state (0 referrers): "Share your link to get referrals" with link to `/dashboard` overview
  - Design tokens: `bg-card rounded-[var(--card-radius)] border border-border p-5`
- **Wire into dashboard:** Render top referrers panel below or beside chart
- **Document quality score formula:**
  - Update `docs/PRD.md` — add definition in the subscriber data model section
  - Update `docs/product-vision-mvp-waitlist-tool.md` — add formula in Module 5 table notes
- Verify: `pnpm lint` passes. Design guide compliance: §5 (KPI/table design), §8 (top referrers panel), §9 (color system).

### Phase 5 — Warmth Distribution (AC19-AC22)

**T5 (AC19-AC22):** Build warmth distribution card with locked/free states.

- **Create component:** `components/dashboard/warmth-panel.tsx`
  - Client component
  - Props: `data: { hot: number; warm: number; cold: number; unscored: number; total: number } | null`, `tier: string`
  - Render: 4 horizontal bars (Hot=warm-red token, Warm=amber, Cold=blue, Unscored=gray), each with label + count
  - Bar width: proportional to total (count / total × 100%)
  - Locked state (Free tier): blur overlay with `bg-background/80`, lock icon, "Pro" badge (`bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs`)
  - Empty state (no subscribers): em-dashes for all bars
  - Design tokens: `bg-card rounded-[var(--card-radius)] border border-border p-5`
- **Fetch data:** In `client.tsx`, fetch from existing `/api/warmth/[subdomain]` endpoint on mount. Pass `tier` from server component.
- **Wire into dashboard:** Render below stat cards or beside chart
- Verify: `pnpm lint` passes. Design guide compliance: §8 (warmth panel), §9 (color system — badge colors), §4 (card/panel styling).

### Phase 6 — Subscriber Table Enhancements (AC23-AC26)

**T6 (AC23-AC26):** Add warmth column, expandable qual answers, warmth filter.

- **Warmth column:**
  - In `client.tsx`, add "Warmth" column to `TABLE_COLUMNS` (position: after Referrals)
  - Render: colored badge based on `warmth_score`:
    - `hot` → red badge (`bg-red-100 text-red-700`)
    - `warm` → amber badge (`bg-amber-100 text-amber-700`)
    - `cold` → blue badge (`bg-blue-100 text-blue-700`)
    - `null`/unscored → gray badge (`bg-gray-100 text-gray-500`)
  - Badge style: `rounded-full px-2 py-0.5 text-xs font-medium`
- **Expandable row detail:**
  - On row click: instead of immediately navigating, toggle expand inline to show `qual_answers`
  - Expanded section: key-value pairs from `qual_answers` object, rendered as `text-sm text-muted-foreground`
  - Second click on expanded row: navigate to `/dashboard/subscribers/:id`
  - First click expands, second click navigates
- **Warmth filter:**
  - Dropdown above table: `<select>` with options "All", "Hot", "Warm", "Cold", "Unscored"
  - Default: "All"
  - Client-side filter: `subscribers.filter(s => warmthFilter === "All" || s.warmth_score === warmthFilter || (warmthFilter === "Unscored" && !s.warmth_score))`
  - Filter applied before search filter
- Verify: `pnpm lint` passes. Design guide compliance: §7 (table design), §8 (expandable row pattern).

### Phase 7 — CSV Export Enhancement (AC27-AC28)

**T7 (AC27-AC28):** Update CSV export to include new columns.

- File: `src/app/dashboard/client.tsx` — update CSV generation:
  - Headers: `["Position", "Email", "Referral Code", "Referrals", "Quality Score", "Warmth", "Signup Date"]`
  - Values: map each subscriber to the corresponding fields
  - Quality Score: render as percentage string or empty string when null
  - Warmth: render as `warmth_score` string or "Unscored" when null
- Verify: `pnpm lint` passes. Design guide compliance: §10 (CSV export).

### Phase 8 — Loading Skeleton (AC29-AC30)

**T8 (AC29-30):** Create dashboard loading skeleton.

- File: `src/app/dashboard/loading.tsx`
- Render: skeleton placeholders for stat cards (4 boxes), chart area (1 large box), table (5 row placeholders)
- Design tokens: `bg-muted animate-pulse rounded-[var(--card-radius)]`
- Mobile responsive: stacked layout on small screens
- Verify: `pnpm lint` passes. Design guide compliance: §13 (loading states).

### Phase 9 — Final Verification (AC31-AC32)

**T9 (AC31-32):** Run full verification.

```bash
pnpm lint
pnpm build
pnpm test
```

All must pass with zero errors.

**Design guide final check:** Walk through the Component Checklist in `docs/design/dashboard-design-guide.md` §16. Every item must pass. Key items:

- [ ] All cards use `bg-card`, `border-border`, `rounded-[var(--card-radius)]`, `p-5`
- [ ] No shadows used anywhere
- [ ] KPI values are 28–32px semibold, labels 12px muted
- [ ] Chart starts Y-axis at zero, no legend, tooltip on hover
- [ ] Table numbers right-aligned, text left-aligned
- [ ] Status badges use correct color tokens
- [ ] Empty states have helpful messages + CTAs
- [ ] Loading uses skeleton, not spinner
- [ ] Mobile stacks cards vertically, chart scrolls horizontally
- [ ] All text uses design system tokens — no hardcoded hex

---

## Out of Scope

- Real-time warmth scoring engine (Sprint 3 — `docs/PRD.md`)
- Traffic source breakdown (v1.1 — Module 5 L172)
- Device breakdown (v1.1 — Module 5 L173)
- A/B testing (out of scope — Module 5 L175)
- Dashboard navigation to other pages (Qualification, Leaderboard, Warmth, Updates — those are separate epics/stories)
- Charts for qualification breakdown over time (just current snapshot)
- Referral quality score explanation tooltip (just the percentage)

---

## Ambiguity Resolutions

- **Quality score formula:** Simple percentage of total referrals driven. `referral_count / total_referrals × 100`. This is transparent and matches MVP vision ("Who drove volume. Who drove quality."). More complex formulas (recency-weighted, engagement-based) are Sprint 3+.
- **Chart library:** Recharts. Chosen over Chart.js (less React-idiomatic), D3 (too low-level), Victory (less maintained). Recharts is the most widely used React charting library with native TypeScript support.
- **Expandable row vs separate navigation:** Two-click pattern: first click expands inline (shows qual_answers), second click navigates to detail page. This lets founders quickly scan answers without leaving the table, while still providing deep-dive navigation.
- **Warmth filter scope:** Client-side only. All subscribers are already fetched server-side. Filter is a UI convenience, not a data optimization.
- **Sidebar bg inconsistency:** HF4 shows `#FCFCFB`, HF5 shows `#FAF8F4`. Follow HF4 (`#FCFCFB`) for sidebar — this is the most recent design iteration.
- **Chart responsive behavior:** Horizontal scroll on mobile (min-width 400px) rather than simplifying to a list. Bar charts are the core visual pattern — degrading to a list loses the trend signal.

---

## Dev Notes

### Design Guide Reference

`docs/design/dashboard-design-guide.md` — 16 sections covering layout, cards, charts, tables, panels, colors, typography, spacing, empty states, loading states, mobile, and anti-patterns. This is the authoritative source for all visual and UX decisions in this story. Every task must reference it.

### Files Created

| File                                           | Purpose                                  |
| ---------------------------------------------- | ---------------------------------------- |
| `components/dashboard/signup-chart.tsx`        | Signups-over-time bar chart              |
| `components/dashboard/qualification-panel.tsx` | Qualification breakdown panel            |
| `components/dashboard/top-referrers.tsx`       | Top 5 referrers by quality score         |
| `components/dashboard/warmth-panel.tsx`        | Warmth distribution card (locked + live) |
| `src/app/api/dashboard/chart/route.ts`         | Daily signup aggregation API             |
| `src/app/api/dashboard/qualification/route.ts` | Qualification answer distribution API    |
| `src/app/dashboard/loading.tsx`                | Dashboard loading skeleton               |

### Files Modified

| File                                       | Changes                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `src/app/dashboard/page.tsx`               | Add `warmth_score`, `qual_answers` to query; compute `quality_score`; pass to client            |
| `src/app/dashboard/client.tsx`             | Extend `Subscriber` interface; add chart/panels/filter; update table columns; update CSV export |
| `package.json`                             | Add `recharts` dependency                                                                       |
| `docs/PRD.md`                              | Document quality score formula                                                                  |
| `docs/product-vision-mvp-waitlist-tool.md` | Document quality score formula in Module 5                                                      |

### Existing Components Reused

| Component                      | Reuse                                     |
| ------------------------------ | ----------------------------------------- |
| `cn()`                         | Utility for conditional classnames        |
| `Button`                       | For 30d/All Time toggle, empty state CTAs |
| `/api/warmth/[subdomain]`      | Existing warmth data endpoint             |
| `format.ts` (`anonymizeEmail`) | For top referrers email display           |

### Design Token Reference

Full token system documented in `docs/design/dashboard-design-guide.md` §9. Key tokens:

| Token                          | Use                                    |
| ------------------------------ | -------------------------------------- |
| `bg-card`                      | Panel backgrounds (white)              |
| `border-border`                | Panel borders (`#E0DDD8`)              |
| `rounded-[var(--card-radius)]` | Panel border radius (12px)             |
| `text-foreground`              | Primary text                           |
| `text-muted-foreground`        | Secondary text, empty states           |
| `bg-accent`                    | Active toggle, CTA buttons, chart bars |
| `text-accent-foreground`       | Text on accent backgrounds             |
| `bg-muted`                     | Loading skeleton placeholder           |
| `animate-pulse`                | Loading skeleton animation             |
| `bg-red-100 text-red-700`      | Hot warmth badge                       |
| `bg-amber-100 text-amber-700`  | Warm warmth badge                      |
| `bg-blue-100 text-blue-700`    | Cold warmth badge                      |
| `bg-gray-100 text-gray-500`    | Unscored warmth badge                  |

### API Endpoint Specs

**GET /api/dashboard/chart**

```
Query: range=30d | range=all
Auth: authenticated founder (RLS enforced)
Response: { days: [{ date: string, count: number }] }
```

**GET /api/dashboard/qualification**

```
Auth: authenticated founder (RLS enforced)
Response: { questions: [{ question: string, answers: [{ value: string, count: number }] }] }
```

**GET /api/warmth/[subdomain]** (existing)

```
Auth: none (public endpoint)
Response: { hot: number, warm: number, cold: number, unscored: number, total: number }
```

### Quality Score Documentation Update

Add to `docs/PRD.md` subscriber data model section:

> **Quality Score** — A transparent metric showing what percentage of total referrals each subscriber drove. Formula: `(subscriber.referral_count / total_referrals) × 100`, rounded to nearest integer. Displayed as a percentage (e.g. "42%"). Null when total_referrals = 0. Sortable in the subscriber table. Top referrers panel ranks subscribers by quality score.

Add to `docs/product-vision-mvp-waitlist-tool.md` Module 5 table notes:

> **Referral Quality Score** — Transparent percentage: `(referrals driven by subscriber / total referrals across all subscribers) × 100`. Displayed in subscriber table and top referrers panel. Enables founders to identify high-impact referrers for customer discovery outreach.

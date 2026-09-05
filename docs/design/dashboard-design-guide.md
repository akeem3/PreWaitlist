# Dashboard Design Guide

**Purpose:** Binding visual and UX constraints for all Epic 9 dashboard implementation. Every component built in Story 9.6 must follow these rules — no exceptions.

**Source:** Synthesized from production dashboards (Stripe, Linear, Vercel, Notion, Grafana) and authoritative design research (Desisle, SaaS UI, Eleken, AIDesigner, AdminLTE, WANDR, FlowmazeUX, Madegood, UXPin, Sanjay Dey, Nielsen Norman Group).

**Date:** 2026-09-05

---

## 1. The Five-Second Rule

Show the dashboard to a target user for 5 seconds. Hide it. Ask: "What's the one thing you'd do next?" If they can't answer, the hierarchy has failed — no matter how clean the typography looks. Every design decision must serve this test.

---

## 2. Information Hierarchy — Three Levels

| Level         | What                                        | Visual Weight                  | Placement                            |
| ------------- | ------------------------------------------- | ------------------------------ | ------------------------------------ |
| **Primary**   | 1–3 metrics that define "on track" or "not" | Largest type, highest contrast | Top-left, above the fold             |
| **Secondary** | Charts/breakdowns that explain the primary  | Smaller, quieter, scannable    | Middle third of viewport             |
| **Tertiary**  | Tables, logs, granular filters              | Smallest, behind interaction   | Below fold or progressive disclosure |

**Rule:** If every element looks equally important, none of them are. Cut anything that doesn't trigger action. Max 4–6 KPI cards on the primary view (Rule of 6 — beyond that, it becomes a wall).

---

## 3. Layout Structure

### Zone System

| Zone         | Width                                     | Content                                                |
| ------------ | ----------------------------------------- | ------------------------------------------------------ |
| Left sidebar | 268px (matches design SVG)                | Navigation, logo, waitlist name, upgrade CTA, sign out |
| Top bar      | Full width, 56–64px                       | Page title, domain slug, copy link, share button       |
| Content area | Remaining width (`ml-[268px]` on desktop) | KPI cards → charts → panels → table                    |

### Content Grid

Use a 12-column CSS Grid for the content area. Standard card spans:

| Element          | Columns | Example                             |
| ---------------- | ------- | ----------------------------------- |
| Single KPI card  | 3       | 4 cards in a row = 4 × 3 = 12       |
| Full-width panel | 12      | Subscriber table, chart             |
| Half-width panel | 6       | Qualification + Warmth side by side |
| Chart + sidebar  | 8 + 4   | Chart wide, top referrers narrow    |

### Vertical Flow (F-pattern)

1. **KPI strip** (top 80–120px) — 4 stat cards. This is the hero zone. Nothing else competes here.
2. **Primary chart** (below KPI strip) — Signups-over-time bar chart. Full width or 8+4 split.
3. **Secondary panels** (below chart) — Qualification breakdown, warmth distribution, top referrers. 6+6 or 12-wide.
4. **Detail table** (bottom) — Subscriber table with search, filters, sort. Full width.
5. **Bottom** — Powered-by footer, if applicable.

---

## 4. Card / Panel Anatomy

Every panel (stat card, chart wrapper, data panel) follows this structure:

```
┌─────────────────────────────────────┐
│  Section heading (16px, semibold)   │  ← optional, only for panels
│                                     │
│  Content area                       │
│  (24px padding all sides)           │
│                                     │
└─────────────────────────────────────┘
```

### Styling Rules

| Property      | Value     | Token                             |
| ------------- | --------- | --------------------------------- |
| Background    | White     | `bg-card`                         |
| Border        | 1px solid | `border-border`                   |
| Border radius | 12px      | `rounded-[var(--card-radius)]`    |
| Padding       | 24px      | `p-5` (20px) or `p-6` (24px)      |
| Shadow        | None      | Do not use shadows — borders only |

**Rule:** No shadows. Linear and Vercel both ship borders, not shadows. Shadows look dated and add visual noise. A 1px border at current token opacity reads cleaner.

### Gap Rules

| Gap Type               | Value            | Use                            |
| ---------------------- | ---------------- | ------------------------------ |
| Between major sections | 24px             | Chart → panel row → table      |
| Between cards in a row | 16px             | KPI cards, side-by-side panels |
| Card internal padding  | 24px             | Inside every card/panel        |
| Table row padding      | 12–16px vertical | Comfortable scanning           |

---

## 5. KPI / Stat Card Design

Each stat card shows exactly three things:

```
┌─────────────────────┐
│      42              │  ← Primary number (28–32px, semibold, text-foreground)
│  Total signups       │  ← Label (12px, regular, text-muted-foreground)
│  ↑12% vs last month  │  ← Comparison delta (12px, green/red based on direction)
└─────────────────────┘
```

### KPI Card Rules

- **One primary number:** 28–32px, font-semibold, high contrast (`text-foreground`)
- **One label:** 12–14px, muted (`text-muted-foreground`)
- **One comparison:** Delta vs previous period OR trend arrow — not both
- **No sparklines for now** — can add later; stat cards are simple counts
- **Em-dash when empty:** Never show "0" — show "—" (em-dash) for no data
- **Locked state (Warmth card):** Semi-transparent overlay with lock icon, "Pro" badge

### Color Coding for Cards

| Card          | Value Color             | Notes                       |
| ------------- | ----------------------- | --------------------------- |
| Total Signups | `text-foreground`       | Neutral — it's a count      |
| Referral %    | `text-foreground`       | Neutral — it's a percentage |
| Today         | `text-foreground`       | Neutral — it's a count      |
| Warmth        | `text-muted-foreground` | Muted — locked/placeholder  |

**Rule:** Do NOT use colored card backgrounds. Cards stay white (`bg-card`). Color goes on text and status badges only.

---

## 6. Chart Design

### Signups-Over-Time Bar Chart

| Property          | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| Chart type        | Vertical bar chart (column)                                   |
| Library           | Recharts                                                      |
| Bar fill          | `var(--color-accent)` / `bg-accent` (#0f7a5e)                 |
| Bar radius        | 4px top corners                                               |
| Bar max-width     | 40px (prevents overly wide bars on few data points)           |
| X-axis            | Date labels (abbreviated: "Sep 1", "Sep 2", etc.)             |
| Y-axis            | Count (integer), start at 0                                   |
| Gridlines         | None or very subtle (`#E0DDD8` at 50% opacity)                |
| Tooltip           | On hover: date + count in a small card                        |
| Legend            | None (single series — no legend needed)                       |
| Empty state       | "No signups in this period" centered, `text-muted-foreground` |
| Time range toggle | 30d (default, active) / All Time buttons above chart          |

### Chart Card Styling

```
┌─────────────────────────────────────────────┐
│  Signups Over Time     [30d] [All Time]     │  ← heading + toggle
│                                             │
│  ┌──┐ ┌──┐    ┌──┐ ┌──┐ ┌──┐              │
│  │  │ │  │    │  │ │  │ │  │              │  ← bars
│  │  │ │  │ ┌┐ │  │ │  │ │  │ ┌┐           │
│  │  │ │  │ ││ │  │ │  │ │  │ ││           │
│  └──┘ └──┘ └┘ └──┘ └──┘ └──┘ └┘           │
│  Mon Tue Wed Thu Fri Sat Sun               │  ← x-axis labels
└─────────────────────────────────────────────┘
```

### Chart Rules

- Start Y-axis at zero — truncated axes exaggerate differences and mislead
- Max 5 series on any chart — beyond that, use a table
- Direct labels preferred over legends (but for single-series bar chart, no label needed)
- Tooltip on hover — exact values, not just visual position
- Responsive: on mobile, chart scrolls horizontally with `min-width: 400px`

---

## 7. Data Table Design

### Column Structure

| Column       | Align  | Width    | Sortable           |
| ------------ | ------ | -------- | ------------------ |
| # (Position) | Center | 60px     | Yes (default asc)  |
| Email        | Left   | Flexible | No                 |
| Date         | Left   | 120px    | No                 |
| Referrals    | Right  | 100px    | Yes                |
| Quality      | Right  | 100px    | Yes (default desc) |
| Warmth       | Center | 100px    | No                 |

### Table Rules

- **Sticky header:** `position: sticky; top: 0; z-index: 10` — header stays visible on scroll
- **Row height:** 48–52px for comfortable scanning
- **Row hover:** Subtle background change (`hover:bg-muted/30`)
- **Row click:** First click expands inline to show `qual_answers` (key-value pairs). Second click navigates to `/dashboard/subscribers/:id`
- **Sort indicators:** Arrow icon (↑/↓) on active sorted column. Other sortable columns show faint arrow on hover.
- **Numbers:** Right-aligned, tabular figures (prevents jitter)
- **Text:** Left-aligned
- **Status badges:** Center-aligned
- **Empty state:** "No subscribers yet. Share your link to get started." centered, with icon
- **Subscriber count:** Displayed above table: "X subscribers" in `text-body-sm text-muted-foreground`

### Search + Filter Bar

```
┌──────────────────────────────────────────────────────────────┐
│  [🔍 Search by email...]          [Warmth ▼] [Export CSV]   │
│  42 subscribers                                               │
└──────────────────────────────────────────────────────────────┘
```

- Search input: left side, `bg-card border-border rounded-lg`, placeholder "Search by email"
- Warmth filter: right side, `<select>` dropdown — All / Hot / Warm / Cold / Unscored
- CSV export button: rightmost, Pro tier only, secondary variant
- Subscriber count: below search bar, above table

### Warmth Badge Colors

| State    | Background | Text      | Token                         |
| -------- | ---------- | --------- | ----------------------------- |
| Hot      | `#FEE2E2`  | `#DC2626` | `bg-red-100 text-red-700`     |
| Warm     | `#FEF3C7`  | `#D97706` | `bg-amber-100 text-amber-700` |
| Cold     | `#DBEAFE`  | `#2563EB` | `bg-blue-100 text-blue-700`   |
| Unscored | `#F3F4F6`  | `#6B7280` | `bg-gray-100 text-gray-500`   |

Badge style: `rounded-full px-2 py-0.5 text-xs font-medium`

---

## 8. Secondary Panel Design

### Qualification Breakdown Panel

```
┌─────────────────────────────────────────┐
│  Qualification Breakdown                │
│                                         │
│  How did you hear about us?             │
│  ████████████████░░░░░░  Twitter (15)   │
│  ████████░░░░░░░░░░░░░  Friend (8)     │
│  ████░░░░░░░░░░░░░░░░░  Google (5)     │
│                                         │
│  What's your role?                      │
│  ████████████████████░  Founder (20)    │
│  ██████████░░░░░░░░░░░  Developer (10) │
└─────────────────────────────────────────┘
```

- Horizontal bars, not pie charts (bars are more accurate for comparison)
- Bar fill: `bg-accent` (#0f7a5e) for top answer, `bg-muted` for others
- Max 5 questions shown. If more, show first 5 with "Show all →" link
- Empty state (no questions): "No qualification questions configured"
- Empty state (questions exist, no answers): "No answers yet"

### Top Referrers Panel

```
┌─────────────────────────────────────────┐
│  Top Referrers                          │
│                                         │
│  1. alice@***.com    12 referrals  48%  │
│  2. bob@***.com       8 referrals  32%  │
│  3. carol@***.com     5 referrals  20%  │
│                                         │
│  Share your link to get referrals →     │  ← CTA when 0 referrers
└─────────────────────────────────────────┘
```

- Top 5 referrers by quality score (descending)
- Each row: email (truncated with anonymize), referral count badge, quality %
- Empty state (0 referrers): CTA message, not dead end
- Emails anonymized using existing `anonymizeEmail()` from `src/lib/format.ts`

### Warmth Distribution Panel

```
┌─────────────────────────────────────────┐
│  Warmth Distribution           🔒 Pro   │
│                                         │
│  Hot     ████████████░░░░  12           │
│  Warm    ████████████████████████  25   │
│  Cold    ████░░░░░░░░░░░░░░░░░  8      │
│  —       ██░░░░░░░░░░░░░░░░░░░  5      │
│                                         │
└─────────────────────────────────────────┘
```

- 4 horizontal bars: Hot, Warm, Cold, Unscored
- Bar width: proportional to total (count / total × 100%)
- Bar colors: Hot = `bg-red-400`, Warm = `bg-amber-400`, Cold = `bg-blue-400`, Unscored = `bg-gray-300`
- Locked state (Free tier): blur overlay (`backdrop-blur-sm bg-background/60`), lock icon, "Pro" pill badge
- Empty state: em-dashes for all bars

---

## 9. Color System

### Neutral Palette

| Token                      | Hex       | Use                                             |
| -------------------------- | --------- | ----------------------------------------------- |
| `--color-background`       | `#FAF8F4` | Page background (warm ivory)                    |
| `--color-card`             | `#FFFFFF` | Card/panel backgrounds                          |
| `--color-foreground`       | `#1A1A1A` | Primary text                                    |
| `--color-muted-foreground` | `#6B6B6B` | Secondary text, labels                          |
| `--color-border`           | `#E0DDD8` | Borders, dividers                               |
| Sidebar bg                 | `#FCFCFB` | Sidebar background (slightly lighter than main) |

### Accent Palette

| Token                       | Hex       | Use                                   |
| --------------------------- | --------- | ------------------------------------- |
| `--color-accent`            | `#0F7A5E` | CTAs, active sidebar item, chart bars |
| Accent hover                | `#0D6B52` | Button hover state                    |
| `--color-accent-foreground` | `#FFFFFF` | Text on accent backgrounds            |

### Status Palette (Reserved for alerts/badges ONLY)

| Status           | Background | Text      | Use                               |
| ---------------- | ---------- | --------- | --------------------------------- |
| Success/Hot      | `#FEE2E2`  | `#DC2626` | Hot warmth badge, positive trends |
| Warning/Warm     | `#FEF3C7`  | `#D97706` | Warm warmth badge, caution        |
| Info/Cold        | `#DBEAFE`  | `#2563EB` | Cold warmth badge, neutral        |
| Neutral/Unscored | `#F3F4F6`  | `#6B7280` | Unscored badge, inactive          |
| Error            | `#FEE2E2`  | `#DC2626` | Validation errors only            |

### Color Rules

1. **Never use colored card backgrounds** — cards stay white (`bg-card`)
2. **Reserve saturated color for status/alerts only** — green, red, amber are functional, not decorative
3. **Use the accent color sparingly** — CTAs, active nav item, chart bars. That's it.
4. **Text colors:** Only `text-foreground` and `text-muted-foreground` — no other text colors unless status badge
5. **Consistency:** If "Hot" is red in the warmth panel, it's red everywhere — never reassign

---

## 10. Typography

### Type Scale

| Element         | Size    | Weight | Token                                            | Use                           |
| --------------- | ------- | ------ | ------------------------------------------------ | ----------------------------- |
| KPI value       | 28–32px | 600    | `text-3xl font-semibold`                         | Primary metric number         |
| KPI label       | 12px    | 400    | `text-xs text-muted-foreground`                  | "Total Signups", "Referral %" |
| Section heading | 18px    | 600    | `text-lg font-semibold`                          | Panel titles                  |
| Table header    | 14px    | 500    | `text-body-sm font-medium text-muted-foreground` | Column headers                |
| Table content   | 14px    | 400    | `text-body-sm`                                   | Cell values                   |
| Body text       | 14px    | 400    | `text-body`                                      | Descriptions, helper text     |
| Caption         | 12px    | 400    | `text-caption`                                   | Timestamps, metadata          |

### Typography Rules

- **Use tabular figures** for all numeric data (Inter has built-in tabular figures via `font-variant-numeric: tabular-nums`)
- **Left-align text**, right-align numbers in tables
- **Never center data** — left-aligned is faster to scan
- **Limit text blocks to 60 characters** — longer lines break scan pattern
- **Label vs Value distinction:** Labels in `text-muted-foreground`, values in `text-foreground` with heavier weight. This makes values scannable without reading labels.
- **Truncation:** Define a rule and apply everywhere — don't mix truncation, wrapping, and overflow

---

## 11. Spacing System

| Measurement        | Value                          | Use                                             |
| ------------------ | ------------------------------ | ----------------------------------------------- |
| Page padding       | 24px                           | Between content area edge and cards             |
| Section gap        | 24px                           | Between major sections (chart → panels → table) |
| Card gap           | 16px                           | Between cards in the same row                   |
| Card padding       | 24px                           | Inside every card/panel                         |
| Table row padding  | 12px vertical, 16px horizontal | Inside table rows                               |
| Inline element gap | 8px                            | Between badges, buttons in a row                |
| Input padding      | 12px vertical, 16px horizontal | Search inputs, dropdowns                        |

**Rule:** Don't reduce white space to fit more data. Breathing room creates visual hierarchy and reduces cognitive load. If a panel doesn't fit, move it below the fold — don't compress it.

---

## 12. Empty States

Every component must have a designed empty state. No dead ends.

| Component           | Empty State                                           | CTA                                           |
| ------------------- | ----------------------------------------------------- | --------------------------------------------- |
| Stat cards          | Em-dash "—"                                           | None (data will populate as subscribers join) |
| Signups chart       | "No signups in this period"                           | "Share your link to get started"              |
| Qualification panel | "No qualification questions configured"               | Link to onboarding step 4a                    |
| Top referrers       | "Share your link to get referrals"                    | Link to share page                            |
| Warmth distribution | Em-dashes for all bars                                | "Available in Pro"                            |
| Subscriber table    | "No subscribers yet. Share your link to get started." | Link to share page                            |
| Search results      | "No subscribers match your search"                    | "Clear search" button                         |
| Warmth filter       | "No subscribers match this filter"                    | "Show all" button                             |

---

## 13. Loading States

- **Skeleton screens preferred** over spinners — content-shaped placeholders with shimmer animation
- Skeleton shape must match actual content shape (card-shaped boxes, row-shaped strips)
- Use `bg-muted animate-pulse` for shimmer effect
- **Priority loading:** Load KPI cards first, chart second, table last
- No spinners anywhere on the dashboard

---

## 14. Mobile Responsiveness

### Breakpoints

| Breakpoint | Behavior                                   |
| ---------- | ------------------------------------------ |
| >1024px    | Full desktop layout: sidebar + 12-col grid |
| 768–1024px | Sidebar collapsed, 2-column cards          |
| <768px     | Sidebar as overlay, single-column stack    |

### Mobile Rules

1. **Don't squish desktop into mobile** — redesign for the viewport
2. **KPI cards:** Stack vertically (full width each)
3. **Chart:** Horizontal scroll with `min-width: 400px` — don't degrade to a list
4. **Tables:** Horizontal scroll with fixed first column, or card-based layout
5. **Panels:** Stack vertically (full width each)
6. **Sidebar:** Hamburger toggle, overlay with backdrop
7. **Touch targets:** Min 44×44px for all interactive elements
8. **Filters:** Collapse into a dropdown menu, not inline

---

## 15. Anti-Patterns to Avoid

| Anti-Pattern              | Why                                  | Do Instead                           |
| ------------------------- | ------------------------------------ | ------------------------------------ |
| 14+ KPI cards             | Users ignore most within 2 weeks     | Max 4–6 cards                        |
| Colored card backgrounds  | Trains users to ignore color         | White cards, colored text/badges     |
| Pie charts with >3 slices | Humans can't compare angles          | Horizontal bar chart                 |
| 3D charts                 | Distorts data perception             | Flat 2D                              |
| Gridlines everywhere      | Visual noise, reduces data-ink ratio | Remove or make very subtle           |
| Spinner loading           | Feels slow, no content expectation   | Skeleton screens                     |
| "No data" dead ends       | Feels broken                         | Helpful message + CTA                |
| Centered data text        | Slower to scan                       | Left-align text, right-align numbers |
| Shadows on cards          | Dated look, adds noise               | Borders only                         |
| Color as category         | 5+ colors become unreadable          | Line style, order, or labels         |

---

## 16. Component Checklist for Story 9.6

Before marking any task complete, verify against this checklist:

- [ ] Card uses `bg-card`, `border-border`, `rounded-[var(--card-radius)]`, `p-5`
- [ ] No shadows used anywhere
- [ ] KPI value is 28–32px semibold
- [ ] KPI label is 12px muted
- [ ] Section heading is 18px semibold
- [ ] Table numbers are right-aligned
- [ ] Table text is left-aligned
- [ ] Status badges use the correct color tokens (not arbitrary colors)
- [ ] Empty state has helpful message + CTA
- [ ] Loading state uses skeleton, not spinner
- [ ] Color is only used for status/alerts — never decoration
- [ ] Spacing between sections is 24px
- [ ] Spacing between cards in a row is 16px
- [ ] Card padding is 24px
- [ ] Chart starts Y-axis at zero
- [ ] Chart has no legend (single series)
- [ ] Tooltip shows exact values on hover
- [ ] Mobile layout stacks cards vertically
- [ ] Touch targets are ≥44px
- [ ] No centered data text
- [ ] All text uses design system tokens — no hardcoded hex

---
id: epic9.story00
epic: epic-9-dashboard-restructure
title: Dashboard Layout Shell
status: ready
depends_on: []
updated: 2026-08-31
---

# Story 9.0 — Dashboard Layout Shell

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg`, `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`

**Story:** As a founder, I want the dashboard to use a left-sidebar navigation layout so that I can easily navigate between dashboard sections.

## Design Specs (from SVG analysis + align-design)

**Empty state (Dashboard_Empty_state_HF4.svg):**

- Canvas: 1440×1126px, `#FAF8F4` background
- Left sidebar: 268px wide, bg `#FCFCFB` (warm white, slightly lighter than main bg)
- Sidebar top: PreWaitlist logo + waitlist name in green bordered box (`#0F7A5E` stroke, 1px) with dropdown chevron (▼)
- Sidebar nav: 8 items — Overview, Subscribers, Qualification, Leaderboard, Warmth (locked 🔒), Updates, Broadcast (locked 🔒), Settings
  - Active item: Green filled pill (`bg-accent rounded-full`), white text (`text-accent-foreground`)
  - Inactive item: `text-muted-foreground`, no hover effect
  - Locked items (Warmth, Broadcast): `opacity-50 cursor-not-allowed` with lock icon
  - Each nav item has an icon (chart, people, check, trophy, flame, bell, megaphone, gear)
- Sidebar bottom: "Upgrade to pro" button (dashed green border) + "Sign out" button
- Main content area: bg `#FAF8F4` (warm ivory), `ml-[268px]` on desktop
- Top bar: Domain slug (e.g. "yourslug.prewaitlist.com") in green text + copy icon + "Share on Twitter" button + checkmark icon
- Main heading: "Get your first signups" (large, bold)
- Share CTA: Large "Share your link →" green button
- Checklist: "Post in one relevant community", "Tell 5 people personally" with checkboxes
- Preview section: "Preview — this is what it'll look like once signups arrive"
- Stat cards row: 4 white cards (Total signups, Referral %, Today, Warmth locked 🔒)
- Subscriber table: 4 columns (#, Email, Date, Referrals)

**Active state (Dashboard_active_state_HF5.svg):**

- Same sidebar layout as empty state
- Active nav item: Green filled pill (same as empty state)
- Sidebar shows waitlist name with green bordered box + dropdown
- Stat cards show real data values
- Subscriber table populated with real data
- Bar chart below stat cards (out of scope for Epic 9)
- "Pending Rewards" card below table (out of scope for Epic 10)

**Mobile (≤768px):**

- Sidebar collapses to hamburger menu
- Main content takes full width
- Sidebar overlay when open

## Acceptance Criteria (EARS)

- AC1: The dashboard shall render a persistent left sidebar with a width of 268px and `#FCFCFB` background.
- AC2: The sidebar shall display the PreWaitlist logo and waitlist name in a green bordered box (`border border-accent rounded-lg`) with a dropdown chevron.
- AC3: The sidebar shall display 8 navigation items: Overview, Subscribers, Qualification, Leaderboard, Warmth (locked), Updates, Broadcast (locked), Settings — each with an icon.
- AC4: The Overview and Subscribers items shall be clickable links. Qualification, Leaderboard, Updates, and Settings shall be visually present but disabled (grayed out, no hover effect). Warmth and Broadcast shall show a lock icon (Pro-only features).
- AC5: The active navigation item shall use a green filled pill background (`bg-accent rounded-full`) with white text (`text-accent-foreground`).
- AC6: The sidebar bottom shall contain an "Upgrade to pro" button (dashed green border) and a "Sign out" button.
- AC7: The main content area shall have a background color of `#FAF8F4` (warm ivory) and `ml-[268px]` on desktop.
- AC8: The main content area shall include a top bar with domain slug, copy icon, "Share on Twitter" button, and checkmark icon.
- AC9: The main content area shall display "Get your first signups" heading, "Share your link →" CTA button, checklist section, and preview section.
- AC10: The sidebar shall collapse to a hamburger menu on mobile viewports (≤768px).
- AC11: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC3): Create sidebar component with logo, bordered waitlist name, 8 nav items with icons, and locked states
- T2 (AC4-AC5): Active state (green pill) + disabled/locked states for placeholder items
- T3 (AC6): Sidebar bottom with Upgrade button + Sign out
- T4 (AC7-AC9): Main content area layout with top bar, heading, CTA, checklist, preview
- T5 (AC10): Mobile responsive sidebar collapse
- T6 (AC11): Lint + build verification

## Out of scope

Sidebar search/filter (Story 9.2), stat cards (Story 9.1), subscriber table redesign (Story 9.2), bar chart (placeholder), "Pending Rewards" card (Epic 10).

## Ambiguity Resolutions

- **Sign-out button:** Header is being removed (replaced by sidebar). Move sign-out to sidebar bottom (within scope — necessary consequence of replacing the header). Design SVGs show sign-out at sidebar bottom.
- **Sidebar bg `#FCFCFB`:** Not a design token. AGENTS.md says "never use hardcoded hex" but this is a one-off layout color. Resolution: Use `bg-[#FCFCFB]` — matches existing pattern for layout-specific values.
- **8 nav items vs 4:** Design SVGs show 8 items (Overview, Subscribers, Qualification, Leaderboard, Warmth, Updates, Broadcast, Settings). Story originally listed only 4. Updated to match design.
- **Active nav style:** Design uses green filled pill (`bg-accent rounded-full`), NOT left-border indicator. Updated from original spec.
- **Locked items:** Warmth and Broadcast show lock icons (Pro-only features). Other items (Qualification, Leaderboard, Updates, Settings) are disabled but not locked.

## Dev Notes

### T1 — Sidebar Component

Create `components/dashboard/sidebar.tsx` as a client component (needs `usePathname` for active state).

**Key details:**

- Sidebar bg: `#FCFCFB` (from design SVG `fill="#FCFCFB"` at x=0-268px). Use `bg-[#FCFCFB]`.
- Logo area: Green bordered box (`border border-accent rounded-lg`) with logo image + waitlist name + dropdown chevron (▼).
- Nav items: 8 items with icons. Use SVG icons for each item.
- Active nav: `bg-accent rounded-full text-accent-foreground font-medium` (green pill).
- Inactive nav: `text-muted-foreground`, no hover effect.
- Locked items (Warmth, Broadcast): `opacity-50 cursor-not-allowed` with lock icon (🔒 SVG).
- Disabled items (Qualification, Leaderboard, Updates, Settings): `opacity-50 cursor-not-allowed`, no lock icon.
- Mobile: `translate-x` transition with overlay backdrop. Toggle via `isOpen` prop.
- Logo: use `unoptimized` for user-provided URLs (project convention from Story 1.6).

### T2 — Active/Disabled/Locked States

Already handled in T1. Active state uses green pill. Locked items render as `<span>` with lock icon. Disabled items render as `<span>` without lock icon.

### T3 — Sidebar Bottom

"Upgrade to pro" button: dashed green border (`border-dashed border-accent`), accent text.
"Sign out" button: below upgrade, `text-muted-foreground`, hover effect.

### T4 — Main Content Area

Wrap dashboard page content in `<main>` with `ml-[268px]` on desktop:

```tsx
<main className="min-h-screen bg-background lg:ml-[268px]">
  {/* top bar */}
  {/* page content */}
</main>
```

Top bar: Domain slug + copy icon + "Share on Twitter" button + checkmark icon.
Main heading: "Get your first signups" (large, bold).
Share CTA: Large "Share your link →" green button.
Checklist: Two items with checkboxes.
Preview section: "Preview — this is what it'll look like once signups arrive".

### T5 — Mobile Responsive

Add mobile hamburger button (floating, top-left):

```tsx
<button
  type="button"
  onClick={() => setIsSidebarOpen(true)}
  className="fixed top-4 left-4 z-30 rounded-lg border border-border bg-card p-2 lg:hidden"
>
```

### T6 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files created:**

- `components/dashboard/sidebar.tsx`

**Files modified:**

- `src/app/dashboard/client.tsx` (replace top-tab header with sidebar layout, add top bar, heading, CTA, checklist, preview)
- `src/app/dashboard/page.tsx` (pass `logoUrl` to client component for sidebar)

**Available components:** `cn()` ✓, `Image` (next/image) ✓
**Available tokens:** `bg-background` (#FAF8F4), `bg-[#FCFCFB]` (sidebar), `border-border` (#CCC9C3), `text-foreground`, `text-muted-foreground`, `bg-accent`, `text-accent-foreground`, `border-accent`

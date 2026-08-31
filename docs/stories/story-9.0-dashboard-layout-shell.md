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

## Design Specs (from SVG analysis)

**Empty state (Dashboard_Empty_state_HF4.svg):**

- Canvas: 1440×947px
- Left sidebar: 268px wide, bg `#FCFCFB` (warm white, slightly lighter than main bg)
- Sidebar top: PreWaitlist logo + waitlist name (e.g. "Waitly") with green border (`#0F7A5E`)
- Sidebar nav: 4 items — Overview, Subscribers, Broadcasts, Settings
  - Active item: left accent border, `text-foreground font-semibold`, `bg-accent/5`
  - Inactive item: `text-muted-foreground`, no hover effect
  - Placeholder items (Broadcasts, Settings): `opacity-50 cursor-not-allowed`, grayed
- Sidebar bottom: "Sign out" button
- Main content area: bg `#FAF8F4` (warm ivory), `ml-[268px]` on desktop
- Main content top: stat cards row (4 green cards), then subscriber table

**Active state (Dashboard_active_state_HF5.svg):**

- Same sidebar layout as empty state
- Active nav item: Overview has left accent border + bold text
- Sidebar shows waitlist name with green left border (`#0F7A5E` stroke)
- Sign-out button at bottom of sidebar

**Mobile (≤768px):**

- Sidebar collapses to hamburger menu
- Main content takes full width
- Sidebar overlay when open

## Acceptance Criteria (EARS)

- AC1: The dashboard shall render a persistent left sidebar with a width of 268px.
- AC2: The sidebar shall display the PreWaitlist logo and waitlist name at the top.
- AC3: The sidebar shall display navigation items: Overview, Subscribers, Broadcasts (placeholder), Settings (placeholder).
- AC4: The Overview and Subscribers items shall be clickable links. Broadcasts and Settings shall be visually present but disabled (grayed out, no hover effect).
- AC5: The main content area shall have a background color of `#FAF8F4` (warm ivory).
- AC6: The sidebar shall collapse to a hamburger menu on mobile viewports (≤768px).
- AC7: The active navigation item shall be visually highlighted (bold text, accent color indicator).
- AC8: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC3): Create sidebar component with logo, waitlist name, and nav items
- T2 (AC4): Disabled state for Broadcasts and Settings placeholder items
- T3 (AC5-AC6): Main content area layout + mobile responsive sidebar collapse
- T4 (AC7): Active state highlighting with accent border and bold text
- T5 (AC8): Lint + build verification

## Out of scope

Sidebar sign-out button (keep existing header sign-out for now), sidebar search/filter (Story 9.2), sidebar subscriber list (Story 9.2), stat cards (Story 9.1), subscriber table redesign (Story 9.2).

## Dev Notes

### T1 — Sidebar Component

Create `components/dashboard/sidebar.tsx` as a client component (needs `usePathname` for active state).

```tsx
"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface SidebarProps {
  waitlistName: string | null;
  logoUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", disabled: false },
  { label: "Subscribers", href: "/dashboard/subscribers", disabled: false },
  { label: "Broadcasts", href: "#", disabled: true },
  { label: "Settings", href: "#", disabled: true },
];

export function Sidebar({
  waitlistName,
  logoUrl,
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[268px] bg-[#FCFCFB] border-r border-border
          transition-transform duration-200
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo + waitlist name */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={waitlistName || "Logo"}
              width={32}
              height={32}
              className="rounded"
              unoptimized
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/10">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-accent"
              >
                <path
                  d="M2 4L8 2L14 4V12L8 14L2 12V4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
          <span className="text-body-sm font-semibold text-foreground truncate">
            {waitlistName || "PreWaitlist"}
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return item.disabled ? (
              <span
                key={item.label}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm text-muted-foreground opacity-50 cursor-not-allowed"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm transition-colors
                  ${
                    isActive
                      ? "font-semibold text-foreground bg-accent/5 border-l-2 border-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border px-3 py-4">
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 w-full"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
```

**Key details:**

- Sidebar bg: `#FCFCFB` (from design SVG `fill="#FCFCFB"` at x=0-268px). Use inline hex since this isn't a design token — it's a one-off layout color.
- Active nav: `border-l-2 border-accent` + `bg-accent/5` + `font-semibold text-foreground`.
- Disabled nav: `opacity-50 cursor-not-allowed`, no `href`, no hover effect.
- Mobile: `translate-x` transition with overlay backdrop. Toggle via `isOpen` prop.
- Logo: use `unoptimized` for user-provided URLs (project convention from Story 1.6).

### T2 — Disabled State

Already handled in T1. Disabled items render as `<span>` (not `<Link>`), with `opacity-50 cursor-not-allowed`. No `href` attribute means no navigation. No hover class.

### T3 — Main Content Area + Mobile

Wrap the dashboard page content in a `<main>` with `ml-[268px]` on desktop, full-width on mobile:

```tsx
<main className="min-h-screen bg-background lg:ml-[268px]">
  {/* page content */}
</main>
```

Add mobile hamburger button to the header (or as a floating button):

```tsx
<button
  type="button"
  onClick={() => setIsSidebarOpen(true)}
  className="fixed top-4 left-4 z-30 rounded-lg border border-border bg-card p-2 lg:hidden"
>
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M3 5H17M3 10H17M3 15H17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
</button>
```

### T4 — Active State Highlighting

Use `usePathname()` from `next/navigation` to detect current route. Match against `item.href`:

```tsx
const pathname = usePathname();
const isActive = pathname === item.href;
```

Active state: `font-semibold text-foreground bg-accent/5 border-l-2 border-accent`.
Inactive state: `text-muted-foreground hover:text-foreground hover:bg-muted/50`.

### T5 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files created:**

- `components/dashboard/sidebar.tsx`

**Files modified:**

- `src/app/dashboard/client.tsx` (replace top-tab header with sidebar layout)
- `src/app/dashboard/page.tsx` (pass `logoUrl` to client component for sidebar)

**Available components:** `cn()` ✓, `Image` (next/image) ✓
**Available tokens:** `bg-background` (#FAF8F4), `border-border` (#CCC9C3), `text-foreground`, `text-muted-foreground`, `bg-accent/5`, `border-accent`

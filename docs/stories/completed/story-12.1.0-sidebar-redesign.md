# Story 12.1.0 — Sidebar Redesign

**Epic:** 12.1 — Dashboard Overhaul
**Status:** ready
**Depends on:** —
**Design Refs:** `docs/design/High-fidelity-svgs/Dashboard_Empty_state_HF4.svg`, `docs/design/High-fidelity-svgs/Dashboard_active_state_HF5.svg`

## Story

As a founder, I want the sidebar to use grouped navigation with clear labels and tooltips so that I can easily find and understand each section.

## Acceptance Criteria (EARS)

- AC1: The sidebar shall group navigation items into 4 sections: COMMAND CENTER (Overview, Subscribers), INSIGHTS (Qualification, Leaderboard, Warmth), ENGAGEMENT (Updates, Broadcast), CONFIG (Settings).
- AC2: Section headers shall use `text-overline` styling with `text-muted-foreground` color and uppercase letter-spacing.
- AC3: Disabled items (Qualification, Leaderboard, Updates) shall display a "Coming soon" label in `text-xs text-muted-foreground` to the right of the nav label.
- AC4: Locked items (Warmth, Broadcast for Free tier) shall display a lock icon and a `title` attribute on hover reading "Pro feature — upgrade to unlock".
- AC5: The product name button at the top shall NOT display a dropdown chevron arrow — single waitlist only.
- AC6: The "Upgrade to Pro" button at the bottom shall be removed from the sidebar (upgrade CTA will be contextual in other stories).
- AC7: The active nav item shall use a green pill background (`bg-accent text-accent-foreground`) matching current behavior.
- AC8: The sidebar shall remain 268px (`w-67`) on desktop, hamburger on mobile.
- AC9: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Grouped nav sections with overline headers · T2 (AC3) "Coming soon" labels on disabled items · T3 (AC4) Tooltip on locked items · T4 (AC5-AC6) Remove dropdown chevron and upgrade button · T5 (AC7-AC8) Verify active state and responsive behavior · T6 (AC9) Lint + build

## Out of Scope

Sidebar subscriber count badge, sidebar search, sign-out button relocation (keep existing), new nav items beyond current 8.

## Implementation Details

### T1: Grouped nav sections with overline headers

- **File to modify:** `components/dashboard/sidebar.tsx`

Replace the flat `NAV_ITEMS` array (lines 18–215) with a grouped structure:

```typescript
interface NavSection {
  title: string;
  items: typeof NAV_ITEMS;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "COMMAND CENTER",
    items: [
      // Overview + Subscribers (keep existing SVG icons)
    ],
  },
  {
    title: "INSIGHTS",
    items: [
      // Qualification, Leaderboard, Warmth
    ],
  },
  {
    title: "ENGAGEMENT",
    items: [
      // Updates, Broadcast
    ],
  },
  {
    title: "CONFIG",
    items: [
      // Settings
    ],
  },
];
```

Each section renders a header before its items:

```tsx
<nav className="flex flex-1 flex-col gap-1 px-3 py-4">
  {NAV_SECTIONS.map((section) => (
    <div key={section.title} className="mb-2">
      <span className="block px-3 py-1 text-overline text-muted-foreground">
        {section.title}
      </span>
      {section.items.map((item) => {
        // existing render logic per item
      })}
    </div>
  ))}
</nav>
```

The `text-overline` CSS preset is defined in `globals.css` and applies uppercase + letter-spacing.

### T2: "Coming soon" labels on disabled items

For items with `disabled: true` (Qualification, Leaderboard, Updates), add a label after the nav text:

```tsx
if (isDisabled) {
  return (
    <span
      key={item.label}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm text-muted-foreground opacity-50 cursor-not-allowed"
    >
      {item.icon}
      {item.label}
      <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
    </span>
  );
}
```

Currently disabled items (lines 347–356) have no explanation — this adds clarity.

### T3: Tooltip on locked items

Add a `title` attribute to the locked item's `<span>` for a native browser tooltip:

```tsx
if (isLocked) {
  return (
    <span
      key={item.label}
      title="Pro feature — upgrade to unlock"
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm text-muted-foreground opacity-50 cursor-not-allowed"
    >
      {item.icon}
      {item.label}
      {/* existing lock icon SVG */}
    </span>
  );
}
```

No custom tooltip component needed for MVP — native `title` is accessible and zero-cost.

### T4: Remove dropdown chevron and upgrade button

**Remove chevron (lines 280–297):** Delete the `<svg>` element that shows the dropdown arrow on the product name button. The button should just show the logo + name.

**Remove upgrade button (lines 378–384):** Delete the entire `<Link href="#" ...>Upgrade to pro</Link>` element. Keep the sign-out button.

After removal, the bottom section should only contain:

```tsx
<div className="border-t border-border px-3 py-4">
  <button
    type="button"
    onClick={onSignOut}
    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-body-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
  >
    Sign out
  </button>
</div>
```

### T5: Verify active state and responsive behavior

- Active state (lines 359–374) already uses `bg-accent font-medium text-accent-foreground` with `rounded-full` — verify it works within the grouped layout.
- Sidebar width `w-67` (line 239) and mobile hamburger behavior (lines 230–235, 254–267 in `client.tsx`) remain unchanged.
- Test: navigate to each route, confirm the correct item highlights.

### T6: Lint + build

Run `pnpm lint` and `pnpm build`. Fix any TypeScript errors from the grouped structure.

## Verification

1. Open dashboard — sidebar shows 4 grouped sections with overline headers
2. Disabled items (Qualification, Leaderboard, Updates) show "Coming soon" label
3. Locked items (Warmth, Broadcast for Free) show lock icon + tooltip on hover
4. Product name button has no chevron arrow
5. "Upgrade to Pro" button is gone from sidebar bottom
6. Sign-out button still works
7. Active nav item highlights with green pill
8. Mobile hamburger still opens/closes sidebar
9. `pnpm lint` and `pnpm build` pass with zero errors

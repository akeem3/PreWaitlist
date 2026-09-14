# Story 12.2.16 — Dashboard Sidebar Waitlist Switcher

**Epic:** 12.2 — Gap Fixes
**Status:** ready
**Depends on:** 12.2.15
**Design Refs:** — (uses existing design system tokens)

## Story

As a founder with multiple waitlists, I want a dropdown switcher in the sidebar header so that I can quickly switch between waitlists without leaving the dashboard.

## Acceptance Criteria (EARS)

- AC1: The sidebar header shall display the current waitlist name and logo (as it does now), with a small dropdown chevron indicator.
- AC2: Clicking the waitlist name/logo area shall open a dropdown menu listing all waitlists for the founder.
- AC3: Each dropdown item shall show: waitlist name (or "Untitled" if null), subdomain, subscriber count, and an "Archived" badge if `is_archived === true`.
- AC4: The active waitlist in the dropdown shall have a green accent background (`bg-accent/10`) and checkmark icon.
- AC5: Clicking a waitlist in the dropdown shall navigate to `/dashboard` and set that waitlist as active.
- AC6: The dropdown shall include a "Create new waitlist" button at the bottom, linking to `/onboarding/1`.
- AC7: The active waitlist shall be persisted in `localStorage` (key: `active_waitlist_id`) so it survives page reloads.
- AC8: On first load, if no `active_waitlist_id` is set in localStorage, default to the most recently created waitlist (last in array).
- AC9: If the founder has only one waitlist, the dropdown shall still function but show only that waitlist + "Create new waitlist".
- AC10: The dropdown shall close when clicking outside (click-outside handler) or pressing Escape (keyboard handler).
- AC11: The dropdown shall be scrollable if the list exceeds viewport height (max-height with overflow-y-auto).
- AC12: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC4) WaitlistSwitcher component — dropdown with waitlist list · T2 (AC5-AC6) Navigation + create new button · T3 (AC7-AC8) localStorage persistence + default selection · T4 (AC9-AC11) Edge cases — single waitlist, click-outside, scroll · T5 (AC12) Lint + build

## Out of Scope

Dashboard data scoping (Story 12.2.17), onboarding flow changes.

## Implementation Details

### T1: WaitlistSwitcher component

Create new file: `components/dashboard/waitlist-switcher.tsx`

```typescript
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Waitlist {
  id: string;
  product_name: string | null;
  subdomain: string;
  logo_url: string | null;
  is_archived: boolean | null;
  subscriber_count: number;
}

interface WaitlistSwitcherProps {
  waitlists: Waitlist[];
  activeWaitlistId: string;
}

export default function WaitlistSwitcher({
  waitlists,
  activeWaitlistId,
}: WaitlistSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const activeWaitlist = waitlists.find((w) => w.id === activeWaitlistId);

  // Click-outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (waitlistId: string) => {
      localStorage.setItem("active_waitlist_id", waitlistId);
      setIsOpen(false);
      router.push("/dashboard");
      router.refresh();
    },
    [router]
  );

  if (!activeWaitlist) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
      >
        {activeWaitlist.logo_url ? (
          <img
            src={activeWaitlist.logo_url}
            alt=""
            className="h-8 w-8 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <span className="text-body-sm font-semibold">
              {(activeWaitlist.product_name ?? activeWaitlist.subdomain)[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0 text-left">
          <p className="truncate text-body-sm font-medium text-foreground">
            {activeWaitlist.product_name || "Untitled"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {activeWaitlist.subdomain}.prewaitlist.com
          </p>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
          {waitlists.map((wl) => (
            <button
              key={wl.id}
              onClick={() => handleSelect(wl.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                wl.id === activeWaitlistId ? "bg-accent/10" : ""
              }`}
            >
              {wl.logo_url ? (
                <img
                  src={wl.logo_url}
                  alt=""
                  className="h-6 w-6 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <span className="text-xs font-medium">
                    {(wl.product_name ?? wl.subdomain)[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-body-sm text-foreground">
                    {wl.product_name || "Untitled"}
                  </p>
                  {wl.is_archived && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Archived
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {wl.subdomain}.prewaitlist.com · {wl.subscriber_count} subscriber{wl.subscriber_count !== 1 ? "s" : ""}
                </p>
              </div>
              {wl.id === activeWaitlistId && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="shrink-0 text-accent"
                >
                  <path
                    d="M3 8L6.5 11.5L13 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}

          {/* Create new waitlist */}
          <div className="border-t border-border">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/onboarding/1");
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-accent transition-colors hover:bg-accent/5"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-accent/50">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M6 2V10M2 6H10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-body-sm font-medium">Create new waitlist</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### T2: Dashboard layout — pass all waitlists to shell

**File to modify:** `src/app/dashboard/layout.tsx`

**Current behavior (line 20-25):** Queries waitlists, takes `waitlists?.[0]`.

**New behavior:** Passes all waitlists + active waitlist ID to shell.

```typescript
// Replace lines 20-28 with:
const { data: waitlists } = await supabase
  .from("waitlists")
  .select("id, subdomain, product_name, logo_url, is_archived")
  .eq("founder_id", user.id)
  .order("created_at", { ascending: true });

if (!waitlists || waitlists.length === 0) {
  redirect("/onboarding/1");
}

// For initial render, default to first waitlist.
// Client-side will override with localStorage value.
const activeWaitlistId = waitlists[waitlists.length - 1].id;
```

Update the `DashboardShell` props to include `waitlists` and `activeWaitlistId`:

```typescript
return (
  <DashboardShell
    waitlists={waitlists}
    activeWaitlistId={activeWaitlistId}
    tier={profile?.tier ?? "free"}
    waitlistId={activeWaitlistId}
  >
    {children}
  </DashboardShell>
);
```

### T3: Dashboard shell — pass waitlists to sidebar

**File to modify:** `src/app/dashboard/shell.tsx`

Add `waitlists` and `activeWaitlistId` props. Pass them to `<Sidebar>`.

```typescript
interface DashboardShellProps {
  waitlists: Array<{
    id: string;
    product_name: string | null;
    subdomain: string;
    logo_url: string | null;
    is_archived: boolean | null;
  }>;
  activeWaitlistId: string;
  tier: string;
  waitlistId: string;
  children: React.ReactNode;
}
```

In the sidebar rendering, pass the new props:

```typescript
<Sidebar
  waitlists={waitlists}
  activeWaitlistId={activeWaitlistId}
  tier={tier}
  waitlistId={waitlistId}
  // ... other existing props
/>
```

### T4: Sidebar — replace static header with WaitlistSwitcher

**File to modify:** `components/dashboard/sidebar.tsx`

Replace the static waitlist name/logo section (the clickable card at the top of the sidebar) with the `<WaitlistSwitcher>` component.

```typescript
import WaitlistSwitcher from "./waitlist-switcher";

// In the sidebar component, replace the static header:
<WaitlistSwitcher
  waitlists={waitlists}
  activeWaitlistId={activeWaitlistId}
/>
```

Remove the existing static waitlist name/logo rendering and the `waitlistName`/`logoUrl` props from the Sidebar interface (they're now handled by WaitlistSwitcher).

### T5: localStorage persistence

**In the WaitlistSwitcher component** (already handled in T1):

- `handleSelect` saves to `localStorage.setItem("active_waitlist_id", wl.id)`
- On page load, the layout reads `active_waitlist_id` from localStorage (client-side)

**Add to `src/app/dashboard/shell.tsx`** (or a client-side effect in layout):

```typescript
"use client";

import { useEffect, useState } from "react";

// In DashboardShell or a wrapper:
const [resolvedWaitlistId, setResolvedWaitlistId] = useState(activeWaitlistId);

useEffect(() => {
  const stored = localStorage.getItem("active_waitlist_id");
  if (stored && waitlists.some((w) => w.id === stored)) {
    setResolvedWaitlistId(stored);
  }
}, [waitlists, activeWaitlistId]);
```

**Important:** The server-rendered layout uses `activeWaitlistId` (most recent). The client-side effect overrides with localStorage value if valid. This avoids hydration mismatch.

### T6: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Sidebar shows current waitlist name + logo + chevron
2. Click chevron → dropdown opens with all waitlists
3. Each item shows name, subdomain, subscriber count, archived badge
4. Active waitlist has green background + checkmark
5. Click different waitlist → navigates to /dashboard, data refreshes
6. "Create new waitlist" at bottom → navigates to /onboarding/1
7. Refresh page → correct waitlist still selected (localStorage)
8. Click outside dropdown → closes
9. Press Escape → closes
10. Scroll through long list → dropdown scrolls
11. Only one waitlist → dropdown shows that waitlist + create button
12. `pnpm lint` and `pnpm build` pass with zero errors

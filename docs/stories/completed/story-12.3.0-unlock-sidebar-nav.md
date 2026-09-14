# Story 12.3.0 — Unlock Sidebar Nav Items

**Epic:** 12.3 — Dashboard Section Pages
**Status:** ready
**Depends on:** —
**Design Refs:** —

## Story

As the founder, I want every sidebar nav item to be clickable and navigate to a real page so that the dashboard feels complete.

## Acceptance Criteria (EARS)

- AC1: The "Updates" nav item shall be clickable (no "Coming soon" label) and navigate to `/dashboard/updates`.
- AC2: The "Qualification" nav item shall be clickable (no "Coming soon" label) and navigate to `/dashboard/qualification`.
- AC3: The "Leaderboard" nav item shall be clickable (no "Coming soon" label) and navigate to `/dashboard/leaderboard`.
- AC4: The "Warmth" nav item shall be clickable for Pro tier and navigate to `/dashboard/warmth`. For Free tier, it shall remain locked with the "Pro feature" tooltip.
- AC5: All four nav items shall have corresponding route pages that render without errors.
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC4) Update sidebar nav items · T2 (AC5) Create placeholder route pages · T3 (AC6) Lint + build

## Out of Scope

Full page content (covered by stories 12.3.1–12.3.3).

## Implementation Details

### T1: Update sidebar nav items

- **File:** `components/dashboard/sidebar.tsx`

In `NAV_SECTIONS`, for each of the four items:

**Updates** (ENGAGEMENT section):

- Remove `disabled: true` from the item definition
- Set `href: "/dashboard/updates"`
- Remove the "Coming soon" label

**Qualification** (INSIGHTS section):

- Remove `disabled: true`
- Set `href: "/dashboard/qualification"`
- Remove "Coming soon" label

**Leaderboard** (INSIGHTS section):

- Remove `disabled: true`
- Set `href: "/dashboard/leaderboard"`
- Remove "Coming soon" label

**Warmth** (INSIGHTS section):

- Remove `locked: true` from the item definition (the `isLocked` logic at line 346 already handles `tier === "free"` conditionally)
- Set `href: "/dashboard/warmth"`

After changes, the Warmth item should be:

- Free tier: locked (via `isLocked` check `item.label === "Warmth" && tier === "free"`) — shows lock icon + tooltip
- Pro tier: unlocked, navigates to `/dashboard/warmth`

### T2: Create placeholder route pages

Create three stub pages:

**`src/app/dashboard/qualification/page.tsx`**:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export default async function QualificationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .single();
  if (!waitlist) redirect("/onboarding/1");

  return <div>Qualification — coming in 12.3.2</div>;
}
```

**`src/app/dashboard/leaderboard/page.tsx`** — same pattern.

**`src/app/dashboard/warmth/page.tsx`** — same pattern, plus tier check:

```tsx
const { data: profile } = await supabase
  .from("founder_profiles")
  .select("tier")
  .eq("id", user.id)
  .single();
if (profile?.tier !== "pro") redirect("/dashboard");
```

### T3: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. All sidebar nav items are clickable (no "Coming soon" labels)
2. Updates navigates to `/dashboard/updates` (existing page)
3. Qualification, Leaderboard, Warmth navigate to their stub pages
4. Warmth is locked for Free tier, unlocked for Pro
5. `pnpm lint` and `pnpm build` pass

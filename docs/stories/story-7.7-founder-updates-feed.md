---
id: epic7.story07
epic: epic-7-public-waitlist-page
title: Founder Updates Feed Display
status: ready
depends_on: [epic7.story06]
updated: 2026-08-25
---

# Story 7.7 — Founder Updates Feed Display

**Status:** ready
**Design Refs:** — (no high-fidelity SVG for updates feed yet)

**Story:** As a visitor, I want to see the founder's latest update on the public waitlist page so that I can stay informed about the product's progress.

## Current State

- **Story 7.6** (email-first update mechanism) must be completed first — it rewrites the updates system from a full on-page feed to email-first delivery with a single "Latest update" card.
- **After Story 7.6:** The `UpdatesFeed` component (`components/public/updates-feed.tsx`) has been rewritten to `LatestUpdateCard` — a single-card display of the most recent update, positioned above the email capture form.
- **`WaitlistPageContent`** (`components/public/waitlist-page-content.tsx`) now accepts a `latestUpdate` prop and renders the card above the form slot.
- **RLS public read policy** already applied to `founder_updates` table — can query directly from RSC.
- **Updates data shape:** `{ body: string, created_at: string }` — from `founder_updates` table (only the latest record).

## Acceptance Criteria (EARS)

- AC1: The system shall fetch the most recent `founder_updates` record for the waitlist from the `founder_updates` table where `waitlist_id` matches, selecting `body` and `created_at`, ordered by `created_at` descending, limited to 1.
- AC2: The update shall display the `body` text and `created_at` timestamp in a card layout.
- AC3: If no updates exist, the card shall not render at all (conditional rendering).
- AC4: The card shall render above the email capture form on the public waitlist page (`/:subdomain`).
- AC5: The card shall use the design system's typography: body text in `text-body`, timestamp in `text-caption text-muted-foreground`, card label "Latest update" in `text-caption text-muted-foreground`.
- AC6: The leaderboard page shall not display founder updates.
- AC7: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC2): Fetch latest update + render as card
- T2 (AC3-AC6): Conditional rendering + positioning + leaderboard exclusion
- T3 (AC7): Lint + build verification

## Out of scope

Update creation UI (Sprint 1 — POST /api/updates is complete), update editing/deletion (not planned), real-time updates (Sprint 3), email dispatch (handled by Story 7.6).

## Dev Notes

### T1 — Fetch Latest Update + Render as Card

This story assumes Story 7.6 has already:

1. Rewritten `components/public/updates-feed.tsx` to `LatestUpdateCard`
2. Added `latestUpdate` prop to `WaitlistPageContent` and `WaitlistTemplateContent`
3. Changed `page.tsx` to fetch only the latest update

If Story 7.6 is complete, T1 is verification only. If not, implement the fetch and card component per Story 7.6's T3 spec.

**Fetch in page.tsx:**

```ts
const { data: latestUpdate } = await supabase
  .from("founder_updates")
  .select("body, created_at")
  .eq("waitlist_id", waitlist.id)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();
```

**LatestUpdateCard component:**

```tsx
interface LatestUpdateCardProps {
  update: { body: string; created_at: string };
}

export function LatestUpdateCard({ update }: LatestUpdateCardProps) {
  return (
    <div className="rounded-[var(--card-radius)] border border-border bg-card p-4">
      <p className="text-caption text-muted-foreground mb-1">Latest update</p>
      <p className="text-body text-foreground">{update.body}</p>
      <time className="text-caption text-muted-foreground mt-2 block">
        {new Date(update.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
    </div>
  );
}
```

### T2 — Conditional Rendering + Positioning + Leaderboard Exclusion

**Conditional:** If `latestUpdate` is null, render nothing.

**Positioning:** Card renders ABOVE the email capture form. In `WaitlistTemplateContent`, the card slot comes before the form slot:

```tsx
{
  latestUpdate && <LatestUpdateCard update={latestUpdate} />;
}
{
  emailCaptureForm;
}
```

**Leaderboard exclusion:** The leaderboard page (`src/app/(public)/[subdomain]/leaderboard/page.tsx`) does NOT fetch or display founder updates. Verify this is already the case — no changes expected.

### T3 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files created:** None (component created in Story 7.6)
**Files modified:** None (verification only — all changes done in Story 7.6)

**Available components:** `Badge` ✓, `Button` ✓
**Available utilities:** `cn()` ✓

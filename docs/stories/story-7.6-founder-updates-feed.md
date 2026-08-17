---
id: epic7.story06
epic: epic-7-public-waitlist-page
title: Founder Updates Feed Display
status: ready
depends_on: [epic7.story00]
updated: 2026-08-17
---

# Story 7.6 — Founder Updates Feed Display

**Status:** ready
**Design Refs:** — (no high-fidelity SVG for updates feed yet)

**Story:** As a visitor, I want to see the founder's updates feed on the public waitlist page so that I can stay informed about the product's progress.

## Acceptance Criteria (EARS)

- AC1: The system shall fetch `founder_updates` for the waitlist from the `founder_updates` table where `waitlist_id` matches, selecting `id`, `body`, `created_at`.
- AC2: Each update shall display the `body` text and `created_at` timestamp.
- AC3: Updates shall be sorted by `created_at` descending (newest first).
- AC4: If no updates exist, the system shall not render the updates section at all (conditional rendering).
- AC5: The updates section shall render on the public waitlist page (`/:subdomain`) below the email capture form and leaderboard link.
- AC6: Each update shall use the design system's typography: body text in `text-body`, timestamp in `text-caption text-muted-foreground`.
- AC7: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC3): Fetch updates, sort by newest first
- T2 (AC4-AC6): Conditional rendering + typography
- T3 (AC7): Lint + build verification

## Out of scope

Update creation UI (Sprint 1 — POST /api/updates is complete), update editing/deletion (not planned), real-time updates (Sprint 3).

## Dev Notes

### T1 — Fetch Updates

Fetch in the parent page component (Story 7.1) alongside other data:

```ts
const { data: updates } = await supabase
  .from("founder_updates")
  .select("id, body, created_at")
  .eq("waitlist_id", waitlist.id)
  .order("created_at", { ascending: false });
```

**Alternative:** Fetch directly in the leaderboard page if updates are displayed there too. But per the story, updates are on the main `/:subdomain` page, not the leaderboard.

### T2 — Conditional Rendering + Typography

Create `components/public/updates-feed.tsx` as a server component:

```tsx
interface Update {
  id: string;
  body: string;
  created_at: string;
}

interface UpdatesFeedProps {
  updates: Update[];
}

export function UpdatesFeed({ updates }: UpdatesFeedProps) {
  if (updates.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-h4 text-foreground mb-4">Updates</h2>
      <div className="space-y-4">
        {updates.map((update) => (
          <div key={update.id} className="border-b border-border pb-4">
            <p className="text-body text-foreground">{update.body}</p>
            <time className="text-caption text-muted-foreground mt-1 block">
              {new Date(update.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Integration in page.tsx:**

```tsx
<UpdatesFeed updates={updates || []} />
```

### T3 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files created:**

- `components/public/updates-feed.tsx`

**Files modified:**

- `src/app/(public)/[subdomain]/page.tsx` (fetch updates, render UpdatesFeed)

**Available components:** `Badge` ✓, `Button` ✓
**Available utilities:** `cn()` ✓

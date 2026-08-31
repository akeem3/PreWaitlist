---
id: epic7.story05
epic: epic-7-public-waitlist-page
title: Public Leaderboard Page
status: done
depends_on: [epic7.story00]
updated: 2026-08-18
---

# Story 7.5 — Public Leaderboard Page

**Status:** done
**Design Refs:** `docs/design/High-fidelity-Sprit2/public_leaderboard_HF3.svg`

**Story:** As a visitor, I want to see a public leaderboard showing subscribers ranked by referral count so that I can see how popular the waitlist is and where I stand.

## Current State

- **Shared template component** (`components/share/waitlist-template-content.tsx`) is the single source of truth for the public page shell. The leaderboard page does NOT import `WaitlistTemplateContent` — it shows a different content type (ranked list, not signup form) but uses the same page shell pattern (same background, header style).
- **PoweredByFooter** (`components/share/powered-by-footer.tsx`) is imported directly for the "Powered by PreWaitlist" footer on Free tier.
- **RLS public read policies** already applied to `subscribers`, `milestone_rewards`, `waitlists` tables — leaderboard queries Supabase directly from a Server Component.
- **Subscribers table** has no `name` column — display name derived from email local part via `maskName` function.
- **Milestone rewards** data shape: `{ threshold: number, label: string }` (components) / `tier_referrals` + `reward_label` (DB columns).
- **Qualified count** is computed from `qual_answers` JSONB — count referrals where the referred subscriber has non-null, non-empty `qual_answers`.

## Design Specs (from SVG analysis)

- **CRITICAL FINDING:** The browser-chrome header in the SVG is just a presentation frame (Figma/SVG rendering convention), NOT part of the actual page design. The real design has no browser chrome wrapper.
- **Layout:** Centered single-column, `bg-background` (#FAF8F4), `max-w-2xl` content width.
- **Header:** Centered "Leaderboard" heading + "Top referrals for your waitlist" subtitle — no white bar, no border.
- **Table:** 4-column grid — Rank, Name, Referrals, Quality. Horizontal dividers using `border-foreground/15`.
- **Name masking:** First char + `•••` + last char (e.g., "j•••m"). Simpler than original `j•••••m@domain` spec.
- **Qualified count:** Shows "X qualified" next to referral count.
- **Pagination:** "View More" button, 10 rows per page, "1–N of M" counter.
- **Empty state:** "No subscribers yet. Be the first to join!" + primary Button linking to waitlist page.
- **Back link:** "← Back to waitlist" — centered, `text-body-lg`, `font-semibold`, accent green.
- **PoweredByFooter:** Centered, `border-t` divider, "Powered by [logo]" caption text.

## Acceptance Criteria (EARS)

- AC1: The system shall render `/:subdomain/leaderboard` as a public route using a Server Component (RSC) at `src/app/(public)/[subdomain]/leaderboard/page.tsx`.
- AC2: The system shall fetch leaderboard data by querying Supabase directly from the server component (not via API route).
- AC3: The system shall display each subscriber's position number, anonymized display name (from email), and referral count.
- AC4: The system shall display a "Quality" column showing qualified referral count (referrals where the referred subscriber has non-null, non-empty `qual_answers`).
- AC5: The system shall sort subscribers by referral count descending, then by signup date ascending (earlier = higher rank for ties).
- AC6: The system shall mask emails for all subscribers using the pattern: first char + `"•••"` + last char (e.g., `"john@example.com"` → `"j•••m"`).
- AC7: The page shall be responsive — full-width table on desktop, stacked layout on mobile.
- AC8: The system shall render a "← Back to waitlist" link back to the main waitlist page (`/:subdomain`), styled as `text-body-lg font-semibold` in accent green, centered.
- AC9: The system shall show an empty state ("No subscribers yet. Be the first to join!") with a primary Button linking to the waitlist page when there are no subscribers.
- AC10: The system shall paginate results with a "View More" button, showing 10 rows per page with a "1–N of M" counter.
- AC11: The system shall render the `PoweredByFooter` at the bottom of the page (Free tier only).
- AC12: The page heading shall use `text-h2` (28px bold, matching marketing section headers) and subtitle shall use `text-body-lg` (18px, matching marketing section subheadings).
- AC13: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC2): Leaderboard route + Supabase data fetching
- T2 (AC3-AC4): Subscriber row display with name masking + qualified count
- T3 (AC5-AC6): Sort logic + email masking
- T4 (AC7-AC8): Responsive layout + back link
- T5 (AC9-AC10): Empty state + pagination
- T6 (AC11-AC12): PoweredByFooter + design tokens (heading/subtitle)
- T7 (AC13): Lint + build verification

## Out of scope

Real-time leaderboard updates (Sprint 3), quality score display (Sprint 3), warmth indicators (Sprint 3), individual subscriber detail page, milestone badge display (designed but not implemented — AC4 covers qualified count, not milestone badges), "You're #N" position banner (needs viewer identification mechanism).

## Dev Notes

### T1 — Leaderboard Route + Data Fetching

Create `src/app/(public)/[subdomain]/leaderboard/page.tsx` as a Server Component.

**Data fetching approach:** Query Supabase directly from the RSC — no API route call needed.

```ts
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ subdomain: string }> };

export default async function LeaderboardPage({ params }: Props) {
  const { subdomain } = await params;
  const supabase = await createClient();

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, headline, milestone_rewards_enabled")
    .eq("subdomain", subdomain)
    .single();

  if (!waitlist) notFound();

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email, referral_code, referrer_id, qual_answers, created_at")
    .eq("waitlist_id", waitlist.id)
    .order("created_at", { ascending: true });

  // Compute referral + qualified counts in-memory (single query, no N+1)
  const rows = subscribers || [];
  const referralCounts = new Map<string, number>();
  const qualifiedCounts = new Map<string, number>();

  rows.forEach((s) => {
    if (s.referrer_id) {
      referralCounts.set(
        s.referrer_id,
        (referralCounts.get(s.referrer_id) || 0) + 1
      );
      if (
        s.qual_answers &&
        typeof s.qual_answers === "object" &&
        Object.keys(s.qual_answers).length > 0
      ) {
        qualifiedCounts.set(
          s.referrer_id,
          (qualifiedCounts.get(s.referrer_id) || 0) + 1
        );
      }
    }
  });
}
```

**Key decision:** Single-query approach (fetch all subscribers, compute counts in-memory) instead of separate referral-count query. Simpler, faster for typical waitlist sizes (<10K subscribers).

### T2 — Subscriber Row Display + Name Masking + Qualified Count

**Name masking** extracts the email local part and shows first char + `•••` + last char:

```ts
function maskName(email: string): string {
  const local = email.split("@")[0];
  if (local.length <= 3) return local;
  return `${local[0]}•••${local[local.length - 1]}`;
}
```

**Qualified count logic:** A referral is "qualified" if the referred subscriber's `qual_answers` JSONB is non-null and has at least one key.

**Table layout:** 4-column grid `grid-cols-[60px_1fr_100px_120px]` with `text-caption` column headers and `border-b border-foreground/15` row dividers.

### T3 — Sort Logic

**Sort order:**

1. Primary: `referral_count DESC` (most referrals = highest rank)
2. Secondary: `created_at ASC` (earlier signup = higher rank for ties)

Same sort applied in-memory after computing referral counts.

### T4 — Responsive Layout + Back Link

**Layout structure:**

```tsx
<main className="flex min-h-screen flex-col bg-background">
  <div className="mx-auto max-w-2xl flex-1 px-4 py-12">
    {/* Header */}
    <h1 className="text-h2 text-foreground text-center">Leaderboard</h1>
    <p className="text-body-lg text-muted-foreground text-center mt-2">
      Top referrals for your waitlist
    </p>

    {/* Table (LeaderboardClient) */}

    {/* Back link — centered, bigger, semibold */}
    <div className="mt-10 flex justify-center">
      <Link
        href={`/${subdomain}`}
        className="inline-flex items-center gap-2 text-body-lg font-semibold text-accent hover:text-accent/80"
      >
        ← Back to waitlist
      </Link>
    </div>
  </div>

  {/* Footer — sticks to bottom via flex-1 on content */}
  <div>
    <PoweredByFooter template="minimal" />
  </div>
</main>
```

**Sticky footer pattern:** `flex min-h-screen flex-col` on `<main>`, `flex-1` on content wrapper. Footer sits at viewport bottom when content is short; pushes below when content overflows.

**Design tokens used:**

- Heading: `text-h2` (28px bold — matches marketing section headers like problem-section)
- Subtitle: `text-body-lg` (18px — matches marketing section subheadings)
- Back link: `text-body-lg font-semibold` accent green, centered with `flex justify-center`

### T5 — Empty State + Pagination

**Empty state** (when `rows.length === 0`):

```tsx
<div className="mt-8 text-center">
  <p className="text-body text-muted-foreground">
    No subscribers yet. Be the first to join!
  </p>
  <div className="mt-4 flex justify-center">
    <Link href={`/${subdomain}`}>
      <Button variant="primary">Join the waitlist</Button>
    </Link>
  </div>
</div>
```

**Key decision:** "Join the waitlist" uses `<Button variant="primary">` (design system component), not a plain text link.

**Pagination:** Client-side (`LeaderboardClient` component), 10 rows per page, "View More" button loads next batch, "1–N of M" counter shown.

### T6 — PoweredByFooter + Design Tokens

**PoweredByFooter** imported from shared component, rendered outside the content wrapper for sticky footer positioning.

**Design refinement (post-implementation):**

- Heading changed from `text-h1` (35px extrabold) to `text-h2` (28px bold) — matches marketing section headers
- Subtitle changed from `text-body` (16px) to `text-body-lg` (18px) — matches marketing section subheadings
- `PoweredByFooter` border-t divider removed then restored — user confirmed it should be present
- "Join the waitlist" upgraded from plain `<a>` to `<Button variant="primary">`
- "Back to waitlist" increased to `text-body-lg`, `font-semibold`, centered with `flex justify-center`

### T7 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files created:**

- `src/app/(public)/[subdomain]/leaderboard/page.tsx` — RSC with data fetching + rendering
- `src/app/(public)/[subdomain]/leaderboard/leaderboard-client.tsx` — Client component for table + pagination + empty state

**Files modified:**

- `components/share/powered-by-footer.tsx` — Border-t removed then restored (final state: present)

**Available components:** `Button` ✓, `PoweredByFooter` ✓
**Available utilities:** `cn()` ✓, `createClient()` ✓, `maskName` (inline in page.tsx)

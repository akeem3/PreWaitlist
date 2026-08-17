---
id: epic7.story05
epic: epic-7-public-waitlist-page
title: Public Leaderboard Page
status: done
depends_on: [epic7.story00]
updated: 2026-08-17
---

# Story 7.5 — Public Leaderboard Page

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/public_leaderboard_HF3.svg`

**Story:** As a visitor, I want to see a public leaderboard showing subscribers ranked by referral count so that I can see how popular the waitlist is and where I stand.

## Design Specs (from SVG analysis)

- **Layout:** Full-width, 1440px viewport, background `#FAF8F4`
- **Header:** White bar with border `#CCC9C3`, 73px height, centered heading
- **Table:** Ranked list with horizontal dividers (`#1C1917`), columns for position, name, referral count
- **Milestone badges:** Dashed-border cards with `#0F7A5E` text for milestone achievements
- **Email anonymization:** First character + dots + last character (e.g., "j••••m")

## Acceptance Criteria (EARS)

- AC1: The system shall render `/:subdomain/leaderboard` as a public route using a Server Component (RSC) at `src/app/(public)/[subdomain]/leaderboard/page.tsx`.
- AC2: The system shall fetch the leaderboard data from `GET /api/leaderboard/:subdomain` (Story 7.0 T3) or query Supabase directly from the server component.
- AC3: The system shall display each subscriber's position number, display name (or anonymized email if no name), and referral count.
- AC4: The system shall display milestone badges for subscribers who have reached referral thresholds, using the `milestone_rewards` data from the waitlist.
- AC5: The system shall sort subscribers by referral count descending, then by signup date ascending (earlier = higher rank for ties).
- AC6: The system shall anonymize emails for subscribers who skipped the optional name field using the pattern: first char + `"••••"` + last char (e.g., `"john@example.com"` → `"j••••m@example.com"`).
- AC7: The page shall be responsive — full-width table on desktop, stacked layout on mobile.
- AC8: The system shall render a link back to the main waitlist page (`/:subdomain`).
- AC9: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC2): Leaderboard route + data fetching
- T2 (AC3): Subscriber row display (position, name/email, referral count)
- T3 (AC4): Milestone badge display
- T4 (AC5-AC6): Sort logic + email anonymization
- T5 (AC7-AC8): Responsive layout + back link
- T6 (AC9): Lint + build verification

## Out of scope

Real-time leaderboard updates (Sprint 3), quality score display (Sprint 3), warmth indicators (Sprint 3), individual subscriber detail page.

## Dev Notes

### T1 — Leaderboard Route

Create `src/app/(public)/[subdomain]/leaderboard/page.tsx` as a Server Component.

**Data fetching approach:** Since this is an RSC, query Supabase directly (don't call the API route — that's for client-side use).

```ts
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ subdomain: string }> };

export default async function LeaderboardPage({ params }: Props) {
  const { subdomain } = await params;
  const supabase = await createClient();

  // 1. Look up waitlist
  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, headline, milestone_rewards_enabled")
    .eq("subdomain", subdomain)
    .single();

  if (!waitlist) notFound();

  // 2. Fetch subscribers + milestone rewards in parallel
  const [subscribersResult, milestonesResult] = await Promise.all([
    supabase
      .from("subscribers")
      .select("id, email, position, referral_code, created_at")
      .eq("waitlist_id", waitlist.id)
      .order("created_at", { ascending: true }),
    waitlist.milestone_rewards_enabled
      ? supabase
          .from("milestone_rewards")
          .select("tier_referrals, reward_label")
          .eq("waitlist_id", waitlist.id)
          .order("tier_referrals", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const subscribers = subscribersResult.data || [];
  const milestones = milestonesResult.data || [];

  // 3. Compute referral counts
  const subscriberIds = subscribers.map((s) => s.id);
  const { data: referralCounts } = await supabase
    .from("subscribers")
    .select("referrer_id")
    .in("referrer_id", subscriberIds);

  // Count referrals per subscriber
  const countMap = new Map<string, number>();
  referralCounts?.forEach((r) => {
    countMap.set(r.referrer_id, (countMap.get(r.referrer_id) || 0) + 1);
  });

  // 4. Sort and rank
  const ranked = subscribers
    .map((s) => ({
      ...s,
      referral_count: countMap.get(s.id) || 0,
    }))
    .sort((a, b) => {
      if (b.referral_count !== a.referral_count)
        return b.referral_count - a.referral_count;
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    })
    .map((s, i) => ({ ...s, rank: i + 1 }));

  // ... render
}
```

### T2 — Subscriber Row Display

```tsx
<div className="divide-y divide-border">
  {ranked.map((subscriber) => (
    <div
      key={subscriber.id}
      className="flex items-center justify-between py-4 px-6"
    >
      <div className="flex items-center gap-4">
        <span className="text-body-sm text-muted-foreground w-8">
          #{subscriber.rank}
        </span>
        <span className="text-body font-medium text-foreground">
          {anonymizeEmail(subscriber.email)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-body-sm font-semibold text-foreground">
          {subscriber.referral_count}
        </span>
        <span className="text-caption text-muted-foreground">referrals</span>
      </div>
    </div>
  ))}
</div>
```

### T3 — Milestone Badge Display

For each subscriber, check if their `referral_count` reaches any milestone threshold:

```tsx
function MilestoneBadges({
  referralCount,
  milestones,
}: {
  referralCount: number;
  milestones: { tier_referrals: number; reward_label: string }[];
}) {
  const reached = milestones.filter((m) => referralCount >= m.tier_referrals);
  if (reached.length === 0) return null;

  return (
    <div className="flex gap-2 mt-1">
      {reached.map((m) => (
        <span
          key={m.tier_referrals}
          className="inline-flex items-center rounded-md border border-dashed border-accent px-2 py-0.5 text-caption text-accent"
        >
          {m.reward_label}
        </span>
      ))}
    </div>
  );
}
```

### T4 — Sort + Anonymization

**Sort logic:**

1. Primary: `referral_count DESC` (most referrals = highest rank)
2. Secondary: `created_at ASC` (earlier signup = higher rank for ties)

**Email anonymization:**

```ts
function anonymizeEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}••••@${domain}`;
  return `${local[0]}••••${local[local.length - 1]}@${domain}`;
}
```

### T5 — Responsive Layout + Back Link

```tsx
<main className="min-h-screen bg-background">
  {/* Header */}
  <header className="border-b border-border bg-card">
    <div className="mx-auto flex h-[73px] max-w-4xl items-center justify-between px-4">
      <h1 className="text-h3 text-foreground">
        {waitlist.headline} — Leaderboard
      </h1>
      <a
        href={`/${subdomain}`}
        className="text-body-sm text-accent hover:text-accent-hover"
      >
        Back to waitlist
      </a>
    </div>
  </header>

  {/* Leaderboard */}
  <div className="mx-auto max-w-4xl px-4 py-8">{/* ranked list */}</div>
</main>
```

### T6 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files created:**

- `src/app/(public)/[subdomain]/leaderboard/page.tsx`

**Available components:** `Badge` ✓, `Button` ✓
**Available utilities:** `cn()` ✓, `createClient()` ✓

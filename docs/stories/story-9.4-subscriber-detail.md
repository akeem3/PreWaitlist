---
id: epic9.story04
epic: epic-9-dashboard-restructure
title: Subscriber Detail Page
status: ready
depends_on: [epic9.story02]
updated: 2026-08-31
---

# Story 9.4 — Subscriber Detail Page

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`

**Story:** As a founder, I want to view detailed information about an individual subscriber so that I can understand their engagement and referral impact.

## Design Specs (from SVG analysis)

**Active state (Dashboard_active_state_HF5.svg):**

- Subscriber detail is accessed by clicking a row in the subscriber table
- No dedicated design SVG for subscriber detail page — infer layout from existing patterns
- Expected layout: card-based, same sidebar, main content with subscriber info
- Back button to return to `/dashboard`

**Existing API routes that provide subscriber data:**

- `GET /api/subscribers/:id` — returns subscriber + waitlist + founder profile join
- `GET /api/subscribers/:id/referrals` — returns referral count + list of referred subscribers
- `qualification_questions` table exists (Story 2.1 schema)
- `subscribers` table may have `qual_answers` JSONB column (needs verification)

## Acceptance Criteria (EARS)

- AC1: The system shall render `/dashboard/subscribers/:id` as a protected route (requires auth).
- AC2: The page shall display the subscriber's position, email, and signup date.
- AC3: The page shall display the subscriber's referral count and list of referred subscribers (if any).
- AC4: The page shall display the subscriber's qualification answers (if any questions were asked).
- AC5: The page shall include a back button returning to `/dashboard`.
- AC6: The page shall display "Subscriber not found" if the ID doesn't belong to the founder's waitlist.
- AC7: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC2): Route creation with auth check + subscriber info display
- T2 (AC3): Referral data display (count + list)
- T3 (AC4): Qualification answers display
- T4 (AC5-AC6): Back button + not found state
- T5 (AC7): Lint + build

## Out of scope

Position history (Sprint 2 doesn't track changes), warmth score display (not in design SVG), edit subscriber (founders don't edit subscribers), subscriber detail design SVG (no design exists for this page).

## Dev Notes

### T1 — Route + Auth + Subscriber Info

Create `src/app/dashboard/subscribers/[id]/page.tsx` as a Server Component.

```tsx
import { redirect, notFound } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SubscriberDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  // Fetch subscriber with waitlist ownership check
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select(
      `
      id, email, position, referral_code, warmth_score, qual_answers, created_at,
      waitlists!inner (
        id, founder_id, subdomain, headline
      )
    `
    )
    .eq("id", id)
    .single();

  if (!subscriber || subscriber.waitlists.founder_id !== user.id) {
    notFound();
  }

  // ... render
}
```

**Key details:**

- Use `.single()` to fetch exactly one subscriber
- Join `waitlists` to verify founder ownership (RLS also enforces this, but explicit check is safer)
- `qual_answers` column — need to verify it exists on `subscribers` table. If not, query `qualification_questions` table separately.
- **Status:** not started — `src/app/dashboard/subscribers/` directory does not exist. API routes exist at `src/app/api/subscribers/[id]/route.ts` and `src/app/api/subscribers/[id]/referrals/route.ts`.

### T2 — Referral Data Display

Query referred subscribers:

```tsx
const { data: referrals } = await supabase
  .from("subscribers")
  .select("id, email, position, created_at")
  .eq("referrer_id", id)
  .order("created_at", { ascending: true });

const referralCount = referrals?.length || 0;
```

Display:

```tsx
<div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
  <h3 className="mb-3 text-body-sm font-medium text-foreground">Referrals</h3>
  <p className="text-h3 text-foreground">{referralCount}</p>
  {referrals && referrals.length > 0 && (
    <ul className="mt-3 space-y-2">
      {referrals.map((r) => (
        <li key={r.id} className="text-body-sm text-muted-foreground">
          {r.email} — joined {new Date(r.created_at).toLocaleDateString()}
        </li>
      ))}
    </ul>
  )}
</div>
```

**Status:** not started — `GET /api/subscribers/:id/referrals` route exists and returns referred subscribers. Can reuse query logic.

### T3 — Qualification Answers

The `subscribers` table may have a `qual_answers` JSONB column (from Story 7.3 inline qualification questions). If it exists:

```tsx
{
  subscriber.qual_answers &&
    Object.keys(subscriber.qual_answers).length > 0 && (
      <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
        <h3 className="mb-3 text-body-sm font-medium text-foreground">
          Qualification Answers
        </h3>
        <dl className="space-y-2">
          {Object.entries(subscriber.qual_answers).map(([question, answer]) => (
            <div key={question}>
              <dt className="text-caption text-muted-foreground">{question}</dt>
              <dd className="text-body-sm text-foreground">
                {answer as string}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    );
}
```

**Status:** not started — `qualification_questions` table exists (Story 2.1), but `qual_answers` column on `subscribers` needs verification. Check `docs/stories/epic0.story03-supabase-schema.sql` or run `\d subscribers` in Supabase SQL editor.

**Fallback:** If `qual_answers` column doesn't exist, query `qualification_questions` table by `waitlist_id` and display questions without answers (answers aren't stored yet).

### T4 — Back Button + Not Found

Back button:

```tsx
<Link
  href="/dashboard"
  className="inline-flex items-center gap-2 text-body-sm text-muted-foreground transition-colors hover:text-foreground mb-6"
>
  ← Back to dashboard
</Link>
```

Not found: `notFound()` triggers Next.js 404 page (already handled in T1 with the ownership check).

### T5 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files created:**

- `src/app/dashboard/subscribers/[id]/page.tsx`

**Available components:** None needed — page-level layout
**Available tokens:** `bg-card`, `rounded-[var(--card-radius)]`, `border-border`, `text-body-sm`, `text-h3`, `text-caption`, `text-foreground`, `text-muted-foreground`

---
id: epic8.story00
epic: epic-8-thank-you-referral-loop
title: Thank-You Page Route
status: ready
depends_on: [epic7.story00, epic7.story02]
updated: 2026-08-17
---

# Story 8.0 — Thank-You Page Route

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/thank_you_direct_HF1.svg`, `docs/design/High-fidelity-Sprit2/thank_you_referred_HF2.svg`

**Story:** As a visitor who just signed up, I want to see a thank-you page with my position in line and my unique referral link so that I can share it with friends and move up the waitlist.

## Design Specs (from SVG analysis)

**Direct variant (thank_you_direct_HF1.svg):**

- Background: `#FAF8F4`
- Centered card with `bg-card` (`#FFFFFF`), `rounded-xl` (12px radius), `shadow-float`
- Heading: "You're in the line!" (`text-h2`, `text-foreground`)
- Subtext: "You're #{position} in line. Share your unique link to move up." (`text-body`, `text-muted-foreground`)
- Referral link display: `bg-muted` rounded pill with referral URL, copy button
- Share buttons row: Twitter, LinkedIn, Copy Link
- "Powered by PreWaitlist" footer when tier = Free

**Referred variant (thank_you_referred_HF2.svg):**

- Same layout as direct variant
- Additional heading: "Referred by a friend" (`text-body-lg`, `text-accent`)
- Referrer name displayed below
- Same referral link and share buttons

## Acceptance Criteria (EARS)

- AC1: The system shall render `/:subdomain/thank-you` as a public route at `src/app/(public)/[subdomain]/thank-you/page.tsx`.
- AC2: The system shall read `subscriber_id` and `referral_code` from URL search params (`?subscriber_id={id}&referral_code={code}`).
- AC3: The system shall fetch the subscriber record by `subscriber_id`, selecting `id`, `email`, `position`, `referral_code`, `referrer_id`.
- AC4: If the subscriber has a `referrer_id`, the system shall fetch the referrer's `email` (or display name if available) and render the "Referred by a friend" heading with referrer name.
- AC5: If the subscriber has no `referrer_id`, the system shall render the direct variant (no referrer mention).
- AC6: The system shall display the subscriber's `position` number prominently.
- AC7: The system shall display the subscriber's full referral link: `https://{subdomain}.prewaitlist.com?ref={referral_code}`.
- AC8: The system shall render `ShareButtons` component (Story 8.1) with the referral link URL.
- AC9: The system shall render `PoweredByFooter` when `tier === "free"`.
- AC10: The system shall return a 404 if the subscriber_id is invalid or doesn't match the subdomain.
- AC11: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC3): Thank-you page route with subscriber data fetching
- T2 (AC4-AC5): Referred vs direct variant rendering
- T3 (AC6-AC7): Position display + referral link
- T4 (AC8): Share buttons integration (placeholder for Story 8.1)
- T5 (AC9): PoweredByFooter conditional
- T6 (AC10): 404 handling for invalid subscriber
- T7 (AC11): Lint + build verification

## Out of scope

Share button functionality (Story 8.1), referral tracking/analytics (Story 8.2), referred subscriber variant logic (Story 8.3), dashboard referral column (Story 8.4).

## Dev Notes

### T1 — Thank-You Page Route

Create `src/app/(public)/[subdomain]/thank-you/page.tsx` as a Server Component.

```ts
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PoweredByFooter } from "../../../../components/share/powered-by-footer";

type Props = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ subscriber_id?: string; referral_code?: string }>;
};

export default async function ThankYouPage({ params, searchParams }: Props) {
  const { subdomain } = await params;
  const { subscriber_id, referral_code } = await searchParams;

  if (!subscriber_id || !referral_code) {
    notFound();
  }

  const supabase = await createClient();

  // Fetch subscriber + waitlist + founder profile
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select(
      `
      id, email, position, referral_code, referrer_id,
      waitlists!inner (
        id, subdomain, headline,
        founder_profiles!inner ( tier )
      )
    `
    )
    .eq("id", subscriber_id)
    .eq("referral_code", referral_code)
    .single();

  if (!subscriber) notFound();

  const tier = subscriber.waitlists.founder_profiles.tier;
  const referralLink = `https://${subdomain}.prewaitlist.com?ref=${referral_code}`;

  // ... render
}
```

**Key detail:** The query joins `waitlists` and `founder_profiles` to verify the subscriber belongs to this subdomain and to get the tier. Using `.single()` ensures we get exactly one row.

### T2 — Referred vs Direct Variant

```ts
let referrerEmail: string | null = null;
if (subscriber.referrer_id) {
  const { data: referrer } = await supabase
    .from("subscribers")
    .select("email")
    .eq("id", subscriber.referrer_id)
    .single();
  referrerEmail = referrer?.email || null;
}

const isReferred = !!subscriber.referrer_id && !!referrerEmail;
```

**Rendering:**

```tsx
{
  isReferred ? (
    <>
      <p className="text-body-lg text-accent font-semibold">
        Referred by a friend
      </p>
      <p className="text-body-sm text-muted-foreground">
        {anonymizeEmail(referrerEmail!)} invited you to join
      </p>
    </>
  ) : null;
}
```

### T3 — Position + Referral Link

```tsx
<div className="text-center">
  <h1 className="text-h2 text-foreground">You&apos;re in the line!</h1>
  <p className="text-body text-muted-foreground mt-2">
    You&apos;re <span className="font-semibold text-foreground">#{subscriber.position}</span> in line.
    Share your unique link to move up.
  </p>
</div>

<div className="mt-6 flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
  <span className="text-body-sm text-foreground truncate flex-1">
    {referralLink}
  </span>
  <CopyButton url={referralLink} />
</div>
```

The `CopyButton` will be implemented in Story 8.1. For now, use a placeholder or the existing `ShareCopyLink` component.

### T4 — Share Buttons Placeholder

Import and render the share buttons component (Story 8.1 will build it):

```tsx
{
  /* ShareButtons will be built in Story 8.1 */
}
<div className="mt-4 flex justify-center gap-3">
  {/* Twitter */}
  <a
    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Join the waitlist!")}&url=${encodeURIComponent(referralLink)}`}
    target="_blank"
    rel="noopener noreferrer"
    className="..."
  >
    Twitter
  </a>
  {/* LinkedIn */}
  <a
    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
    target="_blank"
    rel="noopener noreferrer"
    className="..."
  >
    LinkedIn
  </a>
</div>;
```

### T5 — PoweredByFooter

```tsx
{
  tier === "free" && (
    <PoweredByFooter template="minimal" brandColor="#0F7A5E" />
  );
}
```

### T6 — 404 Handling

The `.single()` call returns null when no match is found. The `notFound()` call triggers Next.js's 404 page.

### T7 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files created:**

- `src/app/(public)/[subdomain]/thank-you/page.tsx`

**Available components:** `PoweredByFooter` ✓, `ShareCopyLink` ✓
**Available utilities:** `cn()` ✓, `createClient()` ✓

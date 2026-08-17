---
id: epic7.story01
epic: epic-7-public-waitlist-page
title: Public Waitlist Page Route
status: ready
depends_on: [epic7.story00]
updated: 2026-08-17
---

# Story 7.1 — Public Waitlist Page Route

**Status:** ready
**Design Refs:** — (no high-fidelity SVG for public waitlist page yet)

**Story:** As a visitor, I want to land on a founder's public waitlist page so that I can learn about their product and sign up.

## Acceptance Criteria (EARS)

- AC1: The system shall render `/:subdomain` as a public route using a Server Component (RSC) at `src/app/(public)/[subdomain]/page.tsx`.
- AC2: The system shall fetch the waitlist record by `subdomain` from the `waitlists` table, selecting: `id`, `subdomain`, `template`, `headline`, `subheadline`, `cta_text`, `logo_url`, `brand_color`, `qualification_enabled`, `milestone_rewards_enabled`, `signup_counter_enabled`, `signup_counter_threshold`.
- AC3: The system shall also fetch the founder's `tier` from `founder_profiles` (joined via `waitlists.founder_id = founder_profiles.id`) to determine whether to show the PoweredByFooter.
- AC4: The system shall fetch `milestone_rewards` for the waitlist (from `milestone_rewards` table where `waitlist_id` matches) and pass them to the template.
- AC5: The system shall fetch `qualification_questions` for the waitlist (from `qualification_questions` table where `waitlist_id` matches, ordered by `sort_order`) and pass them to the template.
- AC6: The system shall return a 404 (via Next.js `notFound()`) if no waitlist exists for the given subdomain.
- AC7: The system shall render the page using the founder's chosen template (`minimal`, `bold`, or `dark`) by extracting the template rendering logic from `components/onboarding/live-preview.tsx` into a shared component.
- AC8: The system shall display the founder's `headline`, `subheadline`, `logo` (if uploaded), and `cta_text` within the chosen template.
- AC9: The system shall render the email capture form area (placeholder for Story 7.2) within the template.
- AC10: The system shall render the qualification questions area (placeholder for Story 7.3) below the email field when `qualification_enabled` is true.
- AC11: The system shall render the milestone rewards display when `milestone_rewards_enabled` is true and rewards exist.
- AC12: The system shall render the signup counter when `signup_counter_enabled` is true and subscriber count meets threshold.
- AC13: The system shall render `PoweredByFooter` (from `components/share/powered-by-footer.tsx`) when `tier === "free"`, passing `template` and `brandColor` props.
- AC14: The system shall render the page responsive — centered layout on desktop, full-width on mobile.
- AC15: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC6): Enhance page.tsx with full data fetching (waitlist + founder profile + milestones + questions)
- T2 (AC7-AC8): Extract template rendering from live-preview.tsx into shared component
- T3 (AC9-AC12): Render email capture, qual questions, milestones, counter placeholders
- T4 (AC13): PoweredByFooter conditional render
- T5 (AC14): Responsive layout
- T6 (AC15): Lint + build verification

## Out of scope

Email capture form submission (Story 7.2), qualification question interactions (Story 7.3), leaderboard page (Story 7.5), thank-you page (Epic 8).

## Dev Notes

### T1 — Data Fetching

The existing `src/app/(public)/[subdomain]/page.tsx` fetches only 4 fields. Expand to fetch all required data.

**Current file:** `src/app/(public)/[subdomain]/page.tsx` (51 lines)

**Query to add:**

```ts
// 1. Waitlist + founder profile (single query via join)
const { data: waitlist } = await supabase
  .from("waitlists")
  .select(
    `
    id, subdomain, template, headline, subheadline, cta_text,
    logo_url, brand_color, qualification_enabled, milestone_rewards_enabled,
    signup_counter_enabled, signup_counter_threshold,
    founder_profiles!inner ( tier )
  `
  )
  .eq("subdomain", subdomain)
  .single();

if (!waitlist) {
  notFound();
}

const tier = waitlist.founder_profiles.tier;
```

**Parallel queries for child data:**

```ts
const [milestonesResult, questionsResult, countResult] = await Promise.all([
  waitlist.milestone_rewards_enabled
    ? supabase
        .from("milestone_rewards")
        .select("tier_referrals, reward_label")
        .eq("waitlist_id", waitlist.id)
        .order("tier_referrals", { ascending: true })
    : Promise.resolve({ data: [] }),
  waitlist.qualification_enabled
    ? supabase
        .from("qualification_questions")
        .select("id, question_text, question_type, sort_order")
        .eq("waitlist_id", waitlist.id)
        .order("sort_order", { ascending: true })
    : Promise.resolve({ data: [] }),
  waitlist.signup_counter_enabled
    ? supabase
        .from("subscribers")
        .select("id", { count: "exact", head: true })
        .eq("waitlist_id", waitlist.id)
    : Promise.resolve({ count: 0 }),
]);
```

**Important:** Use `Promise.all` for parallel queries to avoid waterfall. The existing code uses a try/catch for the subscribers count — keep that pattern for backward compatibility.

### T2 — Extract Shared Template Component

The `components/onboarding/live-preview.tsx` (1026 lines) contains `MinimalTemplate`, `BoldTemplate`, and `DarkTemplate` as internal components with inline styles. These are **client components** used in the onboarding live preview.

**Strategy:** Create a new **server-compatible** template renderer at `components/public/waitlist-template.tsx` that:

1. Accepts the same props interface as `LivePreview` (minus the client-only state)
2. Reuses the template rendering logic but as a server component
3. Renders the email capture area, qual questions, milestones, and counter as `children` slots

**Alternatively (simpler):** Since the template components use inline styles (Sprint 1 approved), we can extract them into a shared component that both `live-preview.tsx` and the public page import. The templates themselves don't need to be server components — they just render static HTML.

**Recommended approach:** Create `components/public/waitlist-page-content.tsx` as a server component that composes the template. The template rendering can be done with Tailwind classes (matching the inline style values) since this is a new component.

**Props interface:**

```ts
interface WaitlistPageContentProps {
  template: "minimal" | "bold" | "dark";
  headline: string | null;
  subheadline: string | null;
  logoUrl: string | null;
  ctaText: string | null;
  brandColor: string;
  tier: "free" | "pro" | "growth";
  signupCounter: number;
  signupCounterVisible: boolean;
  milestoneRewards: { threshold: number; label: string }[];
  qualificationEnabled: boolean;
  children: React.ReactNode; // email capture form slot
}
```

**Design tokens to use (from `globals.css`):**

- Page background: `bg-background` (`--color-background: #faf8f4`)
- Text: `text-foreground` (`--color-foreground: #1a1a1a`)
- Muted text: `text-muted-foreground` (`--color-muted-foreground: #6b6b6b`)
- Accent/brand: use `brandColor` prop with inline `style` (one exception for dynamic brand color)
- Border: `border-border` (`--color-border: #e0ddd8`)
- Card: `bg-card` (`--color-card: #ffffff`)
- Typography: `.text-h2`, `.text-body-lg`, `.text-body-sm`, `.text-caption`
- Border radius: `rounded-lg` (`--radius-lg: 12px`), `rounded-md` (`--radius-md: 8px`)

### T3 — Placeholder Slots

Render placeholder areas for features built in later stories:

```tsx
{
  /* Email capture form — Story 7.2 will replace this */
}
<div className="w-full max-w-md">
  {/* EmailCaptureForm will go here */}
  <div className="rounded-lg border border-border bg-card p-4">
    <p className="text-body-sm text-muted-foreground">
      Email capture form — coming soon
    </p>
  </div>
</div>;
```

For qualification questions, milestones, and counter — render them conditionally based on the flags, using the data fetched in T1.

### T4 — PoweredByFooter

Import and render:

```tsx
import { PoweredByFooter } from "../../components/share/powered-by-footer";

{
  tier === "free" && (
    <PoweredByFooter template={template} brandColor={brandColor} />
  );
}
```

The `PoweredByFooter` is a server component — no client boundary issues.

### T5 — Responsive Layout

Use Tailwind responsive utilities:

```tsx
<main className="flex min-h-screen flex-col items-center bg-background px-4 py-12 md:px-8">
  <div className="w-full max-w-lg">{/* template content */}</div>
</main>
```

The existing `live-preview.tsx` uses a `BrowserFrame` wrapper for the onboarding preview. The public page does NOT use a browser frame — it's the actual page, not a preview.

### T6 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files modified:**

- `src/app/(public)/[subdomain]/page.tsx` (enhanced from 51 lines)

**Files created:**

- `components/public/waitlist-page-content.tsx` (shared template renderer)

**Available components:** `PoweredByFooter` ✓, `Button` ✓, `Input` ✓, `Card` ✓, `Badge` ✓
**Available utilities:** `cn()` ✓, `createClient()` ✓

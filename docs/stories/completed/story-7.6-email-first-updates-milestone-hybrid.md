---
id: epic7.story06
epic: epic-7-public-waitlist-page
title: Email-First Updates + Milestone Hybrid + Warmth Foundation + Doc Alignment
status: ready
depends_on:
  [
    epic7.story00,
    epic7.story01,
    epic7.story02,
    epic7.story03,
    epic7.story04,
    epic7.story05,
  ]
updated: 2026-08-25
---

# Story 7.6 — Email-First Updates + Milestone Hybrid + Warmth Foundation + Doc Alignment

**Status:** ready
**Design Refs:** — (no high-fidelity SVG for updates/milestones/warmth)

**Story:** As the founder, I want updates delivered via email, milestone rewards with suggested defaults and a clear platform boundary, and a warmth tracking foundation — so the engagement loop works and my list stays warm.

## Why This Story Exists

### Email-First Updates

Research across every major waitlist platform (LaunchRock, Prefinery, KickoffLabs, Viral Loops, LaunchList) confirms: **email is the primary engagement channel. None offer on-page founder updates.** On-page updates have no proven value because subscribers don't return to static pages without a trigger. The real engagement loop is email-native: founder sends update → subscriber opens/clicks → warmth signal → dashboard shows engagement → founder sends better-targeted next update.

### Milestone Platform Boundary

The milestone system as built is a **promise engine with no delivery mechanism.** The founder types "Lifetime 20% discount" as a reward label, but there's no code that knows what that means or how to deliver it.

Research across every major tool (KickoffLabs, Viral Loops, Prefinery, SparkLoop, Morning Brew) confirms the same model:

**Platform does:** Track referrals, send congratulatory emails, show pending rewards dashboard
**Platform does NOT do:** Fulfill rewards (apply discounts, ship swag, grant access)

The platform is a **tracker + notifier**, not a fulfiller. Every successful tool follows this model. Morning Brew — the gold standard — sends congratulatory emails at each tier. The founder's team manually mails stickers. The platform tracks. The founder delivers.

**The two automatable rewards (beyond email notification):**

1. **"Skip the line"** — position boost. Mechanical (update a number in the DB). Deliverable at MVP.
2. **Email notification** — "You earned X!" via Resend. Deliverable at MVP.

Everything else (discounts, swag, Pro access, calls) is the founder's responsibility.

### Warmth Foundation

Warmth tracking has zero implementation — no schema, no signal collection, no scoring formula. This story creates the foundation.

## Current State

- **On-page updates feed** (`components/public/updates-feed.tsx`) is built and rendering on `/:subdomain`. **Becomes a single "Latest update" card above the email form.**
- **POST /api/updates** (`src/app/api/updates/route.ts`) exists. **Needs Resend email dispatch.**
- **Milestone rewards** (`milestone_rewards` table) uses fixed tiers at 3/10/25 with editable reward labels. **Needs hybrid defaults (1/5/10/25) + platform boundary clarification.**
- **Onboarding Step 3** (`src/app/onboarding/3/page.tsx`) has milestone config UI. **Needs updated defaults + Recommended badge.**
- **No milestone fulfillment** exists anywhere — no email notification, no position boost, no pending rewards tracking.
- **Warmth tracking** has zero implementation. **Needs schema + signal tables + scoring formula.**
- **PRD data model** (§7.4) still shows `check (tier_referrals in (3,10,25))` — stale.
- **30+ documentation files** reference milestones, updates, warmth with inconsistent framing. **Need alignment to reflect tracker+notifier boundary.**

## Acceptance Criteria (EARS)

### Updates — Email-First

- AC1: The system shall modify `POST /api/updates` to trigger a Resend email send to all subscribers of the waitlist after inserting the update record.
- AC2: The email shall use the founder's product name as sender (not "PreWaitlist"), branded with the waitlist's headline and brand color.
- AC3: The `founder_updates` table shall gain a `sent_at timestamptz` column (nullable, set after email dispatch completes).
- AC4: The on-page updates section shall be reduced from a full feed to a single "Latest update" card showing only the most recent update (body + timestamp), rendered above the email capture form.
- AC5: If no updates exist, the on-page card shall not render at all.
- AC6: The leaderboard page shall not display founder updates.
- AC7: Lint and build shall pass with zero errors.

### Milestones — Hybrid Defaults + Platform Boundary

- AC8: The default milestone tiers shall change from 3/10/25 to 1/5/10/25 (4 tiers) with pre-filled reward labels: "Early access", "Free Pro plan for 1 month", "Lifetime 20% discount", "Founding member status".
- AC9: Each default tier shall display a "Recommended" badge (using `Badge` component, variant `info`).
- AC10: The founder shall be able to edit every threshold (positive integer) and every reward label (required text).
- AC11: The founder shall be able to add tiers (up to 5) or remove tiers (minimum 1).
- AC12: The live preview shall reflect the updated default tiers.
- AC13: A `milestones_earned` column (jsonb, nullable) shall be added to the `subscribers` table to track which tiers each subscriber has reached. Format: `[{ "threshold": 5, "label": "Early access", "earned_at": "2026-08-25T..." }]`.
- AC14: When a subscriber's referral count reaches a milestone threshold, the system shall auto-send a congratulatory email via Resend with the reward label in the body (e.g., "Congratulations! You earned: Early access").
- AC15: For milestones where the reward label contains "skip the line" (case-insensitive), the system shall boost the subscriber's position to 1 (front of the queue) in addition to sending the email.
- AC16: The `subscribers` table shall gain a `milestones_notified` column (jsonb, nullable) to track which milestone emails have been sent, preventing duplicate notifications. Format: `[5, 10, 25]` (array of thresholds already notified).
- AC17: Lint and build shall pass with zero errors.

### Warmth Foundation

- AC18: A `warmth_score` column (text, nullable, check: `in ('hot','warm','cold')`) shall be added to the `subscribers` table.
- AC19: A `page_views` table shall be created with columns: id (uuid PK), subscriber_id (FK, nullable), waitlist_id (FK), path (text), created_at (timestamptz). RLS: founders manage own, public insert for anonymous visitors.
- AC20: A `email_events` table shall be created with columns: id (uuid PK), subscriber_id (FK), waitlist_id (FK), event_type (text, check: `in ('sent','delivered','opened','clicked','bounced')`), created_at (timestamptz). RLS: founders manage own only (no public insert).
- AC21: The system shall provide a `GET /api/warmth/:subdomain` route handler returning warmth distribution counts.
- AC22: Lint and build shall pass with zero errors.

### Documentation Updates

- AC23: The PRD (§7.4 data model) shall be updated: (a) `tier_referrals` check constraint → `> 0`, (b) `founder_updates.sent_at` column, (c) `subscribers.warmth_score` + `milestones_earned` + `milestones_notified` columns, (d) `page_views` + `email_events` tables.
- AC24: The PRD (§6.8.3) shall be updated to describe: platform tracks thresholds + sends notification emails + shows pending rewards; founder handles actual reward delivery.
- AC25: The PRD (§6.15) shall be updated to describe email-first update delivery.
- AC26: The PRD screen table (§2a), route table (§7.5), and component tree (§7.6) shall be updated to reflect milestone tracking (not "rewards") and email-first updates.
- AC27: The product vision (§Module 3) shall be updated: remove "page return visits" as primary warmth signal, add "email clicks".
- AC28: The product vision (§Module 3, §Module 2) shall be updated: milestone rewards = platform tracks + notifies, founder delivers. Update "[Subscriber] earns" framing.
- AC29: The user flow doc (`docs/planning-docs/user-flow-waitlist-tool.md`) shall be updated: "give before ask" → "show reward commitment before ask"; "You're at 0 of 3 for early access" → "You've referred 0 of 3 friends toward: Early access"; "what they earn" → "what they're working toward".
- AC30: The user flow diagram (`docs/planning-docs/Waitlist__User_Flow_Diagram_.md`) shall be updated with same framing changes.
- AC31: The JTBD doc shall be updated: "get rewarded for doing so" → "get recognized for doing so, with the founder delivering the reward".
- AC32: The epic doc (`docs/epics/epic-7-public-waitlist-page.md`) shall be updated with new story index, status, and definition of done.
- AC33: Story files 7.6→7.7 and 7.7→7.8 shall be renumbered (already done — verify).
- AC34: `MEMORY.md` shall be updated with: email-first strategy, hybrid milestones, tracker+notifier boundary, warmth foundation, story numbering.
- AC35: The following additional docs shall be updated to align framing: epic-4 (line 289), epic-6 (line 121 out-of-scope), epic-8 (lines 84, 112 out-of-scope), sprint-1-summary (lines 133, 197), story-7.5 (line 67), story-7.1 (lines 29, 117, 171), story-7.8 (line 42), story-8.2 (line 37), story-8.3 (line 44), design-analysis (lines 272, 278, 292), prompts/sprint-2-design-analysis-prompt (lines 29, 30), sql-writeups/fix-public-read-policies (line 24), sql-writeups/epic0.story03-supabase-schema (line 90 comment), src/app/onboarding/3/page.tsx (placeholder text), components/share/waitlist-template-content.tsx (line 118 fallback text).
- AC36: Lint and build shall pass with zero errors.

## Tasks

### Phase 1: Documentation Alignment (do first — no code dependencies)

- T1 (AC23-AC28): Update PRD (data model, REQ-6.8.3, REQ-6.15, screen table, route table, component tree) and product vision (Module 2, Module 3)
- T2 (AC29-AC31): Update planning docs (user-flow, user-flow diagram, JTBD)
- T3 (AC32-AC33): Update epic doc + verify story renumbering
- T4 (AC34): Update MEMORY.md
- T5 (AC35): Update remaining docs (epic-4, epic-6, epic-8, sprint-1-summary, story-7.5, story-7.1, story-7.8, story-8.2, story-8.3, design-analysis, prompts, sql-writeups, onboarding placeholders, template fallback)

### Phase 2: Email-First Updates

- T6 (AC1-AC2): Enhance POST /api/updates with Resend email dispatch
- T7 (AC3): Add sent_at column to founder_updates table
- T8 (AC4-AC6): Reduce on-page updates to "Latest update" card, remove from leaderboard
- T9 (AC7): Lint + build verification (updates section)

### Phase 3: Milestone Hybrid + Fulfillment

- T10 (AC8-AC9): Update milestone defaults to 1/5/10/25 with "Recommended" badge
- T11 (AC10-AC12): Verify milestone edit/add/remove + preview
- T12 (AC13-AC16): Add milestones_earned + milestones_notified columns, milestone trigger logic, "skip the line" position boost
- T13 (AC17): Lint + build verification (milestones section)

### Phase 4: Warmth Foundation

- T14 (AC18-AC20): Create warmth schema DDL
- T15 (AC21): Create GET /api/warmth/:subdomain route handler
- T16 (AC22): Lint + build verification (warmth section)

### Phase 5: Final Verification

- T17 (AC36): Final lint + build verification

## Out of Scope

- **Broadcast compose UI** (dashboard) — deferred to Epic 10
- **Warmth-segmented broadcast** — depends on broadcast compose + warmth scoring
- **Automated warmth alerts** — deferred to post-MVP (Growth tier feature removed from scope)
- **Email open/click webhook handler** — Resend webhooks are Sprint 3
- **Warmth scoring algorithm execution** — schema + formula defined here, runtime is Sprint 3
- **Update editing/deletion** — not planned
- **Founder reward email customization** — founder writes reward emails externally; platform sends congratulatory template
- **Paddle integration for discount fulfillment** — founder's responsibility
- **Physical swag fulfillment** — founder's responsibility
- **Webhook-based custom fulfillment** — Pro tier power-user feature, Sprint 3+
- **Dashboard "Pending Rewards" panel** — Sprint 2 dashboard restructure (Epic 10)
- **Dashboard warmth panel** — locked/empty placeholder in Sprint 2

## Dev Notes

### Phase 1: Documentation Alignment

### T1 — Update PRD and Product Vision

#### PRD §7.4 Data Model

**File:** `docs/PRD.md`

1. `milestone_rewards.tier_referrals`: change `check (tier_referrals in (3,10,25))` → `check (tier_referrals > 0)`. Add comment: "Default tiers: 1/5/10/25. Founder can customize."
2. `founder_updates`: add `sent_at timestamptz`
3. `subscribers`: add `warmth_score text check (warmth_score in ('hot','warm','cold'))`, `milestones_earned jsonb`, `milestones_notified jsonb`
4. Add `page_views` table (full DDL from T14)
5. Add `email_events` table (full DDL from T14)

#### PRD §6.8.3 — Milestone Rewards Requirement

**File:** `docs/PRD.md`

Replace the "Scope: Sprint 1 is configuration only" note with:

> "REQ-6.8.3: When the milestone-rewards toggle is switched ON, the system shall reveal 1-5 reward tiers (default: 4 tiers at 1, 5, 10, 25 referrals). Each tier has an editable referral threshold (positive integer) and an editable reward label (required). The founder can add tiers (up to 5) or remove tiers (minimum 1). The platform tracks which milestones each subscriber has reached (`milestones_earned` column), sends a congratulatory email when a threshold is reached, and shows a pending rewards dashboard. The founder handles actual reward delivery (discount codes, swag, access grants). For milestones where the reward label contains 'skip the line', the platform shall also boost the subscriber's position to the front of the queue."

#### PRD §6.15 — Founder Updates

**File:** `docs/PRD.md`

Replace REQ-6.15.1 + add new REQs (same as current story — email-first delivery).

#### PRD Screen Table (§2a), Route Table (§7.5), Component Tree (§7.6)

- Screen table: "milestone progress" → "milestone threshold display"
- Route table: "milestones" → "milestone display"
- Component tree: `milestone-progress.tsx` → `milestone-display.tsx` (or clarify it's display-only)

#### Product Vision §Module 2 (Referral System)

**File:** `docs/product-vision-mvp-waitlist-tool.md`

- Line 116: "[Subscriber] earns" → "[Subscriber] reaches threshold; platform notifies, founder delivers"
- Line 110: "milestone reward ladder" → "milestone threshold display"
- Update example rewards to note they're labels for founder-managed fulfillment

#### Product Vision §Module 3 (Warmth Tracking)

- Remove "page return visits (Supabase)" from warmth signals. Replace with "email clicks (Resend webhooks)".
- Update warmth score description.

### T2 — Update Planning Docs

#### user-flow-waitlist-tool.md

**File:** `docs/planning-docs/user-flow-waitlist-tool.md`

- Line 1196, 1250: "give before ask" → "show reward commitment before ask"
- Line 1201, 1255: "You're at 0 of 3 for early access" → "You've referred 0 of 3 friends toward: Early access"
- Line 1224: "what they earn" → "what they're working toward"
- Line 1270: "The reward ladder reinforces" → "The milestone display reinforces"

#### Waitlist__User_Flow_Diagram_.md

**File:** `docs/planning-docs/Waitlist__User_Flow_Diagram_.md`

- Same framing changes as user-flow doc
- Line 747: "progress bar" → "progress indicator" (the platform shows referral count vs threshold, not a progress bar)

#### jtbd-waitlist-tool.md

**File:** `docs/planning-docs/jtbd-waitlist-tool.md`

- Line 60: "get rewarded for doing so" → "get recognized for doing so, with the founder delivering the reward"

### T3 — Update Epic Doc + Verify Renumbering

**File:** `docs/epics/epic-7-public-waitlist-page.md`

- Update status, story index, definition of done
- Verify story files 7.7 and 7.8 exist with correct frontmatter

### T4 — Update MEMORY.md

**File:** `.memory/MEMORY.md`

Add/update:

1. **Email-First Update Strategy** — email-first with on-page card
2. **Milestone Platform Boundary** — tracker + notifier, not fulfiller. Platform tracks thresholds, sends congratulatory emails, shows pending rewards. Founder delivers actual rewards. "Skip the line" = position boost (automatable).
3. **Hybrid Milestone Defaults** — 1/5/10/25, Recommended badge, first tier ≤3 non-negotiable
4. **Warmth Foundation** — schema + signal tables + scoring formula
5. **Story Numbering** — 7.6/7.7/7.8 renumbered
6. **Standing Decision** — "Platform is a tracker + notifier for milestone rewards, not a fulfiller. Founder handles reward delivery."

### T5 — Update Remaining Docs

All files listed in AC35. For each, update the specific lines to align framing with the tracker+notifier boundary and hybrid milestone defaults.

### Phase 2: Email-First Updates

### T6 — Enhance POST /api/updates with Resend Email Dispatch

**File:** `src/app/api/updates/route.ts`

After successfully inserting the update into `founder_updates`, dispatch a Resend email to all subscribers of that waitlist:

```ts
// After successful insert:
const { data: subscribers } = await supabase
  .from("subscribers")
  .select("email")
  .eq("waitlist_id", waitlist_id);

if (subscribers && subscribers.length > 0) {
  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("name, headline, brand_color")
    .eq("id", waitlist_id)
    .single();

  // Use Resend Batch Send API (REQ-7.1a.1)
  await resend.batch.send({
    from: `${waitlist.name} <updates@prewaitlist.com>`, // Free tier: shared domain
    to: subscribers.map((s) => s.email),
    subject: `Update from ${waitlist.name}`,
    html: buildUpdateEmailHTML(body, waitlist),
  });

  // Mark as sent
  await supabase
    .from("founder_updates")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", updateId);
}
```

**Email template:** Simple HTML email with founder's product name as sender, update body as content, "Powered by PreWaitlist" footer (Free tier), unsubscribe link (CAN-SPAM).

**Resend client:** Create `src/lib/resend.ts`. Use `RESEND_API_KEY` env.

**Error handling:** Email dispatch failure must NOT block the update insert. Wrap in try/catch, log error, set `sent_at` to null on failure.

### T7 — Add sent_at Column

**File:** `docs/stories/sql-writeups/epic7-story6-email-updates.sql` (new)

```sql
alter table public.founder_updates
  add column sent_at timestamptz;

comment on column public.founder_updates.sent_at
  is 'Timestamp when the update was emailed to subscribers. Null if not yet sent or send failed.';
```

### T8 — Reduce On-Page Updates to "Latest Update" Card

**File:** `components/public/updates-feed.tsx` — rewrite to `LatestUpdateCard`:

```tsx
interface LatestUpdateCardProps {
  update: { body: string; created_at: string };
}

export function LatestUpdateCard({ update }: LatestUpdateCardProps) {
  return (
    <div className="rounded-(--card-radius) border border-border bg-card p-4">
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

**Files to modify:**

- `src/app/(public)/[subdomain]/page.tsx` — fetch only latest update, render above form
- `components/public/waitlist-page-content.tsx` — add `latestUpdate` prop
- `components/share/waitlist-template-content.tsx` — add `latestUpdate` slot above form

### T9 — Lint + Build (Updates)

Run `pnpm lint` and `pnpm build`.

### Phase 3: Milestone Hybrid + Fulfillment

### T10 — Update Milestone Defaults

**File:** `src/app/onboarding/3/page.tsx`

Change defaults from 3/10/25 to:

```ts
const DEFAULT_REWARDS = [
  { threshold: 1, label: "Early access", isDefault: true },
  { threshold: 5, label: "Free Pro plan for 1 month", isDefault: true },
  { threshold: 10, label: "Lifetime 20% discount", isDefault: true },
  { threshold: 25, label: "Founding member status", isDefault: true },
];
```

Add "Recommended" badge (Badge variant `info`) that disappears when founder edits either threshold or label.

### T11 — Verify Milestone Edit/Remove + Preview

Verify: add 5th tier (max), remove tiers (min 1), edit thresholds/labels, empty label validation, live preview sync, "Upgrade to add more" at cap (Free tier). Verification only.

### T12 — Milestone Fulfillment (Tracker + Notifier)

**This is the core milestone fulfillment work.** The platform tracks who hit which tier, sends congratulatory emails, and boosts position for "skip the line" rewards.

#### Schema Changes

**File:** `docs/stories/sql-writeups/epic7-story6-milestone-fulfillment.sql` (new)

```sql
-- Milestones earned: tracks which tiers each subscriber has reached
alter table public.subscribers
  add column milestones_earned jsonb;

comment on column public.subscribers.milestones_earned
  is 'JSON array of earned milestones: [{"threshold": 5, "label": "Early access", "earned_at": "2026-08-25T..."}]';

-- Milestones notified: tracks which milestone emails have been sent
alter table public.subscribers
  add column milestones_notified jsonb;

comment on column public.subscribers.milestones_notified
  is 'JSON array of notified thresholds: [5, 10, 25]. Prevents duplicate emails.';
```

#### Milestone Trigger Logic

**File:** `src/lib/milestones.ts` (new)

```ts
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";

interface MilestoneTier {
  threshold: number;
  label: string;
}

export async function checkAndFulfillMilestones(
  subscriberId: string,
  waitlistId: string,
  referralCount: number
) {
  const supabase = await createClient();

  // Fetch milestone config
  const { data: tiers } = await supabase
    .from("milestone_rewards")
    .select("tier_referrals, reward_label")
    .eq("waitlist_id", waitlistId)
    .order("tier_referrals", { ascending: true });

  if (!tiers || tiers.length === 0) return;

  // Fetch subscriber
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("email, milestones_earned, milestones_notified, position")
    .eq("id", subscriberId)
    .single();

  if (!subscriber) return;

  const earned = (subscriber.milestones_earned as MilestoneTier[]) || [];
  const notified = (subscriber.milestones_notified as number[]) || [];

  for (const tier of tiers) {
    const threshold = tier.tier_referrals;

    // Skip if already earned or not yet reached
    if (earned.some((e) => e.threshold === threshold)) continue;
    if (referralCount < threshold) continue;

    // Mark as earned
    const newEarned = [
      ...earned,
      {
        threshold,
        label: tier.reward_label,
        earned_at: new Date().toISOString(),
      },
    ];

    // Send congratulatory email (if not already notified)
    if (!notified.includes(threshold)) {
      try {
        const { data: waitlist } = await supabase
          .from("waitlists")
          .select("name")
          .eq("id", waitlistId)
          .single();

        await resend.emails.send({
          from: `${waitlist?.name || "Waitlist"} <updates@prewaitlist.com>`,
          to: subscriber.email,
          subject: `Congratulations! You earned: ${tier.reward_label}`,
          html: buildMilestoneEmailHTML(tier, referralCount, waitlist),
        });

        const newNotified = [...notified, threshold];

        // "Skip the line" position boost
        let positionUpdate = {};
        if (tier.reward_label.toLowerCase().includes("skip the line")) {
          positionUpdate = { position: 1 };
        }

        await supabase
          .from("subscribers")
          .update({
            milestones_earned: newEarned,
            milestones_notified: newNotified,
            ...positionUpdate,
          })
          .eq("id", subscriberId);
      } catch (err) {
        console.error(
          `Milestone email failed for subscriber ${subscriberId}:`,
          err
        );
        // Still mark as earned even if email fails
        await supabase
          .from("subscribers")
          .update({ milestones_earned: newEarned })
          .eq("id", subscriberId);
      }
    } else {
      await supabase
        .from("subscribers")
        .update({ milestones_earned: newEarned })
        .eq("id", subscriberId);
    }
  }
}
```

#### Integration Point

Call `checkAndFulfillMilestones` from the referral tracking endpoint (Epic 8, Story 8.2) after incrementing a subscriber's referral count. Also call from `POST /api/subscribers` when a new subscriber is created with a `referrer_id` — the referrer's count just incremented.

**File:** `src/app/api/subscribers/route.ts` — after successful insert, if `referrer_id` is present:

```ts
if (referrer_id) {
  // Count referrer's total referrals
  const { count } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", referrer_id);

  // Check and fulfill milestones
  await checkAndFulfillMilestones(referrer_id, waitlist_id, count || 0);
}
```

### T13 — Lint + Build (Milestones)

Run `pnpm lint` and `pnpm build`.

### Phase 4: Warmth Foundation

### T14 — Warmth Schema DDL

**File:** `docs/stories/sql-writeups/epic7-story6-warmth-schema.sql` (new)

```sql
-- Story 7.6: Warmth tracking foundation

-- WARMTH SCORE ON SUBSCRIBERS
alter table public.subscribers
  add column warmth_score text
  check (warmth_score in ('hot', 'warm', 'cold'));

comment on column public.subscribers.warmth_score
  is 'Warmth classification: hot (engaged), warm (moderate), cold (disengaged). Null = unscored.';

-- PAGE VIEWS
create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid references public.subscribers(id) on delete set null,
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  path text not null default '/',
  created_at timestamptz not null default now()
);

create index page_views_waitlist_id_idx on public.page_views(waitlist_id);
create index page_views_subscriber_id_idx on public.page_views(subscriber_id);
create index page_views_created_at_idx on public.page_views(created_at);

alter table public.page_views enable row level security;

create policy "founders manage own waitlist's page views"
  on public.page_views for all
  using (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()))
  with check (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()));

create policy "public insert page views"
  on public.page_views for insert
  with check (true);

-- EMAIL EVENTS
create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  event_type text not null check (event_type in ('sent', 'delivered', 'opened', 'clicked', 'bounced')),
  created_at timestamptz not null default now()
);

create index email_events_waitlist_id_idx on public.email_events(waitlist_id);
create index email_events_subscriber_id_idx on public.email_events(subscriber_id);
create index email_events_event_type_idx on public.email_events(event_type);
create index email_events_created_at_idx on public.email_events(created_at);

alter table public.email_events enable row level security;

create policy "founders manage own waitlist's email events"
  on public.email_events for all
  using (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()))
  with check (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()));
-- NO public insert — server-side only (Resend webhooks)
```

### T15 — GET /api/warmth/:subdomain Route Handler

**File:** `src/app/api/warmth/[subdomain]/route.ts` (new) — returns `{ hot, warm, cold, unscored, total }`.

### T16 — Lint + Build (Warmth)

Run `pnpm lint` and `pnpm build`.

### Phase 5: Final Verification

### T17 — Final Lint + Build

Run `pnpm lint` and `pnpm build`. Verify zero errors.

---

## Files Created

| File                                                               | Purpose                                         |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| `docs/stories/sql-writeups/epic7-story6-email-updates.sql`         | sent_at column migration                        |
| `docs/stories/sql-writeups/epic7-story6-milestone-fulfillment.sql` | milestones_earned + milestones_notified columns |
| `docs/stories/sql-writeups/epic7-story6-warmth-schema.sql`         | warmth_score + page_views + email_events DDL    |
| `src/lib/milestones.ts`                                            | Milestone trigger + fulfillment logic           |
| `src/lib/resend.ts`                                                | Resend client setup                             |
| `src/app/api/warmth/[subdomain]/route.ts`                          | Warmth distribution API endpoint                |

## Files Modified

| File                                                          | Change                                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/app/api/updates/route.ts`                                | Add Resend email dispatch after insert                                                 |
| `src/app/api/subscribers/route.ts`                            | Add milestone check after referral insert                                              |
| `components/public/updates-feed.tsx`                          | Rewrite to LatestUpdateCard                                                            |
| `src/app/(public)/[subdomain]/page.tsx`                       | Fetch latest update only, render above form                                            |
| `components/public/waitlist-page-content.tsx`                 | Add latestUpdate prop                                                                  |
| `components/share/waitlist-template-content.tsx`              | Add latestUpdate slot, fix "Unlock reward" fallback                                    |
| `src/app/onboarding/3/page.tsx`                               | Update defaults to 1/5/10/25, add Recommended badge, update placeholder text           |
| `docs/PRD.md`                                                 | Update data model §7.4, REQ-6.8.3, REQ-6.15, screen table, route table, component tree |
| `docs/product-vision-mvp-waitlist-tool.md`                    | Update Module 2 (milestone framing), Module 3 (warmth signals)                         |
| `docs/planning-docs/user-flow-waitlist-tool.md`               | Update milestone framing (7 references)                                                |
| `docs/planning-docs/Waitlist__User_Flow_Diagram_.md`          | Update milestone framing (6 references)                                                |
| `docs/planning-docs/jtbd-waitlist-tool.md`                    | Update "get rewarded" framing                                                          |
| `docs/epics/epic-7-public-waitlist-page.md`                   | Update story index, status, definition of done                                         |
| `docs/epics/epic-8-thank-you-referral-loop.md`                | Update out-of-scope framing                                                            |
| `docs/epics/completed/epic-6-post-sprint-1-issues.md`         | Update out-of-scope framing                                                            |
| `docs/epics/completed/epic-4-onboarding-wizard.md`            | Update milestone framing                                                               |
| `docs/epics/sprint-1-summary.md`                              | Update milestone references                                                            |
| `docs/stories/story-7.5-public-leaderboard-page.md`           | Update milestone badge framing                                                         |
| `docs/stories/story-7.1-public-waitlist-page-route.md`        | Update "milestones" → "milestone display"                                              |
| `docs/stories/story-7.8-epic7-tests.md`                       | Update component inventory                                                             |
| `docs/stories/story-8.2-referral-tracking-api.md`             | Update out-of-scope framing                                                            |
| `docs/stories/story-8.3-referred-subscriber-variant.md`       | Update out-of-scope framing                                                            |
| `docs/design/design-analysis.md`                              | Update stale 3/10/25 tier references                                                   |
| `docs/prompts/sprint-2-design-analysis-prompt.md`             | Update milestone references                                                            |
| `docs/stories/sql-writeups/fix-public-read-policies.sql`      | Update comment "leaderboard badges" → "milestone display"                              |
| `docs/stories/sql-writeups/epic0.story03-supabase-schema.sql` | Update policy comment                                                                  |
| `.memory/MEMORY.md`                                           | Update with all decisions                                                              |

## Available Components

- `Badge` ✓ (variant `info` for Recommended badge)
- `Button` ✓
- `Card` ✓ (for LatestUpdateCard)
- `cn()` ✓

## Warmth Scoring Formula (Reference — Sprint 3 Execution)

Schema created here. Runtime scoring is Sprint 3.

```
score = (email_opens × 1) + (email_clicks × 3) + (qualification_completed × 2)

hot:  score >= 5
warm: score >= 2 AND score < 5
cold: score < 2 OR no activity in 14 days
```

**Execution:** Cron job or Supabase Edge Function runs nightly, recalculates scores, updates `subscribers.warmth_score`.

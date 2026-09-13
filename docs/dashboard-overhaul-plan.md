# Dashboard Overhaul — Gap Analysis & Recommendation Plan

**Date:** 2026-09-13
**Methodology:** Code audit (every dashboard file), competitor research (KickoffLabs, Viral Loops, Prefinery, Waitlister, Linear, Stripe, Vercel), PRD/user-flow doc cross-reference, SaaS UX research (SaaSUI, SaaSFrame, Flowjam, Appcues).

---

## Part 1: Product Identity (What the dashboard must serve)

### What PreWaitlist IS

> "A pre-launch waitlist tool for bootstrapped indie hackers, solo founders, and early-stage startup teams. Differentiates on three things no competitor bundles at this price: qualification (who's serious), warmth tracking (who's going cold), and referral quality (which referrers actually matter)."

### Target User

**[Founder]** — a solo indie hacker or early-stage founder running a pre-launch waitlist. Non-technical. Needs to understand their list health at a glance and take action to improve it.

### Key Differentiators

1. **Qualification** — who's serious (inline questions)
2. **Warmth tracking** — who's going cold (email engagement scoring: Hot/Warm/Cold)
3. **Referral quality** — which referrers actually matter (quality score formula)

### Platform Role

- "Platform is a tracker + notifier, not a fulfiller."
- "Email is the primary engagement channel. On-page updates are a secondary social-proof surface."
- "Every other tool tells you how many people signed up. This one tells you which of them will actually show up when you launch."

### Free vs Pro

| Feature              | Free               | Pro       |
| -------------------- | ------------------ | --------- |
| Waitlist + subdomain | ✅                 | ✅        |
| Up to 500 signups    | ✅                 | ✅        |
| Qual questions       | 2 max              | 5 max     |
| Custom sender email  | Locked             | Editable  |
| Domain verification  | No                 | Yes       |
| Warmth panel         | Locked placeholder | Live data |
| CSV export           | No                 | Yes       |
| "Powered by" footer  | Yes                | No        |
| Broadcast email      | No                 | Yes       |

---

## Part 2: What Was Built vs What Should Exist

### What's Currently on the Dashboard

| Section             | What it shows                                                            | Status                                      |
| ------------------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| Sidebar             | 8 nav items, lock icons on Warmth/Broadcast, upgrade CTA                 | Confusing (see issues)                      |
| Header bar          | Subdomain + Copy + Share on Twitter                                      | Works                                       |
| Empty state         | "Get your first signups" checklist + Share button                        | Misplaced onboarding content                |
| Stat cards          | Total signups, Referral %, Today, Warmth (—)                             | No comparison deltas                        |
| Signup chart        | 30d/All Time bar chart                                                   | Works, no comparison                        |
| Top referrers       | Top 5 by quality score                                                   | Works                                       |
| Qualification panel | Answer distribution bars                                                 | Works                                       |
| Warmth panel        | Hot/Warm/Cold/Unscored bars                                              | Works (always visible, sidebar says locked) |
| Subscriber table    | 6-column grid with search/sort/filter                                    | Mobile overflow, no pagination              |
| Settings            | Sender name, threshold, billing (dead buttons), sender domain (disabled) | Incomplete                                  |
| Broadcast           | Compose + segment selector                                               | Works (defaults to wrong segment)           |

### What's Missing (from PRD, user-flow doc, and competitor analysis)

| Missing Feature                 | Source                  | Priority    |
| ------------------------------- | ----------------------- | ----------- |
| Founder updates compose UI      | PRD, user-flow F-E1     | Must-have   |
| Archive/close waitlist          | User-flow F-H2          | Must-have   |
| Edit page after onboarding      | User-flow, common sense | Must-have   |
| Comparison deltas on stat cards | Competitor standard     | Should-have |
| Recent activity feed            | Competitor standard     | Should-have |
| Onboarding progress checklist   | Best practice           | Should-have |
| Warmth lock/unlock consistency  | Code inconsistency      | Must-fix    |
| Paddle billing integration      | Dead buttons            | Must-have   |
| Subscriber table pagination     | Performance             | Should-have |
| Mobile table responsiveness     | Broken on mobile        | Must-fix    |

---

## Part 3: Dashboard Issues — Categorized

### A. Information Architecture Issues

| #   | Issue                                                                        | Impact                                           | Evidence                                       |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| A1  | **Sidebar has 8 items, no grouping**                                         | Wall of links — users can't prioritize           | `sidebar.tsx` — flat list, no sections         |
| A2  | **"Overview" and "Subscribers" both link to `/dashboard`**                   | Confusing — what's the difference?               | `sidebar.tsx:82,92` — both `href="/dashboard"` |
| A3  | **Disabled items (Qualification, Leaderboard, Updates) have no explanation** | Users think they're broken                       | No tooltip, no "coming soon" label             |
| A4  | **Warmth is locked in sidebar but WarmthPanel is always visible**            | Inconsistent tier gating                         | Sidebar lock icon vs WarmthPanel with no lock  |
| A5  | **Settings page has dead buttons**                                           | "Upgrade to Pro" and "Manage billing" do nothing | `settings/client.tsx:207-219` — no onClick     |
| A6  | **Sidebar "Upgrade to Pro" links to `#`**                                    | Dead link                                        | `sidebar.tsx:381` — `href="#"`                 |
| A7  | **Product dropdown arrow suggests multi-waitlist**                           | Misleading — feature doesn't exist               | Header shows chevron, no dropdown              |

### B. Empty State & Onboarding Issues

| #   | Issue                                                                       | Impact                                                       | Evidence                                         |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| B1  | **"Get your first signups" checklist is onboarding content, not dashboard** | Takes up prime real estate, confuses returning users         | `client.tsx:236-289` — checklist in main content |
| B2  | **Checklist state is not persisted**                                        | Lost on every refresh                                        | `useState` only, no localStorage                 |
| B3  | **"Preview — this is what it'll look like once signups arrive"**            | Contradictory when real data exists (2 signups shown)        | `client.tsx:288` — always renders                |
| B4  | **Empty state guidance is weak**                                            | "Share your link" is the only advice                         | No copy suggestions, no communities, no timeline |
| B5  | **No onboarding progress indicator**                                        | Users don't know what steps they've completed or what's left | No progress bar or step completion tracking      |

### C. Stat Card Issues

| #   | Issue                                 | Impact                                               | Evidence                                  |
| --- | ------------------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| C1  | **No comparison deltas**              | Numbers without context are just facts, not insights | "2 signups" — is that good? Bad? vs what? |
| C2  | **Warmth stat card always shows "—"** | Even when warmth data is available from server       | `client.tsx:311` — hardcoded "—"          |
| C3  | **No sparklines or trend indicators** | Can't see direction of metric                        | Static numbers only                       |
| C4  | **4 cards on same visual weight**     | Nothing leads the eye to the primary metric          | All cards identical size/style            |

### D. Subscriber Table Issues

| #   | Issue                                                              | Impact                                                 | Evidence                                                  |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------- |
| D1  | **No pagination or virtualization**                                | 500 subscribers = 500 DOM rows, performance tank       | `client.tsx:495-660` — full list rendered                 |
| D2  | **6-column grid overflows on mobile**                              | Columns compress or disappear                          | No `overflow-x-auto` wrapper, no responsive column hiding |
| D3  | **Warmth sort direction is inverted**                              | "↓" shows hot first, but "desc" should mean cold first | `client.tsx:141` — confusing UX                           |
| D4  | **Two-click pattern (expand + navigate) has race condition**       | Double-click fires both expand and navigation          | `toggleRow` logic                                         |
| D5  | **Quality column header says "Quality" but data is quality_score** | Unclear what "Quality" means to a founder              | No tooltip explaining the metric                          |

### E. Data & Performance Issues

| #   | Issue                                                   | Impact                                                 | Evidence                           |
| --- | ------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------- |
| E1  | **Duplicate `/api/dashboard/warmth` fetch**             | WarningBanner and WarmthPanel both fetch independently | Two identical API calls per load   |
| E2  | **No caching on any API route**                         | Every page load re-fetches everything                  | No `Cache-Control`, no SWR         |
| E3  | **Qualification API loads ALL subscribers into memory** | O(N) in-memory count, slow for large lists             | `qualification/route.ts`           |
| E4  | **No real-time updates**                                | Dashboard is static until manual refresh               | No Supabase realtime subscriptions |
| E5  | **No error handling on settings save**                  | User sees "Saving..." forever if fetch fails           | `settings/client.tsx:43-77`        |

### F. Design Token Violations

| #   | Issue                                          | Impact                                               | Evidence                   |
| --- | ---------------------------------------------- | ---------------------------------------------------- | -------------------------- |
| F1  | **Sidebar uses `bg-[#FCFCFB]`**                | Not a design system token                            | `sidebar.tsx:239`          |
| F2  | **WarningBanner uses raw Tailwind yellow**     | `border-yellow-200`, `bg-yellow-50`, etc. not tokens | `warning-banner.tsx:36`    |
| F3  | **Recharts hardcodes `#6b6b6b` and `#e0ddd8`** | Should use CSS custom properties                     | `signup-chart.tsx:106-108` |
| F4  | **Email event log hardcodes badge colors**     | `bg-green-100 text-green-800` etc.                   | `email-event-log.tsx`      |

### G. Broadcast Issues

| #   | Issue                                           | Impact                                           | Evidence                   |
| --- | ----------------------------------------------- | ------------------------------------------------ | -------------------------- |
| G1  | **Segment defaults to "cold"**                  | Unusual default — most founders want "all" first | `broadcast/client.tsx:37`  |
| G2  | **No confirmation dialog before sending**       | Click fires immediately, no undo                 | `broadcast/client.tsx:60`  |
| G3  | **Preview hardcodes `updates@prewaitlist.com`** | Should use actual from address                   | `broadcast/client.tsx:226` |
| G4  | **No subject/body length validation**           | Could send 10KB email body                       | Only checks empty          |

---

## Part 4: What Competitors Do (Proven Patterns)

### Dashboard Structure (KickoffLabs, Viral Loops, Prefinery)

| Pattern                         | Source      | Insight                                                               |
| ------------------------------- | ----------- | --------------------------------------------------------------------- |
| **Campaign-first nav**          | KickoffLabs | 4 clear sections (Campaigns, Leads, Reports, Setup), not 8 flat items |
| **Leaderboard as primary view** | Viral Loops | Ranks participants by referrals — shows who matters                   |
| **Stateful user flow**          | Prefinery   | Applied → Invited → Active — tracked visually                         |
| **"Addition by subtraction"**   | KickoffLabs | Dashboard redesign removed more than it added                         |
| **Performance overview cards**  | Waitlister  | 3 cards with comparison indicators (↑12% vs last week)                |

### Stat Cards (SaaSUI, PatternFly)

| Pattern                         | Source     | Insight                                                               |
| ------------------------------- | ---------- | --------------------------------------------------------------------- |
| **Delta + trend direction**     | SaaSUI     | Every card shows comparison against prior period                      |
| **Sparklines**                  | PatternFly | Small inline chart showing trend shape                                |
| **Primary metric leads**        | SaaSFrame  | One strong primary metric beats five equal cards                      |
| **"Comparison is the insight"** | SaaSUI     | "If a card shows a number, it should show what it's measured against" |

### Empty States (Jimo.ai, Airtable, Notion)

| Pattern                       | Source         | Insight                                                                 |
| ----------------------------- | -------------- | ----------------------------------------------------------------------- |
| **Pre-populated sample data** | Airtable       | Empty state isn't empty — shows what it WILL look like                  |
| **Warm human-voiced prompt**  | Notion         | Friendly, not robotic                                                   |
| **Single clear CTA**          | ActiveCampaign | One action, not five                                                    |
| **Benefit-led language**      | Flowjam        | "Connect your CRM to see which leads are engaging" > "Connect your CRM" |

### Onboarding Checklists (Flowjam, Sked Social)

| Pattern                     | Source      | Insight                                                      |
| --------------------------- | ----------- | ------------------------------------------------------------ |
| **Persistent task list**    | Flowjam     | 4-6 steps between signup and full activation                 |
| **Zeigarnik effect**        | Psychology  | People remember uncompleted tasks — checklists are sticky    |
| **3x conversion boost**     | Sked Social | Users who completed checklist were 3x more likely to convert |
| **Phase 1: Orient (0-60s)** | Flowjam     | Welcome screen, role selection, set expectations             |

### Sidebar Navigation

| Pattern                         | Source            | Insight                                                |
| ------------------------------- | ----------------- | ------------------------------------------------------ |
| **220-260px width**             | Industry standard | Our sidebar is 268px — slightly wide but acceptable    |
| **7-8 items max**               | Best practice     | We have 8 — at the limit, needs grouping               |
| **Group into logical sections** | SaaSFrame         | Past 7-8 items, ungrouped = wall of links              |
| **Active state unmistakable**   | Linear            | Green pill is good — but greyed items need explanation |
| **Icons alongside labels**      | Standard          | We have icons — but inconsistent styles                |

### Locked Feature Treatment

| Pattern                           | Source         | Insight                                              |
| --------------------------------- | -------------- | ---------------------------------------------------- |
| **Disabled + upgrade CTA**        | Linear, Vercel | Feature visible but greyed, "Upgrade" badge on it    |
| **Overlay lock**                  | Most SaaS      | Content visible but blurred with "Available on Pro"  |
| **Feature teaser in empty state** | Common         | Show what it WILL do when upgraded                   |
| **Sidebar lock**                  | Notion         | Lock icon + tooltip — our current pattern is correct |

---

## Part 5: Recommended Dashboard Overhaul

### Phase 1: Fix Critical Issues (Must-Fix, no new features)

**Goal:** Make what exists work correctly.

| #    | Fix                                                                                           | Files                                    | Effort |
| ---- | --------------------------------------------------------------------------------------------- | ---------------------------------------- | ------ |
| 1.1  | **Fix sidebar: add "Coming soon" labels to disabled items, add tooltip for locked items**     | `sidebar.tsx`                            | Low    |
| 1.2  | **Fix sidebar: remove dropdown arrow from Product name** (no multi-waitlist yet)              | `sidebar.tsx`                            | Low    |
| 1.3  | **Fix sidebar: wire "Upgrade to Pro" to Paddle checkout** (or remove if not ready)            | `sidebar.tsx`                            | Medium |
| 1.4  | **Fix settings: wire "Upgrade to Pro" and "Manage billing" buttons**                          | `settings/client.tsx`                    | Medium |
| 1.5  | **Fix mobile: add `overflow-x-auto` wrapper to subscriber table**                             | `client.tsx`                             | Low    |
| 1.6  | **Fix loading skeleton: sidebar width `w-60` → `w-67`**                                       | `loading.tsx`                            | Low    |
| 1.7  | **Fix duplicate fetch: share warmth data between WarningBanner and WarmthPanel**              | `warning-banner.tsx`, `warmth-panel.tsx` | Low    |
| 1.8  | **Fix settings save: add error feedback** (try/catch with error state)                        | `settings/client.tsx`                    | Low    |
| 1.9  | **Fix broadcast: default segment to "all"**                                                   | `broadcast/client.tsx:37`                | Low    |
| 1.10 | **Fix broadcast: add confirmation dialog before send**                                        | `broadcast/client.tsx`                   | Low    |
| 1.11 | **Fix design tokens: replace hardcoded colors with tokens** (sidebar, warning, chart, badges) | Multiple files                           | Low    |
| 1.12 | **Fix qualification panel: `wshrink-0` → `shrink-0` typo**                                    | `qualification-panel.tsx:88`             | Low    |

**Estimated effort:** 1-2 days

### Phase 2: Redesign Empty State & Onboarding (High impact, moderate effort)

**Goal:** Make the dashboard feel "alive" from the first visit.

| #   | Change                                        | Detail                                                                                                                                       | Effort |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2.1 | **Replace checklist with progress indicator** | Show setup steps completed: ✅ Name waitlist, ✅ Choose template, ✅ Customize page, ☐ Share your page, ☐ Add qual questions, ☐ Set up email | Medium |
| 2.2 | **Design proper empty state**                 | "Your waitlist is live at [subdomain]" + Copy Link CTA + View Public Page CTA + "Here's what happens next" guidance                          | Medium |
| 2.3 | **Remove "Preview" label**                    | The "Preview — this is what it'll look like" text should only show when there are 0 signups. When data exists, show the data.                | Low    |
| 2.4 | **Add copy guidance**                         | "Share in relevant communities, tell 5 people personally, post on social" — specific, actionable, not generic                                | Low    |
| 2.5 | **Persist checklist state**                   | Save to localStorage so progress survives refresh                                                                                            | Low    |

**Estimated effort:** 2-3 days

### Phase 3: Upgrade Stat Cards (Competitive parity)

**Goal:** Numbers become insights, not just facts.

| #   | Change                       | Detail                                                                                             | Effort |
| --- | ---------------------------- | -------------------------------------------------------------------------------------------------- | ------ |
| 3.1 | **Add comparison deltas**    | "12 signups ↑20% vs last week" — green for up, red for down (contextual: churn going down = green) | Medium |
| 3.2 | **Add sparklines**           | Small inline trend line on each card showing 7-day shape                                           | Medium |
| 3.3 | **Connect warmth stat card** | Show actual warmth distribution summary, not hardcoded "—"                                         | Low    |
| 3.4 | **Visual hierarchy**         | Make Total Signups the primary card (slightly larger or accented), others secondary                | Low    |

**Estimated effort:** 2-3 days

### Phase 4: Fix Tier Gating Consistency (Must-fix for trust)

**Goal:** Locked features are consistently locked everywhere.

| #   | Change                                    | Detail                                                           | Effort |
| --- | ----------------------------------------- | ---------------------------------------------------------------- | ------ |
| 4.1 | **Warmth panel: locked overlay for Free** | Show greyed bars + "Upgrade to Pro to see warmth scores" message | Low    |
| 4.2 | **Warmth stat card: locked state**        | Show "—" with lock icon, not just "—"                            | Low    |
| 4.3 | **CSV export: trigger upgrade modal**     | Instead of hidden, show button that opens upgrade modal          | Low    |
| 4.4 | **Sidebar tooltips**                      | Hovering locked items shows "Pro feature — upgrade to unlock"    | Low    |

**Estimated effort:** 1 day

### Phase 5: Add Missing Dashboard Features (New build)

**Goal:** Dashboard becomes a complete command center.

| #   | Feature                         | Detail                                                                    | Effort |
| --- | ------------------------------- | ------------------------------------------------------------------------- | ------ |
| 5.1 | **Founder updates compose UI**  | Dashboard page with textarea + publish button, calls `POST /api/updates`  | Medium |
| 5.2 | **Recent activity feed**        | "X joined", "Y referred Z", "Z moved up" — last 10 events                 | Medium |
| 5.3 | **Subscriber table pagination** | Page-based prev/next, 25 per page, "Showing 1-25 of 142"                  | Low    |
| 5.4 | **Onboarding progress bar**     | Visual progress: Step 1 ✅ → Step 2 ✅ → ... → Live                       | Low    |
| 5.5 | **Quick actions section**       | "Share your page", "Send broadcast", "View public page" — contextual CTAs | Low    |

**Estimated effort:** 3-5 days

### Phase 6: Data & Performance (Architecture improvements)

**Goal:** Dashboard loads fast and stays current.

| #   | Change                                         | Detail                                                             | Effort |
| --- | ---------------------------------------------- | ------------------------------------------------------------------ | ------ |
| 6.1 | **Add `Cache-Control` headers to API routes**  | 30s stale-while-revalidate for chart, qual, warmth                 | Low    |
| 6.2 | **Share warmth data via context**              | Single fetch, distribute to WarningBanner + WarmthPanel + StatCard | Medium |
| 6.3 | **Add Supabase realtime for subscriber count** | Live updates when new signups arrive                               | Medium |
| 6.4 | **Virtualize subscriber table**                | Use `react-window` or similar for >100 rows                        | Medium |

**Estimated effort:** 3-4 days

### Phase 7: Settings & Billing (Complete the loop)

**Goal:** Settings page is functional, not placeholder.

| #   | Change                          | Detail                                                                       | Effort |
| --- | ------------------------------- | ---------------------------------------------------------------------------- | ------ |
| 7.1 | **Paddle checkout integration** | "Upgrade to Pro" triggers Paddle checkout flow                               | High   |
| 7.2 | **Billing management**          | Show current plan, next charge, payment method, invoices                     | High   |
| 7.3 | **Edit page after onboarding**  | Settings section to change headline, template, brand color, CTA text         | Medium |
| 7.4 | **Archive waitlist**            | Settings danger zone: archive (closes signups) + delete (typed confirmation) | Medium |
| 7.5 | **Delete account**              | GDPR compliance: typed confirmation, data deletion                           | Medium |

**Estimated effort:** 5-8 days

---

## Part 6: Information Architecture — Proposed Sidebar Redesign

### Current (8 items, flat)

```
Overview          → /dashboard
Subscribers       → /dashboard (same!)
Qualification     → disabled (greyed, no explanation)
Leaderboard       → disabled (greyed, no explanation)
Warmth            → locked (Pro)
Updates           → disabled (greyed, no explanation)
Broadcast         → locked (Pro)
Settings          → /dashboard/settings
```

### Proposed (grouped, clear states)

```
── COMMAND CENTER ──
Overview          → /dashboard (active: stat cards + chart + activity)
Subscribers       → /dashboard#subscribers (scrolls to table, or dedicated page)

── INSIGHTS ──
Qualification     → /dashboard/qualification (Pro: full breakdown, Free: teaser)
Leaderboard       → /dashboard/leaderboard (Pro: full view, Free: teaser)
Warmth            → /dashboard/warmth (Pro: live data, Free: locked overlay)

── ENGAGEMENT ──
Updates           → /dashboard/updates (compose + feed)
Broadcast         → /dashboard/broadcast (Pro only, Free: upgrade modal)

── CONFIG ──
Settings          → /dashboard/settings
```

**Key changes:**

- Group by purpose (command center, insights, engagement, config)
- Remove duplicate "Subscribers" link — make it scroll to table or dedicated page
- Every item is always visible but shows appropriate state (teaser/locked/full)
- "Coming soon" label on items not yet built

---

## Part 7: Stat Card Design — Before vs After

### Current

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│    2     │ │   50%    │ │    2     │ │    —     │
│  Total   │ │ Referral │ │  Today   │ │ Warmth   │
│ signups  │ │    %     │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Proposed

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Total Signups  │ │   Referral %    │ │  Today's Signups│ │  Warmth Score   │
│       12        │ │      50%        │ │       2         │ │   🔥 3 Hot      │
│  ↑ 20% vs lw   │ │  ↑ 5% vs lw    │ │  vs 1 yesterday │ │   🟡 5 Warm     │
│  ═══════════    │ │  ═══════════    │ │  ═══════════    │ │   🔵 4 Cold     │
│  [sparkline]    │ │  [sparkline]    │ │  [sparkline]    │ │  [mini bars]    │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

**Key changes:**

- Delta comparison ("↑ 20% vs last week")
- Sparkline showing 7-day trend
- Warmth shows actual distribution, not just "—"
- Primary metric (Total Signups) slightly larger/accent border

---

## Part 8: Empty State Design — Before vs After

### Current

```
Get your first signups
[Share your link →]

☐ Post in one relevant community
☐ Tell 5 people personally

Preview — this is what it'll look like once signups arrive
[stat cards with data]
[chart]
```

### Proposed (0 signups)

```
🎉 Your waitlist is live at product.prewaitlist.com

[Copy Link]  [View Public Page]

What to do next:
1. Share your page in 1-2 relevant communities
2. Tell 5 people personally — personal asks convert 3x better
3. Post on social with your referral link

Once people start signing up, you'll see:
[ghost stat cards — greyed with 0 values]
[ghost chart — empty bars]
```

### Proposed (has signups)

```
Your waitlist has 12 subscribers ↑ 20% vs last week

[Copy Link]  [View Public Page]  [Send Broadcast]

[stat cards with deltas]
[chart]
[subscriber table]
```

---

## Part 9: Implementation Priority

| Phase | What                                         | Effort   | Impact              | Do first? |
| ----- | -------------------------------------------- | -------- | ------------------- | --------- |
| 1     | Fix critical bugs                            | 1-2 days | High (trust)        | ✅ Yes    |
| 2     | Empty state & onboarding                     | 2-3 days | High (activation)   | ✅ Yes    |
| 3     | Stat card upgrades                           | 2-3 days | Medium (insight)    | Next      |
| 4     | Tier gating consistency                      | 1 day    | Medium (trust)      | Next      |
| 5     | New features (updates, activity, pagination) | 3-5 days | High (completeness) | After     |
| 6     | Data & performance                           | 3-4 days | Medium (speed)      | After     |
| 7     | Settings & billing                           | 5-8 days | High (monetization) | Last      |

**Total estimated effort:** 17-26 days (solo founder pace)

**Recommended order:** Phase 1 → Phase 2 → Phase 4 → Phase 3 → Phase 5 → Phase 6 → Phase 7

Phase 1 + 2 + 4 can ship in one sprint (5-6 days) and make the dashboard feel dramatically more complete.

---

## Part 10: Files to Modify

### Phase 1 (Critical fixes)

- `components/dashboard/sidebar.tsx` — labels, tooltips, dropdown arrow, upgrade link
- `src/app/dashboard/settings/client.tsx` — button wiring, error handling
- `src/app/dashboard/client.tsx` — mobile overflow, preview label
- `src/app/dashboard/loading.tsx` — skeleton width
- `components/dashboard/warning-banner.tsx` — share warmth data, tokens
- `components/dashboard/warmth-panel.tsx` — share warmth data
- `components/dashboard/signup-chart.tsx` — design tokens
- `components/dashboard/qualification-panel.tsx` — typo fix
- `src/app/dashboard/broadcast/client.tsx` — default segment, confirmation

### Phase 2 (Empty state & onboarding)

- `src/app/dashboard/client.tsx` — replace checklist, redesign empty state
- `src/app/dashboard/page.tsx` — pass additional data for progress indicator

### Phase 3 (Stat cards)

- `src/app/dashboard/client.tsx` — stat card redesign with deltas
- New: `src/app/api/dashboard/stats/route.ts` — comparison data endpoint

### Phase 4 (Tier gating)

- `components/dashboard/warmth-panel.tsx` — locked overlay
- `src/app/dashboard/client.tsx` — warmth stat card locked state
- `components/dashboard/sidebar.tsx` — tooltips

### Phase 5 (New features)

- New: `src/app/dashboard/updates/page.tsx` + `client.tsx` — compose UI
- `src/app/dashboard/client.tsx` — activity feed, pagination

### Phase 6 (Performance)

- `src/app/api/dashboard/chart/route.ts` — cache headers
- `src/app/api/dashboard/qualification/route.ts` — cache headers
- `src/app/api/dashboard/warmth/route.ts` — cache headers

### Phase 7 (Settings & billing)

- `src/app/dashboard/settings/client.tsx` — Paddle integration
- New: `src/app/dashboard/settings/billing/page.tsx` — billing management
- New: `src/app/dashboard/settings/danger-zone/page.tsx` — archive/delete

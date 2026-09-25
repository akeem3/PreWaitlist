# Product Vision & MVP Feature Map — Pre-Launch Waitlist Tool

**Document Type:** Product Vision & Feature Grading
**Product:** Pre-Launch Waitlist Tool
**Prepared By:** Abdul-Hakeem Hassan
**Date:** June 2026
**Version:** 4.2 — 2026-08-13: Dashboard navigation restructured from Sprint 1's top tabs to a left sidebar + top bar, per dashboard-layout research; full dashboard design content split into a dedicated `dashboard-design-spec.md`, referenced from Module 5 and Sprint 2. Sprint 2's "what gets built" now itemizes the shell restructure, the locked/empty warmth placeholder, and the dual-location (onboarding + Settings) signup-counter threshold. Previous sync (v4.1, same date): signup counter threshold config added to Module 1 + Pricing; qualification-question display timing corrected to inline/pre-submit; Sprint 2 screen list updated to retire S-B2a and add S-B5 Public Leaderboard page; leaderboard anonymous-subscriber display convention added.
**Follows From:** Problem Brief v2 · User Profile v2 · JTBD v2 · Field Research Report v1

---

## User Legend

This product has two distinct users. Every feature serves one or both. They are labelled throughout as:

- **[Founder]** — the person who pays for the tool, builds the waitlist, and manages it
- **[Subscriber]** — the person who joins the waitlist (the founder's audience)

---

## The Ideal Product in Plain English

A founder gets an idea at 11pm. They want to share it before they talk themselves out of it. In 4 minutes they have a page that looks like a real product. They share it. They sleep.

They wake up to 23 signups — 9 from referrals they did not send. The dashboard tells them which 8 of those people are currently using a paying competitor. They know who to call first.

Three weeks later, the tool tells them 40% of their list has gone cold. They send a re-engagement email to the cold segment, a launch update to the warm and hot segments. They launch. They already know who will convert.

That is the product. Not just an email collector — a pre-launch intelligence system that tells founders who actually wants what they are building, not just who clicked a link.

The data that makes this necessary: most waitlists convert at 2–3% on launch day — meaning 2–3% of people who signed up become paying customers when the product launches. This is not the page-to-signup conversion rate, which sits at ~15% for average pages and up to 40% for community-powered ones. The failure is not getting people onto the list. It is what happens to those signups over the following weeks. Users who wait over 90 days for access show conversion dropping to single digits. Users converted within one month average 50% final conversion. Rows.com documented 0% conversion for signups older than six months, with many email addresses going invalid before launch day. The decay is real, documented, and predictable — but no current tool makes it visible before it is too late to act.

---

> **The product in one sentence**
>
> The only pre-launch waitlist tool that tells you who on your list actually wants what you're building — most waitlists convert 2–3% of signups to customers at launch; this one shows you who that 3% is before launch day. Free up to 500 signups, beautifully designed, referral loop included, qualification and warmth tracking built in.

---

## Why Version 2 Exists

Two competitors entered the market after v1 was scoped:

- **Presignup** — same free tier (500 signups), same $15/month price, same referral mechanic as the original plan. Their landing page builder is still in beta as of May 2026. The original plan is no longer differentiated enough on its own.
- **Baitlist** — intent-scoring with AI. Signups answer 3–5 questions, scored 0–100. Good concept, but adds friction, caps free at 50 signups, priced at EUR 29/month. Out of reach for the bootstrapped founder.

The response: own the one dimension nobody has at the free or $15/month tier — **the quality of the list, not the size of it.** Qualification, Warmth Tracking, and Referral Quality Score are now in the MVP.

---

## What Makes This Different

| What users need                     | Current market reality                                            | What this product does                                     |
| ----------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| Free tier for a full campaign       | GetWaitlist gone. Presignup at 500 but no qualification           | Free: 500 signups + qualification + warmth tracking        |
| Page that looks like a product      | Every tool below $50/month is mediocre. Presignup builder in beta | 3 professionally designed templates. Design is the edge    |
| Under 5 minutes to a shareable URL  | KickoffLabs: documented 3 hours. Most tools: 20–30 min            | 4 minutes from account creation to live shareable page     |
| Know which signups actually matter  | Every tool gives a count. Nobody gives quality signals            | Qualification + Warmth score + Referral quality score      |
| Keep the list warm before launch    | No tool measures list health. Founders find dead lists at launch  | Hot/Warm/Cold per subscriber. Segment broadcasts by warmth |
| Founder-to-subscriber communication | No tool has an updates feed below any price point                 | Founder updates feed on the public page + broadcast email  |

---

## Feature Grading Key

| Grade         | Meaning                                                |
| ------------- | ------------------------------------------------------ |
| 🔵 **Core**   | Non-negotiable. MVP is broken without it               |
| 🟢 **Should** | Strongly recommended. Cut only if timeline is critical |
| ⚪ **v1.1**   | Valuable. Ship after first paying users                |
| 🔷 **Scale**  | Relevant at meaningful user volume. Not before         |
| 🔴 **Out**    | Not this product. Explicitly excluded                  |

---

## Module 1 — Landing Page Builder

_The founder's first artifact. The public face of their product before it exists. Design quality is the competitive edge while Presignup's builder is in beta._

| Feature                                                    | User                                 | Grade     | Why                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------- | ------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page editor: headline, subheadline, logo, CTA text, colour | [Founder]                            | 🔵 Core   | Without this there is no page                                                                                                                                                                                                                                                                                                                   |
| 3 starter templates (minimal, bold, dark)                  | [Founder]                            | 🔵 Core   | Covers the aesthetic preferences of 90% of target audience. Presignup's builder is in beta — this is the window                                                                                                                                                                                                                                 |
| Mobile-responsive output                                   | [Subscriber]                         | 🔵 Core   | Most visitors arrive on mobile via a shared Twitter/X link. Non-negotiable                                                                                                                                                                                                                                                                      |
| Live preview while editing                                 | [Founder]                            | 🔵 Core   | Instant feedback kills the hesitation that makes founders second-guess and abandon                                                                                                                                                                                                                                                              |
| Shareable subdomain (yourproduct.toolname.com)             | [Founder] + [Subscriber]             | 🔵 Core   | Live the moment the page is saved. Free tier gets this. Also the organic flywheel — every shared link is a free ad                                                                                                                                                                                                                              |
| Social meta tags (og:title, og:image, og:description)      | [Subscriber]                         | 🔵 Core   | Auto-generated from page content. If the Twitter link preview looks bad, the founder stops using the tool and the subscriber never clicks through                                                                                                                                                                                               |
| Founder updates feed on the page                           | [Founder] posts · [Subscriber] reads | 🔵 Core   | Short public posts: "Just hit 200 signups. Here's what we're building." No competitor has this. Drives subscriber return visits, which feeds Warmth Tracking. First step toward community without the infrastructure cost                                                                                                                       |
| Live signup count display ("1,189 people in line")         | [Subscriber]                         | 🟢 Should | Research-proven conversion lift. Founder-toggleable, with a configurable threshold — "show once I have N or more signups" — so founders with a low early count can delay visibility rather than hide it outright. Free tier feature, same category as the referral leaderboard, not gated to paid tiers. [CONFIRMED BUILT — Sprint 1, Epic 6.0] |
| Countdown timer to launch                                  | [Subscriber]                         | ⚪ v1.1   | Useful for founders with a hard launch date. Not universally needed. Add based on requests                                                                                                                                                                                                                                                      |
| Video embed section                                        | [Subscriber]                         | ⚪ v1.1   | Some founders want to show a demo. Adds complexity. Defer                                                                                                                                                                                                                                                                                       |
| More templates (5+)                                        | [Founder]                            | ⚪ v1.1   | Startup, creator, mobile app, game, SaaS variants. Expand after core 3 are validated                                                                                                                                                                                                                                                            |
| Custom fonts                                               | [Founder]                            | ⚪ v1.1   | Design-sensitive creators want this. Not needed for v1                                                                                                                                                                                                                                                                                          |
| Custom domain (user's own domain)                          | [Founder] + [Subscriber]             | ⚪ v1.1   | High-demand. Most technically complex (DNS, SSL). Ship after first paying users                                                                                                                                                                                                                                                                 |

---

## Module 2 — Signup, Qualification & Referral System

_The engine. The referral loop drives growth. The qualification layer is the differentiator. Together they make this product worth building._

| Feature                                                                                                                                             | User                                                                                 | Grade     | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email capture form (email only — first name moved to an optional post-signup field, see thank-you page) [SYNC FIX — 2026-07-19: was "name + email"] | [Subscriber] submits · [Founder] receives                                            | 🔵 Core   | Foundation. Supabase insert. Duplicate prevention                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Qualification questions (2–3 optional, founder-configures)                                                                                          | [Founder] sets · [Subscriber] answers                                                | 🔵 Core   | Founder sets questions at waitlist setup. Examples: "What are you currently using?", "What's your role?", "What's your biggest pain?" Optional for the subscriber — no friction forced. Biggest differentiator vs Presignup                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Unique referral link per subscriber                                                                                                                 | [Subscriber]                                                                         | 🔵 Core   | Generated on signup. The viral loop's ignition — every subscriber becomes a potential recruiter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Position tracking (where am I in the queue)                                                                                                         | [Subscriber]                                                                         | 🔵 Core   | "You're #47 in line" creates urgency and social proof. Shown on thank-you page and in confirmation email                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Position recalculation on referral                                                                                                                  | [Subscriber]                                                                         | 🔵 Core   | When someone you referred signs up, you move up automatically. Real-time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Thank-you page with referral link + share buttons + milestone rewards                                                                               | [Subscriber]                                                                         | 🔵 Core   | Highest-intent screen in the entire funnel — subscriber is at peak motivation the moment they sign up. What they see in the next 15 seconds determines whether they share the link or close the tab. Must contain: position number, referral link, pre-filled tweet (removes blank-page problem), copy/share buttons, milestone threshold display (configured by founder — see below). Build this first within the referral sprint, not last — the referral loop cannot be tested end-to-end until it exists                                                                                                                                                                                                                              |
| Public leaderboard (referral count + quality score)                                                                                                 | [Subscriber] sees · [Founder] monitors                                               | 🔵 Core   | Two columns: raw referral count AND engagement-weighted quality score. Creates competition. No competitor shows both. Display name is optional — captured post-signup on the thank-you page ("What should we call you?"), not at initial email capture. Subscribers who skip it are shown as a masked email (e.g., "j••••n") rather than a generic "Subscriber #142" — keeps the leaderboard human without exposing the full address. [DECIDED — 2026-08-13]                                                                                                                                                                                                                                                                              |
| Pre-filled share messages (Twitter, copy link)                                                                                                      | [Subscriber]                                                                         | 🔵 Core   | Removes the blank-page problem — subscriber knows exactly what to post                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Referral event log                                                                                                                                  | [Founder]                                                                            | 🔵 Core   | Which signup came from which link. Foundation for analytics and position recalculation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Referral quality score                                                                                                                              | [Founder]                                                                            | 🔵 Core   | Calculated from how many of a referrer's signups completed a qualification question, returned to the page, or opened an email. Simple weighted calculation — no AI. Shows alongside raw count in the leaderboard. "John: 50 referrals / 18 qualified." No competitor has this                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Qualification dashboard view                                                                                                                        | [Founder]                                                                            | 🔵 Core   | Aggregate breakdown: "500 signups — 32 using a paying competitor / 74 using spreadsheets / 8 enterprise." Filterable. The product's intelligence layer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Milestone rewards configuration                                                                                                                     | [Founder] sets · [Subscriber] reaches threshold; platform notifies, founder delivers | 🟢 Should | Founder configures visible reward thresholds during page setup (onboarding Step 3). Example: "Refer 1 → early access / Refer 5 → free Pro for 1 month / Refer 10 → lifetime 20% discount / Refer 25 → founding member status." Platform tracks which milestones each subscriber has reached, sends congratulatory emails, and shows a pending rewards dashboard. Founder handles actual reward delivery. Displayed on thank-you page above share buttons before the share ask — Hopkins principle: show reward commitment before ask. Elevated from ⚪ v1.1 based on field research Finding 13 (thank-you page is the primary referral loop activation surface) and Finding 9 (documented conversion lift from visible reward before ask) |
| Fraud detection / fake email filtering                                                                                                              | [Founder]                                                                            | ⚪ v1.1   | Relevant once referral volume creates incentive for gaming. Waitlister documents 40% fake referral signups at scale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Feature voting (subscribers vote on features)                                                                                                       | [Subscriber] votes · [Founder] reads                                                 | ⚪ v1.1   | Real need. Premature for MVP — founders with 50–100 signups don't need it yet                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Comments section                                                                                                                                    | [Subscriber] posts · [Founder] reads                                                 | ⚪ v1.1   | Requires moderation infrastructure. Defer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| User introductions / profiles                                                                                                                       | [Subscriber]                                                                         | ⚪ v1.1   | Meaningful complexity. Not needed for pre-launch signal gathering                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

---

## Module 3 — Warmth Tracking

_The feature most founders wish existed only after their list goes cold. Nobody in the market has this at any price point._

| Feature                                                    | User                                                    | Grade     | Why                                                                                                                                                                                                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Warmth score per subscriber (Hot / Warm / Cold)            | [Founder] sees · calculated from [Subscriber] behaviour | 🔵 Core   | Calculated from: email clicks (Resend webhooks), referral signups, qualification answers completed — opens excluded (Apple MPP preloads pixels; see Module 4). Three states. Colour-coded in the subscriber list. Technically simple to build |
| Warmth filter in subscriber list                           | [Founder]                                               | 🔵 Core   | "Show me all Cold subscribers." At 40% cold, that is actionable before launch. No other tool gives this                                                                                                                                       |
| Warmth-segmented broadcast                                 | [Founder] sends · [Subscriber] receives                 | 🟢 Should | Send to: All / Hot + Warm only / Cold only. The killer use case — re-engagement email to cold segment before launch week                                                                                                                      |
| Warmth trend over time                                     | [Founder]                                               | ⚪ v1.1   | Chart showing Hot/Warm/Cold ratio over the pre-launch period. Useful at scale. Not needed in MVP                                                                                                                                              |
| Automated warmth alerts ("40% of your list is going cold") | [Founder]                                               | ⚪ v1.1   | Sends an email to the founder when cold % crosses a threshold. Technically simple — a cron job checking cold % and triggering a Resend email. Deferred to post-MVP.                                                                           |

---

## Module 4 — Email System

_No tool below $29/month gives broadcast email. Adding warmth-segmented sending makes this a genuine competitive advantage._

| Feature                                            | User                                             | Grade     | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signup confirmation email (via Resend)             | [Subscriber] receives                            | 🔵 Core   | Sent immediately. Includes position + referral link + share prompt. Branded with founder's product name, not the tool's                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| "You moved up X spots" trigger email               | [Subscriber] receives                            | 🔵 Core   | Re-surfaces the referral link at the moment of highest motivation — when a referral just converted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Sender domain authentication (SPF/DKIM via Resend) | [Founder] configures                             | 🟢 Should | 69% of email senders report declining deliverability due to spam filters as of 2025. Sending broadcast emails from a default tool sender name without domain authentication results in a significant portion landing in spam — invisible to the founder, catastrophic for the launch. The product must walk the Pro founder through a one-time SPF/DKIM DNS record setup during email configuration (onboarding Step 5). Free tier sends from the tool's authenticated sender domain. Pro founders who set up their own domain get: better deliverability, better trust ("sarah@buildly.com" vs "notifications@[tool].com"), and a personalised sender identity. Without this, the broadcast email promise — the primary Pro upgrade trigger — can silently fail at launch |
| Basic email customisation (sender name, body text) | [Founder] configures                             | 🟢 Should | "From Sarah at Buildly" not "From noreply." Critical for Profile 2 creators whose brand is personal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Broadcast email to full list                       | [Founder] sends · [Subscriber] receives          | 🟢 Should | Primary paid-tier upgrade trigger. Simple compose + send                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Warmth-segmented broadcast                         | [Founder] sends · targeted [Subscriber] receives | 🟢 Should | Send to Hot + Warm only, or Cold only. Makes broadcast genuinely useful rather than just another bulk email                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Email open rate and click tracking                 | [Founder]                                        | 🟢 Should | Resend webhooks feed email click signals into warmth scoring (clicks +5, referrals +15, qualification answers +8 — the MVP warmth signals). Open tracking is excluded from the score: Apple Mail Privacy Protection preloads pixels for ~40–50% of email clients, making open data unreliable — Hot rarity is a weighting problem, not missing opens. Open tracking may return as optional v1.1 analytics only, never as a warmth score input. Technical implementation is simple: Resend provides open/click webhooks natively                                                                                                                                                                                                                                            |
| Email segmentation beyond warmth                   | [Founder]                                        | ⚪ v1.1   | Filter by qualification answer, referral count, signup date. Post-launch when list sizes justify it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Automated email sequences (drip)                   | [Subscriber] receives                            | ⚪ v1.1   | "Day 1, Day 7, Day 30" messages. Valuable for longer pre-launch windows. Build after broadcast is proven                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| External ESP integrations (Mailchimp, ConvertKit)  | [Founder]                                        | 🔴 Out    | The product's value is not needing those tools. Supporting them contradicts the positioning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

---

## Module 5 — Dashboard & Analytics

_The founder's control room. Qualification breakdown, warmth distribution, and referral quality make this dashboard meaningfully better than anything in the market._

| Feature                                                                                                                                                                                                         | User      | Grade   | Why                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Total signups counter                                                                                                                                                                                           | [Founder] | 🔵 Core | First thing every founder checks after posting                                                                                                                               |
| Signups today / this week                                                                                                                                                                                       | [Founder] | 🔵 Core | Shows velocity. Is last night's Reddit post still converting?                                                                                                                |
| Signups-over-time chart (daily bar chart)                                                                                                                                                                       | [Founder] | 🔵 Core | Connects founder actions to outcomes. "I posted in r/SaaS Tuesday — here's the spike"                                                                                        |
| Top referrers list (count + quality score)                                                                                                                                                                      | [Founder] | 🔵 Core | Two columns. Who drove volume. Who drove quality. Who to reach out to first for customer discovery                                                                           |
| Referral conversion rate                                                                                                                                                                                        | [Founder] | 🔵 Core | % of total signups via referral link. Is the viral loop working?                                                                                                             |
| Qualification breakdown panel                                                                                                                                                                                   | [Founder] | 🔵 Core | "500 signups / 32 paying competitor users / 74 spreadsheet users / 8 enterprise." The intelligence layer. No tool has this                                                   |
| Warmth distribution summary (Hot / Warm / Cold counts)                                                                                                                                                          | [Founder] | 🔵 Core | How healthy is the list right now? Three numbers at the top of the dashboard                                                                                                 |
| Subscriber list view (name — may be blank, email, position, referral count, quality score, warmth, qualification answers) [NOTE — 2026-07-19: name is no longer guaranteed; see progressive-profiling decision] | [Founder] | 🔵 Core | Full visibility into every subscriber. Sortable by any column. Searchable. Filterable by warmth                                                                              |
| CSV export                                                                                                                                                                                                      | [Founder] | 🔵 Core | One button. Exports all data: email, position, referral count, quality score, warmth state, qualification answers. Always free. Trust signal — its absence is a deal-breaker |
| Traffic source breakdown                                                                                                                                                                                        | [Founder] | ⚪ v1.1 | Where are visitors coming from? Needs volume to be meaningful                                                                                                                |
| Device breakdown (mobile vs desktop)                                                                                                                                                                            | [Founder] | ⚪ v1.1 | Context, not action. Not useful at pre-launch scale                                                                                                                          |
| Conversion rate (visitors to signups)                                                                                                                                                                           | [Founder] | ⚪ v1.1 | Requires visitor tracking layer. Adds complexity. Post-MVP                                                                                                                   |
| A/B testing                                                                                                                                                                                                     | [Founder] | 🔴 Out  | Pre-launch traffic too low for statistical significance. Not this product                                                                                                    |

**[UPDATED — 2026-08-13]** Navigation architecture: left sidebar (Overview, Subscribers, Qualification, Leaderboard, Warmth, Updates, Broadcast, Settings) + top bar for global actions (live URL/copy, share shortcut, notifications), replacing Sprint 1's top-tab shell. Warmth distribution ships as a locked/empty placeholder in Sprint 2 (real engine in Sprint 3, per the sprint breakdown below). Top referrers/leaderboard: subscribers who skip the optional post-signup name field display as a masked email rather than a bare identifier. Full panel-by-panel content and copy for all four dashboard states (empty / active / warning / pre-launch) is specified in `dashboard-design-spec.md` — this table stays the feature-grading reference, that document is the design source of truth.

**[UPDATED — 2026-09-05]** Referral Quality Score: transparent metric displayed in subscriber table and top referrers panel. Formula: `(subscribers this subscriber referred / total referrals across all subscribers) × 100`. Zero-referral subscribers show null (not 0%). Null when total referrals = 0 (divide-by-zero guard). Purpose: enables founders to identify high-impact referrers for customer discovery outreach. No platform in market provides this metric — competitive differentiator.

**[UPDATED — 2026-09-13]** Dashboard overhaul required. Full audit found 22 issues across 7 categories (information architecture, empty states, stat cards, subscriber table, data/performance, design tokens, broadcast). Key gaps: sidebar confusing (8 flat items, disabled items with no explanation, duplicate links), empty state is misplaced onboarding content, stat cards show numbers without comparison context, mobile table overflow, tier gating inconsistent (Warmth locked in sidebar but visible in panel), dead buttons in settings, no founder updates compose UI. Competitor research (KickoffLabs, Viral Loops, Prefinery, Waitlister, Linear, Stripe, Vercel) confirms: stat cards need comparison deltas, empty states need designed guidance, sidebar needs grouping, locked features need tooltips. See `docs/dashboard-overhaul-plan.md` for full analysis and 7-phase overhaul plan. See `docs/sprint-gap-analysis.md` for MoSCoW prioritization of all product gaps.

---

## Module 6 — Account, Tiers & Billing

| Feature                                              | User              | Grade     | Why                                                                                |
| ---------------------------------------------------- | ----------------- | --------- | ---------------------------------------------------------------------------------- |
| Email + password auth                                | [Founder]         | 🔵 Core   | Via Supabase Auth                                                                  |
| Google OAuth                                         | [Founder]         | 🔵 Core   | Reduces signup friction by ~60%. Critical for non-technical creators               |
| Free tier (1 waitlist, 500 signups, footer branding) | [Founder]         | 🔵 Core   | The flywheel. Without it the organic growth strategy does not work                 |
| Paddle subscription integration (Pro $15/mo)         | [Founder]         | 🔵 Core   | Revenue. Handles all tax/VAT globally. No US entity needed                         |
| "Powered by" footer on free tier pages               | [Subscriber] sees | 🔵 Core   | Every shared page is a permanent free advertisement. Removed on paid               |
| Branding removal on paid tier                        | [Founder]         | 🔵 Core   | The first upgrade trigger. Must be visible in the free tier UI as a locked feature |
| Multiple waitlists on paid tier                      | [Founder]         | 🟢 Should | Most common upgrade reason for founders running 2–3 projects simultaneously        |
| Billing management (view plan, cancel, upgrade)      | [Founder]         | 🔵 Core   | Via Paddle's billing portal                                                        |
| Team member access (multiple logins)                 | [Founder]         | ⚪ v1.1   | Startup teams (Profile 3). Not needed for solo founders                            |
| Annual billing discount                              | [Founder]         | ⚪ v1.1   | Churn reduction. Add after monthly tier is established                             |

---

## The MVP Boundary

### Ships on launch day

| Area                   | What's included                                                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page builder           | Editor, 3 templates, live preview, logo, colours, headline, CTA, subdomain, social meta tags, founder updates feed, live signup count, mobile-responsive                                                                   |
| Signup + qualification | Email capture, 2–3 optional founder-configured qualification questions, duplicate prevention                                                                                                                               |
| Referral system        | Unique referral link per subscriber, position tracking, automatic recalculation, leaderboard (count + quality score), thank-you page with pre-filled share buttons and milestone threshold display                         |
| Warmth tracking        | Hot/Warm/Cold per subscriber, email click tracking via Resend webhooks feeding warmth score (opens excluded — Apple MPP), warmth filter in subscriber list, warmth-segmented broadcast                                     |
| Referral quality score | Engagement-weighted score per referrer alongside raw count in leaderboard                                                                                                                                                  |
| Email                  | Confirmation email, "you moved up" trigger, sender name customisation (Pro), sender domain authentication SPF/DKIM walkthrough (Pro), broadcast to full list, warmth-segmented broadcast                                   |
| Dashboard              | Total signups, velocity, signups-over-time chart, qualification breakdown panel, warmth distribution summary, referral conversion rate, top referrers (count + quality), full subscriber list with all columns, CSV export |
| Account                | Email auth + Google OAuth, free tier, Pro $15/mo via Paddle                                                                                                                                                                |

### Does not ship on launch day

- Custom domain mapping — most technically complex feature. Deferred to v1.1
- Templates beyond 3
- Countdown timer, video embed
- Fraud detection
- Feature voting, comments, user introductions
- Email sequences (drip), advanced segmentation beyond warmth
- Webhooks and Zapier
- Team member access
- Traffic source and device analytics, visitor-to-signup conversion rate
- Warmth trend charts
- A/B testing — permanently out of scope

---

## Pricing

Each tier is designed for a specific buyer, not assembled arbitrarily. The test for any tier: can you describe the exact person it is built for, and would they choose it over the tier below without hesitation?

**Free** — The solo founder who just had an idea tonight. Zero budget, needs to validate fast, wants to look credible.
**Pro ($15/mo)** — The active indie hacker running a real pre-launch campaign. Needs unlimited signups, broadcast email, branding removal, and the full intelligence layer.

|                                     | Free                                   | Pro — $15/mo   |
| ----------------------------------- | -------------------------------------- | -------------- |
| **Waitlists**                       | 1                                      | Unlimited      |
| **Signups per waitlist**            | 500                                    | Unlimited      |
| **Templates**                       | 3                                      | 3 + new ones   |
| **Referral system**                 | ✅                                     | ✅             |
| **Live signup counter**             | ✅ — founder sets visibility threshold | ✅             |
| **Qualification questions**         | 2 max                                  | 5 max          |
| **Qualification dashboard**         | Basic aggregate                        | Full breakdown |
| **Warmth tracking (view)**          | ✅                                     | ✅             |
| **Founder updates feed**            | ✅                                     | ✅             |
| **Confirmation + "moved up" email** | ✅                                     | ✅             |
| **Broadcast email**                 | ❌                                     | ✅             |
| **Warmth-segmented broadcast**      | ❌                                     | ✅             |
| **Email customisation**             | ❌                                     | ✅             |
| **CSV export (all columns)**        | ✅                                     | ✅             |
| **Custom subdomain**                | ✅                                     | ✅             |
| **Custom domain**                   | ❌                                     | ✅ (v1.1)      |
| **"Powered by" footer**             | Shows                                  | Removed        |
| **Dashboard analytics**             | Basic                                  | Full           |

**Note:** Growth tier ($29/mo) is out of scope for MVP. Automated warmth alerts, team member access, and priority support are deferred to post-MVP.

---

## Tech Stack

| Layer               | Tool                    | Cost at MVP            |
| ------------------- | ----------------------- | ---------------------- |
| Frontend + backend  | Next.js 14 (App Router) | Free                   | <!-- [CORRECTED 2026-08-06]: superseded — actual build uses Next.js 16, required for `proxy.ts` wildcard-subdomain routing (`middleware.ts` is deprecated). See PRD.md §7.1 and §9. --> |
| Database + auth     | Supabase                | Free tier              |
| Transactional email | Resend                  | Free (100 emails/day)  |
| Payments            | Paddle (MoR)            | 5% + $0.50/transaction |
| Deployment          | Vercel                  | Free hobby tier        |

**Total infrastructure cost at MVP: $0/month.**

---

## Build Timeline — Sprint Breakdown

The build is structured in four sprints. Each sprint has a clear scope, a defined set of screens to design before building, a defined set of features to build, and a clear exit condition — what "done" looks like before moving to the next sprint.

**The design-build rule:** Wireframe the full sprint first. Review the wireframes. Produce high-fidelity designs for the full sprint. Then build. Wireframe one sprint ahead of where you are building — so Sprint 2 wireframes begin during the Sprint 1 build phase.

---

### Sprint 1 — Foundation: Marketing, Auth, Onboarding, Empty Dashboard

**Duration:** 10 days
**Goal:** A founder can discover the product, create an account, complete onboarding, and arrive at a live (but empty) waitlist page with a shareable URL.

**Screens to wireframe and design before building:**

| Screen                                                              | Node  | Priority |
| ------------------------------------------------------------------- | ----- | -------- |
| Marketing homepage — cold visitor                                   | F-A2  | 🔵 Core  |
| Marketing homepage — "Powered by" visitor                           | F-A3  | 🔵 Core  |
| Account creation / login                                            | F-B1  | 🔵 Core  |
| Onboarding Step 1: Name your waitlist                               | F-C1  | 🔵 Core  |
| Onboarding Step 2: Choose template                                  | F-C2  | 🔵 Core  |
| Onboarding Step 3: Customise page (with milestone rewards config)   | F-C3  | 🔵 Core  |
| Onboarding Step 4: Qualification questions decision                 | F-C4  | 🔵 Core  |
| Onboarding Step 4a: Configure qualification questions               | F-C4a | 🔵 Core  |
| Onboarding Step 5: Email setup (free tier locked state + Pro state) | F-C5  | 🔵 Core  |
| Waitlist goes live — success screen                                 | F-C6  | 🔵 Core  |
| Dashboard — empty state                                             | F-G1  | 🔵 Core  |

**What gets built:**

- Next.js project setup, Supabase integration, auth (email + Google OAuth)
- Marketing homepage (both variants — share same component, different above-fold copy)
- Full 5-step onboarding flow with progress bar
- Subdomain routing (yourproduct.[tool].com live on save in Step 1)
- Live preview in page editor (Step 3)
- Social meta tag auto-generation
- Milestone rewards configuration panel (Step 3) — multi-tier ladder (add/remove tiers, referral count → reward text per tier)
- Signup counter toggle + visibility threshold configuration (Step 3) — [ADDED, built in Epic 6.0, not in original Sprint 1 screen scope]
- Qualification questions configuration (Step 4a)
- Email setup screen with tier-locked state (Step 5)
- Success screen with sharing tools (F-C6)
- Dashboard shell with empty state (F-G1) — skeleton panels, no data yet
- Founder updates feed (post creation only — display comes in Sprint 2)
- [ADDED — 2026-07-05] Founder acquisition source capture: read `?ref=` URL parameter (and any UTM parameters) on landing, persist against the founder's account at signup. This is the mechanism that makes the F-A3 "Powered by" variant possible and is what Marketing Strategy Part 6's keyed-link discipline depends on. It was previously implied by other Sprint 1 items but never listed as its own deliverable. No dashboard or UI is required for this in Sprint 1 — it's a silent data-capture task; reporting on it is a later, separate decision. Do not confuse this with founder-facing subscriber traffic-source breakdown, which is v1.1 (see Master Scope Ledger) — this is the tool's own acquisition tracking, a different system entirely.

**Exit condition:** A founder can sign up, complete onboarding in under 4 minutes, see their live URL, and arrive at a dashboard with skeleton panels. The public page exists at their subdomain. No signups have arrived yet.

---

### Sprint 2 — The Engine: Public Page, Signup, Referral Loop, Active Dashboard

**Duration:** 9 days
**Goal:** A subscriber can find the public page, sign up, see their position, receive their referral link, and share it. A founder sees real signups appearing in their dashboard in real time.

**Screens to wireframe and design before building:**

| Screen                                                                                      | Node     | Priority |
| ------------------------------------------------------------------------------------------- | -------- | -------- |
| Public waitlist page (qualification questions shown inline, pre-submit — see note)          | S-B1     | 🔵 Core  |
| Thank-you page — direct signup (with milestone rewards)                                     | S-B4a    | 🔵 Core  |
| Thank-you page — referred signup (with milestone rewards)                                   | S-B4b    | 🔵 Core  |
| Duplicate email message                                                                     | S-B3-DUP | 🔵 Core  |
| Public leaderboard page ("See where you rank")                                              | S-B5     | 🔵 Core  |
| Dashboard — active state (full panels, real data; warmth panel locked/empty — see Sprint 3) | F-G2     | 🔵 Core  |

**[UPDATED — 2026-08-13]** S-B2a is retired as a standalone node. Sprint 1's build showed qualification questions as inline optional fields on the same form as S-B1, displayed pre-submit — matching PRD-Sprint-1 Standing Decision #2, not the "post-email-capture" sequence this table previously implied. No separate screen or wireframe is needed for it. S-B5 (public leaderboard) is added — it was already listed under "What gets built" below and referenced by the thank-you page's "See where you rank" link, but had never been given its own screen node.

**[UPDATED — 2026-08-13] F-G2 is now a shell restructure, not just new panels.** Sprint 1 built the dashboard shell with top nav tabs (Epic 5.1). Per dashboard-layout research, Sprint 2 replaces this with a left sidebar (Overview, Subscribers, Qualification, Leaderboard, Warmth, Updates, Broadcast, Settings) plus a top bar for global actions (live URL/copy, share shortcut, notifications, account). Full IA, panel-by-panel content, and copy for all four dashboard states now live in a dedicated document, `dashboard-design-spec.md` — this section summarizes only what changed.

**What gets built:**

- Public waitlist page (responsive, 3 template variants rendering correctly)
- Email capture form with duplicate check
- Qualification questions display — optional fields inline on the signup form itself, shown pre-submit [CORRECTED — 2026-08-13: was "post email capture," matches Sprint 1 build and PRD-Sprint-1 Standing Decision #2]
- Thank-you page — direct variant (position, referral link, "What should we call you?" optional name field, milestone threshold display, share buttons)
- Thank-you page — referred variant (acknowledges referrer, same milestone display)
- Unique referral link generation per subscriber
- Position tracking and real-time recalculation on referral
- Public leaderboard page — S-B5 (referral count + quality score; subscribers who skipped the optional name field display as a masked email, e.g. "j••••n", not a generic "Subscriber #142")
- Confirmation email via Resend (position + referral link)
- "You moved up" trigger email
- Dashboard shell restructure — top tabs → left sidebar + top bar [ADDED — 2026-08-13, see `dashboard-design-spec.md`]
- Dashboard active state: total signups, referral %, today, signups-over-time chart, qualification breakdown, referral leaderboard, subscriber list, CSV export
- Warmth distribution panel — **locked/empty placeholder for Sprint 2** (greyed real layout, not hidden and not fake data) — live engine ships Sprint 3 [DECIDED — 2026-08-13]
- Signup-counter visibility threshold — editable from both onboarding Step 3 and dashboard Settings, one underlying field [DECIDED — 2026-08-13]
- Real-time dashboard update on new signup (Supabase realtime)
- Founder updates feed — display on public page (posting was built in Sprint 1)

**Exit condition:** Full referral loop works end to end. New subscriber signs up → thank-you page → shares referral link → another person signs up → original subscriber receives "you moved up" email → dashboard (new sidebar shell) shows both subscribers with correct data → either subscriber can view their rank on the public leaderboard page.

---

### Sprint 3 — Intelligence: Warmth, Email Broadcasts, Billing, Authentication

**Duration:** 11 days
**Goal:** Warmth tracking is live and visible. Founders can send warmth-segmented broadcasts. Paddle billing gates the Pro features. Domain authentication is walkable.

**[UPDATED — 2026-09-13]** Sprint 3 is now split into three execution phases:

1. **Sprint 3 (Epic 11 + 12 + 13):** Warmth engine, email system, billing — already planned
2. **Sprint 3.1 (Epic 12.1 — Dashboard Overhaul):** Dashboard redesign, empty states, stat cards, tier gating, mobile, founder updates compose UI
3. **Sprint 3.2 (Epic 12.2 — Gap Fixes):** Legal compliance (Privacy Policy, ToS, consent), archive waitlist, edit after onboarding, unsubscribe mechanism, bounce suppression

Execution order: Epic 11 → Epic 12 → Epic 12.1 → Epic 12.2 → Epic 13. Dashboard overhaul (12.1) and gap fixes (12.2) ship before billing (13) so the dashboard is complete before monetization.

**Screens to wireframe and design before building:**

| Screen                                                      | Node     | Priority  |
| ----------------------------------------------------------- | -------- | --------- |
| Dashboard — warning state (Cold % alert)                    | F-G3     | 🔵 Core   |
| Dashboard — pre-launch state (broadcast tools)              | F-G4     | 🔵 Core   |
| Upgrade modal (context-sensitive, 7 trigger variants)       | F-F2     | 🔵 Core   |
| Paddle checkout (handled by Paddle — minimal design input)  | F-F3     | 🔵 Core   |
| Email setup — domain authentication walkthrough (Pro state) | F-C5 Pro | 🟢 Should |
| Broadcast compose screen                                    | —        | 🟢 Should |

**What gets built:**

- Warmth score calculation engine (email clicks via Resend webhooks + referral activity + qual answers — daily batch recalculation)
- Hot/Warm/Cold assignment per subscriber
- Warmth column and filter in subscriber list
- Warmth distribution panel in dashboard
- Dashboard warning state trigger (when Cold % > threshold)
- Schema migration (consolidated Sprint 3 DDL)
- Confirmation email (position + referral link) on signup
- Position recalculation on referral
- "You moved up" trigger email
- Warmth-segmented broadcast compose + send (Pro)
- Broadcast email to full list (Pro)
- Email infrastructure separation (transactional vs marketing domains)
- Paddle integration — Pro $15/mo
- Upgrade modal with 7 context-sensitive trigger variants
- Feature gating across all tiers
- Sender domain authentication walkthrough (SPF/DKIM via Resend — Pro)
- Email click tracking via Resend webhooks feeding warmth score (opens excluded — Apple MPP preloads pixels; open tracking deferred to optional v1.1 analytics)

**Exit condition:** A founder on the free tier who hits the 500-signup cap sees the upgrade modal. A Pro founder can send a warmth-segmented broadcast. Domain authentication setup is walkable in the UI.

---

### Sprint 4 — Polish: QA, Edge Cases, Analytics, Product Hunt Prep

**Duration:** 7 days
**Goal:** The product is stable, tested across all paths, and ready for a public launch.

**[UPDATED — 2026-09-13]** Items moved to Sprint 3.2: archive waitlist, edit after onboarding, legal pages (Privacy Policy, Terms of Service), consent tracking, unsubscribe mechanism, bounce suppression. These were originally Sprint 4 scope but are now required before billing (Epic 13) ships.

**What gets built:**

- Full analytics dashboard view (referral tree, traffic summary — basic)
- CSV export polish (all columns, all tiers)
- Edge case handling across all flows (expired links, deleted waitlists, empty states for each dashboard panel)
- Second waitlist creation flow (F-D1, F-D2) — lighter path for returning Pro founders
- Mobile responsiveness audit across all public-facing screens
- Error states and loading states for all async operations
- Email deliverability audit — SPF/DKIM on tool's own sending domain confirmed
- QA pass: every node in the user flow tested manually
- Product Hunt listing prepared
- "Powered by" footer rendering confirmed on all free tier pages

**Exit condition:** Every path in the user flow works without errors. The product is deployed to production on Vercel. The founder can sign up, build a waitlist, collect signups, track warmth, send a broadcast, and export their data without encountering a single broken state.

---

**Total: ~5–6 weeks.**

---

## Success Metrics

| Phase         | Metric                                                           | Target                          | Timeframe   |
| ------------- | ---------------------------------------------------------------- | ------------------------------- | ----------- |
| Validation    | Broadcast email delivery rate                                    | >95% delivered (not spam)       | Month 1–2   |
| Validation    | Free signups                                                     | 100 active users                | Month 1–2   |
| Validation    | Qualification questions completed per waitlist                   | >40% of subscribers answering   | Month 1–2   |
| Validation    | Waitlist pages created per founder                               | >1 (repeat use signal)          | Month 1–2   |
| Validation    | Warmth distribution at first 100 users                           | >60% Hot or Warm                | Month 1–2   |
| Early Growth  | Free-to-paid conversion rate                                     | 5–8% (industry benchmark)       | Month 2–4   |
| Early Growth  | First paying user                                                | 1 paying user                   | Month 2     |
| Growth        | MRR                                                              | $500/month                      | Month 3–4   |
| Growth        | MRR                                                              | $2,000/month                    | Month 6     |
| Scale         | MRR                                                              | $5,000/month                    | Month 10–12 |
| Scale         | Monthly churn rate                                               | <3%                             | Ongoing     |
| Organic       | "Powered by" referral signups                                    | >30% of new founders            | Month 3+    |
| Product proof | Waitlist-to-customer conversion for founders using qualification | >10% — vs 2–3% industry average | Month 3–6   |

---

## Appendix — Master Scope Ledger (v1.1+ and Out-of-Scope Items, All Documents)

[ADDED — 2026-07-05. This consolidates every deferred and out-of-scope item found across Product Vision MVP, Problem Brief, and JTBD into one place, so no document is relied on in isolation. Product Vision MVP is treated as authoritative where documents disagree, since it carries the most recent field-research-based elevation decisions. Two conflicts were found and are marked below — Problem Brief's standalone "V1.1 Deferred" list has been corrected to match this ledger.]

### Elevated out of v1.1 into MVP scope (do not defer these — confirmed conflicts corrected)

| Feature                                  | Originally listed as v1.1 in                     | Actual status             | Where it lives                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Milestone/referral rewards configuration | Problem Brief ("Referral rewards configuration") | 🟢 Should — MVP, Sprint 1 | Onboarding Step 3 (F-C3 / W6). Elevated per Product Vision MVP, Field Research Findings 9 & 13                                                                                                 |
| Email open/click tracking                | Problem Brief ("Email open/click tracking")      | 🟢 Should — MVP, Sprint 3 | Resend webhooks: clicks feed warmth score (MVP); opens are stored for analytics only and excluded from scoring (Apple MPP preloads pixels). Elevated per Product Vision MVP for click tracking |

### Confirmed v1.1 — Post-Revenue (consistent across documents)

| Feature                                                      | Scope                | Source(s)                                                                                                         |
| ------------------------------------------------------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Custom domain mapping (founder's own domain)                 | Founder + Subscriber | Product Vision, Problem Brief                                                                                     |
| Additional templates (5+)                                    | Founder              | Product Vision, Problem Brief                                                                                     |
| Custom fonts                                                 | Founder              | Product Vision                                                                                                    |
| Countdown timer to launch                                    | Subscriber           | Product Vision                                                                                                    |
| Video embed section                                          | Subscriber           | Product Vision                                                                                                    |
| Fraud detection / fake email filtering                       | Founder              | Product Vision, Problem Brief, JTBD ("at MVP scale")                                                              |
| Feature voting (subscribers vote on features)                | Subscriber/Founder   | Product Vision, Problem Brief                                                                                     |
| Comments section                                             | Subscriber/Founder   | Product Vision, Problem Brief                                                                                     |
| User introductions / profiles                                | Subscriber           | Product Vision                                                                                                    |
| Warmth trend over time (chart)                               | Founder              | Product Vision                                                                                                    |
| Email segmentation beyond warmth                             | Founder              | Product Vision                                                                                                    |
| Automated email sequences (drip)                             | Subscriber           | Product Vision, Problem Brief                                                                                     |
| Webhooks and Zapier integration                              | Founder              | Problem Brief (not separately listed in Product Vision — noted here so it isn't lost)                             |
| Traffic source breakdown (founder-facing, subscriber origin) | Founder              | Product Vision. Distinct from the tool's own founder-acquisition tracking (Sprint 1, see above) — do not conflate |
| Device breakdown (mobile vs desktop)                         | Founder              | Product Vision                                                                                                    |
| Conversion rate (visitors to signups)                        | Founder              | Product Vision                                                                                                    |
| Team member access / roles and permissions                   | Founder              | Product Vision, Problem Brief, JTBD (Job 11 — Collaboration Job, Profile 3 only)                                  |
| Annual billing discount                                      | Founder              | Product Vision                                                                                                    |
| Referral tree visualisation                                  | Founder              | Product Vision (tier comparison table — not previously listed as its own row; noted here)                         |

### Permanently out of scope (not a future version — do not revisit without a new decision)

| Feature                                           | Reason                                                                           | Source(s)            |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------- |
| A/B testing                                       | Pre-launch traffic too low for statistical significance                          | Product Vision, JTBD |
| External ESP integrations (Mailchimp, ConvertKit) | Contradicts the product's own positioning — the value is not needing those tools | Product Vision       |
| Full CRM management                               | Different product; no customers yet at this stage                                | JTBD                 |
| Affiliate program management                      | Post-launch problem                                                              | JTBD                 |
| AI intent scoring (Baitlist's model)              | Adds signup friction; simple questions get 80% of the value at zero friction     | JTBD                 |

### Explicitly not a job this product serves (scope boundary, not a feature list)

Complex multi-step onboarding beyond the waitlist itself, full customer relationship management, and anything requiring meaningful traffic volume to be statistically meaningful before the product has that volume. Source: JTBD, "Jobs Not Being Hired For."

---

_All feature decisions trace back to verified market research, competitive analysis (Presignup May 2026, Baitlist March 2026), conversion rate benchmarks (Venture Curator Apr 2025, Waitlister.me Sept 2025), field research report v1 (Findings 1–13, June 2026), User Profile v2, JTBD v2, and the Hopkins marketing framework. Rows.com 0% conversion benchmark (6-month-old signups) added per field research Finding 1 supplementary. Email deliverability 69% decline statistic sourced from field research Finding 12. Thank-you page as primary conversion surface sourced from field research Finding 13._

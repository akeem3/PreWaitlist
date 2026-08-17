# User Profile — Pre-Launch Waitlist Tool

**Document Type:** User Profile
**Product:** Pre-Launch Waitlist Tool
**Prepared By:** Abdul-Hakeem Hassan
**Date:** June 2026
**Version:** 2.0 — Updated post Presignup / Baitlist competitive analysis
**Follows From:** Problem Brief v2

---

> **Document Purpose**
>
> This document captures how users of a pre-launch waitlist tool actually behave — not who they are demographically, but what drives their decisions, how they operate day-to-day, what constraints they work within, and what environment they are building in. Three distinct profiles. Profile 1 is the primary target.

---

## Profile 1 — The Solo Indie Hacker / SaaS Founder

> _Primary target. Highest volume. Most vocal online. Most price-sensitive. Most likely to spread the tool through communities._

---

### Who They Are Behaviourally

As of 2025, over 44% of profitable SaaS businesses are run by solo founders, up from 22% in 2018. In mid-2025, 36.3% of new startups had a solo founder — a structural shift driven by AI tools lowering the barrier to building alone. This person is not a demographic. They are a behaviour pattern.

- They have a full-time job, or are between jobs, or have recently left employment to build
- They get an idea — often while solving their own problem — and immediately want to act on it
- They decide to validate before building, because they have read enough failure post-mortems to know that building in isolation ships something nobody wants
- They need a public artifact within hours of making that decision
- They share it on Twitter/X, Reddit, Indie Hackers, or directly in communities
- They watch the numbers obsessively for the first 48 hours — and then start wondering whether those numbers mean anything

That last step is new and important. Experienced founders in 2025–2026 are increasingly aware that email count alone is a weak signal. They have read about founders who hit 2,000 signups and launched to silence. They want to know not just how many people signed up — but which of those people actually want what they are building.

---

### Behaviour Patterns

**Pattern 1 — They Act on Impulse, Then Rationalise**
The decision to build a waitlist page is rarely planned. They have the idea, tweet about it, someone responds positively, and now they need proof. They search "how to build a waitlist" and sign up for the first tool that works in the next ten minutes. If it is confusing, they close the tab. There is no "I'll come back to this."

**Pattern 2 — They Cobble Before They Commit**
Before finding a dedicated tool: Carrd for the page, Mailchimp or ConvertKit for email capture, a spreadsheet for tracking. Zero referral capability. No real-time dashboard. No qualification. This cobbled workaround misses the entire viral potential of a referral loop and leaves the founder with no information about who on their list matters.

**Pattern 3 — They Build in Public Simultaneously**
The #BuildInPublic hashtag generates millions of impressions daily. Founders who share their journey attract their audience before their product exists. The waitlist page URL is shared publicly — its design is visible to everyone who follows them. A poor design is a public signal of low commitment, which reduces signups.

**Pattern 4 — They Are Starting to Ask "Who, Not Just How Many"**
This is a new and verified pattern in 2025–2026. The data is specific: most waitlists convert at just 2–3% on launch day. Users who wait over 90 days see conversion drop to single digits. Users converted within one month average 50%. Founders who have been through a launch — or who follow others who have — increasingly recognise the count is not the signal. They want to know if their signups are qualified, what tools they currently use, and whether the people who signed up three months ago still remember they did. Superhuman made this intuition systematic: with 180,000 on their waitlist, they handpicked users one by one through a short application. They were not collecting signups. They were training evangelists. A tool that gives the bootstrapped founder a lightweight version of that capability — without the onboarding call infrastructure — is solving a documented problem.

**Pattern 5 — They Switch Tools Instantly**
No loyalty at this stage. If a tool has a paywall, takes more than 10 minutes, produces an embarrassing page, or gives them a pile of emails with no signal about quality — they leave. Switching cost is zero. The tool that delivers speed, design, and intelligence in the first 4 minutes keeps them.

---

### Motivations (Updated)

| Motivation                           | What It Looks Like in Practice                                                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prove the idea is real**           | They want a number — even 50 signups from strangers — to justify continuing                                                                         |
| **Look credible to strangers**       | The page must look like a real product, not a side project                                                                                          |
| **Capture momentum**                 | The idea is hot right now. They need to act before the feeling fades                                                                                |
| **Know who actually wants this**     | An email is a click. A qualified signup who named their pain point and their current tool is a potential customer. They want to know the difference |
| **Keep the list warm**               | They have heard the horror story: 1,000 signups, launched, nobody converted. They want to prevent it                                                |
| **Build leverage before they build** | Signups + qualification data = negotiating power with co-founders, advisors, and their own doubt                                                    |

---

### Constraints

| Constraint          | Reality                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| **Budget**          | $0–$20/month. Every dollar before revenue is personal money                                         |
| **Time**            | Nights and weekends if employed. Full-time if between jobs but with pressure to generate income     |
| **Attention**       | Fragmented — building, marketing, customer discovery simultaneously                                 |
| **Technical skill** | Variable. Many are not developers. All prefer not to configure infrastructure for a validation task |
| **Audience size**   | Usually small. They cannot rely on existing reach to drive signups                                  |

---

### Environment

- **Primary screen:** Laptop — MacBook most commonly
- **Primary online habitat:** Twitter/X (daily), Indie Hackers (weekly), Reddit — r/SaaS, r/startups, r/indiehackers (weekly), Product Hunt (launch days)
- **How they discover tools:** Community recommendations — someone mentions it in a thread, posts a comparison. Not paid ads. Word of mouth in tight-knit communities drives tool adoption at this level
- **Tool stack context:** Notion or Obsidian for notes, Figma or no-code tools for design, Lovable or Cursor for building, Supabase for backend

---

### Fears

| Fear                                                              | Underlying Driver                                                                                                                                                                  |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nobody will sign up**                                           | Imposter syndrome — the idea might not be real                                                                                                                                     |
| **The page looks amateur**                                        | Public embarrassment in communities they respect                                                                                                                                   |
| **They build for months and nobody cares**                        | The most-cited failure mode in post-mortems                                                                                                                                        |
| **Their list is full of people who were curious, not interested** | The qualified demand problem — an email is not a purchase intent                                                                                                                   |
| **Their list goes cold before launch**                            | Documented: users who wait 90+ days convert at single digits. Founders discover it only when they send the launch email and see the open rate. By then it is too late to re-engage |
| **The tool locks their data**                                     | GetWaitlist's pricing change is fresh. CSV export is a trust signal not a feature                                                                                                  |

---

### What Triggers Abandonment

1. Setup takes more than 10 minutes without a clear cause
2. The output page looks generic or has another brand prominently on it
3. They hit a signup cap they did not know about
4. They cannot export their list as a CSV
5. The tool gives them a count but no signal about who among those signups matters
6. Price increases without warning

---

## Profile 2 — The Creator / Newsletter Founder

> _Secondary target. Growing fast. Less technical. Cares most about aesthetics, personal branding, and email communication quality._

---

### Who They Are Behaviourally

Building an audience before launching a paid newsletter, course, community, or digital product. They have a social following ranging from a few hundred to tens of thousands. Their use of a waitlist tool is different from Profile 1: they are not validating a product idea. They are building anticipation before a known launch date.

---

### Updated Behaviour Patterns

- They care about design above all — an ugly page contradicts their personal brand publicly
- They want the confirmation email to sound like it came from them personally, not a system
- They increasingly want to know which of their subscribers are most engaged — who opens every email, who clicked the referral link, who came back to the page. Warmth tracking speaks directly to this
- They share the link across Instagram, TikTok, Twitter/X, and their existing email list simultaneously
- They want to send updates to the list from inside the tool — not export to Mailchimp each time

---

### Key Constraint

Non-technical. Will not configure DNS records, read developer docs, or connect Zapier automations. The tool must work without any of that.

---

## Profile 3 — The Early-Stage Startup (2–5 People)

> _Tertiary target. Higher willingness to pay. Values team features and polish. The most likely to upgrade to Growth tier quickly._

---

### Who They Are Behaviourally

A small team approaching a public launch with a product already built. Needs the page to look like a real company. Needs multiple team members in the dashboard without sharing one login. Needs the qualification data to inform which beta invites to prioritise.

---

### Updated Behaviour Pattern

Profile 3 is the most likely to use the qualification dashboard actively. They are not just collecting emails — they are doing early customer segmentation. Knowing that 8 of their 500 signups are at enterprise scale is decision-relevant for their onboarding strategy. No competitor gives them this at the $29/month tier.

---

### Key Constraint

Willing to pay $29/month. Will not pay $199/month (Prefinery Essentials). The gap between $29 and $199 is exactly where this product lives.

---

## Cross-Profile Behavioural Truths (Updated)

1. **Speed is the primary decision variable.** Not features. Not price. Speed of setup determines which tool wins in the first 10 minutes after someone decides they need a waitlist.

2. **The page is a public signal.** In all three profiles, the waitlist URL is shared publicly. Its design quality reflects directly on the person sharing it. This is emotional, not rational — and emotional decisions drive tool selection at this stage.

3. **An email is not enough signal anymore.** All three profiles — increasingly — want to know who among their signups is serious. Profile 1 wants qualification data. Profile 2 wants warmth and engagement data. Profile 3 wants both for segmentation purposes.

4. **List decay is a real and feared problem.** Founders who have been through a launch, or who follow others who have, are aware that lists go cold. The tool that solves this problem preemptively — by showing warmth state per subscriber — solves a problem the founder does not yet know they have. That is the best kind of feature.

5. **Data portability is non-negotiable.** All three profiles have been burned or fear being burned. CSV export is a trust signal. Its absence is a deal-breaker.

6. **Community word-of-mouth is the primary discovery channel.** None of the three profiles discover tools through paid advertising. Recommendations in founder communities drive adoption. The tool that earns community goodwill through genuine generosity (free tier, honest pricing, data portability) gets recommended unprompted.

---

## Behavioural Summary Table

|                         | Profile 1 — Solo Founder                          | Profile 2 — Creator                                | Profile 3 — Startup Team                        |
| ----------------------- | ------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| **Primary goal**        | Validate idea + understand who wants it           | Build anticipation + stay connected to subscribers | Professional launch + qualify and segment early |
| **Setup tolerance**     | <10 minutes                                       | <15 minutes                                        | <30 minutes                                     |
| **Design sensitivity**  | High                                              | Very high                                          | High                                            |
| **Budget**              | $0–$15/month                                      | $0–$19/month                                       | $19–$39/month                                   |
| **Technical skill**     | Medium–high                                       | Low                                                | Medium                                          |
| **Qualification use**   | Wants to know who's serious                       | Wants engagement data                              | Active segmentation tool                        |
| **Warmth tracking use** | Re-engagement before launch                       | Know who's still paying attention                  | Segment beta invites                            |
| **Churn trigger**       | Setup friction, price surprise, no quality signal | Ugly output, no email personalisation              | Missing team features                           |
| **Discovery channel**   | Reddit, Indie Hackers, Twitter/X                  | Instagram, creator communities, DMs                | Product comparisons, Twitter/X                  |

---

_Sources: Stripe 2024 Indie Founder Report | Baitlist Blog Mar 2026 | Presignup Blog May 2026 | Unicorn Platform Mar 2026 | MakerStack Waitlister Review Apr 2026 | DEV Community Feb 2026 | Indie Hackers failure post-mortems 2024–2025 | Venture Curator Apr 2025 (2–3% conversion benchmark) | Waitlister.me Sept 2025 (90-day decay data) | Venture Crew / Superhuman case study 2025_

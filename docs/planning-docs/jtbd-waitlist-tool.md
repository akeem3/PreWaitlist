# Jobs-To-Be-Done (JTBD) — Pre-Launch Waitlist Tool

**Document Type:** Jobs-To-Be-Done (JTBD)
**Product:** Pre-Launch Waitlist Tool
**Prepared By:** Abdul-Hakeem Hassan
**Date:** June 2026
**Version:** 2.0 — Updated post Presignup / Baitlist competitive analysis
**Follows From:** Problem Brief v2 · User Profile v2

---

> **Document Purpose**
>
> This document defines what users are truly trying to accomplish when they reach for a waitlist tool. JTBD frames the need not as a feature request but as the deeper outcome the user is hiring the tool to deliver. Every product decision — what to build, what to cut, how to message it — should trace back to one of the jobs documented here.
>
> Format: **"When [situation], I want to [action], so I can [outcome]."** Each job includes a functional layer (what they literally need), an emotional layer (the real reason it matters), and what the current market does or fails to do about it.

---

## Core Jobs (All Profiles)

---

### Job 1 — The Validation Job

> **"When I have a product idea I believe in but have not yet built, I want to put up a public page and collect email addresses from interested people, so I can confirm the idea is real before I invest months of my time building it."**

**Functional job:** Capture emails from strangers with no prior relationship with the founder.

**Emotional job:** Silence the internal voice that says _"nobody wants this."_ A single-digit signup count from strangers is enough to justify continuing. The tool is being hired to give the founder psychological permission to keep going.

**Related behaviour:** This is why founders obsessively check their signup count in the first 48 hours. Every new signup is a small confirmation the idea is real.

**What success looks like:** Any non-zero signup count from people who are not the founder's friends or family. 10 signups from strangers is a stronger signal than 100 from close contacts.

**Current workaround:** Carrd page + Mailchimp embed. No referral capability. No real-time dashboard. Data in two separate platforms.

**Market gap:** Presignup and Waitlister partially serve this job. Neither tells the founder whether those signups are genuinely interested or just curious — which is the next evolution of this job.

---

### Job 2 — The Credibility Job

> **"When I share my waitlist link publicly on Twitter, Reddit, or in a community, I want my page to look like a real, designed product, so I can be taken seriously by strangers and not undermine the idea before anyone has tried it."**

**Functional job:** Produce a visually credible page without a designer or developer.

**Emotional job:** Not feel embarrassed. The page's appearance is a direct proxy for how seriously the founder takes their own idea. A poorly designed page signals low commitment — which reduces signups.

**Related behaviour:** Founders spend more time tweaking visual elements than writing copy. They know the words matter more — but the visual presentation is what they can immediately feel proud of or ashamed of.

**What success looks like:** A page they screenshot and share publicly without hesitation. Something that looks like it belongs on the same visual tier as products they admire.

**Market gap:** Presignup's page builder is in beta as of May 2026. Every other tool below $50/month produces pages that look like developer side projects. Design quality is unowned at the free/affordable tier.

---

### Job 3 — The Amplification Job

> **"When someone signs up for my waitlist, I want to give them a way to share it with others and get rewarded for doing so, so I can grow my list beyond my own audience without spending money on ads."**

**Functional job:** Automate word-of-mouth through a referral mechanic that incentivises sharing.

**Emotional job:** Feel like growth is happening without continuous manual effort. Every founder knows that once an initial post fades from the feed, signups slow to a trickle. The referral loop gives the page a life beyond the first 24 hours.

**What success looks like:** Signups arriving from sources the founder did not personally post to. The leaderboard showing users who have referred 5+ people. The tool running growth in the background.

**Market gap:** Presignup has this. GetWaitlist has this. The job itself is increasingly table stakes. The differentiation is now the quality of those referrals, not just the count.

---

### Job 4 — The Qualification Job _(New — Most Important)_

> **"When I have collected hundreds of email signups, I want to know which of those people are actually interested in paying for what I'm building — not just who clicked a form — so I can spend my limited customer discovery time talking to the right people and avoid launching to a dead list."**

**Functional job:** Capture structured, optional data about each subscriber's context — current tools, role, pain point, intent — and surface it as filterable, actionable data in the founder's dashboard.

**Emotional job:** Confidence before launch. The fear that "1,000 people signed up and nobody converted" is real and documented. The founder who knows that 32 of their 500 signups currently use a paying competitor, and 8 are at enterprise scale, feels equipped to act. The founder with 500 email addresses and no context feels anxious.

**Related behaviour:** The data that drives this behaviour is now specific and documented. Most waitlists convert at 2–3% on launch day. One documented case study: a founder who optimised for broader waitlist appeal hit 4.1% signup conversion — but their customer conversion dropped from 30% to 18%. Wider appeal produced a less qualified list and a worse launch outcome. The implication is direct: a smaller, qualified list outperforms a larger, unqualified one. Founders who understand this want a tool that captures qualification signal without adding friction to the signup form.

**What success looks like:** The dashboard shows: "500 total signups — 32 currently paying a competitor / 74 using spreadsheets / 8 enterprise / 386 early-stage." The founder knows who to call first without a single manual triage session.

**Current market gap:** Baitlist serves this job with AI scoring at EUR 29/month and a 50-signup free cap. Prefinery has advanced segmentation at $39–$499/month. Nobody serves this job for the bootstrapped solo founder at the free or $15/month tier. This is the clearest differentiator available.

**Design constraint:** Optional questions only. Research confirms that mandatory friction at signup reduces conversions. The founder opts in to qualification; the subscriber opts in to answering. Default is off.

---

### Job 5 — The Warmth Job _(New)_

> **"When I am weeks or months away from launch, I want to know which of my waitlist subscribers are still engaged and which have gone cold, so I can re-engage the cold ones before launch day and not waste time emailing people who have forgotten they signed up."**

**Functional job:** A per-subscriber engagement score, updated automatically from observable signals (email opens, page return visits, qualification answers, founder update views), displayed in the subscriber list as a simple Hot / Warm / Cold state.

**Emotional job:** Control. The pre-launch period is inherently uncertain. List decay is documented, specific, and measurable: users who wait over 90 days see conversion drop to single digits. Users converted within one month average 50%. The gap between those two outcomes is not the product — it is what the founder does during the waiting period. The founder who can see their list health in real time is no longer flying blind.

**Related behaviour:** No current tool tracks or surfaces this. Founders discover list decay only when they send a launch email and see low open rates. By then it is too late to re-engage. A tool that shows this weeks before launch gives the founder time to act on it. The Superhuman waitlist is the extreme version of managing this correctly: 180,000 people on the list, handpicked one by one, 30-minute onboarding call for each. The result was not a list — it was a trained group of evangelists. The bootstrapped founder cannot replicate that process. Warmth tracking is the affordable, automated version of the same instinct.

**What success looks like:** The founder sees 200 Hot, 180 Warm, and 120 Cold subscribers three weeks before launch. They send a re-engagement email to the Cold segment: "We're almost ready. Still interested?" They recover 40 of them. They launch to a warmer list than they would have had otherwise.

**Market gap:** Completely unserved at any price point below Prefinery's enterprise tiers. Technically simple — three states calculated from data the product already collects.

---

### Job 6 — The Communication Job

> **"When I want to keep my waitlist engaged between now and my launch date, I want to send them updates, tease features, and tell them when they're moving up the queue, so I can maintain their interest and reduce churn before launch day."**

**Functional job:** Send emails to waitlist subscribers from the same tool that manages the list, without exporting to a separate platform. Also: post public updates directly on the waitlist page so subscribers who return can see progress.

**Emotional job:** Feel connected to early supporters. The relationship with a waitlist subscriber is fragile — they signed up in a moment of interest, but interest fades. The founder needs a way to maintain the relationship without it feeling like effort.

**Two forms this job takes:**

_Form A — Email broadcast:_ The founder sends a "we're launching in 3 days" email to the full list or to warm/hot subscribers only. No current tool below $29/month offers this without a separate ESP.

_Form B — Founder updates feed:_ Short public posts from the founder on the waitlist page itself ("Just hit 200 signups — here's what's coming"). Subscribers who return to the page see this. It drives return visits which feeds warmth tracking. No competitor has this feature at any price point.

**What success looks like:** Being able to send a brief update in under 5 minutes from the same dashboard. Seeing return visits spike after posting an update. Warmth scores improving in the days following a founder post.

---

### Job 7 — The Data Job

> **"When I want to understand whether my pre-launch campaign is working, I want to see how many people signed up, when they signed up, how many came through referrals, which referrers drove the best quality signups, and how healthy my list is — so I can make better decisions about where to spend my time."**

**Functional job:** A real-time dashboard showing total signups, daily velocity, referral conversion rate, qualification breakdown, warmth distribution, and a referral quality score per referrer.

**Emotional job:** Feel in control and informed. Data replaces gut feeling with signal. The founder who knows "posting in r/SaaS on Tuesday drove 40 signups, and 18 answered the qualification question about their current tool" is making decisions. The founder looking at a raw count is guessing.

**What success looks like:** A dashboard that answers four questions at a glance: How many signed up? Who matters most? Is the list healthy? Is the referral loop working?

**Market gap:** All tools give counts. Some give referral data. None give qualification breakdowns, warmth distribution, or engagement-weighted referral quality scores at the free or $15/month tier.

---

### Job 8 — The Ownership Job

> **"When I am ready to launch or move to a different tool, I want to export my entire email list — including qualification answers and warmth data — as a CSV without restrictions, so I can own my data and not be held hostage by a platform."**

**Functional job:** Export all subscriber data in a portable format at any time, on any tier.

**Emotional job:** Feel safe. GetWaitlist's pricing change is fresh in the community's memory. Founders know that tool decisions can be reversed overnight. CSV export — including the qualification and warmth columns — is the safety valve that makes the tool feel trustworthy.

**What success looks like:** A clearly labelled "Export CSV" button that downloads everything — email, position, referral count, quality score, qualification answers, warmth state — in one file, on the free tier.

---

## Secondary Jobs (Profile-Specific)

---

### Profile 2 — The Brand Continuity Job

> **"When a subscriber receives a confirmation email after joining my waitlist, I want that email to look and sound like it came from me — my name, my tone, my colours — so I can maintain a consistent brand experience from first contact."**

The creator's brand is their business. A system email that says "Thanks for joining [Tool Name]'s waitlist" breaks immersion and signals they are using a template, not communicating personally.

---

### Profile 3 — The Segmentation Job

> **"When I have qualification data from 500 signups, I want to filter my list by role, current tool, and company size, so I can decide who gets early beta access, who I invite to customer discovery calls, and who I prioritise for onboarding support."**

Profile 3 uses the qualification dashboard not just for self-assurance — but as an active product management tool. The breakdown "32 paying competitor users" is a list of people to call before anyone else.

---

### Profile 3 — The Collaboration Job

> **"When multiple people on my team need to manage the waitlist, I want everyone to have their own login with appropriate access, so we can work together without sharing credentials."**

Deferred to v1.1. Relevant for Profile 3 only at growth stage.

---

## Jobs Hierarchy

| Priority | Job                  | Who                   | Current Service Level                                               | This Product                         |
| -------- | -------------------- | --------------------- | ------------------------------------------------------------------- | ------------------------------------ |
| 1        | Validation Job       | All                   | Partially served — setup friction still high                        | Served — 4-minute setup              |
| 2        | Credibility Job      | All                   | Poorly served — design weak at affordable tier                      | Served — 3 designed templates        |
| 3        | Amplification Job    | 1, 3                  | Served (Presignup, Waitlister) — now table stakes                   | Served + quality score               |
| 4        | Qualification Job    | All (especially 1, 3) | Unserved below $39/month                                            | Served — free tier included          |
| 5        | Warmth Job           | All                   | Completely unserved at any price point                              | Served — Hot/Warm/Cold               |
| 6        | Communication Job    | All                   | Unserved below $29/month (email) + unserved entirely (updates feed) | Served — both forms                  |
| 7        | Data Job             | All                   | Partially served — counts only, no quality signals                  | Served — full intelligence dashboard |
| 8        | Ownership Job        | All                   | Mostly served                                                       | Served — CSV includes all columns    |
| 9        | Brand Continuity Job | Profile 2             | Poorly served                                                       | Served — sender name customisation   |
| 10       | Segmentation Job     | Profile 3             | Unserved below Prefinery                                            | Served — qualification filter        |
| 11       | Collaboration Job    | Profile 3             | Unserved below $199/month                                           | v1.1 — deferred                      |

---

## What The Product Is Actually Being Hired To Do

When a founder reaches for this tool, they are not hiring it to "collect emails." They are hiring it to do two things at once:

> **"Give me confidence that my idea is real, and tell me which of the people who showed interest will still care when I launch — because the data says most won't, and I need to know who the exceptions are before it's too late to act."**

The data behind that sentence: most waitlists convert at 2–3%. Users who wait 90+ days convert at single digits. The founder hiring this tool has either lived through that outcome or is determined not to. Every feature decision should be tested against both halves of this sentence. If a feature does not serve confidence, credibility, list quality, or engagement — it does not belong in v1.

---

## Jobs Not Being Hired For (Scope Boundaries)

| Not A Job                           | Why                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| Full CRM management                 | No customers yet. Different product                                                 |
| A/B testing landing page copy       | Traffic volume too low for significance                                             |
| Complex multi-step onboarding flows | The waitlist is the entire pre-launch funnel                                        |
| Affiliate program management        | Post-launch problem                                                                 |
| AI intent scoring (Baitlist model)  | Adds friction at signup. Simple questions achieve 80% of the value at zero friction |
| Team roles and permissions          | Deferred to v1.1 — Profile 3 only                                                   |
| Fraud detection at MVP scale        | Relevant at 50K+ signups with referral incentives. Over-engineering at MVP          |

---

_Sources: Baitlist Blog Mar 2026 | Presignup Blog May 2026 | Unicorn Platform Mar 2026 | MakerStack Waitlister Review Apr 2026 | DEV Community Feb 2026 | Waitlister.me Apr 2026 and Sept 2025 | LaunchList Blog Apr 2026 | Indie Hackers failure post-mortems 2024–2025 | Venture Curator Apr 2025 (2–3% average conversion benchmark) | Waitlister.me Sept 2025 (90-day decay to single digits, 50% within-one-month conversion) | GetWaitlist Blog (compound conversion rate case study) | Venture Crew / Superhuman case study | Building in Public research — Paddle, OpenTweet, Failory 2025–2026_

# Pre-Launch Waitlist Tool — Complete User Flow

**Version:** 4.3 — Part Four (Diagram Layout Instructions) removed. Part Three fully audited (v4.2). All 14 gaps closed. 57 nodes total.
**Prepared by:** Abdul-Hakeem Hassan
**Document type:** Textual User Flow (Excalidraw Build Guide)
**Follows from:** Problem Brief v2 · User Profile v2 · JTBD v2 · Product Vision v4.0 · Marketing Strategy v3.0 · Field Research Report v1 <!-- [SYNC FIX 2026-08-06]: Product Vision and Marketing Strategy version numbers were transposed here — verified against each source doc's own header (Product Vision v4.0, Marketing Strategy v3.0) -->

**Full Diagram on: [[Waitlist (User Flow Diagram)]]

---

## How to Read This Document

Every node in this flow is described in four parts:

1. **Shape** — what to draw in Excalidraw
2. **Label** — exactly what text goes inside the shape
3. **Colour** — fill colour to use (consistent system defined in the Legend below)
4. **Notes** — why this node exists and what it connects to

Arrows are described as: `[Origin node label] → [Destination node label]` with the label that goes on the arrow (if any) shown in parentheses.

Decisions (diamonds) always have two or more outgoing arrows. Each outgoing arrow is labelled with the branch condition.

---

## Shape & Colour Legend

Use this as your drawing key before starting. Apply it consistently.

| Shape                       | When to use                                     | Colour                                              |
| --------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| **Rounded Rectangle**       | Any screen a user sees or action they take      | Depends on which user (see below)                   |
| **Diamond**                 | Any decision point — Yes/No, branch, tier check | Yellow fill `#FFF3BF` · Dark amber stroke `#E67700` |
| **Ellipse / Oval**          | Entry points and terminal states (start / end)  | Matches the flow colour of the relevant user        |
| **Rectangle (no rounding)** | Section group label / swimlane header           | No fill (transparent) · Dark grey text `#495057`    |
| **Small rectangle (badge)** | Tier restriction label — e.g. "PRO ONLY"        | Red fill `#FFE3E3` · Red text `#C92A2A`             |

### Colour System by User Type

| User                   | Fill                     | Stroke                | Use for                                                                                 |
| ---------------------- | ------------------------ | --------------------- | --------------------------------------------------------------------------------------- |
| **Founder**            | `#E7F5FF` (light blue)   | `#1971C2` (blue)      | Every screen or action the founder takes                                                |
| **Subscriber**         | `#EBFBEE` (light green)  | `#2F9E44` (green)     | Every screen or action a subscriber takes                                               |
| **Key Differentiator** | `#FFF0F6` (light pink)   | `#C2255C` (pink)      | Qualification, Warmth Tracking, Referral Quality Score — the product's competitive edge |
| **Dashboard**          | `#F3F0FF` (light purple) | `#7048E8` (purple)    | Dashboard states and analytics panels                                                   |
| **Email (automated)**  | `#FFF4E6` (light orange) | `#E67700` (amber)     | Any automated email sent to founder or subscriber                                       |
| **Success / Terminal** | `#D3F9D8` (light green)  | `#2F9E44` (green)     | Successful completion states                                                            |
| **Entry point**        | Match user type colour   | Darker stroke of same | The starting oval for each flow                                                         |

---

## FLOW STRUCTURE OVERVIEW

This diagram has **three parallel vertical flows** that intersect at defined points:

- **Left column:** Founder Flow — account creation through dashboard management
- **Centre column:** Shared / Intersection points — where founder actions trigger subscriber experiences
- **Right column:** Subscriber Flow — public page through launch day

Read each flow top to bottom. Arrows that cross between columns are intersections — label them clearly.

Draw a **Section Header Rectangle** (transparent fill, grey text) above each major section to orient the reader. These are not clickable nodes — they are reading guides.

---

---

# PART ONE — FOUNDER FLOW

---

## SECTION A: ENTRY & DISCOVERY

---

### Node F-A1 — Entry Points

**Shape:** Ellipse (entry oval)
**Colour:** Founder (light blue fill, blue stroke)
**Label:**

```
FOUNDER ENTRY
─────────────────────────────
• Twitter/X thread → clicks link
• Reddit post (r/SaaS · r/indiehackers · r/startups)
• "Powered by [Tool]" footer on another founder's page
• Direct URL / word of mouth
```

**Notes:** These are the four documented acquisition channels. The "Powered by" entry is distinct from the others — that visitor has already seen the product in use. The flow does not go directly from this oval to a homepage — it branches first through Decision Node F-A1a below.

**Arrow:** Node F-A1 → Node F-A1a `(Visitor arrives)`

---

### Node F-A1a — Decision: How Did Visitor Arrive?

**Shape:** Diamond
**Colour:** Yellow fill, amber stroke (standard decision colour)
**Label:**

```
How did this
visitor arrive?
```

**Notes:** This is the branch that was missing between the entry oval and the two homepage variants. Every visitor passes through here. Two outgoing arrows — one to each homepage variant.

**Arrow (Twitter · Reddit · Direct URL · Word of mouth):** Node F-A1a → Node F-A2 (Cold Visitor Homepage) `(Twitter / Reddit / Direct)`
**Arrow ("Powered by" footer click):** Node F-A1a → Node F-A3 (Powered by Visitor Homepage) `("Powered by" footer)`

---

### Node F-A2 — Marketing Homepage (Cold Visitor)

**Shape:** Rounded Rectangle
**Colour:** Founder (light blue fill, blue stroke)
**Label:**

```
MARKETING HOMEPAGE
Cold visitor (Twitter · Reddit · Direct)
─────────────────────────────
Section 1: Problem statement
  "Most waitlists convert at 2–3%."
  (Hopkins Headline Candidate A / B / C — tested sequentially)

Section 2: Mechanism
  Subheadline: Qual questions · Warmth tracking ·
  Referral quality score · Broadcast email ·
  Live in 4 min · CSV always free

Section 3: Offer
  CTA: "Build your waitlist free →"

Section 4: Proof
  Specific benchmarks: 90-day decay · 50%
  within-month conversion · 500 free signups

Section 5: Competitive contrast
  "Every tool collects emails.
   This one tells you which 3% will pay."
```

**Notes:** This is not a simple box — it is a structured sales sequence. The homepage is the Hopkins salesman. Every section listed above is documented in Marketing Strategy Part 4. The CTA in Section 3 connects to Node F-B1 (Account Creation). Do not compress this into a single line.

---

### Node F-A3 — Marketing Homepage ("Powered by" Visitor)

**Shape:** Rounded Rectangle
**Colour:** Founder (light blue fill, blue stroke)
**Label:**

```
MARKETING HOMEPAGE
"Powered by" visitor — arrives with context
─────────────────────────────
Has already seen the product running
on another founder's live waitlist page.

Page shows the same structure as F-A2
BUT: above-fold copy acknowledges context:
"You just saw this in action. Here's what it does."

Same CTA: "Build your waitlist free →"
```

**Notes:** Gap 10 closed. This visitor is documented as a primary acquisition channel (>30% of new founders by month 3 per the marketing strategy). They arrive with a different emotional state — lower friction, higher intent. The homepage content is identical but the above-fold frame can acknowledge their context. Resolves to Node F-B1 (Account Creation) via the same CTA.

**Arrow:** Node F-A2 → Node F-B1 `(CTA clicked)`
**Arrow:** Node F-A3 → Node F-B1 `(CTA clicked)`

---

---

## SECTION B: ACCOUNT CREATION

---

### Node F-B1 — Signup / Login Screen

**Shape:** Rounded Rectangle
**Colour:** Founder (light blue fill, blue stroke)
**Label:**

```
ACCOUNT CREATION / LOGIN
─────────────────────────────
Option A: Email + password
Option B: Google OAuth (reduces friction ~60%)

[New user] → email verification → Onboarding
[Returning user] → directly to Dashboard
```

**Notes:** Gap 2 closed. This single screen handles both new and returning founders. The path branches immediately. A returning founder never re-enters onboarding. Connect to Decision Node F-B2.

---

### Node F-B2 — Decision: New or Returning?

**Shape:** Diamond
**Colour:** Yellow fill, amber stroke (standard decision colour)
**Label:**

```
First time
using this
account?
```

**Notes:** This is the branch that was missing entirely from the first flow. Two outgoing arrows:

**Arrow (Yes — new user):** Node F-B2 → Node F-C1 (Onboarding Step 1) `(New user)`
**Arrow (No — returning):** Node F-B2 → Node F-G2 (Dashboard — Active State) `(Returning founder → Dashboard)`

**Note on this branch:** A returning founder has existing data and goes to the Active State (F-G2), not the Empty State (F-G1). The Empty State is only reached by a brand-new account arriving from onboarding for the first time (via F-C6).

---

---

## SECTION C: ONBOARDING (NEW FOUNDER)

_Section header label: "ONBOARDING — 4 minutes to a live page"_

---

### Node F-C1 — Onboarding Step 1: Name Your Waitlist

**Shape:** Rounded Rectangle
**Colour:** Founder (light blue fill, blue stroke)
**Label:**

```
STEP 1 OF 5 — NAME YOUR WAITLIST
─────────────────────────────
• Waitlist name (e.g. "Buildly")
• One-line tagline
• Subdomain choice:
    yourproduct.[tool].com
  (live immediately on save)

Progress bar: ●○○○○
```

**Notes:** Subdomain goes live the moment the page is saved — not after all steps. This is the 4-minute promise. The founder can share the URL before they finish onboarding.

**Arrow:** Node F-C1 → Node F-C2 `(Next →)`

---

### Node F-C2 — Onboarding Step 2: Choose Template

**Shape:** Rounded Rectangle
**Colour:** Founder (light blue fill, blue stroke)
**Label:**

```
STEP 2 OF 5 — CHOOSE TEMPLATE
─────────────────────────────
3 options shown as visual cards:

[ Minimal ]   [ Bold ]   [ Dark ]
 Clean/white   High       Dark bg
 bg            contrast   premium

Live preview updates on right as
founder clicks each card.

Progress bar: ●●○○○
```

**Notes:** The live preview is graded 🔵 Core in the product vision. The three templates cover 90% of the aesthetic preferences of the primary audience. Do not add more templates here — v1.1 concern.

**Arrow:** Node F-C2 → Node F-C3 `(Next →)`

---

### Node F-C3 — Onboarding Step 3: Customise Page

**Shape:** Rounded Rectangle
**Colour:** Founder (light blue fill, blue stroke)
**Label:**

```
STEP 3 OF 5 — CUSTOMISE YOUR PAGE
─────────────────────────────
Left panel (editor):
  • Headline text
  • Subheadline text
  • CTA button text
  • Logo upload
  • Brand colour picker

Right panel (live preview):
  • Page renders in real time
  • Shows mobile view toggle
  • Shows "Powered by [Tool]"
    footer (free tier — visible here)
  • Social meta tag preview:
      og:title / og:description /
      og:image (auto-generated)
      "This is how your link looks
       when shared on Twitter"

Milestone rewards (optional panel):
  "What are subscribers working toward?"
  Tier 1: [              ] e.g. "Early access"
  Tier 2: [              ] e.g. "Founding member"
  Tier 3: [              ] e.g. "Free Pro 3 months"
  [Skip — no rewards]
  Note: rewards are shown on thank-you page
  above the share buttons.

Progress bar: ●●●○○
```

**Notes:** Gap 3a closed (social meta tags), Gap 14 closed ("Powered by" footer visible during setup — first upgrade trigger moment), and milestone rewards configuration added here per field research Findings 9 and 13. The og: preview is graded 🔵 Core. The milestone rewards configuration is graded 🟢 Should — if founder skips it, thank-you page shows referral link and share buttons without the milestone display. If configured, the milestone display appears above share buttons, giving subscribers a specific reason to share before the share ask is made.

**Arrow:** Node F-C3 → Node F-C4 `(Next →)`

---

### Node F-C4 — Onboarding Step 4: Qualification Questions

**Shape:** Diamond (decision — founder chooses)
**Colour:** Yellow fill, amber stroke
**Label:**

```
Enable qualification
questions at signup?
(optional feature)
```

**Notes:** The decision is the founder's. Questions are always optional for their subscribers — no friction forced on the subscriber side.

**Arrow (Yes):** Node F-C4 → Node F-C4a (Configure Questions) `(Yes — enable)`
**Arrow (No):** Node F-C4 → Node F-C5 (Email Setup) `(No — skip)`

---

### Node F-C4a — Configure Qualification Questions

**Shape:** Rounded Rectangle
**Colour:** Key Differentiator (light pink fill, pink stroke)
**Label:**

```
CONFIGURE QUALIFICATION QUESTIONS
★ KEY DIFFERENTIATOR
─────────────────────────────
Founder writes 2–3 questions:

Example question types:
  • "What are you currently using?"
  • "What's your role?"
  • "What's your biggest pain point?"

Tier limits:
  Free tier:  max 2 questions   [FREE]
  Pro tier:   max 5 questions   [PRO]
  Growth tier: unlimited        [GROWTH]

All questions are optional for subscribers.
Toggle: show after email/name capture.
```

**Attach badge:** `[FREE] max 2` and `[PRO] max 5` as small red-bordered badge rectangles next to the relevant lines.

**Notes:** Gap 3b partially addressed here (tier visibility). The pink colour signals to the designer that this is the product's differentiating feature — not a standard form field. Connect back to onboarding chain.

**Arrow:** Node F-C4a → Node F-C5 `(Next →)`

---

### Node F-C5 — Onboarding Step 5: Email Setup

**Shape:** Rounded Rectangle
**Colour:** Founder (light blue fill, blue stroke)
**Label:**

```
STEP 5 OF 5 — CONFIRMATION EMAIL SETUP
─────────────────────────────
FREE TIER (locked fields — preview only):
  Sender name:    [Your Name]  🔒 PRO to customise
  Email subject:  [locked]     🔒 PRO to customise
  Message body:   [locked]     🔒 PRO to customise
  Preview shown greyed out with upgrade prompt
  Emails send from [tool]'s authenticated domain.

PRO / GROWTH TIER (editable):
  Sender name:    e.g. "Sarah from Buildly"
  Email subject:  customisable
  Message body:   customisable
  Note: "Confirmation email will include
         subscriber's position + referral link
         automatically"

  Domain authentication [PRO]:
    "Send from your own domain for better
     deliverability. Takes 2 minutes."
    Step 1: Add this TXT record to your DNS:
            [SPF record — auto-generated]
    Step 2: Add this CNAME record:
            [DKIM record — auto-generated by Resend]
    [Verify setup →]   [Skip for now]

    Why this matters:
    "Sending from buildly.com instead of
     [tool].com means your launch broadcast
     reaches inboxes, not spam folders."

Progress bar: ●●●●●
```

**Notes:** Gap 3b closed (tier-gating defined). Domain authentication added per field research Finding 12: 69% of email senders report declining deliverability in 2025. The broadcast email is the primary Pro upgrade trigger — if it silently lands in spam, the product's core value proposition fails at the most critical moment. Resend generates SPF/DKIM records automatically; the product's job is to surface the setup and explain why it matters in plain language. Free tier founders send from the tool's authenticated sender domain — they are protected. Pro/Growth founders who set up their own domain get better deliverability and brand identity.

**Arrow:** Node F-C5 → Node F-C6 (Waitlist Live) `("Launch my waitlist →")`

---

### Node F-C6 — Waitlist Goes Live (Success Screen)

**Shape:** Rounded Rectangle
**Colour:** Success (light green fill, green stroke)
**Label:**

```
✓ YOUR WAITLIST IS LIVE
─────────────────────────────
URL: yourproduct.[tool].com   [Copy Link]

Share immediately:
  [Tweet this →]
  Pre-filled: "I'm building [name].
  Join the waitlist ↗ [url]"

  [Copy link]   [Share on LinkedIn]

What happens next (shown as 3 steps):
  1. Share the link — your first signups
     will come in the next 24 hours
  2. Your dashboard tracks who signs up,
     their warmth, and referral quality
  3. Come back before launch to see
     who's still paying attention

[Go to my dashboard →]
```

**Notes:** Gap 4 closed. This is the peak motivation moment — the product just went live. The marketing doc, JTBD doc, and user profile all identify this as the emotional high point. The screen does three things: gives the founder their sharing tools immediately, frames what to expect next (setting up the dashboard habit), and provides the path to the dashboard. This is not a simple confirmation — it is conversion work.

**Arrow:** Node F-C6 → Node F-G1 (Dashboard — Empty State) `("Go to dashboard →")`

---

---

## SECTION D: SECOND WAITLIST CREATION (RETURNING PRO/GROWTH FOUNDER)

_Section header label: "SECOND WAITLIST — Pro/Growth founders only"_

---

### Node F-D1 — Decision: Create Second Waitlist

**Shape:** Diamond
**Colour:** Yellow fill, amber stroke
**Label:**

```
Creating a
second waitlist?
(Pro/Growth only)
```

**Notes:** Gap 11 closed. A returning Pro or Growth founder who wants to create a new waitlist should not re-enter the full 5-step onboarding. This is a lighter path.

**Arrow (Yes — Pro/Growth):** Node F-D1 → Node F-D2 (Quick Create) `(Yes)`
**Arrow (No):** Node F-D1 → Node F-G1 (Dashboard) `(No — back to dashboard)`
**Arrow (Free tier tries):** Node F-D1 → Upgrade Modal Node F-F1 `(Free tier — upgrade required)`

---

### Node F-D2 — Quick Create: Second Waitlist

**Shape:** Rounded Rectangle
**Colour:** Founder (light blue fill, blue stroke)
**Label:**

```
QUICK CREATE — NEW WAITLIST
─────────────────────────────
(Lighter flow — settings pre-filled
from previous waitlist as defaults)

• Name + tagline
• Subdomain
• Template (pre-selects last used)
• Qualification questions (copy
  from previous or start fresh)
• Email setup (inherits from account)

[Create waitlist →]
```

**Notes:** The founder is not starting from zero — they have already configured preferences once. Inheriting defaults from the previous waitlist respects their time and is consistent with the "4 minutes to a shareable page" promise.

**Arrow:** Node F-D2 → Node F-G1 (Dashboard — new waitlist active) `(Waitlist created)`

---

---

## SECTION E: FOUNDER UPDATES FEED — POSTING FLOW

_Section header label: "FOUNDER UPDATES FEED — No competitor has this"_

---

### Node F-E1 — Post an Update (From Dashboard)

**Shape:** Rounded Rectangle
**Colour:** Key Differentiator (light pink fill, pink stroke)
**Label:**

```
FOUNDER UPDATES FEED — POST UPDATE
★ KEY DIFFERENTIATOR
─────────────────────────────
Accessed from dashboard panel.

Compose:
  Short update (max ~280 chars)
  Examples:
  "Just hit 200 signups — here's
   what we're building 👇"
  "Shipping the core feature next week."

[Publish update →]

Published update:
  → Appears on public waitlist page
  → Visible to all subscribers who return
  → Return visit is logged
  → Feeds warmth score (return visit = signal)
```

**Notes:** Gap 12 closed. This is a complete mini-flow: founder posts → update appears on public page → subscriber return visits feed warmth tracking. The feedback loop is: post update → subscribers return → warmth improves → dashboard shows healthier list. The pink colour signals this is a differentiating feature. This node connects both to the dashboard (F-G3 Active State) and to the subscriber flow (S-C1 Public Page Return Visit).

**Arrow:** Node F-E1 → Node F-G2 (Dashboard — Active State) `(Update posted — returns to active dashboard)`
**Arrow (cross-column):** Node F-E1 → Node S-C5 (Subscriber return visit) `(Update visible on public page)`

---

---

## SECTION F: UPGRADE FLOW

_Section header label: "UPGRADE — Free → Pro → Growth"_

---

### Node F-F1 — Upgrade Trigger Decision

**Shape:** Diamond
**Colour:** Yellow fill, amber stroke
**Label:**

```
Founder hits
upgrade trigger?
```

**Notes:** There are 7 documented upgrade triggers. Each one leads to the same upgrade modal but should be triggered from a different location in the UI. The engineer needs to know all 7 so each one shows the correct contextual modal copy.

**Outgoing arrows — one per trigger, all leading to Node F-F2:**

| Arrow Label                     | Where triggered        | Strongest copy angle                              |
| ------------------------------- | ---------------------- | ------------------------------------------------- |
| `Broadcast email — launch week` | Dashboard email panel  | "We're launching next week — email your list now" |
| `Warmth-segmented broadcast`    | Dashboard warmth panel | "Send only to warm subscribers"                   |
| `500-signup cap reached`        | Dashboard counter      | "You've outgrown the free tier"                   |
| `"Powered by" footer seen`      | Page editor / preview  | "Remove [Tool] from your page"                    |
| `Second waitlist needed`        | Create waitlist button | "Run multiple waitlists simultaneously"           |
| `Warmth alerts (Growth)`        | Dashboard warmth panel | "Let the tool watch your list for you"            |
| `Team access (Growth)`          | Settings               | "Add your co-founder to the dashboard"            |

---

### Node F-F2 — Upgrade Modal

**Shape:** Rounded Rectangle
**Colour:** Key Differentiator (light pink fill, pink stroke)
**Label:**

```
UPGRADE MODAL
─────────────────────────────
Context-sensitive header:
  (changes based on trigger — see F-F1 table)

  e.g. Broadcast trigger:
  "You're launching soon.
   Your list needs to hear from you."

  e.g. Footer trigger:
  "Your page is yours.
   Remove [Tool] branding."

Two options shown side by side:

PRO — $15/mo                GROWTH — $29/mo
────────────────            ────────────────
Unlimited signups           Everything in Pro
Broadcast email             + Automated warmth
Warmth-seg. broadcast         alerts
5 qual questions            + Unlimited qual Qs
Remove branding             + Team access (v1.1)
CSV export (all)            + Priority support
Custom domain (v1.1)

[Upgrade to Pro →]          [Upgrade to Growth →]

Powered by Paddle. Cancel anytime. Export your
data anytime — even if you downgrade.
```

**Notes:** Gap 6a and 6b closed. The modal header changes based on which trigger fired — the engineer must pass the trigger context to the modal component. The Hopkins principle: speak to the founder's emotional state at that exact moment. The data portability reassurance at the bottom directly addresses the GetWaitlist fear documented in the user profile.

**Arrow (completes payment):** Node F-F2 → Node F-F3 (Paddle Checkout) `(Select tier →)`
**Arrow (dismisses):** Node F-F2 → previous screen `(Dismiss)`

---

### Node F-F3 — Paddle Checkout

**Shape:** Rounded Rectangle
**Colour:** Founder (light blue fill, blue stroke)
**Label:**

```
PADDLE CHECKOUT
─────────────────────────────
Handled entirely by Paddle (Merchant of Record)
  • Processes payment
  • Handles VAT/tax globally
  • No US entity required

On success:
  → Features unlock immediately
  → Redirect to dashboard

On failure:
  → Retry prompt
  → Return to upgrade modal
```

**Arrow (payment success):** Node F-F3 → Node F-G2 (Dashboard — Active State, unlocked features now live) `(Payment confirmed)`
**Arrow (payment failure):** Node F-F3 → Node F-F2 (Upgrade Modal) `(Failed — retry)`

---

---

## SECTION G: DASHBOARD — FOUR DISTINCT STATES

_Section header label: "DASHBOARD — 4 states, each requiring distinct design"_

**Critical note for designer and engineer:** The dashboard is not one screen. It has four distinct states based on the founder's situation. Each state requires a separate design decision. Do not design the "active" state and apply it to all four — each one serves a different emotional and functional need.

---

### Node F-G1 — Dashboard State 1: Empty State

**Shape:** Rounded Rectangle
**Colour:** Dashboard (light purple fill, purple stroke)
**Label:**

```
DASHBOARD — STATE 1: EMPTY
(No signups yet)
─────────────────────────────
This is the highest churn-risk moment.
The founder just published — now what?

Show (do NOT show blank charts with zeroes):
  ✓ Live URL with one-click copy
  ✓ "Share on Twitter" shortcut
  ✓ Checklist of first actions:
      □ Share the link on Twitter/X
      □ Post in one relevant community
      □ Tell 5 people personally
  ✓ Preview of what the dashboard
    will look like once signups arrive
    (ghost/greyed chart illustration)

All data panels shown in skeleton state —
not zero, not blank — skeleton preview.

Warmth panel: shows 0 Hot · 0 Warm · 0 Cold
Qual panel: shows placeholder
```

**Notes:** Gap 5 closed (first of four states). The empty state is where most abandoned products die — the founder published and then nothing happened. The dashboard must reinforce the promise of the onboarding (4 minutes to a shareable page) by immediately giving them the tools to act. Skeleton previews are preferable to zeroes because they show what is coming rather than implying failure.

**Arrow:** Node F-G1 → Node F-G2 (Active State) `(First signup received)`
**Arrow:** Node F-G1 → Node F-E1 (Founder Updates Feed) `(Post first update)`

---

### Node F-G2 — Dashboard State 2: Active State

**Shape:** Rounded Rectangle
**Colour:** Dashboard (light purple fill, purple stroke)
**Label:**

```
DASHBOARD — STATE 2: ACTIVE
(Signups coming in, loop running)
─────────────────────────────
Top row — 4 headline numbers:
  Total signups | Referral % | Warmth: Hot/Warm/Cold | Today

Main chart: Signups over time (daily bar chart)
  "You posted in r/SaaS on Tuesday — the spike"

★ Qualification Breakdown Panel:
  500 signups:
   32 paying a competitor
   74 using spreadsheets
    8 enterprise
  386 early-stage / unknown

★ Warmth Distribution Panel:
  [████░░░░░░] 200 Hot · 180 Warm · 120 Cold
  "40% of your list is warm or cold"

Referral Leaderboard:
  NAME          REFERRALS    QUALITY SCORE
  ─────────────────────────────────────────
  John D.           50          18 qualified
  Maria S.          34          29 qualified ← higher quality
  [Full leaderboard →]

Subscriber List (filterable):
  Email | Position | Warmth | Referrals | Qual Answers | Date

[Export CSV]  ← always visible, all tiers

Founder Updates Feed Panel:
  [Write an update →]

Dashboard Actions:
  [Send broadcast email →]
  [Filter by warmth →]
  [Edit page →]
```

**Notes:** This is the primary working state. The qualification breakdown and warmth panels are shown in pink accent to signal they are differentiating features. The referral leaderboard shows both count AND quality score side by side — no competitor has this.

**Arrow:** Node F-G2 → Node F-G3 (Warning State) `(Cold % crosses threshold — Growth tier alert fires)`
**Arrow:** Node F-G2 → Node F-F1 (Upgrade Decision) `(Hits upgrade trigger)`
**Arrow:** Node F-G2 → Node F-E1 (Post Update) `(Founder posts update)`
**Arrow:** Node F-G2 → Node F-G4 (Pre-Launch State) `(Launch date approaches)`
**Arrow:** Node F-G2 → Node F-H1 (CSV Export) `(Export CSV)`

---

### Node F-G3 — Dashboard State 3: Warning State

**Shape:** Rounded Rectangle
**Colour:** Dashboard (light purple fill, purple stroke)
**Label:**

```
DASHBOARD — STATE 3: WARNING
(Cold % has crossed threshold)
─────────────────────────────
Triggered when:
  Cold subscribers > configured threshold
  (default: 30% of list is Cold)

What changes on the dashboard:
  Warmth panel turns amber/red:
  [██████░░░░] 120 Hot · 80 Warm · 300 Cold
  ⚠ "60% of your list has gone cold."

  Recommended action appears:
  "Send a re-engagement email to your
   Cold subscribers now — before they
   forget they signed up."

  [Send re-engagement email to Cold →]
    → Goes to broadcast compose
    → Segment pre-selected: Cold only

GROWTH TIER ONLY:
  Automated email already sent to founder:
  "Heads up — 60% of your list has gone cold.
   Log in to re-engage them."
  [GROWTH badge shown on this feature]
```

**Notes:** Gap 5 closed (third of four states). The warmth alert email to the founder is a Growth-tier fence feature — solo founders check manually, teams need the tool to monitor for them. The warning state dashboard is visible to all tiers; only the automated email alert is Growth-only.

**Arrow:** Node F-G3 → Node F-G2 (Active State) `(Re-engagement sent, warmth improves)`
**Arrow:** Node F-G3 → Node F-G4 (Pre-Launch State) `(Send re-engagement to Cold → founder enters pre-launch broadcast flow)`

**Note on this arrow:** The broadcast compose action lives inside F-G4 (Pre-Launch State). When the founder clicks "Send re-engagement email to Cold →" from the Warning State, they enter the Pre-Launch State where the broadcast tool is. There is no separate standalone broadcast node — the broadcast capability is a component within F-G4.

---

### Node F-G4 — Dashboard State 4: Pre-Launch State

**Shape:** Rounded Rectangle
**Colour:** Dashboard (light purple fill, purple stroke)
**Label:**

```
DASHBOARD — STATE 4: PRE-LAUNCH
(Launch day approaching)
─────────────────────────────
Founder is preparing to launch.
This state surfaces launch-specific actions.

Pre-launch checklist shown:
  □ Send final warmth re-engagement to Cold
  □ Send launch announcement to Hot + Warm
  □ Export full subscriber CSV
  □ Archive / close waitlist after launch

Warmth-segmented broadcast (PRO/GROWTH):
  Compose: "We're launching [date]."
  Send to: ● Hot + Warm only
           ○ Cold only
           ○ Full list

  [Preview email →]   [Send →]

[Export launch CSV →]
  Includes: email · position · warmth ·
  qual answers · referral count · quality score

[Archive this waitlist →]
  Closes signups. Marks as "Launched."
  Historical data preserved.
```

**Notes:** Gap 9 closed. Launch day is a documented multi-step sequence: warm-up broadcast → launch announcement → CSV export → archive. The warmth-segmented broadcast is the Pro feature the entire product was built to make possible. The archive action closes the loop on the waitlist lifecycle.

**Arrow:** Node F-G4 → Node F-H1 (CSV Export) `(Export launch CSV)`
**Arrow:** Node F-G4 → Node F-H2 (Archive Waitlist) `(Archive →)`
**Arrow (cross-column):** Node F-G4 → Node S-E1 (Subscriber Receives Launch Broadcast) `(Broadcast sent)`

---

---

## SECTION H: TERMINAL ACTIONS

---

### Node F-H1 — CSV Export

**Shape:** Rounded Rectangle
**Colour:** Founder (light blue fill, blue stroke)
**Label:**

```
CSV EXPORT
Available: ALL TIERS
─────────────────────────────
One button. No gate. No upsell.
(Data portability = trust signal)

Columns exported:
  • Email address
  • First name
  • Signup date
  • Position in queue
  • Referral count
  • Referral quality score
  • Warmth state (Hot / Warm / Cold)
  • Qualification answer 1
  • Qualification answer 2
  • Qualification answer 3 (if configured)

Downloads as .csv immediately.
```

**Notes:** CSV export is graded 🔵 Core in the product vision with explicit reasoning: "Its absence is a deal-breaker." It must be visible and accessible on every tier, from every dashboard state.

---

### Node F-H2 — Archive Waitlist

**Shape:** Rounded Rectangle
**Colour:** Founder (light blue fill, blue stroke)
**Label:**

```
ARCHIVE WAITLIST
─────────────────────────────
Triggered after launch.

Action:
  • Public page shows "Closed" state
    or custom "Thank you" message
  • No new signups accepted
  • Historical data fully preserved
  • CSV export still available

Founder sees waitlist in dashboard
as "Launched — [date]" with
all data intact.
```

**Arrow:** Node F-H2 → Node F-H3 (Founder Exit / Launch Terminal) `(Archived)`

---

### Node F-H3 — Launch Day Terminal

**Shape:** Ellipse (terminal/end state)
**Colour:** Success (light green fill, green stroke)
**Label:**

```
LAUNCH DAY
─────────────────────────────
Founder has:
  • A qualified, warmth-segmented list
  • Knows who the top 3% are
  • Has re-engaged cold subscribers
  • Has broadcast to hot/warm segment
  • Exported full CSV with all signals

Industry average: 2–3% conversion
This founder knows who the 3% are
before sending the first launch email.
```

---

---

# PART TWO — SUBSCRIBER FLOW

---

## SECTION S-A: ENTRY

---

### Node S-A1 — Subscriber Entry Points

**Shape:** Ellipse (entry oval)
**Colour:** Subscriber (light green fill, green stroke)
**Label:**

```
SUBSCRIBER ENTRY
─────────────────────────────
Path A: Direct link
  Founder shared link on Twitter/X,
  Reddit, community, or DM

Path B: Referral link (?ref=XXXX)
  Another subscriber shared their
  unique referral link
  → Different thank-you page experience
    (Gap 7 — see Node S-B3b)

Path C: "Powered by" footer
  Subscriber on page clicks footer
  → Goes to marketing homepage (F-A3)
  → Exits subscriber flow / enters founder flow
```

**Notes:** Gap 7 partially set up here. Path B (referral arrival) is distinguished from Path A because the post-signup experience differs. Path C exits the subscriber flow entirely — that visitor becomes a potential new founder.

**Arrow (Path A):** Node S-A1 → Node S-B1 (Public Waitlist Page — direct) `(Direct visit)`
**Arrow (Path B):** Node S-A1 → Node S-B1 (Public Waitlist Page — referred) `(Referred visit — ?ref= captured)`
**Arrow (Path C):** Node S-A1 → Node F-A3 (Marketing Homepage — Powered by visitor) `(Clicks footer → enters founder flow)`

---

---

## SECTION S-B: PUBLIC PAGE & SIGNUP

---

### Node S-B1 — Public Waitlist Page

**Shape:** Rounded Rectangle
**Colour:** Subscriber (light green fill, green stroke)
**Label:**

```
PUBLIC WAITLIST PAGE
─────────────────────────────
Hero section:
  • Founder's headline
  • Subheadline
  • Live signup count: "Join 247 others"
    (toggleable — founder can hide if count
     is low during early days)

Founder updates feed (if founder has posted):
  Shows latest update(s) from founder
  "Just hit 200 signups — here's what's
   coming 👇"
  [Read all updates →]

Signup form:
  • First name field
  • Email address field
  [Join the waitlist →]

Public referral leaderboard:
  NAME          REFERRALS    QUALITY
  ─────────────────────────────────
  John D.           50       18 qualified
  Maria S.          34       29 qualified
  (Visible to all — creates competition)
```

**Notes:** Gap 13 closed. The public leaderboard is visible to subscribers — it is not just a founder analytics tool. The competitive dimension drives viral behaviour. The product vision explicitly states: "[Subscriber] sees · [Founder] monitors."

**Arrow:** Node S-B1 → Node S-B2 (Decision: Qual questions enabled?) `(Clicks "Join the waitlist →")`

---

### Node S-B2 — Decision: Qualification Questions Enabled?

**Shape:** Diamond
**Colour:** Yellow fill, amber stroke
**Label:**

```
Founder enabled
qualification
questions?
```

**Arrow (Yes):** Node S-B2 → Node S-B2a (Qual Questions shown) `(Yes)`
**Arrow (No):** Node S-B2 → Node S-B3 (Submit) `(No — straight to submit)`

---

### Node S-B2a — Qualification Questions (Subscriber View)

**Shape:** Rounded Rectangle
**Colour:** Key Differentiator (light pink fill, pink stroke)
**Label:**

```
QUALIFICATION QUESTIONS
★ KEY DIFFERENTIATOR — Subscriber view
─────────────────────────────
Shown after name + email capture,
before final submit button.

"A few optional questions
 to help [Founder name] understand
 what you need:"

Question 1: [Founder's custom text]
  (free text or multiple choice)

Question 2: [Founder's custom text]

[Optional — skip these →]   [Submit →]

Note: These are always optional.
Zero friction forced on the subscriber.
Skipping does not affect their position.
```

**Notes:** The optional nature is critical — the product vision and JTBD both state that mandatory questions reduce signup conversions. The founder benefits from answered questions; the subscriber is never penalised for skipping.

**Arrow:** Node S-B2a → Node S-B3 (Submit) `(Answered or skipped)`

---

### Node S-B3 — Submit & Duplicate Check

**Shape:** Rounded Rectangle
**Colour:** Subscriber (light green fill, green stroke)
**Label:**

```
SUBMIT — PROCESSING
─────────────────────────────
System actions (invisible to subscriber):
  1. Duplicate email check
     → If duplicate: "You're already
       on this list. Check your email
       for your referral link."
  2. Supabase insert (new subscriber row)
  3. Position assigned (#N in queue)
  4. Unique referral link generated
  5. Qualification answers stored (if given)
  6. Warmth score initialised: Warm
     (new signup starts as Warm,
      not Hot — Hot requires engagement)
  7. Confirmation email queued (Resend)

→ Redirect to thank-you page
```

**Notes:** Warmth initialisation is documented: a brand-new signup is not automatically "Hot" — that requires observed engagement (email open, return visit, qual answer). Starting at "Warm" is the correct default.

**Arrow:** Node S-B3 → Node S-B3a (Decision: referred or direct?) `(Submission processed — new email)`
**Arrow (duplicate):** Node S-B3 → Node S-B3-DUP (Duplicate Email State) `(Email already exists in Supabase)`

---

### Node S-B3-DUP — Duplicate Email State

**Shape:** Rounded Rectangle (small — minimal screen, not a full page)
**Colour:** Subscriber (light green fill, green stroke)
**Label:**

```
DUPLICATE EMAIL — ALREADY REGISTERED
─────────────────────────────
Triggered when: submitted email already
exists in Supabase for this waitlist.

Shown as inline message on the same
page (not a redirect to a new screen):

"You're already on this list.
 Check your original confirmation
 email for your referral link."

[Resend my confirmation email →]
  → System action: Resend fires the
    original confirmation email again
    to that address
  → No new screen transition

No new position assigned.
No new referral link generated.
Warmth score: unchanged.
Qualification answers: unchanged.
```

**Notes:** This is a terminal state for that submission attempt. The subscriber is not re-inserted into the queue, their position does not change, and no new referral link is created. The only action available is resending the original confirmation email — useful for subscribers who cannot find their referral link. There are no outgoing arrows from this node except the system-level resend trigger, which fires an email and returns the subscriber to the same inline message state.

**Terminal — no outgoing arrows.**

---

### Node S-B3a — Decision: Arrived via Referral Link?

**Shape:** Diamond
**Colour:** Yellow fill, amber stroke
**Label:**

```
Subscriber arrived
via referral link
(?ref= detected)?
```

**Notes:** Gap 7 closed here. This decision determines which thank-you page variant the subscriber sees.

**Arrow (Yes — referred):** Node S-B3a → Node S-B4b (Thank-You — Referred Variant) `(Yes — ?ref= present)`
**Arrow (No — direct):** Node S-B3a → Node S-B4a (Thank-You — Direct Variant) `(No — direct signup)`

---

### Node S-B4a — Thank-You Page (Direct Signup)

**Shape:** Rounded Rectangle
**Colour:** Subscriber (light green fill, green stroke)
**Label:**

```
THANK-YOU PAGE — DIRECT SIGNUP
─────────────────────────────
"You're in. ✓"
Position: "You're #247 on the waitlist"

Milestone rewards (if founder configured):
  Shown BEFORE share buttons — show reward commitment before ask
  🎯 Refer 1  → Early access
  🏅 Refer 5  → Free Pro plan for 1 month
  🎁 Refer 10 → Lifetime 20% discount
  🏆 Refer 25 → Founding member status
  "You've referred 0 of 3 friends toward: Early access."

Your referral link:
  [yourproduct.[tool].com?ref=XXXX]
  [Copy link]

Share and move up:
  [Tweet this →]
    Pre-filled: "I just joined the
    waitlist for [Product Name].
    Jump the queue → [referral url]"
  [Share on LinkedIn]
  [Share on WhatsApp]

How it works:
  "Every person who signs up
   using your link moves you up
   one spot. Automatically."

Public leaderboard preview:
  [See where you rank →]
```

**Notes:** Milestone rewards added per field research Findings 9 and 13. The milestone display appears above the share buttons — the subscriber sees what they're working toward before they are asked to share. Shown only if the founder configured rewards during setup; if not configured, this section is absent and the page shows the referral link and share buttons directly. "You've referred 0 of 3 friends toward: Early access" is a progress indicator — it makes the goal specific and immediate.

**Arrow:** Node S-B4a → Node S-C1 (Confirmation Email sent) `(Email queued)`
**Arrow:** Node S-B4a → Node S-C2 (Referral Loop — subscriber shares) `(Subscriber shares link)`

---

### Node S-B4b — Thank-You Page (Referred Signup)

**Shape:** Rounded Rectangle
**Colour:** Subscriber (light green fill, green stroke)
**Label:**

```
THANK-YOU PAGE — REFERRED SIGNUP
─────────────────────────────
"You're in. ✓  And you helped [Referrer]
 move up."

Position: "You're #248 on the waitlist"

Referral mechanic acknowledged:
  "The person who referred you just
   moved up a spot automatically.
   Now it's your turn to do the same."

Milestone rewards (if founder configured):
  Shown BEFORE share buttons — show reward commitment before ask
  🎯 Refer 1  → Early access
  🏅 Refer 5  → Free Pro plan for 1 month
  🎁 Refer 10 → Lifetime 20% discount
  🏆 Refer 25 → Founding member status
  "You've referred 0 of 3 friends toward: Early access."

YOUR referral link:
  [yourproduct.[tool].com?ref=YYYY]
  [Copy link]

Share and move up:
  [Tweet this →]
  [Share on LinkedIn]

System action (invisible):
  → Referrer's position recalculated upward
  → "You moved up" email queued to referrer
```

**Notes:** Gap 7 closed fully here. Milestone rewards added per Findings 9 and 13 — same logic as direct variant. The referred subscriber arrives with the referral mechanic already acknowledged ("you helped [Referrer] move up") which primes them to understand and act on the same mechanic for themselves. The milestone display reinforces the specific value of doing so.

**Arrow:** Node S-B4b → Node S-C1 (Confirmation Email) `(Email queued)`
**Arrow:** Node S-B4b → Node S-C2 (Referral Loop) `(Subscriber shares their own link)`
**Arrow (cross-column):** Node S-B4b → Node S-C3 ("You Moved Up" Email — to referrer) `(Referrer notified)`

---

---

## SECTION S-C: POST-SIGNUP ENGAGEMENT

---

### Node S-C1 — Confirmation Email

**Shape:** Rounded Rectangle
**Colour:** Email automated (light orange fill, amber stroke)
**Label:**

```
AUTOMATED EMAIL — CONFIRMATION
Sent via: Resend
─────────────────────────────
From: [Founder's name] (e.g. "Sarah from Buildly")
  FREE TIER: From "[Tool] notifications"
             🔒 PRO to customise sender name
  PRO/GROWTH: "Sarah from Buildly"

Subject: [customisable on Pro]

Body includes:
  • "You're #247 on the list"
  • Your referral link
  • "Share this link — every referral
     moves you up automatically"
  • [Tweet this] CTA button

Warmth action: email delivered → Warm
(open tracked via Resend → will upgrade
 to Hot on open — v1.1 feature)
```

**Notes:** Email customisation is explicitly a Pro-only feature (🟢 Should, Pro-tier). The free tier founder's confirmation email comes from the tool's sender name, not their own. This is the Brand Continuity Job (Profile 2). The warmth signal from email opens will be tracked via Resend webhooks — this is a v1.1 feature, not MVP.

---

### Node S-C2 — Referral Loop: Subscriber Shares

**Shape:** Rounded Rectangle
**Colour:** Subscriber (light green fill, green stroke)
**Label:**

```
REFERRAL LOOP — SUBSCRIBER SHARES
─────────────────────────────
Subscriber shares their unique
referral link (?ref=XXXX) via:
  • Twitter/X (pre-filled tweet)
  • LinkedIn
  • WhatsApp / DM
  • Copy + paste anywhere

New person clicks the referral link
  → Arrives at public page (Node S-B1)
    with ?ref=XXXX in URL
  → If they sign up:
      Referrer moves up in queue
      Referrer quality score updates
      "You moved up" email sent
      New signup enters at S-B3a
        → Thank-you page (Referred variant)
```

**Notes:** This is the viral loop's active state. Every new referred signup re-enters the flow at Node S-B1 with the referral parameter captured. The loop is self-sustaining as long as subscribers see value in moving up.

**Arrow (loop back):** Node S-C2 → Node S-B1 (New referred person arrives at public page) `(New referred signup)`
**Arrow:** Node S-C2 → Node S-C3 ("You moved up" email) `(Referral converted)`

---

### Node S-C3 — "You Moved Up" Email (Referrer)

**Shape:** Rounded Rectangle
**Colour:** Email automated (light orange fill, amber stroke)
**Label:**

```
AUTOMATED EMAIL — "YOU MOVED UP"
Sent to: the original referrer
─────────────────────────────
Trigger: one of their referrals just signed up

From: [Founder's name / tool sender]
Subject: "You moved up — [Product name]"

Body:
  "Someone signed up using your link.
   You're now #[new position] on the list.
   Keep sharing to move up further."
   [Your referral link]  [Tweet again →]

Warmth action:
  Referrer engagement re-confirmed
  → Warmth score bumped toward Hot
```

**Notes:** This email re-surfaces the referral link at the highest motivation moment — when the referrer just had a win. It is graded 🔵 Core in the product vision.

---

### Node S-C4 — Warmth Tracking (Background System)

**Shape:** Rounded Rectangle
**Colour:** Key Differentiator (light pink fill, pink stroke)
**Label:**

```
WARMTH TRACKING — BACKGROUND SYSTEM
★ KEY DIFFERENTIATOR — No competitor has this
─────────────────────────────
Not a screen. A continuous background
process. Shown here to document the logic.

WARMTH STATE per subscriber:

🔴 HOT
  Conditions (any of):
    • Signed up within last 30 days AND
      opened confirmation email
    • Returned to public page (any visit)
    • Answered qualification questions
    • Viewed founder update on page

🟡 WARM
  Conditions:
    • Signed up, email delivered
    • No return visits yet
    • No qual answers yet
    • Default starting state for new signup

⚫ COLD
  Conditions:
    • 90+ days since signup
    • No email open (Resend webhook)
    • No return page visit
    • No qual answers given
    • No engagement with any update

Warmth displayed in:
  → Founder dashboard subscriber list
  → Warmth distribution panel
  → Filter for warmth-segmented broadcast
  → Triggers automated alert (Growth tier)
```

**Notes:** Gap 5 data source documented. Warmth is calculated from four observable signals: email opens (Resend), page return visits (Supabase), qualification answers (stored), founder update views (Supabase). All technically simple — no AI, no third-party service. Three states only. The JTBD Warmth Job documents this fully.

---

### Node S-C5 — Subscriber Return Visit

**Shape:** Rounded Rectangle
**Colour:** Subscriber (light green fill, green stroke)
**Label:**

```
SUBSCRIBER RETURN VISIT
─────────────────────────────
Subscriber returns to public waitlist page.
Triggered by:
  • Founder posts an update (F-E1)
  • "You moved up" email link clicked
  • Re-engagement email link clicked
  • Subscriber checking their position

What they see on return:
  • Updated signup count
  • Latest founder update(s)
  • Updated leaderboard position
  • Same signup form
    (if they click → duplicate message)

System action (invisible):
  → Return visit logged (Supabase)
  → Warmth score updated toward Hot
```

**Notes:** This is the Founder Updates Feed feedback loop (Gap 12). The founder posts → subscribers return → warmth improves. The return visit is the signal. The product vision grades the updates feed 🔵 Core specifically because it drives these return visits, which feed warmth tracking.

**Arrow:** Node S-C5 → Node S-C4 (Warmth Tracking — score updated) `(Return visit logged → warmth improves)`

---

---

## SECTION S-D: WARMTH RE-ENGAGEMENT

---

### Node S-D1 — Decision: Subscriber Gone Cold?

**Shape:** Diamond
**Colour:** Yellow fill, amber stroke
**Label:**

```
Subscriber warmth
state = COLD?
(90+ days,
no engagement)
```

**Arrow (Yes — Cold):** Node S-D1 → Node S-D2 (Warmth Re-engagement Email) `(Yes — Cold subscriber)`
**Arrow (No — still Warm/Hot):** Node S-D1 → Node S-E1 (Subscriber Receives Launch Broadcast) `(No — still engaged, flows forward to launch)`

**Note on this branch:** A subscriber who is still Warm or Hot has not gone cold and needs no re-engagement. They flow forward directly to the launch broadcast. They do not need a separate path — the next thing that happens to them is the launch email.

---

### Node S-D2 — Warmth Re-engagement Email (Founder sends to Cold segment)

**Shape:** Rounded Rectangle
**Colour:** Email automated (light orange fill, amber stroke)
**Label:**

```
WARMTH-SEGMENTED BROADCAST
Sent by: Founder (manual action from dashboard)
Sent to: Cold subscribers only
PRO / GROWTH feature [PRO badge]
─────────────────────────────
Founder composes from dashboard:
  "We're almost ready.
   Still interested in [Product name]?

   If you're still in, here's your
   referral link — share it and move
   up before we launch."

   [Your referral link]

Warmth action on receive:
  Email delivered → no change yet

Warmth action on open:
  → Warmth score moves Warm

Warmth action on link click (return visit):
  → Warmth score moves Hot
```

**Notes:** This is the critical pre-launch re-engagement feature. The JTBD Warmth Job documents the exact outcome: "They send a re-engagement email to the Cold segment. They recover 40 of them. They launch to a warmer list." The email contains the referral link — this can also reactivate the referral loop.

**Arrow:** Node S-D2 → Node S-D3 (Decision: subscriber response) `(Email sent)`

---

### Node S-D3 — Decision: Subscriber Response to Re-engagement

**Shape:** Diamond
**Colour:** Yellow fill, amber stroke
**Label:**

```
Subscriber
responds to
re-engagement
email?
```

**Notes:** Gap 8 closed here. Three branches, not two.

**Arrow (Returns to page):** Node S-D3 → Node S-C5 (Subscriber Return Visit → warmth improves) `(Clicks link → returns to page)`
**Arrow (Re-shares referral link):** Node S-D3 → Node S-C2 (Referral Loop reactivated) `(Shares referral link again → loop reactivates)`
**Arrow (Ignores):** Node S-D3 → Node S-D3a (Remains Cold) `(No action — remains Cold)`
**Arrow (Unsubscribes):** Node S-D3 → Node S-D3b (Unsubscribe) `(Clicks unsubscribe)`

---

### Node S-D3a — Remains Cold

**Shape:** Rounded Rectangle
**Colour:** Subscriber (light green fill, green stroke)
**Label:**

```
SUBSCRIBER REMAINS COLD
─────────────────────────────
No action taken.
Warmth state: Cold (unchanged)

Founder can:
  → See this subscriber in Cold
    filter in dashboard
  → Include or exclude from
    launch broadcast (their choice)
  → This subscriber will likely not
    convert on launch day
    (documented: single-digit %
     for 90+ day cold subscribers)
```

---

### Node S-D3b — Unsubscribe

**Shape:** Rounded Rectangle
**Colour:** Subscriber (light green fill, green stroke)
**Label:**

```
UNSUBSCRIBE
─────────────────────────────
Subscriber clicks unsubscribe
(required by email law — Resend handles)

System actions:
  → Subscriber marked as unsubscribed
  → Removed from all future broadcasts
  → Warmth state: removed from tracking
  → Position in queue: vacated
    (others do NOT move up — queue
     numbers are not recalculated on
     unsubscribe to avoid confusion)
  → Count in dashboard: decremented
  → CSV export: row excluded from
    future exports (or shown as
    "unsubscribed" — product decision)

Founder notified:
  → Dashboard unsubscribe count visible
```

**Notes:** Gap 8 closed fully. Unsubscribe is a real user action with real data integrity consequences. The queue recalculation decision (do others move up?) is a product decision that must be made explicitly — not by default. The recommendation is: do not recalculate. Subscribers who earned a position keep it. Only the unsubscribed row is flagged.

---

---

## SECTION S-E: LAUNCH DAY (SUBSCRIBER SIDE)

---

### Node S-E1 — Subscriber Receives Launch Broadcast

**Shape:** Rounded Rectangle
**Colour:** Email automated (light orange fill, amber stroke)
**Label:**

```
AUTOMATED EMAIL — LAUNCH BROADCAST
Sent by: Founder (manual from dashboard)
Sent to: Hot + Warm segment (recommended)
PRO / GROWTH feature [PRO badge]
─────────────────────────────
Founder composes final launch email:
  "We're live. [Product name] is ready.
   You were one of the first.
   Here's your early access link: →"

Warmth context for this email:
  Sent only to Hot + Warm = highest
  conversion probability
  Cold subscribers excluded (or sent
  separate "last chance" version)
```

**Notes:** Gap 9 closed. This is the final broadcast in the documented launch sequence: warm-up → re-engagement → launch announcement. The warmth-segmented broadcast is the Pro feature designed for exactly this moment.

---

### Node S-E2 — Subscriber Converts / Does Not Convert

**Shape:** Diamond
**Colour:** Yellow fill, amber stroke
**Label:**

```
Subscriber
converts on
launch day?
```

**Arrow (Yes — converts):** Node S-E2 → Node S-E3 (Subscriber converts — terminal) `(Signs up / purchases)`
**Arrow (No — does not convert):** Node S-E2 → Node S-E4 (Does not convert — terminal) `(Ignores launch email)`

---

### Node S-E3 — Subscriber Converts (Terminal)

**Shape:** Ellipse (terminal)
**Colour:** Success (light green fill, green stroke)
**Label:**

```
SUBSCRIBER CONVERTS
─────────────────────────────
Subscriber signs up / purchases
on launch day.

This subscriber was:
  Hot or Warm at time of broadcast
  Likely signed up within 30 days OR
  Re-engaged via warmth email

Industry average: 2–3% of all signups
This product's informed founder knows
who the 3% are before sending.
```

---

### Node S-E4 — Does Not Convert (Terminal)

**Shape:** Ellipse (terminal)
**Colour:** Subscriber (light green fill, green stroke)
**Label:**

```
SUBSCRIBER DOES NOT CONVERT
─────────────────────────────
Was Cold at launch. Did not re-engage.
Consistent with documented benchmark:
single-digit % conversion after 90+ days.

Founder still has their data in CSV.
No data lost.
```

---

---

# PART THREE — CROSS-COLUMN CONNECTIONS (INTERSECTIONS)

_These are arrows that cross from the Founder Flow into the Subscriber Flow or vice versa. Draw them as horizontal or diagonal arrows that cross the column boundary. Label each one clearly._

---

### Intersection I-1 — Waitlist Goes Live → Public Page Exists

**From:** Node F-C6 (Waitlist Goes Live)
**To:** Node S-B1 (Public Waitlist Page)
**Arrow label:** `Page is now live at [url]`
**Direction:** Founder column → Subscriber column
**Note:** The moment the founder completes onboarding, the public page exists and is accessible. These two nodes are simultaneous.

---

### Intersection I-2 — Founder Posts Update → Appears on Public Page

**From:** Node F-E1 (Founder Posts Update)
**To:** Node S-B1 (Public Waitlist Page — updates feed section)
**Arrow label:** `Update published → visible on public page immediately`
**Direction:** Founder column → Subscriber column
**Note:** The update appears on the public page the moment the founder publishes it. Any subscriber who visits the page after this point sees the update. This is a passive intersection — it does not trigger subscriber action directly.

---

### Intersection I-2b — Subscriber Clicks Update Link → Return Visit Logged

**From:** Node F-E1 (Founder Posts Update) — via the update content on S-B1
**To:** Node S-C5 (Subscriber Return Visit)
**Arrow label:** `Subscriber clicks link in update → return visit logged → warmth improves`
**Direction:** Founder column → Subscriber column (via public page)
**Note:** This is the active half of I-2. A subscriber who sees the update and clicks through to the page generates a return visit event in Supabase, which feeds warmth tracking. These are two separate arrows on the diagram — I-2 shows the update publishing; I-2b shows the subscriber responding to it.

---

### Intersection I-3 — Successful Signup → Appears in Founder Dashboard

**From:** Node S-B3 (Submit & Duplicate Check) — successful path only (not the duplicate branch)
**To:** Node F-G2 (Dashboard — Active State)
**Arrow label:** `New subscriber row committed to Supabase → dashboard updates in real time`
**Direction:** Subscriber column → Founder column
**Note:** This intersection fires only when the duplicate check passes and a new Supabase row is successfully committed. The duplicate path (S-B3-DUP) does NOT trigger this intersection — no new row, no dashboard update. The dashboard increments its total count, adds the new subscriber to the list, and updates the warmth distribution panel in real time.

---

### Intersection I-4 — Qualification Answers → Founder Dashboard Breakdown

**From:** Node S-B2a (Qualification Questions — answered)
**To:** Node F-G2 (Dashboard — Qualification Breakdown Panel)
**Arrow label:** `Answers stored → qual breakdown updates`
**Direction:** Subscriber column → Founder column

---

### Intersection I-5 — Warmth State → Founder Dashboard

**From:** Node S-C4 (Warmth Tracking — background system)
**To:** Node F-G2 (Dashboard — Warmth Distribution Panel)
**To also:** Node F-G3 (Dashboard — Warning State, if threshold crossed)
**Arrow label:** `Warmth calculated → dashboard reflects state`
**Direction:** Subscriber column → Founder column

---

### Intersection I-6 — Growth Tier: Automated Warmth Alert → Founder Email

**From:** Node F-G3 (Dashboard — Warning State)
**To:** Node I-6-EMAIL (Growth Tier Automated Alert Email — define as terminal node below)
**Arrow label:** `GROWTH TIER: automated email fires when Cold % > threshold`
**Badge:** `[GROWTH]` badge on this arrow
**Direction:** Founder column → external (email inbox)

**Node I-6-EMAIL — Growth Tier Automated Alert Email**

**Shape:** Rounded Rectangle (small terminal)
**Colour:** Email automated (light orange fill, amber stroke)
**Label:**

```
AUTOMATED EMAIL → FOUNDER
Growth tier only [GROWTH]
─────────────────────────────
Trigger: Cold % crosses configured
threshold (default: 30% of list)

Sent to: Founder's registered email
Subject: "Heads up — [X]% of your
         list has gone cold"
Body:
  "60% of your waitlist subscribers
   have gone cold. Log in to send a
   re-engagement email before you
   lose them."
  [Go to dashboard →]

Founder clicks → returns to F-G3
(Dashboard Warning State)
where re-engagement action lives.
```

**Note:** This is not a screen the subscriber ever sees. It is a system-generated email sent to the founder's own inbox. It is a Growth-tier exclusive feature — Free and Pro founders must check the dashboard manually. The email's CTA brings the founder back to the dashboard Warning State (F-G3) to take action.

---

### Intersection I-7 — Founder Sends Broadcast → Subscriber Receives Email

**From:** Node F-G4 (Dashboard — Pre-Launch State, broadcast sent)
**To:** Node S-E1 (Subscriber Receives Launch Broadcast)
**Arrow label:** `Warmth-segmented broadcast fires`
**Direction:** Founder column → Subscriber column

---

### Intersection I-8 — Referred Signup → Referrer Position Update

**From:** Node S-B4b (Thank-You Page — Referred Signup)
**To:** Node S-C3 ("You Moved Up" Email — to referrer)
**Arrow label:** `Referrer notified, position recalculated`
**Direction:** Within subscriber column but marks a dual-subscriber event
**Note:** This intersection is unusual — it is subscriber-to-subscriber rather than founder-to-subscriber or subscriber-to-founder. One subscriber's signup triggers an automated email and a position change for a different subscriber. Draw this as a curved arrow that loops from S-B4b back up to S-C3.

---

### Intersection I-9 — Re-engagement Response → Warmth Updates → Dashboard Reflects

**From:** Node S-C5 (Subscriber Return Visit — triggered by re-engagement email click)
**To:** Node S-C4 (Warmth Tracking — score updated)
**To also:** Node F-G2 (Dashboard — Active State, warmth distribution updated)
**Arrow label:** `Re-engagement response → warmth improves → dashboard reflects recovery`
**Direction:** Subscriber column → Subscriber column → Founder column
**Note:** This is the most important feedback loop in the entire product and the one that closes the pre-launch re-engagement cycle. The sequence is: founder sends re-engagement email (F-G4/S-D2) → subscriber receives it (S-D2) → subscriber clicks through (S-D3 → S-C5) → return visit logged → warmth improves (S-C4) → dashboard warmth distribution updates (F-G2). The founder can see, in real time, their Cold segment shrinking as subscribers respond. This intersection documents the full loop across three columns. On the diagram, draw a dashed curved arrow from S-C4 back to F-G2 labelled "Warmth score updated → dashboard refreshes."

---

### Intersection I-10 — Subscriber Unsubscribes → Founder Dashboard Updates

**From:** Node S-D3b (Unsubscribe)
**To:** Node F-G2 (Dashboard — Active State)
**Arrow label:** `Unsubscribe event → dashboard count decrements · warmth distribution updates`
**Direction:** Subscriber column → Founder column
**Note:** When a subscriber unsubscribes, three things update in the founder's dashboard immediately: the total signup count decrements by one, the unsubscribed subscriber's warmth state is removed from the warmth distribution panel, and the subscriber list row is flagged as "unsubscribed." The founder is not notified by email — they see the change reflected in the dashboard. This is a data integrity event, not just a UX event, and it must be documented as a cross-column intersection so the engineer knows the dashboard must listen for unsubscribe webhook events from Resend.

---

---

# PART FIVE — VERIFIED GAP CLOSURE CHECKLIST

_Verify every gap is closed before considering this flow complete._

| Gap    | Description                                            | Closed in node(s)               |
| ------ | ------------------------------------------------------ | ------------------------------- |
| Gap 1  | Homepage has no defined structure                      | F-A2 (5-section sales sequence) |
| Gap 2  | No returning founder path (Login → Dashboard)          | F-B1, F-B2                      |
| Gap 3a | Social meta tags missing from onboarding               | F-C3                            |
| Gap 3b | Email customisation tier-gating undefined              | F-C5, S-C1                      |
| Gap 4  | Onboarding success screen undersells peak moment       | F-C6                            |
| Gap 5  | Dashboard is one block (4 states needed)               | F-G1, F-G2, F-G3, F-G4          |
| Gap 6a | Upgrade modal missing emotional context                | F-F1 (trigger table), F-F2      |
| Gap 6b | "Powered by" upgrade path missing                      | F-C3, F-F1 (trigger 4)          |
| Gap 7  | Referred subscriber experience not differentiated      | S-B3a, S-B4a, S-B4b             |
| Gap 8  | Unsubscribe path missing                               | S-D3, S-D3b                     |
| Gap 9  | Launch day is a destination not a flow                 | F-G4, S-E1, S-E2, S-E3, S-E4    |
| Gap 10 | "Powered by" acquisition path undocumented             | F-A3, S-A1 (Path C)             |
| Gap 11 | Second waitlist creation path missing                  | F-D1, F-D2                      |
| Gap 12 | Founder updates feed posting loop incomplete           | F-E1, S-C5 (Intersection I-2)   |
| Gap 13 | Subscriber leaderboard not in subscriber flow          | S-B1 (public page)              |
| Gap 14 | "Powered by" footer visible during founder's own setup | F-C3 (page preview)             |

**Total: 14 gaps. All closed. 3 additional research findings applied post-verification (FR-12 deliverability, FR-13 thank-you page, FR-9+13 milestone rewards).**

---

---

# APPENDIX — NODE INDEX (Quick Reference)

| Node ID   | Name                                                | Flow         |
| --------- | --------------------------------------------------- | ------------ |
| F-A1      | Founder Entry Points                                | Founder      |
| F-A1a     | Decision: How Did Visitor Arrive?                   | Founder      |
| F-A2      | Marketing Homepage (Cold visitor)                   | Founder      |
| F-A3      | Marketing Homepage (Powered by visitor)             | Founder      |
| F-B1      | Signup / Login Screen                               | Founder      |
| F-B2      | Decision: New or Returning?                         | Founder      |
| F-C1      | Onboarding Step 1: Name Waitlist                    | Founder      |
| F-C2      | Onboarding Step 2: Choose Template                  | Founder      |
| F-C3      | Onboarding Step 3: Customise Page                   | Founder      |
| F-C4      | Onboarding Step 4: Qual Questions Decision          | Founder      |
| F-C4a     | Configure Qualification Questions                   | Founder      |
| F-C5      | Onboarding Step 5: Email Setup                      | Founder      |
| F-C6      | Waitlist Goes Live (Success Screen)                 | Founder      |
| F-D1      | Decision: Second Waitlist?                          | Founder      |
| F-D2      | Quick Create: Second Waitlist                       | Founder      |
| F-E1      | Founder Updates Feed — Post Update                  | Founder      |
| F-F1      | Upgrade Trigger Decision (7 triggers)               | Founder      |
| F-F2      | Upgrade Modal (context-sensitive)                   | Founder      |
| F-F3      | Paddle Checkout                                     | Founder      |
| F-G1      | Dashboard — Empty State                             | Founder      |
| F-G2      | Dashboard — Active State                            | Founder      |
| F-G3      | Dashboard — Warning State                           | Founder      |
| F-G4      | Dashboard — Pre-Launch State                        | Founder      |
| F-H1      | CSV Export                                          | Founder      |
| F-H2      | Archive Waitlist                                    | Founder      |
| F-H3      | Launch Day Terminal                                 | Founder      |
| S-A1      | Subscriber Entry Points                             | Subscriber   |
| S-B1      | Public Waitlist Page                                | Subscriber   |
| S-B2      | Decision: Qual Questions Enabled?                   | Subscriber   |
| S-B2a     | Qualification Questions (Subscriber View)           | Subscriber   |
| S-B3      | Submit & Duplicate Check                            | Subscriber   |
| S-B3-DUP  | Duplicate Email State (terminal)                    | Subscriber   |
| S-B3a     | Decision: Referred or Direct?                       | Subscriber   |
| S-B4a     | Thank-You Page (Direct Signup)                      | Subscriber   |
| S-B4b     | Thank-You Page (Referred Signup)                    | Subscriber   |
| S-C1      | Confirmation Email                                  | Subscriber   |
| S-C2      | Referral Loop: Subscriber Shares                    | Subscriber   |
| S-C3      | "You Moved Up" Email (to referrer)                  | Subscriber   |
| S-C4      | Warmth Tracking (Background System)                 | Subscriber   |
| S-C5      | Subscriber Return Visit                             | Subscriber   |
| S-D1      | Decision: Gone Cold?                                | Subscriber   |
| S-D2      | Warmth Re-engagement Email                          | Subscriber   |
| S-D3      | Decision: Subscriber Response                       | Subscriber   |
| S-D3a     | Remains Cold                                        | Subscriber   |
| S-D3b     | Unsubscribe                                         | Subscriber   |
| S-E1      | Launch Broadcast Email (received)                   | Subscriber   |
| S-E2      | Decision: Converts?                                 | Subscriber   |
| S-E3      | Subscriber Converts (Terminal)                      | Subscriber   |
| S-E4      | Does Not Convert (Terminal)                         | Subscriber   |
| I-1       | Waitlist Live → Public Page Exists                  | Intersection |
| I-2       | Founder Posts Update → Appears on Public Page       | Intersection |
| I-2b      | Subscriber Clicks Update Link → Return Visit Logged | Intersection |
| I-3       | Successful Signup → Founder Dashboard               | Intersection |
| I-4       | Qual Answers → Founder Dashboard                    | Intersection |
| I-5       | Warmth State → Founder Dashboard                    | Intersection |
| I-6       | Growth Tier: Automated Alert → Founder Email        | Intersection |
| I-6-EMAIL | Growth Tier Automated Alert Email (terminal)        | Intersection |
| I-7       | Founder Broadcast → Subscriber Email                | Intersection |
| I-8       | Referred Signup → Referrer Update                   | Intersection |
| I-9       | Re-engagement Response → Warmth → Dashboard         | Intersection |
| I-10      | Subscriber Unsubscribes → Dashboard Updates         | Intersection |

**Total nodes: 57 (including 12 intersection arrows/nodes)**

---

_Document version: 4.2 — Part Three fully audited and corrected. 5 intersection gaps fixed. 57 total nodes. All 14 product gaps closed. Verified against Problem Brief v3, User Profile v3.0, JTBD v3.0, Product Vision v3.0, Marketing Strategy v4.0, and Field Research Report v1. Ready to use as Excalidraw build guide._

# Product Requirements Document

**Product:** Pre-Launch Waitlist Tool ("PreWaitlist")
**Sprints:** 5 total — Sprint 1 (Foundation) ✅ Complete, Sprint 2 (Public Page & Dashboard) ✅ Complete, Sprint 3 (Email, Warmth & Billing), Sprint 3.1 (Dashboard Overhaul), Sprint 3.2 (Gap Fixes)
**Prepared by:** Abdul-Hakeem Hassan, with Claude
**Date:** July 2026 (v3 — multi-sprint scalable structure)
**Status:** Sprint 1 complete, Sprint 2 active
**Traces back to:** Problem Brief v2, User Profile v2, JTBD v2, Product Vision & MVP v4.2, Marketing Strategy v3.0, User Flow (diagram export), Design System v2.0, Onboarding Steps 1–3 Reference Guide, the finished Sprint 1 Figma files, and v1 of this PRD

---

## 0. How to use this document

This PRD is the single authoritative build spec for PreWaitlist. Where it disagrees with an older document, **this PRD wins.**

**Structure:** Each sprint has its own section (Sprint 1, Sprint 2, etc.) containing screens, requirements, and technical details specific to that sprint. Shared sections (Product Summary, Users, Standing Decisions, Technical Architecture, Data Model) apply across all sprints and are updated as the product evolves.

**Sprint 1 status:** Complete — all 14 screens implemented, 48/48 stories done across Epics 0–6.

**Sprint 2 status:** Active — public waitlist page, email capture, qualification questions, thank-you pages, leaderboard, dashboard restructure.

**Changed from v1 of this PRD:** Sections 7 (Technical Architecture) and 8 (Data Model) are now implementation-grade, not sketches — real column types, real constraints, real RLS policy SQL, a real route list, a real component tree. Section 12 is new: a researched standard for how epics and stories should be written and filed so an LLM coding agent can work from them without re-reading everything on every turn. Epic-0 and all of Epic-0's stories have been rewritten to follow that standard, filed separately from this PRD (see Section 12.5 for the file map).

---

## 1. Product Summary

A pre-launch waitlist tool for bootstrapped indie hackers, solo founders, and early-stage startup teams (US market). Differentiates on three things no competitor bundles at this price: **qualification** (who's serious), **warmth tracking** (who's going cold), and **referral quality** (which referrers actually matter) — free up to 500 signups, Pro at $15/mo.

**The one-sentence product position:**

> Every other tool tells you how many people signed up. This one tells you which of them will actually show up when you launch.

---

## 2. Sprint 1 — Foundation (Complete)

**Goal:** A founder can discover the product, create an account, complete onboarding in under 4 minutes, and arrive at a live (but empty) waitlist page with a shareable subdomain URL.

**Exit condition:** Founder signs up, completes onboarding in under 4 minutes, sees their live URL, and arrives at a dashboard with skeleton panels. The public page exists at their subdomain. No signups have arrived yet — that's Sprint 2.

**Status:** ✅ Complete — 48/48 stories across Epics 0–6 (2026-07-26 → 2026-08-12)

**Explicitly not in Sprint 1:** the public waitlist page as a live, signup-accepting surface (Sprint 2), warmth tracking, broadcast email sending, Paddle billing enforcement (env/account setup only), referral mechanics beyond the config UI, domain-verification backend logic (Section 6.11).

---

## 2a. Sprint 2 — Public Page & Dashboard (Active)

**Goal:** The public waitlist page is live and accepting signups. Founders can see their subscriber list, manage qualification questions, and track referral progress. Dashboard restructured with left sidebar navigation.

**Exit condition:** A visitor can sign up via the public waitlist page, answer qualification questions, receive a thank-you page with referral link, and see their position on a public leaderboard. Founders can view subscribers, export CSV, and see real-time stats on a restructured dashboard.

**Status:** ✅ Complete — 23 stories across Epics 7–9 (2026-08-13 → 2026-09-05)

**Screens in Scope (Sprint 2):**

| #   | Screen                        | Route                        | Description                                                 |
| --- | ----------------------------- | ---------------------------- | ----------------------------------------------------------- |
| 1   | Public waitlist page          | `/:subdomain`                | Email capture + qual questions + social proof               |
| 2   | Thank you — direct signup     | `/:subdomain/thank-you`      | Position, referral link, milestone threshold display        |
| 3   | Thank you — referred signup   | `/:subdomain/thank-you`      | Position, referrer attribution, milestone threshold display |
| 4   | Public leaderboard            | `/:subdomain/leaderboard`    | Ranked list, milestone display, anonymized emails           |
| 5   | Dashboard — empty state       | `/dashboard`                 | Left sidebar, stat cards, subscriber table (empty)          |
| 6   | Dashboard — active state      | `/dashboard`                 | Real subscriber data, CSV export, activity feed             |
| 7   | Dashboard — subscriber detail | `/dashboard/subscribers/:id` | Individual subscriber view, qual answers                    |

**Key Features:**

- **Email capture:** Email-only signup (Standing Decision 1), inline qualification questions (optional, pre-submit)
- **Referral system:** Unique referral links, position tracking, milestone threshold display
- **Public leaderboard:** Ranked by referral count, milestone display, anonymized emails
- **Dashboard restructure:** Left sidebar navigation (replaces top tabs), stat cards, subscriber table with search/filter
- **CSV export:** Subscriber data export for Pro tier
- **Founder updates:** Email-first delivery via Resend; on-page shows latest update card only

**Technical Scope:**

- **New tables:** `subscribers` (email, referral_code, referrer_id, position, qual_answers, warmth_score, milestones_earned, milestones_notified), `page_views`, `email_events`
- **New routes:** `/:subdomain`, `/:subdomain/thank-you`, `/:subdomain/leaderboard`, `/api/warmth/:subdomain`
- **Dashboard restructure:** Left sidebar layout, stat cards, subscriber table
- **Referral mechanics:** Unique codes, position tracking, milestone threshold display
- **Email integration:** Resend transactional emails (confirmation, moved-up notifications, milestone congratulations, founder updates)

**Explicitly not in Sprint 2:**

- Warmth scoring algorithm execution (schema + foundation built in Story 7.6, runtime scoring Sprint 3)
- Broadcast email sending (Sprint 3)
- Paddle billing enforcement (Sprint 3)
- Real SPF/DKIM verification (Sprint 3)
- Pro-tier subscriber limits enforcement (Sprint 3)
- Domain verification backend (Sprint 3)

---

## 2b. Sprint 3.1 — Dashboard Overhaul

**Goal:** The dashboard is redesigned from a bare functional shell into a complete command center. Empty states guide founders to action. Stat cards show insights, not just numbers. Tier gating is consistent. The sidebar navigation is clear and purposeful. Mobile works.

**Exit condition:** A new founder sees a welcoming empty state with clear next steps. An active founder sees stat cards with comparison deltas, a subscriber table that works on mobile, consistent locked/unlocked states across all features, and the founder updates compose UI.

**Status:** 🔲 Ready — not yet started

**Screens in Scope:**

| #   | Screen                                  | Route                 | Description                                            |
| --- | --------------------------------------- | --------------------- | ------------------------------------------------------ |
| 1   | Dashboard — redesigned empty state      | `/dashboard`          | Progress indicator, clear next steps, ghost stat cards |
| 2   | Dashboard — active state (redesigned)   | `/dashboard`          | Stat cards with deltas, activity feed, improved table  |
| 3   | Dashboard — updates compose             | `/dashboard/updates`  | New page: compose and publish founder updates          |
| 4   | Settings — billing section (functional) | `/dashboard/settings` | Paddle checkout wiring, billing management             |

**What Gets Built:**

- Sidebar redesign: grouped navigation (Command Center, Insights, Engagement, Config), "Coming soon" labels, tooltips for locked items
- Empty state redesign: progress indicator, copy guidance, welcome message
- Stat card upgrades: comparison deltas ("↑ 20% vs last week"), sparklines, connected warmth data
- Tier gating consistency: Warmth panel locked for Free, locked state on stat cards, tooltips everywhere
- Founder updates compose UI: new `/dashboard/updates` page, textarea + publish, calls existing `POST /api/updates`
- Mobile fix: subscriber table horizontal scroll, responsive stat cards
- Settings wiring: "Upgrade to Pro" → Paddle checkout, "Manage billing" → Paddle portal, error handling on save
- Design token compliance: replace hardcoded colors (sidebar bg, warning banner, chart axes, badges)
- Broadcast defaults: segment defaults to "all", confirmation dialog before send
- Duplicate API fix: share warmth data between WarningBanner and WarmthPanel
- Loading skeleton fix: sidebar width mismatch
- Bug fixes: `wshrink-0` typo, dead links, dropdown arrow removal

**Key Design Decisions (from competitor research):**

- KickoffLabs: "addition by subtraction" — dashboard redesign removed more than it added
- SaaSUI: "Comparison is the insight — the number alone is just a fact" — every stat card needs a delta
- Waitlister: 3 performance overview cards with comparison indicators (↑12% vs last week)
- Linear: anti-patterns forbidden (no gradients, no shadows, no rounded corners >8px)
- Flowjam: 4-6 step onboarding checklist, persistent, benefit-led language

**Explicitly not in Sprint 3.1:**

- Paddle billing integration (Sprint 3 — Epic 13)
- Advanced features (A/B testing, webhooks, Zapier)
- Subscriber table pagination/virtualization
- Real-time dashboard updates
- Public API documentation

---

## 2c. Sprint 3.2 — Gap Fixes (MVP Completeness)

**Goal:** Close the gaps between what's built and what a complete MVP product requires. Founders can archive waitlists, edit settings post-onboarding, and the product meets legal compliance requirements.

**Exit condition:** A founder can create, manage, edit, and archive their waitlist. Privacy Policy and Terms of Service pages exist. Consent is properly tracked. Every marketing email has an unsubscribe mechanism. Bounce handling works.

**Status:** 🔲 Ready — not yet started

**Screens in Scope:**

| #   | Screen                     | Route                 | Description                                 |
| --- | -------------------------- | --------------------- | ------------------------------------------- |
| 1   | Archive waitlist           | `/dashboard/settings` | Danger zone: archive (closes signups)       |
| 2   | Edit page after onboarding | `/dashboard/settings` | Change headline, template, brand color, CTA |
| 3   | Privacy Policy             | `/privacy`            | Legal page                                  |
| 4   | Terms of Service           | `/terms`              | Legal page                                  |

**What Gets Built:**

- Archive waitlist: API endpoint + dashboard button, marks waitlist as archived, closes signups
- Edit page after onboarding: settings section for headline, template, brand color, CTA text
- Privacy Policy page: data collected, processing, retention, user rights, sub-processor list
- Terms of Service page: auto-renewal disclosure, acceptable use, liability cap
- Consent records table: `consent_records` in Supabase with type, granted_at, withdrawn_at, ip, consent_text
- Consent checkbox on signup: separate from signup, logged with timestamp + IP
- Unsubscribe mechanism: List-Unsubscribe header (RFC 8058) + visible link in every broadcast
- Physical address in every email footer: CAN-SPAM requirement
- Bounce suppression list: `email_suppressions` table, hard bounces suppressed immediately
- DPAs with sub-processors: Data Processing Agreements with Resend, Supabase, Vercel, Paddle

**Legal Compliance Requirements:**

| Requirement           | Risk if missing                                 | Implementation                                |
| --------------------- | ----------------------------------------------- | --------------------------------------------- |
| Privacy Policy        | CCPA: $2,500-$7,500/violation, GDPR: €20M or 4% | `/privacy` page listing all sub-processors    |
| Terms of Service      | State AG enforcement, ROSCA penalties           | `/terms` with auto-renewal disclosure         |
| Consent checkbox      | GDPR: signing up ≠ marketing consent            | Separate checkbox, logged with timestamp + IP |
| Unsubscribe mechanism | CAN-SPAM: $46,517/email, Gmail blocking         | List-Unsubscribe header + visible link        |
| Physical address      | CAN-SPAM requirement                            | Footer in all emails                          |
| Bounce suppression    | Domain reputation destruction                   | `email_suppressions` table                    |
| DPAs                  | GDPR Article 28                                 | Agreements with all sub-processors            |

**Explicitly not in Sprint 3.2:**

- Paddle billing integration (Sprint 3 — Epic 13)
- Double opt-in (recommended but not legally required)
- Preference center (improves retention but not blocking)
- Advanced fraud detection
- CSV import
- Email nurture sequences

---

## 3. Users

- **[Founder]** — the only user type Sprint 1 screens are built for.
- **[Subscriber]** — does not exist yet in Sprint 1.

---

## 4. Screens in Scope (Sprint 1)

| #   | Screen                                     | Node ID     | Route                  | Status   |
| --- | ------------------------------------------ | ----------- | ---------------------- | -------- |
| 1   | Marketing homepage — cold visitor          | F-A2        | `/`                    | Designed |
| 2   | Marketing homepage — "Powered by" visitor  | F-A3        | `/` (conditional hero) | Designed |
| 3   | Account creation                           | F-B1        | `/signup`              | Designed |
| 4   | Sign in                                    | F-B1        | `/signin`              | Designed |
| 5   | Email verification                         | _(new)_     | `/verify-email`        | Designed |
| 6   | Onboarding Step 1 — Name your waitlist     | F-C1        | `/onboarding/1`        | Designed |
| 7   | Onboarding Step 2 — Choose template        | F-C2        | `/onboarding/2`        | Designed |
| 8   | Onboarding Step 3 — Make it yours          | F-C3        | `/onboarding/3`        | Designed |
| 9   | Onboarding Step 4 — Qualification decision | F-C4        | `/onboarding/4`        | Designed |
| 10  | Onboarding Step 4a — Configure questions   | F-C4a       | `/onboarding/4a`       | Designed |
| 11  | Onboarding Step 5 — Email setup (Free)     | F-C5 (Free) | `/onboarding/5`        | Designed |
| 12  | Onboarding Step 5 — Email setup (Pro)      | F-C5 (Pro)  | `/onboarding/5`        | Designed |
| 13  | Success screen                             | F-C6        | `/onboarding/success`  | Designed |
| 14  | Empty dashboard                            | F-G1        | `/dashboard`           | Designed |

All 14 screens are already high-fidelity in Figma. Sprint 1's job is to build them, not design them.

---

## 5. Standing Product Decisions (do not relitigate)

1. **Signup form is email-only.** No name field on the base subscriber signup form.
2. **Qualification questions are optional, inline, pre-submit.**
3. **Sharing anywhere in the product uses Web Share API + Copy Link at equal visual weight.**
4. **Marketing homepage shows Free and Pro pricing only.**
5. **Milestone rewards config defaults to OFF, no configuration UI visible until toggled.**
6. **Free-tier "powered by" disclosure is plain, non-alarming copy.**
7. **Design system v2.0 governs all UI:** warm ivory `#FAF8F4` background, pure white `#FFFFFF` reserved for elevated cards, deep jade `#0F7A5E` sole accent, Inter, 8px grid, three radii, no shadows except one floating-element token, no gradients except the success-screen checkmark.

---

## 6. Functional Requirements

_(Unchanged in substance from PRD v1 — repeated here at the level needed for build, with acceptance criteria now expressed in EARS notation per Section 12's standard, so each requirement is independently testable.)_

### 6.1 Marketing Homepage — Cold Visitor (F-A2)

**Route:** `/`

- REQ-6.1.1: The system shall render, on `/`, the header, hero, problem section, "The Difference" section, comparison section, feature grid, comparison callout, pricing (Free/Pro only), and footer, in that order.
- REQ-6.1.2: When a visitor clicks any "Build it free" CTA, the system shall navigate to `/signup`.
- REQ-6.1.3: When a visitor clicks "Sign in", the system shall navigate to `/signin`.
- REQ-6.1.4: When `/` is requested with a `ref` or any `utm_*` query parameter, the system shall persist those values (cookie or equivalent, 30-day expiry) so they can be attributed to an account created later in the same browser session.
- REQ-6.1.5: No Growth-tier pricing card shall render on this route. Growth tier is out of scope for MVP — only Free and Pro tiers exist.

### 6.2 Marketing Homepage — "Powered by" Visitor (F-A3)

- REQ-6.2.1: The homepage hero shall be a single conditional component, not a separate page, so the two variants cannot drift from each other.
- REQ-6.2.2: When the "Powered by" variant renders, all sections below the hero shall be identical to F-A2's sections.

### 6.3 Account Creation (F-B1)

**Route:** `/signup`

- REQ-6.3.1: The system shall offer both a Google OAuth button and an email/password form on this screen.
- REQ-6.3.2: When a visitor submits a valid email/password, the system shall create a Supabase Auth user, send a confirmation email, and redirect to `/verify-email`.
- REQ-6.3.3: When a visitor completes Google OAuth, the system shall skip `/verify-email` and redirect directly to `/onboarding/1`.
- REQ-6.3.4: When an account is created, if a `ref`/`utm_*` value was persisted per REQ-6.1.4, the system shall attach it to the new founder record.
- REQ-6.3.5: If a password under 8 characters is submitted, the system shall reject it with an inline error before calling Supabase Auth.

### 6.4 Sign In (F-B1, sign-in variant)

**Route:** `/signin`

- REQ-6.4.1: When sign-in succeeds and the founder already has a waitlist record, the system shall redirect to `/dashboard`.
- REQ-6.4.2: When sign-in succeeds and the founder has no waitlist record, the system shall redirect to `/onboarding/1`.

### 6.5 Email Verification (new)

**Route:** `/verify-email`

- REQ-6.5.1: The system shall block access to `/onboarding/*` and `/dashboard` until the founder's email is confirmed.
- REQ-6.5.2: When "Resend" is clicked, the system shall call Supabase's resend-confirmation endpoint, subject to Supabase's default rate limit, and shall show a cooldown state rather than a silent no-op.
- REQ-6.5.3: When the emailed confirmation link is followed, the system shall establish the session and redirect to `/onboarding/1`.

### 6.6 Onboarding Step 1 — Name Your Waitlist (F-C1)

**Route:** `/onboarding/1`

- REQ-6.6.1: While the founder types in the tagline field, the system shall derive a candidate subdomain slug and check its availability, debounced 300-500ms after the last keystroke.
- REQ-6.6.2: If a candidate slug matches a reserved word (api, www, app, admin, dashboard, onboarding, signin, signup, verify-email, or any existing top-level route), the system shall reject it as unavailable, identically to an already-taken slug.
- REQ-6.6.3: The system shall constrain accepted slugs to lowercase alphanumeric characters and hyphens, maximum 63 characters.
- REQ-6.6.4: When "I'll name it later" is chosen, the system shall assign a random unique fallback slug so the waitlist record always has a valid route.
- REQ-6.6.5: The live preview panel shall update from the Headline/Sub-headline fields with no perceptible lag (same debounce as REQ-6.6.1).

### 6.7 Onboarding Step 2 — Choose a Template (F-C2)

**Route:** `/onboarding/2`

- REQ-6.7.1: When a template card is selected, the system shall update the live preview immediately, with no separate "apply" action.
- REQ-6.7.2: The Desktop/Mobile toggle shall change only the preview viewport, never the saved template choice.
- REQ-6.7.3: The selected template shall be persisted on the waitlist record as one of minimal, bold, dark.

### 6.8 Onboarding Step 3 — Make It Yours (F-C3)

**Route:** `/onboarding/3`

- REQ-6.8.1: The Meta Preview panel shall update live from Headline/Sub-headline/brand-color and shall be persisted as the future og:title/og:description/og:image source data.
- REQ-6.8.2: While the milestone-rewards toggle is OFF, the system shall render no reward-tier configuration UI at all, not even collapsed.
- REQ-6.8.3: When the milestone-rewards toggle is switched ON, the system shall reveal 1-5 reward tiers (default: 4 tiers at 1, 5, 10, 25 referrals). Each tier has an editable referral threshold (positive integer) and an editable reward label (required). The founder can add tiers (up to 5) or remove tiers (minimum 1). The platform tracks which milestones each subscriber has reached (`milestones_earned` column), sends a congratulatory email when a threshold is reached, and shows a pending rewards dashboard. The founder handles actual reward delivery (discount codes, swag, access grants). For milestones where the reward label contains "skip the line", the platform shall also boost the subscriber's position to the front of the queue. The live preview shows a simulated subscriber view with position, progress toward milestones, and locked/unlocked states.
- REQ-6.8.4: The system shall accept logo uploads in PNG or SVG only, up to 2MB, stored in Supabase Storage.
- REQ-6.8.5: The brand-color field shall validate as a well-formed hex value before it can be saved; default value is #0F7A5E.
- REQ-6.8.6: The Meta Preview panel shall render as an OG-card mock (simulating how the waitlist URL appears when shared on social media / messaging apps). It shall contain: (a) a browser-chrome header with three dots matching the main live-preview panel style; (b) inside the card: the headline (bold), subheadline (grey), a mini email input field, and a mini "Join waitlist" button — a miniature version of the actual waitlist page; (c) below a divider line: the domain in small grey text (e.g. "acme.prewaitlist.com"), a bold line reading "[Headline] — Join the waitlist", and a grey description line repeating the subheadline text. This component represents the og:title / og:description / og:image source data and is not a generic content preview.

### 6.9 Onboarding Step 4 — Qualification Decision (F-C4)

**Route:** `/onboarding/4`

- REQ-6.9.1: The "No, keep it simple" card shall never describe the base signup form as "name + email" -- correct copy is "Just email. Add questions later from settings." per Standing Decision 1.
- REQ-6.9.2: When "Yes, add questions" is chosen, the system shall navigate to `/onboarding/4a`.
- REQ-6.9.3: When "No, keep it simple" is chosen, the system shall set qualification_enabled = false and navigate directly to `/onboarding/5`.

### 6.10 Onboarding Step 4a — Configure Qualification Questions (F-C4a)

**Route:** `/onboarding/4a`

- REQ-6.10.1: While the founder's tier is Free, the system shall enforce a hard cap of 2 questions and shall render the "Add new question" affordance as an upsell, not a functioning control, past that cap.
- REQ-6.10.2: The Pro cap shall be 5 questions -- read from the founder's tier field, not hardcoded per-screen. Growth tier is out of scope for MVP.
- REQ-6.10.3: The example question text "What are you currently using?" shall be used verbatim everywhere it appears in the product; no rephrased variant shall ship.
- REQ-6.10.4: Each question's live-preview rendering shall show "(optional)" in the design system's secondary text color.

### 6.11 Onboarding Step 5 — Email Setup (F-C5)

**Route:** `/onboarding/5`

- REQ-6.11.1: While the founder's tier is Free, the system shall render the confirmation-email fields as locked/greyed with a Pro badge, and shall render "Upgrade to Pro to customise" as the only actionable email-related control.
- REQ-6.11.2: While the founder's tier is Pro, the system shall render editable Sender name / Subject / Message body fields.
- REQ-6.11.3: **Scope boundary:** Custom domain authentication (SPF/DKIM) is deferred to v1.1 (see product vision line 95). The Pro-tier email customization UI covers sender name, subject, and message body only.
- REQ-6.11.4: When "Launch my waitlist" is clicked and no subdomain was ever finalized, the system shall auto-assign the REQ-6.6.4 fallback slug rather than blocking the action.

### 6.12 Success Screen (F-C6)

**Route:** `/onboarding/success`

- REQ-6.12.1: The Share button shall render only where navigator.share is supported; Copy Link shall always render, at equal visual weight, never as a fallback-only control.
- REQ-6.12.2: "Or, go to my dashboard" shall navigate to `/dashboard`.

### 6.12a "Powered by PreWaitlist" Footer — Onboarding Preview + Public Pages

- REQ-onboarding-preview.4: The "Powered by PreWaitlist" footer shall never appear on PreWaitlist's own marketing site or app pages under any circumstance — it is exclusive to founders' public waitlist pages (onboarding preview in Sprint 1, live page in Sprint 2) when tier = Free.
- REQ-onboarding-preview.5: The "Powered by PreWaitlist" footer shall render per the following visual spec. **Open TODO:** the Dark template's near-black background has no verified secondary-text color in the design system — Warm Grey #6B6459 likely fails contrast. Placeholder color is used on Dark template pending an actual token decision; do not treat the placeholder as final.
  - Structure: inline "Powered by [16px icon] PreWaitlist", not a pill or card.
  - Typography: Caption style (12px, Regular / 400 weight).
  - Color: "Powered by" in Warm Grey #6B6459. "PreWaitlist" + icon in Deep Jade #0F7A5E (same rule as every other link/active-state use of jade in the system).
  - Placement: centered, bottom of page, 24px vertical padding, 1px Border Subtle #E5E0D6 top divider on light templates (Minimal, Bold).
  - No drop shadow, no gradient, no background box.
  - Links to the F-A3 "powered by" homepage variant.
  - Renders across all onboarding steps that include the preview, and must not render at all when tier is Pro.
  - Shared component: `components/share/powered-by-footer.tsx`, reused by Sprint 2's real public page.

### 6.13 Empty Dashboard (F-G1)

**Route:** `/dashboard`

- REQ-6.13.1: All not-yet-populated stat values shall render as em-dashes or skeleton bars; the system shall never render a literal 0 in this state.
- REQ-6.13.2: When Share or Copy Link is used from this screen at least once, the getting-started checklist's first item shall auto-check.
- REQ-6.13.3: Subscribers/Broadcasts/Settings tabs may be visually present in the nav but shall not be functionally built in Sprint 1.

### 6.14 Founder Acquisition Source Capture

- REQ-6.14.1: The system shall capture and persist ref/utm_* values per REQ-6.1.4/6.3.4 with no dashboard/reporting UI in Sprint 1 -- store only, don't display yet.

### 6.15 Founder Updates — Email-First Delivery

- REQ-6.15.1: The system shall provide a compose/create action for founder updates. When a founder posts an update, the system shall dispatch an email to all subscribers of that waitlist via Resend, using the founder's product name as the sender.
- REQ-6.15.2: The `founder_updates` table shall include a `sent_at` column (nullable) set after email dispatch completes. If email dispatch fails, `sent_at` remains null.
- REQ-6.15.3: The on-page updates section shall display only the most recent update as a single "Latest update" card above the email capture form. If no updates exist, the card shall not render.
- REQ-6.15.4: The leaderboard page shall not display founder updates.

---

## 7. Technical Architecture

### 7.1 Stack

| Layer               | Use                                            | Why                                                                                                                                                                                                                                                                                                         |
| ------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend + backend  | **Next.js 16** (App Router, Turbopack default) | Next.js 14 (the original doc's choice) is two majors behind. Next.js 16 renamed middleware.ts to proxy.ts -- the exact file Sprint 1's subdomain routing depends on -- and made Turbopack the stable default bundler. Building on 14 conventions now means an immediate breaking migration before Sprint 2. |
| Database + auth     | **Supabase**, via @supabase/ssr                | @supabase/auth-helpers-nextjs is legacy. @supabase/ssr is current for cookie/session handling across Server Components, Server Actions, Route Handlers.                                                                                                                                                     |
| Transactional email | **Resend**                                     | Account/API key setup only this sprint.                                                                                                                                                                                                                                                                     |
| Payments            | **Paddle** (sandbox)                           | Env placeholders only this sprint.                                                                                                                                                                                                                                                                          |
| Deployment          | **Vercel**, wildcard domain from day one       | Step 1's live subdomain check and the Sprint 2 public page both depend on this being correct from the start.                                                                                                                                                                                                |
| Package manager     | **pnpm**                                       | Faster installs, disk-efficient -- reasonable default for a solo dev iterating quickly.                                                                                                                                                                                                                     |

### 7.1a Email Sending Architecture — Resend (decided July 2026, not yet reflected elsewhere in this PRD's original scope)

Resend offers two separate products with two separate billing models: a plain transactional send API (billed by email volume), and a contact-list/"Audiences" product for managing and broadcasting to a stored mailing list (billed by number of contacts stored).

**Decision: PreWaitlist shall never use Resend's Audiences/Marketing product, for any email type, including Pro-tier founder broadcasts.** Reasoning: Audiences is built for one company managing one list; PreWaitlist is one platform sending on behalf of hundreds of separate founders' subscriber lists. Using Audiences would mean creating and syncing a separate Resend-side list per founder and paying on a second, independent per-contact meter that grows unpredictably alongside the existing per-email meter.

- REQ-7.1a.1: All email sends -- subscriber confirmation, "moved up" notifications, and Pro-tier founder broadcasts alike -- shall be sent via Resend's plain transactional send/Batch Send API, addressed individually from subscriber records already stored in Supabase.
- REQ-7.1a.2: The system shall never create, sync to, or bill against a Resend Audience/contact-list object.
- REQ-7.1a.3: Free-tier founders' subscriber emails shall send from one shared PreWaitlist-owned domain. Pro-tier founders who complete domain verification (PRD REQ-6.11.2) shall each occupy one additional verified domain slot on the same Resend account -- note this, not just email volume, is what forces the first move off Resend's Free tier (which allows only 1 domain), and it happens to coincide with the founder becoming a paying customer.
- REQ-7.1a.4: Resend usage/billing alerts shall be configured once the product is live, so approaching the 100/day or 3,000/month Free-tier caps is visible before it's hit.

### 7.2 Subdomain Routing -- implementation detail

- proxy.ts at project root reads the host header, extracts the subdomain, and rewrites non-root/non-app requests to an internal dynamic segment, e.g. app/(public)/[subdomain]/...
- Matcher config excludes /api/_, /\_next/_, and static assets -- standard Next.js proxy matcher pattern.
- Reserved-slug validation (REQ-6.6.2) happens at slug-creation time in application code, **not** only in the proxy -- the proxy alone cannot prevent a reserved word from being stored, only from being served incorrectly after the fact.
- **Local dev:** subdomains do not resolve on localhost by default. Use lvh.me, which resolves any *.lvh.me to 127.0.0.1 with zero configuration -- acme.lvh.me:3000 reaches the local dev server directly. This must be documented once, in Epic-0, and not rediscovered mid-sprint.
- **Production:** add a wildcard domain (*.yourdomain.com) in Vercel project settings; Vercel provisions the wildcard cert automatically.
- Return a proper "waitlist not found" response for any subdomain with no matching record -- the routing skeleton should have this branch even though the public page itself is Sprint 2 scope.

### 7.3 Auth -- implementation detail

- @supabase/ssr: a server client (Server Components/Actions/Route Handlers) and a browser client (Client Components), per Supabase's documented split.
- proxy.ts refreshes the session cookie on every relevant request before any Server Component renders -- the standard updateSession() pattern from Supabase's SSR docs.
- Google OAuth: PKCE flow via Supabase Auth. Redirect URLs registered as wildcard patterns in Supabase Auth -> URL Configuration: http://acme.lvh.me:3000/** (local), https://_.yourdomain.com/\** and the bare production domain (prod), https://_-yourproject.vercel.app/** (previews).
- Google Cloud Console: OAuth 2.0 Client ID of type "Web application," authorized redirect URI https://<supabase-project-ref>.supabase.co/auth/v1/callback.
- Email/password confirmation is Supabase's built-in flow -- no custom email-sending logic needed for it. Resend is for the product's _own_ future transactional emails to subscribers (Sprint 2+), not for this.

### 7.4 Data Model -- implementation grade

```sql
-- founders extends auth.users via a 1:1 profile row (never modify auth.users directly)
create table public.founder_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free','pro','growth')),
  ref_param text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  acquisition_captured_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.waitlists (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founder_profiles(id) on delete cascade,
  name text,
  tagline text,
  subdomain text not null unique,
  template text not null default 'minimal' check (template in ('minimal','bold','dark')),
  headline text,
  subheadline text,
  cta_text text,
  logo_url text,
  brand_color text not null default '#0F7A5E',
  qualification_enabled boolean not null default false,
  milestone_rewards_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  constraint subdomain_format check (subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$')
);
create unique index waitlists_founder_id_idx on public.waitlists(founder_id); -- one waitlist per founder in Sprint 1

create table public.qualification_questions (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('multiple_choice','free_text')),
  sort_order smallint not null default 0
);

create table public.milestone_rewards (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  tier_referrals smallint not null check (tier_referrals > 0),
  reward_label text not null,
  unique (waitlist_id, tier_referrals)
);

create table public.founder_updates (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  body text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Sprint 2: subscribers table for public waitlist page
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  email text not null,
  referral_code text not null unique,
  referrer_id uuid references public.subscribers(id) on delete set null,
  position integer not null,
  qual_answers jsonb,
  warmth_score text check (warmth_score in ('hot', 'warm', 'cold')),
  milestones_earned jsonb,
  milestones_notified jsonb,
  created_at timestamptz not null default now(),
  constraint email_format check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Referral Quality Score (Epic 9, Story 9.6)
-- Formula: (subscribers this subscriber referred / total referrals across all subscribers) * 100
-- Display: percentage (0-100%) in subscriber table and top referrers panel
-- Purpose: transparent metric enabling founders to identify high-impact referrers
-- Scope: zero-referral subscribers show null (not 0%), null when total referrals = 0 (divide-by-zero guard)

-- Sprint 2: page views for warmth tracking
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

-- Sprint 2: email events for engagement tracking
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

create unique index subscribers_waitlist_email_idx on public.subscribers(waitlist_id, email);
create index subscribers_referral_code_idx on public.subscribers(referral_code);
```

**Row-Level Security -- enable on every table above, policy pattern:**

```sql
alter table public.waitlists enable row level security;

create policy "founders manage own waitlist"
  on public.waitlists for all
  using (founder_id = auth.uid())
  with check (founder_id = auth.uid());

-- child tables (qualification_questions, milestone_rewards, founder_updates) join through waitlists:
create policy "founders manage own waitlist's questions"
  on public.qualification_questions for all
  using (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()))
  with check (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()));

-- Sprint 2: subscribers table
alter table public.subscribers enable row level security;

create policy "founders manage own waitlist's subscribers"
  on public.subscribers for all
  using (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()))
  with check (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()));

-- Public read access for leaderboard (anon users can view subscribers for a waitlist)
create policy "public read access for leaderboard"
  on public.subscribers for select
  using (true);
```

Repeat the child-table pattern for milestone_rewards and founder_updates. This is Epic-0 Story 0.3 scope, not deferred.

### 7.5 Route / Handler List

#### Sprint 1 Routes (Complete)

| Route                                          | Type                                                         | Purpose                                                         |
| ---------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| /                                              | Page (RSC)                                                   | Marketing homepage, both hero variants                          |
| /signup, /signin, /verify-email                | Pages                                                        | Auth flow                                                       |
| /auth/callback                                 | Route Handler                                                | OAuth + email-confirmation callback, exchanges code for session |
| /onboarding/1 .. /onboarding/5, /onboarding/4a | Pages (Client Components for live-preview interactivity)     | Onboarding wizard                                               |
| /onboarding/success                            | Page                                                         | Success screen                                                  |
| /dashboard                                     | Page (RSC shell + client islands for interactive stat cards) | Empty dashboard                                                 |
| /api/waitlist/check-slug                       | Route Handler                                                | REQ-6.6.1 debounced availability check                          |
| /api/waitlist                                  | Route Handler (POST/PATCH)                                   | Create/update the waitlist record across onboarding steps       |

#### Sprint 2 Routes (Active)

| Route                       | Type                 | Purpose                                                                      |
| --------------------------- | -------------------- | ---------------------------------------------------------------------------- |
| /:subdomain                 | Page (RSC)           | Public waitlist page — email capture + qual questions + latest update card   |
| /:subdomain/thank-you       | Page                 | Post-signup thank you — position, referral link, milestone threshold display |
| /:subdomain/leaderboard     | Page (RSC)           | Public leaderboard — ranked list, milestone display                          |
| /dashboard                  | Page (restructured)  | Left sidebar layout, stat cards, subscriber table                            |
| /dashboard/subscribers/:id  | Page                 | Individual subscriber view, qual answers                                     |
| /api/subscribers            | Route Handler (POST) | Create subscriber (public signup)                                            |
| /api/subscribers/export     | Route Handler (GET)  | CSV export (Pro tier)                                                        |
| /api/leaderboard/:subdomain | Route Handler (GET)  | Leaderboard data for public page                                             |
| /api/updates                | Route Handler (POST) | Create founder update + dispatch email to subscribers                        |
| /api/warmth/:subdomain      | Route Handler (GET)  | Warmth distribution counts (hot/warm/cold/unscored)                          |

### 7.6 Component Tree (high level)

#### Sprint 1 Components (Complete)

```
app/
├── (marketing)/page.tsx              -> F-A2/F-A3 conditional hero
├── (auth)/signup/page.tsx
├── (auth)/signin/page.tsx
├── (auth)/verify-email/page.tsx
├── auth/callback/route.ts
├── onboarding/
│   ├── layout.tsx                    -> shared split-pane shell + live-preview frame
│   ├── 1/page.tsx  2/page.tsx  3/page.tsx  4/page.tsx  4a/page.tsx  5/page.tsx
│   └── success/page.tsx
├── dashboard/page.tsx
components/
├── ui/                               -> design-system primitives (Button, Card, Badge, etc.)
├── onboarding/live-preview.tsx        -> shared across steps 1-3 per Onboarding Ref Guide's "design once" note
└── share/share-copy-link.tsx          -> shared Web Share + Copy Link component (used on success screen + dashboard)
```

#### Sprint 2 Components (Active)

```
app/
├── (public)/[subdomain]/
│   ├── page.tsx                      -> public waitlist page — email capture + qual questions
│   ├── thank-you/page.tsx            -> post-signup thank you — position, referral link
│   └── leaderboard/page.tsx          -> public leaderboard — ranked list, milestones
├── dashboard/
│   ├── layout.tsx                    -> left sidebar layout (replaces top tabs)
│   ├── page.tsx                      -> stat cards + subscriber table
│   └── subscribers/[id]/page.tsx     -> individual subscriber view
components/
├── public/
│   ├── email-capture-form.tsx        -> email-only signup form + inline qual questions
│   ├── social-proof-counter.tsx      -> "X people ahead of you" display
│   ├── latest-update-card.tsx        -> single latest founder update card
│   ├── milestone-display.tsx         -> referral milestone threshold display
│   └── leaderboard-table.tsx         -> ranked subscriber list
├── dashboard/
│   ├── sidebar.tsx                   -> left sidebar navigation
│   ├── stat-cards.tsx                -> real-time stats (subscribers, referrals, position)
│   ├── subscriber-table.tsx          -> subscriber list with search/filter
│   └── csv-export-button.tsx         -> CSV export (Pro tier)
└── share/
    ├── referral-link.tsx             -> unique referral link display + copy
    └── share-buttons.tsx             -> Web Share + Copy Link (referral)
```

share-copy-link.tsx existing as one shared component, not reimplemented per screen, is what makes Standing Decision 3 actually enforceable in code rather than just in review.

---

## 8. Copy & Design Discipline

- **Hopkins:** every claim specific and sourced; no fabricated numbers; one primary action per screen; repeat working claims verbatim across screens rather than rewording.
- **Caples:** headlines lead with self-interest or news; specifics over generalities; check homepage/onboarding copy against a roughly 7th-grade reading level before shipping.
- **Design system v2.0** governs every visual decision (Section 5, item 7). A deviation is a bug, not a style choice.

---

## 9. Open Items & Resolutions

| Item                                                 | Status                                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Public leaderboard display for a nameless subscriber | Unresolved -- not a Sprint 1 problem, flag before Sprint 2 planning.               |
| F-C5 Sprint 1 vs. Sprint 3 boundary                  | Resolved: REQ-6.11.3.                                                              |
| "Just name + email" copy bug                         | Fixed in Figma; REQ-6.9.1 captures the corrected copy.                             |
| Email-verification screen undocumented elsewhere     | Built in Figma, specified here (Section 6.5); needs doc sync once syncing resumes. |
| Tech stack version (Next.js 14 -> 16)                | Resolved: Section 7.1.                                                             |

---

## 10. Definition of Done -- Sprint 1

- All 14 screens match Figma, including corrected copy (REQ-6.9.1).
- A founder goes from homepage to a live subdomain URL with an empty dashboard in under 4 minutes, no dead ends.
- Reserved-slug validation, RLS policies, and the wildcard subdomain routing skeleton are in place and tested.
- Every homepage claim traces to a source in the research docs.
- Design system tokens are shared components, not per-screen inline styles.
- No signup-accepting public page exists yet.

---

## 11. Non-Functional Requirements

- **Accessibility:** every text/background pairing meets or exceeds the contrast ratios already specified in Design System v2.0's color table (checked individually, not assumed). Interactive elements keyboard-navigable; form fields properly labeled for screen readers.
- **Performance:** Turbopack dev server; no explicit performance budget yet at Sprint 1 (marketing/onboarding traffic is low-volume by definition), but avoid obviously wasteful patterns (unnecessary client components, unbounded re-renders on the debounced fields).
- **Security:** RLS on every table (Section 7.4); no service-role key ever shipped to the client; slug/subdomain validation server-side, not just client-side (REQ-6.6.2/6.6.3 must be enforced in the Route Handler, not only in the form).
- **Responsiveness:** the marketing homepage and auth screens must work on mobile viewports -- Twitter/X-sourced traffic is expected to be predominantly mobile per the User Profile doc. Onboarding's split-pane layout may reasonably collapse to a stacked layout on narrow viewports; this wasn't specified in Figma and should be flagged back rather than improvised silently.

---

## 12. Epic & Story Template Standard

This section is new in v2 of this PRD. It defines how every epic and story from here forward (Epic-0 onward) must be written and filed -- researched specifically against how token-efficient, agent-legible specs are structured in current spec-driven-development practice (GitHub Spec Kit, BMad-Method, Kiro, and the "Evaluating AGENTS.md" research from ETH Zurich on what actually helps vs. hurts agent performance).

### 12.1 The problem this solves

A single giant PRD/epic file works fine for a human skimming it once. It works badly for an agent that has to reload it every session: the agent either re-reads the whole thing (burns tokens on parts irrelevant to the current task) or works from a stale partial memory of it (causes exactly the kind of doc-drift already seen once in this project's user-flow documents). The fix used across current spec-driven frameworks is consistent: **small, single-purpose files, loaded just-in-time, linked rather than duplicated, with machine-parseable state.**

### 12.2 File layout

```
docs/
├── PRD.md                                  <- this file -- the spec, rarely re-read in full
├── epics/
│   ├── epic-0-environment-setup.md         <- goal + story table + links only, no restated requirements
│   ├── epic-1-design-system-layout-shell.md
│   ├── epic-2-foundation-auth.md
│   ├── epic-3-marketing-homepage.md
│   ├── epic-4-onboarding-wizard.md
│   ├── epic-5-dashboard-store-features.md
│   ├── epic-6-post-sprint-1-issues.md
│   └── epic-7-public-page-dashboard.md    <- Sprint 2 epic
└── stories/
    ├── epic0.story01-toolchain.md
    ├── epic0.story02-nextjs-init.md
    └── ... one file per story
```

An epic file is a short index, not a container. A story file is the only thing an agent should need to load to do one unit of work.

### 12.3 Story file structure (fixed section order)

Every story file uses this exact shape, in this order, so both the agent and Keem always know where to look without re-reading the whole file to find something:

    ---
    id: epic0.story01
    epic: epic-0-environment-setup
    title: Toolchain verification
    status: ready        # draft | ready | in-progress | blocked | review | done
    depends_on: []
    updated: 2026-07-25
    ---

    ## Source
    [PRD S7.1](../PRD.md#71-stack)
    <!-- Cite the source section, don't restate its content. This is the single biggest
         token-efficiency and drift-prevention move available: the requirement lives in
         exactly one place. -->

    ## Story
    As the founder, I want a verified local toolchain, so that every later story
    starts from a known-working baseline instead of debugging environment issues mid-feature.

    ## Acceptance Criteria
    <!-- EARS notation: constrained sentence patterns, each independently testable,
         each mapped to exactly one task below. Developed at Rolls-Royce for
         safety-critical requirements specifically because unconstrained prose
         requirements are ambiguous, untestable, and expensive to verify -- the
         same failure modes that make an agent guess instead of build correctly. -->
    - AC1: The system shall report the installed Node.js version when `node -v` is run.
    - AC2: The system shall report the installed pnpm version when `pnpm -v` is run.
    - AC3: When `git status` is run in the project root, the system shall report a clean
      initialized repository with .env*, node_modules, and .next ignored.

    ## Tasks
    - [ ] T1 (AC1, AC2): Install Node LTS + pnpm, verify versions.
    - [ ] T2 (AC3): git init, write .gitignore, first commit.

    ## Out of Scope
    - Installing project dependencies (that's Story 0.2).

    ## Dev Notes
    <!-- Left empty until the agent executes this story. The agent appends here, not
         into the sections above -- this is the ONLY section that changes after the
         story is written, which is what makes diffs on this file cheap to review. -->

### 12.4 Why each piece is there, briefly

- **YAML frontmatter with a status enum:** lets the agent (or Keem) check a story's state by reading four lines, not the whole file. Once a story is blocked, that state is permanent until manually cleared -- don't let an agent silently retry a blocked story next session.
- **Source links instead of restated requirements:** the single fix for the doc-drift problem this project already ran into once with the user-flow documents. One fact, one place.
- **EARS-notation acceptance criteria:** each AC is a testable pass/fail statement, not a paragraph the agent has to interpret. This is the same reasoning Kiro (Amazon's spec-driven IDE) and several EARS-integration proposals in GitHub's own Spec Kit are built around.
- **Task-to-AC mapping (T1 (AC1, AC2)):** prevents an agent from declaring a story "done" without having addressed every criterion, and prevents scope creep past what the ACs actually asked for.
- **Out of Scope as an explicit section:** a cheap, high-value line that stops an eager agent from doing "helpful" extra work that belongs to a later story.
- **Dev Notes as the only mutable section:** keeps the diff on a completed story small and reviewable -- you're checking one appended section, not the whole file for accidental edits elsewhere.

### 12.5 What this means for AGENTS.md specifically

Research directly on this (not just convention) found that **auto-generated AGENTS.md files reduce agent task success by roughly 3% and increase inference cost over 20%**, mainly from duplicating content already available elsewhere in the repo -- while short, human-written files with genuinely non-obvious information measurably help. Practical implications adopted here:

- Keep root AGENTS.md under 150 lines. It is a separate file from this PRD (see the companion AGENTS.md file) -- this PRD is detail, AGENTS.md is the lean always-loaded layer.
- Structure it as **Commands** (exact executable commands), **Boundaries** in three tiers -- Always do / Ask first / Never do -- **Project Structure** (a flat map, not prose), and pointers into docs/ for anything requiring more depth.
- Never let AGENTS.md restate what's already in package.json, this PRD, or the story files it links to.

### 12.6 On TOON / token-optimized data formats

For structured, tabular content embedded inside a story or epic file (a schema block, a config table), Token-Oriented Object Notation (TOON) is worth knowing about -- a lossless JSON alternative that drops quote marks, braces, and repeated keys, measurably reducing token count for that specific kind of content. This PRD keeps its own tables in plain Markdown for Keem's own readability (he is the primary reader of this file, the agent is the primary reader of the story files), but a story file's data blocks are a reasonable place to use TOON if a schema needs to be embedded rather than linked. Not mandated -- a judgment call per file, not a blanket rule.

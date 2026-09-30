# Sprint Gap Analysis — Full Product Audit

**Date:** 2026-09-13
**Methodology:** Web research (KickoffLabs, Viral Loops, Prefinery, SparkLoop, LaunchList, Waitlister, GrowSurf), PRD cross-reference, user-flow doc (57 nodes) audit, current codebase scan.

---

## MoSCoW Prioritization

### MUST HAVE — MVP cannot ship without these

#### Legal/Compliance (Non-negotiable)

| #   | Item                             | Risk if missing                                          | Implementation notes                                                                                            |
| --- | -------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| M1  | Privacy Policy page (`/privacy`) | CCPA: $2,500-$7,500/violation. GDPR: €20M or 4% turnover | Must list all sub-processors (Supabase, Resend, Paddle, Vercel), data collected, retention periods, user rights |
| M2  | Terms of Service page (`/terms`) | State AG enforcement, ROSCA penalties                    | Must include auto-renewal disclosure, acceptable use, liability cap, governing law                              |
| M3  | Consent checkbox on signup       | GDPR: signing up ≠ marketing consent                     | Separate checkbox, logged with timestamp + IP + exact wording shown                                             |
| M4  | Consent records table            | GDPR audit trail                                         | `consent_records` in Supabase: type, granted_at, withdrawn_at, ip, consent_text                                 |
| M5  | Unsubscribe mechanism            | CAN-SPAM: $46,517/email. Gmail/Yahoo: domain blocking    | List-Unsubscribe header (RFC 8058) + visible link in body. POST endpoint for one-click                          |
| M6  | Physical address in every email  | CAN-SPAM requirement                                     | Footer in all transactional + marketing emails                                                                  |
| M7  | Bounce suppression list          | Domain reputation destruction                            | `email_suppressions` table. Hard bounces suppressed immediately, never re-email                                 |
| M8  | DPAs with sub-processors         | GDPR Article 28                                          | Data Processing Agreements with Resend, Supabase, Vercel, Paddle                                                |

#### Product Gaps (Founders will churn without these)

| #   | Item                       | Why must-have                                             | Implementation notes                                                              |
| --- | -------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| M9  | Founder updates compose UI | Infrastructure exists, no UI to create updates            | Dashboard page with textarea, `POST /api/updates` already exists                  |
| M10 | Archive/close waitlist     | Founders have no way to stop signups or signal "I'm live" | API endpoint + dashboard button, marks waitlist as archived                       |
| M11 | Edit page after onboarding | No way to change settings post-onboarding                 | Settings page or dedicated edit route for headline, template, brand color, CTA    |
| M12 | Paddle dunning flow        | 20-40% SaaS churn is involuntary (expired cards)          | Handle `subscription.past_due` webhook, show warning, enable "Update Payment" CTA |
| M13 | Settings danger zone       | GDPR right to erasure requires deletion                   | Delete account + delete waitlist with typed confirmation                          |

---

### SHOULD HAVE — Competitive parity, founders expect these

| #   | Item                     | What competitors have                          | Effort |
| --- | ------------------------ | ---------------------------------------------- | ------ |
| S1  | Webhook support          | Real-time event delivery to founder's tools    | Medium |
| S2  | Zapier integration       | Native connection — signups → any tool         | Medium |
| S3  | CSV import               | Import existing subscriber lists               | Low    |
| S4  | Double opt-in            | GDPR-compliant email verification              | Low    |
| S5  | Preference center        | Per-category email opt-out                     | Medium |
| S6  | Advanced fraud detection | Device fingerprinting, 140+ disposable domains | Medium |
| S7  | Email nurture sequences  | Automated drip beyond confirmation             | High   |
| S8  | Embed widget             | One-line code for any website                  | Medium |
| S9  | Public API documentation | REST API with docs                             | Medium |
| S10 | Broadcast scheduling     | Pre-schedule emails for specific date/time     | Low    |

---

### COULD HAVE — Nice-to-have, improves conversion/engagement

| #   | Item                                  | Value                                                   |
| --- | ------------------------------------- | ------------------------------------------------------- |
| C1  | A/B testing                           | Optimize waitlist page conversion                       |
| C2  | Position inflation                    | Social proof for new waitlists (show #42 instead of #1) |
| C3  | Countdown timer                       | Urgency on public page before launch                    |
| C4  | More templates (5+)                   | More founder choice                                     |
| C5  | Geo/browser analytics                 | Know where subscribers come from                        |
| C6  | Social actions (Twitter follow, etc.) | More viral channels beyond referral                     |
| C7  | Referral graph export                 | Full chain visualization                                |
| C8  | Real-time signup feed                 | Live activity stream in dashboard                       |
| C9  | Subscriber tags/labels                | Organize by source, behavior                            |
| C10 | Email deliverability dashboard        | Bounce rate, complaint rate, domain health              |

---

### OUT OF SCOPE — Do not build for MVP

| #   | Item                              | Reason                                      |
| --- | --------------------------------- | ------------------------------------------- |
| O1  | Multi-waitlist                    | Sprint 4 scope (standing decision)          |
| O2  | Growth tier features              | Standing decision: Growth tier out of scope |
| O3  | Multilingual/i18n                 | English only — add post-MVP                 |
| O4  | SMS verification                  | Email-only is acceptable                    |
| O5  | Agency/multi-client accounts      | Not target market                           |
| O6  | Done-for-you campaigns            | Not our model                               |
| O7  | Revenue tracking via Stripe       | Not e-commerce focused                      |
| O8  | Partner/ambassador programs       | Pre-launch focused                          |
| O9  | Full white-label                  | Pro tier already removes Powered-by         |
| O10 | Embed on multiple pages           | Add later                                   |
| O11 | Application mode (approve/reject) | Not in scope                                |
| O12 | Geo-targeted content              | Not in scope                                |
| O13 | Coupon code distribution          | E-commerce feature                          |
| O14 | Contest/giveaway mechanics        | Not our model                               |
| O15 | AI page builder                   | Not our model                               |

---

## Competitive Advantage — What PreWaitlist Already Wins On

| Advantage                      | Details                                                 | Competitors who have it              |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------ |
| Warmth tracking                | Hot/Warm/Cold email engagement scoring                  | **Nobody else has this**             |
| Post-launch dashboard          | Full subscriber management, charts, qualification panel | Most competitors are pre-launch only |
| Milestone rewards              | Editable threshold rewards                              | SparkLoop, Prefinery                 |
| Founder updates                | Publish updates to public waitlist page                 | Unique — but no compose UI yet       |
| 3 high-fidelity templates      | Minimal, Bold, Dark with live preview                   | KickoffLabs, Viral Loops             |
| Free tier                      | Real free plan (not a trial)                            | Waitlister, LaunchList               |
| Flat $15/mo pricing            | Unlimited subscribers                                   | Undercuts all competitors            |
| Auto subdomain routing         | Zero setup `*.prewaitlist.com`                          | Unique                               |
| Qualification questions        | Dynamic question builder in onboarding                  | Waitlister, LaunchList               |
| CSV export                     | Already built                                           | All competitors                      |
| Warmth-segmented broadcast     | Segment by engagement level                             | Unique — nobody else does this       |
| Confirmation + moved-up emails | Transactional email infrastructure                      | All competitors                      |

---

## Dashboard Issues Identified (from screenshot + code review)

### Visual/UX Issues

1. **Sidebar navigation greyed out without lock icons** — Qualification, Leaderboard, Updates appear broken, not locked. Only Warmth and Broadcast show lock icons. Inconsistent.
2. **"Get your first signups" checklist is onboarding content** — Belongs in success screen, not dashboard. Takes up prime real estate.
3. **"Preview — this is what it'll look like once signups arrive"** — Contradictory: dashboard has real data (2 signups) but calls it a preview. Should be removed when data exists.
4. **Product dropdown arrow** — Suggests multi-waitlist switching, which doesn't exist. Misleading.
5. **"Upgrade to pro" placement** — Bottom-left, outline style, easy to miss. Should be contextual.
6. **Sidebar icon inconsistency** — Different icon styles across items.
7. **"About" text truncated** at bottom — Unclear purpose.
8. **Empty state guidance is weak** — "Share your link" is the only advice. No copy suggestions, no recommended communities, no expected timeline.

### Functional/Architectural Issues (to be investigated)

- Data flow from API routes to dashboard components
- State management patterns
- Missing features that should exist (updates composer, settings edit, archive)
- Tier-gating UI consistency
- Real-time data updates
- Error handling and loading states

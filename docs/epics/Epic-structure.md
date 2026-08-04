# Sprint 1 — Epic Structure

**Last updated:** 2026-07-29
**Source:** [PRD-Sprint-1.md](../PRD-Sprint-1.md), [Product Vision MVP](../product-vision-mvp-waitlist-tool.md)

---

## Overview

Sprint 1 delivers the complete founder experience: from discovering PreWaitlist on the marketing homepage, through signup and onboarding, to a functional empty dashboard. The work is divided into **6 epics** (0–5) with clear dependency chains and defined exit criteria.

The structure was reorganised from the original plan (which had marketing homepage absent and onboarding + dashboard combined into a single overloaded Epic 3) into a cleaner separation where each epic maps to a distinct product surface.

---

## Epic Table

| Epic  | Name                         | Status   | Stories | PRD Screens                                                   | Key REQs                                    |
| ----- | ---------------------------- | -------- | ------- | ------------------------------------------------------------- | ------------------------------------------- |
| **0** | Environment Setup            | ✅ done  | 11      | —                                                             | 7.1–7.6 (infra, schema, auth, deploy)       |
| **1** | Design System & Layout Shell | ✅ done  | 6       | —                                                             | Design tokens, UI primitives, layout shells |
| **2** | Foundation & Auth            | ✅ done  | 5       | Signup, Signin, Verify-email, Forgot/Reset-password           | 6.3–6.5, 7.3–7.4                            |
| **3** | Marketing Homepage           | 🔵 ready | 6       | Homepage (HF1), "Powered by" variant (HF2)                    | 6.1–6.2                                     |
| **4** | Onboarding Wizard            | 🔵 ready | 8       | Onboarding Steps 1–5 + Success Screen                         | 6.6–6.12, onboarding-preview.4–.5           |
| **5** | Dashboard + Store Features   | 🔵 ready | 3       | Empty Dashboard, founder updates compose, acquisition capture | 6.13–6.15                                   |

**Total stories:** ~41 (11 + 6 + 5 + 6 + 8 + 3)

---

## Dependency Graph

```
Epic 0 (Environment)
    │
    ▼
Epic 1 (Design System)
    │
    ▼
Epic 2 (Auth)
    │
    ├──────────────┬──────────────┐
    ▼              ▼              ▼
Epic 3          Epic 4          Epic 5
(Marketing)     (Onboarding)    (Dashboard)
```

- **Epic 3** (Marketing Homepage) depends on Epic 1 (layout shell, tokens). It has no dependency on Epic 2 (auth) — a visitor can view the homepage without being signed in.
- **Epic 4** (Onboarding Wizard) depends on Epic 2 (auth) — founders must be authenticated to reach onboarding.
- **Epic 5** (Dashboard) depends on Epic 2 (auth) and logically follows Epic 4 — the dashboard is where founders land after completing onboarding.

Epic 3, 4, and 5 are **parallelisable** once their respective dependencies are met. In practice, Epic 3 can start as soon as Epic 1 is done (it already is). Epic 4 and 5 can start as soon as Epic 2 is done (it already is).

---

## PRD Screen Mapping

The PRD defines 14 screens (Section 4). Here's how they map to epics:

| PRD # | Screen                                     | Route                 | Epic | Story   |
| ----- | ------------------------------------------ | --------------------- | ---- | ------- |
| 1     | Marketing homepage (cold visitor)          | `/`                   | 3    | 3.1–3.5 |
| 2     | Marketing homepage ("Powered by" variant)  | `/`                   | 3    | 3.1     |
| 3     | Signup                                     | `/signup`             | 2    | 2.2     |
| 4     | Signin                                     | `/signin`             | 2    | 2.2     |
| 5     | Email verification                         | `/verify-email`       | 2    | 2.4     |
| 6     | Onboarding Step 1 — Name your waitlist     | `/onboarding/1`       | 4    | 4.1     |
| 7     | Onboarding Step 2 — Choose template        | `/onboarding/2`       | 4    | 4.2     |
| 8     | Onboarding Step 3 — Make it yours          | `/onboarding/3`       | 4    | 4.3     |
| 9     | Onboarding Step 4 — Qualification decision | `/onboarding/4`       | 4    | 4.4     |
| 10    | Onboarding Step 4a — Configure questions   | `/onboarding/4a`      | 4    | 4.5     |
| 11    | Onboarding Step 5 — Email setup (Free)     | `/onboarding/5`       | 4    | 4.6     |
| 12    | Onboarding Step 5 — Email setup (Pro)      | `/onboarding/5`       | 4    | 4.6     |
| 13    | Success screen                             | `/onboarding/success` | 4    | 4.7     |
| 14    | Empty dashboard                            | `/dashboard`          | 5    | 5.1     |

Additionally, two features exist in the PRD but were not covered by any original epic:

| REQ  | Feature                             | Sprint 1 Scope                      | Epic |
| ---- | ----------------------------------- | ----------------------------------- | ---- |
| 6.14 | Founder Acquisition Source Capture  | Store only, no UI                   | 5    |
| 6.15 | Founder Updates Feed — Posting Only | Compose action only, no public read | 5    |

---

## Detailed Breakdown

### Epic 0 — Environment Setup ✅

**Goal:** A fully working local + deployed environment, scaffolded correctly, before any feature story begins.

**What was built:**

- Node.js LTS + pnpm + git verified
- Next.js 16 project initialised with App Router, Turbopack, TypeScript
- Supabase project with schema DDL, RLS, auth (email + Google OAuth)
- Resend account configured (API key only, no sending in Sprint 1)
- Paddle sandbox configured (env placeholders only)
- Vercel project with wildcard domain (`*.prewaitlist.com`) + proxy.ts routing
- Design System v2.0 tokens in `globals.css` (292 lines: colors, typography, spacing, radii, shadows, motion)
- `AGENTS.md` + `.memory/MEMORY.md` seeded
- ESLint + Prettier + pre-commit hooks
- memsearch installed (blocked on Milvus Lite / Docker for Windows)

**Stories:** 0.1–0.11 (11 stories, all done except 0.7 memsearch blocked)

---

### Epic 1 — Design System & Layout Shell ✅

**Goal:** Build the foundational UI primitives, shared layout shells, and the share-copy-link component that every Sprint 1 screen depends on.

**What was built:**

- `cn()` utility (`components/lib/cn.ts`)
- Button, Card, Input, Badge components with full token integration
- Toggle, Select, Textarea components
- Onboarding layout shell (split-pane, progress dots, back nav)
- Marketing layout shell (header + footer via `(marketing)/layout.tsx`)
- Share-copy-link component (`components/share/share-copy-link.tsx`)
- Live-preview component (`components/onboarding/live-preview.tsx`)
- Powered-by-footer component (`components/share/powered-by-footer.tsx`)

**Stories:** 1.0–1.6 (6 stories, all done)

---

### Epic 2 — Foundation & Auth ✅

**Goal:** Implement auth foundation so founders can create accounts, sign in, verify emails, and reach onboarding.

**What was built:**

- Supabase schema DDL + RLS (5 tables: `founder_profiles`, `waitlists`, `qualification_questions`, `milestone_rewards`, `founder_updates`)
- Auth page UIs (signup, signin, verify-email) matching SVG specs
- Auth flow logic (signup, signin, OAuth, callback, password reset)
- Email verification gate + resend with 60s cooldown
- Proxy auth guard + session refresh
- Forgot-password + reset-password pages
- Auth UX best practices (password strength meter, autocomplete, terms link, rate limiting, generic errors, loading spinners)
- Typography tokens enforced across all auth pages
- Logo resized to 160x52, wrapped in Link to `/`

**Stories:** 2.1–2.5 (5 stories, all done)

---

### Epic 3 — Marketing Homepage 🔵

**Goal:** Build the marketing homepage — the first thing visitors see — matching the high-fidelity spec (`HF1-Marketing Homepage.svg`, 4,985px tall).

**Why it's separate:** The original plan had no epic for the marketing homepage. `src/app/(marketing)/page.tsx` is still the default Next.js template. The HF1 SVG has 7+ distinct sections that are substantial enough to warrant their own epic.

**Design reference:** `docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg`

**Planned stories (6):**

| Story | Section                                           | PRD REQs                 |
| ----- | ------------------------------------------------- | ------------------------ |
| 3.0   | Acquisition capture API + cookie persistence      | 6.1.4, 6.3.4             |
| 3.1   | Hero + header (conditional "Powered by" variant)  | 6.1.1–6.1.3, 6.2.1–6.2.2 |
| 3.2   | Problem section + "The Difference" section        | 6.1.1                    |
| 3.3   | Comparison grid + feature details                 | 6.1.1                    |
| 3.4   | Pricing section (Free + Pro only, no Growth card) | 6.1.5                    |
| 3.5   | Responsive polish + footer integration            | 6.1.1                    |

**Key constraints:**

- Growth-tier pricing card must never render on this route (REQ-6.1.5)
- "Powered by" variant is a conditional hero component, not a separate page (REQ-6.2.1)
- All copy has been through review — never write or rephrase user-facing text
- `ref`/`utm_*` values persisted via cookie (30-day expiry) for attribution (REQ-6.1.4)

**File:** `docs/epics/epic-3-marketing-homepage.md`

**Status:** Not started — `src/app/(marketing)/page.tsx` is default Next.js template.

---

### Epic 4 — Onboarding Wizard 🔵

**Goal:** Implement the full onboarding wizard (Steps 1–5 + Success) so a founder who has signed up can configure their waitlist, launch it, and see their live URL.

**Why it's numbered 4 (not 3):** Renumbered to follow Epic 3 (Marketing Homepage) in the user journey: discover → sign up → onboard → dashboard.

**Design references:** `HF 4 onboard step 1.svg`, `HF 5 onboard step 2 *.svg`, `HF 6 onboard step 3-5.svg`, `Onboard Success Page Founder.svg`

**Planned stories (8):**

| Story | Step                                              | PRD REQs              |
| ----- | ------------------------------------------------- | --------------------- |
| 4.0   | API routes + shared form context + preview wiring | 6.6–6.12 (data layer) |
| 4.1   | Step 1 — Name Your Waitlist                       | 6.6.1–6.6.5           |
| 4.2   | Step 2 — Choose a Template                        | 6.7.1–6.7.3           |
| 4.3   | Step 3 — Make It Yours (branding, logo, rewards)  | 6.8.1–6.8.5           |
| 4.4   | Step 4 — Qualification Decision                   | 6.9.1–6.9.3           |
| 4.5   | Step 4a — Configure Qualification Questions       | 6.10.1–6.10.4         |
| 4.6   | Step 5 — Email Setup + Launch                     | 6.11.1–6.11.4         |
| 4.7   | Success Screen                                    | 6.12.1–6.12.2         |

**Key constraints:**

- Live preview must update with no perceptible lag (REQ-6.6.5)
- "I'll name it later" assigns random fallback slug (REQ-6.6.4)
- Free tier: 2 qualification questions max, email fields locked (REQ-6.10.1, 6.11.1)
- Pro tier: 5 questions, editable email fields, SPF/DKIM panel UI only (REQ-6.11.3 — backend is Sprint 3)
- "Powered by PreWaitlist" footer renders in preview when tier = Free (REQ-onboarding-preview.4–.5)
- Sticky mobile CTA, progress dots completed state, WCAG 2.5.8 touch targets (stress test recommendations)

**File:** `docs/epics/epic-4-onboarding-wizard.md`

**Status:** Not started — all step pages are bare placeholders.

---

### Epic 5 — Dashboard + Store Features 🔵

**Goal:** Build the empty dashboard landing, the founder updates compose action, and the acquisition source capture — completing Sprint 1's exit condition.

**Why it exists:** The original Epic 3 combined onboarding + dashboard + store-only features into one overloaded epic. Splitting dashboard + store features into their own epic gives cleaner scope boundaries and allows parallel work.

**Planned stories (3):**

| Story | Feature                                                                           | PRD REQs      |
| ----- | --------------------------------------------------------------------------------- | ------------- |
| 5.1   | Empty Dashboard (stat cards, skeleton state, getting-started checklist, nav tabs) | 6.13.1–6.13.3 |
| 5.2   | Founder Acquisition Source Capture (store `ref`/`utm_*` on signup)                | 6.14.1        |
| 5.3   | Founder Updates Feed — Compose Only (write path, no public read)                  | 6.15.1        |

**Key constraints:**

- Stat values render as em-dashes or skeleton bars, never literal 0 (REQ-6.13.1)
- Subscribers/Broadcasts/Settings tabs visually present but not functional (REQ-6.13.3)
- Acquisition capture stores only, no dashboard/reporting UI in Sprint 1 (REQ-6.14.1)
- Founder updates: compose/create action only, no public read surface until Sprint 2 (REQ-6.15.1)

**File:** `docs/epics/epic-5-dashboard-store-features.md`

**Status:** Not started — `src/app/dashboard/page.tsx` is a bare placeholder.

---

## Sprint 1 Exit Condition

From the PRD (Section 3):

> "A founder signs up, completes onboarding in under 4 minutes, sees their live URL, and arrives at a dashboard with skeleton panels."

**What must be true:**

1. Marketing homepage is built and drives signups (Epic 3)
2. Auth flow works end-to-end: email/password + Google OAuth (Epic 2 ✅)
3. Onboarding wizard completes all 5 steps + success screen (Epic 4)
4. Empty dashboard shows stat skeletons + getting-started checklist (Epic 5)
5. Subdomain routing works: `{slug}.prewaitlist.com` resolves (Epic 0 ✅)
6. RLS enforced on all tables (Epic 0 ✅)
7. Design system tokens used consistently (Epic 1 ✅)

---

## What Changed from the Original Plan

| Original                                             | Restructured                                                    | Why                                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| No marketing homepage epic                           | Epic 3 (Marketing Homepage)                                     | `HF1-Marketing Homepage.svg` is 4,985px with 7+ sections; `page.tsx` is default template |
| Epic 3 = Onboarding + Dashboard (9 stories, ~70 ACs) | Epic 4 (Onboarding, 8 stories) + Epic 5 (Dashboard, ~4 stories) | Overloaded epic; cleaner separation of concerns                                          |
| No coverage of REQ-6.14, REQ-6.15                    | Epic 5 includes store-only features                             | Orphaned PRD requirements with no epic                                                   |
| Stories numbered 3.0–3.8                             | Stories renumbered per epic (4.0–4.7, 5.1–5.4)                  | Clean numbering aligned to epic boundaries                                               |

---

## File Reference

| File                                              | Contents                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| `docs/epics/epic-0-environment-setup.md`          | Epic 0 — 11 stories, all done                                     |
| `docs/epics/epic-1-design-system-layout-shell.md` | Epic 1 — 6 stories, all done                                      |
| `docs/epics/epic-2-foundation-auth.md`            | Epic 2 — 5 stories, all done                                      |
| `docs/epics/epic-3-marketing-homepage.md`         | Epic 3 — 6 stories, ready                                         |
| `docs/epics/epic-4-onboarding-wizard.md`          | Epic 4 — 8 stories, ready                                         |
| `docs/epics/epic-5-dashboard-store-features.md`   | Epic 5 — 3 stories, ready                                         |
| `docs/epics/Epic-structure.md`                    | This file — Sprint 1 master index                                 |
| `docs/PRD-Sprint-1.md`                            | Product requirements (14 screens, REQ-6.1–6.15, 7.x architecture) |
| `docs/product-vision-mvp-waitlist-tool.md`        | Product vision, feature grading, MVP boundary                     |

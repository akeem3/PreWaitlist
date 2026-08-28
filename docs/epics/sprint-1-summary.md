# Sprint 1 — Summary

**Status:** complete
**Date range:** 2026-07-26 → 2026-08-12
**Exit condition met:** ✅ A founder can sign up, complete onboarding in <4 minutes, see their live URL, and arrive at a dashboard with skeleton panels.

---

## What Was Built

### Epic 0 — Environment Setup (11 stories, all done)

| Story | What                                                      |
| ----- | --------------------------------------------------------- |
| 0.1   | Toolchain verified (Node LTS, pnpm, git)                  |
| 0.2   | Next.js 16 scaffolded (App Router, Turbopack, TypeScript) |
| 0.3   | Supabase project + Google OAuth configured                |
| 0.4   | Resend account created                                    |
| 0.5   | Paddle sandbox account created                            |
| 0.6   | Vercel project + wildcard domain `*.prewaitlist.com`      |
| 0.7   | memsearch blocked (Milvus Lite no Windows wheels)         |
| 0.8   | Repo scaffolding (AGENTS.md, MEMORY.md, docs tree)        |
| 0.9   | ESLint + Prettier + pre-commit hooks                      |
| 0.10  | End-to-end smoke test                                     |
| 0.11  | Design System v2.0 complete (320-line globals.css)        |

### Epic 1 — Design System & Layout Shell (6 stories, all done)

| Story | What                                                        |
| ----- | ----------------------------------------------------------- |
| 1.0   | `cn()` utility (clsx + tailwind-merge)                      |
| 1.1   | Button, Card, Input, Badge primitives                       |
| 1.2   | Toggle, Select, Textarea primitives                         |
| 1.3   | Onboarding layout shell (split-pane + progress bar)         |
| 1.4   | Marketing layout shell (header + footer)                    |
| 1.5   | Share-copy-link component (Web Share API + clipboard)       |
| 1.6   | Live-preview component (3 templates, desktop/mobile toggle) |

### Epic 2 — Foundation & Auth (5 stories, all done)

| Story | What                                              |
| ----- | ------------------------------------------------- |
| 2.1   | Supabase schema DDL + RLS (5 tables)              |
| 2.2   | Auth page UIs (signup, signin, verify-email)      |
| 2.3   | Auth flow logic (signup, signin, OAuth, callback) |
| 2.4   | Email verification gate + resend                  |
| 2.5   | Proxy auth guard + session refresh                |

Extra work: Password strength meter, forgot/reset password, rate limiting, duplicate email detection, loading spinners, autocomplete attributes.

### Epic 3 — Marketing Homepage (8 stories, all done)

| Story | What                                                 |
| ----- | ---------------------------------------------------- |
| 3.0   | Acquisition capture (proxy.ts cookie persistence)    |
| 3.1   | Hero section + conditional "Powered by" variant      |
| 3.2   | Problem section + "The Difference" section           |
| 3.3   | Comparison grid + feature grid                       |
| 3.4   | Pricing section (Free + Pro only)                    |
| 3.5   | Responsive polish + footer integration               |
| 3.x   | Confidence section, navbar scroll, pricing alignment |

### Epic 4 — Onboarding Wizard (8 stories, all done)

| Story | What                                                                                      |
| ----- | ----------------------------------------------------------------------------------------- |
| 4.0   | API routes (POST/PATCH waitlist, GET check-slug) + shared form context + layout switching |
| 4.1   | Step 1 — Name Your Waitlist (headline, subdomain, "I'll name it later")                   |
| 4.2   | Step 2 — Choose a Template (Minimal, Bold, Dark)                                          |
| 4.3   | Step 3 — Make It Yours (brand color, logo, CTA text, milestone rewards, meta preview)     |
| 4.4   | Step 4 — Qualification Decision (two-card choice)                                         |
| 4.5   | Step 4a — Configure Qualification Questions (dynamic form, tier-based cap)                |
| 4.6   | Step 5 — Email Setup + Launch (comparison card, email mock, domain panel stub)            |
| 4.7   | Success Screen (live URL, share card, "What will happen next")                            |

### Epic 5 — Dashboard + Store Features (3 stories, all done)

| Story | What                                                                                       |
| ----- | ------------------------------------------------------------------------------------------ |
| 5.1   | Empty dashboard (stat cards with em-dashes, getting-started checklist, nav tabs, live URL) |
| 5.2   | Founder acquisition source capture (signup attribution via cookie)                         |
| 5.3   | Founder updates feed — compose only (POST /api/updates)                                    |

**Note:** Dashboard UI is a functional placeholder. Will be torn down and replaced in Sprint 2.

### Epic 6 — Post-Sprint-1 Issue Resolution (5 stories, all done)

| Story | What                                                                                                                                                                   |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.0   | Hopkins' sampling (signup after Step 3) + signup counter (threshold toggle)                                                                                            |
| 6.1   | Dashboard UI fixes (product name, styling)                                                                                                                             |
| 6.2   | Onboarding polish (Step 5 Pro explanation, success scroll, milestone knob, optional questions)                                                                         |
| 6.3   | Step 5 redesign (comparison card + email mock) + onboarding architecture overhaul (two-provider split: LocalOnboardingProvider + AuthedOnboardingProvider + FlushGate) |
| 6.4   | Onboarding state persistence hardening (resume prompt, cross-tab sync, persist guard, auth checks)                                                                     |

---

## Screens Delivered (14 total)

| #   | Screen                                    | Route                 | Status |
| --- | ----------------------------------------- | --------------------- | ------ |
| 1   | Marketing homepage (cold visitor)         | `/`                   | ✅     |
| 2   | Marketing homepage ("Powered by" visitor) | `/` (conditional)     | ✅     |
| 3   | Account creation                          | `/signup`             | ✅     |
| 4   | Sign in                                   | `/signin`             | ✅     |
| 5   | Email verification                        | `/verify-email`       | ✅     |
| 6   | Onboarding Step 1: Name waitlist          | `/onboarding/1`       | ✅     |
| 7   | Onboarding Step 2: Choose template        | `/onboarding/2`       | ✅     |
| 8   | Onboarding Step 3: Make it yours          | `/onboarding/3`       | ✅     |
| 9   | Onboarding Step 4: Qualification decision | `/onboarding/4`       | ✅     |
| 10  | Onboarding Step 4a: Configure questions   | `/onboarding/4a`      | ✅     |
| 11  | Onboarding Step 5: Email setup (Free)     | `/onboarding/5`       | ✅     |
| 12  | Onboarding Step 5: Email setup (Pro)      | `/onboarding/5`       | ✅     |
| 13  | Success screen                            | `/onboarding/success` | ✅     |
| 14  | Empty dashboard                           | `/dashboard`          | ✅     |

Additional screens built beyond PRD scope:

- `/forgot-password` — password reset flow
- `/reset-password` — password reset form
- `/auth/auth-code-error` — auth callback error page
- `/onboarding/signup` — post-Step-3 auth prompt (Hopkins' sampling)

---

## Database Schema (5 tables)

| Table                     | Purpose                                                    | RLS |
| ------------------------- | ---------------------------------------------------------- | --- |
| `founder_profiles`        | Founder account data + acquisition source                  | ✅  |
| `waitlists`               | Waitlist configuration (slug, template, brand color, etc.) | ✅  |
| `qualification_questions` | Dynamic question config per waitlist                       | ✅  |
| `milestone_rewards`       | Referral reward tiers per waitlist                         | ✅  |
| `founder_updates`         | Founder update posts (compose only, no read surface yet)   | ✅  |

---

## API Routes

| Method | Route                         | Purpose                                     |
| ------ | ----------------------------- | ------------------------------------------- |
| POST   | `/api/waitlist`               | Create waitlist                             |
| PATCH  | `/api/waitlist`               | Update waitlist                             |
| GET    | `/api/waitlist`               | Read waitlist                               |
| GET    | `/api/waitlist/check-slug`    | Slug availability                           |
| GET    | `/api/waitlist/count`         | Signup counter (returns `{count, visible}`) |
| POST   | `/api/updates`                | Create founder update                       |
| GET    | `/api/waitlist/verify-domain` | Domain verification stub                    |

---

## Component Inventory (18 components)

| Component         | File                                          | Purpose                     |
| ----------------- | --------------------------------------------- | --------------------------- |
| Button            | `components/ui/button.tsx`                    | 4 variants, 3 sizes         |
| Card              | `components/ui/card.tsx`                      | Card + 5 sub-components     |
| Input             | `components/ui/input.tsx`                     | Label, error, helper text   |
| Badge             | `components/ui/badge.tsx`                     | 6 variants                  |
| Toggle            | `components/ui/toggle.tsx`                    | Switch with label           |
| Select            | `components/ui/select.tsx`                    | Native select styled        |
| Textarea          | `components/ui/textarea.tsx`                  | Multi-line input            |
| ShareCopyLink     | `components/share/share-copy-link.tsx`        | Web Share API + clipboard   |
| PoweredByFooter   | `components/share/powered-by-footer.tsx`      | Free tier badge             |
| LivePreview       | `components/onboarding/live-preview.tsx`      | 3 templates, desktop/mobile |
| MarketingLayout   | `components/layout/marketing-layout.tsx`      | Header + footer             |
| Hero              | `components/marketing/hero.tsx`               | Conditional "Powered by"    |
| ProblemSection    | `components/marketing/problem-section.tsx`    | 3 pain-point cards          |
| DifferenceSection | `components/marketing/difference-section.tsx` | Hot/Cold user examples      |
| ComparisonSection | `components/marketing/comparison-section.tsx` | Us vs alternatives          |
| FeatureGrid       | `components/marketing/feature-grid.tsx`       | 2×2 feature cards           |
| ConfidenceSection | `components/marketing/confidence-section.tsx` | Value callout               |
| PricingSection    | `components/marketing/pricing-section.tsx`    | Free + Pro cards            |
| cn()              | `components/lib/cn.ts`                        | Classname merging           |

---

## Architecture Decisions Made

1. **Next.js 16 + proxy.ts** — subdomain routing via proxy.ts (not middleware.ts)
2. **Tailwind v4 @theme inline** — tokens as utility class names, NOT `var()` arbitrary values
3. **Two-provider onboarding split** — LocalOnboardingProvider (Steps 1-3, localStorage) + AuthedOnboardingProvider (Steps 4-5, API)
4. **FlushGate** — handles Phase A→B transition with POST→GET→clear ordering
5. **Hopkins' sampling** — Steps 1-3 unauthenticated, signup after product experience
6. **Resend transactional only** — no Audiences/Marketing product (per-contact billing incompatible with multi-founder platform)
7. **Dashboard placeholder** — Epic 5 dashboard is functional placeholder, will be replaced in Sprint 2

---

## What's NOT Built (Sprint 2+ scope)

| Feature                                   | Sprint | Notes                                                             |
| ----------------------------------------- | ------ | ----------------------------------------------------------------- |
| Public waitlist page (subscriber-facing)  | 2      | `src/app/(public)/[subdomain]/page.tsx` exists but is placeholder |
| Email capture form                        | 2      | Subscriber signup flow                                            |
| Qualification questions (subscriber view) | 2      | Post-email-capture display                                        |
| Thank-you page (direct + referred)        | 2      | Position, referral link, share buttons                            |
| Duplicate email handling                  | 2      | Subscriber-side                                                   |
| Referral link generation                  | 2      | Unique per subscriber                                             |
| Position tracking + recalculation         | 2      | On referral signup                                                |
| Public leaderboard                        | 2      | Referral count + quality score                                    |
| Confirmation email (Resend)               | 2      | Position + referral link                                          |
| "You moved up" trigger email              | 2      | On referral conversion                                            |
| Dashboard active state (real data)        | 2      | Replace placeholder                                               |
| Founder updates display (public page)     | 2      | LatestUpdateCard built (Story 7.6), email-first delivery          |
| CSV export                                | 2      | Subscriber data export                                            |
| `subscribers` table                       | 2      | Not yet created                                                   |
| Warmth tracking engine                    | 3      | Email opens + page returns + qual answers                         |
| Broadcast email                           | 3      | Full list + warmth-segmented                                      |
| Paddle billing integration                | 3      | Pro $15/mo, Growth $29/mo                                         |
| Upgrade modal                             | 3      | 7 context-sensitive triggers                                      |
| Domain authentication (SPF/DKIM)          | 3      | Walkthrough UI                                                    |
| Automated warmth alerts                   | 3      | Growth tier cron job                                              |

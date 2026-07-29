# Project Memory — Durable Decisions

## Tech Stack Decisions

### Next.js 16 (not 14)

- **Decision:** Use Next.js 16 with App Router, Turbopack as default bundler.
- **Reason:** Next.js 14 is two majors behind. Next.js 16 renamed middleware.ts to proxy.ts — the exact file subdomain routing depends on. Building on 14 conventions means an immediate breaking migration before Sprint 2.
- **Date:** 2026-07-26

### Supabase via @supabase/ssr

- **Decision:** Use `@supabase/ssr` for all session handling, not `@supabase/auth-helpers-nextjs`.
- **Reason:** `@supabase/auth-helpers-nextjs` is legacy. `@supabase/ssr` is current for cookie/session handling across Server Components, Server Actions, Route Handlers.
- **Date:** 2026-07-26

### pnpm as package manager

- **Decision:** Use pnpm over npm or yarn.
- **Reason:** Faster installs, disk-efficient — reasonable default for a solo dev iterating quickly.
- **Date:** 2026-07-26

### memsearch for project memory

- **Decision:** Use memsearch with ONNX embeddings (bge-m3) for fork-agnostic semantic search over markdown memory files.
- **Reason:** Stores data as plain markdown files readable even without the tool. Uses local ONNX embeddings — zero API key, zero cost, zero dependency on whichever model provider is active.
- **Date:** 2026-07-26

### Wildcard subdomain routing via Vercel nameservers

- **Decision:** Use Vercel-managed nameservers (ns1/ns2.vercel-dns.com) instead of A-record + CNAME for wildcard routing.
- **Reason:** A records cannot route `*.mywaitlist.com` to Vercel. Only Vercel nameservers or a wildcard CNAME can. Since the domain was on GoDaddy, updated nameservers to point to Vercel's DNS.
- **Date:** 2026-07-26

## External Services — Setup Status

### Supabase (Story 0.3)

- **Project:** `ollaykzbhyniqxxlbkhn.supabase.co` — "waitlist-build"
- **Auth:** Google OAuth provider configured (client ID from GCP)
- **Keys:** Publishable + secret in .env.local
- **Redirect URLs:** Configured in Supabase Dashboard (localhost + vercel.app + mywaitlist.com)
- **Not done:** Supabase client modules, schema DDL, RLS policies — code not yet written

### Resend (Story 0.4)

- **Status:** Not started. No account created, no API key.

### Paddle (Story 0.5)

- **Sandbox account:** Created at sandbox-vendors.paddle.com
- **Keys:** API key, client token, webhook secret — all in .env.local
- **Not done:** Client module not yet written (setup-only story)

### Vercel (Story 0.6)

- **Project:** `waitlist-build` on Vercel
- **Domain:** `mywaitlist.com` + `www.mywaitlist.com` added
- **DNS:** Nameservers updated in GoDaddy to Vercel's
- **Wildcard:** `*.mywaitlist.com` not yet added via "Add Existing" in Vercel Domains

## Epic 0 Progress

| Story | Status  | Summary                                                                           |
| ----- | ------- | --------------------------------------------------------------------------------- |
| 0.1   | ✅ done | Toolchain verified, git init, .gitignore, first commit                            |
| 0.2   | ✅ done | Next.js 16 scaffolded, 15 route placeholders, all folders                         |
| 0.3   | ready   | Supabase project + Google OAuth done. Client/DDL/RLS not written                  |
| 0.4   | ready   | Resend account not created                                                        |
| 0.5   | ready   | Paddle sandbox keys in .env.local                                                 |
| 0.6   | ready   | Vercel project + domain added. Wildcard + proxy.ts not done                       |
| 0.7   | blocked | memsearch CLI + plugin done. Docker not installed (Milvus Lite no Windows wheels) |
| 0.8   | ✅ done | AGENTS.md, MEMORY.md, docs tree, design tokens                                    |
| 0.9   | ✅ done | ESLint, Prettier, simple-git-hooks + lint-staged                                  |
| 0.10  | ready   | Depends on 0.3 + 0.6 + 0.8                                                        |

## Decision: Resend email architecture (2026-07)

All MyWaitlist emails (confirmations, moved-up notices, Pro broadcasts) go through
Resend's plain transactional/Batch Send API against our own Supabase subscriber
data — never Resend's Audiences/Marketing product.

Why: Audiences bills per stored contact and is built for one company managing one
list. We're one platform sending on behalf of hundreds of separate founders' lists.
Using Audiences would mean a second, independent, unpredictable per-contact bill
on top of the per-email one. One meter (email volume) is easier to budget than two.

Side effect worth remembering: a founder completing custom-domain verification
(Pro tier) needs a second Resend domain slot, which forces the move off Resend's
Free plan regardless of email volume — and that trigger happens to coincide with
picking up a paying customer.

## Sprint 1 Scope (from PRD §2, §4, §6)

**Goal:** Founder discovers product → creates account → completes onboarding in <4 min → arrives at live subdomain URL with empty dashboard.

**14 Screens in Scope:**

1. Marketing homepage (cold visitor) — `/`
2. Marketing homepage ("Powered by" visitor) — `/` (conditional hero)
3. Account creation — `/signup`
4. Sign in — `/signin`
5. Email verification — `/verify-email`
6. Onboarding Step 1: Name waitlist — `/onboarding/1`
7. Onboarding Step 2: Choose template — `/onboarding/2`
8. Onboarding Step 3: Make it yours — `/onboarding/3`
9. Onboarding Step 4: Qualification decision — `/onboarding/4`
10. Onboarding Step 4a: Configure questions — `/onboarding/4a`
11. Onboarding Step 5: Email setup (Free) — `/onboarding/5`
12. Onboarding Step 5: Email setup (Pro) — `/onboarding/5`
13. Success screen — `/onboarding/success`
14. Empty dashboard — `/dashboard`

**Explicitly EXCLUDED from Sprint 1:**

- Public waitlist page (Sprint 2)
- Warmth tracking (Sprint 3)
- Broadcast email sending (Sprint 3)
- Paddle billing enforcement (Sprint 3)
- Real SPF/DKIM verification (Sprint 3)
- Referral mechanics beyond config UI
- Subscriber user type (doesn't exist yet)

**Design Reference:** 17 high-fidelity SVGs in `docs/design/High-fidelity-svgs/` — every screen must reference its SVG.

**Data Model:** 5 tables (founder_profiles, waitlists, qualification_questions, milestone_rewards, founder_updates) with RLS.

## Typography System (Design System v2.0)

**Font:** Inter (variable weight 100-900, optimized for screen)

**9-Level Token System** (based on GetWaitlist analysis):

| Token     | Size | Use Case                |
| --------- | ---- | ----------------------- |
| text-2xs  | 11px | Fine print, legal       |
| text-xs   | 12px | Captions, metadata      |
| text-sm   | 14px | UI labels, helper text  |
| text-base | 16px | Body text (design base) |
| text-lg   | 18px | Lead paragraphs         |
| text-xl   | 20px | Section headings (H4)   |
| text-2xl  | 24px | Page headings (H3)      |
| text-3xl  | 28px | Dashboard titles (H2)   |
| text-4xl  | 35px | Hero headings (H1)      |
| text-5xl  | 48px | Display headings        |
| text-6xl  | 60px | Large display           |

**Scale Ratio:** ~1.16 average (moderate humanist scale, tighter than Major Third 1.25)

**Line Heights:**

- Body: 1.0, 1.25, 1.375, 1.5, 1.625, 1.75
- Headings: 1.125, 1.25, 1.375 (tighter than body)

**Letter Spacing:** -0.025em (tighter) to 0.025em (wider)

**Typography Presets:** display, display-lg, h1-h4, body-lg, body, body-sm, caption, fine-print, label, overline, code

## Standing Constraints

- Domain `waitlist-build.vercel.app` acceptable for Sprint 1; proper domain needed by Sprint 2.
- Pre-commit hook (`simple-git-hooks` + `lint-staged`) active — all commits run ESLint + Prettier.
- Use `proxy.ts`, never `middleware.ts`.
- Never write user-facing copy — all Sprint 1 copy is reviewed.
- Never build real SPF/DKIM in Sprint 1 — UI only, stub backend.

## Project Memory — Durable Decisions

## Project Path

- **Location:** `C:\Users\User\Work Projects\Product US\wait-app`
- **Note:** Folder was renamed from `Product [us]` to `Product US` (square brackets broke VS Code terminal + pnpm symlinks)
- **Date:** 2026-07-29

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
- **Status:** ✅ Working — CLI v0.4.16, Docker v29.7.2, Milvus v2.5.1 containers running, 421 chunks indexed.
- **Fix:** Windows console encoding bug — must set `$env:PYTHONIOENCODING="utf-8"` before running memsearch commands (or add to PowerShell profile permanently). Without this, `click.echo` crashes on Unicode characters (emojis, arrows).
- **Gotcha:** Collection name defaults to `memsearch_chunks` for CLI. When indexing with `--force`, it may create a separate collection. Always verify with `memsearch stats` and use `-c memsearch_chunks` if needed.
- **Date:** 2026-07-26 (updated 2026-09-13)

### Wildcard subdomain routing via Vercel nameservers

- **Decision:** Use Vercel-managed nameservers (ns1/ns2.vercel-dns.com) instead of A-record + CNAME for wildcard routing.
- **Reason:** A records cannot route `*.prewaitlist.com` to Vercel. Only Vercel nameservers or a wildcard CNAME can. Since the domain was on GoDaddy, updated nameservers to point to Vercel's DNS.
- **Date:** 2026-07-26

### Component token approach (Tailwind v4)

- **Decision:** Use `var()` arbitrary values for component tokens (e.g. `rounded-[var(--button-radius)]`), NOT Tailwind utility classes.
- **Reason:** Tailwind v4 `@theme` custom tokens don't follow naming conventions to auto-generate utilities. `--button-radius` does NOT generate `rounded-button`. Must use `var()` directly.
- **Date:** 2026-07-28

### `@theme inline` colors: use utility class names, NOT `var()` arbitrary values

- **Decision:** For `--color-*` tokens defined in `@theme inline`, use generated Tailwind utility class names (e.g. `bg-card`, `text-foreground`, `border-dark-template-bg`) — never arbitrary value syntax like `bg-[--color-card]` or `bg-[var(--color-card)]`.
- **Reason:** `@theme inline` inlines values directly into generated utilities but does NOT create CSS custom properties. So `bg-[--color-foreground]` references a variable that doesn't exist as a CSS custom property — the dark preview was rendering light for this exact reason. The generated utility class names (e.g. `bg-foreground`, `bg-dark-template-bg`) work because Tailwind bakes the value directly into the compiled CSS.
- **Gotcha:** This is the opposite of regular `@theme` (without `inline`), which DOES generate CSS custom properties. The `inline` keyword is the key difference.
- **Date:** 2026-07-31 (discovered during dark-template bug fix)

### Font-size type hint

- **Decision:** Use direct Tailwind classes (`text-xs`, `text-sm`, etc.) for font-size, not `text-[var(...)]` or `text-[length:var(...)]` arbitrary values.
- **Reason:** Tailwind v4 interprets `text-[var(--badge-font-size)]` as `color:`, not `font-size:`. Additionally, `@source not` directives in `globals.css` exclude `.memory/` and `docs/` from Tailwind scanning to prevent documentation text from generating broken CSS utilities (e.g., `text-[length:var(...)]` with literal `...`).
- **Date:** 2026-07-28 (updated 2026-07-29)

### Select component

- **Decision:** Use native `<select>` styled with tokens, not a complex custom dropdown.
- **Reason:** Story 1.2 scope is simple option selection. Native is accessible by default and avoids combobox/popover complexity.
- **Date:** 2026-07-28

### Live-preview debouncing

- **Decision:** Use `useDeferredValue` (React 19) instead of extra debounce dependency for live preview.
- **Reason:** `useDeferredValue` is built-in concurrent mode (~300-500ms deferred), avoids extra debounce dependency and library.
- **Date:** 2026-07-28

### Story 1.4 marketing layout architecture

- **Decision:** Shared `MarketingLayout` component in root layout wraps all children; onboarding layout overrides it (Next.js nested layout replacement).
- **Reason:** Route group layouts (`(marketing)/layout.tsx`, `(auth)/layout.tsx`) are passthrough `<>{children}</>`. Root `layout.tsx` wraps `{children}` in `<MarketingLayout>`. Onboarding layout provides its own split-pane shell.
- **Date:** 2026-07-28

### Story 1.5 clipboard mocking

- **Decision:** Global clipboard mock in `src/__tests__/setup.ts` via `Object.defineProperty` with `configurable: true`.
- **Reason:** happy-dom `navigator.clipboard` has only getter; `vi.stubGlobal` doesn't override it. Must use `Object.defineProperty` to redefine.
- **Date:** 2026-07-28

### Story 1.6 Image replacement

- **Decision:** Use `unoptimized` prop on Next.js `<Image>` for dynamic user-provided logo URLs.
- **Reason:** Avoids configuring `remotePatterns` for every possible domain. User logos are loaded at runtime.
- **Date:** 2026-07-28

## External Services — Setup Status

### Supabase (Story 0.3)

- **Project:** `ollaykzbhyniqxxlbkhn.supabase.co` — "waitlist-build"
- **Auth:** Google OAuth provider configured (client ID from GCP)
- **Keys:** Publishable + secret in .env.local
- **Redirect URLs:** Configured in Supabase Dashboard (localhost + vercel.app + prewaitlist.com)
- **Schema DDL + RLS:** ✅ Done (Story 2.1) — 5 tables, policies
- **Client modules:** ✅ Done — `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`

### Resend (Story 0.4)

- **Status:** Account created, API key in .env.local. Client module at `src/lib/resend.ts`. Domain `prewaitlist.com` verified. Batch API: `resend.batch.send([...])`, max 100/batch. Sender: `updates@prewaitlist.com`.
- **Webhook:** `RESEND_WEBHOOK_SECRET` added to .env.local (2026-09-13). Endpoint recorded as `https://waitlist-build.vercel.app/api/webhooks/resend` — **DEAD as of 2026-09-27** (Vercel `DEPLOYMENT_NOT_FOUND`, HTTP 404). Correct endpoint, live-verified 2026-09-27: `https://www.prewaitlist.com/api/webhooks/resend` (apex `prewaitlist.com` 308-redirects to www — use www directly). **Resend Dashboard webhook URL update = founder step (instructions given 2026-09-27).** Events: sent, delivered, opened, clicked, bounced, complained. Restricted API key cannot list webhooks via API.
- **CRON_SECRET:** Added to .env.local (2026-09-13). Used for `/api/cron/warmth` endpoint auth.

### Paddle (Story 0.5)

- **Sandbox account:** Created at sandbox-vendors.paddle.com
- **Keys:** API key (`pdl_sdbx_apikey_*`), client token (`test_*`), webhook secret (`pdl_ntfset_*`), price ID (`pri_01m2y3y0acax4jvdcvfgjck4zn`) — all in .env.local AND Vercel
- **Client module:** ✅ Done — `src/hooks/use-paddle.ts` (SDK init), `src/hooks/use-paddle-upgrade.ts` (onboarding upgrade hook)
- **Checkout API:** ✅ Done — `src/app/api/billing/checkout/route.ts` (returns priceId + customData)
- **Webhook:** ✅ Done — `src/app/api/webhooks/paddle/route.ts` (handles subscription.created, subscription.activated, subscription.canceled, subscription.past_due, transaction.completed)
- **Domain approval:** Submitted `prewaitlist.com` for approval in Paddle Dashboard. Waiting for approval before checkout works.
- **Status:** Paddle sandbox configured but not yet operational (pending domain approval). All env vars are sandbox tokens — sandbox checkouts only work with sandbox Paddle accounts.

### Vercel (Story 0.6)

- **Project:** `waitlist-build` on Vercel
- **Domain:** `prewaitlist.com` + `www.prewaitlist.com` added
- **DNS:** Nameservers updated in GoDaddy to Vercel's
- **Wildcard:** `*.prewaitlist.com` not yet added via "Add Existing" in Vercel Domains

## Design System Token Reference

**Source of truth:** `src/app/globals.css` — all colors, typography, spacing, and component tokens.

### Colors (CSS Custom Properties)

| Token                      | Hex Value | Tailwind Class             | Use Case                     |
| -------------------------- | --------- | -------------------------- | ---------------------------- |
| `--color-background`       | `#FAF8F4` | `bg-background`            | Page background (warm ivory) |
| `--color-card`             | `#FFFFFF` | `bg-card`                  | Elevated cards, inputs       |
| `--color-accent`           | `#0F7A5E` | `bg-accent`, `text-accent` | Brand green, CTAs            |
| `--color-foreground`       | `#1A1A1A` | `text-foreground`          | Primary text                 |
| `--color-border`           | `#CCC9C3` | `border-border`            | Input borders, dividers      |
| `--color-muted-foreground` | `#6B6459` | `text-muted-foreground`    | Secondary text               |
| `--color-destructive`      | `#DC2626` | `text-destructive`         | Error states                 |

### Typography (Tailwind Classes)

**Font:** Inter (variable weight 100-900)

| Token         | Size | Tailwind Class | Use Case               |
| ------------- | ---- | -------------- | ---------------------- |
| `--text-xs`   | 12px | `text-xs`      | Captions, metadata     |
| `--text-sm`   | 14px | `text-sm`      | UI labels, helper text |
| `--text-base` | 16px | `text-base`    | Body text              |
| `--text-lg`   | 18px | `text-lg`      | Lead paragraphs        |
| `--text-xl`   | 20px | `text-xl`      | Section headings (H4)  |
| `--text-2xl`  | 24px | `text-2xl`     | Page headings (H3)     |
| `--text-3xl`  | 28px | `text-3xl`     | Dashboard titles (H2)  |
| `--text-4xl`  | 35px | `text-4xl`     | Hero headings (H1)     |

**Typography Presets:** `.text-display`, `.text-h1` through `.text-h4`, `.text-body*`, `.text-caption`, `.text-label`, `.text-overline`

### Enforcement Rules

- **Never use hardcoded hex values** — always reference CSS custom properties via Tailwind utility classes
- **Never use arbitrary font-size values** — use Tailwind's built-in `text-xs`, `text-sm`, etc.
- **Never use inline styles** — use Tailwind utility classes and design system tokens
- **Component tokens** (button, input, card, badge, toggle, select) use `var()` syntax: `rounded-[var(--button-radius)]`
- Run `pnpm lint` before committing any UI changes

## Decision: Resend email architecture (2026-07)

All PreWaitlist emails (confirmations, moved-up notices, Pro broadcasts) go through
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

## Sprint 2 Scope (from PRD §2a)

**Goal:** Public waitlist page live and accepting signups. Founders can see subscribers, manage qualification questions, track referral progress. Dashboard restructured with left sidebar.

**7 Screens in Scope:**

1. Public waitlist page — `/:subdomain`
2. Thank you (direct signup) — `/:subdomain/thank-you`
3. Thank you (referred signup) — `/:subdomain/thank-you`
4. Public leaderboard — `/:subdomain/leaderboard`
5. Dashboard (empty state) — `/dashboard`
6. Dashboard (active state) — `/dashboard`
7. Dashboard subscriber detail — `/dashboard/subscribers/:id`

**Key Features:**

- Email capture (email-only signup, inline qual questions)
- Referral system (unique codes, position tracking, milestone rewards)
- Public leaderboard (ranked by referral count, milestone badges)
- Dashboard restructure (left sidebar, stat cards, subscriber table)
- CSV export (Pro tier)
- Founder updates display on public page

**New Tables:**

- `subscribers` (email, referral_code, referrer_id, position, qual_answers, created_at)
- `milestones_earned` (subscriber_id, tier_referrals, notified_at) — tracks milestone fulfillment
- `page_views` (subdomain, viewer_ip_hash, referrer, viewed_at) — warmth tracking foundation
- `email_events` (subscriber_id, event_type, event_data, event_at) — engagement tracking foundation

**Design Reference:** 5 high-fidelity SVGs in `docs/design/High-fidelity-Sprit2/`

## Sprint 3 Scope (from product vision + audit)

**Goal:** Warmth tracking live. Founders send warmth-segmented broadcasts. Dashboard complete. Legal compliance in place. Paddle billing gates Pro features. Product feature-complete for MVP.

**Pre-requisite:** Epic 10 (Public Waitlist Page & Onboarding Redesign) ships before Sprint 3 begins.

**5 Epics, 43 Stories:**

- **Epic 11 — Warmth Tracking Engine** (8 stories): Resend webhooks, score calculation (daily batch), Hot/Warm/Cold badges, distribution panel, warning state, decay rules, schema migration
- **Epic 12 — Email System** (7 stories): Confirmation emails, position recalculation, "you moved up" trigger, broadcast, segmented broadcast, sender customisation, email infrastructure separation
- **Epic 12.1 — Dashboard Overhaul** (11 stories): Sidebar redesign, empty state, stat cards, tier gating, founder updates compose, mobile, settings/bug fixes, design tokens, broadcast/duplicate fixes, data/performance, tests
- **Epic 12.2 — Gap Fixes** (13 stories): Schema migration, archive waitlist, edit after onboarding, Privacy Policy, ToS, consent tracking, unsubscribe mechanism, bounce suppression, physical address in emails, tests, PoweredByFooter Pro removal, dashboard auto-refresh, subscriber display name
- **Epic 12.3 — Dashboard Section Pages** (6 stories): Unlock sidebar nav, dashboard leaderboard, dashboard qualification, dashboard warmth, tests, shared layout & navigation fix
- **Epic 13 — Billing & Feature Gating** (7 stories): Paddle checkout ($15/mo), upgrade modal (7 triggers), tier enforcement, 500 signup cap, billing management, domain auth walkthrough

**Execution order:** Epic 11 → Epic 12 → Epic 12.1 → Epic 12.2 → Epic 12.3 → Epic 13

**Key decisions (from web research + audit):**

- **Decay starts at 60 days (not 30):** Waitlist subscribers go quiet while waiting for launch — this is not disengagement. 30-day decay penalizes early adopters unfairly.
- **Email opens NOT tracked as warmth signal:** Apple Mail Privacy Protection preloads pixels for ~40-50% of email clients, making open data unreliable. Clicks (+5) and referrals (+15) are the primary intent signals.
- **Cold bar color = blue (not red):** Both Hot (coral `#d0492f` at the time) and Cold (red) being red-family is confusing. Blue is more distinct. **[AMENDED 2026-09-27:** Hot is now green `#0F7A5E`, so Hot/Cold are fully distinct anyway.**]**
- **Email infrastructure separation:** Transactional emails from `notifications@prewaitlist.com`, marketing from `updates@prewaitlist.com`. Protects deliverability if a broadcast triggers spam complaints.
- **Confirmation email uses Emails API, not Batch API:** Batch is for bulk sends. Single transactional send uses `resend.emails.send()`.
- **Paddle Billing uses `Paddle.Initialize()` (not `Paddle.Setup()`):** Classic vs Billing distinction. `customData` not `passthrough`. `subscription.canceled` (one L) not `cancelled`.
- **Page views table is NOT populated:** No code inserts into it. Warmth scoring uses email events only. Page-visit tracking deferred to v1.1.
- **Cached subscriber count for 500 cap:** `waitlists.subscriber_count` column, atomic increment/decrement. Avoids `COUNT(*)` on every signup.
- **Multiple waitlists is Sprint 4 scope:** Product vision line 415 says "Second waitlist creation flow" is Sprint 4, not Sprint 3.
- **Schema migration consolidated:** Story 11.7 adds all Sprint 3 columns in one migration (6 columns + 1 table).

**New tables/columns:**

- `broadcasts` (id, waitlist_id, subject, sent_at, recipient_count, created_at)
- `email_events.event_data` (jsonb, nullable)
- `waitlists.sender_name` (text, nullable)
- `waitlists.cold_threshold` (integer, default 40)
- `waitlists.sending_domain` (text, nullable)
- `waitlists.subscriber_count` (integer, default 0)
- `founder_profiles.paddle_subscription_id` (text, nullable)

**New tables/columns (Epic 12.2 — Gap Fixes):**

- `subscribers.consent_given_at` (timestamptz, nullable) — GDPR consent timestamp
- `subscribers.consent_ip_address` (text, nullable) — IP at signup for audit trail
- `subscribers.unsubscribed_at` (timestamptz, nullable) — when subscriber clicked unsubscribe
- `waitlists.is_archived` (boolean, default false) — archive status
- `waitlists.archived_at` (timestamptz, nullable) — when archived
- `waitlists.business_address` (text, nullable) — CAN-SPAM physical address
- `bounced_emails` (new table) — id, waitlist_id, email, email_type, bounce_type, created_at

## Epic 0 Progress (All 12 Stories Done)

| Story | Status     | Summary                                                                           |
| ----- | ---------- | --------------------------------------------------------------------------------- |
| 0.1   | ✅ done    | Toolchain verified, git init, .gitignore, first commit                            |
| 0.2   | ✅ done    | Next.js 16 scaffolded, 15 route placeholders, all folders                         |
| 0.3   | ✅ done    | Supabase project + Google OAuth done. Client/DDL/RLS not written                  |
| 0.4   | ✅ done    | Resend account setup                                                              |
| 0.5   | ✅ done    | Paddle sandbox keys in .env.local                                                 |
| 0.6   | ✅ done    | Vercel project + domain added                                                     |
| 0.7   | ⛔ blocked | memsearch CLI + plugin done. Docker not installed (Milvus Lite no Windows wheels) |
| 0.8   | ✅ done    | AGENTS.md, MEMORY.md, docs tree, design tokens                                    |
| 0.9   | ✅ done    | ESLint, Prettier, simple-git-hooks + lint-staged                                  |
| 0.11  | ✅ done    | Design tokens in globals.css (292 lines)                                          |
| 0.12  | ✅ done    | Test infrastructure (Vitest + happy-dom + RTL + userEvent)                        |
| 0.10  | ✅ done    | Smoke test — all routes render                                                    |

## Epic 1 Progress (Design System, Layout Shells, Share Component)

| Story | Status  | Summary                                                                                                |
| ----- | ------- | ------------------------------------------------------------------------------------------------------ |
| 1.0   | ✅ done | cn() utility (clsx 2.1.1 + tailwind-merge 3.6.0), component dirs exist                                 |
| 1.1   | ✅ done | Button (4 variants/3 sizes), Card (6 parts), Input (label/error/helper), Badge (6 variants) — 42 tests |
| 1.2   | ✅ done | Toggle, Select, Textarea — 33 tests, forwardRef, token-based styling                                   |
| 1.3   | ✅ done | Onboarding layout: split-pane, progress bar, back nav, mobile responsive                               |
| 1.4   | ✅ done | Marketing layout: sticky header (logo + nav), footer, mobile drawer                                    |
| 1.5   | ✅ done | ShareCopyLink: Web Share API + clipboard, 7 tests                                                      |
| 1.6   | ✅ done | LivePreview: 3 templates, desktop/mobile toggle, BrowserFrame, Image                                   |

## Epic 2 Progress (Foundation & Auth)

| Story | Status  | Summary                                           |
| ----- | ------- | ------------------------------------------------- |
| 2.1   | ✅ done | Supabase schema DDL + RLS (5 tables, policies)    |
| 2.2   | ✅ done | Auth page UIs (signup, signin, verify-email)      |
| 2.3   | ✅ done | Auth flow logic (signup, signin, OAuth, callback) |
| 2.4   | ✅ done | Email verification gate + resend                  |
| 2.5   | ✅ done | Proxy auth guard + session refresh                |

## Epic 3 Progress (Marketing Homepage)

| Story | Status  | Summary                                                             |
| ----- | ------- | ------------------------------------------------------------------- |
| 3.0   | ✅ done | Acquisition cookie capture via proxy.ts                             |
| 3.1   | ✅ done | Hero section + conditional "Powered by" variant                     |
| 3.2   | ✅ done | Problem section + "The Difference" section                          |
| 3.3   | ✅ done | Comparison grid (✗/✓ marks) + feature grid (SVG icons)              |
| 3.4   | ✅ done | Pricing section (Free + Pro, aligned CTAs, ✓ checkmarks)            |
| 3.5   | ✅ done | Responsive polish + section order                                   |
| 3.x   | ✅ done | Confidence section, navbar scroll, footer update, pricing alignment |

**Marketing Homepage Section Order:** Hero → ProblemSection → DifferenceSection → ComparisonSection → FeatureGrid → ConfidenceSection → PricingSection

**Marketing Homepage Files:**

- `components/marketing/hero.tsx` — conditional "Powered by" variant
- `components/marketing/problem-section.tsx` — 3 cards with SVG icons
- `components/marketing/difference-section.tsx` — single-column centered
- `components/marketing/comparison-section.tsx` — white bg, ✗/✓ SVG marks
- `components/marketing/feature-grid.tsx` — 2×2 grid with green SVG icons
- `components/marketing/confidence-section.tsx` — standalone callout, accent text
- `components/marketing/pricing-section.tsx` — Free + Pro, aligned CTAs
- `components/layout/marketing-layout.tsx` — header (scroll border), footer (warm ivory)

**Marketing Homepage Decisions:**

- Hero background: no pattern — plain warm ivory (#FAF8F4) is correct; comfort comes from restraint
- Navbar border: visible at top (scrollY=0), disappears on scroll
- Footer: warm ivory bg (no bg-muted), 16px text, 48×36 logo
- Pricing: Free + Pro only, no Growth card; both cards have CTA; aligned via flex-1 spacer
- Comparison: white bg-card band, red ✗ and green circled ✓ SVG marks
- Feature grid: small green SVG icons, centered in max-w-4xl
- Confidence section: standalone, no hardcoded bg, text-body-lg in accent green
- Tailwind v4: unlayered CSS overrides Tailwind utilities; use inline styles for overrides

## Epic 4 Progress (Onboarding Wizard)

### Design Analysis — Complete

**Analysis date:** 2026-07-31
**File:** `docs/design/design-analysis.md`

**Screens analyzed:**

- Step 1 — Name Your Waitlist
- Step 2 — Choose a Template (Minimal, Bold, Dark variants)
- Step 3 — Make It Yours
- Step 4 — Qualification Decision (+ variant)
- Step 5 — Email Setup (Free + Pro tiers)
- Success Screen

**Key findings from design analysis:**

1. **Layout pattern:** Steps 1–3 use two-pane layout (566px left + browser mockup). Steps 4, 5, Success use centered layout (no right pane).
2. **Button pattern:** Steps 1–4 use arrow-only (→) submit buttons. Step 5 uses text+arrow ("Launch my waitlist" + →).
3. **Progress dots:** 5 dots, 10px diameter, ~16.7px center-to-center spacing. Completed + current use `#0F7A5E`, incomplete use `#C3C2C2`. No visual distinction between completed and current.
4. **Template cards:** 457×123px, rx=23.5, 2px accent border for selected state.
5. **Form inputs:** 60.33px height, 12.164px border-radius, `#CCC9C3` 1.67px border.
6. **Submit button:** 458×59px, rx=9.59, `#0F7A5E` fill, `#FAF8F4` text, arrow icon only.
7. **Step 5 launch button:** 644×59px (wider), same style.
8. **Success screen:** No progress dots, centered layout, share/copy buttons at equal visual weight.
9. **Logo upload:** Dashed border variant for file input.
10. **Milestone rewards toggle:** Completely hidden when OFF (not collapsed).
11. **Free tier email fields:** Disabled with Pro badge overlay.
12. **"I'll name it later":** Has helper caption text below it.

**PRD cross-reference:** All REQs from 6.6–6.12 documented with design match status.
**Web research:** Multi-step onboarding UX, template selectors, color pickers, qualification question builders — all documented.
**Confidence:** 98% — analysis complete, ready for epic restructuring.

### Design Analysis — Epic 8 (Thank-You & Referral Loop)

**Analysis date:** 2026-08-28
**File:** `docs/design/design-analysis.md`

**Screens analyzed:**

- Screen 8.0 — Thank You (Direct Signup)
- Screen 8.1 — Thank You (Referred Signup)

**Key findings:**

- Direct variant: position display + referral link + share buttons + powered-by footer
- Referred variant: adds "Referred by a friend" heading + anonymized referrer email above card
- Share buttons: Twitter, LinkedIn, Copy Link — equal visual weight (no "primary" share)
- Social proof counter on public page: "Join 47 others on the waitlist"
- Referral code in URL: `/:subdomain?ref={8-char-code}`
- Share URL format: `/:subdomain?ref={code}` (appended to base URL)
- No header/nav on thank-you page (standalone)
- Mobile: single column, buttons full-width

**PRD cross-reference:** Stories 8.0–8.3 all verified against SVGs.
**Confidence:** 100% — analysis complete, all ACs mapped.

### Story Status — Epic 4

| Story | Status  | Summary                                                                                                                                                                                                                                                                                                                                                                                 |
| ----- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.0   | ✅ done | API routes (POST/PATCH waitlist, GET check-slug), OnboardingFormContext (14 fields, loading state), layout switching (two-pane Steps 1–3, centered Steps 4/4a/5/Success), progress dots with touch targets, sticky mobile CTA, back links in Steps 2+3                                                                                                                                  |
| 4.1   | ✅ done | Step 1: Headline, subheadline, subdomain input with debounced availability check, "I'll name it later" fallback, POST to create waitlist, arrow-only submit                                                                                                                                                                                                                             |
| 4.2   | ✅ done | Step 2: Template selector (Minimal/Bold/Dark) with MiniPreviews, PATCH to save selection, dark template CSS tokens (5 tokens in globals.css), dark theme selector thumbnail fix (h-full w-full), BrowserFrame dark mode fix (utility class names not var() arbitrary values), Bold template hero headline (text-h1), Bold email input dark border (border-2 border-foreground)          |
| 4.3   | ✅ done | Step 3: Headline/subheadline/brand color/logo upload/CTA text, Meta Preview OG-card mock (browser chrome + mini page + domain/title/description), milestone rewards (fixed 3/10/25 tiers, editable reward_label inputs, required validation), live preview real-time sync (headline/subheadline/ctaText/brandColor update on every keystroke), PoweredByFooter dark template border fix |
| 4.4   | ✅ done | Step 4: Qualification Decision — two-card choice UI (centered layout), arrow-only submit, PATCH + conditional navigation to /onboarding/4a or /onboarding/5                                                                                                                                                                                                                             |
| 4.5   | ✅ done | Step 4a: Configure Qualification Questions — dynamic form with add/edit/remove, tier-based cap (Free=2, Pro=5), required/optional toggle, example placeholder, PATCH + navigation                                                                                                                                                                                                       |
| 4.6   | ✅ done | Step 5: Email Setup + Launch — done (part of Epic 6, Story 6.3)                                                                                                                                                                                                                                                                                                                         |
| 4.7   | ✅ done | Success Screen — done (part of Epic 6, Story 6.4)                                                                                                                                                                                                                                                                                                                                       |

### Extra Work Done (Beyond Story Scope)

**Dark Template System (5 CSS tokens + 4 bug fixes):**

Tokens added to `globals.css` `@theme inline`:

- `--color-dark-template-bg: #1c1917` → use as `bg-dark-template-bg`
- `--color-dark-template-text: #faf8f4` → use as `text-dark-template-text`
- `--color-dark-template-secondary: rgba(250, 248, 244, 0.7)` → use as `text-dark-template-secondary` (PLACEHOLDER)
- `--color-dark-template-muted: #a8a29e` → use as `bg-dark-template-muted`, `text-dark-template-muted`
- `--color-dark-template-border: #57534e` → use as `border-dark-template-border`

Bug fixes applied:

1. MiniPreview `h-full w-full` — dark thumbnail now fills container
2. BrowserFrame `dark` prop — uses `data-theme="dark"` attribute + utility class names
3. DarkTemplate — all colors via utility class names (not `bg-[--color-*]` arbitrary values)
4. PoweredByFooter — `border-dark-template-border` for dark mode

**Bold Template Enhancements:**

- Headline: `text-h1` (hero size) instead of `text-h2`
- Input/button height: `h-11` (taller)
- Email input: `border-2 border-foreground` (strong dark border)
- Button: `font-semibold`, `px-8` (bolder, wider)

**Meta Preview (OG-card mock) — REQ-6.8.6:**
Structure: browser chrome header → headline + subheadline + mini email input + mini button → divider → domain + bold title + grey description

**Milestone Rewards — REQ-6.8.3 corrected:**

- Fixed tiers: "Refer 3 friends" / "Refer 10 friends" / "Refer 25 friends" (not editable)
- Editable reward_label inputs with contextual placeholders
- Validation: empty rewards block submit with inline errors

**Live Preview Sync:**

- Step 3 headline/subheadline/ctaText/brandColor all update right-pane LivePreview in real-time via `form.updateField` on every keystroke

**Back Links:**

- Removed from `TwoPaneLayout` in layout.tsx (was unused prop)
- Added to Step 2 (→ /onboarding/1) and Step 3 (→ /onboarding/2) pages individually, centered below submit button

### Next: Implement Remaining Stories

Implementation order:

1. ~~Story 4.0 — API routes, context, layout switching~~ ✅ Done
2. ~~Story 4.1 — Step 1 (Name Your Waitlist)~~ ✅ Done
3. ~~Story 4.2 — Step 2 (Choose Template)~~ ✅ Done
4. ~~Story 4.3 — Step 3 (Make It Yours)~~ ✅ Done
5. ~~Story 4.4 — Step 4 (Qualification Decision)~~ ✅ Done
6. ~~Story 4.5 — Step 4a (Configure Questions)~~ ✅ Done
7. **Story 4.6 — Step 5 (Email Setup + Launch)** ← NEXT
8. **Story 4.7 — Success Screen**

## Component Inventory

| File                                           | Component               | Status                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/ui/button.tsx`                     | Button                  | ✅ Done — 4 variants (primary/secondary/destructive/ghost), 3 sizes (sm/md/lg)                                                                                                                                                                                                                                                                              |
| `components/ui/card.tsx`                       | Card + 5 sub-components | ✅ Done — CardHeader, CardTitle, CardDescription, CardContent, CardFooter                                                                                                                                                                                                                                                                                   |
| `components/ui/input.tsx`                      | Input                   | ✅ Done — label, error, helperText, auto-ID, aria-invalid/describedby                                                                                                                                                                                                                                                                                       |
| `components/ui/badge.tsx`                      | Badge                   | ✅ Done — 6 variants (default/success/warning/error/info/outline)                                                                                                                                                                                                                                                                                           |
| `components/ui/toggle.tsx`                     | Toggle                  | ✅ Done — onCheckedChange, label, token-based styling                                                                                                                                                                                                                                                                                                       |
| `components/ui/select.tsx`                     | Select                  | ✅ Done — native select, placeholder, error/helperText                                                                                                                                                                                                                                                                                                      |
| `components/ui/textarea.tsx`                   | Textarea                | ✅ Done — label, error/helperText, resize-y                                                                                                                                                                                                                                                                                                                 |
| `components/share/share-copy-link.tsx`         | ShareCopyLink           | ✅ Done — Web Share API + clipboard, 2s confirmation                                                                                                                                                                                                                                                                                                        |
| `components/share/referral-link.tsx`           | ReferralLink            | ✅ Done — clipboard copy with execCommand fallback, 2s "Copied!" confirmation, unique URL display                                                                                                                                                                                                                                                           |
| `components/share/share-buttons.tsx`           | ShareButtons            | ✅ Done — Twitter URL, LinkedIn URL, Copy Link with execCommand fallback, 2s confirmation                                                                                                                                                                                                                                                                   |
| `components/share/powered-by-footer.tsx`       | PoweredByFooter         | ✅ Done — dark template border fix applied, scoped to Free tier                                                                                                                                                                                                                                                                                             |
| `components/onboarding/live-preview.tsx`       | LivePreview             | ✅ Done — 3 templates, BrowserFrame with dark mode (`data-theme`), desktop/mobile toggle, dark template tokens                                                                                                                                                                                                                                              |
| `components/layout/marketing-layout.tsx`       | MarketingLayout         | ✅ Done — Header (sticky, backdrop-blur, scroll border, logo image, mobile drawer) + Footer (warm ivory, 16px text)                                                                                                                                                                                                                                         |
| `components/marketing/hero.tsx`                | Hero                    | ✅ Done — conditional "Powered by" variant, text-display, Button CTA                                                                                                                                                                                                                                                                                        |
| `components/marketing/problem-section.tsx`     | ProblemSection          | ✅ Done — 3 cards, SVG icons, rounded-[10px], muted-foreground                                                                                                                                                                                                                                                                                              |
| `components/marketing/difference-section.tsx`  | DifferenceSection       | ✅ Done — single-column centered, accent overline, Sarah/James example                                                                                                                                                                                                                                                                                      |
| `components/marketing/comparison-section.tsx`  | ComparisonSection       | ✅ Done — white bg-card, ✗/✓ SVG marks, gap-4 list spacing                                                                                                                                                                                                                                                                                                  |
| `components/marketing/feature-grid.tsx`        | FeatureGrid             | ✅ Done — 2×2 grid, green SVG icons, centered max-w-4xl                                                                                                                                                                                                                                                                                                     |
| `components/marketing/confidence-section.tsx`  | ConfidenceSection       | ✅ Done — standalone callout, accent text, border-y                                                                                                                                                                                                                                                                                                         |
| `components/marketing/pricing-section.tsx`     | PricingSection          | ✅ Done — Free + Pro, aligned CTAs, ✓ checkmarks, flex-1 spacer                                                                                                                                                                                                                                                                                             |
| `components/dashboard/sidebar.tsx`             | Sidebar                 | ✅ Done — grouped nav sections (COMMAND CENTER/INSIGHTS/ENGAGEMENT/CONFIG), CONFIG pinned to bottom, active green pill (`rounded-[10px]`), locked/disabled states with tooltips, "Coming soon" labels, mobile overlay, upgrade CTA, dashed border ghost button, `tier` prop for conditional locking, gear icon for Settings, no ACCOUNT section, no signout |
| `components/dashboard/signup-chart.tsx`        | SignupChart             | ✅ Done — Recharts BarChart, 30d/All Time toggle, custom tooltip, horizontal scroll on mobile, skeleton loader                                                                                                                                                                                                                                              |
| `components/dashboard/qualification-panel.tsx` | QualificationPanel      | ✅ Done — question distribution bars, empty states (no questions / no answers), skeleton loader                                                                                                                                                                                                                                                             |
| `components/dashboard/top-referrers.tsx`       | TopReferrers            | ✅ Done — top 5 by quality score, anonymized emails, referral count badge, empty state CTA                                                                                                                                                                                                                                                                  |
| `components/dashboard/warmth-panel.tsx`        | WarmthPanel             | ✅ Done — 3 warmth bars (Hot/Warm/Cold), `"{n} subscribers"` meta (accent count, total>0 only), title `<Link>` whole-card overlay, `aria-hidden` "View all →", `waitlistId` prop, free = upgrade button; redesign 2026-09-25                                                                                                                                |     | `components/lib/cn.ts` | cn() | ✅ Done — clsx + tailwind-merge |

## Layout Structure

| File                                              | Purpose                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/app/layout.tsx`                              | Root layout — wraps children in `<MarketingLayout>`                      |
| `src/app/(marketing)/layout.tsx`                  | Passthrough `<>{children}</>`                                            |
| `src/app/(auth)/layout.tsx`                       | Passthrough `<>{children}</>`                                            |
| `src/app/onboarding/layout.tsx`                   | Split-pane layout — LocalOnboardingProvider outer, FlushGate for Phase B |
| `src/app/api/waitlist/route.ts`                   | POST (create) + PATCH (update) + GET (read) waitlist records             |
| `src/app/api/waitlist/check-slug/route.ts`        | GET slug availability check                                              |
| `src/app/api/subscribers/route.ts`                | POST (create subscriber, referral_code resolution)                       |
| `src/app/api/subscribers/[id]/route.ts`           | GET (single subscriber + referral_count)                                 |
| `src/app/api/subscribers/[id]/referrals/route.ts` | GET (referral list, founder ownership auth)                              |
| `src/app/dashboard/updates/page.tsx`              | Founder updates compose page — textarea + publish                        |
| `src/app/api/dashboard/chart/route.ts`            | GET (daily signup aggregation, 30d/all-time)                             |
| `src/app/api/dashboard/qualification/route.ts`    | GET (qualification answer distribution per question)                     |
| `src/app/api/dashboard/warmth/route.ts`           | GET (warmth score distribution: hot/warm/cold + total — no `unscored`)   |
| `src/app/api/dashboard/stats/route.ts`            | GET (total signups, referral %, today, warmth summary)                   |

## Testing

- **Framework:** Vitest 4.1.10 + happy-dom 20.11.1 + @testing-library/react 16.3.2 + @testing-library/user-event 14.6.1
- **Config:** `vitest.config.mts` — setup file `src/__tests__/setup.ts`
- **Test files:** 22+ files in `src/__tests__/` — badge, card, button, input, toggle, select, textarea, share-copy-link, thank-you-page, referral-link, share-buttons, referred-variant, dashboard-referral-column, subscribers-referral, subscribers-referrals, leaderboard-client, warmth (19 tests), email-events API (5 tests), email-event-log (7 tests), dashboard-sidebar, dashboard-sidebar-redesign (9), dashboard-tier-gating (3), dashboard-updates-compose (6), dashboard-settings (5), dashboard-empty-state (7), dashboard-stats (2)
- **E2E:** Playwright with `playwright.config.ts` — `tests/e2e/thank-you-flow.spec.ts` (2 tests)
- **Total tests:** 281 passing (≥270 target met)
- **Pre-existing failures (unrelated to Epic 11):** referred-variant, thank-you-page, csv-export — 5 tests failing
- **Critical fix:** happy-dom over jsdom (jsdom 30 has ESM issues on Windows)
- **Critical fix:** `@rolldown/binding-win32-x64-msvc` required explicit install for Vitest 4 on Windows
- **Critical fix:** `vitest.config.mts` uses `import { defineConfig } from "vitest/config"` (NOT `vite/config`) to avoid plugin import errors

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

## Brand

- **Logo:** `public/PreWaitlist-logo.svg`
- **Brand color (accent):** `#0f7a5e` (green)
- **Accent hover:** `#0d6b52`
- **Accent foreground:** `#ffffff`
- **Logo usage in nav:** `<Image src="/PreWaitlist-logo.svg" alt="PreWaitlist" width={140} height={28} priority />`
- **Sign-in link hover:** `hover:text-accent` (brand green)

## Standing Constraints

- **Growth tier ($29/mo) is OUT OF SCOPE for MVP.** Only Free and Pro tiers ship. All Growth-only features (automated warmth alerts, team member access, priority support, unlimited qual questions) are deferred to post-MVP. Every doc, code path, and UI must reflect Free + Pro only. Decision date: 2026-09-05.
- Domain `waitlist-build.vercel.app` acceptable for Sprint 1; proper domain needed by Sprint 2.
- Pre-commit hook (`simple-git-hooks` + `lint-staged`) active — all commits run ESLint + Prettier.
- Use `proxy.ts`, never `middleware.ts`.
- Never write user-facing copy — all Sprint 1 copy is reviewed.
- Never build real SPF/DKIM in Sprint 1 — UI only, stub backend.
- Never recreate `middleware.ts` — use `proxy.ts` for subdomain routing.
- Never introduce new accent colors, shadows, or gradients outside Design System v2.0 tokens.
- Branching: `main` = production, `dev` = development, `epic-1` = feature branch.
- Design-heavy epics must reference high-fidelity SVGs by file path.
- Every story has `status` field: `ready` → `in-progress` → `blocked` or `done`.
- **Never use inline styles (`style={{ ... }}`).** Use Tailwind utility classes and design system tokens from `src/app/globals.css` exclusively. All colors must reference CSS custom properties (`--color-*`), never hardcoded hex values. This applies to all new code and must be enforced during refactoring.
- **Platform is a tracker + notifier for milestone rewards, not a fulfiller.** Founder handles reward delivery. Only automatable: email notification + position boost for "skip the line". No Paddle integration, swag fulfillment, or webhook-based custom fulfillment.
- **Email is the primary engagement channel.** On-page updates are a secondary social-proof surface, not a primary engagement mechanism. Email nurture has 35-50% open rate, 5-12% CTR. On-page updates have zero proven engagement data. Every major waitlist platform (KickoffLabs, Viral Loops, Prefinery, LaunchList) uses email exclusively.
- **What is designed/previewed in onboarding MUST be EXACTLY what is shown on the public waitlist page.** Agent must REUSE the shared rendering component (`components/share/waitlist-template-content.tsx`). Never build a second implementation of template display. **[AMENDED 2026-09-30 — Epic 18 W1:** "EXACTLY" superseded — the preview is a **compact approximation** of the live page (`variant="preview"` vs `variant="live"` in the one shared renderer): content order + copy identical, scale differs (live is deliberately richer: hero scale, section rhythm, trust line + sample updates card now shown in preview). The reuse half of this rule is untouched — still one shared `WaitlistTemplateContent`, never a second implementation of template display.**]**

## Design System — Color Mapping (Design Spec → Tokens)

Design specs use hex values that don't always match the token system exactly. Map to the closest available token:

| Design Spec Hex       | Token                             | Tailwind Class                                      | Use Case                                   |
| --------------------- | --------------------------------- | --------------------------------------------------- | ------------------------------------------ |
| `#0F7A5E`             | `--color-accent`                  | `text-accent`/`bg-accent`                           | Brand green, CTAs, active dots             |
| `#1A1A1A`             | `--color-foreground`              | `text-foreground`                                   | Primary text, headings                     |
| `#DC2626`             | `--color-destructive`             | `text-destructive`                                  | Error states, validation errors            |
| `#6B6459`             | `--color-muted-foreground`        | `text-muted-foreground`                             | Secondary text, helper copy                |
| `#C3C2C2`             | `--color-muted-foreground`        | `text-muted-foreground`                             | Field labels, inactive dots                |
| `#CCC9C3`             | `--color-border`                  | `border-border`                                     | Input borders                              |
| `#E0DDD8`             | `--color-border`                  | `border-border`                                     | Dividers, separators                       |
| `#FAF8F4`             | `--color-background`              | `bg-background`                                     | Page background                            |
| `#FFFFFF`             | `--color-card`                    | `bg-card`                                           | Card/input backgrounds                     |
| `#1C1917`             | `--color-dark-template-bg`        | `bg-dark-template-bg`                               | Dark template page background              |
| `#FAF8F4`             | `--color-dark-template-text`      | `text-dark-template-text`                           | Dark template headline text                |
| rgba(250,248,244,0.7) | `--color-dark-template-secondary` | `text-dark-template-secondary`                      | Dark template secondary text (PLACEHOLDER) |
| `#A8A29E`             | `--color-dark-template-muted`     | `bg-dark-template-muted`/`text-dark-template-muted` | Dark template inactive elements            |
| `#57534E`             | `--color-dark-template-border`    | `border-dark-template-border`                       | Dark template borders                      |
| `#292524`             | `--color-dark-template-input`     | `bg-dark-template-input`                            | Dark template input fields                 |

**Gap notes:**

- `#6B6459` (warm grey) and `#C3C2C2` (light label grey) have no exact token match. Using `--color-muted-foreground` (#6b6b6b) as closest semantic equivalent. These may need dedicated tokens in a future design system update.
- Dark template secondary text color (`--color-dark-template-secondary`) is a PLACEHOLDER using `rgba(250, 248, 244, 0.7)`. Needs a real token decision from design.

## Epic 7 Progress (Public Waitlist Page)

| Story | Status  | Summary                                                                                                                               |
| ----- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 7.0   | ✅ done | SQL migration (subscribers table, RLS, functions), POST /api/subscribers, GET /api/leaderboard/[subdomain], GET /api/subscribers/[id] |
| 7.1   | ✅ done | `[subdomain]/page.tsx`, WaitlistPageContent, placeholder slots (updates, milestones, leaderboard CTA), PoweredByFooter                |
| 7.2   | ✅ done | Email Capture Form — email-only, honeypot, timestamp check, 2s minimum, 5/hour rate limit, position display, social proof counter     |
| 7.3   | ✅ done | Inline Qualification Questions — dynamic free-text questions, optional toggle, live preview sync                                      |
| 7.4   | ✅ done | Duplicate Email Handling — 409 status, "already on waitlist" message, position display for existing                                   |
| 7.5   | ✅ done | Public Leaderboard Page — rank/email/referral columns, sticky footer CTA, anonymized emails, mobile responsive, 13 ACs met            |
| 7.6   | ✅ done | Email-First Updates + Milestone Hybrid + Warmth Foundation + Doc Alignment — 36 ACs, 17 tasks, 4 work streams                         |
| 7.7   | ✅ done | Founder Updates Feed — LatestUpdateCard on public page, notify button in dashboard                                                    |
| 7.8   | ✅ done | Epic 7 Tests — LeaderboardClient component tests (101 lines, 3 ACs)                                                                   |

**Key architecture decisions (Story 7.6):**

- `WaitlistTemplateContent` is the shared rendering component for both preview and public page
- `EmailCaptureForm` uses raw HTML elements (not design system Input/Button) for exact preview match
- `anonymizeEmail` extracted to `src/lib/format.ts`
- `LatestUpdateCard` replaces full UpdatesFeed — shows only most recent update
- `milestones_earned` and `milestones_notified` columns on subscribers table for fulfillment tracking
- `src/lib/milestones.ts` handles threshold checks + congratulatory email dispatch
- Warmth tracking: `page_views` table, `view_count`/`unique_viewers`/`last_viewed_at` columns on waitlists
- `GET /api/warmth/[subdomain]` returns distribution breakdown (organic vs referred vs direct)
- Social proof counter is inline in `WaitlistTemplateContent` (not a separate component)

**Blocked items (resolved by Epic 10):**

- ~~Founder updates compose UI — no dashboard UI to create updates~~ — Still pending (no compose UI built)
- ~~Dashboard panels — deferred to Sprint 2 dashboard restructure~~ — Done (Epic 9)
- ~~"You're #12" position banner — needs viewer identification mechanism~~ — Still pending

**Branch:** `epic-7` (merged to `dev`, pushed)

## Epic 8 Progress (Thank-You & Referral Loop)

| Story | Status  | Summary                                                                                                                                                                                              |
| ----- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.0   | ✅ done | Thank-You Page Route — `[subdomain]/thank-you/page.tsx`, position display, referral link, share buttons, powered-by footer                                                                           |
| 8.1   | ✅ done | Referral Link & Share Buttons — `ReferralLink` + `ShareButtons` client components, clipboard copy with execCommand fallback, Twitter/LinkedIn share URLs                                             |
| 8.2   | ✅ done | Referral Tracking API — POST `/api/subscribers` accepts `referral_code`, resolves to UUID, validates (same-waitlist, no self-referral)                                                               |
| 8.3   | ✅ done | Referred Subscriber Variant — "Referred by" inline pill badge, referrer first name, ref param flow end-to-end                                                                                        |
| 8.4   | ✅ done | Dashboard Subscriber Referral Column — batch query, sort by referrals, 6-column table, Referrals header with ↑/↓                                                                                     |
| 8.5   | ✅ done | Epic 8 Tests — 31 tests (thank-you-page 5, referral-link 4, share-buttons 4, referred-variant 3, subscribers-referral 4, subscribers-referrals 3, dashboard-referral-column 4, thank-you-flow e2e 2) |

**Key architecture decisions (Epic 8):**

- `ReferralLink` and `ShareButtons` are separate client components (not combined into one)
- POST `/api/subscribers` accepts `referral_code` (8-char string) and resolves to `referrer_id` (UUID) server-side
- Self-referral is silently nullified (not 400 error) — safety net per Dev Notes, not a hard rejection
- `anonymizeEmail` in `src/lib/format.ts`: first char + `••••` + last char + `@domain`
- Dashboard referral counts: batch `.in("referrer_id", ids)` query, counts in memory via Map (2 queries total)
- `GET /api/subscribers/:id/referrals` enforces founder ownership via auth + waitlists join
- `SUBSCRIBER_SELECT` constant reused across POST and GET routes
- `update` method added to `supabase-mock.ts` for test support

**Branch:** `epic-8` (merged to `dev`, pushed)

## Epic 9 Progress (Dashboard Restructure)

| Story | Status  | Summary                                                                                                                                |
| ----- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 9.0   | ✅ done | Dashboard Layout Shell — left sidebar (268px, 8 nav items), active state (green pill), locked items, mobile hamburger, upgrade CTA     |
| 9.1   | ✅ done | Stat Cards with Real Data — Total Signups, Referral %, Today, Warmth (locked), em-dash for empty                                       |
| 9.2   | ✅ done | Subscriber Table Design Alignment — 4-column table (#, Email, Date, Referrals), search, sort, row click, empty state                   |
| 9.3   | ✅ done | CSV Export (Pro Tier) — client-side generation, correct filename, 7 headers                                                            |
| 9.4   | ✅ done | Subscriber Detail Page — auth check, back button, position/email/grid, referral code, referred list, qual answers, 404                 |
| 9.5   | ✅ done | Epic 9 Tests — 8 test files (sidebar, stat-cards, subscriber-table, csv-export, subscriber-detail, chart, qualification-panel, warmth) |
| 9.6   | ✅ done | Dashboard Remediation — MVP Gap Fill — chart, qual breakdown, quality scores, top referrers, warmth distribution, table enhancements   |
| 9.7   | ✅ done | Epic 9 Final Tests — 257 tests passing (≥250 target met)                                                                               |

## Epic 10 Progress (Public Waitlist Page & Onboarding Redesign)

| Story | Status  | Summary                                                                     |
| ----- | ------- | --------------------------------------------------------------------------- |
| 10.0  | ✅ done | Schema migration — `product_name` column on waitlists, API support          |
| 10.1  | ✅ done | Fix critical bugs — headless UI, hydration, preview styling                 |
| 10.2  | ✅ done | Accessibility fixes — ARIA, keyboard nav, focus management                  |
| 10.3  | ✅ done | Design system normalization — Tailwind canonical classes, token consistency |
| 10.4  | ✅ done | Public page layout redesign — product name/logo on public page + preview    |
| 10.5  | ✅ done | Onboarding field architecture — headline vs productName separation          |
| 10.6  | ✅ done | Name-it-later fix — deferred naming flow                                    |
| 10.7  | ✅ done | Inconsistency resolution — cross-story fixes, final cleanup                 |

**Branch:** `epic-10` (merged to `dev`)

## Epic 11 Progress (Warmth Tracking Engine)

| Story | Status  | Summary                                                                                                                                |
| ----- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 11.0  | ✅ done | Resend Webhook — `src/app/api/webhooks/resend/route.ts`, `src/lib/supabase/admin.ts`, Svix signature verification, idempotent events   |
| 11.1  | ✅ done | Warmth Calculation — `src/lib/warmth.ts` (score 0-100, signal weights, decay), `src/app/api/cron/warmth/route.ts` (daily batch recalc) |
| 11.2  | ✅ done | Warmth Column + Filter — Badge colors fixed (blue=cold, not red), column reordered                                                     |
| 11.3  | ✅ done | Warmth Distribution Panel — `components/dashboard/warmth-panel.tsx` rewritten (4 bars, skeleton, empty states)                         |
| 11.4  | ✅ done | Dashboard Warning State — `components/dashboard/warning-banner.tsx`, settings page enabled                                             |
| 11.5  | ✅ done | Warmth Score Decay — `src/__tests__/lib/warmth.test.ts` (19 tests), decay logic already in warmth.ts                                   |
| 11.6  | ✅ done | Email Event Log — `src/app/api/dashboard/email-events/route.ts`, `components/dashboard/email-event-log.tsx`, subscriber detail page    |
| 11.7  | ✅ done | Schema Migration — SQL at `docs/stories/sql-writeups/epic11-story7-sprint3-schema.sql`, 11 ACs verified                                |

**Branch:** `epic-11` (created from `dev` for Sprint 3)

**Key architecture decisions (Epic 11):**

- `src/lib/warmth.ts` — score calculation + tier assignment (hot ≥70, warm ≥40, cold >0, unscored = null) **[tier rule superseded 2026-09-25: baseline 70, no null tier — see Warmth Model Restructure block]**
- `src/lib/supabase/admin.ts` — service role client for webhook (bypasses RLS)
- Webhook uses `req.text()` (NOT `req.json()`) — Svix HMAC breaks if body re-serialized
- Cron endpoint protected by `CRON_SECRET` Bearer token
- Badge colors: hot = green `#0f7a5e` (`--color-status-hot`), warm = amber `#c7841a`, cold = blue `#3b6fa6` — **[AMENDED 2026-09-27:** founder flipped Hot back to green — coral read as danger/error instead of "going good". History: green (Epic 11/15 era) → coral 2026-09-25 → **green 2026-09-27**. Tokens in `globals.css` remain the source of truth.**]**
- `email_events.event_data` column added (jsonb, nullable) for full webhook payload storage

## Epic 12 Progress (Email System)

| Story | Status  | Summary                                                                                                  |
| ----- | ------- | -------------------------------------------------------------------------------------------------------- |
| 12.0  | ✅ done | Confirmation Email — `src/lib/email.ts` (email utility), fire-and-forget IIFE in subscribers route       |
| 12.1  | ✅ done | Position Recalculation — `src/lib/positions.ts` (RPC + getPositionUpdate), route.ts integration          |
| 12.2  | ✅ done | "You Moved Up" Email — moved-up trigger after `recalculatePositions()`, idempotent                       |
| 12.3  | ✅ done | Broadcast Email (Pro) — compose UI, Batch API + CAN-SPAM + unsubscribe + storage, `tier` prop on Sidebar |
| 12.4  | ✅ done | Warmth-Segmented Broadcast — segment selector (All/Hot+Warm/Cold), warmth_score filtering                |
| 12.5  | ✅ done | Email Customisation (Pro) — sender_name wired through `sendEmail()` with fallback chain                  |
| 12.6  | ✅ done | Email Infrastructure Separation — `sendingDomain` param added to `resolveFromAddress()` + all callers    |

**Branch:** `epic-12` (created from `dev`, all stories merged)

**Key architecture decisions (Epic 12):**

- `src/lib/email.ts`: `resolveFromAddress(senderName, productName, headline, stream, sendingDomain?)` + `sendEmail()` (never throws, returns `{ ok, id?, error? }`)
- `src/lib/positions.ts`: `recalculatePositions()` (RPC) + `getPositionUpdate()` — returns `PositionUpdate[]` with `spots_moved`
- Resend Batch API: `resend.batch.send([...])`, max 100/batch. Unsubscribe is **custom HMAC** (`generateUnsubscribeUrl`) + `List-Unsubscribe` / `List-Unsubscribe-Post` headers — **not** `{{{RESEND_UNSUBSCRIBE_URL}}}` (that merge tag requires Resend Audiences; PRD REQ-7.1a forbids Audiences). Corrected 2026-09-24 (Epic 17).
- CAN-SPAM: requires unsubscribe mechanism + physical postal address in footer for broadcast emails
- Sidebar (`components/dashboard/sidebar.tsx`): has `tier` prop (optional, defaults to "free"), Broadcast locked for free tier
- Tier stored in `founder_profiles.tier` (text, default 'free', check: 'free','pro','growth')
- Tier switching for testing: SQL in Supabase Dashboard: `UPDATE founder_profiles SET tier = 'pro' WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@gmail.com');`
- Warmth doesn't work locally: depends on Resend webhooks (need public URL) and cron `/api/cron/warmth` (needs Vercel schedule)

**Planning artifacts created:**

- `docs/epics/epic-12-email-system.md` — full epic document with 7 stories
- `docs/stories/completed/story-12.0-confirmation-email.md` through `story-12.6-email-infrastructure-separation.md` — 7 detailed story files (moved to completed/)

**All stories implemented and merged.** Code files exist: `src/lib/email.ts`, `src/lib/positions.ts`, `src/app/api/dashboard/broadcast/route.ts`, `src/app/dashboard/broadcast/page.tsx`, `src/app/dashboard/broadcast/client.tsx`.

## Dashboard Overhaul Decisions (2026-09-13)

### Epic structure: 12.1 + 12.2 before Epic 13

- **Decision:** Create Epic 12.1 (Dashboard Overhaul) and Epic 12.2 (Gap Fixes) between Epic 12 (Email System) and Epic 13 (Billing).
- **Reason:** Dashboard must be complete and legal compliance must be in place before monetization (Paddle billing) ships. Dashboard overhaul fixes 22 identified issues. Gap fixes cover Privacy Policy, ToS, consent, unsubscribe, bounce suppression — all required before sending marketing emails or processing payments.
- **Execution order:** Epic 11 → Epic 12 → Epic 12.1 → Epic 12.2 → Epic 12.3 → Epic 13

### Dashboard: 22 issues found across 7 categories

- **Decision:** Full dashboard overhaul with 11 stories covering sidebar redesign, empty state, stat cards, tier gating, mobile, updates compose, settings wiring, design tokens, bug fixes, data/performance, and tests.
- **Source:** `docs/completed/dashboard-overhaul-plan.md` (full audit), `docs/completed/sprint-gap-analysis.md` (MoSCoW rankings)
- **Key findings:** Sidebar confusing (8 flat items, disabled items with no explanation), empty state is misplaced onboarding content, stat cards show numbers without comparison context, mobile table overflow, tier gating inconsistent, dead buttons in settings, no founder updates compose UI, hardcoded colors not using design tokens.
- **Competitor research:** KickoffLabs ("addition by subtraction"), Waitlister (comparison indicators), SaaSUI ("comparison is the insight"), Linear (anti-patterns forbidden), Flowjam (onboarding checklists).
- **Date:** 2026-09-13

### Gap analysis: 13 must-have items for MVP

- **Decision:** 8 legal compliance items + 5 product gaps are must-have before MVP can ship.
- **Legal must-haves:** Privacy Policy, Terms of Service, consent checkbox, consent records, unsubscribe mechanism, physical address in emails, bounce suppression, DPAs with sub-processors.
- **Product must-haves:** Founder updates compose UI, archive waitlist, edit page after onboarding, Paddle dunning flow, settings danger zone.
- **Date:** 2026-09-13

## Epic 12.1 Progress (Dashboard Overhaul)

| Story   | Status  | Summary                                                                                                           |
| ------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| 12.1.0  | ✅ done | Sidebar Redesign — grouped nav sections, "Coming soon" labels, tooltips, upgrade CTA (dashed border ghost button) |
| 12.1.1  | ✅ done | Empty State Redesign — welcome heading, guidance steps, ghost stat cards, remove checklist                        |
| 12.1.2  | ✅ done | Stat Card Upgrades — comparison deltas, warmth summary, new `/api/dashboard/stats` endpoint                       |
| 12.1.3  | ✅ done | Tier Gating Consistency — WarmthPanel locked overlay, lock icon on stat card                                      |
| 12.1.4  | ✅ done | Founder Updates Compose UI — `/dashboard/updates` page, textarea, publish API                                     |
| 12.1.5  | ✅ done | Mobile Responsiveness Fix — table overflow, responsive grids, header wrap                                         |
| 12.1.6  | ✅ done | Settings & Bug Fixes — button tooltips, error handling, typos                                                     |
| 12.1.7  | ✅ done | Design Token Compliance — sidebar bg, warning tokens, chart colors                                                |
| 12.1.8  | ✅ done | Broadcast & Duplicate API Fixes — default "all", confirmation, shared warmth fetch                                |
| 12.1.9  | ✅ done | Data & Performance — cache headers, query optimization                                                            |
| 12.1.10 | ✅ done | Epic 12.1 Tests — 10 test files, 281 passing tests (≥270 target)                                                  |

**Planning artifacts:**

- `docs/epics/epic-12.1-dashboard-overhaul.md` — full epic document with 11 stories
- `docs/stories/story-12.1.0-sidebar-redesign.md` through `story-12.1.10-epic-tests.md` — 11 detailed story files

## Epic 12.2 Progress (Gap Fixes)

| Story   | Status  | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12.2.0  | ✅ done | Schema Migration — SQL executed in Supabase. All columns + bounced_emails table created                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 12.2.1  | ✅ done | Archive Waitlist — Archive/unarchive, confirm dialog, API PATCH, public page guard, sidebar banner                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 12.2.2  | ✅ done | Edit After Onboarding — 6 editable fields, useFieldSave hook, color picker, LivePreview                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 12.2.3  | ✅ done | Settings Page Overhaul — scope-first architecture: account settings at `/dashboard/settings`, waitlist settings at `/dashboard/[waitlistId]/settings`, two-tier sidebar nav. Restructured to three-level hierarchy: hub → waitlist list → waitlist detail. Profile extracted to `/dashboard/settings/profile`. Sidebar ACCOUNT section removed. Vertical card layout on hub.                                                                                                                                                                                                                                                                                                                                   |
| 12.2.4  | ✅ done | Privacy Policy — `/legal/privacy` static page, marketing footer link, PoweredByFooter link                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 12.2.5  | ✅ done | Terms of Service — `/legal/terms` static page, references privacy policy, both footers linked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 12.2.6  | ✅ done | Consent Tracking — checkbox in email capture form (both variants), API consent validation + IP capture **[REGRESSION 2026-09-30: shipped at `0d33bbb`, silently reverted by `afcdcf9` (checkbox/guard/validation removed, `consent_given_at` stamped unconditionally); restored by revenue plan Phase 6.4/6.8 with tests — see story/epic regression notes]** **[W3 2026-09-30 — Epic 18:** checkbox model then superseded same day — `components/public/consent-line.tsx` click-through line (verbatim approved sentence + `/legal/terms` + `/legal/privacy` links), no checkbox/guard/400; `consent_given_at` + `consent_ip_address` stamped unconditionally (provenance live). Tests inverted in 18.5.**]** |
| 12.2.7  | ✅ done | Unsubscribe Mechanism — HMAC tokens in emails, `/unsubscribe` page, send-time check, resubscribe                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 12.2.8  | ✅ done | Bounce Suppression — webhook inserts to bounced_emails, `isEmailBounced()` check, Bounced badge                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 12.2.9  | ✅ done | Physical Address in Emails — settings address field, email footer with address                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 12.2.10 | ✅ done | Epic 12.2 Tests — Verified complete (pre-existing settings tests). Moved to completed/                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 12.2.11 | ✅ done | PoweredByFooter Pro Removal — Verified complete (tier gate at line 122, template from data, standalone prop). Moved to completed/                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 12.2.12 | ✅ done | Dashboard Auto-Refresh — visibilitychange listener + 60s interval calling router.refresh() + refreshData(), 5 real tests (was 4 fakes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 12.2.13 | ✅ done | Subscriber Display Name — display_name column (SQL ready), name input on email-capture-form, API insert, dashboard+leaderboard display, 8 tests (was 5 stubs)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

**Planning artifacts:**

- `docs/epics/epic-12.2-gap-fixes.md` — full epic document with 14 stories, Dev Notes annotated with implementation status
- `docs/stories/story-12.2.0-schema-migration.md` through `story-12.2.13-subscriber-display-name.md` — 14 detailed story files
- `docs/stories/sql-writeups/epic12.2-story0-bounced-emails.sql` — SQL executed in Supabase

**Key architecture decisions (Stories 12.2.7–12.2.9):**

- **Unsubscribe:** HMAC-SHA256 tokens (`subscriberId.hmac`) in URLs. `generateUnsubscribeUrl()` in `src/lib/unsubscribe.ts`. **Broadcast + transactional** both use custom HMAC links (`buildBroadcastEmailFooter` / `buildEmailFooter`) — **not** Resend `{{{RESEND_UNSUBSCRIBE_URL}}}` (Audiences-only; never use Audiences per REQ-7.1a). Corrected 2026-09-24 (Epic 17).
- **Send-time checks:** `isUnsubscribed()` + `isEmailBounced()` called before every email send (confirmation, moved-up). Uses `createAdminClient()` to bypass RLS in fire-and-forget IIFEs.
- **Bounce classification:** `determineBounceType()` in webhook route — hard bounces (invalid address, domain not found) are permanent, soft bounces retry after 24h. Complaints treated as hard bounces.
- **`bounced_emails.email_type`:** Always "transactional" for webhook captures. Broadcast emails are handled by Resend's built-in unsubscribe.
- **Physical address:** Configurable per waitlist via `business_address` column. Falls back to default PreWaitlist address. Used in `buildEmailFooter()` for transactional emails. Broadcast route already has hardcoded address (separate CAN-SPAM footer).
- **Webhook partial:** Resend webhook already captures bounce events to `email_events` — needs to also insert into `bounced_emails` (once table exists).
- **PoweredByFooter bug:** Leaderboard page renders footer for ALL tiers with hardcoded template — needs tier gate + correct props.
- **Dashboard static:** Zero auto-refresh mechanisms — `router.refresh()` on focus + 60s interval recommended.
- **Display name missing:** PRD planned "What should we call you?" field on thank-you page — never implemented. Needs schema column + API + auto-save component.

## Epic 12.3 Progress (Dashboard Section Pages)

| Story  | Status  | Summary                                                                                           |
| ------ | ------- | ------------------------------------------------------------------------------------------------- |
| 12.3.0 | ✅ done | Unlock Sidebar Nav Items — remove "Coming soon", set hrefs, create placeholder pages              |
| 12.3.1 | ✅ done | Dashboard Leaderboard Page — ranked subscribers, referral count, pagination                       |
| 12.3.2 | ✅ done | Dashboard Qualification Page — question-by-question answer breakdown, bar charts                  |
| 12.3.3 | ✅ done | Dashboard Warmth Page — distribution summary, per-subscriber warmth, Pro tier gate                |
| 12.3.4 | ✅ done | Epic 12.3 Tests — leaderboard, qualification, warmth, sidebar unlock tests                        |
| 12.3.5 | ✅ done | Dashboard Shared Layout & Navigation Fix — layout.tsx + shell.tsx, strip sidebar from all clients |

**Planning artifacts:**

- `docs/epics/epic-12.3-dashboard-section-pages.md` — full epic document with 6 stories
- `docs/stories/story-12.3.0-unlock-sidebar-nav.md` through `story-12.3.4-epic-tests.md` — 5 detailed story files

**Key architecture decisions (Story 12.3.5):**

- `src/app/dashboard/layout.tsx` — server layout, fetches auth + waitlist + tier, renders `DashboardShell`
- `src/app/dashboard/shell.tsx` — client component, renders Sidebar + hamburger + `<main>` wrapper
- Next.js App Router layout persists across `/dashboard/*` routes — Sidebar stays mounted, only children swap
- Sidebar, hamburger, isSidebarOpen, handleSignOut removed from all 7 section client components
- `waitlistName`/`logoUrl` removed from all section page props (layout handles these)
- `loading.tsx` fixed — no more embedded sidebar skeleton (was causing double-sidebar during loading)
- Each page still does its own auth + data fetch (redundant with layout, harmless, not optimized)

## Epic 13 Progress (Billing & Feature Gating)

| Story | Status  | Summary                                                                 |
| ----- | ------- | ----------------------------------------------------------------------- |
| 13.0  | ✅ done | Paddle Integration Foundation — SDK install, checkout API, webhook      |
| 13.1  | ✅ done | Upgrade Modal (7 Triggers) — modal component, cooldown, 4/7 triggers    |
| 13.2  | ✅ done | Feature Gating Enforcement — isPro, requirePro, server+client gates     |
| 13.3  | ✅ done | Billing Management — portal session API, subscription-card, cancel flow |
| 13.4  | ✅ done | 500 Subscriber Cap — API check, public page warnings, progressive tiers |
| 13.5  | ✅ done | Sender Domain Auth — Resend API, 3-step wizard, DNS records + verify    |
| 13.6  | ✅ done | Epic 13 Tests — 23 new tests (billing, webhook, modal, cap, gating)     |

**Branch:** `epic-13` (created from `dev`)

## Epic 14 Progress (Qualification Engine Fix)

**Status:** **All 5 stories done (14.0–14.4).** 14.0–14.3 implemented, audited (Prompt #3, 2026-09-24) and **committed** — `ec42cf6` (14.0/14.1 + audit fixes), `d3843f0` (stories 14.2/14.3), `e51dcc6` (dashboard design redesign), `25d99f1` (brand accents). 14.4 implemented 2026-09-25 (CSV qual columns + RFC4180 escaping, question-cap/csv-export/AC5-default-waitlist tests, dead props + `qual_answers` select cleanup, PRD/audit/story doc sync) — **uncommitted**. Branch: `dev` (no epic branch, **not pushed**). Epic doc + story files updated to `done`.

| Story | Status  | Summary                                                                                                                                                                                                                                                                                                                                                                                           |
| ----- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14.0  | ✅ done | Schema + migration + server caps + privacy — options jsonb, remap/drop, RLS: revoke anon SELECT + drop public policy, cap checks, normalizeQuestions, GET shape, leaderboard route deleted                                                                                                                                                                                                        |
| 14.1  | ✅ done | Question builder + public capture — type selector, options editor, tier badge/upsell, id-keyed answers, AC11 id sanitization, dark-template fixes                                                                                                                                                                                                                                                 |
| 14.2  | ✅ done | Settings question editor — shared `components/onboarding/question-editor.tsx`, qualification tab in `[waitlistId]/settings`, id-preserving PATCH, "Edit questions" primary CTA                                                                                                                                                                                                                    |
| 14.3  | ✅ done | Qualification dashboard redesign — id-keyed aggregation, `variant="page"/"overview"` panel, meta line, 2-col question cards, type chips, ordinal badges, shared Panel shell                                                                                                                                                                                                                       |
| 14.4  | ✅ done | CSV/tests/cleanup — CSV qual columns + RFC4180 escaping (+subdomain filename fix), question-cap & csv-export & AC5 default-waitlist tests, dead props removed from waitlist-page-content, `qual_answers` drop from overview select, PRD §7.4 `options jsonb`, audit §1 Epic 14 pointer, story 7.3 AC6 note; Prompt #3 audit fixes (subscriber detail id→question_text labels, redirect mock type) |

**Qualification design additions (2026-09-24, commits `e51dcc6` + `25d99f1`) — documented in epic/story Dev Notes:** shared `components/dashboard/panel.tsx` shell (`Panel`/`PanelHeader`/`panelChrome`) unified the overview zones (signup chart, warmth, top referrers, qualification teaser); qualification panel gained `variant="page" | "overview"` — page = meta line `N respondents · M questions` + 2-column question-card grid, overview = titled **"Qualification Breakdown"** + max-2 teaser + "View all →" **[AMENDED 2026-09-27:** max-2 teaser replaced — overview shows all questions; 1–2 stacked unchanged, 3+ in a bounded `@container` grid (1-col <300px / 2-col ≥300px / 3-col ≥440px) with `line-clamp-1` tooltips and silent answer caps (top 2, top 1 at 5Q) to hold the 2-question card height. Decisions D1–D4 (3-across / silent cap / stack on narrow / cap grid-mode only).**]**; non-empty `<h1>Overview</h1>` on overview; **brand accents** (accent green `#0F7A5E`, founder decision: white cards + smart accents): ordinal badges `bg-accent/10 text-accent`, accent "View all" links (teaser + TopReferrers), solid-accent "Edit questions" CTA, stat-delta tones (up `text-accent` / down `text-destructive` / flat muted), respondent counts ("N respondents" meta line + per-card) `text-accent`. `dashboard-design-guide.md` §9 Color Rules #2–#4 amended to sanction these; white-card rule unchanged. Founder copy approved verbatim: "Overview", "Qualification Breakdown", "N respondents · M questions" pattern.

**Artifacts:** `docs/epics/completed/epic-14-qualification-engine-fix.md`, `docs/stories/completed/story-14.0-*` through `story-14.4-*`, `docs/stories/sql-writeups/epic14-story0-qualification-schema.sql`

**Deploy gate:** founder must run `epic14-story0-qualification-schema.sql` in Supabase SQL Editor BEFORE deploying (adds `options jsonb`, remaps answers, drops `required`? — no, CHECK kept / no `required` col existed; drops public SELECT policy on subscribers, revokes anon SELECT, grants authenticated SELECT).

**Prompt #3 audit fixes (committed in `ec42cf6`, 2026-09-24):**

1. `src/lib/milestones.ts` — switched `createClient()` → `createAdminClient()` (public POST /api/subscribers referral path; anon SELECT/UPDATE on subscribers dies after migration revoke).
2. `src/app/unsubscribe/page.tsx` + `src/app/unsubscribe/resubscribe/page.tsx` — switched to `createAdminClient()` (`.update().select()` RETURNING needs SELECT privilege; HMAC token verified before DB access so authz unchanged).
3. `components/public/email-capture-form.tsx` — MC fieldset now dark-aware (`inputBorder`/`inputBg` instead of hardcoded `bg-card border-border`); `(optional)` spans + "No spam" footer use `isDark ? text-dark-template-muted : text-muted-foreground`; question/label text uses `inputText`. Matches LivePreview `cardBorder`/`cardText`.

**Gates after fixes:** lint 0 errors (5 pre-existing warnings), clean build success (deleted `.next` first), full suite **442 passed / 8 failed = exact baseline** (dashboard-archive 4, dashboard-subscriber-table 3, flaky billing 1), targeted 34/34 (unsubscribe, unsubscribe-page, subscribers-referral, subscribers, email-capture-form).

**Key decisions / gotchas (Epic 14):**

- Anon has NO public UPDATE policy on subscribers (only "founders manage own" + public read, and 14.0 drops the public read) → all public-page server code paths must use `createAdminClient()` with explicit column selects.
- `revoke select on subscribers from anon` also breaks anon `UPDATE...RETURNING` (Postgres requires SELECT privilege for RETURNING columns).
- COPY GAP resolved for 14.1: `Free text` | `Multiple choice`, `PRO — 5 questions max`, `FREE — 2 questions max`, placeholders `Option 1`/`Option 2…`, no helper text under type selector. 14.2/14.3 copy resolved 2026-09-24 — founder approved verbatim: "Overview", "Qualification Breakdown", "N respondents · M questions" pattern; "Edit questions" label pre-existing (12.3.2 test).
- GET question shape is breaking → 14.0 + 14.1 ship same release train.
- Dashboard qualification API (`src/app/api/dashboard/qualification/route.ts`) still text-keyed — **fixed in 14.3** (id-keyed aggregation, `respondentTotal`, type/options).
- Epic 16.8 also claims deleting `src/app/api/leaderboard/[subdomain]/route.ts` — already deleted in 14.0; coordinate to avoid double-delete conflict.
- Mock helper: `vi.clearAllMocks()` does NOT clear `__queue`/`__calls` — clear manually in beforeEach; `after()` mock executes sync so email IIFEs consume admin queue items after insert.
- Resolved during 14.4 (2026-09-25): `src/app/api/subscribers/[id]/route.ts` PATCH display_name already uses `createAdminClient()` (line 76, with 14.0 AC8 comment) — no anon-SELECT gap; earlier flag was stale.
- Known deferred: Pro-at-cap shows upgrade button (no AC forbids); audit items outside Epic 14 (REQ-6.10.3 placeholder copy, 12.1.9 AC3 aggregation full-table load, 9.6/9.7 AC24 expandable row, dashboard **overview** default waitlist still oldest-first — see audit §1 pointer).

## Epic 15 Progress (Warmth Engine Fix & Hardening)

**Status:** ✅ ALL 6 STORIES DONE — manual gates closed with live verification 2026-09-27. Epic + story files marked `done` and moved to `completed/`. Code committed on `dev`/`main` (`c617e02` cron, `e2aeeb5` restructure, webhook hardening). Gates closed: **15.1** — founder confirmed Vercel → Cron Jobs shows `/api/cron/warmth` (AC3) + authenticated prod invoke `200 {"processed":9,"hot":9,"warm":0,"cold":0}` (AC4); **15.2** — SQL gate proven live (duplicate insert → `409/23505 email_events_svix_uidx`; `email_type='transactional'` accepted → FK `23503`, not CHECK `23514`); all webhook prod probes 401/401/200. Probes left zero residue.

| Story | Status  | Summary                                                                                                                                                                                                                          |
| ----- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 15.0  | ✅ done | Warmth scoring core — signals click+5/referral+15/qual+8, clicked-only decay + signup fallback, day ≥60 boundary, force-Cold on engaged-zero, batch pagination                                                                   |
| 15.1  | ✅ done | Cron — `vercel.json` `0 5 * * *` UTC + `CRON_SECRET`; **verified 2026-09-27**: Vercel Cron Jobs confirmed (founder) + prod invoke `200 {processed:9,...}`                                                                        |
| 15.2  | ✅ done | Webhook hardening — 401/401/200 live-probed on prod; svix unique index + `bounced_emails` CHECK widen **proven live 2026-09-27** (23505 / 23503 discrimination)                                                                  |
| 15.3  | ✅ done | Segments API — `?wid=` + `.maybeSingle()`, `requirePro` before lookup, unsub-excluded eligible counts                                                                                                                            |
| 15.4  | ✅ done | Warmth display + copy — Hot bars `bg-accent` (**founder reverted to `bg-status-hot` 2026-09-25** — tokens are source of truth), warning banner props-only (no free fetch), cold-% settings copy, `if (waitlist_id)` client guard |
| 15.5  | ✅ done | Tests — 24 new (webhook-resend 7, cron-warmth 3, warmth-panel 5, warning-banner 5, dashboard-segments 4)                                                                                                                         |
| 15.6  | ✅ done | Docs/vision/memory sync — Epic 11 stories patched, vision opens claims amended, MEMORY block, audit §2.4/§2.9 annotated, epic-11 index flipped                                                                                   |

**Decisions (2026-09-25):**

- Dropped `email_reply` (+10) and `leaderboard_visit` (+5) warmth signals — Resend emits no reply event and `page_views` is never written. Scored signals: click +5, referral +15, qualification answers +8.
- Decay uses **clicked-only** last engagement with `subscribers.created_at` fallback; windows 0–59 free / 60–89 −25 / 90+ → 0. Boundary is `daysSince >= 60` (day 59 not penalized).
- ~~Score 0 **with** lifetime engagement (clicks/referrals/qual) → **Cold**, never Unscored; Unscored only when never engaged (`assignTier(score, hadEngagement)`)~~ — **overturned 2026-09-25 by the warmth restructure** (below): Unscored removed entirely, `hadEngagement` deleted, everyone starts Hot.
- Cron scheduled in `vercel.json`: `{ "path": "/api/cron/warmth", "schedule": "0 5 * * *" }` (UTC 05:00, Bearer `CRON_SECRET`) — Standing Decision 6.
- Warmth badge + tier filter live on `/dashboard/warmth` only — no subscriber-table column (Story 11.2 surface corrected in 15.6).
- Opens never enter the warmth score (Apple MPP) — product vision amended in 15.6 (`:130`, `:150`, `:211`, `:414`, `:477`).
- ~~**Hot = `--color-status-hot` (coral `#d0492f`) everywhere — bar, badge, numbers (founder override 2026-09-25).** The Epic 15.4 "align Hot to `bg-accent` green" decision (Standing Decision 8) is overturned; `globals.css` tokens are the source of truth, never accent-green for Hot.~~ **[AMENDED 2026-09-27:** founder decision — Hot is green again: `--color-status-hot: #0f7a5e` (same green as accent/success), flipped in `globals.css` so every `status-hot` surface (bar, badge, numbers, marketing) follows. Coral `#d0492f` lasted 2 days — it read as danger/error instead of "going good". Classes stay `bg-status-hot`/`text-status-hot` (token value change, not `bg-accent`); tokens remain the source of truth.**]**

**Gotchas:**

- Referral batch counting: `.in("referrer_id", pageIds)` counts referrals **made by** the page's members, not referrers **of** them (cross-page credit).
- Day boundary: `daysSince >= 60` — use `>= 60`, never `>= 59` (the pre-15.0 bug).
- Settings `warning-threshold` helper is the **cold-% warning** (range 20–80), not a score cutoff.
- Segments API needs `?wid=` **and** `requirePro` — tier gate runs before waitlist lookup (Free + bad wid → 403, not 404).
- `/api/dashboard/warmth` returns 400 without `waitlist_id` — the dashboard client fetch is guarded by `if (waitlist_id)`.
- Test baseline after restructure (2026-09-25): 535 total, 528 pass / 7 fixed failures (dashboard-archive 4, dashboard-subscriber-table 3) — was 527/520/7 before +8 restructure tests.

## Warmth Model Restructure (2026-09-25) — Unscored Removed, Baseline 70

**Plan:** `docs/completed/dashboard-warmth-redesign-plan.md` (approved; Sections 0-5) · **Executed:** 2026-09-25 via Prompt #2, uncommitted, branch `dev`.

**Decision (founder):** "the unscored functionality is to be removed and everyone starts from hot and they go cold based on activity."

**Model:** `score = clamp(70 + clicks×5 + referrals×15 + qual×8 − decay, 0, 100)` · `Tier = "hot" | "warm" | "cold"` (never null) · baseline 70 = Hot at signup · decay windows unchanged (0–59 free / 60–89 −25 / 90+ → 0) · thresholds unchanged (≥70 Hot / ≥40 Warm) · recency clock = max(last click, latest referred signup, own signup) — **any meaningful action** resets decay.

**Overturns:** Epic 15 Standing Decision 3 (engaged-zero → Cold / Unscored = never engaged) + ACs in Stories 11.1 (AC6/7), 11.2 (AC2/3), 11.3 (AC1/4), 12.3.3 (AC2/5), 15.0 (AC4/7), 15.1 (AC4), 15.4 (AC1/5), 15.5 (AC5), Epic 17 (AC3/7) — annotated in epic/story docs, not silently rewritten. Vision already said "three states" — aligns code back to vision (v4.3 bump).

**Implementation:**

- `src/lib/warmth.ts` — `BASELINE=70`; `assignTier(score)` no null; `scoreSubscriber` returns `{score, tier}` (dropped `hadEngagement`); `calculateDecay(events, referralActivityAt, fallbackDate)`; batch returns `{processed, hot, warm, cold}`, referral fetch `referrer_id, created_at`.
- `POST /api/subscribers` — `baseInsert.warmth_score = "hot"` (R5).
- `GET /api/dashboard/warmth` → `{hot, warm, cold, total}` (no `unscored`); cron passthrough.
- **Deleted:** `src/app/api/warmth/[subdomain]/` + its test (R8 orphan).
- UI: WarmthPanel redesign (3 bars, accent `"{n} subscribers"` meta ≤ total>0, title `<Link>` + `after:absolute` overlay, `aria-hidden` "View all →", `waitlistId` prop, value colors `text-status-*`); warning-banner/client/warmth-page/warmth-client drop `unscored`; null badge → Hot (defensive); warm page Last Engagement includes referral `created_at`.
- **Switcher fix (same plan):** success CTA `<Link>` → `<a>` (Fix A); shell self-heal `router.refresh()` once per unknown `?wid` (Fix B).
- **SQL gate (founder-run, safe any time — DEFAULT-first):** `docs/stories/sql-writeups/warmth-restructure-no-unscored.sql` (DEFAULT 'hot' → backfill NULL → NOT NULL).

**Gates:** lint 0/5; targeted 79/79; full suite 535 = 528 pass / 7 fail (identical 7 verified pre-existing on clean HEAD via stash); clean build exit 0 (must delete `.next` first — stale `validator.ts` referenced the deleted route).

## Epic 16 Progress (Leaderboard & Founder Updates Engine Fix)

**Status:** in-progress — 16.0 done, 8 stories remaining. Branch `engine-fix-leaderboard-updates` (from `dev`).

| Story | Status   | Summary                                                                                                                                                                                                                                                                                                                                                  |
| ----- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 16.0  | ✅ done  | Updates API Send Path Hardening — optional `waitlist_id` (400 on 2+ without), server min-10, unsub/bounce suppression, `escapeHtml` in `email.ts`, per-recipient `buildBroadcastEmailFooter`, chunked `batch.send` ≤100 inside loop, 201 `{ id, emailSent, emailError }`, `sent_at` iff ≥1 chunk sent, full post-insert phase wrapped (no orphan insert) |
| 16.1  | ✅ done  | Updates Client Publish Flow + Honest Status (COPY GAP U6 gate)                                                                                                                                                                                                                                                                                           |
| 16.2  | ✅ done  | LatestUpdateCard Dark Template                                                                                                                                                                                                                                                                                                                           |
| 16.3  | ✅ done  | Founder Updates Tests (zero API update tests exist today)                                                                                                                                                                                                                                                                                                |
| 16.4  | ✅ done  | Dashboard Leaderboard Sort Fix (test at `dashboard-leaderboard-page.test.tsx:99-112` certifies the bug)                                                                                                                                                                                                                                                  |
| 16.5  | ✅ done  | Dashboard Leaderboard Pagination (PAGE_SIZE=10)                                                                                                                                                                                                                                                                                                          |
| 16.6  | ✅ done  | position_boost Schema Migration (**founder-run SQL** before 16.7)                                                                                                                                                                                                                                                                                        |
| 16.7  | ✅ done  | Skip-the-Line Durable Position Boost                                                                                                                                                                                                                                                                                                                     |
| 16.8  | ⬜ ready | Cleanup, Label & Doc Amendments (orphan leaderboard API delete, Share % COPY GAP, doc fixes)                                                                                                                                                                                                                                                             |

**16.0 implementation notes:**

- `src/app/api/updates/route.ts` rewritten: array waitlist fetch (`.eq("founder_id")` always + optional `.eq("id")`), `<10` → 400, select `id, email, unsubscribed_at` + `createAdminClient()`/`isEmailBounced` loop (mirrors `broadcast/route.ts:84-92`), `safeText = escapeHtml(text)` in HTML (raw `text` kept for plain-text payload), per-subscriber footer built inside `batch.map` (broadcast pattern), `resend.batch.send` once per ≤100 chunk **inside** loop (flatten bug removed), inner try wraps map+send (footer/`generateUnsubscribeUrl` throw caught — missing `UNSUBSCRIBE_SECRET` can't orphan insert), outer try wraps eligibility→send→`sent_at`.
- `src/lib/email.ts` + `escapeHtml` (`& < > " '`, `&`-first). `buildEmailFooter` still used by milestones/subscribers routes — not orphaned.
- Response: `emailSent` true iff ≥1 chunk succeeded; `emailError` null when sent, else last error (zero-eligible → "No eligible recipients"). `emailError` strings are API-level — **U6 COPY GAP gate applies in 16.1** if surfaced.
- `tags` (`waitlist_id`/`subscriber_id`) preserved on every payload — warmth webhook attribution (15.2).
- Gates: lint 0 errors/5 pre-existing warnings; `pnpm build` success. No tests added (16.3 owns). Client still sends `{ body }` only — multi-waitlist fix usable only after 16.1 (same release train).

## Milestone Engine Hardening — Prompt #8 Investigation (2026-09-28)

**Status:** Phases 1–6 complete, all gates green (643 tests / 7 baseline fails, lint 0/5, prettier clean, clean build). **Uncommitted on `dev`** with Epic 17 + warmth redesign.

**Root cause framing:** happy path was correct vs Story 7.6 AC8/AC13-16; defects were all silent-failure paths + validation gaps.

**Fixes (founder-approved copy, 2026-09-28):**

- **F1 — `src/lib/milestones.ts`:** update-result checked (dup email aborts, no send), `sendEmail {ok:false}` logged, `isUnsubscribed`/`isEmailBounced` suppression (email-only — earned/boost still persist), `idempotencyKey: milestone/{subscriberId}/{threshold}`, "Share & Move Up" button on congratulatory email (existing copy + `https://{subdomain}.prewaitlist.com?ref={code}` link), tier/subscriber/waitlist query errors logged.
- **F2 — thank-you progress line:** `nextTier = rewards.find(r => r.threshold > referralCount)` — hides when all tiers passed (fixed "12 of 3"); no all-earned copy (hidden-state only, per founder).
- **F3 — step-3 client validation** (`onboarding/3/page.tsx`): `Threshold must be a whole number greater than 0` + `Each tier needs a unique referral count` + existing empty-label errors; blocks submit.
- **F4 — `api/waitlist/route.ts` `validateMilestoneRewards()`:** shared validator, runs in POST before waitlist insert AND in PATCH **before delete-then-insert** (the wipe-on-bad-input path) → 400. `[]` valid (toggle off). Copy: the two approved strings + existing `Reward for "Refer N friends" is required`.
- **F6 — skip-the-line helper caption** under step-3 tier inputs (approved verbatim): `Add "skip the line" to a reward to move that subscriber to #1 when they earn it`.
- **F7 — subscriber detail** (`dashboard/subscribers/[id]/page.tsx`): `milestones_earned` selected + "Milestones earned" card (hidden when empty; `threshold → label` + earned date).
- **Tests:** waitlist-multi 16 (5 new: POST threshold/dup, PATCH threshold/dup-before-delete, empty-array ok), milestones 11, thank-you 13, subscriber-detail 16 (1 new content assert).

**Founder decisions (all 5, 2026-09-28):** approved copy above · skip-the-line helper copy approved · pending rewards = minimal subscriber-detail section (PRD REQ-6.8.3 dashboard expansion NOT built) · **public leaderboard milestone badges = docs-only (Story 16.8 AC5 / Standing Decision L5 — no code)** · thank-you all-earned = hide progress line only.

**Still open:** founder must run `epic16-story6-position-boost.sql` before deploying 16.7; COPY GAP L3/U6/B7; milestone engine changes uncommitted.

## Moving-Up Engine Investigation — Prompt #8 (2026-09-28)

**Status:** Phases 1–6 complete. Code fixes + tests + doc amendment done, **uncommitted** on `dev` alongside milestone hardening. Founder copy/product questions pending (below).

**Root cause (bug 1 — dead trigger):** `src/app/api/subscribers/route.ts` condition used `getPositionUpdate(updates, data.id)` = the NEW subscriber's update (fresh insert has temp `position = 1` → `spots_moved` always ≤ 0) → moved-up email NEVER fired since Story 12.2. The **spec itself** (`story-12.2-moved-up-email.md:172-173`) prescribed the wrong variable (annotated AMENDED 2026-09-28). Fixed: `referrerUpdate = resolvedReferrerId ? getPositionUpdate(updates, resolvedReferrerId) : null`; condition `referrerUpdate && referrerUpdate.spots_moved >= 1 && resolvedReferrerId` (the explicit referrer id check is required for TS narrowing); all 4 in-block usages (email params, idempotency key, event_data) now read `referrerUpdate`.

**Root cause (bug 2 — template leak):** moved-up send passed `customSubject: waitlist.email_subject` / `customBody: waitlist.email_body` — but step 5 saves those fields for EVERY launched waitlist ("Customise your confirmation email"), so the first live moved-up email would have been a duplicate confirmation. Removed → moved-up always uses `buildMovedUpEmail` defaults.

**Rank engine verified correct:** RPC order `position_boost DESC` (if 16.6 SQL run) → `referral_count DESC` → `created_at ASC`; called synchronously on every signup; boost flag set before recalc ✓; monotone-rank property means fixed trigger fires exactly once per genuine gain (no spam path).

**Known divergences left as founder decisions:** (a) both leaderboards compute rank in JS from referral count only — ignore `position_boost` (skip-the-line winners show higher real position than leaderboard rank); (b) zero founder-facing onboarding copy mentions moved-up/milestone congratulation emails (only `pricing-features.ts:15` marketing list); (c) moved-up default template never ran in production — if founder wants sprint-3 spec wording ("🎉 You moved up!") instead of code default ("You moved up to #5 for X!"), that's a copy approval.

**Founder decisions (2026-09-28, all 3 answered):** (a) moved-up template → **sprint-3 spec S4 wording implemented** (`🎉 You moved up {n} spots!` subject/heading, spec body lines 1-4, CTA `Share your link`, footer line `You received this because you're on the {product_name} waitlist.`; spot/spots inflection kept; personal greeting + custom subject/body params REMOVED from `buildMovedUpEmail`); (b) leaderboards → **boost-first sort shipped** (both public + dashboard pages: `position_boost DESC → referral_count DESC → created_at ASC`, mirroring the RPC; PGRST204 fallback drops `position_boost`/`display_name` per missing-column so pages survive until `epic16-story6-position-boost.sql` runs); (c) founder awareness copy → **approved verbatim + shipped**: step-5 Free bullets `Moved-up email` + `Milestone emails`, step-3 milestone description `Subscribers get a congratulation email when they hit a milestone — and any reward with "skip the line" moves them straight to #1.` (renders via `&mdash;`/`&quot;` entities). Step-3 sub-counter + milestone sections restructured into `rounded-xl border bg-card p-4` cards, unified `h-10` inputs, `items-end` row alignment (no more `mt-6` hacks).

**Tests:** `src/__tests__/api/subscribers-referral.test.ts` +3 (fires & sends spec subject to referrer · spots_moved=0 → no send · no referrer → no send). Mock gotcha discovered: **all `after()` IIFEs dequeue from the admin mock queue at REGISTRATION time** (confirmation → moved-up-referrer → cap-warning), not at await-resume — queue fixtures must include a slot for the 90%-cap IIFE between moved-up referrer and moved-up waitlist items; `@/lib/email` mock also needs `buildFreeEmailFooter`. Supabase typing gotcha: `.select(someStringVar)` widens to `string` → `GenericStringError[]`; primary select must use a `const` template-literal column string, fallback results cast `as unknown as typeof selectResult`. Gates: targeted 15/15, full **647 total / 640 pass / 7 fail = exact baseline** (dashboard-archive 4 + dashboard-subscriber-table 3), lint 0/5, prettier clean, clean build (`.next` deleted first; TS fix: explicit `resolvedReferrerId` in condition).

## Epic 17 Progress (Broadcasting Engine Fix)

**Status:** all 8 stories done (17.0–17.7) — implemented + audited 2026-09-28. **Uncommitted** on `dev`, awaiting `commit-push`.

| Story | Status  | Summary                                                                                                                                       |
| ----- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 17.0  | ✅ done | API Response Honesty & Send Hygiene — length caps, fail-loud (no `ok:true` on 0 sent), idempotency keys, once-only unsub URL, batched bounces |
| 17.1  | ✅ done | Segments API — `?wid=` + `.maybeSingle()`, `requirePro`, **eligible** counts (unsub + bounce excluded)                                        |
| 17.2  | ✅ done | Broadcast Client — **include `waitlist_id`** (the production-killer bug), segments `?wid=`, eligible UX, honest status                        |
| 17.3  | ✅ done | Preview From via `resolveFromAddress(..., sending_domain)` — completes Story 12.1.8 AC3                                                       |
| 17.4  | ✅ done | Free direct-URL upgrade path (AC8) + honest success copy (**COPY GAP B7** still open — interim string shipped behind marker)                  |
| 17.5  | ✅ done | HTML sanitize — isomorphic allow-list `src/lib/sanitize.ts` (no DOMPurify dep — ask-first gate avoided by hand-rolled allow-list)             |
| 17.6  | ✅ done | Tests — POST (17), segments (8), client (8) incl. `waitlist_id` B1 lock; fake unsubscribe test replaced with real component import            |
| 17.7  | ✅ done | Doc amendments — 12.3 AC5 HMAC not merge tag, 12.4 AC6 default all, statuses `done`, MEMORY, 12.6 AC4 stream wording                          |

**Gotchas (Epic 17):**

- **`client.tsx` once omitted `waitlist_id` → every production broadcast 400'd silently.** Regression locked by `broadcast-client.test.tsx` (asserts POST body includes `waitlist_id`) + `broadcast.test.ts` (accepts it). Any future send-path client change must keep that test green.
- **Never `{{{RESEND_UNSUBSCRIBE_URL}}}`** — merge tag requires Resend Audiences (forbidden by REQ-7.1a). Custom HMAC `generateUnsubscribeUrl` + `List-Unsubscribe(-Post)` headers only. Docs amended in 17.7; code was already correct.
- **Sanitize is hand-rolled allow-list** (`src/lib/sanitize.ts`, shared preview+send) — not DOMPurify; no new dependency. Client components must not import `@/lib/email` or route files (throws without `RESEND_API_KEY` at module load).

**Planning artifacts:**

- `docs/epics/completed/epic-17-broadcast-engine-fix.md` — epic doc + 8 embedded stories + standing decisions B1–B18
- `docs/stories/completed/story-17.0-broadcast-api-send-hygiene.md` through `story-17.7-doc-amendments-status-sync.md`

**Execution order:** 17.0 + 17.1 + 17.3 + 17.5 parallel → 17.2 → 17.4 → 17.6 → 17.7. Branch `engine-fix-broadcast` from `dev`. **No SQL.**

**Critical finding (audit §5):** `client.tsx` never sends `waitlist_id` → `POST /api/dashboard/broadcast` returns 400 on every send — **Broadcast is dead in production**. 17.2 AC1 is the one-line unblock.

**Key decisions (B1–B18 summary):** eligible segment counts (Klaviyo expected-recipient pattern); total failure → non-2xx/`ok:false` never silent success; keep custom HMAC (amend docs not code); no Resend Audiences/Broadcasts product; history UI deferred; subject ≤200 / body ≤10_000; per-chunk Resend idempotency keys; bounce batch query not N+1; default segment `"all"`.

**Open gates:** COPY GAP B7 (success copy — founder approval); Epic 16 SQL gate (`epic16-story6-position-boost.sql` before deploying 16.7).

**MEMORY corrections applied:** merge-tag claims removed from Epic 12 architecture notes (2026-09-24); story-file AC amendments done by 17.7 (2026-09-28).

## Pro CTA → Signup → Upgrade Modal Fix — Prompt #8 (2026-09-29)

**Status:** Phases 1–6 complete + **Prompt #3 audit passed** (2026-09-29), all gates green (lint 0 errors/5 pre-existing warnings, full suite **687 total / 680 passed / 7 failed = exact baseline**, clean build, prettier clean). **Uncommitted** on `dev` alongside Phase-1 revenue-lifecycle fixes.

**Root cause:** `dashboard/layout.tsx` read a `searchParams` prop for a `?plan=pro` exception — **Next.js never passes `searchParams` to layouts** (proven from `next/dist/.../create-component-tree.js`: `searchParams` only when `isPage`; official docs: "Layouts do not rerender on navigation, so they cannot access search params"). `plan` was always `undefined` → zero-waitlist guard always bounced to `/onboarding/1` and no upgrade modal ever opened for Pro-intent signups.

**Fix (founder-approved design — modal over onboarding/1, not an obstructive detour):**

- `src/app/auth/callback/route.ts` — branch **only when** `redirectPath === PRO_INTENT_DEST`: count waitlists (`select("id", {count:"exact",head:true})`); 0 → `PRO_ONBOARDING_ENTRY`; ≥1 → billing (its existing `?plan=pro` auto-open runs); query error/throw → keep original dest. Non-billing `plan=pro` paths (resume-onboarding `next`) preserved verbatim.
- `src/app/onboarding/onboarding-client-layout.tsx` — new child `PlanProAutoOpen` (inside the upgrade context Provider, so the trigger comes from context — same pattern as billing's `useUpgradeModal()`): opens UpgradeModal once with trigger source **`pro-cta-onboarding`** (no HEADLINES entry → existing fallback copy **"Unlock all Pro features"**, no copy gate), strips `?plan=pro` via `history.replaceState`, skips already-Pro founders. After Paddle success, existing `successPath` + `?upgraded=1` poll resumes onboarding/1.
- `src/app/dashboard/layout.tsx` — removed the dead `searchParams` plan exception (plain zero-waitlist bounce, comment notes the callback owns the branch).
- `src/app/dashboard/shell.tsx` — `getServerDefaultId([])` returns `""` instead of `waitlists[-1].id` (latent crash once layout renders shell with empty array on query error).

**Dismissible-modal research verdict (web):** keep dismissible — a no-exit paywall is a top dark-pattern complaint (EU dark-pattern guidance; forced-action friction reduces conversion); ≥48h re-prompt suppression recommended — our `COOLDOWN_DAYS = 1` already applies to every trigger including `pro-cta-onboarding`.

**Tests (new, 9):** `src/__tests__/api/auth-callback-plan-pro.test.ts` (6: zero→onboarding, ≥1→billing, error keeps dest, no-plan no query, default dest, non-billing plan=pro verbatim) + `src/__tests__/components/onboarding-plan-pro.test.tsx` (3: opens+strips, no-param closed, already-Pro closed).

**Gotchas:**

- **happy-dom strips the forbidden `cookie` request header** (fetch-spec compliance) → a real `NextRequest` can't carry cookies in tests. Workaround: `Object.assign(new Request(url), { cookies: { get } })` — route only touches `request.url` + `request.cookies.get()`.
- **`react-hooks/set-state-in-effect` fires on intra-file `triggerUpgrade` in an effect** — billing passes lint only because its trigger comes from imported `useUpgradeModal()`. Fix: put the auto-open effect in a child component consuming context, not in the file that owns the setter.

**Flows after fix:** fresh visitor → Pro CTA → `/signup?next=…&plan=pro` → email link → callback → `/onboarding/1?plan=pro` + modal → pay → onboarding/1 (`?upgraded=1`) → continue. Existing account → `/dashboard/settings/billing?plan=pro` + modal (existing code). Dismiss → 1-day cooldown, flow continues.

**Prompt #3 audit findings + fixes (2026-09-29):**

- **BUG (fixed): signed-in redirect hole for 0-waitlist founders.** Client-side `router.push/replace(dest)` legs (new signup/signin mount effects + Phase-1 signin submit) bypassed the callback's count branch → dashboard layout bounced them to `/onboarding/1` with `?plan=pro` lost (no modal). Fix: `resolvePostAuthPath(deps, dest, userId?)` in `src/lib/auth-redirect.ts` — counts own waitlists client-side for `PRO_INTENT_DEST` only; 0 → `PRO_ONBOARDING_ENTRY`; error/no-session → keep dest. Used by signup effect, signin effect, signin `navigatePostAuth` (3 submit sites). Callback keeps its own inline query (same semantics) sharing `PRO_INTENT_DEST`/`PRO_ONBOARDING_ENTRY` constants.
- **Asymmetry (fixed): billing auto-open only stripped `?plan=pro` when free** — a Pro founder kept the stale param forever (could re-trigger after a downgrade). Now: always strip on mount, open gated by `contextTierRef.current !== "pro"` (`billing/client.tsx`).
- **Test gaps (filled):** already-subscribed `POST /api/billing/checkout` → 400 (`billing.test.ts`); billing auto-open free-opens/pro-skips/no-param (`billing-plan-pro.test.tsx`, 3); onboarding `?upgraded=1` pay-return leg (fake timers, polls `/api/profile`); signed-in redirect on both auth pages incl. count branches (`auth-signed-in-redirect.test.tsx`, 6); `resolvePostAuthPath` units (8).
- **Flagged, NOT fixed (founder decisions):** (a) 2026-09-22 "logged-in users see Open Dashboard" CTA is unimplemented — `pricing-section.tsx` static `/signup?…` for everyone (functionally covered by session-redirect); (b) auth-redirect cookie expiry (1h) still drops intent on very slow verification (pre-existing); (c) checkout re-entrancy race within webhook latency window (layered guards: tier checks, server 400, once-only open, 1-day cooldown).
- **TS gotcha:** passing a supabase client directly into a hand-rolled structural interface → "Type instantiation is excessively deep". Fix: `postAuthDeps(client)` factory — closures (`getUser`, `countOwnWaitlists`) + `from(table: string): unknown` with an internal cast; keeps call sites type-safe and the build green.
- **Double-pay guard layers verified:** billing `contextTierRef !== "pro"` · onboarding `form.tier` (server tier precedence over localStorage, `context.tsx:213,217`) · server 400 "Already subscribed to Pro" · UpgradeModal 401→signup · `COOLDOWN_DAYS = 1` · once-only refs + param strip.

**Upgrade-modal flicker fix (Prompt #8 re-run, 2026-09-29):**

- **Symptom:** founder — "the upgrade modal just flickers." Playwright probes against the live `:3000` server proved the mechanism: clean storage → modal mounts and stays; `upgrade-dismissed-pro-cta-onboarding` key present → mounts then unmounts in **3ms**.
- **Root cause:** the AC8 cooldown effect in `upgrade-modal.tsx` auto-closes ANY open whose trigger has a <24h dismiss key. `PlanProAutoOpen` (`?plan=pro` arrival) only gates on tier, so a prior dismissal shut the arrival modal immediately — and the param was already stripped, so the pay intent was silently lost.
- **Fix:** `COOLDOWN_EXEMPT_TRIGGERS` in `upgrade-modal.tsx` = `pro-cta-onboarding` + `pro-cta-billing` — explicit-intent deep links survive a prior dismissal (research: show upgrade prompts on active purchase intent, keep frequency caps for passive re-prompts). Billing deep link now uses its OWN trigger `pro-cta-billing` (was sharing `billing` with the settings-page button, so it couldn't be exempted wholesale); `HEADLINES["pro-cta-billing"] = "Manage your subscription"` reuses the existing string → headline unchanged. Settings button keeps `billing` → cooldown still applies. `?upgrade=cap` deliberately left alone (code comment documents intentional cooldown honor).
- **Tests:** +2 exemption cases in `upgrade-modal.test.tsx` (it.each), +1 founder-repro in `onboarding-plan-pro.test.tsx` (suppressed key + `?plan=pro` → modal stays after effect cycles), +1 key-isolation in `billing-plan-pro.test.tsx` (assert now `pro-cta-billing`). Temp probe `tests/e2e/plan-pro-probe.spec.ts` deleted (repro locked at unit/integration level instead).
- **Gotcha:** never exempt `billing` wholesale — `triggerUpgrade("billing")` is also the settings-page button (line 167); exempting it would kill AC8 for a passive opener.
- **Verified live (2026-09-29):** restarted the founder's server with the fix (old PID 67084 died when `.next` was rebuilt → new PID 2580, log at `.next-server.log`); temp Playwright probe (deleted after run) proved both suppressed-key and clean arrivals **open and stay** on `/onboarding/1?plan=pro`. Gates: lint 0/5, suite **691 total / 684 pass / 7 fail = exact baseline** (+4 new tests), clean build.

**Upgrade-click error fix (Prompt #8, 2026-09-29):**

- **Symptom:** founder clicked "Upgrade to Pro" → red "Something went wrong. Please try again."
- **Root cause:** pay-before-onboarding lands fresh signups on `onboarding/1?plan=pro` where the modal opens **before any waitlist exists**, but `founder_profiles` rows are only auto-created lazily at waitlist creation (`api/waitlist/route.ts:117-139`). Checkout route's `.single()` on the missing row → **404 "Profile not found"** → modal's `!res.ok` throw → generic message. The modal's `data.error` branch was **dead code** — the route pairs every error string with a non-2xx status, which threw before the branch ran.
- **Evidence:** env + auth guards healthy (unauth POST → 401 on local and prod); cloud DB showed exactly one profileless user — the founder's fresh test signup created 11:12:16Z that morning.
- **Fix:** checkout route `.maybeSingle()` + **create-if-missing** (`insert({id: user.id})`, mirroring the waitlist route; concurrent-create race re-selects before 500-ing); modal parses non-2xx bodies and surfaces the API's existing `error` strings, generic fallback when absent (web.dev fetch pattern). Research: Supabase PGRST116 docs (`.maybeSingle()` for "row may not exist") + web.dev fetch error handling.
- **Tests:** +3 — billing auto-create → 200, modal surfaces non-2xx API string, modal falls back when body has no message.
- **Flagged, NOT fixed (scope):** (a) auth callback acquisition capture (`callback/route.ts:47-56`) does a best-effort `update` on a possibly-absent profile row → acquisition data silently dropped for fresh signups (profile now gets created at checkout or waitlist creation, but not at callback); (b) `use-paddle-upgrade.ts` (steps 4a/5) fails **silently** (console-only) on checkout errors — no user-facing message.

## Revenue Lifecycle Plan — Phases 5 + 6 (2026-09-30)

**Status:** Phases 5–6 DONE + **Prompt #3 audit passed (2026-09-30)**, all gates green, committed on `dev` (Phases 1–4 shipped earlier). Plan: `docs/revenue-lifecycle-fix-plan.md`.

**Phase 5 — Growth surfaces (all 3 founder gates resolved):**

- 5.1 **Dynamic per-subdomain PNG og:image** — `src/app/(public)/[subdomain]/opengraph-image.tsx` (1200×630 `ImageResponse`, headline/subheadline/brand colour from waitlists row, 86400s revalidate) + `generateMetadata` (og:title/description/twitter) in `page.tsx:30`. **[AMENDED 2026-10-04:** revalidate 300s → 86400; card redesigned + "Powered by" tier-gated (Free only) — see "og:image card redesign" block at file end.**]**
- 5.2 Success buttons → shared `ShareButtons` only (no platform tabs).
- 5.3 **Namespace split:** `?ref=` = subscriber credit (8-hex only, client `/^[0-9a-f]{8}$/i` filter) · `?src=powered-by` = attribution/hero (footer brand links, tightened hero trigger).

**Phase 6 — Debt + doc honesty:**

- **proxy.ts migration:** `git mv src/middleware.ts src/proxy.ts`, export `middleware` → `proxy`; deleted duplicate helper `src/lib/supabase/proxy.ts`; root `.env.example` (13 vars) + `!.env.example` gitignore negation. Build shows `ƒ Proxy (Middleware)`.
- **`POST /api/subscribers` hardening:** validation order = required → honeypot → ≥2s timing → consent 400 → email format → display_name ≤100 → 5/hour per-IP (skips `unknown`) → tier → referral → qual → **atomic claim** `increment_subscriber_count(p_waitlist_id, p_cap)` + `releaseClaim()` on every insert-error path (+ legacy 1-arg fallback) → insert; **23505** → 409 (email) / one retry with fresh code / generic 500 — no raw-error echo. **[W3 2026-09-30 — Epic 18:** the consent-400 step was removed — signups no longer send/require a consent flag; all other steps unchanged.**]**
- **Consent rebuilt, not amended:** shipped at `0d33bbb` (Epic 12.2.6) then **silently reverted by `afcdcf9`** (checkbox/guard/validation removed while `consent_given_at` kept stamping unconditionally = fabricated consent records). Restored (Phase 6.4/6.8) in both form variants + `PreviewConsent` preview parity + server 400. Regression notes in epic-12.2 T1/T2, story-12.2.6, MEMORY 12.2.6 row. **[W3 2026-09-30 — Epic 18:** the restored checkbox/guard/400 were replaced by the approved click-through line (founder-approved copy, Epic 18.1); stamping + preview parity retained.**]**
- **Doc corrections (6.9):** price var → `PADDLE_PRO_PRICE_ID` server-only (epic-13 + story-13.0 wrongly said `NEXT_PUBLIC_…`) · cooldown 7→1 day, 8 spots (`COOLDOWN_DAYS = 1`, founder decision 2026-09-22) · CSV-trigger stragglers 6 spots (story-9.2/9.5/9.7, epic-9 AC4+AC8, dashboard-overhaul 4.3) · meta-tags claim verified vs Phase 5.1 (Excalidraw mirror left raw by design) · `docs/PROMPTS.md` middleware→proxy.ts (2 lines).
- **Bonus `/signup` fixes:** `handleSubmit` uses `validateEmail()` return (stale-state bug), `onBlur` syncs error, `/terms`→`/legal/terms`, `/privacy`→`/legal/privacy`.
- **FOUNDER GATE (closed):** `docs/stories/sql-writeups/revenue-phase6-subscriber-protections.sql` **run by founder 2026-09-30** (2-arg increment + decrement fn, `email_normalized` generated column + dedupe index, probes).

**Prompt #3 audit (2026-09-30) — 2 findings, both fixed:**

- **F1 — display_name cap on the wrong endpoint:** POST `/api/subscribers` had the ≤100 check, but the form never sends `display_name` — the real write path is PATCH `/api/subscribers/[id]` (thank-you name input), which had no cap. Added the same 400 + `maxLength={100}` on the input + 3 tests in `subscribers-id.test.ts` (PATCH describe block; that file also gained admin-client mock + queue clearing).
- **F2 — og:image dropped subheadline:** `opengraph-image.tsx` selected `subheadline` but rendered `productName` as the subtitle; plan 5.1 specifies headline/subheadline/brand colour. Fixed: subtitle = subheadline (sliced 140) → productName → subdomain.
- Verified end-to-end: validation order, claim/release/no-double-decrement (legacy fallback + `claimed` flag), 23505 paths, consentBlock in both form variants, PreviewConsent (186/308), metadataBase, hero `?src=` trigger, footer `SITE_URL` links, `.env.example` = exact match for all 13 `process.env` keys, all 6.9 doc corrections landed (story-13.0 uses "CORRECTED", overhaul 4.3 "SUPERSEDED").

**Gates:** lint 0 errors / 5 pre-existing warnings · full suite **813 = 806 pass / 7 fail = exact baseline** (dashboard-archive 4 + dashboard-subscriber-table 3; +15 new tests across 5–6 + audit) · clean build (`.next` deleted first, `ƒ Proxy (Middleware)`) · `accent-accent` confirmed in compiled CSS. Note: full-suite runs are flaky under load (one run showed 12 fails, immediate re-run = baseline 7) — always re-run before concluding regression.

**Gotchas (Phases 5–6):**

- `useRef(Date.now())` violates `react-hooks/purity` (impure call in render) — capture the form-load timestamp in a mount effect (`loadedAtRef`), fallback `?? Date.now()` inside the submit handler.
- Test/route bodies must now include `consent: true` + `ts: Date.now()-5000` (`FORM_TS`/`signupBody`/`capBody` helpers) or signup 400s on timing/consent first. **[W3 2026-09-30 — Epic 18:** `consent: true` dropped everywhere — API no longer 400s on missing consent; keep only the `ts` timing helper.**]**
- Supabase mock: `rpc` is an unqueued default `{data: []}` → claim lands in the legacy-fallback branch for existing tests; Pro-at-cap test must mock `{data: 601}` (a `null` now means capped → 403).
- `vi.clearAllMocks()` does not clear once-queues; rate-limit query dequeues only when `x-forwarded-for` is set (tests set none → ip `unknown` → skipped).

## Revenue Lifecycle Plan — Phase 4 Audit (2026-09-30)

**Status:** Prompt #3 audit of Phase 4 (Funnel dead-ends) complete, **1 finding fixed**, gates green (lint 0/5, suite **814 = 807 pass / 7 fail = exact baseline**, clean build, prettier clean). Fix uncommitted at audit time → committed with docs.

**Finding F1 — FlushGate fresh-founder path keyed on a 404 the API never returns:** `GET /api/waitlist` returns `200 []` for zero waitlists (never 404 — 401/400/200 only). FlushGate's truly-fresh branch checked `preStatus === 404` → dead in production: fresh founder at `/onboarding/4` (e.g. post-signup with cleared storage) hit the "Something went wrong" error UI + a redundant second GET instead of Step 1. Fix in `src/components/auth/flush-gate.tsx`: truly fresh = pre-check proved empty (200 [] or 404) AND no local draft → `router.replace("/onboarding/1")` before the second GET; removed dead `preStatus` tracking + unreachable "404 && !hasLocalData" branch after POST (POST only runs when a draft exists); kept "404 after successful POST → error UI" as defense. +1 regression test (200 `[]` contract, asserts exactly 1 fetch) — 7 total.

**Other 4.x claims verified:** 4.2 Phase-B proxy guard `middleware.ts:44-52` (list → `/onboarding/signup` before generic guard, query preserved, both proxy legs, 7 tests) · 4.3 archived → `/{subdomain}/gone` on leaderboard:38-39 + thank-you:86-87, recovery card for missing params/unknown subscriber, read-only call holds (no `is_archived` block on dashboard edit) · 4.4 `resolveActiveWaitlist` adopted in all 6 section pages + shell (`?wid` > stored > newest at shell:185-195, unknown-wid self-heal :203-213; layout + GET both `created_at ASC` so client "last = newest" holds; no stragglers — updates:52 orders the updates list) · 4.5 `UpdatesFreeGate` before waitlist lookup (page:31), free → modal trigger `"updates"` (existing strings) · 4.6 resubscribe POST + token 400/404, GET-only page validates without mutating, PATCH PGRST204 swallow removed (prior audit), 7 tests.

**Gotcha:** the other three `fetch("/api/waitlist")` callers (onboarding/signup:39, onboarding/3:280) use bare `res.ok` → also true for `200 []` — harmless because they just push to `/onboarding/4`, where the fixed FlushGate normalizes. If any future caller needs "has a waitlist", check `Array.isArray(json) && json.length > 0`, not `res.ok`.

1. ~~Implement Story 1.2 (Toggle, Select, Textarea)~~ ✅ Done
2. ~~Run Follow-Up Audit (Prompt #4) on completed Epic 1~~ ✅ Done — all clean
3. ~~Create Epic 2 branch from dev~~ ✅ Done
4. ~~Start Story 2.1 — Supabase schema DDL + RLS~~ ✅ Done
5. ~~Epic 2 — Foundation & Auth~~ ✅ Done (all 5 stories)
6. ~~Epic 3 — Marketing Homepage~~ ✅ Done (all stories + extra work)
7. ~~Create Epic 4 branch from dev~~ ✅ Done (on `epic-4` branch)
8. ~~Epic 4 Design Analysis~~ ✅ Done — all 10 screens analyzed, cross-referenced with PRD, web research complete
9. ~~Story 4.0 — API routes, context, layout switching~~ ✅ Done
10. ~~Story 4.1 — Step 1 (Name Your Waitlist)~~ ✅ Done
11. ~~Story 4.2 — Step 2 (Choose Template)~~ ✅ Done + dark theme fixes + bold border
12. ~~Story 4.3 — Step 3 (Make It Yours)~~ ✅ Done + Meta Preview OG-card + milestone rewards + live sync
13. ~~Story 4.4 — Step 4 (Qualification Decision)~~ ✅ Done
14. ~~Story 4.5 — Step 4a (Configure Questions)~~ ✅ Done
15. ~~Story 4.6 — Step 5 (Email Setup + Launch)~~ ✅ Done (part of Epic 6)
16. ~~Story 4.7 — Success Screen~~ ✅ Done (part of Epic 6)
17. ~~Epic 6 — Post-Sprint-1 Issues~~ ✅ Done (all 5 stories, incl. architecture overhaul)
18. ~~Create Epic 7 branch from dev~~ ✅ Done
19. ~~Story 7.0 — SQL migration + API routes~~ ✅ Done
20. ~~Story 7.1 — Public waitlist page shell~~ ✅ Done
21. ~~Story 7.2 — Email Capture Form~~ ✅ Done
22. ~~Story 7.3 — Inline Qualification Questions~~ ✅ Done
23. ~~Story 7.4 — Duplicate Email Handling~~ ✅ Done
24. ~~Story 7.5 — Public Leaderboard Page~~ ✅ Done
25. ~~Execute Story 7.6 — Email-First Updates + Milestone Hybrid + Warmth Foundation + Doc Alignment~~ ✅ Done
26. ~~Execute Story 7.7 — Founder Updates Feed~~ ✅ Done
27. ~~Execute Story 7.8 — Epic 7 Tests~~ ✅ Done
28. ~~Merge epic-7 → dev~~ ✅ Done (fast-forward, no conflicts)
29. ~~Create Epic 8 branch from dev~~ ✅ Done
30. ~~Story 8.0 — Thank-You Page Route~~ ✅ Done
31. ~~Story 8.1 — Referral Link & Share Buttons~~ ✅ Done
32. ~~Story 8.2 — Referral Tracking API~~ ✅ Done
33. ~~Story 8.3 — Referred Subscriber Variant~~ ✅ Done
34. ~~Story 8.4 — Dashboard Subscriber Referral Column~~ ✅ Done
35. ~~Story 8.5 — Epic 8 Tests~~ ✅ Done
36. ~~Merge epic-8 → dev~~ ✅ Done (fast-forward, no conflicts)
37. ~~Create Epic 9 branch from dev~~ ✅ Done (on `epic-9` branch)
38. ~~Manual testing Steps 3-4 (Epics 7 & 8)~~ ✅ Done — all bugs found and fixed
39. ~~investigate [ leaderboard issues ]~~ ✅ Done — pagination, alignment, column widths, sort fix
40. ~~investigate [ step 3 ] — referral link dynamic URL~~ ✅ Done
41. ~~investigate [ step 3 ] — thank-you page copy/share icons + leaderboard link + referred submit~~ ✅ Done
42. ~~investigate [ step 2 ] — referred thank-you design mismatch~~ ✅ Done
43. ~~Story 9.0 — Dashboard Layout Shell~~ ✅ Done
44. ~~Story 9.1 — Stat Cards with Real Data~~ ✅ Done
45. ~~Story 9.2 — Subscriber Table Design Alignment~~ ✅ Done
46. ~~Story 9.3 — CSV Export (Pro Tier)~~ ✅ Done
47. ~~Story 9.4 — Subscriber Detail Page~~ ✅ Done
48. ~~Story 9.5 — Epic 9 Tests~~ ✅ Done
49. ~~Story 9.6 — Dashboard Remediation — MVP Gap Fill~~ ✅ Done
50. ~~Story 9.7 — Epic 9 Final Tests~~ ✅ Done
51. ~~Epic 10 — Public Waitlist Page & Onboarding Redesign~~ ✅ Done (all 8 stories, merged to dev)
52. ~~Fix: milestone rewards disappearing + signup counter not displaying (stale closure fix)~~ ✅ Done
53. ~~Fix: PoweredByFooter inheriting preview styles on public pages (standalone prop)~~ ✅ Done
54. ~~Epic 11 — Warmth Tracking Engine~~ ✅ Done (all 8 stories, 257 tests)
55. ~~Epic 12 — Email System~~ ✅ Done (all 7 stories, merged to dev)
56. ~~Epic 12.1 planning — epic doc + 11 story files created~~ ✅ Done
57. ~~Epic 12.2 planning — epic doc + 10 story files created + SQL migration~~ ✅ Done
58. ~~Epic 12.3 planning — epic doc + 5 story files created~~ ✅ Done
59. ~~Execute Story 12.1.0 — Sidebar Redesign~~ ✅ Done
60. ~~Execute Epic 12.1 (remaining: 12.1.1–12.1.10)~~ ✅ Done — all 11 stories, 281 passing tests
61. ~~Execute Epic 12.2 (12.2.0–12.2.13)~~ ✅ Done — all 14 stories complete
62. ~~Execute Epic 12.3 (12.3.0–12.3.5)~~ ✅ Done — all 6 stories, shared layout, 317+ passing tests
63. ~~Epic 13 — Billing & Feature Gating~~ ✅ Done (all 7 stories, 23 tests, merged to dev)
64. ~~Epic 17 create-epic (Broadcasting Engine Fix)~~ ✅ Done (2026-09-24) — epic doc + 8 story files; **not implemented**; MEMORY merge-tag claims corrected early
65. **Execute Epic 14.0 + 14.1 + Prompt #3 audit** ✅ Done (2026-09-24) — implemented, audited, 3 findings fixed (milestones/unsubscribe admin clients, email-capture dark tokens); gates green at baseline; committed (`ec42cf6`); founder must run `epic14-story0-qualification-schema.sql` before deploy
66. ~~Execute Epic 14.2 + 14.3 + dashboard design redesign + brand accents~~ ✅ Done (2026-09-24) — commits `d3843f0`, `e51dcc6`, `25d99f1`; gates green (lint 0/5, build, suite 466/7 = baseline); epic + story docs synced to `done`; branch `dev` **not pushed**; next: 14.4 (CSV/tests/cleanup)
67. **Execute Story 14.4 (CSV/tests/cleanup) + scan→execute prompts** ✅ Done (2026-09-25) — Prompt #1 scan + Prompt #2 execute; AC1–AC7 all implemented; new tests: `question-cap` (5), `csv-export` (5), qual-page server route (3); gates green (lint 0/5, clean build, suite **480 passed / 7 failed = exact baseline**); story moved to `completed/`; epic doc/PRD/audit/MEMORY synced; **uncommitted**, branch `dev` **not pushed**; next: `commit-push` when instructed
68. **Execute `docs/completed/dashboard-warmth-redesign-plan.md` (warmth restructure + card redesign + switcher fix)** ✅ Done (2026-09-25) — Prompt #2 execute of approved plan; Unscored removed (baseline 70 → Hot), WarmthPanel 3-bar redesign + title-link overlay, switcher Fix A/B, orphan `/api/warmth/[subdomain]` deleted, SQL file written; gates green (lint 0/5, targeted 79/79, suite **535 = 528 pass / 7 fail = verified baseline via stash**, clean build — delete `.next` first); docs synced (PRD, vision v4.3, design guide, sprint-3 spec, MEMORY, Epic 15/17/11/12.3 annotations); **uncommitted**, branch `dev` **not pushed**; founder gates open (3 SQL/cron items); next: manual verification + `commit-push` when instructed
69. **Execute Epic 18 (Live Waitlist Page Redesign, 18.0–18.5) via scan+execute prompts** ✅ Done (2026-09-30) — shared renderer variants, consent click-through swap, preview parity, Step 1 Headline field, settings logo upload, 85 tests across 5 files; gates green (lint 0/5, prettier clean, suite **838 = 831 pass / 7 fail = exact baseline**, clean build); PRD 4 amendments + Epic 12.2.6 annotations + MEMORY synced; branch `epic-18-waitlist-redesign`; **uncommitted**; next: `audit [story 18.4 & 18.5]` then `commit-push`

## Epic 18 Progress (Live Waitlist Page Redesign)

**Status:** ✅ ALL 10 STORIES DONE (18.0–18.9) — implemented 2026-09-30 on branch `epic-18-waitlist-redesign` (from `dev`), **uncommitted** (one commit for the whole epic when founder runs `commit-push`); execution + doc gates green (see below). Plan + standing decisions W1–W8: `docs/epics/epic-18-live-waitlist-page-redesign.md`. Visual-redesign extension plan + D1–D6: `docs/epic-18-visual-redesign-plan.md`. Binding design spec: `docs/design/waitlist-page-design-guide.md`. No SQL, no new deps/env.

| Story | Status  | Summary                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 18.0  | ✅ done | Shared renderer restructure — fixed section order (brand → headline → subheadline → counter → form slot → milestones → how-it-works → updates slot), `variant: "live" \| "preview"` scale model (default preview), centered brand row, updates below fold, how-it-works rebuilt (top divider, no dead `mt-auto`)                                                                                                 |
| 18.1  | ✅ done | Consent swap — checkbox → approved click-through line in `components/public/consent-line.tsx` (W3 verbatim + `/legal/terms` + `/legal/privacy` links), API consent-400 removed, `consent_given_at`/`consent_ip_address` stamped unconditionally, `PreviewConsent` swap                                                                                                                                           |
| 18.2  | ✅ done | Preview parity — sample updates slot after how-it-works, TrustLine ("No spam. Unsubscribe anytime.") in both preview mocks, shared-string extraction (zero duplicated literals in `live-preview.tsx`)                                                                                                                                                                                                            |
| 18.3  | ✅ done | Step 1 Headline field — label "Headline" between Product Name and Subheadline, unconditional backfill removed → fallback chain `headline → productName → slug`, Product Name visually grouped (W6, zero new copy)                                                                                                                                                                                                |
| 18.4  | ✅ done | Settings logo upload — Logo URL text input replaced by upload control (`accept="image/png,image/svg+xml"` → FileReader → `saveField("logo_url", dataURL)`), thumbnail + Remove + replace states, labels mirrored verbatim from onboarding Step 3                                                                                                                                                                 |
| 18.5  | ✅ done | Tests + gates + doc amendments — 5 test files touched/created (T1a renderer 22, T1b consent 48, T1c parity 4, T1d step-1 7, T1e settings logo 4), PRD 4 amendments, Epic 12.2.6 annotations, MEMORY sync, status flips                                                                                                                                                                                           |
| 18.6  | ✅ done | Renderer visual redesign — `WaitlistBrand` top-left lockup (wordmark bold 2xl/1sm, logo 36/28px, conditional header row in shells not renderer), headline `text-5xl sm:text-6xl extrabold tracking-tight + max-w-xl text-balance`, subheadline medium, how-it-works 3-step designed block (`pt-8`/`pt-6`, semibold label, template step cards), root `space-y` rhythm (8/5/3), live vertical centering + page bg |
| 18.7  | ✅ done | Form visual redesign — always stacked full-width (D4), free-text question **inside field** (muted/70 overlay, peer hide-on-type, `(optional)` badge pinned right, real label + aria-label), muted qualifier surfaces (light `bg-muted`, dark `bg-dark-template-input`), MC legend + radio rows, **trust → button → consent swap** (founder) in live + preview, CTA `font-semibold` all templates                 |
| 18.8  | ✅ done | Preview adaptive fit + conformance — grow-first frame, shrink `scale = available/natural` clamped 0.6 + wrapper height compensation + scroll fallback, density step (`space-y-3` >6 modules), ResizeObserver on unscaled content; Phase-4 fixes: frame `bg-background` (was `bg-card` white band), footer `standalone`, conditional brand `pt-6`, in-field `textSize`                                            |
| 18.9  | ✅ done | Design guide amendments (round-2) + template pass (7 deviations fixed + hex/inline-style scan clean) + conformance tests (+11) + full gates + epic/story/plan/MEMORY sync                                                                                                                                                                                                                                        |

**Execution order:** 18.0 + 18.1 + 18.3 + 18.4 parallel → 18.2 → 18.5. Extension: **18.6 + 18.7 parallel → 18.8 → 18.9** (plan Phases 0–5 of `docs/epic-18-visual-redesign-plan.md`).

**Key decisions (locked 2026-09-30 — do not relitigate):** W1 preview = compact approximation via one shared renderer + `variant` (standing rule amended, reuse rule untouched) · W2 all modules retained; updates card moves below the form (below fold) · W3 consent = founder-approved click-through sentence, no checkbox, unconditional provenance stamping (FTC: checkbox not required; stamping kept for GDPR/CASL) · W4 settings logo = base64 data URL in `waitlists.logo_url` (no Supabase Storage migration this epic — PRD REQ-6.8.4 annotated) · W5 Step 1 gains Headline input, backfill removed, no retroactive migration · W6 Product Name differentiation visual-only (no new copy) · W7 no public-page SVG exists → research anatomy + Design System v2.0 tokens · W8 copy gate — only pre-approved strings (consent sentence, trust line, how-it-works strings, existing Step 1 labels, existing logo-upload labels).

**Extension decisions D1–D6 (founder, 2026-09-30):** D1 Freelance Bold reference + web research only (no more reference images) · D2 brand = **screen top-left** lockup (supersedes 18.0's centered brand row — epic AC3 annotated) · D3 subheadline promoted to real body copy (no schema changes) · D4 form always stacked full-width (no horizontal row variant) · D5 fold into Epic 18, one commit at the end · D6 W8 copy gate still applies.

**Round-2 founder directives (2026-09-30, all implemented):** screen top-left `WaitlistBrand` (font-bold, `text-2xl` live / `text-sm` preview) · headline live `text-5xl sm:text-6xl` extrabold (supersedes 18.0 Dev Notes `text-4xl/5xl semibold` — annotated) · subheadline `text-lg` live / `text-base` preview `font-medium` · qual question text inside field, `(optional)` right · dark qual surface `bg-dark-template-input` · trust above button, consent below (18.0-era order reversed). **[AMENDED 2026-09-30 round 3 — founder: trust line moved below the consent sentence. Current field order = button → consent → trust (live + both preview mocks); design guide, epic/story 18.7 AC5, and both order tests updated.]**

**Gates (18.9, final 2026-09-30):** lint 0 errors / 5 baseline warnings · prettier + `format:check` clean · full suite **866 total = 859 pass / 7 fail = exact sanctioned baseline** (dashboard-subscriber-table 3 + dashboard-archive 4, exactly 2 files) · clean build (`.next` deleted first; `✓ Compiled successfully`; `ƒ Proxy (Middleware)`).

**Gates (18.5, historical):** lint 0/5 · prettier clean · full suite **838 = 831 pass / 7 fail = baseline** · clean build.

**Doc amendments (18.5):** PRD REQ-6.15.3 (position → below fold, W2) + L170/L182 (consent rows → click-through + provenance, W3) + REQ-6.8.4 (base64 deviation, W4) · Epic 12.2 AC block + T1 regression note + 12.2.0 AC1 + story-12.2.6 header + story-12.2.10 AC3 (W3 cross-refs) · standing-rule W1 amendment (this file) · story status flips 18.0–18.5 → `done`.

**Doc amendments (18.9, extension):** epic Story Index +18.6–18.9 · 18.0 AC3/AC5/Dev-Notes AMENDED notes (brand centering, label weight, type scale) · design-source rows (guide + plan) · story files 18.6–18.9 created · plan Status → complete · guide §3–§14 round-2 amendments · this block.

**Gotchas (Epic 18):**

- `getAllByLabelText([array])` does NOT resolve multiple labels in RTL 10.4 (`@testing-library/dom`) — assert field DOM order with `compareDocumentPosition` instead.
- Step 1 `deriveSlug` **strips** non-`[a-z0-9-]` chars — spaces are removed, not hyphenated (`"My Product"` → `"myproduct"`).
- happy-dom has **no `window.alert`** — `vi.spyOn(window, "alert")` throws ("can only spy on a function"); use `vi.stubGlobal("alert", vi.fn())` (unstuck in `afterEach`).
- Settings logo test with the REAL LivePreview renders **two** `alt="Logo"` images (thumbnail + preview brand logo) — use `getAllByRole` or mock LivePreview (capturing the `logoUrl` prop) to disambiguate.
- Replacing a control orphans dependent tests elsewhere — 18.4 broke `dashboard-edit-after-onboarding.test.tsx` (`getByDisplayValue(url)` on the removed URL input); fix such tests in the same story, never rebaseline silently.
- PoweredByFooter renders its OWN Terms/Privacy links — consent-link assertions must disambiguate by `href` (`/legal/terms`, `/legal/privacy`), not by link name.
- Shared-string lock pattern: source-level test asserting the frozen literals live ONLY in `consent-line.tsx` and consumers (`live-preview.tsx`, `email-capture-form.tsx`) contain `<ConsentLine`/`<TrustLine>` instead.
- Test POST bodies: `consent: true` dropped everywhere post-W3; keep only the `ts: Date.now()-5000` timing helper.
- **Extension (18.6–18.8):** preview how-it-works also carries `pt-6` — the "no header section" test must select exactly `div[class="pt-6"]`, never `.pt-6` (multi-match).
- **Extension:** peer overlay pattern — input must precede the `<label>` target in DOM; `placeholder:` utilities don't apply to non-placeholder elements, use `peer-placeholder-shown:visible` on the label.
- **Extension:** ResizeObserver must observe the **unscaled** preview content (observing the wrapper whose height = `natural × scale` oscillates); happy-dom has `ResizeObserver` and `window.innerHeight = 768`; `offsetHeight` is 0 pre-layout → keep class-height fallback for available calc.
- **Extension:** `bg-background` on the frame is user-visible in onboarding (was white) — expected §9 conformance, not a bug; footer needed `standalone` the moment the frame stopped being white.
- Components live at project root (`components/`), tests import via `../../../components/...`.

## Decision + bug fix: "Powered by PreWaitlist" footer (2026-07)

Scope: exclusive to founders' public waitlist pages (onboarding preview now,
real public page in Sprint 2) when tier = Free. Never on PreWaitlist's own site —
this was built wrongly onto our own homepage footer once already and had to be
removed; if it recurs, same fix, same reasoning.

Visual spec: inline "Powered by [16px jade icon] PreWaitlist", Caption size,
"Powered by" in Warm Grey #6B6459, "PreWaitlist"+icon in Deep Jade #0F7A5E,
centered, 24px vertical padding, Border Subtle top divider on light templates,
no shadow/gradient/box. Links to the F-A3 homepage variant.

Open gap: no verified Dark-template-safe secondary text color exists yet in the
design system. Placeholder used on Dark template pending an actual token
decision — do not treat the placeholder as final.

Files: `components/share/powered-by-footer.tsx` (shared component),
`components/onboarding/live-preview.tsx` (renders when tier = "free"),
`components/layout/marketing-layout.tsx` (bug fix — removed badge from homepage footer).

PRD ref: REQ-onboarding-preview.4 (scope exclusion), REQ-onboarding-preview.5 (visual spec + open TODO).

## Bug Fixes — Onboarding Preview & Milestone Rewards (2026-07-31)

### Bug 1: Dark template selector thumbnail was rendering light

**What was wrong:** The MiniPreview component for the Dark template had the correct
`bg-[--color-dark-template-bg]` class, but the div didn't fill its container (`h-[95px]
w-[137px]`). The parent button's `bg-card` (white) bled through the unfilled space,
making the thumbnail appear light/white.

**Fix:** Added `h-full w-full` to all three MiniPreview variants so they fill their
container completely. Dark thumbnail now shows near-black background with light bars.

**Root cause pattern:** When a child element has a background color but doesn't fill
its parent, the parent's background shows through. Always ensure background elements
fill their containers.

### Bug 2: Dark template live-preview was not rendering dark

**What was wrong:** Two issues: (1) BrowserFrame used `bg-[--color-foreground]` for
dark mode — this references a `@theme inline` variable which does NOT exist as a CSS
custom property, so the dark background never applied. (2) All dark template tokens
were referenced using `bg-[--color-dark-template-*]` arbitrary value syntax, which
fails for the same reason.

**Root cause:** Tailwind v4 `@theme inline` inlines values into generated utilities
but does NOT create CSS custom properties. `bg-[--color-foreground]` looks up a CSS
variable that doesn't exist. Must use the generated Tailwind utility class names
instead: `bg-foreground`, `bg-dark-template-bg`, `border-dark-template-border`, etc.

**Fix:** Replaced all `bg-[--color-dark-template-*]` arbitrary values with Tailwind
utility class names (`bg-dark-template-bg`, `text-dark-template-text`, etc.) across
all files: `live-preview.tsx` (BrowserFrame + DarkTemplate), `page.tsx` (MiniPreview),
`powered-by-footer.tsx`. Same fix applied to `bg-[--color-foreground]` references.

**Dark template color tokens (centralized in globals.css `@theme inline`):**

- `--color-dark-template-bg: #1c1917` → use as `bg-dark-template-bg`
- `--color-dark-template-text: #faf8f4` → use as `text-dark-template-text`
- `--color-dark-template-secondary: rgba(250, 248, 244, 0.7)` → use as `text-dark-template-secondary` (PLACEHOLDER)
- `--color-dark-template-muted: #a8a29e` → use as `bg-dark-template-muted`, `text-dark-template-muted`
- `--color-dark-template-border: #57534e` → use as `border-dark-template-border`

**Web research finding:** For scoped dark mode (just the preview panel, not the whole
app), CSS variables scoped to the container is the correct pattern — NOT Tailwind's
`dark:` variant which would leak to the entire page. However, the CSS variables must
be REAL CSS custom properties (defined outside `@theme inline`), not Tailwind theme
variables. The correct approach for `@theme inline` colors is to use the generated
utility class names directly (e.g. `bg-dark-template-bg`).

### Bug 3: Step 3 "Preview" box was not an OG-card mock

**What was wrong:** The Step 3 preview was a plain dashed box showing just headline
and subheadline as text. The designed element is a "Meta Preview" — a mock of what
the page looks like as a social-media link-unfurl card (OG card).

**Fix:** Rebuilt as a structured OG-card mock with:

1. Browser-chrome header (three dots, matching BrowserFrame style)
2. Inside: headline (bold), subheadline (grey), mini email input, mini "Join waitlist" button
3. Divider line
4. Domain in small grey text (e.g. "acme.prewaitlist.com")
5. Bold line "[Headline] — Join the waitlist"
6. Grey description line (subheadline text)

**Files changed:** `src/app/onboarding/3/page.tsx` (Meta Preview section)

### Bug 4: Milestone rewards were static, no editable reward_label

**What was wrong:** Three static rows reading "Refer 3 friends" / "Refer 10 friends" /
"Refer 25 friends" with no way for the founder to enter the actual reward. The
DEFAULT_REWARDS set both `name` and `value` to the same text, and there was no
label indicating what the input was for.

**Fix:**

- DEFAULT_REWARDS now have empty `value` fields (reward labels start blank)
- Each tier shows a fixed label ("Refer 3 friends" etc.) above an editable input
- Inputs have contextual placeholders (e.g. "e.g. Early access")
- Added validation: if milestone toggle is ON and any reward is empty, shows inline
  error and blocks submission
- REQ-6.8.3 updated in PRD to reflect correct behavior
- New REQ-6.8.6 added for Meta Preview OG-card structure

**DB schema alignment:** `milestone_rewards.reward_label text not null` — the
validation enforces this constraint client-side before API submission.

### Open gap: Dark template secondary text color

**Status:** UNRESOLVED — placeholder token used.

The design system explicitly notes "Dark template secondary text color token remains
unresolved." Using `--color-dark-template-secondary: rgba(250, 248, 244, 0.7)` (Warm
Ivory at 70% opacity) as a working placeholder. This affects subheadline text, input
placeholder text, and milestone list text on the Dark template. Do not treat this
value as final — needs a real token decision from design.

Same treatment as the earlier Dark-template gap noted on the "Powered by" footer
(REQ-onboarding-preview.5).

### Milestone Rewards — Editable Thresholds (2026-08-08)

**Status:** SHIPPED

Changed milestone rewards from 3 fixed tiers (3/10/25) to fully editable:

- Founder can set any positive integer threshold (not just 3, 10, 25)
- Founder can add tiers (1-5) or remove tiers (minimum 1)
- Live preview shows simulated subscriber view with locked/unlocked states
- Database schema updated: check constraint changed from `in (3,10,25)` to `> 0`
- API upserts milestone_rewards to separate table (delete + insert pattern)
- PRD REQ-6.8.3 updated to reflect new behavior

**MilestoneReward type changed:** `{ name, value }` → `{ threshold, label }`

- `threshold`: number (referral count)
- `label`: string (reward description)

### Epic 5 dashboard is a placeholder

**Status:** DECIDED — 2026-07-31

The dashboard built in Epic 5 (stat cards, getting-started checklist, nav tabs,
live URL display) is a **functional placeholder** — it satisfies Sprint 1's exit
condition (founder lands on a working dashboard after onboarding) but the UI is
not final design. All dashboard components will be **torn down and replaced** in
Sprint 2 when real subscriber data, analytics, and settings pages ship.

Do not treat any Epic 5 dashboard layout, styling, or component structure as
canonical. The API routes (`POST /api/updates`) and auth callback logic
(acquisition capture) are permanent — only the dashboard UI is placeholder.

### Performance Optimizations (2026-08-08)

**Status:** SHIPPED

#### Font Loading

- Removed render-blocking CSS `@import` for Inter from Google Fonts
- Added Inter via `next/font/google` with `adjustFontFallback: true`
- CSS variable `--font-sans` now references `var(--font-inter)` from next/font

#### State Persistence

- Onboarding form state persists to `localStorage` on every change
- On mount: restores from localStorage, then fetches fresh data from API
- Smart redirect: determines which step to resume based on data completeness
- Clears localStorage on success page after onboarding completes
- New GET endpoint: `GET /api/waitlist` returns full waitlist state

#### Loading States

- Added `src/app/onboarding/loading.tsx` skeleton
- Added `src/app/dashboard/loading.tsx` skeleton

#### Lazy Loading

- LivePreview now uses `next/dynamic` with `ssr: false`
- Shows spinner skeleton while loading

### Post-Sprint-1 Issue List (2026-08-08)

**Status:** All done (Epic 6 complete)

| #   | Issue                                                                                                        | Status   | File(s)                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Preview responsiveness — mobile stacks CTA below email                                                       | **Done** | `components/onboarding/live-preview.tsx`                                                                                                                                                                                                                  |
| 2   | Color picker with 8 preset swatches + hex input                                                              | **Done** | `src/app/onboarding/3/page.tsx`                                                                                                                                                                                                                           |
| 3   | Milestone rewards — editable thresholds, add/remove tiers, subscriber preview                                | **Done** | `src/app/onboarding/3/page.tsx`, `components/onboarding/live-preview.tsx`, `src/app/api/waitlist/route.ts`, `docs/stories/epic0.story03-supabase-schema.sql`                                                                                              |
| 4   | Loading slowness + state persistence — font fix, localStorage, GET endpoint, loading skeletons, lazy preview | **Done** | `src/app/layout.tsx`, `src/app/globals.css`, `src/app/onboarding/context.tsx`, `src/app/api/waitlist/route.ts`, `src/app/onboarding/loading.tsx`, `src/app/dashboard/loading.tsx`, `src/app/onboarding/layout.tsx`, `src/app/onboarding/success/page.tsx` |
| 5   | Qualification step dropdown broken                                                                           | **Done** | `src/app/onboarding/4a/page.tsx`                                                                                                                                                                                                                          |
| 6   | Powered by footer uses brand color + full logo                                                               | **Done** | `components/share/powered-by-footer.tsx`                                                                                                                                                                                                                  |
| 7   | Pro preview explanation                                                                                      | **Done** | `src/app/onboarding/5/page.tsx` (replaced by comparison card in Story 6.3)                                                                                                                                                                                |
| 8   | Success page scrollable                                                                                      | **Done** | `src/app/onboarding/success/page.tsx`                                                                                                                                                                                                                     |
| 9   | Dashboard link semi-bold                                                                                     | **Done** | `src/app/dashboard/client.tsx`                                                                                                                                                                                                                            |
| 10  | Dashboard fallback name shows "PreWaitlist" instead of founder's product                                     | **Done** | `src/app/dashboard/client.tsx`                                                                                                                                                                                                                            |
| 11  | Meta preview CTA uses user's brand color                                                                     | **Done** | `src/app/onboarding/3/page.tsx`, `src/app/onboarding/success/page.tsx`                                                                                                                                                                                    |
| 12  | Milestone knob right                                                                                         | **Done** | —                                                                                                                                                                                                                                                         |
| 13  | Optional questions visible                                                                                   | **Done** | —                                                                                                                                                                                                                                                         |
| 14  | Email customisation GIF → replaced by email mock in Story 6.3                                                | **Done** | `src/app/onboarding/5/page.tsx`                                                                                                                                                                                                                           |
| 15  | Move signup to after Step 3 (Hopkins' sampling)                                                              | **New**  | `src/app/onboarding/context.tsx`, `src/app/(auth)/signup/page.tsx`, `src/app/auth/callback/route.ts`                                                                                                                                                      |
| 16  | Signup counter bar (social proof)                                                                            | **New**  | `src/app/(public)/[subdomain]/page.tsx`, `components/onboarding/live-preview.tsx`, `src/app/onboarding/3/page.tsx`                                                                                                                                        |

### Issue #15: Move Signup to After Step 3 (Hopkins' Sampling) — 2026-08-10

**Status:** Done (Story 6.0 + 6.3)

**The Problem:** Current flow asks for signup before user experiences the product. This violates Hopkins' rule of sampling — users should experience the product first, making signup a natural action.

**The Solution (practical middle path):**

- Don't rebuild the whole flow — just move where the signup wall sits
- Steps 1-3 (name, template, customize) run WITHOUT auth using localStorage
- Prompt signup BEFORE Step 4 — framed as "create an account to save this and keep going"
- Step 4+ (qualification, email setup) needs auth because tier-gated

**Why it works:**

- Hopkins' principle: "Let the product sell itself through free trials"
- Data: 47% of consumers who try via sampling end up purchasing
- Early access converts 30-50% vs waitlist's 5-15%
- Tally example: "Create a free form — No signup required" → 500K+ users

**Implementation approach:**

1. Steps 1-3 store state in localStorage only (no API calls)
2. After Step 3, show "Save your progress" → Signup/Login
3. On signup, flush localStorage to API
4. Continue with Step 4-5 (requires auth)
5. Login redirect checks: if no waitlist → Step 1, if incomplete → resume step

**Risk:** User abandons after Step 3 but before signup (localStorage only, no DB record). Mitigation: show "You'll lose progress" warning.

**Files to modify:**

- `src/app/onboarding/context.tsx` — localStorage-only mode for Steps 1-3
- `src/app/onboarding/1/page.tsx` — Skip API call, store in localStorage
- `src/app/onboarding/2/page.tsx` — Skip API call, store in localStorage
- `src/app/onboarding/3/page.tsx` — Skip API call, store in localStorage
- `src/app/onboarding/4/page.tsx` — Add signup prompt before continuing
- `src/app/(auth)/signup/page.tsx` — Handle localStorage flush on signup
- `src/app/auth/callback/route.ts` — Handle localStorage flush on OAuth

### Issue #16: Signup Counter Bar (Social Proof) — 2026-08-10

**Status:** Done (Story 6.0)

**The Research:** Live signup counters outperform vague claims. Proof placed next to signup form reduces "is this real?" hesitation at the moment of decision. Low build cost — data pipeline already exists.

**Key Guardrails (from Claude chat advice):**

1. **Cold-start problem:** A brand-new waitlist showing "3 people in line" actively hurts. Make it a founder toggle, OFF by default — founder chooses when to turn it on.

2. **Must be real, always:** Never seed, pad, or estimate. Fake counters are "detectable in three seconds by anyone who's seen one before." This is Hopkins' rule restated.

3. **Don't copy the reference literally:** Red accent and slider don't belong (conflicts with single-jade-accent rule). Treat as "confirms the concept is worth having," not visual reference.

4. **Queue-position display** ("You're #157 in line") is already built post-signup — that's the higher-leverage mechanic. Total-count counter is the smaller, easier piece.

**Implementation approach:**

- Toggle in Step 3 (Make It Yours), next to milestone rewards toggle, OFF by default
- Pull live count from same subscriber data backing post-signup position display
- Hide when <10 signups (avoid embarrassing low numbers)
- Server-side only endpoint: `GET /api/waitlist/count`
- Atomic counter in database (increment on insert)
- Rate limit: 60 req/min per IP
- Cache count (don't COUNT(*) on every request)

**Security layers:**

1. Server-side only count endpoint (never expose Supabase directly)
2. Atomic counter in same transaction as insert
3. Honeypot field + timestamp validation (reject <2s submissions)
4. Rate limiting (5-10 signups per IP per hour)
5. Email validation (syntax + disposable blocklist + MX check)

**Files to modify:**

- `src/app/onboarding/3/page.tsx` — Add counter toggle (next to milestone rewards)
- `src/app/api/waitlist/route.ts` — Add GET /api/waitlist/count endpoint
- `src/app/(public)/[subdomain]/page.tsx` — Display counter on public waitlist page
- `components/onboarding/live-preview.tsx` — Show counter in preview when enabled
- Database: Add `signup_counter_enabled` column to waitlists table

**PRD ref:** New requirement — worth writing up as REQ-6.8.x (counter toggle in Step 3).

## Epic 10 Progress (Public Waitlist Page & Onboarding Redesign)

| Story | Status  | Summary                                                                     |
| ----- | ------- | --------------------------------------------------------------------------- |
| 10.0  | ✅ done | Schema migration — `product_name` column on waitlists, API support          |
| 10.1  | ✅ done | Fix critical bugs — headless UI, hydration, preview styling                 |
| 10.2  | ✅ done | Accessibility fixes — ARIA, keyboard nav, focus management                  |
| 10.3  | ✅ done | Design system normalization — Tailwind canonical classes, token consistency |
| 10.4  | ✅ done | Public page layout redesign — product name/logo on public page + preview    |
| 10.5  | ✅ done | Onboarding field architecture — headline vs productName separation          |
| 10.6  | ✅ done | Name-it-later fix — deferred naming flow                                    |
| 10.7  | ✅ done | Inconsistency resolution — cross-story fixes, final cleanup                 |

**Branch:** `epic-10` (merged to `dev`)

**Key decisions (Epic 10):**

- Product name is internal metadata; headline is what displays on the public page
- Product name + logo removed from onboarding sidebar — now only on preview and public page
- `WaitlistTemplateContent` is the shared rendering component for both preview and public page
- BrowserFrame uses `max-h` + `overflow-y-auto` + `shrink-0` header for scroll fix
- Signup counter wrapped in `rounded-full` pill with `bg-muted` background
- Headline typography: `font-semibold` (not `font-bold`)
- Subheadline typography: `font-medium` added

## Gotchas / Corrected Assumptions

- **Onboarding architecture overhaul (2026-08-11):** The single `OnboardingProvider` with `useSyncExternalStore` was replaced by a two-provider split: `LocalOnboardingProvider` (Phase A, Steps 1-3, localStorage) + `AuthedOnboardingProvider` (Phase B, Steps 4-5, API). `FlushGate` handles the transition. This eliminated the hydration race, persist-effect-overwrite, and `DONE_KEY` issues entirely. The old gotcha about `useSyncExternalStore` returning `getServerSnapshot()` during hydration is no longer relevant — the new architecture uses plain `useState` with a lazy initializer that reads localStorage directly.
- **`react-hooks/set-state-in-effect` (ESLint):** calling `setState` synchronously in an effect body is an error in this config. Workaround: use lazy `useState` initializer for localStorage reads, or `useRef` for values that don't need to trigger renders.
- **Tailwind v4 scans ALL project files** — including `.md` files. If documentation contains text like `text-[length:var(...)]` or `text-[var(--badge-font-size)]` (even in backtick code spans), Tailwind generates broken CSS utilities from them. Fix: add `@source not "../../docs"` and `@source not "../../.memory"` to `globals.css`.
- **`--font-*` is Tailwind's font-FAMILY namespace — font weights must be `--font-weight-*` (bug fixed 2026-09-30):** `globals.css` `@theme` defined `--font-medium: 500`, `--font-extrabold: 800` etc. (wrong namespace) → every `font-*` weight utility compiled to invalid `font-family: 500` (browser drops it) → **all font-weight utilities were dead app-wide** (headline looked unchanged after Epic 18 round-2; brand/buttons unbold too). Fix: renamed the token block to `--font-weight-*` + updated all `var(--font-*)` refs (15 presets + `--button-font-weight`). Compiled proof: `.font-extrabold { font-weight: 800 }` instead of `font-family: 800`. Note: presets still worked during the bug (referenced theme vars ARE emitted to `:root` — `@theme inline` emits referenced vars, contrary to the older blanket note above); utility classes are the casualty. Tailwind Discussion #17524 confirms family-over-weight is expected behavior.
- **`--text-*` tokens in `@theme` conflict with Tailwind's `text-` utility namespace** — Tailwind v4 auto-generates utilities from `@theme` token names. Tokens starting with `--text-` get interpreted as color utilities, not font-size. Use direct Tailwind classes (`text-xs`, `text-sm`) instead of `text-[var(--text-xs)]`.
- **`components/` directory is at project root, NOT under `src/`** — Files at `components/` cannot be imported with `@/components/` from `src/` files. Use relative paths (`../../components/...`) or move shared components to `src/components/`. Only `src/components/auth/` exists under `src/`.
- **`anonymizeEmail` extracted to `src/lib/format.ts`** — Both leaderboard page and API route import from `@/lib/format`. Don't duplicate the function.
- **Social proof counter is inline in `WaitlistTemplateContent`** — Not a separate component. Lives at lines 70-85 of `components/share/waitlist-template-content.tsx`.
- **`milestone_rewards` table schema:** `{ id, waitlist_id, tier_referrals (int), reward_label (text) }`. Default tiers in onboarding being changed from 3/10/25 to 1/5/10/25. PRD check constraint updated to `> 0` (was `in (3,10,25)`).
- **`founder_updates` table:** `{ id, waitlist_id, body, sent_at (nullable, added Story 7.6), created_at }`. Post/insert exists, public read RLS exists. No edit/delete. Plain text only.
- **`sent_at` column on founder_updates:** Nullable timestamptz. NULL = email not yet sent. Updated after Resend batch send completes. Not used for on-page display ordering (use `created_at`).
- **`subscribers` table additions (Story 7.6):** `warmth_score` (text, nullable, check: in hot/warm/cold), `milestones_earned` (jsonb, nullable — format: `[{ threshold, label, earned_at }]`), `milestones_notified` (jsonb, nullable — format: `[5, 10, 25]`). All for Sprint 3 scoring + milestone trigger tracking.
- **`page_views` table (Story 7.6):** `{ id, subscriber_id (FK, nullable), waitlist_id (FK), path (text), created_at }`. For warmth tracking foundation. No real-time scoring yet. RLS: founders manage own, public insert for anonymous visitors.
- **`email_events` table (Story 7.6):** `{ id, subscriber_id (FK), waitlist_id (FK), event_type (text, check: in sent/delivered/opened/clicked/bounced), created_at }`. For warmth tracking foundation. RLS: founders manage own only (no public insert — server-side only).
- **Warmth tracking:** Schema created in Story 7.6. Runtime scoring deferred to Sprint 3.
- **Email-first engagement data:** Email nurture 35-50% open rate, 5-12% CTR. On-page updates have zero proven engagement data. Every major waitlist platform uses email exclusively.
- **Milestone fulfillment research:** KickoffLabs, Viral Loops, Prefinery, SparkLoop, Morning Brew all follow tracker+notifier model. No platform fulfills rewards.
- **Resend SDK:** `resend` package installed (v6.23.0). API key in .env.local. Client at `src/lib/resend.ts`. Batch API: `resend.batch.send([...])`, max 100/batch.
- **Milestone trigger scope:** In Story 7.6, `src/lib/milestones.ts` checks + notifies (sends congratulatory email) + auto-boosts position to 1 for "skip the line" rewards. Accumulator pattern prevents stale array bugs.
- **Supabase join type quirk:** When using `.single()` with `waitlists!inner ( founder_profiles!inner ( ... ) )`, TypeScript types `waitlists` as an array. Workaround: `subscriber.waitlists as unknown as { id: string; subdomain: string; headline: string; founder_profiles: { tier: string }[] }`.
- **`shadow-float`** is used via `shadow-[var(--shadow-float)]` (not a Tailwind utility class). `--card-shadow: none` in globals.css.
- **Import path for components from nested routes:** From `src/app/(public)/[subdomain]/thank-you/page.tsx`, components at project root need 5 `..` levels: `../../../../../components/share/...`.
- **Referral flow architecture:** `EmailCaptureForm` sends `referral_code` (from `?ref=` URL param) to `POST /api/subscribers`. API resolves `referral_code` → subscriber UUID (`referrer_id`) by looking up subscriber, validates same-waitlist and prevents self-referral. Self-referral is silently nullified (safety net, not a hard rejection).
- **POST /api/subscribers body field:** Uses `referral_code` (renamed from original `referrer_id` to avoid conflict with generated referral code). Internal variable is `incomingRefCode`.
- **Story 8.4 batch query pattern:** Fetch subscribers (1 query) + `.in("referrer_id", subscriberIds)` (1 query) → count in memory via Map. 2 total queries, not N+1.
- **Story 8.4 TABLE_COLUMNS:** `["Name", "Email", "Position", "Warmth", "Referrals", "Date"]` — 6-column grid. Name and Warmth show "—" (no data). Referrals right-aligned, muted for zero, font-medium for non-zero.
- **Story 8.4 sort:** Client-side sort via `useMemo`, default `referral_count` desc. Clickable headers for Referrals and Position columns with ↑/↓ indicator.
- **Story 8.4 Subscriber interface:** `{ id: string; email: string; position: number; referral_count: number; created_at: string }`
- **Dashboard subscriber data flow:** `page.tsx` (server) fetches subscribers + batch referral counts, passes `subscribersWithCounts` to `DashboardClient` (client).
- **Self-referral behavior mismatch:** Story AC5 says "rejects self-referral (returns 400)" but implementation silently nullifies referrer_id. Tests match actual behavior, not story AC wording.
- **E2E test limitation:** Thank-you flow e2e test (`tests/e2e/thank-you-flow.spec.ts`) requires running server with seed data; tests use minimal assertions (page loads without JS errors, missing params → 404/500).
- **Playwright config exists:** `playwright.config.ts` with `webServer: { command: "pnpm build && pnpm start" }`.
- **ReferralLink component:** Now has copy icon button with execCommand fallback (not just clipboard API). Also used `copyToClipboard` helper function in both ReferralLink and ShareButtons.
- **Thank-you page dynamic referral link:** Uses `headers()` to read `host` and `x-forwarded-proto` from request headers — referral link is now `http://` on localhost, `https://` in production. Not hardcoded to `prewaitlist.com`.
- **Thank-you referred variant design:** Uses inline pill badge (`bg-accent/10 px-3 py-1 rounded-full`) with "Referred by {FirstName}" — NOT a separate section above the card. Referrer name derived from email local part, capitalized.
- **Middleware double-subdomain guard:** Middleware rewrite at line 110 checks if path already starts with `/${subdomain}` before prepending — prevents double-subdomain on routes like `/:subdomain/leaderboard`.
- **Leaderboard pagination:** Uses page-based prev/next (not "View More" append). `page` state (0-indexed), `rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)`. "Showing X–Y of Z" counter.
- **Leaderboard column alignment:** All columns centered (`text-center`) with uniform `gap-8` between columns. Grid: `[80px_1fr_120px_140px]` on desktop.
- **Leaderboard headers:** Use `text-body-sm font-medium` (14px) — NOT `text-caption` (12px). Design SVG showed larger headers than initially implemented.
- **Leaderboard tiebreaker:** Secondary sort by `created_at ASC` (earlier signup = higher rank for ties). Previously returned `0` for equal referral counts.
- **EmailCaptureForm Suspense:** Wrapped in `<Suspense>` boundary on public page to prevent SSR hydration issues with `?ref=` URL param reading.
- **React 18 batching + async event handlers (CRITICAL):** `useEffect(() => { stateRef.current = state; }, [state])` only runs AFTER React commits state and re-renders. React 18 batches `setState` calls and commits them only when the async event handler's call stack fully unwinds. An `await` inside an async event handler does NOT cause React to commit the batch. Therefore, `stateRef` synced via `useEffect` is STALE when read within the same event handler — the old `flushToAPI` closure reads the pre-update values. Fix: update `stateRef.current` synchronously inside `updateField`/`setWaitlistId`/`setLoading`, not via useEffect.
- **PoweredByFooter standalone mode:** The `PoweredByFooter` component renders with a white background by default. On public waitlist pages and thank-you pages (which have `bg-background` warm ivory), this creates a visible white band. Fix: add `standalone?: boolean` prop — when true, no bg class (inherits parent bg), template-aware border/text. Pass `standalone` from `waitlist-page-content.tsx` and `thank-you/page.tsx`.
- **Dashboard product name:** `src/app/dashboard/page.tsx` must select `product_name` from the waitlists query and pass it as `waitlistName` to `DashboardClient`. The sidebar uses this prop. If not selected, sidebar shows empty.
- **Headline/subheadline typography on public page:** `WaitlistTemplateContent` headline uses `font-semibold` (not `font-bold`), subheadline uses `font-medium`. These match the design spec more closely.
- **Sidebar `locked: true` hardcode bug (2026-09-14):** Story 12.1.8 added `locked: true` to the Broadcast nav item in the sidebar, which meant Broadcast was always locked regardless of tier. The `isLocked` logic at line 346 already handles `item.label === "Warmth" && tier === "free"` — other items should NOT have `locked: true` hardcoded. Fix: remove `locked: true` from Broadcast, set `href: "/dashboard/broadcast"`.
- **Login redirect bug (deprioritized):** Browser client Supabase singleton caches stale session. `signOut()` added to browser client (`src/lib/supabase/client.ts`) but issue still reproduces. User instruction: "lets leave it for now" — do not investigate further.
- **"View Public Page" link (Vercel DNS):** Code at `src/app/dashboard/client.tsx:351` constructs `https://${subdomain}.prewaitlist.com` — code is correct but `*.prewaitlist.com` wildcard domain is not configured in Vercel. User must add it manually: Vercel Dashboard → Settings → Domains → "Add Existing" → `*.prewaitlist.com`. This is a Vercel config step, not a code fix.
- **Unicode escape sequences (2026-09-14):** `client.tsx` had literal `\u2013`, `\u2014`, `\u2019`, `\u2192` escape sequences instead of actual characters (–, —, ', →). Fixed during 12.1.8/12.1.9 execution.
- **Settings hub layout:** Content left-aligned (`max-w-2xl px-8 py-12`, no `mx-auto`), vertical card list with brand color accents (green icon backgrounds, hover effects), sign out button at bottom. Cards use `rounded-xl border border-border bg-card` with hover state (`hover:border-accent/30 hover:bg-accent/50`).
- **Sidebar nav items:** Active pill uses `rounded-[10px]` (not `rounded-full`). CONFIG section pinned to bottom via `mt-auto` in the `<aside>` flex column. ACCOUNT section (Profile, Security) removed — settings hub has its own sign out button. Gear icon for Settings (hexagonal cog shape). **Signout removed from sidebar** — sign out lives in the settings hub page (`/dashboard/settings`) only, not in the sidebar component. Sidebar has no `onSignOut` prop.
- **Settings three-level hierarchy:** Hub (`/dashboard/settings`) → Waitlist List (`/dashboard/settings/waitlists`) → Waitlist Detail (`/dashboard/[waitlistId]/settings`). Profile at `/dashboard/settings/profile`. Security redirects to profile.

## Epic 13 Gotchas (Billing & Feature Gating)

- **Paddle SDK `customerPortalSessions.create()` return type:** The actual SDK returns `{ urls: { general: { overview: string } } }` — NOT `{ url: string }` or `{ data: { url: string } }`. The `data.url` pattern from older Paddle SDK docs is incorrect for Paddle Billing (vs Paddle Classic). Always use `session.urls.general.overview`.
- **`after` from `next/server` fails in test context:** `vi.mock("next/server", ...)` can mock `after`, but the mock must return `fn()` synchronously: `after: vi.fn((fn) => fn())`. Without this, callbacks passed to `after()` never execute in tests.
- **Resend `domains.verify()` lacks `status` field:** After calling `resend.domains.verify()`, you must call `resend.domains.get()` separately to check if the domain status changed to "verified". The verify response itself doesn't include the updated status.
- **`components/` at project root, not under `src/`:** Billing components (`subscription-card.tsx`, `plan-comparison.tsx`, etc.) live in `components/billing/`, not `src/components/billing/`. Import from `../../../../components/billing/...` in settings pages (5 levels up from `src/app/dashboard/settings/profile/client.tsx`).
- **Settings profile page padding fix (2026-09-20):** Profile sub-page was missing `max-w-2xl px-8 py-12` on root `<div>`, causing content to sit flush against the sidebar. The settings hub page had this padding but the profile sub-page didn't. Always match padding across settings sub-pages.
- **SQL migrations needed before deploying Epic 13:** `epic13-story3-paddle-customer-id.sql` (adds `paddle_customer_id` column to `founder_profiles`) + `epic13-story5-resend-domain-id.sql` (adds `resend_domain_id` column to `waitlists`). Without these, Paddle portal session creation and domain auth will fail at runtime.

## Epic 13 Post-Deployment Fixes (2026-09-22)

### Billing Page Polling After Checkout

- **Problem:** Billing page fetched tier once on mount, never re-fetched after Paddle checkout. Even if the webhook updated the tier to "pro", the page stayed "free".
- **Fix:** Billing page now listens for `paddle-checkout-opened` custom event dispatched by `UpgradeModal`, then polls `/api/profile` every 2s for 30s. Stops polling when tier becomes "pro".
- **Files:** `src/app/dashboard/settings/billing/client.tsx`, `components/dashboard/upgrade-modal.tsx`
- **Date:** 2026-09-22

### Webhook: Handle `transaction.completed`

- **Problem:** Paddle Billing v2 sends `transaction.completed` for the initial payment before `subscription.created`/`subscription.activated`. The webhook only listened for subscription events, so the first payment was silently ignored and the tier never updated.
- **Fix:** Added `transaction.completed` to `SUPPORTED_EVENTS` and a case handler that extracts `customData.user_id` and `customerId`, sets tier to "pro" with `subscriptionId` from the transaction if available.
- **File:** `src/app/api/webhooks/paddle/route.ts`
- **Date:** 2026-09-22

### Profile API: `.single()` → `.maybeSingle()`

- **Problem:** `GET /api/profile` used `.single()` for the waitlist query. If a user had 0 or 2+ waitlists, `.single()` throws a 400 error. The billing page's `.catch(() => {})` silently swallowed it, defaulting to "free".
- **Fix:** Changed to `.maybeSingle()` which returns null instead of throwing.
- **File:** `src/app/api/profile/route.ts`
- **Date:** 2026-09-22

### Upgrade Modal Error Handling

- **Problem:** Checkout API errors were silently swallowed. If the API returned an error (e.g., "Already subscribed"), the modal just did nothing.
- **Fix:** Added `res.ok` check, `data.error` validation, and `console.error` for failed checkouts.
- **File:** `components/dashboard/upgrade-modal.tsx`
- **Date:** 2026-09-22

## Seamless Onboarding Upgrade (2026-09-22)

- **Decision:** User upgrades via Paddle and continues exactly where they stopped in onboarding. They click Next themselves, no auto-advance.
- **Implementation:** `usePaddleUpgrade` hook (`src/hooks/use-paddle-upgrade.ts`) opens checkout, polls `/api/profile` every 2s, cleans up on unmount. `OnboardingUpgradeContext` in `onboarding-client-layout.tsx` wraps Steps 4a and 5 with `UpgradeModalWrapper`.
- **Files:** `src/hooks/use-paddle-upgrade.ts`, `src/app/onboarding/onboarding-client-layout.tsx`, `src/app/onboarding/4a/page.tsx`, `src/app/onboarding/5/page.tsx`
- **Date:** 2026-09-22

## User Decisions (2026-09-22)

### Pricing CTA

- **Decision:** Marketing homepage pricing CTA: logged-in users see "Open Dashboard" button; anonymous users sign up/login first.
- **Date:** 2026-09-22

### Free Dashboard Warmth UX

- **Decision:** Free users see warmth stat numbers (hot/warm/cold) without lock icon. WarmthPanel shows bars + "Upgrade to target segments" nudge badge. TopReferrers hidden for free.
- **Date:** 2026-09-22

### Upgrade Modal Cooldown

- **Decision:** Reduced from 7 days to 1 day (`COOLDOWN_DAYS = 1`). User found 7-day cooldown too aggressive.
- **Date:** 2026-09-22

### CSV Export Placement

- **Decision:** CSV export button on leaderboard page next to the data, NOT in settings.
- **Date:** 2026-09-22

### 90% Subscriber Cap Email

- **Decision:** Single CTA email linking to `/dashboard?upgrade=cap`. Single-CTA emails get 371% more clicks.
- **File:** `src/app/api/subscribers/route.ts` — after insert, checks `subscriber_count >= 450` + free tier, sends email.
- **Date:** 2026-09-22

### Paddle Sandbox on Production

- **Decision:** Test Paddle in sandbox mode on the production Vercel deployment (not localhost). All Paddle env vars are sandbox tokens. Webhook endpoint must be configured in Paddle sandbox dashboard at `sandbox-vendors.paddle.com`.
- **Status:** Paddle domain `prewaitlist.com` submitted for approval. Waiting for approval before checkout works end-to-end.
- **Date:** 2026-09-22

## Billing Page Gotchas

- **Billing page fetches tier independently from layout** — dashboard layout gets tier server-side, billing page gets it client-side via `/api/profile`. These should match but there's a timing window where they differ.
- **`profile?.tier || "free"` fallback** — If the API returns null/undefined for tier (e.g., profile not found), defaults to "free". This is correct for new users but misleading if the profile query fails silently.
- **`UpgradeModal` dispatches `paddle-checkout-opened` custom event** — billing page listens for this to start polling. Other pages that trigger upgrades also get this event.
- **Paddle sandbox tokens on production** — `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_*`, `NEXT_PUBLIC_PADDLE_ENV=sandbox`, `PADDLE_API_KEY=pdl_sdbx_*`, `PADDLE_WEBHOOK_SECRET=pdl_ntfset_*`. These connect to `sandbox-vendors.paddle.com`. Sandbox checkouts only work with sandbox accounts. Domain approval needed for custom checkout domains.
- **Webhook signature verification** — Uses `paddle.webhooks.unmarshal(body, secret, signature)` from `@paddle/paddle-node-sdk`. Body must be raw text (`req.text()`), not JSON — HMAC breaks if body is re-serialized.
- **`customData` passed through checkout → webhook** — `paddle.Checkout.open({ customData: { user_id, waitlist_id, trigger_source } })`. Webhook reads `data.customData?.user_id` to identify the founder. If missing, webhook logs error and returns early without updating tier.

## Session Work — Paddle Diagnostics + Dashboard Tier Refresh (2026-09-22/23)

### Commit `2cf62be` — Paddle checkout diagnostics (2026-09-22)

- **Message:** `fix: paddle checkout diagnostics, success redirect, webhook logging` (5 files, +106/−30)
- Added checkout diagnostics, post-checkout success redirect, and structured webhook logging so failed/silent Paddle events become observable in Vercel logs.
- Merged to `main` same day.

### Open Blocker — Paddle webhook 308 redirect (UNRESOLVED, user action)

- **Symptom:** Paddle events never reach `/api/webhooks/paddle` — destination URL is apex `https://prewaitlist.com/api/webhooks/paddle` (no `www`) → 308 redirect → **Paddle does not follow redirects**.
- **Fix (user, in Paddle sandbox dashboard at `sandbox-vendors.paddle.com`):** change destination to `https://www.prewaitlist.com/api/webhooks/paddle`, then re-send a failed event or run a new test payment.
- **Verify:** Vercel logs show `Paddle webhook received` and `founder_profiles.tier` flips to `pro`.
- Signing secret suffix `…ySB9` matches `PADDLE_WEBHOOK_SECRET` — secret itself is fine.
- **Sandbox test cards (given to user):** success `4000 0566 5566 5556`, 3DS `4000 0276 0003 1981`, decline `4000 0000 0000 0002`.
- `.env.local` sandbox keys (gitignored, **do not commit**): `PADDLE_API_KEY=pdl_sdbx_apikey_…`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_e2c0a872d3be44905be553a1a77`, `NEXT_PUBLIC_PADDLE_ENV=sandbox`, `PADDLE_WEBHOOK_SECRET=pdl_ntfset_…ySB9`, `PADDLE_PRO_PRICE_ID=pri_01m372ngyv142t467ar24w3pk6`. Vercel env still unverified (no `vercel` CLI installed).

### Commit `211085f` — Dashboard tier refresh mechanism (2026-09-23)

**Problem:** After a successful Paddle upgrade, the sidebar stayed locked (`tier="free"`) until a full page reload — server layout tier prop never refreshed client-side.

**Design (approved plan:** `.sisyphus/plans/dashboard-tier-refresh.md`, untracked):

- Shell owns tier as **client state** seeded from server prop.
- **Poll** `GET /api/profile` every **2s** for **60s cap** after upgrade triggers.
- **Triggers:** `paddle-checkout-opened` custom event (from `UpgradeModal`), `tier-changed` custom event, mount-only `?upgraded=1` (read via `window.location.search`, stripped with `history.replaceState`), cross-tab `BroadcastChannel("prewaitlist-tier")`.
- **`router.refresh()`** on every tier change so server layout/sidebar seed stays current.
- Context expands to `{ tier, activeWaitlistId, setUpgradeModal, refreshTier }`; new export **`useRefreshTier()`**.
- Billing page: tier resolution `contextTier || profile?.tier || "free"` (context = source of truth); mount re-fetch at **0/2/5s** dispatching `tier-changed` when tier ≠ current; local poll retained for `?upgraded=1`/checkout races.

**Files:**

- `src/app/dashboard/shell.tsx` — rewritten: `useState(serverTier)` + `tierRef` + `applyTier`; `stopTierPolling`/`startTierPolling`; `fetchTier`; `refreshTier` (one-shot + dispatch `tier-changed`); `broadcastTier`; event listeners; `?upgraded=1` handling; BroadcastChannel; `useRefreshTier`.
- `src/app/dashboard/settings/billing/client.tsx` — context-first tier, mount sync 0/2/5s, dispatches `tier-changed`.
- `src/__tests__/components/dashboard-context.test.tsx` — updated (`baseValue` with `setUpgradeModal` + `refreshTier`; new `useRefreshTier` test).
- `src/__tests__/components/dashboard-tier-refresh.test.tsx` — **new, 10 tests** (init lock state, poll-on-checkout, stop-after-success, 60s cap, `tier-changed`, `?upgraded=1` strip, `refreshTier`, server-prop sync, unmount cleanup).

**Deliberately NOT changed:** `components/billing/cancellation-flow.tsx` — cancel happens in Paddle portal externally; billing mount re-fetch at 0/2/5s covers the race.

**Verification:** `pnpm lint` → 0 errors, 5 pre-existing warnings. Full suite → **443 passed, 7 failed** (exact baseline: `dashboard-archive` 4 + `dashboard-subscriber-table` 3). Targeted tier-refresh + context = 15/15.

**Deployed:** commit `211085f` → push `dev` → FF merge → push `main` (both remotes at `211085f`). On branch `dev` after deploy. Vercel auto-deploys from `main`.

### Gotchas learned this session

- **Parallel git command calls race** — `status`/`log`/`push` issued together can report pre-commit state. Run git operations **sequentially**.
- **`react-hooks/set-state-in-effect`:** shell server-prop→state sync effect and billing `contextTierRef` sync must not assign refs/setState "during render"; ref sync lives in `useEffect`, state updates go through `applyTier`.
- **Circular dispatch safety:** shell `onTierChanged` handler checks `detail.tier !== tierRef.current` before acting; BroadcastChannel message back is a no-op because `tierRef` already updated.
- **Fake timers + `waitFor` hang** — use `vi.advanceTimersByTimeAsync` inside `act`; do not combine Vitest fake timers with RTL `waitFor`.
- **`.sisyphus/` plan folder is untracked** — intentional; do not commit unless asked.
- **Test baseline for full-suite runs:** 7 fixed failures (`dashboard-archive` 4 + `dashboard-subscriber-table` 3) + flaky `billing.test.ts` webhook test in full suite (passes in isolation). New failures beyond this count indicate a real regression.

## Execute batch — billing guard + reconcile cron + updates fixes + social meta (2026-10-03)

**Status:** Phases A–D implemented, **uncommitted**, branch `engine-fix-billing-updates-meta` (from `epic-18-waitlist-redesign` = `dev` = `c6876dc`). Source: Prompt #2 `execute [ ]` of the 2026-10-03 investigation (3 issues, 5 locked founder decisions). No SQL. No new deps/env.

**Founder decisions (locked, 2026-10-03):**

1. Billing hardening = **both** a `transaction.completed` guard **and** a daily reconciliation cron.
2. U6 copy = strip TODO marker → `"Update saved, but emails could not be sent."` (approved verbatim).
3. og:title = PRD REQ-6.8.6 suffix `"{headline} — Join the waitlist"` on **og/twitter only** — document `<title>` stays the plain headline.
4. Sub-page titles reuse on-page headings: thank-you `"{headline} — You're in."`, leaderboard `"{headline} — Leaderboard"`.
5. Story 16.8 stays a separate story (its Share % COPY GAP L3 untouched).

**Phase A — billing (P0/P1):**

- `src/lib/archive-surplus.ts` — **new**: `archiveSurplusWaitlists` extracted verbatim from the webhook route; shared by webhook + cron.
- `src/app/api/webhooks/paddle/route.ts` — `transaction.completed` guard after `txUserId`: profile select (`paddle_subscription_id, paddle_subscription_status`, `.maybeSingle()`) → 500 on lookup error; **skip upgrade + ack** iff stored status is `canceled` AND `txData.subscriptionId === profile.paddle_subscription_id` (same canceled sub = charge-after-cancel noise; a _different_ sub id = genuine re-subscribe → upgrade).
- `src/app/api/cron/billing-reconcile/route.ts` — **new** daily cron: `Bearer CRON_SECRET` auth (500 if unset, 401 if bad); scans pro rows (downgrade/health-heal) + free rows with a stored sub id (missed-upgrade heal) via `paddle.subscriptions.get()`; **downgrade only on API-confirmed `canceled`**; API throw → error count, **never a downgrade**; profile lookup error → 500. Returns `{checked, downgraded, upgraded, healed, skipped, errors}`.
- `vercel.json` — added `{ "path": "/api/cron/billing-reconcile", "schedule": "30 4 * * *" }` (4th cron; Vercel plan allows ≥3 confirmed).
- Tests: `webhook-paddle.test.ts` +3 (same-canceled-sub ignored; new sub id upgrades; guard lookup fail → 500) = 13 total; `cron-billing-reconcile.test.ts` **new, 8**. 21/21 green.

**Phase B — updates engine (D4/D9iii/U6):**

- `src/app/api/updates/route.ts` — subscriber select now destructures `error: subscribersError` and **throws `"Failed to load subscribers"`** (D4: read failure no longer masquerades as `"No eligible recipients"`; lands in outer catch → `emailError`); body coercion `typeof body?.body === "string"` (D9iii: non-string body → 400 validation instead of TypeError 500).
- `src/app/dashboard/updates/client.tsx` — `EMAIL_FAILED_COPY` = `"Update saved, but emails could not be sent."` (U6 marker stripped).
- Tests: `updates.test.ts` +2 (D4 + non-string 400) = 18; compose test literal updated. 27/27 green; repo-wide zero `TODO_COPY_GAP_U6` refs.

**Phase C — social meta/OG:**

- `(public)/[subdomain]/page.tsx` — `ogTitle` suffix applied to `openGraph.title` + `twitter.title` only.
- `thank-you/page.tsx` + `leaderboard/page.tsx` — `generateMetadata` reusing on-page headings; incomplete/unknown link → `{}` (root title, no "Invalid link" leaked into tabs/shares).
- `src/app/layout.tsx` — root `openGraph` defaults (`siteName/type/locale`) + `twitter.card = summary_large_image`.
- `src/app/opengraph-image.tsx` — **new** branded static fallback card (existing root title/description copy only, design-token colors).
- `alt = "PreWaitlist"` exported on both og-image routes.
- **Middleware allowlist fix (founded during live curl):** `src/lib/supabase/middleware.ts` `updateSession` redirected ANY non-allowlisted path to `/signin` for anonymous visitors — which would have handed social crawlers HTML instead of a PNG at the new root `/opengraph-image`. Added `!pathname.startsWith("/opengraph-image")` to the redirect condition + 1 test (8/8 in `supabase-middleware.test.ts`). Subdomain og-images were never affected (subdomain hosts take the proxy rewrite branch, which skips `updateSession`).
- Tests: `src/__tests__/api/metadata.test.ts` **new, 10** (suffix logic ×3, fallback to product_name, thank-you ×3, leaderboard ×2, alts + root defaults). Green.

**Phase D — doc sync:** PRD REQ-6.8.6 annotated `[SHIPPED 2026-10-03]`; epic-16 U6 + story-16.1 U6 annotated `[RESOLVED]`; this block.

**Final gates (2026-10-03):** lint **0 errors / 5 baseline warnings** · prettier clean on every file this batch touched (repo-wide unformatted files pre-existing, untouched) · full suite **894 total = 887 pass / 7 fail = exact sanctioned baseline** (dashboard-archive 4 + dashboard-subscriber-table 3, 2 files; one earlier 9-fail run was Windows worker `EPERM` flake — re-ran to baseline) · clean build (`.next` deleted first; `✓ Compiled successfully`, `ƒ Proxy (Middleware)`, root `/opengraph-image` present).

**Live verification (dev server, then killed — port 3000 free):**

- `/` head: `<title>PreWaitlist</title>`, `og:site_name/type/locale`, `twitter:card=summary_large_image`, `og:image=/opengraph-image` + `og:image:alt=PreWaitlist` ✓
- `localhost:3000/opengraph-image` → **200 image/png** (after middleware fix; was 307→/signin before it) ✓
- `quality.lvh.me:3000/` → `<title>Quality</title>` + `og:title`/`twitter:title` = `"Quality — Join the waitlist"` ✓
- `quality.lvh.me:3000/opengraph-image-lc1qod?...` → 200 image/png (subdomain card) ✓
- `quality.lvh.me:3000/leaderboard` → `<title>Quality — Leaderboard</title>` ✓
- Live DB rows used: subdomains `quality`, `p`, `th`, `pr` (via publishable-key REST probe — **secret key returns 401**, use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for ad-hoc probes).

**Gotchas:**

- Importing `src/app/layout.tsx` in vitest requires `vi.mock("next/font/google", ...)` — `Geist` is not callable outside the Next compiler (`TypeError: Geist is not a function`).
- The supabase test mock has **no `.or()`** — chain builders only support `select/eq/not/is/in/order/limit/single/maybeSingle`.
- New curl-visible og behavior: og:image PNGs are async file routes (`opengraph-image.tsx`), not `<meta>` tags — verify with `curl` for tags + direct route hit for the image.
- Founder closed the P0 himself: Paddle **production webhook URL** updated to `https://www.prewaitlist.com/api/webhooks/paddle` (was apex → 308). Open question: Paddle **domain approval** status (checkout E2E, not code).

## Phone Collection (founder-configurable phone field) — 2026-10-03

**Status:** All 8 phases (0–7) implemented + tested + gated. **Uncommitted** on the current working tree (alongside the prior billing/meta batch — not mixed in code, but same branch state). Plan: `docs/phone-collection-plan.md` (locked decisions, verbatim copy, data model, test matrix, gates). SQL gate: `docs/stories/sql-writeups/phone-collection-schema.sql` — **must run in Supabase before deploy/manual test** (adds `waitlists.phone_mode` + `subscribers.phone`; SQL-first contract, no fallback on the public-page waitlist select).

**What shipped:**

- **Model:** `waitlists.phone_mode` (`off|optional|required`, default `off`) + `subscribers.phone` (E.164, nullable). Founder-facing config = one Select ("Phone number" → Off/Optional/Required) in two places: **onboarding Step 3 "Make it yours"** (moved from Step 4a per founder directive 2026-10-03 — same "Signup fields" card; `phone_mode` rides both Phase A POST-create bodies `flushToAPI` + `FlushGate` and the POST `/api/waitlist` insert, so the choice survives the Phase A → B boundary; 4a's section/PATCH field removed) + dashboard waitlist settings Qualification tab ("Signup fields" block, helper `Show a phone number field on your public signup form.`).
- **Public form:** `EmailCaptureForm` gains `phoneMode` prop → grouped control (country `datalist` input `w-[4.75rem]` default `+1` + tel input, placeholder/aria `Phone number`, country aria `Country code`) after the email field; blur normalization (empty→`+1`, digits-only→`+`, invalid→`+1`); validation after honeypot (`buildPhone`); body sends `phone` E.164. Hidden entirely when mode `off`.
- **Normalization:** `src/lib/phone.ts` (`PHONE_MODES`, `isPhoneMode`, `normalizePhoneInput`, `buildPhone` — prepends `+` to dial, `00`→`+`, fallback `+1`) + `src/lib/countries.ts` (`COUNTRY_OPTIONS` ~240, `DEFAULT_COUNTRY_DIAL = "+1"`).
- **API:** POST `/api/subscribers` validates/stores phone (required/optional rules, E.164-ish); waitlist GET maps `phoneMode`, PATCH validates + writes `phone_mode`, **POST `/api/waitlist` validates + inserts `phone_mode` (create path, added 2026-10-03 for the Step 3 move)**; defensive fallbacks (waitlist-select retry without `phone_mode`, insert PGRST204 retry stripping `display_name`/`phone`, mode→`off`).
- **Onboarding:** Step 1-3 local state + `FIELD_MAP.phoneMode`; FlushGate maps `phone_mode` (invalid→`off`); LivePreview `phoneMode` prop renders `PreviewPhoneGroup` (readOnly, no `list` attr) in both PreviewEmailForm and PreviewQuestionForm — parity locked by test (shared literals `placeholder="Phone number"` + `aria-label="Country code"` live in both preview and live form).
- **Dashboard:** leaderboard page resolves `phone_mode` → `phoneEnabled` → conditional full-literal select with `phone` + PGRST204 fallback drops `phone`; client renders **Phone header (non-sortable span) directly after Email** + cell (`row.phone || "—"`), 8-col grid `grid-cols-[48px_1fr_1fr_1fr_100px_100px_120px_120px]` when on, original 7-col when off; `overflow-x-auto` + `min-w-[900px]` wrapper only when on. Subscriber detail: Phone card between Email and Referral code, gated on `phone_mode !== "off"`, empty→em-dash. CSV export: `Phone` header + cell after Name only when mode on (BASE_HEADER unchanged when off).
- **Excluded (per plan):** public leaderboard page, `/dashboard/warmth` table, referred-subscribers mini-list, SMS/WhatsApp/OTP/analytics.

**Gates (final):** lint **0 errors / 5 baseline warnings** · prettier clean on all task files · full suite **966 total = 959 pass / 7 fail = exact sanctioned baseline** (dashboard-archive 4 + dashboard-subscriber-table 3) · clean build (`.next` deleted first; `✓ Compiled successfully`, `ƒ Proxy (Middleware)`).

**Tests added:** `phone.test.ts` (37) · subscribers (+8) · waitlist-multi (+GET phoneMode) · email-capture-form (+7) · leaderboard page (+4: hidden-off / header-order-after-Email / null→em-dash / non-sortable) · subscriber-detail (+2 source assertions) · csv-export (+2: Phone column after Name / off keeps BASE_HEADER + value never leaks) · live-preview-parity (+4: hidden-off, on+readOnly+no-list, question-form path, shared-literal lock) · **new** `dashboard-settings-phone-mode.test.tsx` (5: copy+options, hydrate required, invalid→off, PATCH `{waitlist_id, phone_mode}` + Saved, Saving… while pending).

**Gotchas:**

- **Supabase `.select()` rejects conditional template-literal columns at build time:** ``.select(`...${flag ? ", phone" : ""}`)`` → `ParserError<"Unexpected input: ...">` on row property access (export route hit it; leaderboard would too). Fix = **branch the entire select on full-literal strings per arm** (`phoneEnabled ? supabase...select("a, b, phone")... : supabase...select("a, b")...`), then normalize with a local row type/`as` cast. Plain `string` (computed `.join(",")`) stays tolerated — the parser only chokes on literal-union templates.
- `queryByText` does NOT match placeholder attributes — use `queryByPlaceholderText` when asserting hidden inputs.
- CSV row with empty name AND empty phone renders three consecutive commas (`email,,,2,...`) — one empty cell per field, easy to miscount in expectations.
- Select (`components/ui/select.tsx`) auto-IDs via `useId` → `screen.getByLabelText("Phone number")` works; options are real `<option>`s → `getByRole("option", {name: "Off"})` + `userEvent.selectOptions`.
- Settings save feedback: `saveField` sets Saving… during the PATCH promise, Saved for 2s after — resolve the fetch mock manually to assert both states (don't use fake timers + RTL `waitFor`).
- Form test bodies still need `ts: Date.now() - 5000` (timing check) but **no** `consent` (W3 removed it).
- Known caveat (plan-acknowledged): founder answering "No" at onboarding step 4 skips 4a → phone stays `Off` until settings.

## MC Qualification Field � Tally Dropdown + Duplicate-Key Fix � 2026-10-03

**Status:** Implemented (uncommitted, same working tree as the Step-4a?Step-3 phone move).

**Founder directive:** multiple-choice qualification fields become a **Tally-style dropdown** � visible label above, collapsed native `<select>` showing placeholder `Select an option` (approved copy), options on open, brand-color border when answered � in **both** the onboarding preview (`PreviewQuestionForm`) and the public form (`EmailCaptureForm`). Supersedes the 2026-09-30 radio-rows/`<fieldset><legend>` spec.

**Bug fixed with it:** React duplicate-key console error � both renderers keyed options with `key={opt}` (option text), while the question editor pushes `""` placeholders and 4a pushes unsanitized per-keystroke state ? two empty options ? duplicate `""` key (stack frame `PreviewQuestionForm q.options.map`). Preview no longer maps options at all (inert box); live form keys by **index**. Regression test: duplicate `["", ""]` options render with no `same key` console.error.

**Design changes:**

- Live: `<label htmlFor={qual-${q.id}}>` (question + `(optional)`, muted) above `appearance-none` select � `h-11`, `rounded-[var(--input-radius)]`, muted qual surface tokens (dark-safe), `pr-10` for the chevron, placeholder option text muted/70 until answered (`qualOverlay` ? `inputText`), brandColor inline border when answered, house `focusClasses`, index-keyed options.
- Preview: label span unchanged + inert mock box (`h-11`, qualBorder/qualBg, muted/70 "Select an option" + chevron) � option strings never painted.

**Docs synced:** guide �12 MC row + �13 a11y + �14 checklist rewritten to the dropdown spec; story 18.7 AC4 + Dev Notes T3 + epic 18 AC4 annotated `[AMENDED 2026-10-03]` (never silent-rewritten). Epic 14 AC8 ("radio groups **or equivalent single-select**") already covers a native select � left as-is. Parity tests lock `Select an option` as a shared literal in both files.

**Gotcha:** never key rendered lists by user-entered text � empty/`""` option drafts make duplicate keys inevitable during live editing; index (or a stable per-option id) is the pattern.

**Round 2 (2026-10-03, same session):** both free-text and MC question labels are **question-left / `(optional)`-right rows** (MC label = `flex justify-between` above the select; free-text already row-aligned inside the field), and `(optional)` is **warning amber `text-warning`** (token `--color-warning: #d97706`) on all four render sites � live free-text badge, live MC label, preview free-text badge, preview MC label. Use the `text-warning` utility (never `text-[--color-warning]` � `@theme inline` gotcha). Guide �4/�12/�14 + story/epic 18.7/18 AC2+AC4 annotated; parity test locks layout + color on both renderers.

## Latest Update Card Restyle � 2026-10-03

Founder: the public-page update card looked "dumped on the page". Restyle in `components/public/updates-feed.tsx`:

- Card centered + airier: `p-5 text-center` (was `p-4`, left-aligned stack)
- Label = `.text-overline` preset (12px/600/uppercase/wide) muted, `mb-2` � uppercase is CSS transform, copy untouched ("Latest update")
- Body = explicit utilities `text-base font-medium text-balance` � **never pair `.text-body` with `font-medium`**: the unlayered preset sets `font-weight: 400` and beats the layered utility (same class of bug as the old `--font-*` namespace collision)
- Date = `text-xs font-normal` + explicit color utility � dropped `.text-caption` because its unlayered `color` overrides dark-template color utilities (latent dark bug fixed while restyling)
- Template surfaces: minimal `border-border bg-card` � bold `border-2 border-foreground bg-card` (heavy-border identity, parity with how-it-works steps) � dark unchanged
- Guide �7.4 rewritten + type ladder rows amended (label/body weights, and the `(optional)` badge row still said "muted" � fixed to warning amber); tests +2 (`latest-update-card.test.tsx`)

## Twitter/X card og:image fix � Prompt #8 investigation (2026-10-04)

**Symptom:** pasting `https://bat.prewaitlist.com` on X showed no preview image.

**Root cause:** `og:image` for subdomain pages composed from the root `metadataBase` (`https://www.prewaitlist.com`) ? X fetched `https://www.prewaitlist.com/bat/opengraph-image-lc1qod?�` ? `updateSession` anon redirect (`middleware.ts` allowlist only matched paths **starting** with `/opengraph-image`, not `/{subdomain}/opengraph-image-*`) ? **307 `/signin` ? HTML, not PNG**. Subdomain host was always fine (`proxy.ts` subdomain branch never runs `updateSession` ? `200 image/png`).

**Fix (2 files + 2 tests):**

- NEW `src/app/(public)/[subdomain]/layout.tsx` � segment `generateMetadata` returns `metadataBase: new URL(`https://${subdomain}.prewaitlist.com`)`. Covers **all three** routes (main/thank-you/leaderboard inherit the same file-convention image � proven empirically); deeper-segment metadataBase beats root (verified in prod-mode).
- `src/lib/supabase/middleware.ts` allowlist ? `pathname.includes("/opengraph-image")` (root + nested, any host).
- Tests: metadata.test.ts layout metadataBase origin; supabase-middleware.test.ts nested path anon no-redirect.

**Gates:** lint 0/5 � targeted 20/20 � full suite **976 = 969 pass / 7 fail = exact baseline** � clean build � prod-mode local probes: main+leaderboard og/twitter:image = `https://bat.prewaitlist.com/bat/opengraph-image-lc1qod?�`, nested+root anon ? `200 image/png`, `/dashboard` anon ? `307` (redirect intact).

**Gotchas:**

- **Dev server IGNORES metadataBase for file-based og:image URLs** (always `localhost:3000`, vercel/next.js#49859) � verify metadataBase fixes with `pnpm build && pnpm start`, not `pnpm dev`.
- **Production is running OLDER code than the repo (deploy lag):** prod `/opengraph-image` (root) ? `307 /signin` (current code allowlists it) and prod `og:title` lacks the REQ-6.8.6 ` � Join the waitlist` suffix. Founder: push/deploy to fix root card + suffix. **[RESOLVED 2026-10-04:** `a3c768d` deployed root card + suffix, `7c56cb5` deployed the card redesign — both verified live by polling the og:image URL hash.**]**
- `robots.txt` = 404 on both hosts (no crawl restrictions). X caches cards ~24h�7d; changed image URL is the re-scrape hammer; test in tweet composer (validator retired).

## og:image card redesign — tier gate + centered layout (2026-10-04)

**Status:** ✅ shipped — `9073c3b` (dev) → merged `7c56cb5` → main, deployed, prod-verified. Prompt #8 investigation → web research → Prompt #2 execute (founder brief: "basic but works and user friendly", "find if there are more").

**Founder complaints (X composer screenshot, quality = Pro):** "Powered by PreWaitlist" on a Pro account · CTA pill floating top-left · content "all over the place" / unnecessary spacing · slow load.

**Root causes + extras found (all card-only — quality's page HTML had 0 "Powered by" occurrences; page footer gate was already correct):**

1. `src/app/(public)/[subdomain]/opengraph-image.tsx` hardcoded the footer and its select never fetched tier → attribution shown to every tier (the Pro complaint).
2. Root `justifyContent: "space-between"` over 3 one-liners scattered content into corners.
3. Pill text `"Join the waitlist!"` hardcoded — didn't match DB `cta_text` ("Join Waitlist") + copy-gate violation.
4. Root `src/app/opengraph-image.tsx` had the same scattered pattern (36px corner logo top-left).
5. Headline 140 chars @72px with no length cap → multi-line overflow of the 630px canvas.
6. Fallback card showed the domain twice (title = `x.prewaitlist.com`, subtitle = `x`).
7. `revalidate 300` → fresh ~2.7s Satori render every 5 min (the "slow load" — file itself was only 40KB, well under X's 5MB limit).

**Fix (3 files):**

- Subdomain card: `.select("…, founder_profiles!inner(tier)")` (FK verified `docs/stories/sql-writeups/epic0.story03-supabase-schema.sql:22`) → exported `showPoweredBy(tier)` = `tier === "free"` only (unknown/fallback hidden) · pill deleted · centered block (`flex:1` + `justify-content:center`: 56×8 brand-color bar → headline → subtitle), padding `72px 96px` (safe zone) · headline size tiers 76/56/40 by length (≤40/≤90/else chars) · subtitle dropped when empty or === title · `revalidate = 86400`.
- Root card: same centered treatment, corner logo removed, copy verbatim ("PreWaitlist" / "Pre-launch waitlist builder"), `revalidate = 86400`.
- Test: `showPoweredBy` assertions (+1) in `src/__tests__/api/metadata.test.ts` (free → true; pro/growth/null/undefined → false).

**Research (2 searches — og-image.org guides + Next.js ImageResponse docs):** keep 1200×630 PNG <5MB · title ≥48px / secondary ≥24px readable at phone thumbnail · one focal point · safe zone ≈ center 80% (≈120px sides → padding 96) · file-based og images render at request time, `revalidate` = cache window · X caches cards 24h–7d; deploy changes the image URL hash = automatic re-scrape.

**Gates:** lint 0/5 · prettier clean · targeted 21/21 · full suite **977 = 970 pass / 7 fail = exact baseline +1 new test** (dashboard-archive 4 + dashboard-subscriber-table 3) · clean build (`Revalidate 1d` in route table) · prod pixel-scan after deploy: brown brand bar 104px, **green total = 0** (no attribution on the Pro card, live).

**Verification workaround — Read tool media glitch:** fresh PNG reads started returning stale/wrong attachments (even re-served the founder's original screenshot for a just-written file) → verified via **System.Drawing pixel scan + row profiling**: count exact token-color pixels per y-band (brand bar / accent-green footer) → pro card zero green, free card footer rows 534–551, centered margins 220/222. Decisive without eyeballs.

**Gotchas:**

- PS 5.1 PNG dimension parsing: decode IHDR bytes 16..23 as big-endian hex (`[Convert]::ToInt32($hex,16)`) — naive `-shl` chains silently misreported 1200×630 as 176×118.
- Poll the live page's `og:image` URL to detect deploy completion — the `?hash` suffix changes per build.
- Prod-mode verification server: `cmd.exe /c "pnpm start > log"` **blocks the shell** → launch detached via `Start-Process cmd.exe` or it times out and dies.
- `og:image:alt` / `twitter:image:alt` remain `"PreWaitlist"` (static `export const alt` — cannot vary per subdomain). Open founder question: accept, or approve a new static string.

## Sprint 4 Epic Documentation — create-epic [19]/[20]/[21] (2026-10-04)

**Status:** All three Prompt #5 runs complete. `docs/epics/sprint-4-plan.md` (approved master plan) + `docs/epics/epic-19-product-fixes-polish.md` (8 stories/47 ACs) + `docs/epics/epic-20-feedback-onboarding-growth-tooling.md` (5 stories) + `docs/epics/epic-21-full-app-scan-test-case-suite.md` (8 stories/45 ACs) — all Phase 4 verified, prettier-clean, idempotent. Epic docs follow template field order (`Tasks → Out of scope → Dev Notes`), per-story Design Refs, research Dev Notes (driver.js/Tally/PostHog/Playwright screenshots/manual-test-template). Implementation blocked until founder instructs. Still open: story files (`docs/stories/story-21.*` etc. — no create-story prompt exists) + founder gates (CSV formula-injection decision, env keys, PH/Tally/Dub accounts).

**THE prettier `19._` mystery — root cause (cost hours, do not re-diagnose):**

- Symptom: dependency cell `19.*, 20.*, 21.7` kept "reverting" to `19._, 20._, 21.7` after every `pnpm prettier --write`; suspected async reverter / stale Edit-tool model / file cache — **all wrong**.
- Root cause: **CommonMark parses `19.*, 20.*` as an emphasis node** (first `*` = opener after `.` punctuation-flanking rules, second `*` = closer) and **prettier's markdown printer reprints emphasis with `_` delimiters** → `19._, 20._`. Idempotent thereafter (prettier round-trips its own output). A single unmatched `19.*` (21.7 row) is safe — no pair, no emphasis.
- Proof method that ended the spiral: `[int][char]` codes of the row from **disk** (42 = `*`) vs **prettier stdout** (95 = `_`) in the same command, plus a `MARKER-XYZ` canary appended to the file proving prettier read the same path.
- Fix: escape the asterisks — `19.\*, 20.\*, 21.7` in both `sprint-4-plan.md` L543 and `epic-21…md` L31. Escapes are emphasis-node-free (literal text), survive `--write` (verified twice, `(unchanged)`), render as `19.*, 20.*, 21.7`, `--check` exit 0 across all 4 epic files.
- Diagnostic gotchas learned: (1) PS `-notmatch 'MARKER'` is **case-insensitive** → false positive from the prose word "markers"; use `[regex]::Matches($t,'MARKER-XYZ')` for contamination. (2) A `-replace`/string building blunder appended a `MARKER-XYZ-8472` canary line that had to be scrubbed (cleaned + verified). (3) Batched same-file `Edit` calls in one message silently write stale snapshots — for docs under active churn prefer `[IO.File]::ReadAllText/WriteAllText` (`UTF8Encoding($false)`) and verify after every write. (4) Never conclude "prettier corrupts content" without char-code comparison — it normalizes markdown ASTs, it doesn't edit text.

## Execute batch — Epic 19.1 + 19.2 (Prompt #1 scan + Prompt #2 execute, 2026-10-04)

**Status:** Both stories implemented + gated, **uncommitted**, current branch (working tree alongside prior batches). Scanned first (Prompt #1), two founder questions asked BEFORE executing, both answered, then executed in full (Prompt #2).

**Founder decisions (locked, 2026-10-04):**

1. **OWASP CSV formula injection: FOLDED INTO 19.2 now** (was a flagged founder gate in sprint-4-plan L206 / epic-19 Dev Notes) — new **19.2 AC8**.
2. **Quality column = referral-quality %** (dashboard parity), NOT warmth-derived — 19.2 AC2 amended in both epic-19 and sprint-4-plan (annotated, never silently rewritten; the warmth-worded Dev Note struck through as SUPERSEDED).

**19.1 Pro Email Tier Fix (P0) — what shipped:**

- Root cause: PostgREST `founder_profiles!inner(tier)` from `waitlists` is a **to-one OBJECT**, code cast to array + `[0]` → `undefined` → every confirmation/moved-up/milestone email forced `tier="free"` in production (tests passed only because fixtures used array shape).
- `src/app/api/subscribers/route.ts` — both tier reads (confirmation ~:894, moved-up ~:1073) now `Array.isArray` ternary (same pattern as the pre-existing cap-check read at :526); object → correct tier, array → defensive branch, `|| "free"` fallback kept. TS gotcha: false branch narrows to `undefined` → needs `as unknown as {tier} | null` (single-step cast fails type check).
- `src/lib/milestones.ts` — SAME bug fixed at founderTier read (embed hoisted to `milestoneProfileEmbed` first, then ternary) + footer now tier-conditional: `founderTier === "free"` → `buildFreeEmailFooter` else `buildEmailFooter` (was unconditional non-free). Side-effect note: pro custom sender (`senderName`/`sendingDomain` gates) now actually fires in production on this path too.
- `src/app/dashboard/broadcast/client.tsx` (AC3) — removed preview's `{displayName} — powered by PreWaitlist` line + orphaned `<hr>` + now-unused `displayName` const (only usage).
- AC6 page footers verified already-correct (no change): waitlist-page-content:74 prop-fed; public page :78-81, thank-you :106-109, leaderboard :61-64 all `Array.isArray` + `tier === "free"` gate.
- AC7 regression lock: **object-shape → pro → non-free footer** + array-shape same + free → Powered-by (iff) — across `subscribers.test.ts` (+3), `subscribers-referral.test.ts` (+2, moved-up AC2), `milestones.test.ts` (+3). Helper `pushConfirmationSenderQueue` / `pushMovedUpReferralQueueWithSender` gained optional `embedShape: "object"|"array" = "array"` param (default keeps legacy fixtures).

**19.2 CSV Quality Column — what shipped:**

- `src/app/api/subscribers/export/route.ts` — Quality header adjacent to Warmth (`..., Warmth, Quality, Signup Date`); value = dashboard formula `totalReferrals > 0 ? Math.round((referrals / totalReferrals) * 100) : null` rendered `"N%"` / `""` — from the existing `referralCounts` batch map (zero new queries, per amended AC2). Denominator = **totalReferrals** (sum of all referral counts), matching `dashboard/leaderboard/page.tsx:140-143` exactly — NOT total signups.
- **AC8 hardening in `escapeCsvCell`:** prefix `'` when cell matches `/^[=+\-@\t\r]/` UNLESS pure number `/^[+-]?\d+(\.\d+)?$/` (E.164 phones like `+15551234567` exempt — evaluate as numbers, never commands); harden BEFORE RFC4180 quoting.
- AC5 verified: CSV in `FREE_FEATURES` (pricing-features:15), filename logic untouched.
- Tests: `csv-export.test.ts` 7→10 (all baseline rows gained the Quality cell — exact-match style; +3 new: 67%/33% % rendering + order lock, empty-on-null, OWASP 3-vector incl. harden-before-quote `"'=IF(1,2,3)"`).

**Gates:** lint **0 errors / 5 baseline warnings** · prettier clean on all 10 touched files · clean build (`.next` deleted first, `ƒ Proxy (Middleware)`) · full suite **988 = 981 pass / 7 fail = exact sanctioned baseline** (dashboard-archive 4 + dashboard-subscriber-table 3). Second full run showed +billing 1 +broadcast-client 1 — both known/load flakes (broadcast-client 8/8 in isolation; billing flake documented).

**Files touched (10):** epic-19 + sprint-4-plan docs · export/route · subscribers/route · broadcast/client · milestones/lib · csv-export, subscribers, subscribers-referral, milestones tests.

**Gotchas learned:**

- CSV row comma-counting by eye is error-prone — build expected rows as `` `fixed,parts,` + quotedDate `` (variable holds the quoted dynamic field) instead of one giant template; let vitest adjudicate.
- `vi.mock("@/lib/email")` factories must stay in sync with real-module imports — adding `buildFreeEmailFooter` to `milestones.ts` crashed nothing only because `milestones.test.ts` mock was updated in the same change; sweep with `Select-String` across test dirs for the module path when adding imports.
- Full-suite under load flakes beyond the 7-baseline (billing, broadcast-client) — always re-run / isolate before declaring regression (MEMORY rule confirmed again).

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
- **Status:** ✅ Working — CLI v0.4.16, Docker v29.7.2, Milvus v2.5.1 containers running, 126 chunks indexed.
- **Fix:** Windows console encoding bug — must set `$env:PYTHONIOENCODING="utf-8"` before running memsearch commands (or add to PowerShell profile permanently). Without this, `click.echo` crashes on Unicode characters (emojis, arrows).
- **Date:** 2026-07-26 (updated 2026-09-09)

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

### Paddle (Story 0.5)

- **Sandbox account:** Created at sandbox-vendors.paddle.com
- **Keys:** API key, client token, webhook secret — all in .env.local
- **Not done:** Client module not yet written (setup-only story)

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

**Goal:** Warmth tracking live. Founders send warmth-segmented broadcasts. Paddle billing gates Pro features. Domain auth walkable. Product feature-complete for MVP.

**Pre-requisite:** Epic 10 (Public Waitlist Page & Onboarding Redesign) ships before Sprint 3 begins.

**3 Epics, 22 Stories:**

- **Epic 11 — Warmth Tracking Engine** (8 stories): Resend webhooks, score calculation (daily batch), Hot/Warm/Cold badges, distribution panel, warning state, decay rules, schema migration
- **Epic 12 — Email System** (7 stories): Confirmation emails, position recalculation, "you moved up" trigger, broadcast, segmented broadcast, sender customisation, email infrastructure separation
- **Epic 13 — Billing & Feature Gating** (7 stories): Paddle checkout ($15/mo), upgrade modal (7 triggers), tier enforcement, 500 signup cap, billing management, domain auth walkthrough

**Key decisions (from web research + audit):**

- **Decay starts at 60 days (not 30):** Waitlist subscribers go quiet while waiting for launch — this is not disengagement. 30-day decay penalizes early adopters unfairly.
- **Email opens NOT tracked as warmth signal:** Apple Mail Privacy Protection preloads pixels for ~40-50% of email clients, making open data unreliable. Clicks (+5) and referrals (+15) are the primary intent signals.
- **Cold bar color = blue (not red):** Both Hot (green) and Cold (red) being red-family is confusing. Blue is more distinct.
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

| File                                           | Component               | Status                                                                                                              |
| ---------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `components/ui/button.tsx`                     | Button                  | ✅ Done — 4 variants (primary/secondary/destructive/ghost), 3 sizes (sm/md/lg)                                      |
| `components/ui/card.tsx`                       | Card + 5 sub-components | ✅ Done — CardHeader, CardTitle, CardDescription, CardContent, CardFooter                                           |
| `components/ui/input.tsx`                      | Input                   | ✅ Done — label, error, helperText, auto-ID, aria-invalid/describedby                                               |
| `components/ui/badge.tsx`                      | Badge                   | ✅ Done — 6 variants (default/success/warning/error/info/outline)                                                   |
| `components/ui/toggle.tsx`                     | Toggle                  | ✅ Done — onCheckedChange, label, token-based styling                                                               |
| `components/ui/select.tsx`                     | Select                  | ✅ Done — native select, placeholder, error/helperText                                                              |
| `components/ui/textarea.tsx`                   | Textarea                | ✅ Done — label, error/helperText, resize-y                                                                         |
| `components/share/share-copy-link.tsx`         | ShareCopyLink           | ✅ Done — Web Share API + clipboard, 2s confirmation                                                                |
| `components/share/referral-link.tsx`           | ReferralLink            | ✅ Done — clipboard copy with execCommand fallback, 2s "Copied!" confirmation, unique URL display                   |
| `components/share/share-buttons.tsx`           | ShareButtons            | ✅ Done — Twitter URL, LinkedIn URL, Copy Link with execCommand fallback, 2s confirmation                           |
| `components/share/powered-by-footer.tsx`       | PoweredByFooter         | ✅ Done — dark template border fix applied, scoped to Free tier                                                     |
| `components/onboarding/live-preview.tsx`       | LivePreview             | ✅ Done — 3 templates, BrowserFrame with dark mode (`data-theme`), desktop/mobile toggle, dark template tokens      |
| `components/layout/marketing-layout.tsx`       | MarketingLayout         | ✅ Done — Header (sticky, backdrop-blur, scroll border, logo image, mobile drawer) + Footer (warm ivory, 16px text) |
| `components/marketing/hero.tsx`                | Hero                    | ✅ Done — conditional "Powered by" variant, text-display, Button CTA                                                |
| `components/marketing/problem-section.tsx`     | ProblemSection          | ✅ Done — 3 cards, SVG icons, rounded-[10px], muted-foreground                                                      |
| `components/marketing/difference-section.tsx`  | DifferenceSection       | ✅ Done — single-column centered, accent overline, Sarah/James example                                              |
| `components/marketing/comparison-section.tsx`  | ComparisonSection       | ✅ Done — white bg-card, ✗/✓ SVG marks, gap-4 list spacing                                                          |
| `components/marketing/feature-grid.tsx`        | FeatureGrid             | ✅ Done — 2×2 grid, green SVG icons, centered max-w-4xl                                                             |
| `components/marketing/confidence-section.tsx`  | ConfidenceSection       | ✅ Done — standalone callout, accent text, border-y                                                                 |
| `components/marketing/pricing-section.tsx`     | PricingSection          | ✅ Done — Free + Pro, aligned CTAs, ✓ checkmarks, flex-1 spacer                                                     |
| `components/dashboard/sidebar.tsx`             | Sidebar                 | ✅ Done — 8 nav items, active green pill, locked/disabled states, mobile overlay, upgrade CTA                       |
| `components/dashboard/signup-chart.tsx`        | SignupChart             | ✅ Done — Recharts BarChart, 30d/All Time toggle, custom tooltip, horizontal scroll on mobile, skeleton loader      |
| `components/dashboard/qualification-panel.tsx` | QualificationPanel      | ✅ Done — question distribution bars, empty states (no questions / no answers), skeleton loader                     |
| `components/dashboard/top-referrers.tsx`       | TopReferrers            | ✅ Done — top 5 by quality score, anonymized emails, referral count badge, empty state CTA                          |
| `components/dashboard/warmth-panel.tsx`        | WarmthPanel             | ✅ Done — 4 warmth bars (Hot/Warm/Cold/Unscored), locked overlay for Free, real data fetch for Pro                  |     | `components/lib/cn.ts` | cn() | ✅ Done — clsx + tailwind-merge |

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
| `src/app/api/subscribers/[id]/referrals/route.ts` | GET (referral list, founder ownership auth)                              |     | `src/app/api/dashboard/chart/route.ts` | GET (daily signup aggregation, 30d/all-time) |
| `src/app/api/dashboard/qualification/route.ts`    | GET (qualification answer distribution per question)                     |
| `src/app/api/dashboard/warmth/route.ts`           | GET (warmth score distribution: hot/warm/cold/unscored)                  |
| `src/app/api/warmth/[subdomain]/route.ts`         | GET (public warmth distribution for subdomain)                           |

## Testing

- **Framework:** Vitest 4.1.10 + happy-dom 20.11.1 + @testing-library/react 16.3.2 + @testing-library/user-event 14.6.1
- **Config:** `vitest.config.mts` — setup file `src/__tests__/setup.ts`
- **Test files:** 16 files in `src/__tests__/` — badge, card, button, input, toggle, select, textarea, share-copy-link, thank-you-page, referral-link, share-buttons, referred-variant, dashboard-referral-column, subscribers-referral, subscribers-referrals, leaderboard-client
- **E2E:** Playwright with `playwright.config.ts` — `tests/e2e/thank-you-flow.spec.ts` (2 tests)
- **Total tests:** 166 passing (all green)
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
- **What is designed/previewed in onboarding MUST be EXACTLY what is shown on the public waitlist page.** Agent must REUSE the shared rendering component (`components/share/waitlist-template-content.tsx`). Never build a second implementation of template display.

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

| Story | Status   | Summary                                                                                                                                |
| ----- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 9.0   | ✅ done  | Dashboard Layout Shell — left sidebar (268px, 8 nav items), active state (green pill), locked items, mobile hamburger, upgrade CTA     |
| 9.1   | ✅ done  | Stat Cards with Real Data — Total Signups, Referral %, Today, Warmth (locked), em-dash for empty                                       |
| 9.2   | ✅ done  | Subscriber Table Design Alignment — 4-column table (#, Email, Date, Referrals), search, sort, row click, empty state                   |
| 9.3   | ✅ done  | CSV Export (Pro Tier) — client-side generation, correct filename, 7 headers                                                            |
| 9.4   | ✅ done  | Subscriber Detail Page — auth check, back button, position/email/grid, referral code, referred list, qual answers, 404                 |
| 9.5   | ✅ done  | Epic 9 Tests — 8 test files (sidebar, stat-cards, subscriber-table, csv-export, subscriber-detail, chart, qualification-panel, warmth) |
| 9.6   | ✅ done  | Dashboard Remediation — MVP Gap Fill — chart, qual breakdown, quality scores, top referrers, warmth distribution, table enhancements   |
| 9.7   | 🔲 ready | Epic 9 Final Tests — comprehensive test pass (target ≥200 tests)                                                                       |

## Next Steps

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
52. Fix: milestone rewards disappearing + signup counter not displaying (stale closure fix)
53. Fix: PoweredByFooter inheriting preview styles on public pages (standalone prop)
54. Investigate/gap-fill remaining onboarding issues ← NEXT
55. Epic 11 — Warmth Tracking Engine (Sprint 3)
56. Epic 12 — Email System (Sprint 3)
57. Epic 13 — Billing & Feature Gating (Sprint 3)

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

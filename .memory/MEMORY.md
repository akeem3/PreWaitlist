# Project Memory — Durable Decisions

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
- **Date:** 2026-07-26

### Wildcard subdomain routing via Vercel nameservers

- **Decision:** Use Vercel-managed nameservers (ns1/ns2.vercel-dns.com) instead of A-record + CNAME for wildcard routing.
- **Reason:** A records cannot route `*.mywaitlist.com` to Vercel. Only Vercel nameservers or a wildcard CNAME can. Since the domain was on GoDaddy, updated nameservers to point to Vercel's DNS.
- **Date:** 2026-07-26

### Component token approach (Tailwind v4)

- **Decision:** Use `var()` arbitrary values for component tokens (e.g. `rounded-[var(--button-radius)]`), NOT Tailwind utility classes.
- **Reason:** Tailwind v4 `@theme` custom tokens don't follow naming conventions to auto-generate utilities. `--button-radius` does NOT generate `rounded-button`. Must use `var()` directly.
- **Date:** 2026-07-28

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

### Next: Execute Epic 4 Stories

Current Epic 4 stories are restructured and aligned with design analysis. Ready to execute:

1. ~~Start with Story 4.0 — API routes, context, layout switching~~ ✅ Done
2. Execute stories in dependency order (4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7)
3. Each story has design specs, acceptance criteria, and dev notes aligned with design analysis
4. Alignment check completed — all Dev Notes accurately reflect "not started" state

## Component Inventory

| File                                          | Component               | Status                                                                                                              |
| --------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `components/ui/button.tsx`                    | Button                  | ✅ Done — 4 variants (primary/secondary/destructive/ghost), 3 sizes (sm/md/lg)                                      |
| `components/ui/card.tsx`                      | Card + 5 sub-components | ✅ Done — CardHeader, CardTitle, CardDescription, CardContent, CardFooter                                           |
| `components/ui/input.tsx`                     | Input                   | ✅ Done — label, error, helperText, auto-ID, aria-invalid/describedby                                               |
| `components/ui/badge.tsx`                     | Badge                   | ✅ Done — 6 variants (default/success/warning/error/info/outline)                                                   |
| `components/ui/toggle.tsx`                    | Toggle                  | ✅ Done — onCheckedChange, label, token-based styling                                                               |
| `components/ui/select.tsx`                    | Select                  | ✅ Done — native select, placeholder, error/helperText                                                              |
| `components/ui/textarea.tsx`                  | Textarea                | ✅ Done — label, error/helperText, resize-y                                                                         |
| `components/share/share-copy-link.tsx`        | ShareCopyLink           | ✅ Done — Web Share API + clipboard, 2s confirmation                                                                |
| `components/onboarding/live-preview.tsx`      | LivePreview             | ✅ Done — 3 templates, BrowserFrame, desktop/mobile toggle                                                          |
| `components/layout/marketing-layout.tsx`      | MarketingLayout         | ✅ Done — Header (sticky, backdrop-blur, scroll border, logo image, mobile drawer) + Footer (warm ivory, 16px text) |
| `components/marketing/hero.tsx`               | Hero                    | ✅ Done — conditional "Powered by" variant, text-display, Button CTA                                                |
| `components/marketing/problem-section.tsx`    | ProblemSection          | ✅ Done — 3 cards, SVG icons, rounded-[10px], muted-foreground                                                      |
| `components/marketing/difference-section.tsx` | DifferenceSection       | ✅ Done — single-column centered, accent overline, Sarah/James example                                              |
| `components/marketing/comparison-section.tsx` | ComparisonSection       | ✅ Done — white bg-card, ✗/✓ SVG marks, gap-4 list spacing                                                          |
| `components/marketing/feature-grid.tsx`       | FeatureGrid             | ✅ Done — 2×2 grid, green SVG icons, centered max-w-4xl                                                             |
| `components/marketing/confidence-section.tsx` | ConfidenceSection       | ✅ Done — standalone callout, accent text, border-y                                                                 |
| `components/marketing/pricing-section.tsx`    | PricingSection          | ✅ Done — Free + Pro, aligned CTAs, ✓ checkmarks, flex-1 spacer                                                     |
| `components/lib/cn.ts`                        | cn()                    | ✅ Done — clsx + tailwind-merge                                                                                     |

## Layout Structure

| File                             | Purpose                                                       |
| -------------------------------- | ------------------------------------------------------------- |
| `src/app/layout.tsx`             | Root layout — wraps children in `<MarketingLayout>`           |
| `src/app/(marketing)/layout.tsx` | Passthrough `<>{children}</>`                                 |
| `src/app/(auth)/layout.tsx`      | Passthrough `<>{children}</>`                                 |
| `src/app/onboarding/layout.tsx`  | Split-pane layout — progress bar, back nav, mobile responsive |

## Testing

- **Framework:** Vitest 4.1.10 + happy-dom 20.11.1 + @testing-library/react 16.3.2 + @testing-library/user-event 14.6.1
- **Config:** `vitest.config.mts` — setup file `src/__tests__/setup.ts`
- **Test files:** 8 files in `src/__tests__/components/` — badge, card, button, input, toggle, select, textarea, share-copy-link
- **Total tests:** 86 passing (all green)
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

- **Logo:** `public/MyWaitlist Offical logo.png` (note: original filename has typo "Offical")
- **Brand color (accent):** `#0f7a5e` (green)
- **Accent hover:** `#0d6b52`
- **Accent foreground:** `#ffffff`
- **Logo usage in nav:** `<Image src="/MyWaitlist Offical logo.png" alt="MyWaitlist" width={140} height={28} priority />`
- **Sign-in link hover:** `hover:text-accent` (brand green)

## Standing Constraints

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

## Design System — Color Mapping (Design Spec → Tokens)

Design specs use hex values that don't always match the token system exactly. Map to the closest available token:

| Design Spec Hex | Token                      | Tailwind Class            | Use Case                        |
| --------------- | -------------------------- | ------------------------- | ------------------------------- |
| `#0F7A5E`       | `--color-accent`           | `text-accent`/`bg-accent` | Brand green, CTAs, active dots  |
| `#1A1A1A`       | `--color-foreground`       | `text-foreground`         | Primary text, headings          |
| `#DC2626`       | `--color-destructive`      | `text-destructive`        | Error states, validation errors |
| `#6B6459`       | `--color-muted-foreground` | `text-muted-foreground`   | Secondary text, helper copy     |
| `#C3C2C2`       | `--color-muted-foreground` | `text-muted-foreground`   | Field labels, inactive dots     |
| `#CCC9C3`       | `--color-border`           | `border-border`           | Input borders                   |
| `#E0DDD8`       | `--color-border`           | `border-border`           | Dividers, separators            |
| `#FAF8F4`       | `--color-background`       | `bg-background`           | Page background                 |
| `#FFFFFF`       | `--color-card`             | `bg-card`                 | Card/input backgrounds          |

**Gap note:** `#6B6459` (warm grey) and `#C3C2C2` (light label grey) have no exact token match. Using `--color-muted-foreground` (#6b6b6b) as closest semantic equivalent. These may need dedicated tokens in a future design system update.

## Gotchas / Corrected Assumptions

- **Tailwind v4 scans ALL project files** — including `.md` files. If documentation contains text like `text-[length:var(...)]` or `text-[var(--badge-font-size)]` (even in backtick code spans), Tailwind generates broken CSS utilities from them. Fix: add `@source not "../../docs"` and `@source not "../../.memory"` to `globals.css`.
- **`--text-*` tokens in `@theme` conflict with Tailwind's `text-` utility namespace** — Tailwind v4 auto-generates utilities from `@theme` token names. Tokens starting with `--text-` get interpreted as color utilities, not font-size. Use direct Tailwind classes (`text-xs`, `text-sm`) instead of `text-[var(--text-xs)]`.

## Next Steps

1. ~~Implement Story 1.2 (Toggle, Select, Textarea)~~ ✅ Done
2. ~~Run Follow-Up Audit (Prompt #4) on completed Epic 1~~ ✅ Done — all clean
3. ~~Create Epic 2 branch from dev~~ ✅ Done
4. ~~Start Story 2.1 — Supabase schema DDL + RLS~~ ✅ Done
5. ~~Epic 2 — Foundation & Auth~~ ✅ Done (all 5 stories)
6. ~~Epic 3 — Marketing Homepage~~ ✅ Done (all stories + extra work)
7. ~~Create Epic 4 branch from dev~~ ✅ Done (on `epic-4` branch)
8. ~~Epic 4 Design Analysis~~ ✅ Done — all 10 screens analyzed, cross-referenced with PRD, web research complete
9. Update Epic 4 document to restructure stories to match design reality
10. Execute Epic 4 — Onboarding Wizard (restructured stories)
11. Create Epic 5 branch from dev — Dashboard + Store Features

## Decision + bug fix: "Powered by MyWaitlist" footer (2026-07)

Scope: exclusive to founders' public waitlist pages (onboarding preview now,
real public page in Sprint 2) when tier = Free. Never on MyWaitlist's own site —
this was built wrongly onto our own homepage footer once already and had to be
removed; if it recurs, same fix, same reasoning.

Visual spec: inline "Powered by [16px jade icon] MyWaitlist", Caption size,
"Powered by" in Warm Grey #6B6459, "MyWaitlist"+icon in Deep Jade #0F7A5E,
centered, 24px vertical padding, Border Subtle top divider on light templates,
no shadow/gradient/box. Links to the F-A3 homepage variant.

Open gap: no verified Dark-template-safe secondary text color exists yet in the
design system. Placeholder used on Dark template pending an actual token
decision — do not treat the placeholder as final.

Files: `components/share/powered-by-footer.tsx` (shared component),
`components/onboarding/live-preview.tsx` (renders when tier = "free"),
`components/layout/marketing-layout.tsx` (bug fix — removed badge from homepage footer).

PRD ref: REQ-onboarding-preview.4 (scope exclusion), REQ-onboarding-preview.5 (visual spec + open TODO).

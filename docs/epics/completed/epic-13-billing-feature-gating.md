# Epic 13 — Billing & Feature Gating

**Status:** ready
**Source:** [PRD §2a](../PRD.md#2a-sprint-2--public-page-dashboard-active), [MVP Vision Module 6](../product-vision-mvp-waitlist-tool.md#module-6--account-tiers--billing), Paddle Billing docs

## Goal

Integrate Paddle Billing for Pro subscriptions ($15/mo) in sandbox mode, enforce tier-based feature gating, build a context-sensitive upgrade modal, implement the 500 subscriber cap, and create a Resend domain authentication walkthrough. The integration must be architected so that going live requires only swapping environment variables and recreating the product catalog in Paddle's production dashboard — zero code changes.

## Definition of Done

A free founder who approaches a Pro feature sees a context-sensitive upgrade modal with a clear value proposition. Clicking "Upgrade" opens Paddle's overlay checkout. On successful payment, the founder's tier updates to "pro" via webhook. Pro founders have full access to broadcast, warmth, CSV export, email customization, and 5 qual questions. Free founders are capped at 500 subscribers with progressive warnings. The Paddle customer portal allows Pro founders to manage their subscription. Domain authentication setup is walkable via a 3-step Resend wizard in Settings. All billing components are wired to real Paddle data. All changes are tested.

## Sandbox vs Production Architecture

The integration is built sandbox-first with zero-code production transition:

| Item                              | Sandbox (now)           | Production (later)         |
| --------------------------------- | ----------------------- | -------------------------- |
| `PADDLE_API_KEY`                  | `pdl_sdbx_apikey_...`   | `pdl_live_apikey_...`      |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | `test_...`              | `live_...`                 |
| `PADDLE_WEBHOOK_SECRET`           | `pdl_ntfset_...`        | Different secret           |
| `NEXT_PUBLIC_PADDLE_ENV`          | `sandbox`               | `production`               |
| Product/price IDs                 | Sandbox catalog         | Recreate in live (new IDs) |
| `Paddle.Environment.set()`        | Called with `"sandbox"` | Remove entirely            |

**To go live:** Swap 4 env vars, recreate product catalog in live Paddle dashboard, remove `Paddle.Environment.set("sandbox")` call. No code changes.

## Paddle Sandbox Setup Guide

Before implementing Story 13.0, complete these manual steps in the Paddle sandbox dashboard:

**Step 1: Create the Pro Plan Product**

- Go to sandbox-vendors.paddle.com
- Catalog > Products > New product
- Name: "Pro Plan", Description: "Pro-tier waitlist features", Tax category: SaaS
- Save

**Step 2: Add the Monthly Price**

- On the Pro Plan product page, Prices > New price
- Name: "Monthly", Billing period: Monthly, Price: $15.00 USD
- Save. Copy the Price ID (starts with `pri_`).

**Step 3: Create a Notification Destination (Webhook)**

- Developer Tools > Notifications > New destination
- URL: `https://waitlist-build.vercel.app/api/webhooks/paddle`
- Event types: transaction.completed, subscription.created, subscription.activated, subscription.canceled, subscription.past_due
- Save. Copy the Signing secret.

**Step 4: Get Your API Keys**

- Developer Tools > Authentication
- API Key: starts with `pdl_sdbx_apikey_`
- Client-Side Token: starts with `test_`

**Step 5: Set Default Payment Link**

- Checkout > Checkout settings
- Default payment link: `https://waitlist-build.vercel.app`
- Save

**Environment Variables (add/update in .env.local):**

```
PADDLE_API_KEY=pdl_sdbx_apikey_...
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_...
PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
NEXT_PUBLIC_PADDLE_ENV=sandbox
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=pri_...
```

## Story Index

| ID   | Title                                    | Depends on | Status |
| ---- | ---------------------------------------- | ---------- | ------ |
| 13.0 | Paddle Integration Foundation            | 12.4       | ready  |
| 13.1 | Upgrade Modal (7 Triggers)               | 13.0       | ready  |
| 13.2 | Feature Gating Enforcement               | 13.0       | ready  |
| 13.3 | Billing Management (Paddle Portal)       | 13.0       | ready  |
| 13.4 | Pro-Tier Subscriber Limits (500 Cap)     | 12.4.1     | ready  |
| 13.5 | Sender Domain Authentication Walkthrough | —          | ready  |
| 13.6 | Epic 13 Tests                            | 13.0-13.5  | ready  |

**Execution order:** 13.0 first (foundation), then 13.1 + 13.2 + 13.3 in parallel, then 13.4 + 13.5 in parallel, then 13.6 last.

---

### Story 13.0 — Paddle Integration Foundation

**Status:** done
**Story:** As a founder, I want to upgrade to Pro via Paddle checkout so that I can access premium features. The integration must work in sandbox mode now and transition to production by swapping env vars only.

**Acceptance Criteria (EARS):**

- AC1: The system shall install `@paddle/paddle-js` (client SDK) and `@paddle/paddle-node-sdk` (server SDK).
- AC2: A `usePaddle()` hook shall be created at `src/hooks/use-paddle.ts` that initializes Paddle using `initializePaddle()` with `token` from `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` and `environment` from `NEXT_PUBLIC_PADDLE_ENV`.
- AC3: The hook shall load Paddle.js lazily (only on client mount) and return the `Paddle` instance.
- AC4: The system shall provide a `POST /api/billing/checkout` route that returns price ID and customer data for the client to open Paddle overlay checkout.
- AC5: The system shall provide a `POST /api/webhooks/paddle` route handler that verifies webhook signatures and handles: `transaction.completed`, `subscription.created`, `subscription.canceled`, `subscription.past_due`.
- AC6: On `subscription.created` with successful payment, the webhook handler shall update `founder_profiles.tier` to "pro" and store `paddle_subscription_id`.
- AC7: On `subscription.canceled`, the webhook handler shall update `founder_profiles.tier` to "free".
- AC8: `customData` passed to Paddle checkout shall include `{ user_id, waitlist_id, trigger_source }`.
- AC9: Webhook handler shall use `req.text()` for signature verification.
- AC10: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Install Paddle packages, T2 (AC2-AC3) Create usePaddle hook, T3 (AC4) Checkout API route, T4 (AC5-AC9) Webhook handler, T5 (AC10) Lint + build

**Dev Notes:**

- Packages: `pnpm add @paddle/paddle-js @paddle/paddle-node-sdk`
- usePaddle hook: use `initializePaddle()` from `@paddle/paddle-js`, guard against double-init with ref
- Checkout open: `paddle.Checkout.open({ items, customer, customData, settings: { variant: "one-page" } })`
- Environment toggle: when `NEXT_PUBLIC_PADDLE_ENV === "sandbox"`, call `Paddle.Environment.set("sandbox")` before init. When production, omit.
- Webhook: use `req.text()` for raw body, Paddle SDK verifies signature
- `subscription.canceled` = American English (one L)
- Free-to-Pro is NEW subscription creation, not upgrade
- Money strings in minor units: `"1500"` = $15.00
- Sandbox test card: `4242 4242 4242 4242`
- Env var rename: current `PADDLE_CLIENT_TOKEN` needs `NEXT_PUBLIC_` prefix
- Existing billing stubs (subscription-card, plan-comparison, invoice-history, cancellation-flow) wired in Story 13.3
- **Status: NOT IMPLEMENTED** — No Paddle packages installed (`@paddle/paddle-js`, `@paddle/paddle-node-sdk` absent from package.json). No `src/hooks/` directory exists. No `src/app/api/billing/` directory. No `src/app/api/webhooks/paddle/` handler. `.env.local` has Paddle sandbox keys from Story 0.5 but nothing uses them.

**Out of scope:** Upgrade modal (13.1), feature gating (13.2), billing management UI (13.3)

---

### Story 13.1 — Upgrade Modal (7 Triggers)

**Status:** done
**Story:** As a free founder, I want to see a context-sensitive upgrade modal when I hit a feature limit so that I understand what I'm missing and how to get it.

**Acceptance Criteria (EARS):**

- AC1: The system shall provide an `UpgradeModal` component at `components/dashboard/upgrade-modal.tsx`.
- AC2: The modal shall accept props: `open`, `onOpenChange`, `triggerSource` (string), and use `usePaddle()` to open checkout.
- AC3: The modal shall display a context-specific headline based on `triggerSource`.
- AC4: The modal shall show 3-5 Pro feature bullet points, price ("$15/mo"), and "Cancel anytime".
- AC5: One primary CTA ("Upgrade to Pro") that opens Paddle overlay checkout with `customData: { trigger_source }`.
- AC6: Dismissable via X button, "Maybe later", or backdrop click.
- AC7: Design system: bg-card, border-border, centered overlay with backdrop blur, max-w-[480px].
- AC8: After dismissal, same trigger suppressed for 7 days (localStorage cooldown).
- AC9: Triggered at 7 context points: (1) sidebar Broadcast click, (2) sidebar Warmth click, (3) subscriber approaching 500 cap, (4) 3rd qual question attempt, (5) settings billing CTA, (6) CSV export attempt, (7) dashboard first-subscriber window.
- AC10: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC7) Build modal component, T2 (AC8) Cooldown logic, T3 (AC9) Wire 7 trigger points, T4 (AC10) Lint + build

**Dev Notes:**

- Modal UX: show short interstitial before opening Paddle checkout. Modal IS the pricing comparison.
- Contextual triggers (feature gate clicks, limits) convert better than ambient ones.
- Cooldown: `localStorage.setItem("upgrade-dismissed-{trigger}", JSON.stringify({ dismissedAt: Date.now() }))`. Check: if < 7 days since dismiss, don't show.
- Trigger content varies by source but shares same CTA and feature list.
- Design: max-w-[480px], backdrop backdrop-blur-sm bg-black/50, focus trap, Escape dismisses.
- The sidebar already shows locked state for Broadcast and Warmth — wire those click handlers to open the modal instead of just showing tooltip.
- **Status: NOT IMPLEMENTED** — No `components/dashboard/upgrade-modal.tsx` exists. No upgrade modal component anywhere in codebase. Grep for `UpgradeModal` and `upgrade.*modal` returns zero results.

---

### Story 13.2 — Feature Gating Enforcement

**Status:** done
**Story:** As a system, I want consistent tier-based feature access enforcement so that Free founders cannot access Pro features through any path.

**Acceptance Criteria (EARS):**

- AC1: A `src/lib/tier-gating.ts` utility shall provide `isPro(tier: string): boolean`.
- AC2: The utility shall export `requirePro(tier: string, feature: string): { allowed: boolean; reason?: string }` for server-side use.
- AC3: Server-side: API routes for broadcast, warmth (Pro page), CSV export, and domain auth shall check tier before executing.
- AC4: Client-side: sidebar locked items, warmth panel overlay, qual question cap (3rd question) shall check tier and show upgrade modal.
- AC5: The tier shall be available via `DashboardContext` (already exists) for client-side checks.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Create tier-gating utility, T2 (AC3) Server-side enforcement, T3 (AC4) Client-side enforcement + modal wiring, T4 (AC5) Verify context flow, T5 (AC6) Lint + build

**Dev Notes:**

- Some ad-hoc gating already exists (sidebar `isLocked`, warmth panel overlay, broadcast route 403). This story formalizes it.
- `isPro()` replaces scattered `tier === "pro"` checks.
- Server-side: check in API routes before executing Pro logic, return 403 if not Pro.
- Client-side: check in component render, show UpgradeModal or locked state.
- qual question cap: Free = 2, Pro = 5 (already in `get_max_questions()` at onboarding/4a/page.tsx). Wire 3rd question attempt to show modal.
- **Status: NOT IMPLEMENTED** — No `src/lib/tier-gating.ts` exists. No centralized `isPro()` or `requirePro()` utility. Only scattered local checks: `src/app/onboarding/5/page.tsx` has `const isPro = form.tier === "pro"`, billing components receive `isPro` as a prop. Sidebar has `isLocked` logic. No formalized gating layer.

---

### Story 13.3 — Billing Management (Paddle Portal)

**Status:** done
**Story:** As a Pro founder, I want to view my plan, manage my subscription, and cancel if needed so that I have full control over my billing.

**Acceptance Criteria (EARS):**

- AC1: The billing tab in Settings shall display the current plan (Free/Pro) with dynamic data from `founder_profiles.tier`.
- AC2: Pro founders shall see a "Manage Billing" button that opens Paddle's customer portal via `paddle.customerPortals.createSession(customerId)`.
- AC3: The Paddle customer portal shall allow: view invoices, update payment method, cancel subscription.
- AC4: Free founders shall see an "Upgrade to Pro" button that opens Paddle overlay checkout (reusing the usePaddle hook).
- AC5: The `subscription-card.tsx` shall show dynamic next-billing-date from Paddle (not hardcoded "October 1, 2026").
- AC6: The `cancellation-flow.tsx` confirm button shall be wired to open Paddle portal (not a custom cancel flow).
- AC7: The `invoice-history.tsx` shall show real invoices from Paddle (or remain as placeholder if Paddle portal handles this).
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Wire subscription card to dynamic data + portal, T2 (AC3) Paddle portal integration, T3 (AC4) Free tier upgrade button, T4 (AC5-AC7) Fix stubs, T5 (AC8) Lint + build

**Dev Notes:**

- Paddle customer portal: `paddle.customerPortals.createSession(customerId, { subscription_ids: [...] })` returns authenticated URL. Link directly — do NOT iframe.
- Store Paddle customer ID in `founder_profiles` (may need new column `paddle_customer_id` if not already there).
- The 5 existing billing components are stubs — wire them, don't rebuild.
- subscription-card: replace hardcoded date with dynamic data
- cancellation-flow: replace disabled button with portal link
- invoice-history: Paddle portal handles invoice display, so this can stay as "View in Paddle portal" link
- Billing tab already exists in profile settings at `/dashboard/settings/profile?tab=billing`
- **Status: STUBS EXIST, NOT WIRED** — 5 billing components exist under `components/billing/`: `subscription-card.tsx` (hardcoded "October 1, 2026" date, no Paddle data), `plan-comparison.tsx` (static grid, "(coming soon)" button), `cancellation-flow.tsx` (disabled confirm button), `invoice-history.tsx` (placeholder text), `billing-details.tsx` (works — saves address). Billing tab exists at `/dashboard/settings/profile?tab=billing` and reads `profile?.tier` dynamically. But zero Paddle integration — no checkout, no portal, no real subscription data.

---

### Story 13.4 — Pro-Tier Subscriber Limits (500 Cap)

**Status:** done
**Story:** As a system, I want to enforce the 500 subscriber cap on Free tier so that Free founders are prompted to upgrade when they hit the limit.

**Acceptance Criteria (EARS):**

- AC1: The system shall check `waitlists.subscriber_count` before creating a new subscriber via `POST /api/subscribers`.
- AC2: If the waitlist is on Free tier and `subscriber_count >= 500`, the API shall return HTTP 403 with `{ error: "Subscriber limit reached. Upgrade to Pro for unlimited signups." }`.
- AC3: The public waitlist page shall show a message when the cap is reached: "This waitlist has reached its subscriber limit. Please check back later."
- AC4: Pro tier waitlists shall have no subscriber cap.
- AC5: The system shall show progressive warnings: at 400 signups (80%) a subtle note, at 480 (96%) an orange warning, at 500 a red block with upgrade modal.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) API cap check, T2 (AC3) Public page cap message, T3 (AC4) Pro bypass, T4 (AC5) Progressive warnings, T5 (AC6) Lint + build

**Dev Notes:**

- Depends on Story 12.4.1 which wires the `subscriber_count` increment. Without that, this check is dead code.
- Add cap check at top of POST /api/subscribers handler, before position calculation.
- Query tier: join waitlists with founder_profiles.
- Public page (`[subdomain]/page.tsx`) needs to check count before rendering email capture form.
- Progressive warnings: at 80% show info bar, at 96% show warning bar with upgrade CTA, at 100% block signup form and show upgrade modal.
- **Status: NOT IMPLEMENTED** — No cap check in `POST /api/subscribers` (837 lines). No cap check in `src/app/(public)/[subdomain]/page.tsx`. No subscriber count check anywhere. Depends on 12.4.1 (subscriber_count increment) which is also not implemented.

---

### Story 13.5 — Sender Domain Authentication Walkthrough

**Status:** done
**Story:** As a Pro founder, I want a step-by-step walkthrough to set up my own sending domain (SPF/DKIM) so that my emails have better deliverability.

**Acceptance Criteria (EARS):**

- AC1: The dashboard Settings page shall include a "Domain Authentication" section visible only to Pro founders.
- AC2: The section shall show a 3-step wizard: (1) Add domain in Resend, (2) Copy DNS records, (3) Verify.
- AC3: Step 1 shall display the DNS records Resend provides (MX, TXT SPF, TXT DKIM) with copy-to-clipboard buttons.
- AC4: Step 2 shall guide the founder to add records to their DNS provider with plain-language instructions.
- AC5: Step 3 shall have a "Verify" button that checks DNS propagation via Resend's API (`resend.domains.verify()`).
- AC6: On successful verification, the system shall update `waitlists.sending_domain` to the verified domain.
- AC7: The section shall show current status: unverified, pending, verified.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Settings UI with wizard, T2 (AC3-AC4) DNS record display + copy, T3 (AC5-AC6) Verify + Resend API, T4 (AC7) Status display, T5 (AC8) Lint + build

**Dev Notes:**

- Resend domain verification: `resend.domains.create({ name })` returns DNS records, `resend.domains.verify({ id })` checks status.
- DNS records: MX (feedback-smtp), TXT SPF (v=spf1 include:amazonses.com ~all), TXT DKIM (resend._domainkey).
- DMARC: guide founder to add `_dmarc` TXT record on root domain.
- Store verified domain in `waitlists.sending_domain` column (exists from Story 11.7).
- When `sending_domain` is set, `resolveFromAddress()` in `src/lib/email.ts` uses it (already wired in Story 12.6).
- The existing `src/app/api/waitlist/verify-domain/route.ts` is a stub — replace with real implementation.
- Simple 3-step wizard, not complex DNS management. Copy buttons are critical.
- **Status: STUB ONLY** — `src/app/api/waitlist/verify-domain/route.ts` exists (8 lines) but returns hardcoded `{ verified: false, message: "Verification will be available in a future update" }`. No Resend domain API calls, no DNS record display, no settings UI section for domain auth.

---

### Story 13.6 — Epic 13 Tests

**Status:** done
**Story:** As a developer, I want comprehensive tests for billing and feature gating so that I can verify correctness and prevent regressions.

**Acceptance Criteria (EARS):**

- AC1: API route tests for `POST /api/billing/checkout` covering: creates checkout session, returns error for unauthenticated.
- AC2: API route tests for `POST /api/webhooks/paddle` covering: subscription.created updates tier, subscription.canceled reverts to free, invalid signature rejected.
- AC3: Component tests for upgrade modal: renders for each trigger, dismiss behavior, cooldown logic.
- AC4: API route tests for `POST /api/subscribers` covering: returns 403 when Free tier cap hit (500), allows Pro tier past cap.
- AC5: Component tests for feature gating: Pro features locked for Free, unlocked for Pro.
- AC6: Lint and build shall pass with zero errors.
- AC7: Total test count shall increase by at least 15.

**Tasks:** T1 (AC1-AC2) Billing API tests, T2 (AC3) Upgrade modal tests, T3 (AC4) Subscriber cap tests, T4 (AC5) Feature gating tests, T5 (AC6-AC7) Lint + build + count

**Dev Notes:**

- Mock Paddle SDK in tests (vi.mock("@paddle/paddle-js")).
- Mock Supabase for tier checks and updates.
- Test the webhook handler with synthetic Paddle payloads.
- Test cooldown: set localStorage, verify modal doesn't show within 7 days.
- Test cap: mock waitlist with subscriber_count=500, verify 403 response.
- **Status: NOT IMPLEMENTED** — No tests exist for any Epic 13 story. All dependent code (Paddle hook, checkout route, webhook, upgrade modal, tier-gating, cap check) is not built yet.

# Story 13.3 — Billing Management (Paddle Portal)

**Status:** ready
**Epic:** 13 — Billing & Feature Gating

## Story

As a Pro founder, I want to view my plan, manage my subscription, and cancel if needed so that I have full control over my billing.

## Acceptance Criteria (EARS)

- AC1: The billing tab in Settings shall display the current plan (Free/Pro) with dynamic data from `founder_profiles.tier`.
- AC2: Pro founders shall see a "Manage Billing" button that opens Paddle's customer portal via `paddle.customerPortals.createSession(customerId)`.
- AC3: The Paddle customer portal shall allow: view invoices, update payment method, cancel subscription.
- AC4: Free founders shall see an "Upgrade to Pro" button that opens Paddle overlay checkout (reusing usePaddle hook).
- AC5: The `subscription-card.tsx` shall show dynamic next-billing-date from Paddle (not hardcoded "October 1, 2026").
- AC6: The `cancellation-flow.tsx` confirm button shall be wired to open Paddle portal (not a custom cancel flow).
- AC7: The `invoice-history.tsx` shall show real invoices from Paddle (or remain as placeholder if Paddle portal handles this).
- AC8: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Wire subscription card to dynamic data + portal
T2 (AC3) Paddle portal integration
T3 (AC4) Free tier upgrade button
T4 (AC5-AC7) Fix stubs
T5 (AC8) Lint + build

## Dev Notes

- Paddle customer portal: `paddle.customerPortals.createSession(customerId, { subscription_ids: [...] })` returns authenticated URL. Link directly — do NOT iframe.
- Store Paddle customer ID in `founder_profiles` (may need `paddle_customer_id` column if not already there).
- The 5 existing billing components are stubs — wire them, don't rebuild.
- subscription-card: replace hardcoded date with dynamic data
- cancellation-flow: replace disabled button with portal link
- invoice-history: Paddle portal handles invoice display, so this can stay as "View in Paddle portal" link
- Billing tab already exists in profile settings at `/dashboard/settings/profile?tab=billing`

## Files to Modify

- `components/billing/subscription-card.tsx` — dynamic data + portal link
- `components/billing/plan-comparison.tsx` — wire upgrade button
- `components/billing/invoice-history.tsx` — wire portal link
- `components/billing/billing-details.tsx` — dynamic data
- `components/billing/cancellation-flow.tsx` — wire portal link
- `src/app/api/billing/portal/route.ts` — new route (session creation)

## Implementation Status

**Status: STUBS EXIST, NOT WIRED**

| AC                                         | Status      | Evidence                                                                  |
| ------------------------------------------ | ----------- | ------------------------------------------------------------------------- |
| AC1: Dynamic plan display                  | ✅ Partial  | Billing tab reads `profile?.tier` dynamically from `/api/profile`         |
| AC2: Manage Billing button (Paddle portal) | ❌ Not done | No Paddle SDK installed, no portal session API                            |
| AC3: Paddle portal features                | ❌ Not done | —                                                                         |
| AC4: Free upgrade button                   | ❌ Not done | `plan-comparison.tsx` has "(coming soon)" button                          |
| AC5: Dynamic billing date                  | ❌ Not done | `subscription-card.tsx` hardcoded to "October 1, 2026"                    |
| AC6: Cancellation wired to portal          | ❌ Not done | `cancellation-flow.tsx` confirm button is `disabled` with "(coming soon)" |
| AC7: Real invoices                         | ❌ Not done | `invoice-history.tsx` shows placeholder text                              |
| AC8: Lint + build                          | ⏳ Pending  | —                                                                         |

**Existing stubs (5 components):**

- `components/billing/subscription-card.tsx` — hardcoded date, no Paddle data
- `components/billing/plan-comparison.tsx` — static grid, "(coming soon)" upgrade button
- `components/billing/cancellation-flow.tsx` — disabled confirm button
- `components/billing/invoice-history.tsx` — placeholder message
- `components/billing/billing-details.tsx` — works (saves address), not Paddle-related

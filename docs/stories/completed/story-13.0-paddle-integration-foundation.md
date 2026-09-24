# Story 13.0 — Paddle Integration Foundation

**Status:** ready
**Epic:** 13 — Billing & Feature Gating

## Story

As a founder, I want to upgrade to Pro via Paddle checkout so that I can access premium features. The integration must work in sandbox mode now and transition to production by swapping env vars only.

## Acceptance Criteria (EARS)

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

## Tasks

T1 (AC1) Install Paddle packages
T2 (AC2-AC3) Create usePaddle hook
T3 (AC4) Checkout API route
T4 (AC5-AC9) Webhook handler
T5 (AC10) Lint + build

## Dev Notes

- Packages: `pnpm add @paddle/paddle-js @paddle/paddle-node-sdk`
- usePaddle hook: use `initializePaddle()` from `@paddle/paddle-js`, guard against double-init with ref
- Checkout open: `paddle.Checkout.open({ items, customer, customData, settings: { variant: "one-page" } })`
- Environment toggle: when `NEXT_PUBLIC_PADDLE_ENV === "sandbox"`, call `Paddle.Environment.set("sandbox")` before init
- Webhook: use `req.text()` for raw body, Paddle SDK verifies signature
- `subscription.canceled` = American English (one L)
- Free-to-Pro is NEW subscription creation, not upgrade
- Money strings in minor units: `"1500"` = $15.00
- Sandbox test card: `4242 4242 4242 4242`
- Env var rename: current `PADDLE_CLIENT_TOKEN` needs `NEXT_PUBLIC_` prefix
- Existing billing stubs (subscription-card, plan-comparison, invoice-history, cancellation-flow) wired in Story 13.3

## Implementation Status

**Status: DONE**

| AC                                        | Status  | Evidence                                                                     |
| ----------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| AC1: Install Paddle packages              | ✅ Done | `@paddle/paddle-js@1.6.5` + `@paddle/paddle-node-sdk@3.10.0` in package.json |
| AC2: usePaddle hook                       | ✅ Done | `src/hooks/use-paddle.ts` — `initializePaddle()` with token + environment    |
| AC3: Lazy load Paddle.js                  | ✅ Done | `useEffect` only runs on client mount, ref guards double-init                |
| AC4: POST /api/billing/checkout           | ✅ Done | `src/app/api/billing/checkout/route.ts` — returns priceId + customData       |
| AC5: POST /api/webhooks/paddle            | ✅ Done | `src/app/api/webhooks/paddle/route.ts` — unmarshal + signature verify        |
| AC6: subscription.created → tier update   | ✅ Done | Updates `founder_profiles.tier` to "pro" + stores `paddle_subscription_id`   |
| AC7: subscription.canceled → tier revert  | ✅ Done | Reverts `founder_profiles.tier` to "free" + nulls `paddle_subscription_id`   |
| AC8: customData with user_id, waitlist_id | ✅ Done | Checkout route assembles `{ user_id, waitlist_id, trigger_source }`          |
| AC9: req.text() for webhook               | ✅ Done | `await req.text()` for raw body before unmarshal                             |
| AC10: Lint + build                        | ✅ Done | 0 errors, build passes                                                       |

**Note:** `.env.local` has Paddle sandbox keys from Story 0.5. `PADDLE_CLIENT_TOKEN` renamed to `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`. `NEXT_PUBLIC_PADDLE_ENV=sandbox` added.

## Files to Create/Modify

- `src/hooks/use-paddle.ts` — new hook
- `src/app/api/billing/checkout/route.ts` — new route
- `src/app/api/webhooks/paddle/route.ts` — new route
- `.env.local` — add `NEXT_PUBLIC_PADDLE_ENV`, `NEXT_PUBLIC_PADDLE_PRO_PRICE_ID`, rename `PADDLE_CLIENT_TOKEN`

## Out of Scope

- Upgrade modal (Story 13.1)
- Feature gating (Story 13.2)
- Billing management UI (Story 13.3)

# Story 12.6 — Email Infrastructure Separation

**Epic:** 12 — Email System
**Status:** ready
**Depends on:** 11.7
**Design Refs:** None (infrastructure, no UI surface)

## Story

As a system, I want transactional emails and marketing broadcasts to use separate sending domains so that a spam complaint on a broadcast does not affect deliverability of critical transactional emails (signup confirmations, position updates).

## Acceptance Criteria (EARS)

- AC1: Transactional emails (confirmation, moved-up, milestone) shall be sent from `notifications@prewaitlist.com`.
- AC2: Marketing emails (broadcasts) shall be sent from `updates@prewaitlist.com`.
- AC3: The `from` address resolution shall check: (1) founder's custom sender name + domain, (2) fallback to default prewaitlist.com addresses.
- AC4: When a founder verifies their own domain (Story 13.5), transactional emails shall use `{sender_name}@{verified_domain}` and broadcasts shall use `{sender_name}@{verified_domain}`.
- AC5: The email sending utility (`src/lib/email.ts`, created in Story 12.0) shall accept a `stream` parameter ("transactional" | "broadcast") to resolve the correct `from` address.
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Define default from addresses per stream · T2 (AC3-AC4) Build from-address resolver with verified domain fallback · T3 (AC5) Verify stream parameter in email utility · T4 (AC6) Lint + build

## Out of Scope

Domain verification UI (Story 13.5), SPF/DKIM DNS setup (Story 13.5), sender name customisation (Story 12.5)

## Implementation Details

### T1: Define default from addresses per stream

The email utility (`src/lib/email.ts`) already handles this from Story 12.0. The defaults are:

- **Transactional:** `notifications@prewaitlist.com`
- **Broadcast:** `updates@prewaitlist.com`

These are hardcoded in `resolveFromAddress()`:

```typescript
const email =
  stream === "transactional"
    ? "notifications@prewaitlist.com"
    : "updates@prewaitlist.com";
```

**Verification:** Confirm this logic exists and is correct. No changes needed if Story 12.0 was implemented correctly.

### T2: Build from-address resolver with verified domain fallback

Extend `resolveFromAddress()` in `src/lib/email.ts` to support verified custom domains.

**Current implementation (Story 12.0):**

```typescript
export function resolveFromAddress(
  senderName: string | null | undefined,
  productName: string | null | undefined,
  headline: string | null | undefined,
  stream: Stream
): string {
  const name =
    senderName?.trim() ||
    productName?.trim() ||
    headline?.trim() ||
    DEFAULT_SENDER_NAME;

  const email =
    stream === "transactional"
      ? "notifications@prewaitlist.com"
      : "updates@prewaitlist.com";

  return `${name} <${email}>`;
}
```

**Updated implementation (Story 12.6):**

```typescript
interface FromAddressParams {
  senderName: string | null | undefined;
  productName: string | null | undefined;
  headline: string | null | undefined;
  stream: Stream;
  sendingDomain?: string | null; // From waitlists.sending_domain (Story 11.7)
}

export function resolveFromAddress(params: FromAddressParams): string {
  const { senderName, productName, headline, stream, sendingDomain } = params;

  // Sender name fallback chain
  const name =
    senderName?.trim() ||
    productName?.trim() ||
    headline?.trim() ||
    DEFAULT_SENDER_NAME;

  // AC4: When verified domain exists, use it
  if (sendingDomain) {
    return `${name} <${stream === "transactional" ? "notifications" : "updates"}@${sendingDomain}>`;
  }

  // AC1-AC2: Default prewaitlist.com addresses
  const email =
    stream === "transactional"
      ? "notifications@prewaitlist.com"
      : "updates@prewaitlist.com";

  return `${name} <${email}>`;
}
```

**Key change:** The function now accepts `sendingDomain` parameter. When set (founder has verified their custom domain via Story 13.5), the from-address uses the verified domain. When null, falls back to default prewaitlist.com addresses.

### T3: Verify stream parameter in email utility

**AC5:** The `stream` parameter already exists in `sendEmail()` from Story 12.0. Verify that:

1. All callers pass the correct stream:
   - Confirmation email: `stream: "transactional"` ✅
   - Moved-up email: `stream: "transactional"` ✅
   - Milestone email: `stream: "transactional"` ✅ (verify in `milestones.ts`)
   - Broadcast email: `stream: "broadcast"` ✅
2. The `resolveFromAddress()` function is called with `sendingDomain` from the waitlist record

**Update callers to pass `sendingDomain`:**

```typescript
// In POST /api/subscribers (confirmation + moved-up emails):
const { data: waitlist } = await supabaseAdmin
  .from("waitlists")
  .select("product_name, headline, subdomain, sender_name, sending_domain")
  .eq("id", waitlist_id)
  .single();

await sendEmail({
  // ... existing params
  sendingDomain: waitlist.sending_domain, // Add this
});

// In POST /api/dashboard/broadcast:
await sendEmail({
  // ... existing params
  sendingDomain: waitlist.sending_domain, // Add this
});
```

### T4: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any TypeScript errors

## Verification

1. Verify `src/lib/email.ts` has the `sendingDomain` parameter in `resolveFromAddress()`
2. Verify all email senders pass `sendingDomain` from the waitlist record
3. Test with `sending_domain = null`: verify from-address is `notifications@prewaitlist.com` (transactional) or `updates@prewaitlist.com` (broadcast)
4. Test with `sending_domain = "acme.com"`: verify from-address is `notifications@acme.com` (transactional) or `updates@acme.com` (broadcast)
5. Test sender name fallback: `sender_name = "Acme"` + `sending_domain = "acme.com"` → `"Acme <notifications@acme.com>"`
6. Test sender name fallback: `sender_name = null` + `product_name = "Acme"` + `sending_domain = "acme.com"` → `"Acme <notifications@acme.com>"`
7. Test default fallback: all null → `"PreWaitlist <notifications@prewaitlist.com>"`
8. Run `pnpm lint` and `pnpm build` — verify zero errors

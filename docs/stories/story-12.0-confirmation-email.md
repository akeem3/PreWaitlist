# Story 12.0 — Confirmation Email

**Epic:** 12 — Email System
**Status:** ready
**Depends on:** 11.7
**Design Refs:** None (transactional email, no UI surface)

## Story

As a subscriber, I want to receive a confirmation email immediately after signing up so that I have my position number and referral link.

## Acceptance Criteria (EARS)

- AC1: The system shall send a confirmation email via Resend immediately after a subscriber is created via `POST /api/subscribers`.
- AC2: The email shall include: position number ("You're #{position} in line"), referral link, share prompt.
- AC3: The email shall be branded with the founder's product name (`product_name` from the waitlist, falling back to `headline` if null), not "PreWaitlist".
- AC4: The email shall be sent from the founder's configured sender name (or default "PreWaitlist <notifications@prewaitlist.com>" if not customised).
- AC5: The email shall be sent via Resend's Emails API (transactional, single send — not Batch or Broadcast).
- AC6: If the email send fails, the subscriber shall still be created (email failure must not block signup).
- AC7: The system shall provide an email sending utility (`src/lib/email.ts`) that resolves the correct `from` address based on sender name and stream (transactional vs broadcast).
- AC8: The email shall log a `sent` event to the `email_events` table after successful send (event_type: 'sent').
- AC9: Lint and build shall pass with zero errors.

## Tasks

T1 (AC2-AC3) Build confirmation email template with brand resolution · T2 (AC4, AC7) Create email utility with from-address resolution + sender name fallback · T3 (AC1, AC5-AC6) Emails API integration in POST /api/subscribers + error handling · T4 (AC8) Log sent event to email_events · T5 (AC9) Lint + build

## Out of Scope

Position recalculation (Story 12.1), "you moved up" email (Story 12.2), broadcast emails (Story 12.3), domain verification (Story 13.5)

## Implementation Details

### T1: Build confirmation email template with brand resolution

The email template is plain HTML (not React Email or MJML — keep dependencies minimal for MVP).

**Template content (3-5 lines, confirmation emails have 60-80% open rate):**

```
Subject: You're #{position} in line for {product_name}

Hi there,

You're #{position} in line for {product_name}.

Here's your referral link — share it to move up:
{referral_link}

You can also share on Twitter or LinkedIn:
[Share on Twitter] [Share on LinkedIn]

See you soon,
The {product_name} team
```

**Brand resolution (AC3):**

1. Query `waitlists` table for `product_name` and `headline` (already available via subscriber join or a separate query)
2. Resolution chain: `waitlist.product_name` → `waitlist.headline` → `"PreWaitlist"` (hardcoded fallback)
3. Use the resolved name in: email subject line, email body text ("for {product_name}"), team signature ("The {product_name} team")

**Referral link format:**

- `https://{subdomain}.prewaitlist.com?ref={referral_code}`
- `subdomain` comes from the waitlist record
- `referral_code` is the subscriber's generated 8-char code (already stored on `subscribers` table)

**Share URLs:**

- Twitter: `https://twitter.com/intent/tweet?text=I%20just%20joined%20the%20waitlist%20for%20{product_name}!%20{referral_link}`
- LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url={referral_link}`

### T2: Create email utility with from-address resolution + sender name fallback

- **New file:** `src/lib/email.ts`

This utility wraps Resend's `email.send()` and handles from-address resolution, sender name fallback, and error handling.

```typescript
import { resend } from "@/lib/resend";

type Stream = "transactional" | "broadcast";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  stream: Stream;
  senderName?: string | null;
  productName?: string | null;
  headline?: string | null;
}

const DEFAULT_SENDER_NAME = "PreWaitlist";

/**
 * AC7: Resolve the from-address based on stream and sender name.
 *
 * Resolution chain: senderName → productName → headline → "PreWaitlist"
 * Domain: notifications@ (transactional) | updates@ (broadcast)
 */
export function resolveFromAddress(
  senderName: string | null | undefined,
  productName: string | null | undefined,
  headline: string | null | undefined,
  stream: Stream
): string {
  // AC4: Sender name fallback chain
  const name =
    senderName?.trim() ||
    productName?.trim() ||
    headline?.trim() ||
    DEFAULT_SENDER_NAME;

  // AC7: Domain based on stream
  const email =
    stream === "transactional"
      ? "notifications@prewaitlist.com"
      : "updates@prewaitlist.com";

  return `${name} <${email}>`;
}

/**
 * AC5: Send a transactional email via Resend's Emails API (single send).
 * AC6: Error handling — returns { ok, error } instead of throwing.
 */
export async function sendEmail(params: SendEmailParams): Promise<{
  ok: boolean;
  id?: string;
  error?: string;
}> {
  const from = resolveFromAddress(
    params.senderName,
    params.productName,
    params.headline,
    params.stream
  );

  try {
    const result = await resend.emails.send({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true, id: result.data?.id };
  } catch (err) {
    // AC6: Email failure must not throw — subscriber creation succeeds regardless
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}
```

**Note:** `src/lib/resend.ts` is a bare 9-line wrapper (`new Resend(apiKey)`) — do NOT modify it. Import from there.

### T3: Emails API integration in POST /api/subscribers + error handling

- **File to modify:** `src/app/api/subscribers/route.ts`

Current flow ends at line 143 (after milestone check). Add email dispatch AFTER subscriber creation and milestone check.

**Changes to make:**

1. Import `sendEmail` from `@/lib/email`
2. After the subscriber is created (line ~143, after milestone block), chain the confirmation email send
3. The email send is fire-and-forget: don't `await` it (or `await` it but catch errors — subscriber must be created regardless)

**Integration point — add AFTER the milestone check block (after line ~143):**

```typescript
// --- Confirmation email (fire-and-forget) ---
// AC1: Send immediately after subscriber creation
// AC6: Error handling — email failure must not block signup
(async () => {
  const { data: waitlist } = await supabaseAdmin
    .from("waitlists")
    .select("product_name, headline, subdomain, sender_name")
    .eq("id", subscriberData.waitlist_id)
    .single();

  if (!waitlist) return;

  const referralLink = `https://${waitlist.subdomain}.prewaitlist.com?ref=${newSubscriber.referral_code}`;

  const subject = `You're #${newSubscriber.position} in line for ${waitlist.product_name || waitlist.headline || "PreWaitlist"}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
      <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 12px;">
        You're <strong>#${newSubscriber.position}</strong> in line for <strong>${waitlist.product_name || waitlist.headline || "PreWaitlist"}</strong>.
      </p>
      <p style="font-size: 14px; color: #6b6459; margin: 0 0 24px;">
        Share your referral link to move up:
      </p>
      <p style="font-size: 14px; color: #6b6459; margin: 0 0 24px;">
        <a href="${referralLink}" style="color: #0f7a5e; text-decoration: underline;">${referralLink}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #ccc9c3; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b6459; margin: 0;">
        ${waitlist.product_name || waitlist.headline || "PreWaitlist"} — powered by PreWaitlist
      </p>
    </div>
  `;

  // AC5: Resend Emails API (single transactional send)
  await sendEmail({
    to: newSubscriber.email,
    subject,
    html,
    stream: "transactional",
    senderName: waitlist.sender_name,
    productName: waitlist.product_name,
    headline: waitlist.headline,
  });
  // AC6: Error handled inside sendEmail — returns { ok, error }, never throws
  // AC8: Log event — handled in T4
})();
```

**Critical:** The `(async () => { ... })()` wrapper means the email send runs in the background. The subscriber creation response returns immediately (fast response time). The email send completes independently.

### T4: Log sent event to email_events

Add event logging after the email send. This feeds the warmth tracking engine (Story 11.1).

```typescript
// Inside the async IIFE, after sendEmail:
const emailResult = await sendEmail({ ... });

if (emailResult.ok) {
  await supabaseAdmin.from("email_events").insert({
    subscriber_id: newSubscriber.id,
    waitlist_id: newSubscriber.waitlist_id,
    event_type: "sent",
    event_data: { email_id: emailResult.id, type: "confirmation" },
    created_at: new Date().toISOString(),
  });
}
```

### T5: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any TypeScript errors
- Verify no new warnings

## Verification

1. Create `src/lib/email.ts` with the `sendEmail` and `resolveFromAddress` functions
2. Unit test `resolveFromAddress`:
   - `resolveFromAddress("Acme", null, null, "transactional")` → `"Acme <notifications@prewaitlist.com>"`
   - `resolveFromAddress(null, "Acme", null, "broadcast")` → `"Acme <updates@prewaitlist.com>"`
   - `resolveFromAddress(null, null, null, "transactional")` → `"PreWaitlist <notifications@prewaitlist.com>"`
3. Unit test `sendEmail` with mocked Resend: verify it calls `resend.emails.send` with correct params
4. Modify `src/app/api/subscribers/route.ts` — add the async IIFE after milestone check
5. Sign up a new subscriber via the email capture form on a public waitlist page
6. Verify: subscriber is created (position assigned, referral code generated)
7. Verify: confirmation email arrives at the subscriber's email address
8. Verify: email shows correct position, referral link, product name (not "PreWaitlist")
9. Verify: `email_events` table has a new row with `event_type: 'sent'`
10. Simulate Resend failure (wrong API key) → verify subscriber is still created (email failure doesn't block)
11. Run `pnpm lint` and `pnpm build` — verify zero errors

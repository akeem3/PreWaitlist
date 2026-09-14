# Story 12.2.7 — Unsubscribe Mechanism

**Epic:** 12.2 — Gap Fixes
**Status:** done
**Depends on:** —
**Design Refs:** —

## Story

As a subscriber, I want to unsubscribe from waitlist emails so that I can opt out of communication.

## Acceptance Criteria (EARS)

- AC1: Every transactional and broadcast email sent through the system shall include an unsubscribe link in the email footer.
- AC2: The unsubscribe link shall be a unique URL: `/unsubscribe?token={subscriber_id_hmac}` where the HMAC is computed from the subscriber ID using a server-side secret.
- AC3: Clicking the unsubscribe link shall render a page (`/unsubscribe`) confirming: "You have been unsubscribed from {waitlist_name} emails. You will no longer receive emails from this waitlist."
- AC4: On confirmation, the system shall set `subscribers.unsubscribed_at` to the current timestamp.
- AC5: After unsubscribing, the system shall NOT send any more emails to this subscriber (check `unsubscribed_at` before sending).
- AC6: The unsubscribe page shall include a "Changed your mind? Resubscribe" link that clears `unsubscribed_at`.
- AC7: The unsubscribe mechanism shall comply with CAN-SPAM requirements.
- AC8: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Unsubscribe link in emails + HMAC token · T2 (AC3-AC4) Unsubscribe page + logic · T3 (AC5) Send-time check · T4 (AC6) Resubscribe option · T5 (AC7-AC8) CAN-SPAM compliance + lint + build

## Out of Scope

One-click unsubscribe header (RFC 8058), preference center, unsubscribe reason collection.

## Implementation Details

### T1: Unsubscribe link in emails + HMAC token

- **File to modify:** `src/lib/email.ts`

Add HMAC generation:

```typescript
import crypto from "crypto";

const UNSUBSCRIBE_SECRET =
  process.env.UNSUBSCRIBE_SECRET || "default-secret-change-in-production";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://prewaitlist.com";

function generateUnsubscribeUrl(subscriberId: string): string {
  const hmac = crypto
    .createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(subscriberId)
    .digest("hex");
  return `${BASE_URL}/unsubscribe?token=${subscriberId}.${hmac}`;
}
```

Add to the email HTML footer template:

```typescript
const footerHtml = `
  <hr style="border: none; border-top: 1px solid #ccc9c3; margin: 32px 0;" />
  <p style="font-size: 12px; color: #6b6459; margin: 0 0 8px;">
    ${businessAddress || "PreWaitlist Inc., 123 Placeholder Ave, San Francisco, CA 94105, USA"}
  </p>
  <p style="font-size: 12px; color: #6b6459; margin: 0;">
    <a href="${generateUnsubscribeUrl(subscriberId)}" style="color: #6b6459;">Unsubscribe</a>
  </p>
`;
```

### T2: Unsubscribe page + logic

- **New file:** `src/app/unsubscribe/page.tsx`

```typescript
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || "default-secret-change-in-production";

function verifyToken(token: string): string | null {
  const [subscriberId, providedHmac] = token.split(".");
  if (!subscriberId || !providedHmac) return null;

  const expectedHmac = crypto
    .createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(subscriberId)
    .digest("hex");

  if (providedHmac !== expectedHmac) return null;
  return subscriberId;
}

type Props = { searchParams: Promise<{ token?: string }> };

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-h2 text-foreground">Invalid link</h1>
          <p className="text-body text-muted-foreground">
            This unsubscribe link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const subscriberId = verifyToken(token);

  if (!subscriberId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-h2 text-foreground">Invalid link</h1>
          <p className="text-body text-muted-foreground">
            This unsubscribe link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  // Set unsubscribed_at
  const { data: subscriber } = await supabase
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", subscriberId)
    .select("id, waitlist_id")
    .single();

  // Get waitlist name
  let waitlistName = "this waitlist";
  if (subscriber) {
    const { data: waitlist } = await supabase
      .from("waitlists")
      .select("product_name, headline")
      .eq("id", subscriber.waitlist_id)
      .single();
    waitlistName = waitlist?.product_name || waitlist?.headline || "this waitlist";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-2 text-h2 text-foreground">Unsubscribed</h1>
        <p className="mb-6 text-body text-muted-foreground">
          You have been unsubscribed from {waitlistName} emails.
          You will no longer receive emails from this waitlist.
        </p>
        <a
          href={`/unsubscribe/resubscribe?token=${token}`}
          className="text-body-sm text-accent underline"
        >
          Changed your mind? Resubscribe
        </a>
      </div>
    </div>
  );
}
```

### T3: Send-time check

- **File to modify:** `src/lib/email.ts`

Before sending any email, check `unsubscribed_at`:

```typescript
async function isUnsubscribed(
  supabase: any,
  subscriberId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("subscribers")
    .select("unsubscribed_at")
    .eq("id", subscriberId)
    .single();
  return !!data?.unsubscribed_at;
}
```

Add to `sendEmail` or the calling code:

```typescript
if (await isUnsubscribed(supabase, subscriberId)) {
  return { ok: false, error: "Subscriber has unsubscribed" };
}
```

### T4: Resubscribe option

- **New file:** `src/app/unsubscribe/resubscribe/page.tsx`

```typescript
import { createClient } from "@/lib/supabase/server";
import { verifyToken } from "@/lib/unsubscribe";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;
  const subscriberId = verifyToken(token);

  if (!subscriberId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-body text-muted-foreground">Invalid link.</p>
      </div>
    );
  }

  const supabase = await createClient();
  await supabase
    .from("subscribers")
    .update({ unsubscribed_at: null })
    .eq("id", subscriberId);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-2 text-h2 text-foreground">Resubscribed!</h1>
        <p className="text-body text-muted-foreground">
          You have been resubscribed. You will receive emails from this waitlist again.
        </p>
      </div>
    </div>
  );
}
```

Extract `verifyToken` to `src/lib/unsubscribe.ts` for reuse.

### T5: CAN-SPAM compliance + lint + build

- Every email includes unsubscribe link ✓
- Every email includes physical address (Story 12.2.9) ✓
- Unsubscribe processed immediately (< 10 business days) ✓
- Run `pnpm lint` and `pnpm build`

## Verification

1. Send a transactional email → verify unsubscribe link in footer
2. Click unsubscribe link → page confirms "You have been unsubscribed"
3. Check `subscribers.unsubscribed_at` is set in database
4. Try to send another email to this subscriber → skipped
5. Click "Resubscribe" → `unsubscribed_at` cleared
6. After resubscribe, emails resume
7. Invalid token → "Invalid link" page
8. `pnpm lint` and `pnpm build` pass with zero errors

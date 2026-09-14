# Story 12.2.8 — Bounce Suppression

**Epic:** 12.2 — Gap Fixes
**Status:** ready
**Depends on:** 12.2.0
**Design Refs:** —

## Story

As the system, I need to suppress bounced email addresses so that we don't keep sending to invalid addresses and protect deliverability.

## Acceptance Criteria (EARS)

- AC1: When a Resend webhook reports an email as "bounced" or "complained", the system shall insert a record into the `bounced_emails` table.
- AC2: The bounce handler shall classify bounces: `hard` (permanent failure — invalid address) vs `soft` (temporary failure — mailbox full).
- AC3: Before sending any email (transactional or broadcast), the system shall check if the recipient's email exists in `bounced_emails` for the same `waitlist_id`. If so, skip sending.
- AC4: The dashboard shall display a "Bounced" indicator in the subscriber table for subscribers whose emails are in the `bounced_emails` table.
- AC5: Hard bounces shall be suppressed indefinitely. Soft bounces shall be suppressed for 24 hours, then retried.
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Webhook bounce handler + classification · T2 (AC3) Send-time bounce check · T3 (AC4) Dashboard bounce indicator · T4 (AC5) Soft bounce retry logic · T5 (AC6) Lint + build

## Out of Scope

Bounce analytics dashboard, automatic list cleaning, manual bounce review UI.

## Implementation Details

### T1: Webhook bounce handler + classification

- **File to modify:** `src/app/api/webhooks/resend/route.ts`

The existing webhook handler processes `sent`, `delivered`, `opened`, `clicked` events. Add `bounce` and `complain`:

```typescript
if (event.type === "email.bounced" || event.type === "email.complained") {
  const emailData = event.data;
  const email = emailData.email?.address || emailData.from;
  const waitlistId = emailData.waitlist_id; // from custom payload

  // Classify bounce type
  const bounceType = determineBounceType(emailData);

  await supabase.from("bounced_emails").insert({
    waitlist_id: waitlistId,
    email: email,
    email_type: "broadcast", // or determine from context
    bounce_type: bounceType,
  });
}

function determineBounceType(emailData: any): "hard" | "soft" {
  // Hard bounces: invalid address, domain not found, mailbox not found
  const hardReasons = [
    "invalid_address",
    "domain_not_found",
    "mailbox_not_found",
    "rejected",
  ];
  const reason =
    emailData.delivery_status?.type || emailData.bounce?.type || "";

  if (hardReasons.some((r) => reason.toLowerCase().includes(r))) {
    return "hard";
  }
  return "soft"; // Default to soft for temporary failures
}
```

### T2: Send-time bounce check

- **New utility:** `src/lib/bounces.ts`

```typescript
import { SupabaseClient } from "@supabase/supabase-js";

export async function isEmailBounced(
  supabase: SupabaseClient,
  waitlistId: string,
  email: string
): Promise<boolean> {
  const { data } = await supabase
    .from("bounced_emails")
    .select("id, bounce_type, created_at")
    .eq("waitlist_id", waitlistId)
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return false;

  // Hard bounces: always suppressed
  if (data.bounce_type === "hard") return true;

  // Soft bounces: suppressed for 24 hours
  const bounceTime = new Date(data.created_at).getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  if (Date.now() - bounceTime < twentyFourHours) return true;

  // Soft bounce older than 24h: allow retry, delete the record
  await supabase.from("bounced_emails").delete().eq("id", data.id);
  return false;
}
```

Use in email sending code:

```typescript
import { isEmailBounced } from "@/lib/bounces";

// Before sending:
if (await isEmailBounced(supabase, waitlistId, recipientEmail)) {
  // Skip this recipient
  return;
}
```

### T3: Dashboard bounce indicator

- **File to modify:** `src/app/dashboard/client.tsx` (subscriber table)

Batch-query `bounced_emails` for all displayed subscribers:

```typescript
// After fetching subscribers, check for bounces
const subscriberEmails = subscribers.map((s) => s.email);
const { data: bouncedEmails } = await supabase
  .from("bounced_emails")
  .select("email")
  .eq("waitlist_id", waitlistId)
  .in("email", subscriberEmails);

const bouncedSet = new Set(bouncedEmails?.map((b) => b.email) || []);
```

In the subscriber table row, add a badge:

```tsx
{
  bouncedSet.has(subscriber.email) && (
    <span className="ml-2 inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
      Bounced
    </span>
  );
}
```

### T4: Soft bounce retry logic

Covered in T2 above. The `isEmailBounced` function automatically:

- Suppresses soft bounces for 24 hours
- Deletes the bounce record after 24 hours (allowing retry)

### T5: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Resend webhook with bounce event → `bounced_emails` record created
2. Hard bounce → record with `bounce_type: "hard"`
3. Soft bounce → record with `bounce_type: "soft"`
4. Try to send email to bounced address → skipped
5. Soft bounce after 24 hours → email sent, bounce record deleted
6. Dashboard subscriber table shows "Bounced" badge for bounced emails
7. `pnpm lint` and `pnpm build` pass with zero errors

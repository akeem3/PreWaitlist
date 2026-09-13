# Story 12.2 — "You Moved Up" Trigger Email

**Epic:** 12 — Email System
**Status:** ready
**Depends on:** 12.0, 12.1
**Design Refs:** None (transactional email, no UI surface)

## Story

As a referrer, I want to receive a "you moved up" email when someone I referred signs up so that I'm motivated to share more.

## Acceptance Criteria (EARS)

- AC1: When a referrer's position improves due to a referral conversion, the system shall send a "You moved up {X} spots" email.
- AC2: The email shall include: new position number, spots moved, referral link (for continued sharing).
- AC3: The email shall be sent via Resend's Emails API (transactional, single send).
- AC4: The email shall only be sent when the referrer moves up by ≥1 spot (no email if position unchanged).
- AC5: The email shall be sent from the founder's configured sender name or default.
- AC6: If the email send fails, the position recalculation shall not be rolled back.
- AC7: The system shall log a `sent` event to the `email_events` table after successful send.
- AC8: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Build "moved up" email template + trigger logic in POST /api/subscribers · T2 (AC3) Resend Emails API integration · T3 (AC4-AC6) Minimum spots threshold + error handling + non-blocking · T4 (AC7) Log sent event to email_events · T5 (AC8) Lint + build

## Out of Scope

Position recalculation itself (Story 12.1), milestone congratulations emails (already in `src/lib/milestones.ts`), "moved up" email for non-referral position changes (only fires on referral conversion)

## Implementation Details

### T1: Build "moved up" email template + trigger logic

**Trigger point:** After `recalculatePositions()` in `POST /api/subscribers` (from Story 12.1), check if the REFFERRER's position improved. This fires AFTER position recalculation but independently of the confirmation email (which goes to the new subscriber).

**Integration in `src/app/api/subscribers/route.ts`** — add AFTER the confirmation email send (Story 12.0):

```typescript
import { sendEmail } from "@/lib/email";
import { getPositionUpdate } from "@/lib/positions";

// ... (after recalculatePositions and confirmation email)

// The referrer is resolvedReferrerId (from lines 38-65 of route.ts)
// The new subscriber's position update is subscriberUpdate (from recalculatePositions)

// AC4: Only send if referrer moved up by ≥1 spot
if (
  subscriberUpdate &&
  subscriberUpdate.spots_moved >= 1 &&
  resolvedReferrerId
) {
  // Fetch the referrer's details
  const { data: referrer } = await supabase
    .from("subscribers")
    .select("id, email, referral_code")
    .eq("id", resolvedReferrerId)
    .single();

  if (referrer) {
    // AC1-AC2: Build and send "moved up" email
    (async () => {
      const { data: waitlist } = await supabase
        .from("waitlists")
        .select("product_name, headline, subdomain, sender_name")
        .eq("id", waitlist_id)
        .single();

      if (!waitlist) return;

      const referralLink = `https://${waitlist.subdomain}.prewaitlist.com?ref=${referrer.referral_code}`;
      const productName =
        waitlist.product_name || waitlist.headline || "PreWaitlist";

      const subject = `You moved up ${subscriberUpdate.spots_moved} spot${subscriberUpdate.spots_moved > 1 ? "s" : ""} for ${productName}!`;

      const html = `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
          <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 12px;">
            You moved up <strong>${subscriberUpdate.spots_moved} spot${subscriberUpdate.spots_moved > 1 ? "s" : ""}</strong> for <strong>${productName}</strong>!
          </p>
          <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 24px;">
            You're now <strong>#${subscriberUpdate.new_position}</strong> in line.
          </p>
          <p style="font-size: 14px; color: #6b6459; margin: 0 0 24px;">
            Keep sharing to move up even more:
          </p>
          <p style="font-size: 14px; color: #6b6459; margin: 0 0 24px;">
            <a href="${referralLink}" style="color: #0f7a5e; text-decoration: underline;">${referralLink}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #ccc9c3; margin: 24px 0;" />
          <p style="font-size: 12px; color: #6b6459; margin: 0;">
            ${productName} — powered by PreWaitlist
          </p>
        </div>
      `;

      const emailResult = await sendEmail({
        to: referrer.email,
        subject,
        html,
        stream: "transactional",
        senderName: waitlist.sender_name,
        productName: waitlist.product_name,
        headline: waitlist.headline,
      });

      // AC7: Log event
      if (emailResult.ok) {
        await supabase.from("email_events").insert({
          subscriber_id: referrer.id,
          waitlist_id,
          event_type: "sent",
          event_data: { email_id: emailResult.id, type: "moved_up" },
          created_at: new Date().toISOString(),
        });
      }
    })();
  }
}
```

**Variable reference map (matching actual route.ts):**

| Story variable       | Actual route.ts variable | Source                                                  |
| -------------------- | ------------------------ | ------------------------------------------------------- |
| `resolvedReferrerId` | `resolvedReferrerId`     | Lines 38-65, resolved from `incomingRefCode`            |
| `subscriberUpdate`   | `subscriberUpdate`       | From `getPositionUpdate(updates, data.id)` (Story 12.1) |
| `waitlist_id`        | `waitlist_id`            | From `body.waitlist_id` (line 14)                       |
| `supabase`           | `supabase`               | From `createClient()` (line 10) — NOT `supabaseAdmin`   |
| `data.id`            | `data.id`                | The new subscriber's ID (line 78-92)                    |

**Template content (short, motivational):**

```
Subject: You moved up {spots_moved} spots for {product_name}!

You moved up {spots_moved} spots for {product_name}!

You're now #{new_position} in line.

Keep sharing to move up even more:
{referral_link}
```

### T2: Resend Emails API integration

- AC3: Use `resend.emails.send()` — single transactional send (same pattern as Story 12.0)
- Import `sendEmail` from `@/lib/email` (created in Story 12.0)
- The email utility handles from-address resolution and error handling

### T3: Minimum spots threshold + error handling + non-blocking

**AC4:** The email only fires when `spots_moved >= 1`. The `recalculatePositions()` function from Story 12.1 returns `spots_moved = old_position - new_position`. If the referrer was already at #1 and stays at #1 (spots_moved = 0), no email is sent.

**AC6:** Error handling:

- `sendEmail()` returns `{ ok, error }` — never throws (per Story 12.0 design)
- If email fails, the position recalculation is already committed to DB — no rollback
- Log the error for debugging but don't propagate it

**Non-blocking:** The `(async () => { ... })()` wrapper means the email send runs in the background. The subscriber creation response returns immediately.

**Variable flow through the route handler:**

```
1. supabase = createClient()          ← SSR client, used everywhere
2. resolvedReferrerId = ...            ← from referral code resolution (lines 38-65)
3. data = await supabase.insert(...)   ← new subscriber record
4. updates = await recalculatePositions(waitlist_id, supabase)
5. subscriberUpdate = getPositionUpdate(updates, data.id)
6. if (subscriberUpdate.spots_moved >= 1 && resolvedReferrerId) → send email
```

### T4: Log sent event to email_events

After successful send, insert into `email_events`:

```typescript
{
  subscriber_id: referrer.id,
  waitlist_id,
  event_type: "sent",
  event_data: { email_id: emailResult.id, type: "moved_up" },
  created_at: new Date().toISOString(),
}
```

The `event_data.type: "moved_up"` distinguishes this from confirmation emails (`type: "confirmation"`) for analytics.

### T5: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any TypeScript errors

## Verification

1. Modify `src/app/api/subscribers/route.ts` — add the moved-up email trigger after recalculatePositions
2. Sign up subscriber A (no referral) → position = 1
3. Sign up subscriber B (no referral) → position = 2
4. Sign up subscriber C (with subscriber A's referral code) → subscriber A moves to position 1 (no change, spots_moved = 0) → NO "moved up" email sent
5. Sign up subscriber D (with subscriber B's referral code) → subscriber B moves from position 2 to 1 (spots_moved = 1) → "moved up" email sent to subscriber B
6. Verify: email shows "You moved up 1 spot" and "You're now #1 in line"
7. Verify: referral link in email is subscriber B's own referral link (not the new subscriber's)
8. Verify: `email_events` table has a row with `event_type: 'sent'` and `event_data.type: 'moved_up'`
9. Verify: subscriber C's position is now 3 (shifted down by D taking position 2) — C does NOT receive an email (only referrers who move up get emails)
10. Simulate Resend failure → verify position recalculation is not rolled back (subscriber D still gets their position)
11. Run `pnpm lint` and `pnpm build` — verify zero errors

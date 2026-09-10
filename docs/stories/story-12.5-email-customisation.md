# Story 12.5 — Email Customisation (Pro)

**Epic:** 12 — Email System
**Status:** ready
**Depends on:** 12.0
**Design Refs:** None (Settings page UI)

## Story

As a Pro founder, I want to customise the sender name and email body text so that my emails feel personal and on-brand.

## Acceptance Criteria (EARS)

- AC1: The dashboard Settings page shall include an "Email" section with editable fields: sender name.
- AC2: The sender name shall default to the waitlist `product_name` (falling back to `headline` if null).
- AC3: The customised sender name shall be used in all transactional emails (confirmation, moved-up, milestone).
- AC4: The customised sender name shall be used in broadcast emails.
- AC5: Changes shall be saved to the `waitlists` table (`sender_name` column, nullable).
- AC6: When `sender_name` is null, the system shall fall back to `product_name`, then to `headline`.
- AC7: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Settings UI with sender name field · T2 (AC3-AC4) Wire sender name into email sending logic · T3 (AC5-AC6) DB storage + fallback chain · T4 (AC7) Lint + build

## Out of Scope

Body text customisation (v1.1), subject prefix (v1.1), domain authentication (Story 13.5), email template builder (v1.1)

## Implementation Details

### T1: Settings UI with sender name field

- **File to modify:** `src/app/dashboard/settings/client.tsx` (already exists from Story 11.4)

Add an "Email" section to the Settings page with a sender name field.

```tsx
// Add to the Settings page component (after existing sections)
<div className="border-b border-border py-6">
  <h2 className="text-h3 text-foreground mb-4">Email Settings</h2>
  <p className="text-body-sm text-muted-foreground mb-4">
    Customise the sender name that appears on emails sent to your subscribers.
  </p>

  <div className="max-w-md">
    <label className="text-label text-foreground">Sender name</label>
    <Input
      value={senderName}
      onChange={(e) => setSenderName(e.target.value)}
      placeholder={waitlist.product_name || waitlist.headline || "PreWaitlist"}
      className="mt-1"
    />
    <p className="text-caption text-muted-foreground mt-1">
      Emails will be sent from "
      {senderName ||
        waitlist.product_name ||
        waitlist.headline ||
        "PreWaitlist"}{" "}
      &lt;notifications@prewaitlist.com&gt;"
    </p>
  </div>

  <Button onClick={handleSave} className="mt-4">
    Save changes
  </Button>
</div>
```

**State management:**

```typescript
const [senderName, setSenderName] = useState(waitlist.sender_name || "");

const handleSave = async () => {
  await fetch("/api/waitlist", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender_name: senderName || null }),
  });
  // Show success toast
};
```

### T2: Wire sender name into email sending logic

- **File to modify:** `src/lib/email.ts` (created in Story 12.0)

The email utility already accepts `senderName` parameter and resolves from-address. No changes needed to the utility itself — just ensure all callers pass the sender name.

**Verification:** Check that all email sends in the codebase pass `senderName`:

1. `POST /api/subscribers` (confirmation email) — already passes `waitlist.sender_name`
2. `POST /api/subscribers` (moved-up email) — already passes `waitlist.sender_name`
3. `src/lib/milestones.ts` (milestone emails) — need to verify it passes `sender_name`
4. `POST /api/dashboard/broadcast` (broadcast emails) — already passes `waitlist.sender_name`

**If `milestones.ts` doesn't pass sender_name:**

```typescript
// In milestones.ts, update the sendEmail call:
await sendEmail({
  to: subscriber.email,
  subject,
  html,
  stream: "transactional",
  senderName: waitlist.sender_name, // Add this line
  productName: waitlist.product_name,
  headline: waitlist.headline,
});
```

### T3: DB storage + fallback chain

**AC5:** Save to `waitlists.sender_name` (nullable text column, created in Story 11.7).

**AC6:** Fallback chain (already implemented in `src/lib/email.ts`):

```typescript
senderName?.trim() || productName?.trim() || headline?.trim() || "PreWaitlist";
```

**PATCH endpoint:** The existing `PATCH /api/waitlist` route already handles arbitrary field updates. Just pass `{ sender_name: value }` in the request body.

### T4: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any TypeScript errors

## Verification

1. Modify `src/app/dashboard/settings/client.tsx` — add Email section with sender name field
2. As Pro founder, navigate to Settings → verify "Email Settings" section appears
3. Verify sender name field shows current value (or placeholder if null)
4. Change sender name to "Acme Team" → click Save
5. Verify `waitlists.sender_name` column is updated to "Acme Team"
6. Sign up a new subscriber → verify confirmation email shows "Acme Team <notifications@prewaitlist.com>"
7. Send a broadcast → verify broadcast email shows "Acme Team <updates@prewaitlist.com>"
8. Clear sender name (set to empty) → verify fallback to `product_name`
9. Clear `product_name` too → verify fallback to `headline`
10. Clear `headline` too → verify fallback to "PreWaitlist"
11. Run `pnpm lint` and `pnpm build` — verify zero errors

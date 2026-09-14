# Story 12.2.9 — Physical Address in Emails

**Epic:** 12.2 — Gap Fixes
**Status:** ready
**Depends on:** —
**Design Refs:** —

## Story

As a founder, I need a physical postal address in my emails so that they comply with CAN-SPAM requirements.

## Acceptance Criteria (EARS)

- AC1: Every email sent through the system shall include a physical postal address in the footer: the founder's business address if provided, or PreWaitlist's registered address as fallback.
- AC2: The settings page shall include a "Business Address" field where founders can enter their physical postal address.
- AC3: The address field shall be optional — if not provided, PreWaitlist's address is used as fallback.
- AC4: The email footer template shall render the address in a standard format: `{address_line_1}, {city}, {state} {zip}, {country}`.
- AC5: Lint and build shall pass with zero errors.

## Tasks

T1 (AC2) Settings address field · T2 (AC1) Schema column + API · T3 (AC3-AC4) Email footer template with address · T4 (AC5) Lint + build

## Out of Scope

Address validation, multiple addresses, address verification.

## Implementation Details

### T1: Settings address field

- **File to modify:** `src/app/dashboard/settings/client.tsx`

Add a "Business Address" field in the settings page:

```typescript
const [businessAddressValue, setBusinessAddressValue] = useState(
  businessAddress ?? ""
);
const [businessAddressSaved, setBusinessAddressSaved] = useState(false);
const [businessAddressSaving, setBusinessAddressSaving] = useState(false);
const [businessAddressError, setBusinessAddressError] = useState<string | null>(
  null
);

async function handleSaveBusinessAddress() {
  setBusinessAddressSaving(true);
  setBusinessAddressError(null);
  try {
    const res = await fetch("/api/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: waitlistId,
        business_address: businessAddressValue || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setBusinessAddressError(data.error || "Failed to save");
      return;
    }
    setBusinessAddressSaved(true);
    setTimeout(() => setBusinessAddressSaved(false), 3000);
  } catch {
    setBusinessAddressError("Network error — please try again");
  } finally {
    setBusinessAddressSaving(false);
  }
}
```

Render in the settings page:

```tsx
<div>
  <label className="text-label text-foreground">Business Address</label>
  <p className="mb-1 text-xs text-muted-foreground">
    Required for CAN-SPAM compliance. Shown in email footers.
  </p>
  <div className="flex gap-2">
    <input
      value={businessAddressValue}
      onChange={(e) => setBusinessAddressValue(e.target.value)}
      placeholder="123 Main St, City, State 12345, Country"
      className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-body-sm text-foreground"
    />
    <button
      onClick={handleSaveBusinessAddress}
      disabled={businessAddressSaving}
      className="rounded-lg bg-accent px-4 py-2 text-body-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
    >
      {businessAddressSaving
        ? "Saving..."
        : businessAddressSaved
          ? "Saved!"
          : "Save"}
    </button>
  </div>
  {businessAddressError && (
    <p className="mt-1 text-xs text-destructive">{businessAddressError}</p>
  )}
</div>
```

### T2: Schema column + API

The `business_address` column was already added in Story 12.2.0 (schema migration). Verify it exists:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'waitlists' AND column_name = 'business_address';
```

The API endpoint `PATCH /api/waitlist` already handles arbitrary field updates. Add `business_address` to the allowed fields list if there's a whitelist.

### T3: Email footer template with address

- **File to modify:** `src/lib/email.ts`

Add `businessAddress` parameter to the email sending function:

```typescript
interface SendEmailOptions {
  // ... existing options
  businessAddress?: string;
}

const DEFAULT_ADDRESS =
  "PreWaitlist Inc., 123 Placeholder Ave, San Francisco, CA 94105, USA";

// In the email HTML template:
const footerHtml = `
  <hr style="border: none; border-top: 1px solid #ccc9c3; margin: 32px 0;" />
  <p style="font-size: 12px; color: #6b6459; margin: 0 0 8px;">
    ${businessAddress || DEFAULT_ADDRESS}
  </p>
  <p style="font-size: 12px; color: #6b6459; margin: 0;">
    <a href="${unsubscribeUrl}" style="color: #6b6459;">Unsubscribe</a>
  </p>
`;
```

Ensure every caller of `sendEmail` passes the `businessAddress` from the waitlist data.

### T4: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Settings page shows "Business Address" input with placeholder
2. Save address → "Saved!" confirmation
3. Send email → footer shows saved address
4. No address saved → footer shows PreWaitlist fallback address
5. `pnpm lint` and `pnpm build` pass with zero errors

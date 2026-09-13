# Story 12.2.5 — Consent Tracking

**Epic:** 12.2 — Gap Fixes
**Status:** ready
**Depends on:** 12.2.0
**Design Refs:** —

## Story

As a founder, I need subscriber consent to be tracked at signup for GDPR compliance.

## Acceptance Criteria (EARS)

- AC1: The public waitlist email capture form shall include a checkbox: "I agree to receive email updates about this product. You can unsubscribe at any time."
- AC2: The checkbox shall be unchecked by default.
- AC3: The checkbox shall be required — the form cannot be submitted without checking it.
- AC4: On form submission, if consent is given, the system shall set `consent_given_at` to the current timestamp and `consent_ip_address` to the subscriber's IP.
- AC5: The IP address shall be captured from `x-forwarded-for` or `x-real-ip` headers (for Vercel/production) or from the request in development.
- AC6: If consent is not given (checkbox unchecked), the form shall show an inline error: "You must agree to receive emails to join the waitlist."
- AC7: The consent checkbox shall be styled with the design system — use native `<input type="checkbox">` with `accent-color: var(--color-accent)`.
- AC8: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC3) Consent checkbox in email capture form · T2 (AC4-AC5) API consent fields + IP capture · T3 (AC6) Validation error · T4 (AC7) Styling · T5 (AC8) Lint + build

## Out of Scope

Consent withdrawal UI (unsubscribe link in emails covers this), consent audit log, consent for founders (separate from subscriber consent).

## Implementation Details

### T1: Consent checkbox in email capture form

- **File to modify:** `components/public/email-capture-form.tsx` (or wherever the public signup form lives)

Add consent state and checkbox:

```typescript
const [consent, setConsent] = useState(false);
const [consentError, setConsentError] = useState(false);
```

Add checkbox below the email input:

```tsx
<div className="mt-3">
  <label className="flex items-start gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={consent}
      onChange={(e) => {
        setConsent(e.target.checked);
        setConsentError(false);
      }}
      className="mt-1 h-4 w-4 rounded border-border accent-[var(--color-accent)]"
    />
    <span className="text-xs text-muted-foreground">
      I agree to receive email updates about this product. You can unsubscribe
      at any time.
    </span>
  </label>
  {consentError && (
    <p className="mt-1 text-xs text-destructive">
      You must agree to receive emails to join the waitlist.
    </p>
  )}
</div>
```

### T2: API consent fields + IP capture

- **File to modify:** `src/app/api/subscribers/route.ts`

Add consent fields to the POST handler:

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, waitlist_id, referral_code, consent } = body;

  // Validate consent (AC3, AC6)
  if (!consent) {
    return NextResponse.json(
      { error: "Consent is required to join the waitlist" },
      { status: 400 }
    );
  }

  // Capture IP (AC5)
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]
    || req.headers.get("x-real-ip")
    || "unknown";

  // Insert with consent fields
  const { data, error } = await supabase.from("subscribers").insert({
    email,
    waitlist_id,
    referral_code: incomingRefCode || null,
    consent_given_at: new Date().toISOString(),
    consent_ip_address: ipAddress,
  }).select(SUBSCRIBER_SELECT).single();
```

### T3: Validation error

- **Client-side:** If checkbox unchecked on submit, prevent submission and show error (covered in T1).
- **Server-side:** API rejects with 400 if `consent` is not `true` (covered in T2).

### T4: Styling

The native checkbox with `accent-color: var(--color-accent)` is accessible by default. The `accent-[var(--color-accent)]` Tailwind class applies the brand green color to the checkbox checkmark.

### T5: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Public waitlist page: email form shows consent checkbox below email input
2. Checkbox is unchecked by default
3. Submit without checking → inline error: "You must agree to receive emails to join the waitlist"
4. Check checkbox → submit → subscriber created with `consent_given_at` and `consent_ip_address` set
5. API rejects signup without consent (400 error)
6. Checkbox has green accent color when checked
7. `pnpm lint` and `pnpm build` pass with zero errors

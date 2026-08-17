---
id: epic7.story04
epic: epic-7-public-waitlist-page
title: Duplicate Email Handling
status: done
depends_on: [epic7.story00]
updated: 2026-08-17
---

# Story 7.4 — Duplicate Email Handling

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As a visitor, I want to see a clear error if I try to sign up with an email that's already on the waitlist, so that I know I'm already signed up.

## Acceptance Criteria (EARS)

- AC1: The system shall check for an existing subscriber with the same `email` on the same `waitlist_id` before creating a new subscriber, enforced by the unique index on `(waitlist_id, email)`.
- AC2: If a duplicate email is detected, the `POST /api/subscribers` route shall return a 409 Conflict response with `{ error: "This email is already on the waitlist" }`.
- AC3: The error message shall not reveal whether the email belongs to a specific account (security — generic message only).
- AC4: The `EmailCaptureForm` component shall display the 409 error message inline below the email field, using the design system's error styling (`text-error` class).
- AC5: The error message shall clear when the user modifies the email input.
- AC6: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC3): Server-side duplicate detection and 409 response
- T2 (AC4-AC5): Client-side error display and clear-on-edit
- T3 (AC6): Lint + build verification

## Out of scope

Password reset flows (not applicable — email-only signup), account merging (not applicable), rate limiting on signup attempts (future concern).

## Dev Notes

### T1 — Server-Side Duplicate Detection

The unique index `subscribers_waitlist_email_idx` on `(waitlist_id, email)` is the primary guard. The POST route catches the Supabase unique violation error.

**In `src/app/api/subscribers/route.ts`:**

```ts
const { data, error } = await supabase
  .from("subscribers")
  .insert({
    waitlist_id,
    email,
    referral_code: generateReferralCode(),
    position,
    referrer_id: referrerId || null,
    qual_answers: qualAnswers || null,
  })
  .select("id, email, referral_code, position")
  .single();

if (error) {
  // Check for unique violation (PostgreSQL error code 23505)
  if (
    error.code === "23505" &&
    error.message.includes("subscribers_waitlist_email_idx")
  ) {
    return NextResponse.json(
      { error: "This email is already on the waitlist" },
      { status: 409 }
    );
  }
  console.error("Subscriber creation error:", error);
  return NextResponse.json(
    { error: error.message, details: error.details, hint: error.hint },
    { status: 400 }
  );
}
```

**Error code reference:**

- `23505` = unique_violation in PostgreSQL
- The error message will contain the index name `subscribers_waitlist_email_idx`

**Security:** The response message is generic — it does not say "this email is already registered" or "this email exists". It says "This email is already on the waitlist" which is neutral and doesn't leak account information.

### T2 — Client-Side Error Display

**In `components/public/email-capture-form.tsx`:**

```ts
// State
const [error, setError] = useState<string | null>(null);

// In handleSubmit:
if (res.status === 409) {
  setError(data.error); // "This email is already on the waitlist"
  return;
}

// Clear error on input change:
const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setEmail(e.target.value);
  if (error) setError(null);
};
```

**Error rendering:**

```tsx
{
  error && (
    <p className="text-xs text-error mt-1" role="alert">
      {error}
    </p>
  );
}
```

If using the `Input` component, pass `error={error}` to leverage its built-in error styling:

```tsx
<Input
  type="email"
  error={error}
  value={email}
  onChange={handleEmailChange}
  // ...
/>
```

### T3 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files modified:**

- `src/app/api/subscribers/route.ts` (add error code handling)
- `components/public/email-capture-form.tsx` (add error state + clear-on-edit)

**Available components:** `Input` ✓ (with `error` prop), `Button` ✓

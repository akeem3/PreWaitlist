---
id: epic7.story02
epic: epic-7-public-waitlist-page
title: Email Capture Form
status: ready
depends_on: [epic7.story00]
updated: 2026-08-17
---

# Story 7.2 — Email Capture Form

**Status:** ready
**Design Refs:** — (no high-fidelity SVG for email capture yet)

**Story:** As a visitor, I want to enter my email address on the public waitlist page so that I can join the waitlist.

## Acceptance Criteria (EARS)

- AC1: The system shall render an email input field with `type="email"`, `placeholder="Email address"`, and the founder's `cta_text` as the submit button label.
- AC2: The system shall validate email format client-side before submission using the regex `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`.
- AC3: The system shall display a validation error message below the email field when the format is invalid, using the design system's error styling (`text-error` color, `border-error` border).
- AC4: The system shall submit the email to `POST /api/subscribers` on form submit via `fetch()`.
- AC5: The system shall pass `waitlist_id` and optionally `referrer_id` (from URL `?ref=` query param) in the POST body.
- AC6: The system shall display a loading state (disabled input + button, spinner icon) while the submission is in progress.
- AC7: The system shall redirect to `/:subdomain/thank-you?subscriber_id={id}&referral_code={code}` on successful submission.
- AC8: The system shall display the error message inline below the email field when the API returns 409 (duplicate email), using the message `"This email is already on the waitlist"`.
- AC9: The system shall display a generic error message `"Something went wrong. Please try again."` on other API errors.
- AC10: The form shall be keyboard-accessible — Enter key submits the form.
- AC11: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC3): Email input component with client-side validation
- T2 (AC4-AC5): Form submission to POST /api/subscribers
- T3 (AC6): Loading state handling
- T4 (AC7): Thank-you redirect on success
- T5 (AC8-AC9): Error display (duplicate + generic)
- T6 (AC10): Keyboard accessibility
- T7 (AC11): Lint + build verification

## Out of scope

Qualification questions (Story 7.3), duplicate email server-side handling (Story 7.4 — this story only handles the client-side display), share buttons (Epic 8), referral tracking (Epic 8).

## Dev Notes

### T1 — Email Input Component

Create `components/public/email-capture-form.tsx` as a **client component** (`"use client"`).

**Props interface:**

```ts
interface EmailCaptureFormProps {
  waitlistId: string;
  subdomain: string;
  ctaText: string;
  brandColor: string;
  template: "minimal" | "bold" | "dark";
}
```

**Use existing `Input` component** from `components/ui/input.tsx`:

```tsx
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";

<Input
  type="email"
  label="Email"
  placeholder="Email address"
  error={emailError}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>;
```

**Styling per template** (match `live-preview.tsx` inline styles but use Tailwind tokens):

- **Minimal:** `border-border`, `bg-card`, `text-foreground`
- **Bold:** `border-foreground`, `bg-card`, `text-foreground`, `text-base`
- **Dark:** `border-dark-template-border`, `bg-dark-template-input`, `text-dark-template-foreground`

**Brand color on button:** Use inline `style={{ backgroundColor: brandColor }}` — this is the one exception for dynamic colors not in the design system (the founder's custom brand color).

### T2 — Form Submission

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // validate email first
  if (!isValidEmail(email)) {
    setEmailError("Please enter a valid email address");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const res = await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        waitlist_id: waitlistId,
        email: email.trim().toLowerCase(),
        referrer_id: referrerId, // from URL ?ref= param
      }),
    });

    const data = await res.json();

    if (res.status === 409) {
      setError("This email is already on the waitlist");
      return;
    }

    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      return;
    }

    // Success — redirect to thank-you
    router.push(
      `/${subdomain}/thank-you?subscriber_id=${data.id}&referral_code=${data.referral_code}`
    );
  } catch {
    setError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};
```

**Extract `referrer_id` from URL:**

```ts
"use client";
import { useSearchParams } from "next/navigation";

const searchParams = useSearchParams();
const referrerId = searchParams.get("ref");
```

### T3 — Loading State

```tsx
<Button
  type="submit"
  disabled={loading}
  style={{ backgroundColor: brandColor }}
>
  {loading ? (
    <span className="flex items-center gap-2">
      <Spinner className="h-4 w-4" />
      Joining...
    </span>
  ) : (
    ctaText || "Join Waitlist"
  )}
</Button>
```

Use `Spinner` from `components/ui/spinner.tsx`. Disable the input and button during loading.

### T4 — Thank-You Redirect

Use Next.js `useRouter`:

```ts
import { useRouter } from "next/navigation";
const router = useRouter();
router.push(
  `/${subdomain}/thank-you?subscriber_id=${data.id}&referral_code=${data.referral_code}`
);
```

The thank-you page route (`/:subdomain/thank-you`) will be built in Epic 8. For now, the redirect target won't render content, but the URL will be correct.

### T5 — Error Display

```tsx
{
  error && (
    <p className="text-xs text-error" role="alert">
      {error}
    </p>
  );
}
```

The `Input` component already supports an `error` prop for validation errors. For API errors, render a separate error element below the form.

### T6 — Keyboard Accessibility

The `<form>` element with `onSubmit` naturally handles Enter key. Ensure:

- The input has a proper `id` and the label is associated via `htmlFor`
- The button has `type="submit"`
- Focus management: after error, keep focus on the input

### T7 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files created:**

- `components/public/email-capture-form.tsx`

**Files modified:**

- `src/app/(public)/[subdomain]/page.tsx` (import and render EmailCaptureForm)

**Available components:** `Input` ✓ (with `error` prop), `Button` ✓ (variants: primary, secondary, destructive, ghost), `Spinner` ✓, `PoweredByFooter` ✓
**Available utilities:** `cn()` ✓, `createClient()` ✓
**Router:** `useRouter` from `next/navigation`
**Search params:** `useSearchParams` from `next/navigation`

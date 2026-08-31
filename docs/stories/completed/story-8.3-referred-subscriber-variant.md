---
id: epic8.story03
epic: epic-8-thank-you-referral-loop
title: Referred Subscriber Variant
status: ready
depends_on: [epic8.story00, epic8.story02]
updated: 2026-08-17
---

# Story 8.3 — Referred Subscriber Variant

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/thank_you_referred_HF2.svg`

**Story:** As a visitor who was referred by a friend, I want to see a personalized thank-you page that acknowledges the referrer so that I feel connected to the community.

## Design Specs (from SVG analysis)

- **Referred variant heading:** "Referred by a friend" (`text-body-lg`, `text-accent`, `font-semibold`)
- **Referrer name:** Displayed below the heading in `text-body-sm text-muted-foreground`
- **Same layout as direct variant:** position display, referral link, share buttons
- **Referrer attribution:** Uses the referrer's email (anonymized) or display name

## Acceptance Criteria (EARS)

- AC1: The thank-you page shall detect when a subscriber was referred by checking `referrer_id` on the subscriber record.
- AC2: When `referrer_id` is present, the system shall fetch the referrer's `email` from the `subscribers` table.
- AC3: The system shall display "Referred by a friend" as a heading in the accent color when the subscriber was referred.
- AC4: The system shall display the referrer's anonymized email (first char + `"••••"` + last char) below the heading.
- AC5: When `referrer_id` is null, the system shall NOT display the "Referred by a friend" section.
- AC6: The rest of the thank-you page (position, referral link, share buttons) shall render identically for both variants.
- AC7: The `?ref=` query param on the public waitlist page shall be used as the `referrer_id` when creating a subscriber (already handled by Story 7.2).
- AC8: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC5): Referred variant detection + referrer display
- T2 (AC6): Verify both variants render consistently
- T3 (AC7): Verify ref param flow end-to-end
- T4 (AC8): Lint + build verification

## Out of scope

Milestone fulfillment (handled by `src/lib/milestones.ts` in Story 7.6 — platform tracks + notifies, founder delivers; milestone progress displayed on public waitlist page, not thank-you page), referrer notification emails (Epic 11), referral analytics (Sprint 3).

## Dev Notes

### T1 — Referred Variant Detection + Display

This is mostly implemented in Story 8.0 T2. This story verifies and completes the referred variant.

**In `src/app/(public)/[subdomain]/thank-you/page.tsx`:**

```ts
// Fetch referrer if exists
let referrerEmail: string | null = null;
if (subscriber.referrer_id) {
  const { data: referrer } = await supabase
    .from("subscribers")
    .select("email")
    .eq("id", subscriber.referrer_id)
    .single();
  referrerEmail = referrer?.email || null;
}

const isReferred = !!subscriber.referrer_id && !!referrerEmail;
```

**Rendering:**

```tsx
{
  isReferred && (
    <div className="text-center mb-4">
      <p className="text-body-lg text-accent font-semibold">
        Referred by a friend
      </p>
      <p className="text-body-sm text-muted-foreground mt-1">
        {anonymizeEmail(referrerEmail!)} invited you to join
      </p>
    </div>
  );
}
```

**Email anonymization function:**

```ts
function anonymizeEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}••••@${domain}`;
  return `${local[0]}••••${local[local.length - 1]}@${domain}`;
}
```

### T2 — Verify Both Variants

Test both paths:

1. **Direct signup** (no `?ref=` param): `referrer_id` is null → no "Referred by" section
2. **Referred signup** (`?ref={referral_code}`): `referrer_id` is set → "Referred by a friend" section visible

### T3 — End-to-End Ref Param Flow

Verify the complete flow:

1. Visitor lands on `/:subdomain?ref={referrer_code}`
2. `EmailCaptureForm` extracts `ref` from URL as `referrer_id`
3. `POST /api/subscribers` receives `referrer_id`
4. Subscriber is created with `referrer_id` stored
5. Thank-you page reads `referrer_id` and displays referrer

**Note:** The `?ref=` param contains a `referral_code` (8-char string), but the API expects `referrer_id` (uuid). The API needs to look up the subscriber by `referral_code` to get the `referrer_id`.

**Update Story 7.2 (EmailCaptureForm):**

```ts
// Extract ref from URL — this is a referral_code, not a uuid
const referralCode = searchParams.get("ref");

// In handleSubmit, look up referrer by referral_code
// Option 1: Pass referral_code to API and let API resolve
// Option 2: Look up referrer_id client-side before submit
```

**Recommended:** Pass `referral_code` (not `referrer_id`) to the API, and let the API resolve the uuid. Update the POST /api/subscribers to accept `referral_code` instead of `referrer_id`.

### T4 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files modified:**

- `src/app/(public)/[subdomain]/thank-you/page.tsx` (verify referred variant)
- `src/app/api/subscribers/route.ts` (add referral_code resolution)
- `components/public/email-capture-form.tsx` (pass referral_code)

**Available utilities:** `cn()` ✓, `createClient()` ✓

# Story 18.1 — Consent swap: checkbox → approved click-through line

**Status:** done
**Epic:** 18 — Live Waitlist Page Redesign (Bare-Minimum Contract)
**Depends on:** —
**Design Refs:** — (form + API; no SVG)
**Source:** [Epic 18 W3/W8](../epics/epic-18-live-waitlist-page-redesign.md), [PRD L169-170 + L182 consent checkbox](../PRD.md) (amended by W3), [Epic 12.2.6 consent tracking](../epics/completed/epic-12.2-gap-fixes.md), [components/public/email-capture-form.tsx](../../components/public/email-capture-form.tsx), [src/app/api/subscribers/route.ts](../../src/app/api/subscribers/route.ts), web research: FTC proposed rule (checkbox not required for CAN-SPAM), Litmus/DigiWell GDPR–CAN-SPAM–CASL stacking, founder-approved wording 2026-09-30

## Story

As a subscriber, I want to join with a single approved click-through consent line instead of a checkbox — so signup stays frictionless while consent provenance is still recorded.

## Acceptance Criteria (EARS)

- AC1: The email capture form shall not render a consent checkbox or consent validation state. In its place it shall render, in both layout variants, the verbatim string **"By joining, you agree to receive emails and accept our Terms and Privacy Policy."** where "Terms" links to `/legal/terms` and "Privacy Policy" links to `/legal/privacy`. Styling shall use existing text/link tokens and be dark-template aware.
- AC2: The client shall no longer block submission when consent is absent and shall no longer require a `consent: true` field in the POST body.
- AC3: `POST /api/subscribers` shall accept signups without a consent flag (the current 400 on missing consent shall be removed) and shall continue to stamp `consent_given_at` and `consent_ip_address` exactly as today.
- AC4: The onboarding preview's consent mock (`PreviewConsent`) shall render the same approved sentence (shared string source), with no checkbox.
- AC5: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) approved sentence + links replacing checkbox in both form variants
- T2 (AC2) client validation/state removal
- T3 (AC3) API consent-400 removal, stamping preserved
- T4 (AC4) preview consent mock swap
- T5 (AC5) lint + build

## Out of Scope

- Renderer layout (18.0 owns section order/scale)
- Trust-line parity in preview (18.2 — this story only swaps the consent mock's internals)
- PRD / Epic 12.2.6 doc amendments (18.5)
- `consent_records` table from PRD L169 (never built; not in this epic)
- Unsubscribe/bounce send-time checks (unchanged)
- Any wording other than the W3-approved sentence (W8)

## Dev Notes

**Verified against current code (all line refs confirmed):**

| Location                   | Lines     | Current state                                                                                                                                                     |
| -------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `email-capture-form.tsx`   | 451 L     | Primary client file                                                                                                                                               |
| `:53-54`                   |           | `consent` / `consentError` state                                                                                                                                  |
| `:96-99`                   |           | Hard block: `if (!consent) { setConsentError(true); return; }`                                                                                                    |
| `:113`                     |           | Payload `consent: true`                                                                                                                                           |
| `:176-205`                 |           | `consentBlock` — checkbox + old text ("I agree to receive email updates about this product. You can unsubscribe at any time." `:195-196`) + error copy `:199-203` |
| `:374` / `:432`            |           | `consentBlock` render sites (variant 1 questions / variant 2 email-only)                                                                                          |
| `:391-395` / `:434-438`    |           | "No spam. Unsubscribe anytime." trust lines — **keep untouched** (18.2 extracts to shared module)                                                                 |
| `api/subscribers/route.ts` | 1218 L    | Primary API file                                                                                                                                                  |
| `:435`                     |           | `consent,` in body destructure                                                                                                                                    |
| `:462-469`                 |           | **The 400 guard to remove:** `if (consent !== true) return 400 "Consent is required to join the waitlist"` (Phase 6.4)                                            |
| `:471-474`                 |           | `ipAddress` resolution (`x-forwarded-for` → `x-real-ip` → `"unknown"`)                                                                                            |
| `:653-654`                 |           | **Stamping to preserve:** `consent_given_at: new Date().toISOString()`, `consent_ip_address: ipAddress`                                                           |
| `live-preview.tsx`         | `:84-112` | `PreviewConsent` mock — checkbox `:94-99`, old copy `:106-107`                                                                                                    |
| `:186` / `:308`            |           | `PreviewConsent` call sites (PreviewEmailForm `mt-3`, PreviewQuestionForm no className)                                                                           |

### T1 — shared consent-line component (AC1)

**New file** `components/public/consent-line.tsx` — single source for the approved sentence (W8: never duplicate the literal):

```tsx
import Link from "next/link";
import { cn } from "../lib/cn";

export function ConsentLine({
  isDark,
  className,
}: {
  isDark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-xs",
        className,
        isDark ? "text-dark-template-muted" : "text-muted-foreground"
      )}
    >
      By joining, you agree to receive emails and accept our{" "}
      <Link
        href="/legal/terms"
        className={`underline ${isDark ? "hover:text-dark-template-text" : "hover:text-foreground"}`}
      >
        Terms
      </Link>{" "}
      and{" "}
      <Link
        href="/legal/privacy"
        className={`underline ${isDark ? "hover:text-dark-template-text" : "hover:text-foreground"}`}
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}
```

- Sentence is **verbatim W3** — punctuation included; do not reflow, paraphrase, or add commas.
- Link markup mirrors the existing signup pattern (`src/app/(auth)/signup/page.tsx:279-291`, `underline` + hover) but hover uses utility class names per MEMORY (`@theme inline` colors don't create `var()` custom properties — never `hover:text-[var(--color-foreground)]` in new code).
- Text classes mirror the current consent text (`:190-193`): `text-xs` + dark-aware muted color.
- Replace `consentBlock` definition (`:176-205`) with `<ConsentLine isDark={isDark} className="mt-3" />` — render sites `:374`/`:432` stay as-is (both variants covered).
- Placement: where the checkbox sits today (variant 1: before submit button; variant 2: after input row) — **above the trust line; do not merge the two** (both remain visible).

### T2 — client validation/state removal (AC2)

In `components/public/email-capture-form.tsx`:

1. Delete state `:53-54` (`consent`, `consentError`).
2. Delete guard `:96-99`.
3. Delete payload key `consent: true` (`:113`) — body keeps `waitlist_id`, `email`, `website`, `ts` (+ optional `referral_code`/`qual_answers`/`display_name`).
4. Delete `consentBlock` checkbox markup with T1's replacement (error `<p role="alert">` at `:199-203` goes with it — it is checkbox-scoped, sanctioned by AC1).
5. `consentBlock` variable name may stay (now renders `<ConsentLine />`) or be inlined — either is fine; no other references exist.

Result: submit flow = email validation → honeypot → timing (`ts`) → POST. No consent state anywhere in the client.

### T3 — API guard removal, stamping preserved (AC3)

In `src/app/api/subscribers/route.ts`:

1. **Remove** the guard block `:462-469` (400 on `consent !== true`) and its Phase 6.4 comment.
2. **Remove** `consent,` from the body destructure (`:435`) — leaving it would risk an unused-var lint error and implies the route still reads the flag. (An incoming `consent` field in any body is simply ignored.)
3. **Keep unchanged:** `ipAddress` resolution (`:471-474`) and insert stamping `:653-654` — AC3 requires provenance stamping **exactly as today** for every signup regardless of a consent flag.
4. Update the comment where the guard was to state the W3 contract: click-through sentence is shown client-side; server stamps provenance unconditionally (GDPR/CASL records).

Validation order after this change: required fields → honeypot → ≥2s timing → email format → display_name cap → rate limit → tier → referral → qual → cap claim → insert (existing order; the consent step simply disappears).

### T4 — preview mock swap (AC4)

In `components/onboarding/live-preview.tsx`, `PreviewConsent` (`:84-112`):

- Keep the component + both call sites (`:186`, `:308`) — replace its **internals** with `<ConsentLine isDark={isDark} className={className} />`.
- The current checkbox `<input readOnly tabIndex={-1}>` and old string at `:106-107` are removed (AC4: no checkbox).
- The duplicate consent literal in `live-preview.tsx:106` vs `email-capture-form.tsx:195` **must be gone** — both consumers now import from `components/public/consent-line.tsx` (18.2 AC3 locks this; land the shared source here).

### T5 — lint + build (AC5)

```bash
pnpm lint
pnpm build   # delete .next first
```

**Tests expected to break now — update in 18.5 (do not skip):**

| File                                                   | Line    | Expectation                                                                                                |
| ------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------- |
| `src/__tests__/components/email-capture-form.test.tsx` | `:340`  | "blocks submit and shows the consent error when unchecked (12.2.6 AC6)" → invert: submits without checkbox |
| `src/__tests__/components/email-capture-form.test.tsx` | `:359`  | "clears the consent error once the checkbox is checked" → delete/replace with approved-sentence assertions |
| `src/__tests__/api/subscribers.test.ts`                | `:452`  | "rejects signup without consent (12.2.6 AC3)" → invert: accepts consent-less body + asserts stamping       |
| `src/__tests__/api/subscriber-cap.test.ts`             | `:66`   | `consent: true` in body — harmless (ignored) but remove for clarity                                        |
| `src/__tests__/api/subscribers-referral.test.ts`       | 7 sites | same as above                                                                                              |

## Files to Create/Modify

| File                                       | Change                                                                |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `components/public/consent-line.tsx`       | **New** — `ConsentLine` shared component (T1)                         |
| `components/public/email-capture-form.tsx` | State/guard/payload removal + `consentBlock` swap (T1, T2)            |
| `src/app/api/subscribers/route.ts`         | Remove `:462-469` guard + `:435` destructure; stamping untouched (T3) |
| `components/onboarding/live-preview.tsx`   | `PreviewConsent` internals → `ConsentLine` (T4)                       |

## Risk

- **Stamping regression is the #1 risk:** removing the guard must not touch `:653-654`. 18.5 asserts `consent_given_at` + `consent_ip_address` on a consent-less POST — write that test first if in doubt.
- **Unused-var lint:** forgetting to drop `consent,` from `:435` may fail `pnpm lint` (or silently keep the flag "read"). Remove it.
- **Both variants:** `consentBlock` renders at two sites — replacing the definition covers both; visually verify questions + email-only layouts.
- **Dark template:** `ConsentLine` must be dark-aware (`text-dark-template-muted`, dark hover) — check dark template in preview.
- Don't touch the trust lines (`:391-395`/`:434-438`) — 18.2 extracts them; leaving them inline here keeps this story's diff minimal.

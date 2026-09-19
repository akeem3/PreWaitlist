# Story 13.5 — Sender Domain Authentication Walkthrough

**Status:** ready
**Epic:** 13 — Billing & Feature Gating

## Story

As a Pro founder, I want a step-by-step walkthrough to set up my own sending domain (SPF/DKIM) so that my emails have better deliverability.

## Acceptance Criteria (EARS)

- AC1: The dashboard Settings page shall include a "Domain Authentication" section visible only to Pro founders.
- AC2: The section shall show a 3-step wizard: (1) Add domain in Resend, (2) Copy DNS records, (3) Verify.
- AC3: Step 1 shall display the DNS records Resend provides (MX, TXT SPF, TXT DKIM) with copy-to-clipboard buttons.
- AC4: Step 2 shall guide the founder to add records to their DNS provider with plain-language instructions.
- AC5: Step 3 shall have a "Verify" button that checks DNS propagation via Resend's API (`resend.domains.verify()`).
- AC6: On successful verification, the system shall update `waitlists.sending_domain` to the verified domain.
- AC7: The section shall show current status: unverified, pending, verified.
- AC8: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Settings UI with wizard
T2 (AC3-AC4) DNS record display + copy
T3 (AC5-AC6) Verify + Resend API
T4 (AC7) Status display
T5 (AC8) Lint + build

## Dev Notes

- Resend domain verification: `resend.domains.create({ name })` returns DNS records, `resend.domains.verify({ id })` checks status.
- DNS records: MX (feedback-smtp), TXT SPF (v=spf1 include:amazonses.com ~all), TXT DKIM (resend._domainkey).
- DMARC: guide founder to add `_dmarc` TXT record on root domain.
- Store verified domain in `waitlists.sending_domain` column (exists from Story 11.7).
- When `sending_domain` is set, `resolveFromAddress()` in `src/lib/email.ts` uses it (already wired in Story 12.6).
- The existing `src/app/api/waitlist/verify-domain/route.ts` is a stub — replace with real implementation.
- Simple 3-step wizard, not complex DNS management. Copy buttons are critical.

## Files to Modify

- `src/app/dashboard/settings/waitlist-settings-page.tsx` — add Domain Authentication section
- `src/app/api/waitlist/verify-domain/route.ts` — replace stub with real Resend API calls
- `src/lib/resend.ts` — add domain management methods

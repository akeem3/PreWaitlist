# Story 13.4 — Pro-Tier Subscriber Limits (500 Cap)

**Status:** ready
**Epic:** 13 — Billing & Feature Gating

## Story

As a system, I want to enforce the 500 subscriber cap on Free tier so that Free founders are prompted to upgrade when they hit the limit.

## Acceptance Criteria (EARS)

- AC1: The system shall check `waitlists.subscriber_count` before creating a new subscriber via `POST /api/subscribers`.
- AC2: If the waitlist is on Free tier and `subscriber_count >= 500`, the API shall return HTTP 403 with `{ error: "Subscriber limit reached. Upgrade to Pro for unlimited signups." }`.
- AC3: The public waitlist page shall show a message when the cap is reached: "This waitlist has reached its subscriber limit. Please check back later."
- AC4: Pro tier waitlists shall have no subscriber cap.
- AC5: The system shall show progressive warnings: at 400 signups (80%) a subtle note, at 480 (96%) an orange warning, at 500 a red block with upgrade modal.
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) API cap check
T2 (AC3) Public page cap message
T3 (AC4) Pro bypass
T4 (AC5) Progressive warnings
T5 (AC6) Lint + build

## Dev Notes

- Depends on Story 12.4.1 which wires the `subscriber_count` increment. Without that, this check is dead code.
- Add cap check at top of POST /api/subscribers handler, before position calculation.
- Query tier: join waitlists with founder_profiles.
- Public page (`[subdomain]/page.tsx`) needs to check count before rendering email capture form.
- Progressive warnings: at 80% show info bar, at 96% show warning bar with upgrade CTA, at 100% block signup form and show upgrade modal.

## Files to Modify

- `src/app/api/subscribers/route.ts` — add cap check
- `src/app/(public)/[subdomain]/page.tsx` — add cap message
- `components/dashboard/upgrade-modal.tsx` — trigger at cap (Story 13.1)

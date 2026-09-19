# Story 12.4.5 — Account Security & GDPR Compliance

**Status:** ready
**Epic:** 12.4 — Pre-Epic 13 Gaps

## Story

As a founder, I want to manage my account security (change password, change email) and exercise my GDPR rights (export data, delete account) so that I have full control over my identity and data.

## Acceptance Criteria (EARS)

- AC1: The Security tab shall include a "Change Password" section with current password + new password + confirm password fields. On submit, the system shall call Supabase `updateUser({ password })` and show success/error feedback.
- AC2: The Security tab shall include a "Change Email" section showing the current email (read-only) and an input for the new email. On submit, the system shall call Supabase `updateUser({ email })` which sends a confirmation link to the new email.
- AC3: The Settings page shall include a "Danger Zone" section (visually separated, red accent) with two actions: "Export My Data" and "Delete Account".
- AC4: "Export My Data" shall generate a JSON file containing the founder's profile, all waitlists, all subscribers (anonymized emails), and all founder updates. The download shall trigger automatically.
- AC5: "Delete Account" shall show a multi-step confirmation: (1) warning explaining consequences, (2) require typing the account email to confirm, (3) call a `DELETE /api/profile` endpoint that deletes the founder's auth account and all associated data.
- AC6: The `DELETE /api/profile` endpoint shall delete: auth user (cascades to founder_profiles), all waitlists (cascades to subscribers, qualification_questions, milestone_rewards, founder_updates), and any other orphaned data.
- AC7: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Change password — Supabase updateUser + form UI
T2 (AC2) Change email — Supabase updateUser + form UI
T3 (AC3-AC4) Data export — API endpoint + download trigger
T4 (AC5-AC6) Account deletion — multi-step confirm + DELETE API
T5 (AC7) Lint + build

## Dev Notes

- **Password change:** Supabase `supabase.auth.updateUser({ password: newPassword })` requires the user to be recently authenticated. If the session is stale, Supabase may reject the request. Consider requiring current password re-entry.
- **Email change:** Supabase `supabase.auth.updateUser({ email: newEmail })` sends a confirmation email to the new address. The email only changes after the user clicks the confirmation link. Display a notice: "Check your new email for a confirmation link."
- **Data export format:** JSON with sections: `{ profile, waitlists, subscribers, updates }`. Subscribers should anonymize emails (use `anonymizeEmail` from `src/lib/format.ts`). File name: `prewaitlist-export-{date}.json`.
- **Account deletion cascade:** `auth.users` has `CASCADE` delete to `founder_profiles`. `waitlists` has `CASCADE` delete to `subscribers`, `qualification_questions`, `milestone_rewards`, `founder_updates`. Verify no orphaned rows remain in `email_events`, `page_views`, `bounced_emails`, `milestones_earned`.
- **Danger Zone styling:** Use `border-destructive/50` border, `text-destructive` heading, red-tinted background (`bg-destructive/5`). Visually distinct from other settings sections.
- **Re-authentication:** Supabase may require recent auth for sensitive operations (password change, email change, deletion). If `updateUser` fails with 401, show a message: "Please sign in again to continue."
- **Files to modify:**
  - `src/app/dashboard/settings/profile/client.tsx` — add Danger Zone section below tabs
  - `src/app/dashboard/settings/security/page.tsx` — currently a redirect, needs real content or merge into profile client
  - `src/app/api/profile/route.ts` — add DELETE handler + GET for export data
  - `components/billing/` — NO changes (Epic 13 scope)

## Out of Scope

- Billing tab wiring (Story 13.3)
- Paddle integration (Story 13.0)
- 2FA / TOTP (post-MVP security hardening)
- Active sessions list (post-MVP)
- Login history / audit log (post-MVP)
- Notification preferences (post-MVP)

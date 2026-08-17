# Epic 2 — Foundation & Auth

**Status:** done
**Source:** [PRD S6.3 Account Creation](../PRD.md#63-account-creation-f-b1), [PRD S6.4 Sign In](../PRD.md#64-sign-in-f-b1-sign-in-variant), [PRD S6.5 Email Verification](../PRD.md#65-email-verification-new), [PRD S7.3 Auth Implementation](../PRD.md#73-auth--implementation-detail), [PRD S7.4 Data Model](../PRD.md#74-data-model--implementation-grade), [PRD S7.5 Route/Handler List](../PRD.md#75-route--handler-list-sprint-1)

## Design References

| Reference          | File                                                          |
| ------------------ | ------------------------------------------------------------- |
| Signup Screen      | `docs/design/High-fidelity-svgs/Signup screen.svg`            |
| Sign In Screen     | `docs/design/High-fidelity-svgs/Sign in screen.svg`           |
| Email Verification | `docs/design/High-fidelity-svgs/Login email verification.svg` |

## Goal

Implement the authentication foundation: Supabase schema DDL + RLS, auth page UIs (signup, signin, email verification), auth flow logic, and proxy integration. After this epic, founders can create accounts, sign in, verify emails, and reach onboarding.

## Definition of Done

A founder can sign up via email/password or Google OAuth, receive and confirm a verification email, sign in with credentials, and be redirected to the appropriate next step (onboarding if new, dashboard if returning). All five database tables exist with RLS enabled. Auth guard blocks unverified access to protected routes.

## Story Index

| ID  | Title                                             | Depends on | Status |
| --- | ------------------------------------------------- | ---------- | ------ |
| 2.1 | Supabase schema DDL + RLS                         | 0.3        | done   |
| 2.2 | Auth page UIs (signup, signin, verify-email)      | 1.1, 1.4   | done   |
| 2.3 | Auth flow logic (signup, signin, OAuth, callback) | 2.1, 2.2   | done   |
| 2.4 | Email verification gate + resend                  | 2.3        | done   |
| 2.5 | Proxy auth guard + session refresh                | 2.3, 1.4   | done   |

---

### Story 2.1 — Supabase Schema DDL + RLS

**Status:** done
**Design Refs:** — (no UI)
**Story:** As the founder, I want the database schema and RLS policies applied so my data is securely stored from day one.

**Acceptance Criteria (EARS):**

- AC1: The system shall execute the DDL from `docs/stories/epic0.story03-supabase-schema.sql` against the Supabase project.
- AC2: All five tables (`founder_profiles`, `waitlists`, `qualification_questions`, `milestone_rewards`, `founder_updates`) shall exist with correct columns, types, constraints, and defaults.
- AC3: RLS shall be enabled on all five tables.
- AC4: Five RLS policies shall exist: "founders manage own profile", "founders manage own waitlist", and child-table policies for questions, rewards, and updates.
- AC5: The `waitlists` table shall enforce one waitlist per founder via a unique index on `founder_id`.
- AC6: The `waitlists.subdomain` column shall enforce format via CHECK constraint: `^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`.
- AC7: Lint and build shall pass with zero errors after schema application.

---

### Story 2.2 — Auth Page UIs (signup, signin, verify-email)

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/Signup screen.svg`, `docs/design/High-fidelity-svgs/Sign in screen.svg`, `docs/design/High-fidelity-svgs/Login email verification.svg`
**Story:** As the founder, I want polished auth pages so I can create an account, sign in, or verify my email with confidence.

**Acceptance Criteria (EARS):**

- AC1: The signup page (`/signup`) shall render a centered form with email, password, and confirm-password inputs matching the SVG layout.
- AC2: The signup page shall include a Google OAuth button with the Google icon, matching `Signup screen.svg` line 4-10 (Google logo at 522-545, 339-365).
- AC3: The signup page shall include an "or" divider between Google OAuth and email form, matching SVG lines 16-18 (horizontal lines at y=399.66, centered "or" text).
- AC4: The signup page shall include a green CTA button ("Build it free") matching SVG line 19 (rect at 507.621, 555.15, 421.199x42.7385, rx=10.6266, fill=#0F7A5E).
- AC5: The signup page shall include "Already have an account? Sign in" link at bottom.
- AC6: The signin page (`/signin`) shall render a centered form with email and password inputs matching the SVG layout.
- AC7: The signin page shall include a Google OAuth button matching `Sign in screen.svg`.
- AC8: The signin page shall include an "or" divider matching SVG lines 16-18.
- AC9: The signin page shall include a green CTA button ("Sign in") matching SVG line 19.
- AC10: The signin page shall include "Don't have an account? Sign up" link at bottom.
- AC11: The verify-email page (`/verify-email`) shall render an envelope icon matching `Login email verification.svg` lines 10-12 (envelope shape at 700-738, 312-344, stroke=#0F7A5E).
- AC12: The verify-email page shall display "Verify your email" heading and the user's email address.
- AC13: The verify-email page shall include a "Resend email" button.
- AC14: The verify-email page shall include a "Back to sign in" link.
- AC15: All auth pages shall use the `#FAF8F4` background color.
- AC16: All input fields shall use `#CCC9C3` border, rx=7.59, matching SVG styling.
- AC17: All pages shall be responsive (centered form works on mobile).
- AC18: Lint and build shall pass with zero errors.

---

### Story 2.3 — Auth Flow Logic (signup, signin, OAuth, callback)

**Status:** done
**Design Refs:** — (no UI)
**Story:** As the founder, I want auth logic that actually creates accounts, signs me in, and handles OAuth so I can access the product.

**Acceptance Criteria (EARS):**

- AC1: The signup form shall call `supabase.auth.signUp()` with email and password on submission.
- AC2: The signup form shall validate password >= 8 characters client-side before calling Supabase (REQ-6.3.5).
- AC3: On successful signup, the system shall redirect to `/verify-email` (REQ-6.3.2).
- AC4: The Google OAuth button shall call `supabase.auth.signInWithOAuth()` with Google provider (REQ-6.3.3).
- AC5: On Google OAuth completion, the system shall redirect directly to `/onboarding/1` (REQ-6.3.3).
- AC6: The signin form shall call `supabase.auth.signInWithPassword()` with email and password.
- AC7: On successful signin, if the founder has a waitlist record, redirect to `/dashboard` (REQ-6.4.1).
- AC8: On successful signin, if the founder has no waitlist record, redirect to `/onboarding/1` (REQ-6.4.2).
- AC9: The `/auth/callback` route handler shall exchange OAuth code for session via `supabase.auth.exchangeCodeForSession()` (already exists at `src/app/auth/callback/route.ts`).
- AC10: On callback error, redirect to `/auth/auth-code-error` (create this page as a simple error display).
- AC11: All auth errors shall display inline below the form with the Supabase error message.
- AC12: Lint and build shall pass with zero errors.

---

### Story 2.4 — Email Verification Gate + Resend

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/Login email verification.svg`
**Story:** As the founder, I want my email verified before accessing onboarding so the platform has valid contact information.

**Acceptance Criteria (EARS):**

- AC1: The system shall block access to `/onboarding/*` and `/dashboard` until the founder's email is confirmed (REQ-6.5.1).
- AC2: The "Resend email" button on `/verify-email` shall call `supabase.auth.resend()` with the user's email.
- AC3: After resend, the button shall enter a cooldown state (disabled + countdown or "Sent" text) for 60 seconds (REQ-6.5.2).
- AC4: When the emailed confirmation link is followed, the system shall establish the session and redirect to `/onboarding/1` (REQ-6.5.3).
- AC5: The verify-email page shall display the user's email address (passed via search params or read from session).
- AC6: Lint and build shall pass with zero errors.

---

### Story 2.5 — Proxy Auth Guard + Session Refresh

**Status:** done
**Design Refs:** — (no UI)
**Story:** As the founder, I want my session refreshed on every request and protected routes guarded so I stay signed in securely.

**Acceptance Criteria (EARS):**

- AC1: `proxy.ts` shall call `updateSession()` on every relevant request to refresh the session cookie before Server Components render (REQ-7.3).
- AC2: The auth guard shall redirect unauthenticated users to `/signin` for protected routes (`/onboarding/*`, `/dashboard`).
- AC3: The auth guard shall NOT redirect for public routes (`/`, `/signin`, `/signup`, `/verify-email`, `/auth/*`).
- AC4: The session refresh shall use the `@supabase/ssr` library with cookie-based session handling (REQ-7.3).
- AC5: No service-role key shall be exposed to the client (REQ-S11 Security).
- AC6: Lint and build shall pass with zero errors.

---

## Extra Work (Beyond Original ACs)

The following items were implemented during this epic beyond the original acceptance criteria:

### Auth UX Best Practices

- **Password strength meter** — 3-segment visual bar (weak/medium/strong) in `PasswordInput` component, text label showing criteria
- **Autocomplete attributes** — `email`, `new-password`, `current-password` on all inputs for browser autofill
- **Terms/Privacy link** — bottom of signup page with links to `/terms` and `/privacy`
- **Forgot Password page** (`/forgot-password`) — email input + confirmation state
- **Reset Password page** (`/reset-password`) — password + strength meter
- **Email format validation** — regex validation on blur + submit
- **Generic error messages** — hides Supabase specifics ("Invalid email or password" instead of raw errors)
- **Rate limiting** — 5 attempts per 60s window with countdown message
- **Duplicate email detection** — "An account with this email already exists"
- **Loading spinners** — `Spinner` component on all submit buttons
- **`aria-label`** on password visibility toggle

### Callback Route Fixes

- **Cookie handling fixed** — original `setAll` created throwaway `NextResponse.next()` objects; session cookies never reached the browser
- **Password reset redirect** — Supabase's hosted auth page strips query params from redirect URLs; added cookie-based redirect destination (`auth_redirect_to`)
- **Callback now reads cookie first** — supports both email confirmation and password reset flows

### Typography & Layout

- **Centralized typography tokens** — all auth pages use `.text-h2-semibold`, `.text-body-lg`, `.text-body-sm`, `.text-caption`, `.text-xs` from `globals.css`
- **`.text-h2-semibold` token added** — 28px semibold for auth headings (existing `.text-h2` is bold/700)
- **Label weight standardized** — changed from semibold (600) to medium (500) in Input and PasswordInput
- **Label-to-input gap** — standardized to 8px (`gap-2`); field-to-field to 16px (`gap-4`)
- **Subtitle size** — elevated to 18px (`text-body-lg`)
- **Bottom links** — converted from `<p>` to `<Link>` for 44px tap target (WCAG AAA)
- **Strength meter fixed** — inline segment indicators instead of overlapping absolute-positioned bars

### Logo & Navigation

- **Logo resized** — 160x52 on all auth pages (was 120x40)
- **Logo wrapped in Link** — clicking logo returns to marketing homepage (`/`)
- **MarketingLayout moved** — from root `layout.tsx` to `(marketing)/layout.tsx`
- **Navbar removed from auth pages** — clean architectural separation via Next.js route groups

### New Pages

- `/forgot-password` — forgot password flow with email input + confirmation state
- `/reset-password` — reset password flow with password + strength meter
- `/auth/auth-code-error` — error page for failed auth callbacks

### Additional Pages

- Verify-email page with resend with 60s cooldown

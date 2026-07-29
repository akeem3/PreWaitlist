# Epic 2 — Foundation & Auth

**Status:** ready
**Source:** [PRD S6.3 Account Creation](docs/PRD-Sprint-1.md#63-account-creation-f-b1), [PRD S6.4 Sign In](docs/PRD-Sprint-1.md#64-sign-in-f-b1-sign-in-variant), [PRD S6.5 Email Verification](docs/PRD-Sprint-1.md#65-email-verification-new), [PRD S7.3 Auth Implementation](docs/PRD-Sprint-1.md#73-auth--implementation-detail), [PRD S7.4 Data Model](docs/PRD-Sprint-1.md#74-data-model--implementation-grade), [PRD S7.5 Route/Handler List](docs/PRD-Sprint-1.md#75-route--handler-list-sprint-1)

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
| 2.1 | Supabase schema DDL + RLS                         | 0.3        | ready  |
| 2.2 | Auth page UIs (signup, signin, verify-email)      | 1.1, 1.4   | ready  |
| 2.3 | Auth flow logic (signup, signin, OAuth, callback) | 2.1, 2.2   | ready  |
| 2.4 | Email verification gate + resend                  | 2.3        | ready  |
| 2.5 | Proxy auth guard + session refresh                | 2.3, 1.4   | ready  |

Work through these in dependency order, one at a time. Each has a `status` you should update as you go (`ready` → `in-progress` → `blocked` or `done`). A story marked `blocked` stays blocked until manually cleared — don't silently re-attempt it next session.

---

### Story 2.1 — Supabase Schema DDL + RLS

**Status:** ready
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

**Tasks:** T1 (AC1-AC4) Apply DDL + RLS via Supabase SQL Editor · T2 (AC5-AC6) Verify constraints and indexes · T3 (AC7) Run lint + build

**Out of scope:** Seed data, migrations tooling, schema changes beyond the reference SQL.

**Dev Notes:**

- T1: Run the SQL from `docs/stories/epic0.story03-supabase-schema.sql` in Supabase Dashboard → SQL Editor. The file is 100 lines and contains all DDL + RLS.
- T2: After applying, verify via `information_schema.tables` and `pg_policies` that all objects exist.
- T3: No code changes needed — schema is applied directly in Supabase.

---

### Story 2.2 — Auth Page UIs (signup, signin, verify-email)

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-svgs/Signup screen.svg`, `docs/design/High-fidelity-svgs/Sign in screen.svg`, `docs/design/High-fidelity-svgs/Login email verification.svg`
**Story:** As the founder, I want polished auth pages so I can create an account, sign in, or verify my email with confidence.

**Acceptance Criteria (EARS):**

- AC1: The signup page (`/signup`) shall render a centered form with email, password, and confirm-password inputs matching the SVG layout.
- AC2: The signup page shall include a Google OAuth button with the Google icon, matching `Signup screen.svg` line 4-10 (Google logo at 522-545, 339-365).
- AC3: The signup page shall include an "or" divider between Google OAuth and email form, matching SVG lines 16-18 (horizontal lines at y=399.66, centered "or" text).
- AC4: The signup page shall include a green CTA button ("Build it free") matching SVG line 19 (rect at 507.621, 555.15, 421.199×42.7385, rx=10.6266, fill=#0F7A5E).
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

**Tasks:** T1 (AC1-AC5) Build signup page UI · T2 (AC6-AC10) Build signin page UI · T3 (AC11-AC14) Build verify-email page UI · T4 (AC15-AC17) Apply design tokens and responsive styles · T5 (AC18) Run lint + build

**Out of scope:** Form submission logic (Story 2.3), validation logic (Story 2.3), OAuth flow (Story 2.3).

**Dev Notes:**

- T1: Use existing `Input` component from `components/ui/input.tsx`. Form layout: centered container max-width ~420px. Google button: white bg, Google icon, "Continue with Google" text. "or" divider: two horizontal lines with centered "or" text. CTA: use `Button` component with `variant="primary"`.
- T2: Same structure as signup but with email + password only (no confirm password). Add "Forgot password?" link below password field.
- T3: Envelope icon: SVG path from email verification SVG. Green circle outline (#0F7A5E) around envelope.
- T4: Background color `#FAF8F4` applied to page. Input borders `#CCC9C3`. Button fill `#0F7A5E`. Button rx ~10.63.
- T5: Files: `src/app/(auth)/signup/page.tsx`, `src/app/(auth)/signin/page.tsx`, `src/app/(auth)/verify-email/page.tsx`.

---

### Story 2.3 — Auth Flow Logic (signup, signin, OAuth, callback)

**Status:** ready
**Design Refs:** — (no UI)
**Story:** As the founder, I want auth logic that actually creates accounts, signs me in, and handles OAuth so I can access the product.

**Acceptance Criteria (EARS):**

- AC1: The signup form shall call `supabase.auth.signUp()` with email and password on submission.
- AC2: The signup form shall validate password ≥ 8 characters client-side before calling Supabase (REQ-6.3.5).
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

**Tasks:** T1 (AC1-AC3) Implement signup logic · T2 (AC4-AC5) Implement Google OAuth · T3 (AC6-AC8) Implement signin logic with redirect · T4 (AC9-AC10) Fix callback route + error page · T5 (AC11) Add error display to all forms · T6 (AC12) Run lint + build

**Out of scope:** Session management (Story 2.5), email verification flow (Story 2.4), referral/UTM persistence (REQ-6.3.4 — deferred).

**Dev Notes:**

- T1: Use `createClient()` from `src/lib/supabase/client.ts` for browser client. Form state: `useState` for email/password/confirmPassword/error/loading. On submit: validate password length, call `signUp({ email, password })`, redirect to `/verify-email`.
- T2: `signInWithOAuth({ provider: 'google', options: { redirectTo: '${origin}/auth/callback' } })`. The callback route already exists and exchanges the code.
- T3: After `signInWithPassword()`, query `waitlists` table: `supabase.from('waitlists').select('id').eq('founder_id', user.id).single()`. If result has data → `/dashboard`, else → `/onboarding/1`.
- T4: The existing `src/app/auth/callback/route.ts` already handles code exchange. Create `src/app/auth/auth-code-error/page.tsx` as a simple error page with "Authentication failed" message and "Back to sign in" link.
- T5: Use `useState` for error string. Display below form using `text-destructive` class or red text.

---

### Story 2.4 — Email Verification Gate + Resend

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-svgs/Login email verification.svg`
**Story:** As the founder, I want my email verified before accessing onboarding so the platform has valid contact information.

**Acceptance Criteria (EARS):**

- AC1: The system shall block access to `/onboarding/*` and `/dashboard` until the founder's email is confirmed (REQ-6.5.1).
- AC2: The "Resend email" button on `/verify-email` shall call `supabase.auth.resend()` with the user's email.
- AC3: After resend, the button shall enter a cooldown state (disabled + countdown or "Sent" text) for 60 seconds (REQ-6.5.2).
- AC4: When the emailed confirmation link is followed, the system shall establish the session and redirect to `/onboarding/1` (REQ-6.5.3).
- AC5: The verify-email page shall display the user's email address (passed via search params or read from session).
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Implement verification gate in proxy/auth middleware · T2 (AC2-AC3) Implement resend + cooldown · T3 (AC4) Handle confirmation link callback · T4 (AC5) Display email on verify page · T5 (AC6) Run lint + build

**Out of scope:** Custom email templates (uses Supabase defaults), rate limit implementation (Supabase handles this).

**Dev Notes:**

- T1: The auth guard in `src/lib/supabase/middleware.ts` already redirects unauthenticated users. Add email verification check: `if (user && !user.email_confirmed_at) { /* block access to /onboarding/* and /dashboard */ }`.
- T2: Use `supabase.auth.resend({ type: 'signup', email })`. Cooldown: `useState` with `setInterval` countdown from 60.
- T3: The `/auth/callback` route already handles email confirmation links (the `code` parameter). No changes needed — Supabase's built-in flow handles this.
- T4: Pass email via URL search params from signup flow: `/verify-email?email=user@example.com`. Read with `useSearchParams()`.

---

### Story 2.5 — Proxy Auth Guard + Session Refresh

**Status:** ready
**Design Refs:** — (no UI)
**Story:** As the founder, I want my session refreshed on every request and protected routes guarded so I stay signed in securely.

**Acceptance Criteria (EARS):**

- AC1: `proxy.ts` shall call `updateSession()` on every relevant request to refresh the session cookie before Server Components render (REQ-7.3).
- AC2: The auth guard shall redirect unauthenticated users to `/signin` for protected routes (`/onboarding/*`, `/dashboard`).
- AC3: The auth guard shall NOT redirect for public routes (`/`, `/signin`, `/signup`, `/verify-email`, `/auth/*`).
- AC4: The session refresh shall use the `@supabase/ssr` library with cookie-based session handling (REQ-7.3).
- AC5: No service-role key shall be exposed to the client (REQ-S11 Security).
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1, AC4) Integrate updateSession into proxy.ts · T2 (AC2-AC3) Implement auth guard logic · T3 (AC5) Verify no service-role key exposure · T4 (AC6) Run lint + build

**Out of scope:** Custom middleware logic, rate limiting, IP-based blocking.

**Dev Notes:**

- T1: `proxy.ts` already exists at project root with subdomain routing. Import `updateSession` from `src/lib/supabase/proxy.ts` and call it at the start of the `proxy()` function. Return the response from `updateSession()` when it redirects, otherwise continue with subdomain routing.
- T2: The auth guard logic already exists in `src/lib/supabase/middleware.ts`. The `updateSession` function in `src/lib/supabase/proxy.ts` already handles session refresh. Combine: call `updateSession()` first, then apply subdomain routing logic.
- T3: Verify that `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not secret) is used in browser client. The secret key (`SUPABASE_SECRET_KEY`) should only appear in server-side code.
- T4: Files: `proxy.ts`, `src/lib/supabase/proxy.ts`.

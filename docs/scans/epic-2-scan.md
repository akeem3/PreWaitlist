# Epic 2 — Foundation & Auth: Scan Report

**Generated:** 2026-07-28
**Stories Scanned:** 2.2, 2.3, 2.4, 2.5 (2.1 complete)
**Status:** Context gathering complete, ready for execution

---

## Executive Summary

Stories 2.2-2.5 build the authentication system for the wait-app. Story 2.1 (schema) is complete. Stories 2.2-2.5 implement auth page UIs, auth flow logic, email verification, and proxy integration. All placeholder files exist as stubs and need real implementations.

---

## Story 2.2 — Auth Page UIs (signup, signin, verify-email)

**Status:** ready
**Priority:** High (foundational UI for auth)

### Current State

- **Placeholder files exist:**
  - `src/app/(auth)/signup/page.tsx` — 3-line stub
  - `src/app/(auth)/signin/page.tsx` — 3-line stub
  - `src/app/(auth)/verify-email/page.tsx` — 3-line stub

### Acceptance Criteria

1. Signup page: centered form with email, password, confirm-password inputs
2. Signup page: Google OAuth button with Google icon
3. Signup page: "or" divider between Google OAuth and email form
4. Signup page: green CTA button ("Build it free")
5. Signup page: "Already have an account? Sign in" link
6. Signin page: centered form with email and password inputs
7. Signin page: Google OAuth button
8. Signin page: "or" divider
9. Signin page: green CTA button ("Sign in")
10. Signin page: "Don't have an account? Sign up" link
11. Verify-email page: envelope icon with green circle outline
12. Verify-email page: "Verify your email" heading and user's email
13. Verify-email page: "Resend email" button
14. Verify-email page: "Back to sign in" link
15. All pages: #FAF8F4 background
16. All inputs: #CCC9C3 border, rx=7.59
17. All pages: responsive (centered form on mobile)
18. Lint + build pass

### Tasks

- **T1:** Build signup page UI (AC1-AC5)
  - Use `Input` component from `components/ui/input.tsx`
  - Form layout: centered container max-width ~420px
  - Google button: white bg, Google icon, "Continue with Google"
  - "or" divider: two horizontal lines with centered "or"
  - CTA: `Button` component with `variant="primary"`

- **T2:** Build signin page UI (AC6-AC10)
  - Same structure as signup but email + password only (no confirm password)
  - Add "Forgot password?" link below password field

- **T3:** Build verify-email page UI (AC11-AC14)
  - Envelope icon: SVG path from email verification SVG
  - Green circle outline (#0F7A5E) around envelope

- **T4:** Apply design tokens and responsive styles (AC15-AC17)
  - Background color #FAF8F4
  - Input borders #CCC9C3
  - Button fill #0F7A5E
  - Button rx ~10.63

- **T5:** Run lint + build (AC18)

### Dependencies

- Design SVGs: `docs/design/High-fidelity-svgs/Signup screen.svg`, `docs/design/High-fidelity-svgs/Sign in screen.svg`, `docs/design/High-fidelity-svgs/Login email verification.svg`
- UI components: `components/ui/input.tsx`, `components/ui/button.tsx`
- Design tokens: `src/app/globals.css`

---

## Story 2.3 — Auth Flow Logic (signup, signin, OAuth, callback)

**Status:** ready
**Priority:** High (core auth functionality)

### Current State

- **No form submission logic exists** — pages are placeholders
- **Callback route exists:** `src/app/auth/callback/route.ts` (fully functional)
- **Auth error page missing:** `src/app/auth/auth-code-error/page.tsx` does NOT exist

### Acceptance Criteria

1. Signup form calls `supabase.auth.signUp()` with email/password
2. Signup form validates password ≥ 8 characters client-side
3. On successful signup, redirect to `/verify-email`
4. Google OAuth button calls `supabase.auth.signInWithOAuth()` with Google provider
5. On Google OAuth completion, redirect to `/onboarding/1`
6. Signin form calls `supabase.auth.signInWithPassword()` with email/password
7. On successful signin with waitlist record, redirect to `/dashboard`
8. On successful signin without waitlist record, redirect to `/onboarding/1`
9. `/auth/callback` route handler exchanges OAuth code for session
10. On callback error, redirect to `/auth/auth-code-error`
11. All auth errors display inline below form
12. Lint + build pass

### Tasks

- **T1:** Implement signup logic (AC1-AC3)
  - Use `createClient()` from `src/lib/supabase/client.ts`
  - Form state: `useState` for email/password/confirmPassword/error/loading
  - On submit: validate password length, call `signUp({ email, password })`, redirect to `/verify-email`

- **T2:** Implement Google OAuth (AC4-AC5)
  - `signInWithOAuth({ provider: 'google', options: { redirectTo: '${origin}/auth/callback' } })`

- **T3:** Implement signin logic with redirect (AC6-AC8)
  - After `signInWithPassword()`, query `waitlists` table: `supabase.from('waitlists').select('id').eq('founder_id', user.id).single()`
  - If result has data → `/dashboard`, else → `/onboarding/1`

- **T4:** Fix callback route + error page (AC9-AC10)
  - Create `src/app/auth/auth-code-error/page.tsx` as simple error display

- **T5:** Add error display to all forms (AC11)
  - Use `useState` for error string
  - Display below form using `text-destructive` class or red text

- **T6:** Run lint + build (AC12)

### Dependencies

- Supabase client: `src/lib/supabase/client.ts` (exists, complete)
- Callback route: `src/app/auth/callback/route.ts` (exists, complete)

---

## Story 2.4 — Email Verification Gate + Resend

**Status:** ready
**Priority:** High (security requirement)

### Current State

- **Auth guard logic exists:** `src/lib/supabase/middleware.ts` (complete but NOT wired up)
- **No resend logic exists** — verify-email page is a placeholder
- **Callback route handles email confirmation** (already implemented)

### Acceptance Criteria

1. System blocks access to `/onboarding/*` and `/dashboard` until email confirmed
2. "Resend email" button calls `supabase.auth.resend()` with user's email
3. After resend, button enters cooldown state (60 seconds)
4. When emailed confirmation link is followed, system establishes session and redirects to `/onboarding/1`
5. Verify-email page displays user's email address
6. Lint + build pass

### Tasks

- **T1:** Implement verification gate in proxy/auth middleware (AC1)
  - Auth guard logic exists in `src/lib/supabase/middleware.ts`
  - Either create `src/middleware.ts` to call it, or integrate into `proxy.ts`

- **T2:** Implement resend + cooldown (AC2-AC3)
  - Use `supabase.auth.resend({ type: 'signup', email })`
  - Cooldown: `useState` with `setInterval` countdown from 60

- **T3:** Handle confirmation link callback (AC4)
  - `/auth/callback` route already handles email confirmation links
  - No changes needed

- **T4:** Display email on verify page (AC5)
  - Pass email via URL search params from signup flow: `/verify-email?email=user@example.com`
  - Read with `useSearchParams()`

- **T5:** Run lint + build (AC6)

### Dependencies

- Auth guard: `src/lib/supabase/middleware.ts` (exists, complete)
- Callback route: `src/app/auth/callback/route.ts` (exists, complete)

---

## Story 2.5 — Proxy Auth Guard + Session Refresh

**Status:** ready
**Priority:** High (session management)

### Current State

- **Proxy exists:** `proxy.ts` at project root (has subdomain routing)
- **Session refresh helper exists:** `src/lib/supabase/proxy.ts` (complete)
- **Auth guard logic exists:** `src/lib/supabase/middleware.ts` (complete)
- **Session refresh NOT wired:** `proxy.ts` doesn't call `updateSession()`

### Acceptance Criteria

1. `proxy.ts` calls `updateSession()` on every relevant request
2. Auth guard redirects unauthenticated users to `/signin` for protected routes
3. Auth guard does NOT redirect for public routes
4. Session refresh uses `@supabase/ssr` library with cookie-based session handling
5. No service-role key exposed to client
6. Lint + build pass

### Tasks

- **T1:** Integrate updateSession into proxy.ts (AC1, AC4)
  - Import and call `updateSession()` at start of `proxy()` function
  - Return response from `updateSession()` when it redirects, otherwise continue with subdomain routing

- **T2:** Implement auth guard logic (AC2-AC3)
  - Auth guard logic exists in `src/lib/supabase/middleware.ts`
  - Call from `proxy.ts` or create separate `src/middleware.ts`

- **T3:** Verify no service-role key exposure (AC5)
  - Verify `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not secret) used in browser client
  - Secret key should only appear in server-side code

- **T4:** Run lint + build (AC6)

### Dependencies

- Proxy: `proxy.ts` (exists, needs modification)
- Session refresh: `src/lib/supabase/proxy.ts` (exists, complete)
- Auth guard: `src/lib/supabase/middleware.ts` (exists, complete)

---

## Implementation Order

1. **Story 2.2** — Build auth page UIs (signup, signin, verify-email)
2. **Story 2.3** — Implement auth flow logic (signup, signin, OAuth, callback)
3. **Story 2.4** — Email verification gate + resend
4. **Story 2.5** — Proxy auth guard + session refresh

---

## Verification Plan

After each story:

1. Run `pnpm lint` — must pass with zero errors
2. Run `pnpm build` — must pass with zero errors
3. Manual testing:
   - Story 2.2: Visual verification of UI against design SVGs
   - Story 2.3: Test signup/signin flows, OAuth redirect
   - Story 2.4: Test email verification gate, resend cooldown
   - Story 2.5: Test session refresh, protected route redirects

---

## Risk Assessment

| Risk                     | Mitigation                                 |
| ------------------------ | ------------------------------------------ |
| Design token mismatch    | Use exact values from SVGs and globals.css |
| Auth redirect loops      | Careful route matching in proxy.ts         |
| Session refresh failures | Test with expired sessions                 |
| Missing error pages      | Create auth-code-error page before testing |

---

## Files to Modify/Create

### Modify

- `src/app/(auth)/signup/page.tsx` — Build real UI
- `src/app/(auth)/signin/page.tsx` — Build real UI
- `src/app/(auth)/verify-email/page.tsx` — Build real UI
- `proxy.ts` — Integrate updateSession and auth guard

### Create

- `src/app/auth/auth-code-error/page.tsx` — Error display page

### Reference

- `components/ui/input.tsx` — Input component
- `components/ui/button.tsx` — Button component
- `src/lib/supabase/client.ts` — Browser client
- `src/lib/supabase/proxy.ts` — Session refresh helper
- `src/lib/supabase/middleware.ts` — Auth guard logic
- `src/app/globals.css` — Design tokens
- `docs/design/High-fidelity-svgs/Signup screen.svg` — Design reference
- `docs/design/High-fidelity-svgs/Sign in screen.svg` — Design reference
- `docs/design/High-fidelity-svgs/Login email verification.svg` — Design reference

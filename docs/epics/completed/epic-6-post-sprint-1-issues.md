# Epic 6 — Post-Sprint-1 Issue Resolution

**Status:** done
**Source:** Post-Sprint-1 issue list (2026-08-10), MEMORY.md

## Design References

| Reference         | File                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| Onboarding Step 3 | `docs/design/High-fidelity-svgs/Step 3 - Make it Yours.svg`          |
| Onboarding Step 4 | `docs/design/High-fidelity-svgs/Step 4 - Qualification Decision.svg` |
| Success Screen    | `docs/design/High-fidelity-svgs/Success Screen.svg`                  |
| Empty Dashboard   | `docs/design/High-fidelity-svgs/Empty Dashboard skeleton.svg`        |

## Goal

Resolve all remaining post-Sprint-1 issues, including two high-impact features: Hopkins' sampling pattern (moving signup to after product experience) and social proof signup counter. This epic completes the onboarding polish and prepares the product for Sprint 2.

## Definition of Done

All issues resolved. Onboarding flow follows Hopkins' sampling principle (signup after Step 3). Signup counter is available as founder toggle. Dashboard and onboarding polish are complete. Onboarding state persistence is hardened with proper lifecycle management. Lint and build pass.

## Story Index

| ID  | Title                                       | Depends on | Status |
| --- | ------------------------------------------- | ---------- | ------ |
| 6.0 | Hopkins' Sampling + Signup Counter          | —          | done   |
| 6.1 | Dashboard UI Fixes                          | —          | done   |
| 6.2 | Onboarding Polish                           | 6.0        | done   |
| 6.3 | Step 5 Redesign + Email Mock + Architecture | —          | done   |
| 6.4 | State Persistence Hardening                 | 6.3        | done   |

Work through these in dependency order, one at a time. Each has a `status` you should update as you go (`ready` → `in-progress` → `blocked` or `done`). A story marked `blocked` stays blocked until manually cleared — don't silently re-attempt it next session.

---

### Story 6.0 — Hopkins' Sampling + Signup Counter

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/Step 3 - Make it Yours.svg`
**Story:** As the founder, I want users to experience my product before signing up (Hopkins' sampling) and display a real-time signup counter for social proof, so that conversion is maximized through product experience and social proof.

**Key clarification — Signup Counter behavior:**

- The counter displays the **real number of actual signups** from the database — it is NOT a target or goal
- The founder sets a **threshold** for when to START displaying it (e.g., "show when I have 10+ signups") to avoid showing embarrassing low numbers on day one
- The public sees the real count (e.g., "1,189 people in line") — this is social proof based on actual demand, not a fabricated number
- The counter updates as people actually sign up — no fake/padded/estimated numbers ever

**Acceptance Criteria (EARS):**

- AC1: Steps 1-3 (Name, Template, Customise) shall run without authentication, storing state in localStorage only.
- AC2: After Step 3, the system shall display a "Create an account to save your progress" prompt before proceeding to Step 4.
- AC3: On signup/login, the system shall flush localStorage state to the API and continue from the appropriate step.
- AC4: The signup counter shall be a founder toggle in Step 3 (Make It Yours), OFF by default.
- AC5: The founder shall be able to set a display threshold (e.g., 10, 50, 100) — the counter only appears when real signups meet or exceed this number.
- AC6: When enabled and threshold is met, the signup counter shall display the real subscriber count on the public waitlist page (e.g., "1,189 people in line"). The endpoint shall return `{count, visible}` where `visible` is true only when `count >= threshold`.
- AC7: The counter must always show real data from the database — never seeded, padded, estimated, or fabricated.
- AC8: The counter endpoint shall be rate-limited (60 req/min per IP) and server-side only.
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Implement Hopkins' sampling flow with OAuthFlush · T2 (AC4-AC8) Implement signup counter with threshold · T3 (AC9) Run lint + build

**Out of scope:** Real-time counter updates via WebSocket (use polling), fake/social proof numbers, visual copying of reference image (red accent/slider), target/goal counters (this is a display-only counter of real signups).

**Architecture Decisions:**

1. **Signup Counter — No Subscribers Table Yet:** Count from `subscribers` table when it exists (Sprint 2), return `{count: 0, visible: false}` when it doesn't. Don't add a denormalized counter column — creates sync bugs. The endpoint queries `subscribers` table; when Sprint 2 creates it, the query works automatically with no migration needed. Rate limit: 60 req/min per IP. Return `visible: false` when count < threshold so frontend never interprets thresholds.

2. **OAuth Flush — Client-Side:** Client-side `OAuthFlush` component in onboarding layout. OAuth Callback (server) sets session cookie → redirects to `/onboarding/4` → `OAuthFlush` component (client) reads localStorage → POSTs to API → clears storage. If flush fails, localStorage preserved for retry. Place in `src/app/onboarding/layout.tsx`.

3. **Deferred Record Creation:** localStorage-only Steps 1-3, flush on auth. Steps 1-3 never call API — just store in localStorage via context. After Step 3, show signup prompt. On signup, set cookie `auth_redirect_to=/onboarding/4`. OAuthFlush component reads localStorage, POSTs to API, clears storage. Flow: Step 1 → localStorage → Step 2 → localStorage → Step 3 → localStorage → Signup Prompt → OAuth → Auth Callback → OAuthFlush → API.

**Dev Notes:**

- T1: Hopkins' sampling — Steps 1-3 store in localStorage only, no API calls. After Step 3, show signup prompt. On signup, flush localStorage to API via OAuthFlush component. Login redirect checks: if no waitlist → Step 1, if incomplete → resume step. Files: `src/app/onboarding/context.tsx`, `src/app/onboarding/1/page.tsx`, `src/app/onboarding/2/page.tsx`, `src/app/onboarding/3/page.tsx`, `src/app/onboarding/4/page.tsx`, `src/app/(auth)/signup/page.tsx`, `src/app/auth/callback/route.ts`, `src/app/onboarding/layout.tsx`, `src/components/auth/oauth-flush.tsx` (new).
- T2: Signup counter — Toggle in Step 3 next to milestone rewards. Threshold input (positive integer) for minimum display count. GET /api/waitlist/count endpoint returns real count from subscribers table. Counter only visible when `count >= threshold`. Rate limiting (60 req/min per IP). Atomic counter in same transaction as insert. Files: `src/app/onboarding/3/page.tsx`, `src/app/api/waitlist/route.ts`, `src/app/api/waitlist/count/route.ts` (new), `src/app/(public)/[subdomain]/page.tsx`, `components/onboarding/live-preview.tsx`.
- T3: Database: Add `signup_counter_enabled` (boolean, default false) and `signup_counter_threshold` (integer, default 10) columns to waitlists table.

---

### Story 6.1 — Dashboard UI Fixes

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/Empty Dashboard skeleton.svg`
**Story:** As the founder, I want the dashboard to correctly display my product name and have proper styling, so that the dashboard feels polished and personalized.

**Acceptance Criteria (EARS):**

- AC1: The dashboard link shall use semi-bold font weight (`font-semibold`).
- AC2: The dashboard shall display the founder's product name (headline) instead of "PreWaitlist" as the fallback.
- AC3: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Fix dashboard styling and fallback name · T2 (AC3) Run lint + build

**Out of scope:** Dashboard redesign (Sprint 2), real stat computation (Sprint 2).

**Dev Notes:**

- T1: Dashboard link — Add `font-semibold` class. Fallback name — Use `headline` field from waitlist data instead of hardcoded "PreWaitlist". Files: `src/app/dashboard/client.tsx`.
- T2: Lint + build pass.

---

### Story 6.2 — Onboarding Polish

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/Step 4 - Qualification Decision.svg`, `docs/design/High-fidelity-svgs/Success Screen.svg`
**Story:** As the founder, I want the onboarding flow to be polished and explain features clearly, so that I understand what I'm configuring and the experience feels professional.

**Acceptance Criteria (EARS):**

- AC1: Step 5 (Email Setup) shall include an explanation of the Pro preview features.
- AC2: The success page shall be scrollable on mobile devices.
- AC3: The milestone rewards knob shall be positioned correctly (right-aligned).
- AC4: Optional qualification questions shall be visible in the onboarding preview.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Add Pro preview explanation · T2 (AC2) Fix success page scroll · T3 (AC3) Fix milestone knob position · T4 (AC4) Make optional questions visible · T5 (AC5) Run lint + build

**Out of scope:** Pro tier implementation (Sprint 3), milestone rewards logic (Sprint 2).

**Dev Notes:**

- T1: Pro preview explanation — Add helper text explaining Pro features in Step 5. Files: `src/app/onboarding/5/page.tsx`.
- T2: Success page scroll — Ensure `min-h-dvh` and proper overflow on mobile. Files: `src/app/onboarding/success/page.tsx`.
- T3: Milestone knob — Check right alignment of toggle/knob component. Files: `src/app/onboarding/3/page.tsx`.
- T4: Optional questions — Ensure questions marked as optional show "(optional)" in preview. Files: `components/onboarding/live-preview.tsx`.
- T5: Lint + build pass.

---

### Story 6.3 — Step 5 Redesign + Email Mock + Onboarding Architecture Overhaul

**Status:** done
**Design Refs:** —
**Story:** As the founder, I want Step 5 to clearly show what my subscribers receive and launch my waitlist, so that I feel confident going live on the Free tier. Additionally, the onboarding state management needed a complete architectural overhaul to fix deep-rooted persistence bugs.

**Key design decisions:**

- **Layout:** Comparison card — "What your subscribers receive on Free" vs "What Pro unlocks"
- **Upgrade link:** `/#pricing` (PRD-correct for Sprint 1), secondary text link below the comparison card
- **Email preview:** Mock of a real confirmation email (From, Subject, Body) — not abstract placeholders
- **Pro helper box:** Removed — the comparison card already covers that information, reduces visual noise
- **Email mock copy:** "You're in! Position #X on the [product] waitlist" — aligns with existing Step 5 copy and PRD standing decisions (email-only signup, no name)

**Acceptance Criteria (EARS):**

- AC1: Step 5 Free tier shall show a comparison card: "What your subscribers receive" (Free features) vs "What Pro unlocks" (custom branding, sender domain)
- AC2: The "Launch my waitlist" button shall be the only primary CTA on Step 5
- AC3: The upgrade link shall be secondary (small text link, not a green button) and navigate to `/#pricing`
- AC4: Step 5 Free tier shall show a realistic email mock (From, Subject, Body) so the founder sees exactly what subscribers receive
- AC5: Step 5 Pro tier shall show editable email fields (existing behavior, unchanged)
- AC6: On mount, if authenticated and a saved waitlist exists, the system shall validate it against the server
- AC7: If the server returns 404 (deleted account), localStorage shall be cleared and the founder redirected to Step 1
- AC8: If the server returns 200, server data shall merge into context (server wins for waitlistId + saved fields)
- AC9: Lint and build shall pass with zero errors

**Tasks:** T1 (AC1-AC3) Step 5 comparison card + upgrade link · T2 (AC4-AC5) Email preview mock · T3 (AC6-AC8) localStorage sync fix · T4 (AC9) Run lint + build

**Out of scope:** Pro tier implementation (Sprint 3), real email sending (Sprint 3), GIF creation.

**Architecture Decisions:**

1. **Two-Provider Split:** The single `OnboardingProvider` was split into two independent providers:
   - `LocalOnboardingProvider` (Phase A, Steps 1-3): React `useState` + `localStorage`. No network calls. Authoritative source is localStorage. Provides `updateField`, `setWaitlistId`, `setLoading`, `flushToAPI`, `clearPersisted`, `clearDraft`.
   - `AuthedOnboardingProvider` (Phase B, Steps 4-5): React `useState` seeded from server state. Updates via debounced PATCH. No localStorage code — structurally impossible to read or write. Provides `updateField`, `setLoading`, `patchWaitlist`.

2. **FlushGate Component:** Replaced `OAuthFlush`. Resolves server state once on mount, then renders children inside `AuthedOnboardingProvider`. Ordering: POST (if local data) → confirm 2xx → GET full record → confirm success → only then clear localStorage. Any failure preserves local data and shows a retry UI. If 404 from GET with no local data → redirect to Step 1 (truly fresh).

3. **Layout Structure:** `LocalOnboardingProvider` (always mounted, outer wrapper) → Phase A routes render directly → Phase B routes wrapped in `FlushGate` → `AuthedOnboardingProvider`.

4. **Step 3 Auth Check:** If user is already authenticated when completing Step 3, skip the signup page entirely and flush directly to server via `flushToAPI`, then route to Step 4.

5. **Step 1 Auth Check:** On mount, checks if user is authenticated with an existing waitlist → redirects to dashboard. Prevents duplicate flows when user already has a live waitlist.

6. **Session-Flag Resume Prompt:** `sessionStorage` flag (`prewaitlist_onboarding_active`) set when data loads from localStorage. On cold landing (localStorage has data but no session flag), shows "You have an in-progress setup for '{name}' — Continue or Start Fresh?" prompt.

7. **Cross-Tab Sync:** `storage` event listener in `LocalOnboardingProvider` re-hydrates React state when another tab writes to the same key. Last-write-wins (acceptable for solo onboarding form).

8. **Persist Guard:** Persist effect skips writing when `waitlistId` is set (server owns data), preventing `flushToAPI`'s localStorage clear from being overwritten by the persist effect.

**Dev Notes:**

- T1: Comparison card — Replace current Step 5 layout. Two-column card: Free features vs Pro features. "Launch my waitlist" as primary CTA (green, full-width). Upgrade as secondary link below (`/#pricing`). Remove the separate Pro helper text box. Files: `src/app/onboarding/5/page.tsx`.
- T2: Email mock — Realistic subscriber-facing email inside the comparison card. From: `[headline] via PreWaitlist`. Subject: `You're in! Position #X on the [headline] waitlist`. Body: standard confirmation copy. Use `form.headline` for dynamic values. Files: `src/app/onboarding/5/page.tsx`.
- T3: Architecture overhaul — Split `OnboardingProvider` into `LocalOnboardingProvider` + `AuthedOnboardingProvider`. New `FlushGate` component. Updated layout, Steps 4/4a (removed `flushToAPI` calls), signup page (auth check fallback), success page (`clearPersisted` type guard). Deleted `OAuthFlush` component. Files: `src/app/onboarding/context.tsx`, `src/components/auth/flush-gate.tsx` (new), `src/components/auth/oauth-flush.tsx` (deleted), `src/app/onboarding/layout.tsx`, `src/app/onboarding/4/page.tsx`, `src/app/onboarding/4a/page.tsx`, `src/app/onboarding/signup/page.tsx`, `src/app/onboarding/success/page.tsx`.
- T4: Lint + build pass.

---

### Story 6.4 — Onboarding State Persistence Hardening

**Status:** done
**Design Refs:** —
**Story:** As the founder, I want my onboarding data to be properly lifecycle-managed — stale drafts detected, cross-tab sync working, and data never lost on failure — so that the onboarding experience is robust and reliable.

**Background:** After the Story 6.3 architecture overhaul, a localStorage persistence audit identified 8 holes where stale data could survive across sessions, causing users to never see a fresh Step 1 even after their server data was deleted.

**Acceptance Criteria (EARS):**

- AC1: FlushGate shall only clear localStorage after confirmed POST + GET success. Any failure shall preserve local data and show a retry UI.
- AC2: Step 1 shall check auth state on mount. If user is authenticated with an existing waitlist, redirect to dashboard.
- AC3: Step 3 shall check auth state before routing. If already authenticated, skip signup page and flush directly to server.
- AC4: A sessionStorage flag shall distinguish "cold landing with stale draft" from "mid-flow navigation". Cold landings shall show a resume prompt.
- AC5: The resume prompt shall allow the user to "Continue" (restore draft) or "Start Fresh" (clear localStorage + session flag).
- AC6: Cross-tab sync shall re-hydrate React state from localStorage when another tab writes.
- AC7: The persist effect shall not write to localStorage when `waitlistId` is set (server owns the data).
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) FlushGate ordering fix · T2 (AC2-AC3) Auth checks · T3 (AC4-AC5) Resume prompt · T4 (AC6-AC7) Cross-tab sync + persist guard · T5 (AC8) Run lint + build

**Out of scope:** Logout clear (no sign-out handler exists yet), server-side unique constraint on `user_id` (database migration, Sprint 2), incognito/cross-device resume (different feature scope).

**Audit Findings (from Claude Chat analysis):**

1. **Abandon + return within TTL** — `LocalOnboardingProvider` restored data unconditionally on cold landing. Fixed with session-flag resume prompt.
2. **FlushGate data loss on failure** — localStorage was cleared before confirming POST+GET success. Fixed with ordering fix.
3. **flushToAPI persistence race** — `setState` inside `flushToAPI` triggered the persist effect, re-writing data to localStorage after clear. Fixed with persist guard (skip when `waitlistId` set).
4. **Authenticated user re-entering Phase A** — No check for existing waitlist. Fixed with Step 1 auth check + Step 3 conditional boundary.
5. **Cross-tab blindness** — Tabs were fully independent. Fixed with `storage` event listener.
6. **Resume prompt immovable** — Initial implementation used immutable `useState` initializer. Fixed with mutable `setResumeState`.

**Dev Notes:**

- T1: FlushGate — Restructure to: POST → confirm 2xx → GET → confirm success → clear localStorage. Error state shows retry button. Only redirect to Step 1 when GET 404 with no local data. Files: `src/components/auth/flush-gate.tsx`.
- T2: Auth checks — Step 1: `supabase.auth.getUser()` → if user + waitlist exists → redirect to dashboard. Step 3: Same check → if authenticated, call `flushToAPI` directly and route to Step 4 instead of signup. Files: `src/app/onboarding/1/page.tsx`, `src/app/onboarding/3/page.tsx`.
- T3: Resume prompt — `SESSION_FLAG_KEY` in sessionStorage, set by `LocalOnboardingProvider` on mount with restored data. `hasStaleDraft()` exported from context. Step 1 lazy initializer checks and shows prompt. `clearDraft()` clears both localStorage + session flag. Files: `src/app/onboarding/context.tsx`, `src/app/onboarding/1/page.tsx`.
- T4: Cross-tab — `storage` event listener merges data from other tabs. Persist guard — `useEffect` returns early when `state.waitlistId` is truthy. Files: `src/app/onboarding/context.tsx`.
- T5: Lint + build pass.

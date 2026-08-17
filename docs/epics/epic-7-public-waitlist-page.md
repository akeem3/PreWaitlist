# Epic 7 — Public Waitlist Page & Foundation

**Status:** ready
**Source:** [PRD S2a Sprint 2](../PRD.md#2a-sprint-2--public-page-dashboard-active), [PRD S7.4 Data Model](../PRD.md#74-data-model--implementation-grade), [PRD S7.5 Route/Handler List](../PRD.md#75-route--handler-list), [PRD S7.6 Component Tree](../PRD.md#76-component-tree-high-level)

## Design References

| Reference          | File                                                          |
| ------------------ | ------------------------------------------------------------- |
| Public leaderboard | `docs/design/High-fidelity-Sprit2/public_leaderboard_HF3.svg` |

## Goal

A visitor can land on a founder's public waitlist page, see the page rendered with the founder's chosen template, sign up with their email (optionally answering qualification questions), and be stored as a subscriber with a unique referral code and position number. The public leaderboard and founder updates feed display on the public page.

## Definition of Done

The `/:subdomain` route renders the founder's waitlist page using their chosen template (minimal/bold/dark). A visitor can enter their email, optionally answer qualification questions, and submit. The system creates a subscriber record with a unique referral code, assigns a position, prevents duplicate emails per waitlist, and redirects to the thank-you page. The public leaderboard route renders subscriber data ranked by referral count. The founder updates feed displays on the public page.

## Story Index

| ID  | Title                          | Depends on | Status |
| --- | ------------------------------ | ---------- | ------ |
| 7.0 | Subscribers Table & API        | —          | ready  |
| 7.1 | Public Waitlist Page Route     | 7.0        | ready  |
| 7.2 | Email Capture Form             | 7.0        | ready  |
| 7.3 | Inline Qualification Questions | 7.0        | ready  |
| 7.4 | Duplicate Email Handling       | 7.0        | ready  |
| 7.5 | Public Leaderboard Page        | 7.0        | ready  |
| 7.6 | Founder Updates Feed Display   | 7.0        | ready  |
| 7.7 | Epic 7 Tests                   | 7.0–7.6    | ready  |

Work through these in dependency order, one at a time. Story 7.0 must be complete before 7.1–7.6 begin. Stories 7.1–7.6 can be worked in any order after 7.0 is done. Story 7.7 must be the last story — it tests everything built in 7.0–7.6. Each has a `status` you should update as you go (`ready` → `in-progress` → `blocked` or `done`). A story marked `blocked` stays blocked until manually cleared — don't silently re-attempt it next session.

---

### Story 7.0 — Subscribers Table & API

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As the founder, I want a subscribers table and API routes so that visitors can sign up for my waitlist and I can manage subscriber data.

**Acceptance Criteria (EARS):**

- AC1: The system shall create a `subscribers` table with columns: id (uuid PK), waitlist_id (FK to waitlists), email (text, not null), referral_code (text, not null, unique), referrer_id (FK to subscribers, nullable), position (integer, not null), qual_answers (jsonb, nullable), created_at (timestamptz).
- AC2: The system shall enforce a unique constraint on (waitlist_id, email) to prevent duplicate signups per waitlist.
- AC3: The system shall enable Row-Level Security on the `subscribers` table with a policy allowing founders to manage their own waitlist's subscribers (joining through waitlists to check founder_id), and a public read policy for leaderboard access.
- AC4: The system shall provide a `POST /api/subscribers` route handler that creates a subscriber with auto-generated unique referral_code, assigns the next available position, and returns the subscriber record.
- AC5: The system shall provide a `GET /api/leaderboard/:subdomain` route handler that returns subscribers ranked by referral count for a given waitlist.
- AC6: The system shall provide a `GET /api/subscribers/:id` route handler that returns a single subscriber with position, referral count, and qual answers.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Create subscribers table DDL + RLS · T2 (AC4) POST /api/subscribers route · T3 (AC5) GET /api/leaderboard route · T4 (AC6) GET /api/subscribers/:id route · T5 (AC7) Lint + build

**Out of scope:** Public page rendering (Story 7.1), email capture form (Story 7.2), thank-you page (Epic 8), email sending (Epic 11).

**Dev Notes:**

- T1: DDL already defined in PRD S7.4. Follow the child-table RLS pattern: join through waitlists to check founder_id. Add public read policy for leaderboard (anon users can view subscribers for a waitlist).
- T2: Referral code generation: use `crypto.randomUUID()` or similar, truncate to 8 chars, ensure uniqueness via retry loop. Position assignment: `SELECT COALESCE(MAX(position), 0) + 1 FROM subscribers WHERE waitlist_id = $1`.
- T3: Leaderboard query: join subscribers with waitlists on subdomain, return email (anonymized), referral_code, position, qual_answers. Order by referral count descending.
- T4: Simple lookup by id with founder ownership check via waitlists join.

---

### Story 7.1 — Public Waitlist Page Route

**Status:** ready
**Design Refs:** — (no high-fidelity SVG yet for public waitlist page)

**Story:** As a visitor, I want to land on a founder's public waitlist page so that I can learn about their product and sign up.

**Acceptance Criteria (EARS):**

- AC1: The system shall render `/:subdomain` as a public route that displays the founder's waitlist page.
- AC2: The system shall fetch the waitlist record by subdomain and return a 404 if not found.
- AC3: The system shall render the page using the founder's chosen template (minimal/bold/dark).
- AC4: The system shall display the founder's headline, subheadline, logo (if uploaded), and CTA text.
- AC5: The system shall render the page responsive on mobile and desktop viewports.
- AC6: The system shall include the "Powered by PreWaitlist" footer when tier = Free, using the shared `PoweredByFooter` component (Standing Decision 6).
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Create /:subdomain route with data fetching · T2 (AC3-AC4) Render template with founder content · T3 (AC5) Responsive layout · T4 (AC6) PoweredByFooter conditional render · T5 (AC7) Lint + build

**Out of scope:** Email capture form (Story 7.2), qualification questions (Story 7.3), thank-you page (Epic 8), leaderboard (Story 7.5).

**Dev Notes:**

- T1: Use Next.js dynamic route `app/(public)/[subdomain]/page.tsx`. Fetch waitlist by subdomain in server component. Handle 404 with `notFound()`.
- T2: Reuse template rendering logic from LivePreview component (`components/onboarding/live-preview.tsx`) — extract shared template rendering.
- T4: Import PoweredByFooter from `components/share/powered-by-footer.tsx`. Render when `waitlist.founder_profiles.tier === 'free'`.

---

### Story 7.2 — Email Capture Form

**Status:** ready
**Design Refs:** — (no high-fidelity SVG yet for email capture)

**Story:** As a visitor, I want to enter my email address on the public waitlist page so that I can join the waitlist.

**Acceptance Criteria (EARS):**

- AC1: The system shall render an email input field with the founder's CTA text as the submit button label.
- AC2: The system shall validate email format client-side before submission using the pattern `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`.
- AC3: The system shall submit the email to `POST /api/subscribers` on form submit.
- AC4: The system shall display a loading state while the submission is in progress.
- AC5: The system shall redirect to `/:subdomain/thank-you` on successful submission, passing subscriber_id and referral_code as query params.
- AC6: The system shall display the subscriber's position and referral link on the thank-you page (Epic 8).
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Email input + validation · T2 (AC3-AC4) Form submission + loading state · T3 (AC5-AC6) Thank-you redirect with data · T4 (AC7) Lint + build

**Out of scope:** Qualification questions (Story 7.3), duplicate email handling (Story 7.4), share buttons (Epic 8).

**Dev Notes:**

- T1: Use existing `Input` component from `components/ui/input.tsx`. Email validation regex per PRD S7.4 constraint.
- T3: Pass subscriber_id and referral_code as query params to thank-you page, or store in session/cookie for the redirect.

---

### Story 7.3 — Inline Qualification Questions

**Status:** ready
**Design Refs:** — (no high-fidelity SVG yet for qual questions)

**Story:** As a founder, I want to display optional qualification questions on my public waitlist page so that I can learn more about my subscribers before launch.

**Acceptance Criteria (EARS):**

- AC1: The system shall fetch qualification questions for the waitlist and display them inline on the signup form, below the email field.
- AC2: Each question shall render as either a text input (free_text) or a dropdown (multiple_choice) based on question_type.
- AC3: Questions marked as optional shall display "(optional)" in the design system's secondary text color.
- AC4: The system shall enforce tier-based question caps: Free = 2 questions, Pro = 5, Growth = unlimited (read from founder's tier field, not hardcoded).
- AC5: The system shall collect answers as a JSON object and store them in the subscriber's qual_answers column.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Fetch + render questions by type · T2 (AC3) Optional indicator styling · T3 (AC4-AC5) Collect answers + store as JSON · T4 (AC6) Lint + build

**Out of scope:** Question configuration UI (onboarding Step 4a, Sprint 1 complete), email sending (Epic 11).

**Dev Notes:**

- T1: Fetch questions from `qualification_questions` table where waitlist_id matches. Render based on `question_type`.
- T3: qual_answers format: `{ "question_id": "answer_text" }`. Store as JSONB in subscribers table.

---

### Story 7.4 — Duplicate Email Handling

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As a visitor, I want to see a clear error if I try to sign up with an email that's already on the waitlist, so that I know I'm already signed up.

**Acceptance Criteria (EARS):**

- AC1: The system shall check for an existing subscriber with the same email on the same waitlist before creating a new subscriber.
- AC2: If a duplicate email is detected, the system shall return a 409 Conflict response with a user-friendly error message.
- AC3: The system shall display the error message inline below the email field, using the design system's error styling.
- AC4: The system shall not reveal whether the email exists for security purposes (generic message like "This email is already on the waitlist").
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Server-side duplicate check + 409 response · T2 (AC3-AC4) Client-side error display · T3 (AC5) Lint + build

**Out of scope:** Password reset flows (not applicable — email-only signup), account merging (not applicable).

**Dev Notes:**

- T1: Use the unique constraint on (waitlist_id, email) as the primary guard. Catch the unique violation error and return a friendly message.
- T2: Use existing error styling from Input component (`error` prop).

---

### Story 7.5 — Public Leaderboard Page

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/public_leaderboard_HF3.svg`

**Story:** As a visitor, I want to see a public leaderboard showing subscribers ranked by referral count so that I can see how popular the waitlist is and where I stand.

**Design Specs (from analysis):**

- **Layout:** Full-width, 1440px viewport, background `#FAF8F4`
- **Header:** White bar with border `#CCC9C3`, 73px height, centered heading
- **Table:** Ranked list with horizontal dividers (`#1C1917`), columns for position, name, referral count
- **Milestone badges:** Dashed-border cards with `#0F7A5E` text for milestone achievements
- **Email anonymization:** First character + dots + last character (e.g., "j••••m")

**Acceptance Criteria (EARS):**

- AC1: The system shall render `/:subdomain/leaderboard` as a public route displaying a ranked list of subscribers.
- AC2: The system shall display each subscriber's position number, display name (or anonymized email if no name), and referral count.
- AC3: The system shall display milestone badges for subscribers who have reached referral thresholds (from founder's milestone_rewards config).
- AC4: The system shall sort subscribers by referral count descending, then by signup date ascending (earlier = higher rank for ties).
- AC5: The system shall anonymize emails for subscribers who skipped the optional name field (first char + "••••" + last char convention).
- AC6: The page shall be responsive on mobile and desktop.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Leaderboard route + data fetching · T2 (AC3) Milestone badge display · T3 (AC4) Sort logic · T4 (AC5) Email anonymization · T5 (AC6) Responsive layout · T6 (AC7) Lint + build

**Out of scope:** Real-time leaderboard updates (Sprint 3), quality score display (Sprint 3), warmth indicators (Sprint 3).

**Dev Notes:**

- T1: Fetch from `GET /api/leaderboard/:subdomain` (Story 7.0). Display in a table/list format.
- T3: Primary sort: `referral_count DESC`. Secondary sort: `created_at ASC`.
- T5: Email anonymization: take first char + `"••••"` + last char. Example: `"john@example.com"` → `"j••••m"`.

---

### Story 7.6 — Founder Updates Feed Display

**Status:** ready
**Design Refs:** — (no high-fidelity SVG yet for updates feed)

**Story:** As a visitor, I want to see the founder's updates feed on the public waitlist page so that I can stay informed about the product's progress.

**Acceptance Criteria (EARS):**

- AC1: The system shall fetch founder_updates for the waitlist and display them on the public page.
- AC2: Each update shall display the body text and created_at timestamp.
- AC3: Updates shall be sorted by created_at descending (newest first).
- AC4: If no updates exist, the system shall not render the updates section at all.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Fetch + render updates · T2 (AC3) Sort logic · T3 (AC4) Empty state handling · T4 (AC5) Lint + build

**Out of scope:** Update creation UI (Sprint 1 complete — POST /api/updates), update editing/deletion (not planned).

**Dev Notes:**

- T1: Fetch from `founder_updates` table where waitlist_id matches. Render in a list/feed format.
- T4: Conditional rendering — only show section if `updates.length > 0`.

---

### Story 7.7 — Epic 7 Tests

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As the founder, I want comprehensive tests for all Epic 7 components and API routes so that the public waitlist page, email capture, qualification questions, leaderboard, and updates feed work correctly and don't regress.

**Test Infrastructure:** Vitest + @testing-library/react for component tests, Playwright for e2e tests. Config: `vitest.config.mts` (happy-dom, `src/**/*.test.{ts,tsx}`). Test location: `src/__tests__/components/` for unit tests, `tests/e2e/` for e2e tests. Setup: `src/__tests__/setup.ts` (clipboard mock, cleanup). Pattern: `@testing-library/react` + `@testing-library/user-event` + `vitest`.

**Acceptance Criteria (EARS):**

- AC1: The system shall have component tests for the email capture form (`components/public/email-capture-form.tsx`) covering: renders email input, validates email format, shows loading state during submission, displays error on duplicate email, calls onSubmit with email value.
- AC2: The system shall have component tests for the qualification questions component (`components/public/qual-questions.tsx`) covering: renders text input for free_text questions, renders dropdown for multiple_choice questions, shows "(optional)" label for optional questions, enforces tier-based question caps.
- AC3: The system shall have component tests for the leaderboard table (`components/public/leaderboard-table.tsx`) covering: renders ranked list, sorts by referral count descending, anonymizes emails correctly, displays milestone badges.
- AC4: The system shall have component tests for the social proof counter (`components/public/social-proof-counter.tsx`) covering: displays subscriber count, displays "X people ahead of you" text.
- AC5: The system shall have API route tests for `POST /api/subscribers` covering: creates subscriber with valid data, returns 409 on duplicate email, generates unique referral_code, assigns sequential position.
- AC6: The system shall have API route tests for `GET /api/leaderboard/:subdomain` covering: returns subscribers ranked by referral count, returns empty array for unknown subdomain.
- AC7: The system shall have an e2e test (`tests/e2e/public-waitlist.spec.ts`) covering: visitor can land on `/:subdomain`, fill email, submit, and see thank-you page.
- AC8: All tests shall pass with `pnpm test` and `pnpm test:e2e` (if e2e env configured).
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Email capture form component tests · T2 (AC2) Qual questions component tests · T3 (AC3) Leaderboard table component tests · T4 (AC4) Social proof counter component tests · T5 (AC5) POST /api/subscribers route tests · T6 (AC6) GET /api/leaderboard route tests · T7 (AC7) E2E public waitlist flow test · T8 (AC8-AC9) Run all tests + lint + build

**Out of scope:** Tests for Epic 8 features (thank-you page, referral tracking, share buttons — covered in Story 8.5), tests for Epic 10 dashboard features, tests for Epic 11 email features.

**Dev Notes:**

- T1: Create `src/__tests__/components/email-capture-form.test.tsx`. Mock `POST /api/subscribers` with `vi.fn()`. Test rendering, validation, loading state, error display, submit callback.
- T2: Create `src/__tests__/components/qual-questions.test.tsx`. Render with mock questions array. Test input types, optional labels, cap enforcement.
- T3: Create `src/__tests__/components/leaderboard-table.test.tsx`. Render with mock subscriber array. Test sorting, email anonymization (`"john@example.com"` → `"j••••m"`), milestone badges.
- T4: Create `src/__tests__/components/social-proof-counter.test.tsx`. Test count display, "ahead of you" text.
- T5: Create `src/__tests__/api/subscribers.test.ts`. Mock Supabase client. Test POST handler with valid data, duplicate email (409), referral_code generation, position assignment.
- T6: Create `src/__tests__/api/leaderboard.test.ts`. Mock Supabase client. Test GET handler with valid subdomain, unknown subdomain.
- T7: Create `tests/e2e/public-waitlist.spec.ts`. Use Playwright to navigate to `/:subdomain`, fill email form, submit, verify redirect to thank-you page.
- T8: Run `pnpm test` for unit tests, `pnpm lint` for linting, `pnpm build` for build verification.

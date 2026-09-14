# Epic 12.2 — Gap Fixes

**Status:** ready (0/13 stories implemented)
**Source:** [Sprint Gap Analysis](../sprint-gap-analysis.md), [PRD §2c Sprint 3.2](../PRD.md#2c-sprint-32--gap-fixes)

## Goal

Close 7 legal compliance and 6 product gaps that must be in place before MVP can ship. Legal gaps (privacy policy, terms of service, consent, unsubscribe, bounce suppression, physical address) are non-negotiable for GDPR/CCPA/CAN-SPAM compliance. Product gaps (archive waitlist, edit page, settings danger zone, PoweredByFooter Pro removal, dashboard auto-refresh, subscriber display name) are founder-expected functionality or UX polish.

## Definition of Done

All 13 gaps closed. Privacy policy and terms of service pages exist and are linked from the marketing footer. Consent is tracked on subscriber signup. Every email includes unsubscribe link and physical address. Bounces are suppressed from re-send. Founders can archive their waitlist and edit their page after onboarding. PoweredByFooter never appears on Pro-tier pages. Dashboard auto-refreshes when new subscribers join. Thank-you page has an optional "What should we call you?" field with auto-save. All changes are tested.

## Story Index

| ID      | Title                       | Depends on    | Status |
| ------- | --------------------------- | ------------- | ------ |
| 12.2.0  | Schema Migration            | —             | ready  |
| 12.2.1  | Archive Waitlist            | 12.2.0        | ready  |
| 12.2.2  | Edit After Onboarding       | —             | ready  |
| 12.2.3  | Privacy Policy              | —             | ready  |
| 12.2.4  | Terms of Service            | 12.2.3        | ready  |
| 12.2.5  | Consent Tracking            | 12.2.0        | ready  |
| 12.2.6  | Unsubscribe Mechanism       | —             | ready  |
| 12.2.7  | Bounce Suppression          | —             | ready  |
| 12.2.8  | Physical Address in Emails  | —             | ready  |
| 12.2.9  | Epic 12.2 Tests             | 12.2.0–12.2.8 | ready  |
| 12.2.10 | PoweredByFooter Pro Removal | —             | ready  |
| 12.2.11 | Dashboard Auto-Refresh      | —             | ready  |
| 12.2.12 | Subscriber Display Name     | 12.2.0        | ready  |

---

### Story 12.2.0 — Schema Migration

**Status:** ready

**Story:** As the system, I need new database columns and tables to support consent tracking, archive status, and bounce suppression.

**Acceptance Criteria (EARS):**

- AC1: The `subscribers` table shall have a new column `consent_given_at timestamptz nullable` — set on signup when the consent checkbox is checked.
- AC2: The `subscribers` table shall have a new column `consent_ip_address text nullable` — captures IP at signup for GDPR audit trail.
- AC3: The `subscribers` table shall have a new column `unsubscribed_at timestamptz nullable` — set when subscriber clicks unsubscribe link.
- AC4: The `waitlists` table shall have a new column `is_archived boolean default false` — set when founder archives the waitlist.
- AC5: The `waitlists` table shall have a new column `archived_at timestamptz nullable` — set when archived.
- AC6: A new table `bounced_emails` shall be created with columns: `id uuid primary key default gen_random_uuid()`, `waitlist_id uuid not null references waitlists(id) on delete cascade`, `email text not null`, `email_type text not null check (email_type in ('confirmation','broadcast'))`, `bounce_type text not null check (bounce_type in ('hard','soft'))`, `created_at timestamptz not null default now()`.
- AC7: RLS policies on `bounced_emails`: founders can manage own (select, insert, delete), service role can insert.
- AC8: All columns shall be nullable or have defaults — no migration shall break existing rows.
- AC9: The migration SQL shall be idempotent (use `IF NOT EXISTS` / `IF EXISTS`).
- AC10: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC5) Subscribers and waitlists columns · T2 (AC6-AC7) Bounced emails table + RLS · T3 (AC8-AC9) Idempotency + defaults · T4 (AC10) Lint + build

**Out of scope:** Consent checkbox UI (Story 12.2.5), unsubscribe UI (Story 12.2.6), bounce handling logic (Story 12.2.7).

**Dev Notes:**

- T1: SQL: `ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS consent_given_at timestamptz; ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS consent_ip_address text; ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz; ALTER TABLE waitlists ADD COLUMN IF NOT EXISTS is_archived boolean default false; ALTER TABLE waitlists ADD COLUMN IF NOT EXISTS archived_at timestamptz;` **Status: written in SQL file but NOT executed in database — no code references these columns.**
- T2: Create `bounced_emails` table with RLS. See SQL writeup for full DDL. **Status: SQL written at `docs/stories/sql-writeups/epic12.2-story0-bounced-emails.sql`, NOT executed.**
- T3: All `ADD COLUMN IF NOT EXISTS` ensures idempotency. Existing rows get NULL for nullable columns, `false`/`NULL` for archived columns.
- T4: Run migration in Supabase Dashboard SQL Editor. **Status: NOT yet run. Must execute before dependent stories (12.2.1, 12.2.5, 12.2.7) can proceed.**

---

### Story 12.2.1 — Archive Waitlist

**Status:** ready

**Story:** As a founder, I want to archive my waitlist so that I can deactivate it without deleting data.

**Acceptance Criteria (EARS):**

- AC1: The settings page shall display an "Archive Waitlist" button in a danger zone section at the bottom of the page.
- AC2: Clicking "Archive Waitlist" shall show a confirmation dialog: "Archiving your waitlist will stop new signups and hide your public page. This can be undone. Continue?"
- AC3: On confirmation, the system shall call `PATCH /api/waitlist` with `{ is_archived: true, archived_at: new Date().toISOString() }`.
- AC4: When `is_archived === true`, the public waitlist page (`/:subdomain`) shall return a 410 Gone status with a message: "This waitlist is no longer active."
- AC5: When archived, the sidebar shall display a banner: "This waitlist is archived. [Unarchive]" at the top.
- AC6: The founder shall be able to unarchive by calling `PATCH /api/waitlist` with `{ is_archived: false, archived_at: null }`.
- AC7: Archived waitlists shall NOT appear in any public listings or search results.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Archive button + confirmation dialog · T2 (AC3) API call + state update · T3 (AC4) Public page archived state · T4 (AC5-AC6) Sidebar banner + unarchive · T5 (AC7) Guard against public listing · T6 (AC8) Lint + build

**Out of scope:** Bulk archive, permanent deletion, archive reason collection.

**Dev Notes:**

- T1: In `settings/client.tsx`, add a danger zone section at the bottom with `border-destructive/20`, archive button using `Button variant="destructive"`. **Status: NOT implemented — settings client has no archive button or danger zone.**
- T2: `window.confirm()` for simplicity. On confirm: `fetch("/api/waitlist", { method: "PATCH", body: JSON.stringify({ is_archived: true }) })`. **Status: NOT implemented — API route has no `is_archived` handling.**
- T3: In the public page, check `waitlist.is_archived` and render 410 status. **Status: NOT implemented — `src/app/(public)/[subdomain]/page.tsx` has no archived check.**
- T4: In `sidebar.tsx`, check `isArchived` prop. When true, render amber banner with "Unarchive" button. **Status: NOT implemented — sidebar has no `isArchived` prop or banner.**
- **Depends on:** Story 12.2.0 (schema migration must run first for `is_archived`/`archived_at` columns to exist).

---

### Story 12.2.2 — Edit After Onboarding

**Status:** ready

**Story:** As a founder, I want to edit my waitlist page after onboarding so that I can update content without recreating everything.

**Acceptance Criteria (EARS):**

- AC1: The settings page shall display editable fields for: headline, subheadline, CTA text, brand color, logo URL, sender name.
- AC2: Each field shall have a "Save" button that calls `PATCH /api/waitlist` with the updated value.
- AC3: On successful save, the system shall display a brief success message that disappears after 3 seconds.
- AC4: On error, the system shall display the error message inline below the field.
- AC5: The live preview in settings shall update in real-time as the founder edits fields.
- AC6: The brand color field shall use the existing color picker component from onboarding Step 3.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Editable fields with save buttons · T2 (AC3-AC4) Success/error feedback · T3 (AC5-AC6) Live preview + color picker · T4 (AC7) Lint + build

**Out of scope:** Template switching, qualification question editing, milestone reward editing.

**Dev Notes:**

- T1: In `settings/client.tsx`, replace static display with `<Input>` components pre-filled with current values. Each field gets its own save button. **Status: PARTIALLY implemented — `senderName` field exists with save button (line 19-29). `coldThreshold` field also exists. Missing: headline, subheadline, CTA text, brand color, logo URL fields. Also: `settings/page.tsx` only selects `id, sender_name, cold_threshold, sending_domain` — does not fetch headline/subheadline/brand_color/logo_url/cta_text.**
- T2: Add `success` state per field with `setTimeout` to clear after 3s. **Status: PARTIALLY implemented — senderName uses 2s timeout (line 46-47). Pattern can be reused.**
- T3: Import `LivePreview` and pass edited values. Reuse color picker from onboarding Step 3. **Status: NOT implemented — no live preview or color picker in settings.**

---

### Story 12.2.3 — Privacy Policy

**Status:** ready

**Story:** As a founder, I need a privacy policy page so that my waitlist complies with GDPR and CCPA.

**Acceptance Criteria (EARS):**

- AC1: The system shall render `/legal/privacy` as a static page with a complete privacy policy covering: data collection, data usage, data storage, data sharing, user rights, cookie usage, and contact information.
- AC2: The privacy policy shall mention Resend as the email delivery sub-processor.
- AC3: The privacy policy shall include a "Last updated" date.
- AC4: The privacy policy shall be written in plain English at an 8th-grade reading level.
- AC5: The marketing footer shall include a "Privacy" link pointing to `/legal/privacy`.
- AC6: The public waitlist page footer shall include a "Privacy" link.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC4) Privacy policy page content · T2 (AC5-AC6) Footer links · T3 (AC7) Lint + build

**Out of scope:** GDPR consent banners, DPAs, cookie policy, legal review.

**Dev Notes:**

- T1: Create `src/app/legal/privacy/page.tsx` as a server component with `max-w-2xl mx-auto py-12 px-6` layout. **Status: NOT implemented — file does not exist, `src/app/legal/` directory does not exist.**
- T2: Add Privacy link to marketing footer and PoweredByFooter. **Status: PARTIALLY implemented — marketing footer has `<Link href="#">Privacy</Link>` (dead placeholder at line 228). PoweredByFooter has NO Privacy link.**

---

### Story 12.2.4 — Terms of Service

**Status:** ready

**Story:** As a founder, I need a terms of service page so that my waitlist has clear usage terms.

**Acceptance Criteria (EARS):**

- AC1: The system shall render `/legal/terms` as a static page with terms covering: service description, acceptable use, account responsibility, intellectual property, limitation of liability, termination rights, and governing law.
- AC2: The terms shall reference the privacy policy.
- AC3: The terms shall include a "Last updated" date.
- AC4: The marketing footer shall include a "Terms" link.
- AC5: The public waitlist page footer shall include a "Terms" link.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Terms of service page content · T2 (AC4-AC5) Footer links · T3 (AC6) Lint + build

**Out of scope:** Legal review, DPA, SLA terms.

**Dev Notes:**

- T1: Create `src/app/legal/terms/page.tsx`. Same layout as privacy policy. **Status: NOT implemented — file does not exist.**
- T2: Same footer updates as Story 12.2.3. **Status: PARTIALLY implemented — marketing footer has `<Link href="#">Terms</Link>` (dead placeholder at line 234). PoweredByFooter has NO Terms link.**

---

### Story 12.2.5 — Consent Tracking

**Status:** ready

**Story:** As a founder, I need subscriber consent to be tracked at signup for GDPR compliance.

**Acceptance Criteria (EARS):**

- AC1: The public waitlist email capture form shall include a checkbox: "I agree to receive email updates about this product. You can unsubscribe at any time."
- AC2: The checkbox shall be unchecked by default.
- AC3: The checkbox shall be required — the form cannot be submitted without checking it.
- AC4: On form submission, the system shall set `consent_given_at` to the current timestamp and `consent_ip_address` to the subscriber's IP.
- AC5: The IP address shall be captured from `x-forwarded-for` or `x-real-ip` headers.
- AC6: If consent is not given, the form shall show an inline error.
- AC7: The consent checkbox shall use native `<input type="checkbox">` with `accent-color: var(--color-accent)`.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Consent checkbox in email capture form · T2 (AC4-AC5) API consent fields + IP capture · T3 (AC6) Validation error · T4 (AC7) Styling · T5 (AC8) Lint + build

**Out of scope:** Consent withdrawal UI, consent audit log, consent for founders.

**Dev Notes:**

- T1: Add checkbox below email input in the capture form with `required` attribute. **Status: NOT implemented — `components/public/email-capture-form.tsx` has no consent checkbox. Only has "No spam. Unsubscribe anytime." text.**
- T2: In `POST /api/subscribers`, add consent fields. Extract IP from headers. **Status: NOT implemented — `src/app/api/subscribers/route.ts` insert (lines 73-86) has no `consent_given_at` or `consent_ip_address` fields. No IP header reading.**
- T3: Client-side validation prevents submission without checkbox. **Status: NOT implemented.**
- **Depends on:** Story 12.2.0 (schema migration must run first for `consent_given_at`/`consent_ip_address` columns).

---

### Story 12.2.6 — Unsubscribe Mechanism

**Status:** ready

**Story:** As a subscriber, I want to unsubscribe from waitlist emails so that I can opt out of communication.

**Acceptance Criteria (EARS):**

- AC1: Every email shall include an unsubscribe link in the footer.
- AC2: The unsubscribe link shall be a unique URL: `/unsubscribe?token={subscriber_id_hmac}`.
- AC3: Clicking the link shall render a page confirming: "You have been unsubscribed from {waitlist_name} emails."
- AC4: On confirmation, `subscribers.unsubscribed_at` shall be set to the current timestamp.
- AC5: After unsubscribing, no more emails shall be sent to this subscriber.
- AC6: The unsubscribe page shall include a "Resubscribe" option.
- AC7: The mechanism shall comply with CAN-SPAM requirements.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Unsubscribe link in emails + HMAC · T2 (AC3-AC4) Unsubscribe page + logic · T3 (AC5) Send-time check · T4 (AC6) Resubscribe option · T5 (AC7-AC8) CAN-SPAM compliance + lint + build

**Out of scope:** One-click unsubscribe header, preference center, unsubscribe reason collection.

**Dev Notes:**

- T1: In `src/lib/email.ts`, add HMAC-based unsubscribe URL generation. Append to email footer. **Status: NOT implemented — `sendEmail()` has no footer template, no merge tags, no HMAC. Emails are bare HTML passed by callers.**
- T2: Create `src/app/unsubscribe/page.tsx`. Verify HMAC, update subscriber, show confirmation. **Status: NOT implemented — file does not exist.**
- T3: Check `unsubscribed_at IS NULL` before every send. **Status: NOT implemented — no pre-send check in `sendEmail()` or subscriber routes.**

---

### Story 12.2.7 — Bounce Suppression

**Status:** ready

**Story:** As the system, I need to suppress bounced email addresses so that we protect deliverability.

**Acceptance Criteria (EARS):**

- AC1: When Resend webhook reports bounce/complaint, insert into `bounced_emails` table.
- AC2: Classify bounces as `hard` or `soft`.
- AC3: Before sending, check if recipient exists in `bounced_emails` for same waitlist — skip if so.
- AC4: Dashboard shall display "Bounced" indicator in subscriber table.
- AC5: Hard bounces suppressed indefinitely. Soft bounces suppressed for 24 hours.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Webhook bounce handler · T2 (AC3) Send-time bounce check · T3 (AC4) Dashboard bounce indicator · T4 (AC5) Soft bounce retry logic · T5 (AC6) Lint + build

**Out of scope:** Bounce analytics dashboard, automatic list cleaning.

**Dev Notes:**

- T1: Extend existing webhook handler with `bounce` and `complain` events. **Status: PARTIALLY implemented — `src/app/api/webhooks/resend/route.ts` maps `email.bounced` → `"bounced"` and stores in `email_events` (line 97-103). Does NOT insert into `bounced_emails` table (table doesn't exist in DB yet). No hard/soft classification from webhook payload.**
- T2: Create `isEmailBounced(supabase, waitlistId, email)` helper. **Status: NOT implemented.**
- T3: Join or batch-query `bounced_emails` for subscriber table. **Status: NOT implemented — `bounced_emails` table not in DB.**
- **Depends on:** Story 12.2.0 (schema migration must run first for `bounced_emails` table).

---

### Story 12.2.8 — Physical Address in Emails

**Status:** ready

**Story:** As a founder, I need a physical postal address in my emails so that they comply with CAN-SPAM.

**Acceptance Criteria (EARS):**

- AC1: Every email shall include a physical postal address in the footer.
- AC2: Settings shall include a "Business Address" field.
- AC3: The address field is optional — PreWaitlist address used as fallback.
- AC4: The address renders in standard format.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Settings address field · T2 (AC2) Schema column + API · T3 (AC3-AC4) Email footer template · T4 (AC5) Lint + build

**Out of scope:** Address validation, multiple addresses.

**Dev Notes:**

- T1: Add "Business Address" input to settings. Save via `PATCH /api/waitlist`. **Status: NOT implemented — `settings/client.tsx` has no business address field.**
- T2: `ALTER TABLE waitlists ADD COLUMN IF NOT EXISTS business_address text nullable;`. **Status: SQL defined in `epic12.2-story0-bounced-emails.sql` (line 72) but NOT executed in DB. API route has no `business_address` handling.**
- T3: In email template footer, render address with fallback. **Status: NOT implemented — `src/lib/email.ts` has no footer template or address rendering.**

---

### Story 12.2.9 — Epic 12.2 Tests

**Status:** ready

**Story:** As the founder, I want comprehensive tests covering every Epic 12.2 component and API so that gap fixes are regression-proof.

**Test Infrastructure:** Vitest + @testing-library/react. Config: `vitest.config.mts`. Test location: `src/__tests__/`.

**Acceptance Criteria (EARS):**

- AC1: Component tests for archive waitlist: renders archive button, confirmation dialog, archived banner, unarchive.
- AC2: Component tests for edit after onboarding: editable fields, save buttons, success/error feedback, live preview.
- AC3: Component tests for consent checkbox: renders checkbox, required validation, consent captured.
- AC4: Component tests for unsubscribe page: renders confirmation, resubscribe option.
- AC5: API route tests for unsubscribe: verifies HMAC, updates subscriber, rejects invalid token.
- AC6: API route tests for bounce handling: inserts bounce record, skips bounced emails, soft bounce retry.
- AC7: Component tests for settings: business address field, error handling.
- AC8: Component tests for PoweredByFooter: tier gate (free shows, pro hides), standalone prop, template passthrough.
- AC9: Component tests for dashboard auto-refresh: visibility change triggers refresh, interval refresh.
- AC10: Component tests for subscriber display name: auto-save, debounce, saved feedback, leaderboard display.
- AC11: All tests pass with `pnpm test`.
- AC12: Lint and build pass with zero errors.
- AC13: Total test count ≥280.

**Tasks:** T1 (AC1) Archive tests · T2 (AC2) Edit tests · T3 (AC3) Consent tests · T4 (AC4-AC5) Unsubscribe tests · T5 (AC6) Bounce tests · T6 (AC7) Settings tests · T7 (AC8) PoweredByFooter tests · T8 (AC9) Dashboard refresh tests · T9 (AC10) Display name tests · T10 (AC11-AC13) Full verification

**Out of scope:** E2E tests, legal page content tests, visual regression tests.

**Dev Notes:**

- T1–T6: Create test files in `src/__tests__/components/` and `src/__tests__/api/`. Mock Supabase and fetch. **Status: NOT implemented — only pre-existing `dashboard-settings.test.tsx` exists (tests current settings, not 12.2 features). No archive, consent, unsubscribe, bounce, or edit test files exist.**
- T7: PoweredByFooter tests — verify tier gate, standalone prop, template passthrough. **Status: NOT implemented — no `powered-by-footer.test.tsx` exists.**
- T8: Dashboard auto-refresh tests — mock `router.refresh()`, verify visibility change triggers refresh, interval fires. **Status: NOT implemented.**
- T9: Display name tests — verify auto-save debounce, PATCH call, saved feedback, leaderboard name display. **Status: NOT implemented.**
- T10: Run `pnpm test`, `pnpm lint`, `pnpm build`. Verify ≥280 tests pass.

---

### Story 12.2.10 — PoweredByFooter Pro Removal

**Status:** ready

**Story:** As the founder on a Pro plan, I want the "Powered by PreWaitlist" footer to never appear on my public pages so that my brand looks independent.

**Acceptance Criteria (EARS):**

- AC1: The "Powered by PreWaitlist" footer shall render ONLY when `tier === "free"`. It shall NOT render on Pro-tier pages.
- AC2: The leaderboard page (`/:subdomain/leaderboard`) shall respect the tier gate — no footer for Pro tier.
- AC3: The leaderboard page shall use the waitlist's actual template (not hardcoded "minimal") for footer styling.
- AC4: The leaderboard page shall pass the `standalone` prop to prevent a white background band on warm ivory pages.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC4) Fix leaderboard PoweredByFooter rendering · T2 (AC5) Lint + build

**Out of scope:** Footer design changes, adding Privacy/Terms links to footer (covered by 12.2.3/12.2.4).

**Dev Notes:**

- **File:** `src/app/(public)/[subdomain]/leaderboard/page.tsx`
- **Bug found:** Line 112 renders `<PoweredByFooter template="minimal" />` with no tier gate, hardcoded template, and no `standalone` prop.
- **Fix:** Add `tier === "free"` gate, select `template` from waitlist query, extract `tier` from `founder_profiles` join, pass `standalone` prop.
- **All other usages are correct:** public waitlist page, thank-you page, and onboarding preview all gate on `tier === "free"` and pass correct props.
- **Component source:** `components/share/powered-by-footer.tsx` — props: `template` (required), `standalone` (optional).

---

### Story 12.2.11 — Dashboard Auto-Refresh

**Status:** ready

**Story:** As the founder, I want my dashboard to automatically reflect new subscribers without manual refresh so that I always see current data.

**Acceptance Criteria (EARS):**

- AC1: When the dashboard browser tab regains focus (user switches back), the dashboard data shall refresh automatically.
- AC2: When the dashboard tab stays open, data shall refresh at least every 60 seconds.
- AC3: The refresh shall update all dashboard panels: subscriber table, stat cards, chart, warmth distribution, leaderboard, qualification.
- AC4: The refresh shall not cause a full page reload — only the data portions shall update.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Focus-based + interval refresh via `router.refresh()` · T3 (AC3-AC4) Verify all panels update · T4 (AC5) Lint + build

**Out of scope:** Real-time WebSocket updates, Supabase Realtime subscriptions, per-subscriber push notifications.

**Dev Notes:**

- **File:** `src/app/dashboard/client.tsx`
- **Current state:** Dashboard is snapshot-at-load-time. Zero refresh mechanisms exist. No `router.refresh()`, no polling, no SWR, no `revalidatePath`.
- **Approach:** Add `useEffect` in `DashboardClient` that:
  1. Listens for `visibilitychange` event — calls `router.refresh()` when tab becomes visible
  2. Runs `setInterval(60_000)` — calls `router.refresh()` every 60 seconds
  3. Cleans up both on unmount
- **Why `router.refresh()`:** Next.js native. Re-fetches all server components for the current route without a full page navigation. The dashboard layout + page re-run server-side, client components receive new props. No new dependencies needed.
- **Why not Supabase Realtime:** Requires enabling Postgres replication on `subscribers` table, client-side subscription setup, and doesn't update stat cards (which are computed from batch queries, not single-table reads). `router.refresh()` updates everything in one call.
- **Loading state:** `src/app/dashboard/loading.tsx` already exists and renders a skeleton during server component re-render, so the user sees a brief skeleton flash during refresh.
- **Optional UX:** Show "Updated at HH:MM" or "Updated Xs ago" text in the dashboard header so the user knows data is fresh.

---

### Story 12.2.12 — Subscriber Display Name

**Status:** ready

**Story:** As a subscriber, I want to provide my name on the thank-you page after signing up so that I'm recognized on the leaderboard instead of showing as an anonymized email.

**Acceptance Criteria (EARS):**

- AC1: The `subscribers` table shall have a new column `display_name text nullable`.
- AC2: The thank-you page (both direct and referred variants) shall display an optional name input below the position text: "What should we call you? (optional)".
- AC3: The name input shall auto-save — no submit button. On blur and on debounced keystroke (500ms), the system shall PATCH the subscriber's `display_name`.
- AC4: The name input shall show inline save feedback: "Saving..." while in flight, "Saved" on success (fades after 2s).
- AC5: If the subscriber leaves the field blank, no API call shall be made — leaving blank IS the skip.
- AC6: The leaderboard shall display `display_name` if set, otherwise show the anonymized email.
- AC7: The referred variant thank-you page shall show the referrer's `display_name` if set, otherwise parse from email (current behavior).
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Schema migration · T2 (AC2-AC5) Name field with auto-save · T3 (AC6-AC7) Leaderboard + referred variant display · T4 (AC8) Lint + build

**Out of scope:** Name field on signup form (email-only per Standing Decision #1), name editing in dashboard settings, display name on public waitlist page.

**Dev Notes:**

- **Schema:** `ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS display_name text;` — add to `epic12.2-story0-bounced-emails.sql` or run separately.
- **API:** `POST /api/subscribers` — accept optional `display_name` in request body. Add or extend `PATCH /api/subscribers` to allow updating `display_name` by subscriber ID.
- **New component:** `components/public/name-field.tsx` — client component. Props: `{ subscriberId: string, initialName: string | null }`. Uses `useState` + `useEffect` with debounce (500ms). PATCHes to `/api/subscribers` on blur and on debounced change. Shows "Saving..." / "Saved" feedback.
- **Thank-you page changes:** `src/app/(public)/[subdomain]/thank-you/page.tsx` — render `<NameField>` below position text. Requires converting from pure Server Component to hybrid (Server Component shell + Client Component for name field).
- **Leaderboard changes:** `src/app/(public)/[subdomain]/leaderboard/page.tsx` — select `display_name` from subscribers query. Display `display_name` if set, else anonymized email (current `anonymizeEmail` behavior).
- **Referred variant:** Referrer name currently derived from email local part. If referrer has `display_name`, use that instead.
- **Auto-save pattern:** Simple `useEffect` + `setTimeout`/`clearTimeout` debounce. No library needed for a single field. Show "Saved ✓" briefly, fade with CSS transition.
- **PRD references:** Product Vision line 354 (thank-you page), User Flow Diagram lines 710-714 (optional name field spec).

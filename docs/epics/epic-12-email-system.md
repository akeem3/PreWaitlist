# Epic 12 — Email System

**Status:** ready
**Source:** [MVP Vision Module 4](../product-vision-mvp-waitlist-tool.md#module-4--email-system), [PRD §2a](../PRD.md#2a-sprint-2--public-page-dashboard-active), [PRD §7.1a](../PRD.md#71a-email-sending-architecture--resend)

## Goal

Wire up the complete email system: confirmation emails on signup, "you moved up" trigger emails on referral conversion, position recalculation, broadcast email to full list (Pro), warmth-segmented broadcast (Pro), and email customisation (sender name). All emails sent via Resend. Transactional and marketing emails use separate sending domains.

## Definition of Done

Every new subscriber receives a confirmation email with their position and referral link. When a referred subscriber signs up, the referrer's position moves up and they receive a "you moved up" email. Pro founders can compose and send broadcast emails to their full list or a warmth-segmented segment. Founders can customise their sender name. Transactional and marketing emails use separate sending domains.

## Story Index

| ID   | Title                              | Depends on | Status |
| ---- | ---------------------------------- | ---------- | ------ |
| 12.0 | Confirmation Email                 | 11.7       | ready  |
| 12.1 | Position Recalculation on Referral | —          | ready  |
| 12.2 | "You Moved Up" Trigger Email       | 12.0, 12.1 | ready  |
| 12.3 | Broadcast Email (Pro)              | 11.1, 11.7 | ready  |
| 12.4 | Warmth-Segmented Broadcast (Pro)   | 11.1, 12.3 | ready  |
| 12.5 | Email Customisation (Pro)          | 12.0       | ready  |
| 12.6 | Email Infrastructure Separation    | 11.7       | ready  |

**Execution order:** 12.1 MUST execute before 12.0 — the confirmation email (12.0) includes the subscriber's position number, which depends on the new recalculation logic from 12.1. 12.2 depends on both 12.0 and 12.1. 12.3 depends on 11.1 (warmth scores) and 11.7 (broadcasts table). 12.4 depends on 12.3 (extends compose screen). 12.5 depends on 12.0 (extends email utility). 12.6 depends on 11.7 (schema) and extends 12.0's email utility.

**Sequencing rationale:** 12.0 and 12.1 both modify `POST /api/subscribers`. Executing them in parallel guarantees merge conflicts. More critically, 12.0 sends the position number in the confirmation email — if 12.0 lands first, it sends emails with the old `maxPos + 1` position, then 12.1 recalculates and changes those positions, creating inconsistency. 12.1 must land first so 12.0 sends the correct position.

**Position recalculation approach (research-validated):** Use a single atomic PostgreSQL CTE+UPDATE with `ROW_NUMBER()` window function. This avoids race conditions (single-statement UPDATE acquires row-level locks atomically), avoids N+1 query patterns, and computes `referral_count` inline since it is not a DB column. See Story 12.1 Dev Notes for the exact SQL.

---

### Story 12.0 — Confirmation Email

**Status:** ready
**Design Refs:** None (transactional email, no UI surface)
**Story:** As a subscriber, I want to receive a confirmation email immediately after signing up so that I have my position number and referral link.

**Acceptance Criteria (EARS):**

- AC1: The system shall send a confirmation email via Resend immediately after a subscriber is created via `POST /api/subscribers`.
- AC2: The email shall include: position number ("You're #{position} in line"), referral link, share prompt.
- AC3: The email shall be branded with the founder's product name (`product_name` from the waitlist, falling back to `headline` if null), not "PreWaitlist".
- AC4: The email shall be sent from the founder's configured sender name (or default "PreWaitlist <notifications@prewaitlist.com>" if not customised).
- AC5: The email shall be sent via Resend's Emails API (transactional, single send — not Batch or Broadcast).
- AC6: If the email send fails, the subscriber shall still be created (email failure must not block signup).
- AC7: The system shall provide an email sending utility (`src/lib/email.ts`) that resolves the correct `from` address based on sender name and stream (transactional vs broadcast).
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC2-AC3) Build confirmation email template + brand resolution · T2 (AC4, AC7) Create email utility with from-address resolution + sender name fallback · T3 (AC1, AC5-AC6) Emails API integration + error handling · T4 (AC8) Log sent event to email_events · T5 (AC9) Lint + build

**Out of scope:** Position recalculation (Story 12.1), "you moved up" email (Story 12.2), broadcast emails (Story 12.3)

**Dev Notes:**

- T1: The `POST /api/subscribers` route already exists and creates the subscriber — add email send after insert and after position recalculation (Story 12.1). Chain email dispatch after the milestone check block (after line ~133).
- T1 (AC2): Email template: position + referral link + share CTA. Keep it short (3-5 lines). Confirmation emails are the highest-open-rate email you'll ever send (60-80%).
- T1 (AC3): Brand resolution: `waitlist.product_name` → `waitlist.headline` → "PreWaitlist" (hardcoded fallback). The `product_name` column exists on `waitlists` table.
- T2 (AC7): **Email utility:** Create `src/lib/email.ts` with `sendEmail({ to, subject, html, stream, senderName, productName, headline })`. The `stream` parameter ("transactional" | "broadcast") determines the `from` address: transactional → `notifications@prewaitlist.com`, broadcast → `updates@prewaitlist.com`. Sender name resolution: `senderName` → `productName` (from DB) → `headline` (from DB) → "PreWaitlist" (hardcoded fallback).
- T2: `src/lib/resend.ts` is currently a bare 9-line wrapper (`new Resend(apiKey)`) — do not modify, import from there.
- T3 (AC5): Use `resend.emails.send({ from, to, subject, html })` — single transactional send, not Batch API (Batch is for bulk sends of 100+).
- T3 (AC6): `try/catch` around Resend send, log error, don't throw — subscriber creation succeeds regardless. The confirmation email is best-effort.
- T1: Referral link format: `https://{subdomain}.prewaitlist.com?ref={referral_code}` — subdomain and referral_code are already available in the subscriber + waitlist data.
- T1: Log a `sent` event to `email_events` table after successful send (event_type: 'sent') — this feeds the warmth tracking engine (Story 11.1).
- T3: Variable names in route.ts: use `supabase` (not `supabaseAdmin`), `data` (not `newSubscriber`), `waitlist_id` (from body).

---

### Story 12.1 — Position Recalculation on Referral

**Status:** ready
**Design Refs:** None (algorithmic, no UI surface)
**Story:** As a subscriber, I want my position to move up when someone I referred signs up so that the referral system feels fair and rewarding.

**Acceptance Criteria (EARS):**

- AC1: When a new subscriber signs up with a valid `referral_code`, the referrer's position shall be recalculated.
- AC2: Position recalculation shall sort all subscribers in the waitlist by `referral_count DESC, created_at ASC` and reassign position numbers (1, 2, 3...).
- AC3: The referrer's new position shall be lower (closer to 1) than their previous position.
- AC4: Non-referred subscribers shall maintain their relative order based on signup time.
- AC5: Position recalculation shall happen synchronously during subscriber creation (not deferred).
- AC6: The number of spots moved up shall be calculated: `old_position - new_position`.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Implement position recalculation function (atomic CTE+UPDATE) · T2 (AC3-AC4) Verify referrer moves up, others maintain order · T3 (AC5-AC6) Sync execution in POST /api/subscribers + spots-moved calculation · T4 (AC7) Store old_position for trigger email · T5 (AC8) Lint + build

**Out of scope:** "You moved up" email trigger (Story 12.2), milestone position boost (already in `src/lib/milestones.ts`)

**Dev Notes:**

- T1: Create `src/lib/positions.ts` with `recalculatePositions(waitlistId, supabase)` and `getPositionUpdate(updates, subscriberId)`.
- T1: **Critical: Current position logic is append-only.** `POST /api/subscribers` (line 67-75) calculates `position = maxPos + 1` — it never recalculates existing subscribers' positions. Story 12.1 must REPLACE this logic with full recalculation. The `maxPos + 1` code becomes dead code after this story.
- T1: **Atomic CTE+UPDATE (research-validated):** Use a single PostgreSQL statement with `ROW_NUMBER()` window function. This eliminates race conditions (single-statement UPDATE acquires row-level locks atomically) and avoids N+1 query patterns. See Story 12.1 implementation details for the exact SQL.
- T1: `referral_count` is NOT a DB column — it's computed by counting `referrer_id` matches. The CTE pre-aggregates referral counts, then `ROW_NUMBER()` ranks subscribers by `COALESCE(count, 0) DESC, created_at ASC`.
- T3: Store `old_position` before recalculation to calculate spots moved for the trigger email (Story 12.2). The `recalculatePositions()` function fetches current positions first, runs the atomic UPDATE, then fetches updated positions to compute spots-moved.
- T3: This is the critical missing piece — the product vision says "position recalculation on referral" is a 🔵 Core feature.
- T1: Variable names in route.ts: `supabase` (from `createClient()`), `data` (insert result), `waitlist_id` (from body), `resolvedReferrerId` (from referral code resolution).

---

### Story 12.2 — "You Moved Up" Trigger Email

**Status:** ready
**Design Refs:** None (transactional email, no UI surface)
**Story:** As a referrer, I want to receive a "you moved up" email when someone I referred signs up so that I'm motivated to share more.

**Acceptance Criteria (EARS):**

- AC1: When a referrer's position improves due to a referral conversion, the system shall send a "You moved up {X} spots" email.
- AC2: The email shall include: new position number, spots moved, referral link (for continued sharing).
- AC3: The email shall be sent via Resend's Emails API (transactional, single send).
- AC4: The email shall only be sent when the referrer moves up by ≥1 spot (no email if position unchanged).
- AC5: The email shall be sent from the founder's configured sender name or default.
- AC6: If the email send fails, the position recalculation shall not be rolled back.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Build "moved up" email template + trigger logic · T2 (AC3) Resend Emails API integration · T3 (AC4-AC6) Minimum spots threshold + error handling + non-blocking · T4 (AC7) Log sent event to email_events · T5 (AC8) Lint + build

**Out of scope:** Position recalculation itself (Story 12.1), milestone congratulations emails (already in `src/lib/milestones.ts`)

**Dev Notes:**

- T1: Trigger: after `recalculatePositions()` in Story 12.1, check if the referrer's position improved. Chain into `POST /api/subscribers` after position recalculation and confirmation email.
- T1: `spots_moved = old_position - new_position` — only send email if > 0 (AC4).
- T1: Email template: "You moved up {spots_moved} spots! You're now #{new_position} in line. Keep sharing → {referral_link}".
- T2: Use `resend.emails.send()` — single transactional send (same pattern as Story 12.0).
- T3: Error handling: `try/catch`, log, don't block subscriber creation. Position recalculation is durable; email is best-effort.
- T1: Referral link: `https://{subdomain}.prewaitlist.com?ref={referral_code}` — need to fetch waitlist subdomain + subscriber referral_code.
- T1: Log a `sent` event to `email_events` table after successful send — feeds warmth tracking.
- T1: Variable references: use `resolvedReferrerId` (not `referrer_id`), `subscriberUpdate` (from `getPositionUpdate`), `supabase` (not `supabaseAdmin`).

---

### Story 12.3 — Broadcast Email (Pro)

**Status:** ready
**Design Refs:** None (dashboard UI, no high-fidelity SVG)
**Story:** As a Pro founder, I want to compose and send a broadcast email to all my subscribers so that I can communicate updates and launch announcements.

**Acceptance Criteria (EARS):**

- AC1: The dashboard shall display a "Broadcast" nav item that is active (clickable) for Pro founders and locked for Free founders.
- AC2: Clicking Broadcast shall open a compose screen with: subject line input, HTML body textarea, preview button, send button.
- AC3: The compose screen shall show the subscriber count ("Send to {N} subscribers").
- AC4: Clicking "Send" shall send the email via Resend's Batch API to all subscribers of the waitlist.
- AC5: The broadcast shall include an unsubscribe mechanism (`{{{RESEND_UNSUBSCRIBE_URL}}}` merge tag) for CAN-SPAM compliance.
- AC6: The broadcast shall include a physical mailing address in the footer (CAN-SPAM requirement).
- AC7: After sending, the system shall show a confirmation: "Email sent to {N} subscribers."
- AC8: Free founders shall see an upgrade prompt when clicking Broadcast ("Upgrade to Pro to send broadcasts").
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Activate Broadcast nav item + compose screen · T2 (AC3) Subscriber count display · T3 (AC4-AC6) Resend Batch API + unsubscribe + footer · T4 (AC7) Send confirmation · T5 (AC8) Free tier upgrade prompt · T6 (AC9) Lint + build

**Out of scope:** Warmth-segmented broadcast (Story 12.4), email customisation (Story 12.5), domain authentication (Story 13.5)

**Dev Notes:**

- T1: Create `src/app/dashboard/broadcast/page.tsx` (client component). The "Broadcast" nav item already exists in the sidebar (line 179 of `components/dashboard/sidebar.tsx`) — currently has `locked: true`. Change to: locked when tier === "free", unlocked when tier === "pro".
- T2: Fetch subscriber count from `waitlists.subscriber_count` (cached counter from Story 11.7) — avoid `COUNT(*)`.
- T3: Resend Batch API: `resend.batch.send([...])` with max 100 per batch. For larger lists, chunk into batches of 100. Each email is a separate object in the array: `{ from, to, subject, html }`.
- T3: **CAN-SPAM compliance:** Physical address in footer (use PreWaitlist's registered address or a placeholder for MVP). Unsubscribe: add `{{{RESEND_UNSUBSCRIBE_URL}}}` merge tag in the HTML body — Resend auto-replaces with a per-recipient unsubscribe link.
- T3: **Marketing stream:** Broadcast emails use `updates@prewaitlist.com` (separate from transactional `notifications@prewaitlist.com`). This is the email infrastructure separation from Story 12.6 — if 12.6 isn't done yet, hardcode the marketing from address.
- T3: Store broadcast history in the `broadcasts` table (created in Story 11.7): `{ id, waitlist_id, subject, sent_at, recipient_count, created_at }`.
- T5: Free tier check: `if (tier === 'free') { show upgrade modal; return; }`. The upgrade modal is Story 13.1 — for now, show a simple "Upgrade to Pro to send broadcasts" message.
- T1: **List-Unsubscribe header:** Verify Resend auto-adds RFC 8058 one-click unsubscribe header for Batch API sends. Required for Gmail/Yahoo deliverability (5,000+ daily sends).

---

### Story 12.4 — Warmth-Segmented Broadcast (Pro)

**Status:** ready
**Design Refs:** None (extends Story 12.3 compose screen)
**Story:** As a Pro founder, I want to send a broadcast to a specific warmth segment (Hot+Warm or Cold) so that I can target re-engagement emails to cold subscribers.

**Acceptance Criteria (EARS):**

- AC1: The broadcast compose screen shall include a segment selector: "All subscribers", "Hot + Warm only", "Cold only".
- AC2: The segment selector shall show the count for each segment ("All (234)", "Hot + Warm (180)", "Cold (54)").
- AC3: Selecting a segment shall filter the recipient list before sending.
- AC4: The send confirmation shall show the segment name and count ("Sent to 54 cold subscribers").
- AC5: The segment filter shall use the `warmth_score` column on subscribers.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Add segment selector with counts · T2 (AC3-AC4) Filter recipients by warmth tier · T3 (AC5) Verify warmth_score query · T4 (AC6) Lint + build

**Out of scope:** Email customisation (Story 12.5), warmth trend charts (v1.1)

**Dev Notes:**

- T1: Extend the compose screen from Story 12.3. Add a segment selector above the subscriber count.
- T1: Segment queries: `WHERE warmth_score IN ('hot', 'warm')` for Hot+Warm, `WHERE warmth_score = 'cold'` for Cold, no filter for All.
- T2: Counts: run count queries before rendering the selector. Use `waitlists.subscriber_count` for total, and warmth-filtered counts for segments.
- T2: For Resend Batch API: filter subscriber emails by warmth tier before sending. No Resend-native segmentation — we filter in our code.
- T2: The "Cold only" segment is the primary use case — re-engagement emails before launch week.
- T4: Send confirmation text: "Sent to {count} {segment} subscribers" — e.g. "Sent to 54 cold subscribers".

---

### Story 12.5 — Email Customisation (Pro)

**Status:** ready
**Design Refs:** None (Settings page UI)
**Story:** As a Pro founder, I want to customise the sender name and email body text so that my emails feel personal and on-brand.

**Acceptance Criteria (EARS):**

- AC1: The dashboard Settings page shall include an "Email" section with editable fields: sender name, subject prefix.
- AC2: The sender name shall default to the waitlist `product_name` (falling back to `headline` if null).
- AC3: The customised sender name shall be used in all transactional emails (confirmation, moved-up, milestone).
- AC4: The customised sender name shall be used in broadcast emails.
- AC5: Changes shall be saved to the `waitlists` table (`sender_name` column, nullable).
- AC6: When `sender_name` is null, the system shall fall back to `product_name`, then to `headline`.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Settings UI with sender name field · T2 (AC3-AC4) Wire sender name into email sending logic · T3 (AC5-AC6) DB storage + fallback · T4 (AC7) Lint + build

**Out of scope:** Body text customisation (v1.1), subject prefix (v1.1), domain authentication (Story 13.5)

**Dev Notes:**

- T1: Settings page: `src/app/dashboard/settings/page.tsx` + `client.tsx` (already exists from Story 11.4). Add "Email" section with sender name field.
- T2: Wire into `src/lib/email.ts` (created in Story 12.0) — pass `senderName` parameter. The email utility already handles from-address resolution.
- T3: `sender_name` column already exists on `waitlists` table (created in Story 11.7). Save via PATCH to `/api/waitlist`.
- T3: Fallback chain: `senderName` (from DB) → `product_name` (from DB) → `headline` (from DB) → "PreWaitlist" (hardcoded).
- T3: Format: `{senderName} <notifications@prewaitlist.com>` for transactional, `{senderName} <updates@prewaitlist.com>` for broadcast.
- T1: For MVP, only sender name is customisable. Subject prefix and body templates are v1.1.

---

### Story 12.6 — Email Infrastructure Separation

**Status:** ready
**Design Refs:** None (infrastructure, no UI surface)
**Story:** As a system, I want transactional emails and marketing broadcasts to use separate sending domains so that a spam complaint on a broadcast does not affect deliverability of critical transactional emails (signup confirmations, position updates).

**Acceptance Criteria (EARS):**

- AC1: Transactional emails (confirmation, moved-up, milestone) shall be sent from `notifications@prewaitlist.com`.
- AC2: Marketing emails (broadcasts) shall be sent from `updates@prewaitlist.com`.
- AC3: The `from` address resolution shall check: (1) founder's custom sender name + verified domain, (2) fallback to default prewaitlist.com addresses.
- AC4: When a founder verifies their own domain (Story 13.5), transactional emails shall use `{sender_name}@{verified_domain}` and broadcasts shall use `{sender_name}@{verified_domain}`.
- AC5: The email sending utility (`src/lib/email.ts`, created in Story 12.0) shall accept a `stream` parameter ("transactional" | "broadcast") to resolve the correct `from` address.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Define default from addresses per stream · T2 (AC3-AC4) Build from-address resolver with verified domain fallback · T3 (AC5) Add stream parameter to email utility (extends Story 12.0 utility) · T4 (AC6) Lint + build

**Out of scope:** Domain verification UI (Story 13.5), SPF/DKIM DNS setup (Story 13.5)

**Dev Notes:**

- T1: **Depends on Story 12.0:** The email utility (`src/lib/email.ts`) must already exist with basic `sendEmail()` and `stream` parameter. Story 12.6 extends it with verified domain fallback logic.
- T1: **Why separate domains:** If a broadcast triggers spam complaints, Gmail/Yahoo may flag the sending domain. Transactional emails (which users depend on for login, confirmations) must not be affected. This is a deliverability best practice recommended by Resend, Mailgun, Postmark, and every major ESP.
- T1: `notifications@prewaitlist.com` — transactional stream (signup confirm, moved-up, milestone, position update).
- T1: `updates@prewaitlist.com` — marketing stream (broadcasts, launch announcements).
- T2: The `sending_domain` column (Story 11.7) controls the domain. When set (verified custom domain), use it for both streams. When null, use the prewaitlist.com defaults.
- T2: The `sender_name` column (Story 11.7) controls the friendly name. Combine: `{senderName} <{from_address}>`.
- T3: This is a deliverability concern — if the user skips this story, broadcasts still work but use the shared prewaitlist.com domain.

# Epic 8 — Thank-You Pages & Referral Loop

**Status:** ready
**Source:** [PRD S2a Sprint 2](../PRD.md#2a-sprint-2--public-page-dashboard-active), [PRD S7.5 Route/Handler List](../PRD.md#75-route--handler-list), [PRD S7.6 Component Tree](../PRD.md#76-component-tree-high-level)

## Design References

| Reference                   | File                                                          |
| --------------------------- | ------------------------------------------------------------- |
| Thank-you — direct signup   | `docs/design/High-fidelity-Sprit2/thank_you_direct_HF1.svg`   |
| Thank-you — referred signup | `docs/design/High-fidelity-Sprit2/thank_you_referred_HF2.svg` |

## Goal

After signing up on the public waitlist page, a subscriber sees a thank-you page showing their position, a personalized referral link, and share buttons. If referred, they see a variant acknowledging the referrer. The system tracks referral conversions for the founder's dashboard.

## Definition of Done

A subscriber who signs up on `/:subdomain` is redirected to `/:subdomain/thank-you`. The thank-you page displays position number, a copyable referral link, and share buttons (Twitter, LinkedIn, Copy Link). If referred, the page shows a "Referred by a friend" variant. The system increments the referrer's referral_count when a referred subscriber signs up. The founder's dashboard subscriber table shows the referral source column.

## Story Index

| ID  | Title                                | Depends on | Status |
| --- | ------------------------------------ | ---------- | ------ |
| 8.0 | Thank-You Page Route                 | 7.0        | ready  |
| 8.1 | Referral Link Generation             | 8.0        | ready  |
| 8.2 | Referral Tracking                    | 8.0        | ready  |
| 8.3 | Share Buttons Integration            | 8.0        | ready  |
| 8.4 | Dashboard Subscriber Referral Column | 8.2        | ready  |
| 8.5 | Epic 8 Tests                         | 8.0–8.4    | ready  |

Work through these in dependency order, one at a time. Story 8.0 must be complete before 8.1–8.3 begin. Story 8.2 must be complete before 8.4 begins. Story 8.5 must be the last story — it tests everything built in 8.0–8.4.

---

### Story 8.0 — Thank-You Page Route

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/thank_you_direct_HF1.svg`

**Story:** As a subscriber, I want to see a thank-you page after signing up so that I know my signup was successful and I can see my position.

**Acceptance Criteria (EARS):**

- AC1: The system shall render `/:subdomain/thank-you` as a public route.
- AC2: The system shall fetch the subscriber record by subscriber_id (passed as search param).
- AC3: The system shall display the subscriber's position number in a prominent design system text-display style.
- AC4: The system shall display the subscriber's personalized referral link (full URL with referral code as `?ref=CODE`).
- AC5: The system shall display the founder's brand name/logo at the top of the page.
- AC6: The system shall render the page responsive on mobile and desktop viewports.
- AC7: The system shall include the "Powered by PreWaitlist" footer when tier = Free, using the shared PoweredByFooter component.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Create thank-you route + data fetching · T2 (AC3-AC5) Position display + referral link + brand · T3 (AC6-AC7) Responsive layout + PoweredByFooter · T4 (AC8) Lint + build

**Out of scope:** Referral tracking (Story 8.2), share buttons (Story 8.3), referred-variant styling (Story 8.1), email confirmation (Epic 11).

**Dev Notes:**

- T1: Use Next.js dynamic route `app/(public)/[subdomain]/thank-you/page.tsx`. Accept `subscriber_id` as search param.
- T2: Position display: use `.text-display` or `.text-h1` class from globals.css. Referral link: `${window.location.origin}/${subdomain}?ref=${referral_code}`.
- T3: Reuse PoweredByFooter from `components/share/powered-by-footer.tsx`.

---

### Story 8.1 — Referral Link Generation & Referred Variant

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/thank_you_direct_HF1.svg`, `docs/design/High-fidelity-Sprit2/thank_you_referred_HF2.svg`

**Story:** As a subscriber, I want a personalized referral link that I can share so that my friends can join the waitlist and I can track my referrals.

**Acceptance Criteria (EARS):**

- AC1: The system shall generate a unique referral code for each subscriber at signup time (Story 7.0 handles creation).
- AC2: The thank-you page shall display the referral link in a copyable format with a "Copy" button.
- AC3: The system shall pre-fill the referral code in the URL as `?ref=CODE` when a referred visitor lands on the public page.
- AC4: The system shall display a "Referred by a friend" variant on the thank-you page when the subscriber was referred (ref param present).
- AC5: The system shall show the referrer's display name (or anonymized email) on the referred variant.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Referral link display + copy button · T2 (AC3) Pre-fill ref param on public page · T3 (AC4-AC5) Referred-variant styling · T4 (AC6) Lint + build

**Out of scope:** Referral tracking/counting (Story 8.2), share buttons (Story 8.3), referral rewards/tiers.

**Dev Notes:**

- T1: Reuse `share-copy-link` component from `components/share/share-copy-link.tsx`.
- T2: On public waitlist page (Story 7.1), check for `?ref=CODE` query param and store in session/cookie for signup flow.
- T3: Referred variant: different heading ("Welcome — referred by {name}"), subtle background/badge difference. Use `--color-status-warm` for referral acknowledgment badge.

---

### Story 8.2 — Referral Tracking

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As a founder, I want the system to track which subscribers referred which other subscribers so that I can see referral performance on my dashboard.

**Acceptance Criteria (EARS):**

- AC1: The system shall increment the referrer's referral_count by 1 when a new subscriber signs up with a valid `?ref=CODE` param.
- AC2: The system shall store the referrer's subscriber_id in the new subscriber's referrer_id column.
- AC3: The system shall not increment referral_count if the ref code is invalid or belongs to a different waitlist.
- AC4: The system shall not allow self-referral (a subscriber referring themselves).
- AC5: The system shall provide a `GET /api/subscribers/:id/referrals` route that returns the subscriber's referral count and list of referred subscribers.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Increment referral_count + store referrer_id · T2 (AC3-AC4) Validation (valid code, same waitlist, no self-referral) · T3 (AC5) GET /api/subscribers/:id/referrals route · T4 (AC6) Lint + build

**Out of scope:** Real-time referral tracking (Sprint 3), referral rewards/milestones (Sprint 3), leaderboard referral sorting (Story 7.5).

**Dev Notes:**

- T1: In POST /api/subscribers (Story 7.0), when `ref` param is present: look up subscriber by referral_code, validate same waitlist, increment atomically: `UPDATE subscribers SET referral_count = referral_count + 1 WHERE id = $1`.
- T2: Validation: check ref exists, check ref's waitlist_id matches new subscriber's waitlist_id, check `ref.id !== new subscriber's id`.

---

### Story 8.3 — Share Buttons Integration

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/thank_you_direct_HF1.svg`, `docs/design/High-fidelity-Sprit2/thank_you_referred_HF2.svg`

**Story:** As a subscriber, I want to share my referral link on Twitter, LinkedIn, or by copying it, so that I can invite friends to join the waitlist.

**Acceptance Criteria (EARS):**

- AC1: The system shall display share buttons (Twitter, LinkedIn, Copy Link) on the thank-you page.
- AC2: The share buttons shall use the existing share components from Sprint 1 (components/share/).
- AC3: The Twitter share button shall open a pre-composed tweet with the referral link and founder's headline.
- AC4: The LinkedIn share button shall open a share dialog with the referral link.
- AC5: The Copy Link button shall copy the referral link to clipboard and show confirmation feedback.
- AC6: The share buttons shall be styled using the design system's button tokens (btn-primary, btn-outline).
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Render share buttons on thank-you page · T2 (AC3-AC4) Twitter + LinkedIn share URLs · T3 (AC5) Copy to clipboard + feedback · T4 (AC6) Button styling with design system tokens · T5 (AC7) Lint + build

**Out of scope:** Share analytics/tracking (Sprint 3), additional share platforms (WhatsApp, email — Standing Decision 3), share button A/B testing.

**Dev Notes:**

- T1: Reuse components from `components/share/`. The share-copy-link component already handles Copy Link.
- T2: Twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(headline)}&url=${encodeURIComponent(referralLink)}`. LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`.
- T3: Use `navigator.clipboard.writeText()`. Show "Copied!" feedback for 2 seconds.

---

### Story 8.4 — Dashboard Subscriber Referral Column

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`

**Story:** As a founder, I want to see the referral source for each subscriber in my dashboard so that I can understand which subscribers were referred by others.

**Acceptance Criteria (EARS):**

- AC1: The dashboard subscriber table (Story 10.4) shall include a "Referral Source" column.
- AC2: The column shall display the referrer's display name or anonymized email for referred subscribers.
- AC3: The column shall display "Direct" for subscribers who were not referred.
- AC4: The column shall be filterable by referral source (All, Direct, Referred).
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Referral source column display · T2 (AC4) Filter by referral source · T3 (AC5) Lint + build

**Out of scope:** Referral count column (Sprint 3), referral analytics chart (Sprint 3), bulk export with referral data (Sprint 3).

**Dev Notes:**

- T1: Join subscribers with referrers table to get referrer display name. If referrer_id is null, show "Direct".
- T2: Add filter dropdown to table header. Filter by `referrer_id IS NULL` (Direct) or `IS NOT NULL` (Referred).

---

### Story 8.5 — Epic 8 Tests

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As the founder, I want comprehensive tests for all Epic 8 components and API routes so that the thank-you page, referral link generation, referral tracking, share buttons, and dashboard referral column work correctly and don't regress.

**Test Infrastructure:** Vitest + @testing-library/react for component tests, Playwright for e2e tests. Config: `vitest.config.mts` (happy-dom, `src/**/*.test.{ts,tsx}`). Test location: `src/__tests__/components/` for unit tests, `tests/e2e/` for e2e tests. Setup: `src/__tests__/setup.ts` (clipboard mock, cleanup). Pattern: `@testing-library/react` + `@testing-library/user-event` + `vitest`.

**Acceptance Criteria (EARS):**

- AC1: The system shall have component tests for the thank-you page (`app/(public)/[subdomain]/thank-you/page.tsx`) covering: renders position number, renders referral link, renders founder brand, renders PoweredByFooter when tier = Free.
- AC2: The system shall have component tests for the referral link display (`components/share/referral-link.tsx`) covering: renders full referral URL, copies to clipboard on click, shows "Copied!" feedback, reverts after 2 seconds.
- AC3: The system shall have component tests for the share buttons (`components/share/share-buttons.tsx`) covering: renders Twitter button, renders LinkedIn button, renders Copy Link button, opens correct share URLs, copies to clipboard.
- AC4: The system shall have component tests for the referred variant display covering: shows "Referred by a friend" heading when ref param present, shows referrer name, does not show referral variant for direct signups.
- AC5: The system shall have API route tests for referral tracking in `POST /api/subscribers` covering: increments referrer's referral_count on valid ref code, stores referrer_id, rejects invalid ref code, rejects self-referral, rejects cross-waitlist ref code.
- AC6: The system shall have API route tests for `GET /api/subscribers/:id/referrals` covering: returns referral count, returns referred subscribers list, returns 404 for unknown subscriber.
- AC7: The system shall have an e2e test (`tests/e2e/thank-you-flow.spec.ts`) covering: subscriber sees thank-you page after signup, sees position and referral link, can copy referral link, share buttons are present.
- AC8: All tests shall pass with `pnpm test` and `pnpm test:e2e` (if e2e env configured).
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Thank-you page component tests · T2 (AC2) Referral link component tests · T3 (AC3) Share buttons component tests · T4 (AC4) Referred variant tests · T5 (AC5) Referral tracking API tests · T6 (AC6) GET /api/subscribers/:id/referrals route tests · T7 (AC7) E2E thank-you flow test · T8 (AC8-AC9) Run all tests + lint + build

**Out of scope:** Tests for Epic 7 features (public waitlist page — covered in Story 7.7), tests for Epic 10 dashboard features, tests for Epic 11 email features.

**Dev Notes:**

- T1: Create `src/__tests__/components/thank-you-page.test.tsx`. Mock subscriber data with position, referral_code, brand. Test rendering of position, referral link, brand, PoweredByFooter conditional.
- T2: Create `src/__tests__/components/referral-link.test.tsx`. Mock clipboard API. Test URL rendering, copy on click, "Copied!" state, 2-second revert (use `vi.useFakeTimers()`).
- T3: Create `src/__tests__/components/share-buttons.test.tsx`. Mock `navigator.share` and `navigator.clipboard`. Test Twitter URL format (`https://twitter.com/intent/tweet?text=...&url=...`), LinkedIn URL format, clipboard copy.
- T4: Create `src/__tests__/components/referred-variant.test.tsx`. Render with and without referrer data. Test conditional rendering of "Referred by a friend" heading.
- T5: Create `src/__tests__/api/subscribers-referral.test.ts`. Mock Supabase client. Test referral_count increment, referrer_id storage, invalid ref rejection, self-referral rejection, cross-waitlist rejection.
- T6: Create `src/__tests__/api/subscribers-referrals.test.ts`. Mock Supabase client. Test GET handler returns referral_count and referred_subscribers array.
- T7: Create `tests/e2e/thank-you-flow.spec.ts`. Use Playwright to complete signup flow, verify thank-you page renders with position and referral link.
- T8: Run `pnpm test` for unit tests, `pnpm lint` for linting, `pnpm build` for build verification.

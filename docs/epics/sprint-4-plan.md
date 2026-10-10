# Sprint 4 — Plan

**Status:** ready (Epic 19 → Epic 20 → Epic 21)
**Date range:** 2026-10-05 → 2026-10-12 (target)
**Duration:** 7 working days
**Goal:** The product is stable, tested across all paths, and ready for a public launch. Every known defect is fixed, the feedback/observation loop is live, and a complete founder-executable test suite proves it.

**Pre-requisite:** Epics 0–18 shipped (Sprints 1–3.x complete). Sprint 4 adds no new product features beyond the approved additions below — it hardens, instruments, and verifies.

**[CREATED — 2026-10-04]** Sprint 4 includes these epics:

- **Epic 19 — Product Fixes & Polish:** 🟡 ready (8 stories, P0 tier bug + 5 audits)
- **Epic 20 — Feedback, Onboarding & Growth Tooling:** 🟡 ready (5 stories, instrumentation + feedback + founder tooling)
- **Epic 21 — Full App Scan & Test Case Suite:** 🟡 ready (8 stories, app-derived manual test suite + launch verification)

**Execution order:** Epic 19 (19.0 → 19.1 → 19.2 → 19.3–19.7 parallel) → Epic 20 (20.1 → 20.2 ∥ 20.3 → 20.4 → 20.5) → Epic 21 (21.1–21.3 early, hard chain 21.4 → 21.5 → 21.6 → 21.7 → 21.8).

**Sprint-wide gates:** `pnpm lint` 0 errors · full test suite at sanctioned baseline (7 known failures: dashboard-archive 4 + dashboard-subscriber-table 3) · clean `pnpm build` (delete `.next` first) · prettier clean on touched files.

**Sprint-wide constraints:**

- No SQL migrations anywhere in Sprint 4.
- New dependencies/env only where pre-approved: `driver.js` (MIT), Tally embed (script, no package), PostHog (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`), Dub (external account, zero code).
- Never write user-facing copy — strings come from `docs/waitlist_feedback_system.md` (founder-provided, pre-approved), existing app copy, or an explicit founder approval gate.
- All colors/spacing via Design System v2.0 tokens; no inline styles.

---

## Exit Condition

> Vision `:440` — Every path in the user flow works without errors. The product is deployed to production on Vercel. The founder can sign up, build a waitlist, collect signups, track warmth, send a broadcast, and export their data without encountering a single broken state.

Operationalized for Sprint 4: Epic 19's known defects fixed and audits closed → Epic 20's feedback/observation loop live → Epic 21.5 test document exists and every case passes in Epic 21.7 → Epic 21.8 launch verification signs off.

---

## What Gets Built / Fixed / Audited

| Item                                                                 | Kind      | Epic |
| -------------------------------------------------------------------- | --------- | ---- |
| PRD Sprint 4 section + stale doc corrections                         | doc       | 19.0 |
| Pro-account emails stop showing "Powered by" (tier bug)              | fix 🔴 P0 | 19.1 |
| CSV export Quality-score column                                      | fix       | 19.2 |
| Edge cases: expired links, gone waitlists, at-cap, empty states      | audit→fix | 19.3 |
| Error + loading states for all async operations                      | audit→fix | 19.4 |
| Mobile responsiveness across public + dashboard screens              | audit→fix | 19.5 |
| Second-waitlist creation flow (already built — verify only)          | audit     | 19.6 |
| Email deliverability SPF/DKIM verification                           | audit     | 19.7 |
| PostHog instrumentation + funnel events + 2–3 triggered surveys      | build     | 20.1 |
| First-subscriber dashboard walkthrough (driver.js)                   | build     | 20.2 |
| Feedback button (§7 categories → Tally) + "Talk to the founder" (§8) | build     | 20.3 |
| Founder per-channel marketing links (Dub + UTM playbook)             | setup+doc | 20.4 |
| Product Hunt prep checklist (founder writes listing copy)            | gated     | 20.5 |
| Founder contact popup (Instagram + Email modal rows)                 | build     | 20.6 |
| Full app inventory & behavior map                                    | scan      | 21.1 |
| Core screenshot set (~20 shots, Playwright)                          | capture   | 21.2 |
| Behavior-to-source matrix (ACs/REQs/audits/gotchas)                  | scan      | 21.3 |
| Input validation audit with repro evidence                           | audit     | 21.4 |
| `docs/qa/manual-test-cases.md` (single file, app-derived)            | doc       | 21.5 |
| Fix pass on validated failures                                       | fix       | 21.6 |
| Full QA execution + results log                                      | verify    | 21.7 |
| Launch verification + open-items register                            | verify    | 21.8 |

**Explicitly deferred to v1.1 (founder decision 2026-10-04):**

- Referral tree visualization (vision `:429` vs Appendix ledger conflict — ledger wins)
- Traffic summary + `page_views` write path (table exists, nothing ever writes to it)

**Historical reference demoted:** `docs/planning-docs/user-flow-waitlist-tool.md` is outdated and incomplete (written pre-Epic 12–18). It is NOT a source for Epic 21 test cases. Epic 21 derives test cases from the actual app (21.1), screenshots (21.2), and source-of-truth docs (21.3).

---

## Epic Index

| ID  | Title                                 | Stories | Depends on                                 | Status |
| --- | ------------------------------------- | ------- | ------------------------------------------ | ------ |
| 19  | Product Fixes & Polish                | 8       | —                                          | ready  |
| 20  | Feedback, Onboarding & Growth Tooling | 5       | —                                          | ready  |
| 21  | Full App Scan & Test Case Suite       | 8       | 19.1–19.6 (finalise), 20.1–20.3 (surfaces) | ready  |

**Execution order:** Epic 19 → Epic 20 → Epic 21. Epic 19 and Epic 20 are independent of each other (19 fixes product, 20 adds tooling) and can interleave if needed. Epic 21.1–21.3 are independent prep work and can start immediately; Epic 21.5 (the test document) must not finalise until Epic 19's fixes land (test cases must assert fixed behaviour, not buggy behaviour) and must include Epic 20's new surfaces (walkthrough, feedback button, surveys) before Epic 21.7 executes.

---

## Founder Inputs Required During Sprint 4

| Input                                                          | Needed by       | Status                         |
| -------------------------------------------------------------- | --------------- | ------------------------------ |
| PostHog account + `NEXT_PUBLIC_POSTHOG_KEY`                    | 20.1            | ⬜ pending                     |
| Tally form URL(s) for feedback embed                           | 20.3            | ✅ env set (live after deploy) |
| Founder contact channels (Instagram DM URL + email, for popup) | 20.6            | ✅ env set (live after deploy) |
| Dub account creation                                           | 20.4            | ⬜ pending                     |
| Product Hunt listing copy                                      | 20.5            | ⬜ pending (copy-gate)         |
| Resend dashboard SPF/DKIM check                                | 19.7            | ⬜ pending                     |
| Approval of failing-validations list                           | 21.5            | ⬜ pending                     |
| Approval to defer/fix decisions from audits                    | 19.3–19.5, 21.6 | ⬜ pending                     |

---

# Epic 19 — Product Fixes & Polish

**Status:** ready
**Source:** [MVP Vision Sprint 4](../product-vision-mvp-waitlist-tool.md#sprint-4--polish-qa-edge-cases-analytics-product-hunt-prep) (`:420-440`), founder report "Pro account emails still display Powered by"

## Goal

Eliminate every known defect before launch: fix the P0 email-tier bug that puts "Powered by" on Pro accounts, complete the CSV column set, and close the five remaining quality audits (edge cases, error/loading states, mobile responsiveness, second-waitlist flow, email deliverability) so the product is demonstrably stable before the Epic 21 test pass.

## Definition of Done

Pro founders' emails carry no "Powered by" branding and free founders' do (correct in both directions). CSV export includes the Quality-score column. Each audit has produced a findings list, every finding has been either fixed or explicitly deferred with founder sign-off, and lint/tests/build are green.

## Story Index

| ID   | Title                                 | Depends on | Status |
| ---- | ------------------------------------- | ---------- | ------ |
| 19.0 | Doc Debt: PRD Sprint 4 + Stale Tables | —          | done   |
| 19.1 | Pro Email Tier Fix (P0)               | —          | done   |
| 19.2 | CSV Export Polish (Quality Column)    | —          | done   |
| 19.3 | Edge-Case Audit                       | —          | done   |
| 19.4 | Error & Loading States Audit          | —          | done   |
| 19.5 | Mobile Responsiveness Audit           | —          | done   |
| 19.6 | Second-Waitlist Flow Audit            | —          | done   |
| 19.7 | Email Deliverability Audit            | 19.1       | done   |

---

### Story 19.0 — Doc Debt: PRD Sprint 4 + Stale Tables

**Status:** done
**Story:** As the maintainer, I want the PRD to contain a Sprint 4 section and stale planning tables corrected so that Epics 19–21 have authoritative doc sources.

**Acceptance Criteria (EARS):**

- AC1: The PRD shall contain a Sprint 4 section describing the scope captured in this plan (fixes, tooling additions, QA suite), cross-referencing Epics 19–21.
- AC2: `docs/epics/sprint-3-plan.md` "What's NOT Built (Sprint 4 scope)" table shall be annotated: items actually moved to v1.1 (custom domain mapping), post-MVP, or shipped elsewhere (multi-waitlist) shall be relabeled so no row falsely claims "Sprint 4 scope".
- AC3: The vision doc Sprint 4 section (`:420-440`) shall carry an amendment note: referral tree + traffic summary deferred to v1.1 (founder decision 2026-10-04); the six 👑 additions are tracked in Epics 20–21.
- AC4: `docs/planning-docs/user-flow-waitlist-tool.md` shall be marked as historical/outdated with a pointer to `docs/qa/manual-test-cases.md` (once created by 21.5).
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) PRD Sprint 4 section · T2 (AC2-AC4) Stale-table + vision + user-flow annotations · T3 (AC5) Lint + build

**Dev Notes:**

- PRD currently declares 5 sprints (1, 2, 3, 3.1, 3.2) with no Sprint 4 section; header still says "Sprint 2 active" — fix the header while there.
- Keep the PRD section short and pointer-style (this plan is the detail source).
- AC4 pointer target won't exist until 21.5 — write the note as "superseded by docs/qa/manual-test-cases.md (Epic 21)".

**Out of scope:** Rewriting the user-flow doc itself.

---

### Story 19.1 — Pro Email Tier Fix (P0)

**Status:** done
**Story:** As a Pro founder, I want my confirmation and moved-up emails to omit the "Powered by PreWaitlist" branding so that my subscribers see only my brand.

**Acceptance Criteria (EARS):**

- AC1: The confirmation-email tier read in `POST /api/subscribers` (fire-and-forget block, `route.ts:890-893`) shall resolve the founder tier correctly when `founder_profiles` is returned by PostgREST as a to-one object (not an array).
- AC2: The moved-up-email tier read (`route.ts:1065-1070`) shall be fixed the same way.
- AC3: The broadcast preview in `src/app/dashboard/broadcast/client.tsx:288` shall not display a hardcoded "powered by PreWaitlist" line to any tier.
- AC4: Confirmation and moved-up emails shall use `buildFreeEmailFooter` (with Powered-by) if and only if the founder's tier is `free`; tier `pro` shall use the non-Powered-by footer.
- AC5: Milestone congratulatory emails (`src/lib/milestones.ts`) shall apply the same tier-conditional footer rule (currently unconditional `buildEmailFooter` — free tier is missing attribution, the inverse bug).
- AC6: Page footers (`waitlist-page-content.tsx:74`, `thank-you/page.tsx:237`, `leaderboard/page.tsx:211`) shall be verified to render Powered-by for free tier only (no code change expected — confirm only).
- AC7: A regression test shall lock the tier-resolution behavior: object-shaped embed → `pro` → non-free footer; array-shaped embed (defensive) → same result.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Fix both tier reads with the `Array.isArray` pattern · T2 (AC3) Remove hardcoded preview line · T3 (AC4-AC5) Tier-conditional footers incl. milestones · T4 (AC6) Verify page footers · T5 (AC7) Regression test · T6 (AC8) Lint + build

**Dev Notes:**

- **Root cause (confirmed 2026-10-04):** `.select("founder_profiles!inner(tier)").eq("id", waitlist_id).single()` returns `waitlistWithTier.founder_profiles` as an **object** (many-to-one embed). The code casts it to `{ tier: string }[]` and indexes `[0]` → `undefined` → `|| "free"` → tier is **always "free"** → every confirmation/moved-up email gets `buildFreeEmailFooter`.
- **Correct pattern already exists in the same file** at `:526-528`: `Array.isArray(x) ? x[0] : x` — reuse it (or a small shared helper) in both email paths.
- `route.ts:898` `console.log("Email tier for waitlist ...")` is the live-verification probe — after the fix it must print `pro` for a Pro waitlist.
- `milestones.ts:22` currently: `buildEmailFooter(waitlist?.business_address)` unconditional. AC5 makes it tier-conditional — the tier is already fetched and passed into the milestone notify path (`route.ts:917`, `:1094` pass `tier`) — verify and thread through if not already.
- Broadcast footers (`buildBroadcastEmailFooter`/`WithUrl`) intentionally have NO Powered-by (address + unsubscribe only) — do not add one; broadcast is Pro-gated anyway.
- Which footer does a FREE founder's confirmation use today? `buildFreeEmailFooter` (bug side-effect) — behavior unchanged for free; only `pro` changes. AC7 test covers both.
- Footer inventory (6 paths): confirmation, moved-up, milestone (email) · waitlist page, thank-you, leaderboard (page).

**Out of scope:** Any footer visual redesign; broadcast footer changes; email template copy.

---

### Story 19.2 — CSV Export Polish (Quality Column)

**Status:** done
**Story:** As a founder, I want my CSV export to include the subscriber quality/warmth score so that my exported data matches what I see in the dashboard.

**Acceptance Criteria (EARS):**

- AC1: The export headers in `src/app/api/subscribers/export/route.ts` (`:106`) shall include a Quality column in addition to Email, Name, Position, Referrals, Warmth, Signup Date.
- AC2: The Quality value shall be derived from the subscriber's warmth data already selected by the route (`warmth_score` at `:57/:64`) — no new table queries. **[AMENDED 2026-10-04 — founder: Quality = referral-quality %, matching the dashboard formula `totalReferrals > 0 ? Math.round((referrals / totalReferrals) * 100) : null` (`dashboard/leaderboard/page.tsx:140-143`), rendered as `N%` (empty when null). The "no new table queries" clause still holds — value comes from the referralCounts batch query the route already runs. `warmth_score` continues to back the Warmth column.]**
- AC3: RFC4180 escaping shall apply to Quality values as with existing columns (Story 14.4 escaping stays intact).
- AC4: Column order shall remain stable with Quality appended (or inserted adjacent to Warmth) — documented in the AC tests.
- AC5: The filename and tier gating behavior shall be unchanged by this story.
- AC6: Tests shall cover: header includes Quality, value renders, escaping, and the phone-mode conditional select paths still work. **[AMENDED 2026-10-04 — founder: + formula-injection hardening coverage.]**
- AC7: Lint and build shall pass with zero errors.
- AC8: `escapeCsvCell` shall harden formula-leading cells against OWASP WSTG-INPV-21: when a cell begins with `=`, `+`, `-`, `@`, tab, or CR it shall be prefixed with `'` to force text in spreadsheet apps (pure numerics such as E.164 phone values exempt — they evaluate as numbers, never commands), covering subscriber-controlled free text (qual answers, display names).

**Tasks:** T1 (AC1-AC2) Add Quality header + cell mapping · T2 (AC3-AC5, AC8) Escaping/order/gating verification + formula-injection hardening · T3 (AC6) Tests · T4 (AC7) Lint + build

**Dev Notes:**

- Vision `:430`: "CSV export polish (all columns, all tiers)". Existing conditional selects at `:57/:64` (phone/display_name arms) — the literal-template-literal gotcha from phone-collection applies: branch the full select per arm, never interpolate columns into a template literal.
- ~~The dashboard table shows Warmth badges — "Quality" in vision vs "Warmth" column naming: name the header `Quality` per vision, value = warmth tier string (hot/warm/cold). Founder can rename in 21.x review if desired (copy-gate — flag, don't invent).~~ **[SUPERSEDED 2026-10-04 by amended AC2 — value is now referral-quality % (dashboard parity), header stays `Quality` per vision.]**
- Free-tier CSV gating: `src/lib/pricing-features.ts` lists CSV under FREE_FEATURES (per Epic 13 AC2 note) — verify while here (AC5).
- **OWASP formula-injection flag (research 2026-10-04):** `escapeCsvCell` (`export/route.ts`) is RFC4180 quoting only — cells beginning with `=`, `+`, `-`, or `@` (free-text qual answers are subscriber-controlled) execute as formulas when the CSV is opened in Excel (OWASP WSTG-INPV-21). Mitigation is trivial (prefix `'` on formula-leading cells). **Decision (founder, 2026-10-04): FOLDED INTO THIS STORY as AC8** — flagged in the create-epic [19] Phase 5 report; no longer deferred.

**Out of scope:** New computed quality scores beyond warmth; export format changes (parquet etc.). **[AMENDED 2026-10-04 — founder: referral-quality % (amended AC2) is now in scope; "beyond warmth" still excludes any third score.]**

---

### Story 19.3 — Edge-Case Audit

**Status:** ready
**Story:** As the maintainer, I want every documented edge case exercised and either handled or deferred so that no flow dead-ends in production.

**Acceptance Criteria (EARS):**

- AC1: The system shall be audited against this edge-case matrix, each row marked pass/fixed/deferred with evidence: expired verification links, expired/invalid unsubscribe tokens, archived waitlist public access (`/gone`), unknown subdomain, deleted/missing waitlist in dashboard deep links, duplicate email signup (409 path), at-cap signup (free 500), duplicate waitlist slug race, invalid `?ref=` codes, self-referral, missing `?wid=`/unknown `?wid=`, zero-subscriber dashboard panels (all 6+ panels), `?plan=pro` on already-Pro account.
- AC2: Findings that are broken (dead-end, crash, silent failure) shall be fixed in this story.
- AC3: Findings intentionally deferred shall be recorded in the story's results section with founder sign-off.
- AC4: Each fix shall have a test or be covered by a 21.5 test case (cross-reference noted).
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Execute matrix, record evidence · T2 (AC2) Fix broken rows · T3 (AC3-AC4) Defer log + test cross-refs · T4 (AC5) Lint + build

**Dev Notes:**

- Known-good already (don't re-fix): archived → `/gone` on leaderboard/thank-you (4.3), unknown-`?wid` self-heal (shell:203-213), duplicate email 409 (Story 7.4), self-referral silent nullify (Story 8.2), at-cap 403 (route:532), FlushGate fresh-founder path (revenue audit F1).
- Empty states per panel exist from Epic 12.1.1 — verify each of: stat cards, chart, qualification, warmth, top referrers, warning banner, subscriber table, updates.
- Rate limit / honeypot / timing paths on `POST /api/subscribers` are part of 21.4 (validation audit) — don't duplicate here; this story covers navigation/state edge cases.

**Out of scope:** Input-validation rules (21.4 owns); fraud/fingerprinting (post-MVP standing decision).

---

### Story 19.4 — Error & Loading States Audit

**Status:** ready
**Story:** As a user, I want every async operation to show a loading state and a recoverable error state so that failures never present as a blank or frozen screen.

**Acceptance Criteria (EARS):**

- AC1: Every client-side fetch in pages/components shall be audited: each has an in-flight indicator (spinner/skeleton/"Saving…") and a failure branch with user-visible messaging.
- AC2: Loading skeletons that exist (`onboarding/loading.tsx`, `dashboard/loading.tsx`, chart/panel skeletons) shall be verified to render on the real navigation paths.
- AC3: Server route handlers shall return non-2xx with an `error` string for every failure path (no silent 200-with-error).
- AC4: Broken rows found (fetch with no error handling, unhandled promise, error swallowed to console only) shall be fixed.
- AC5: Deferred items shall be logged with founder sign-off.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Audit matrix with evidence · T2 (AC3) Server error-path check · T3 (AC4) Fixes · T4 (AC5) Defer log · T5 (AC6) Lint + build

**Dev Notes:**

- Highest-risk spots (check first): `use-paddle-upgrade.ts` (known console-only silent failure — flagged, not fixed, in Pro-CTA session), settings `saveField` paths, dashboard auto-refresh, `FlushGate`, onboarding debounced slug check, broadcast send, updates publish, CSV download.
- Existing patterns to reuse: `EMAIL_FAILED_COPY` honest-status pattern (Phase B), `res.ok`/`data.error` modal pattern (Epic 13 post-deploy fix).

**Out of scope:** Redesigning skeletons; new loading UI beyond existing design-system patterns.

---

### Story 19.5 — Mobile Responsiveness Audit

**Status:** ready
**Story:** As a visitor on a phone, I want every public and dashboard screen usable so that mobile traffic isn't lost.

**Acceptance Criteria (EARS):**

- AC1: Each screen shall be audited at 375×667 and 768×1024 viewports: public waitlist page (3 templates), thank-you, leaderboard, gone, marketing home, auth pages (signup/signin/verify/forgot/reset), onboarding steps 1–5/4a/success (two-pane and centered layouts, sticky mobile CTA), dashboard home + all 7 section pages + subscriber detail + settings tree (hub/list/detail/billing/profile).
- AC2: Findings (overflow, unreachable controls, table clipping, text collision) shall be listed with screenshots as evidence.
- AC3: All P0/P1 findings (unusable at 375px) shall be fixed.
- AC4: P2 findings (polish-level) shall be logged for founder triage.
- AC5: Mobile fixes shall use existing responsive utilities only — no new breakpoints or tokens.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Audit with evidence · T2 (AC3) Fix P0/P1 · T3 (AC4) Triage log · T4 (AC5-AC6) Token compliance + lint/build

**Dev Notes:**

- Playwright (21.2 capture) can double as evidence gathering — coordinate with 21.2's mobile viewport shots so the audit doesn't re-capture.
- Prior mobile work: 12.1.5 (table overflow, responsive grids), Epic 4 sticky mobile CTA, leaderboard mobile responsive (7.5) — audit verifies these still hold post-Epic 18 redesign.
- Epic 18.6–18.8 redesigned the live page + preview fit — re-verify preview scaling on small screens (this is where regressions are most likely).

**Out of scope:** Native app behavior; tablet-specific layouts beyond the 768 check.

---

### Story 19.6 — Second-Waitlist Flow Audit

**Status:** ready
**Story:** As a Pro founder, I want the multi-waitlist experience (switcher, create-second-list, per-waitlist settings) verified so that the feature shipped in Epic 12.2 works end-to-end.

**Acceptance Criteria (EARS):**

- AC1: The flow shall be exercised: create second waitlist from settings hub → appears in waitlist list → switch via `?wid`/switcher → dashboard + all section pages reflect active waitlist → per-waitlist settings edit persists → archived list behaves (hidden/gone).
- AC2: Free-tier attempt at a second list (if gated) shall show the correct upgrade/limit behavior; ungated behavior shall be recorded as-is.
- AC3: Cross-waitlist data isolation shall be verified: subscribers, updates, broadcast, warmth of list A never render under list B.
- AC4: Findings shall be fixed or deferred with founder sign-off.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Execute flow with evidence · T2 (AC4) Fix/defer · T3 (AC5) Lint + build

**Dev Notes:**

- Stories 12.2.14–12.2.18 built this; `resolveActiveWaitlist` adopted in 6 section pages + shell (`?wid` > stored > newest). AC3 isolation check is the highest-value part — prior bugs in this codebase were stale-closure cross-list leaks (milestone rewards disappearing fix).
- Second-list creation entry point: settings waitlists list (`/dashboard/settings/waitlists`).

**Out of scope:** Building anything new — this is audit-only per vision `:432` ("lighter path for returning Pro founders" = already shipped).

---

### Story 19.7 — Email Deliverability Audit

**Status:** ready
**Story:** As the maintainer, I want SPF/DKIM/DMARC for our sending domains verified so that launch emails land in inboxes.

**Acceptance Criteria (EARS):**

- AC1: DNS records for `prewaitlist.com` (SPF, DKIM, DMARC) shall be captured and verified against Resend's requirements for both `notifications@` and `updates@` streams.
- AC2: The founder shall complete the Resend dashboard domain-status check (Verified) — story provides the exact steps and records what's returned.
- AC3: Code-side sender configuration shall be verified: `resolveFromAddress` streams, `sending_domain` fallback, no hardcoded sender that bypasses verified domains.
- AC4: A findings section shall document: record values, pass/fail per record, any gaps, and remediation steps.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1, AC3) DNS + code verification · T2 (AC2) Founder Resend-dashboard step (scripted instructions) · T3 (AC4) Findings doc · T4 (AC5) Lint + build

**Dev Notes:**

- Vision `:435`: "SPF/DKIM on tool's own sending domain confirmed". Domain `prewaitlist.com` was verified in Resend during Story 0.4 — this is re-confirmation + record capture, not initial setup.
- DNS queries: `Resolve-DnsName -Type TXT prewaitlist.com`, `-Type CNAME resend._domainkey.prewaitlist.com`, `-Type TXT _dmarc.prewaitlist.com` (founder runs against live DNS; record output in findings).
- Custom sending domains for founders (Story 13.5 wizard) are out of scope here — audit covers the tool's own domains only.
- Found during MEMORY scan: founder-run Resend webhook URL update (www vs apex) is tracked separately — include its verification status in AC4 findings while in the Resend dashboard.

**Out of scope:** Founder custom-domain auth UI; changing sending-domain architecture.

---

# Epic 20 — Feedback, Onboarding & Growth Tooling

**Status:** ready
**Source:** `docs/waitlist_feedback_system.md` (founder-provided), 6 👑 additions (2026-10-04), vision Sprint 4 `:437` (Product Hunt)

## Goal

Stand up the post-launch learning loop and first-run guidance: PostHog instrumentation so founder behavior is observable, a one-time dashboard walkthrough so new founders aren't lost, in-app feedback surfaces wired to Tally (per the feedback system doc's §7/§8), founder-side per-channel link attribution for their own marketing, and Product Hunt launch prep.

## Definition of Done

PostHog is capturing the core funnel events and 2–3 behavior-triggered surveys are live. New founders with ≥1 subscriber see a dismissible dashboard walkthrough exactly once. The dashboard shows a feedback button (§7 categories → Tally) and a "Talk to the founder" link (§8). The founder has a documented UTM/Dub playbook for per-channel links. Product Hunt prep checklist exists (listing copy remains founder-owned).

## Story Index

| ID   | Title                                           | Depends on | Status |
| ---- | ----------------------------------------------- | ---------- | ------ |
| 20.1 | PostHog Instrumentation + Surveys               | —          | done   |
| 20.2 | First-Subscriber Dashboard Walkthrough          | —          | done   |
| 20.3 | Feedback Surfaces (Tally Button + Founder Link) | —          | done   |
| 20.4 | Founder Marketing Links (Dub + UTM Playbook)    | —          | done   |
| 20.5 | Product Hunt Prep                               | 19.*       | done   |
| 20.6 | Founder Contact Popup (Instagram + Email)       | 20.3       | done   |

**Parallelism:** 20.1 first (events underpin everything). 20.2 and 20.3 are independent and can run in parallel. 20.4 is founder-setup + doc. 20.5 runs last within the epic (prep for launch after product is stable).

---

### Story 20.1 — PostHog Instrumentation + Surveys

**Status:** done
**Story:** As the founder, I want product analytics and a few behavior-triggered feedback surveys so that I can see where founders drop off and ask the right question at the right moment.

**Acceptance Criteria (EARS):**

- AC1: PostHog shall be initialized client-side via the official Next.js App Router pattern — `instrumentation-client.ts` at app root (supported on Next.js 16) — using `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`, with no-op behavior when the key is absent (local dev must not error). [AMENDED 2026-10-04 from `next/script` per official PostHog Next.js docs research.]
- AC2: The following funnel events from the feedback doc §16 shall fire: `account_created`, `onboarding_started`, `onboarding_completed`, `waitlist_published`, `subscriber_received`, `dashboard_viewed`, `warmth_viewed`, `broadcast_started`, `broadcast_sent`, `upgrade_triggered`, `checkout_started`, `subscription_started`, `cancelled`.
- AC3: Events shall carry minimal context properties (e.g., `waitlist_id` or `tier` where relevant) but never subscriber PII (no email addresses in event payloads).
- AC4: Autocapture shall be evaluated and either enabled (default) or explicitly disabled with rationale recorded — decision documented in Dev Notes.
- AC5: 2–3 PostHog surveys shall be configured per feedback doc §6, at minimum: "After first subscriber" (`Did seeing the first signup give you the signal you expected?`) and "Before cancellation" (`What made you decide this wasn't worth continuing?`), shown only to signed-in founders and rate-limited (once per founder per trigger).
- AC6: `.env.example` (if present) or env documentation shall list the two new `NEXT_PUBLIC_POSTHOG_*` variables.
- AC7: Lint, tests, and build shall pass; test suite stays at baseline.

**Tasks:** T1 (AC1) PostHog provider script + graceful no-key path · T2 (AC2-AC3) Event capture wiring at the touchpoints listed in Dev Notes · T3 (AC4) Autocapture decision · T4 (AC5) Two/three surveys from §6 · T5 (AC6) Env docs · T6 (AC7) Gates

**Dev Notes:**

- Verified free tier (2026-10-04): 1M events/mo, 1,500 survey responses/mo, 5K session replays, no credit card, 1 project, 1-year retention. Set a billing limit as belt-and-braces.
- Setup pattern (official PostHog Next.js docs, verified 2026-10-04): Next.js 15.3+ supports `instrumentation-client.ts` — prefer it over the older `'use client'` `providers.tsx` + `PostHogProvider` wrapper (both are documented; instrumentation-client is the lighter current recommendation). Env naming: PostHog's own tutorial uses `NEXT_PUBLIC_POSTHOG_KEY` — our two-var plan matches. Autocapture is ON by default in current SDK defaults (AC4: keep default + record decision). Surveys require the client SDK to be initialized (AC5 depends on AC1 pattern). Reverse-proxying `/ingest` to dodge ad-blockers is documented by PostHog but NOT in scope for MVP — note as v1.1 option. If a Content-Security Policy is ever added, allow `*.posthog.com`.
- Touchpoint mapping (event → code location):
  - `account_created` → `auth/callback/route.ts` (first login) or signup completion client
  - `onboarding_started` → `onboarding/1` mount; `onboarding_completed` → success page
  - `waitlist_published` → onboarding Step 5 launch success
  - `subscriber_received` → `POST /api/subscribers` success (server-side capture needs `posthog-node` — decision: fire from thank-you page client instead to avoid new server dep; record choice)
  - `dashboard_viewed` → `dashboard/page.tsx` client
  - `warmth_viewed` → `/dashboard/warmth` mount
  - `broadcast_started`/`broadcast_sent` → `broadcast/client.tsx` compose + post-send
  - `upgrade_triggered` → `triggerUpgrade(trigger)` from `useUpgradeModal()` in `src/app/dashboard/shell.tsx:52` (the shared hook is the choke point — 9 call sites: `email_customisation`, `qual_question` ×2, `pro-cta-onboarding`, `subscriber_cap`, `warmth` ×2, `billing`, `pro-cta-billing`)
  - `checkout_started` → `use-paddle-upgrade.ts` / modal checkout open
  - `subscription_started` → Paddle webhook success (server — see `posthog-node` note) or billing page "pro" poll success
  - `cancelled` → `cancellation-flow.tsx` completion
- Server-side events (`subscription_started`, `cancelled`) either use `posthog-node` (a second small dep — flag in story execution, default = capture client-side at the moment of confirmed state change to stay zero-dep) or are deferred with a note. Do not silently skip AC2.
- Surveys: PostHog surveys render as in-app popups — they collide visually with `UpgradeModal` and the planned 20.2 walkthrough. Suppress surveys while the upgrade modal or walkthrough is active (simple flag/ref check).
- Copy: survey question strings come **verbatim** from `docs/waitlist_feedback_system.md` §6 (founder-provided = pre-approved). Button/dismiss labels come from PostHog defaults or existing app copy — no new copy.
- `cancelled` vs `canceled` — our Paddle events use `subscription.canceled` (one L); keep the **event name** as `cancelled` per §16 doc, keep the **webhook** matching Paddle's spelling.

**Out of scope:** Full §16 event list (remaining events added post-launch as questions arise); data warehouse/dashboards building; funnel analysis interpretation.

---

### Story 20.2 — First-Subscriber Dashboard Walkthrough

**Status:** done
**Story:** As a founder seeing my dashboard with a real subscriber for the first time, I want a short guided walkthrough so that I know what to do next.

**Acceptance Criteria (EARS):**

- AC1: The walkthrough shall start only when ALL hold: user is on `/dashboard`, the active waitlist has `subscriber_count >= 1`, and the tour has not been completed/dismissed before (localStorage flag).
- AC2: The tour shall use `driver.js` (MIT) with a modal overlay, highlighting real dashboard elements (stat cards, subscriber table, warm panel / sidebar sections as designed) in sequence.
- AC3: Tour step count shall be ≤ 6 steps, each with a title + description, plus Next/Skip controls; Skip or completion sets the localStorage flag.
- AC4: A "Replay tour" affordance shall be available (small link/button in the dashboard header or settings) so the founder can rerun it on demand.
- AC5: Tour step content strings shall be reviewed against the copy gate: strings sourced from the feedback doc or existing app copy; any new user-facing copy requires founder approval before merge.
- AC6: The tour shall not render during the initial page-load skeleton (only after data resolves).
- AC7: Mobile (375px): tour renders without breaking layout — elements must be highlightable or the tour degrades to sequential cards (document choice).
- AC8: Lint, tests, and build shall pass (add component test: trigger conditions + completion flag).

**Tasks:** T1 (AC1, AC6) Trigger gate (subscriber count + dismissal flag + post-load) · T2 (AC2-AC3) driver.js install + step definitions · T3 (AC4) Replay affordance · T4 (AC5) Copy review · T5 (AC7) Mobile behavior · T6 (AC8) Tests + gates

**Dev Notes:**

- New dependency: `driver.js` — MIT, ~5kb, no deps, commercial use free (verified 2026-10-04). Import `driver.js` + `driver.js/dist/driver.css`.
- Data for the gate: dashboard already has subscriber count + server tier via layout → shell. Persist dismissal key: `founder-dashboard-tour-complete` (v1-friendly; add version prefix if steps change: `tour-v1-done`).
- Wiring location: `src/app/dashboard/shell.tsx` (client shell owns client state) — start tour after skeletons resolve (respect `react-hooks/set-state-in-effect` lint rule: initialize refs lazily, start from an effect that reads `localStorage` via lazy init pattern used elsewhere).
- The 20.1 surveys must not fire while the tour is active (coordinate flags).
- Interaction with empty state: tour requires ≥1 subscriber so it never tours the Epic 12.1.1 empty state — that's deliberate (founder brief: "on first visit to active dashboard after first subscriber").

**Out of scope:** Tours for onboarding (onboarding has its own flow/progress UX); multi-page tours; tours on public pages.

---

### Story 20.3 — Feedback Surfaces (Tally Button + Founder Link)

**Status:** done
**Story:** As a user, I want an always-available feedback button and a direct way to reach the founder so that problems I hit are cheap to report.

**Acceptance Criteria (EARS):**

- AC1: The dashboard shall include a feedback entry point (floating action button or fixed sidebar/footer control) that opens the founder's Tally feedback form.
- AC2: The form flow per feedback doc §7 shall be supported: category selection (🐛 Bug, 😕 Confusing, 💡 Idea, ❤️ Love this, ❌ Something is missing, 💬 Other) then free-text ("Tell me what happened."), optional follow-up consent ("Can I follow up with you?"). Implementation: categories are Tally form options (preferred, zero code) OR an in-app picker that passes category via Tally hidden field — choose one, document in Dev Notes.
- AC3: A "Talk to the founder" surface per §8 ("Something feels wrong? Tell me.") shall be present, linking to the founder-provided contact/social URL (constant, single location).
- AC4: Feedback surfaces shall be available on all founder-authenticated dashboard pages and NOT on public subscriber-facing pages (public users are subscribers, not founder users).
- AC5: Copy strings shall be verbatim from `docs/waitlist_feedback_system.md` §7/§8 — no paraphrasing (copy-gate).
- AC6: The Tally embed shall not block dashboard interactivity (lazy-load on open; popup/overlay rather than inline iframe occupying layout).
- AC7: An environment/config constant shall hold the Tally URL + founder contact URL so founder can swap them without code changes (env vars = ask-first rule: these two new `NEXT_PUBLIC_*` vars are covered by this story's approval).
- AC8: Lint, tests, and build shall pass.

**Tasks:** T1 (AC1, AC4) Feedback entry point placement + scoping · T2 (AC2) Category flow (Tally options or picker) · T3 (AC3) Founder link surface · T4 (AC5) Copy verification · T5 (AC6-AC7) Embed loading + env constants · T6 (AC8) Gates

**Dev Notes:**

- Verified (2026-10-04): Tally free = unlimited forms + responses + conditional logic; Tally branding remains on free tier (acceptable — form is hosted by Tally anyway).
- Founder must create ONE Tally form in his account: fields = category (multiple choice, the 6 §7 labels), "Tell me what happened." (long text), "Can I follow up with you?" (yes/no), email (optional — Tally's hidden-field email or visible optional field per founder's call at execution; flag as copy decision).
- If using hidden fields: `https://tally.so/r/XXXX?category=bug` — the in-app picker sets `category`.
- Placement recommendation: fixed bottom-right FAB on dashboard (design tokens: `rounded-full`, `bg-accent` hover, `shadow-[var(--shadow-float)]`), z-index below UpgradeModal so checkout overlays still win.
- §8 copy candidates (founder picks at execution): "Talk to the founder" or "Something feels wrong? Tell me." — both pre-approved in the doc; choose one, don't write a third.
- `?src=` attribution convention already exists for footer links — keep feedback links plain unless founder wants UTM (20.4 covers campaign links).

**Out of scope:** In-house feedback database/table (doc §28 — process, not product); feedback classification tooling; subscriber-facing feedback (subscriber voice = qual answers + surveys).

---

### Story 20.4 — Founder Marketing Links (Dub + UTM Playbook)

**Status:** done
**Story:** As the founder running my own marketing, I want distinct links per social channel so that I can trace which channel drives signups.

**Acceptance Criteria (EARS):**

- AC1: A founder-facing playbook document shall exist (location per Dev Notes) defining the UTM convention: `utm_source` (twitter/linkedin/reddit/ph/...), `utm_medium=social|launch|email`, `utm_campaign` (campaign name), plus worked examples for the main channels.
- AC2: The playbook shall include Dub setup steps: account creation, creating one link per channel (free tier: 25 new links/mo, 1K tracked clicks/mo, 30-day analytics, 3 domains — verified 2026-10-04), and where to read per-link click results.
- AC3: The playbook shall state how to verify attribution end-to-end: Dub/UTM link → landing → PostHog (20.1) sees matching `utm_source` on `account_created`/`onboarding_started`.
- AC4: Zero product code changes — this story is setup + documentation only (unless a UTM-pass bug is found, which routes to a fix task here).
- AC5: Lint and build shall pass (doc-only change still gated).

**Tasks:** T1 (AC1) UTM convention section · T2 (AC2) Dub setup section · T3 (AC3) Attribution verification section · T4 (AC4-AC5) Confirm no code changes + gates

**Dev Notes:**

- Where: `docs/playbooks/founder-marketing-links.md` (new folder) or `docs/` root — pick one, keep flat.
- Existing attribution that already works: `?src=powered-by` footer links, acquisition cookie capture in proxy.ts (Story 3.0), `?ref=` (subscriber referrals — different system, don't confuse: `ref` = subscriber's referral code, NOT channel attribution).
- PostHog free tier captures utm params on pageviews by default (autocapture/pageview properties) — AC3 verification is realistic without extra wiring.
- Founder account creation for Dub is his step (ask-first satisfied by prior approval).
- **[AUDIT 2026-10-07]** Prompt #3 audit found a UTM-pass bug (AC4's sanctioned fix task): fresh signups have no `founder_profiles` row at callback → acquisition `.update()` no-opped + cookie discarded → UTM lost. Fixed with atomic `upsert(onConflict:"id")` in `src/app/auth/callback/route.ts` + 6 tests (`auth-callback-acquisition.test.ts`, mutation-verified). Playbook §3 gotcha #2 + verification steps corrected in the same audit. Full record: story file "Prompt #3 audit" section + MEMORY 20.4 block.

**Out of scope:** Building link shortening into the product; subscriber-facing share links (already `ShareButtons`/`ReferralLink`); GA/other analytics install.

---

### Story 20.5 — Product Hunt Prep

**Status:** done
**Story:** As the founder preparing a Product Hunt launch, I want a prep checklist and asset inventory so that launch day isn't improvised.

**Acceptance Criteria (EARS):**

- AC1: A prep document shall exist covering: launch checklist (tagline, description, first comment, gallery screenshots, maker comment, topics), asset inventory (og images, logo, demo GIF/video, screenshot set — reuse 21.2 captures where suitable), and launch-day runbook (reply cadence, badge ask, timing).
- AC2: The PH tagline/description/first-comment copy shall be explicitly marked as founder-authored (copy-gate: agent does not draft public listing copy).
- AC3: Pre-launch verification items shall be cross-linked: Epic 19 audits closed, Epic 21.8 launch verification passed, pricing page current, legal pages live.
- AC4: The document shall note the standing "Growth tier excluded" decision — no Growth-tier mentions in any launch material.
- AC5: Lint and build shall pass (doc-only).

**Tasks:** T1 (AC1) Checklist + inventory + runbook · T2 (AC2) Copy-gate markers · T3 (AC3-AC4) Cross-links + standing-decision check · T4 (AC5) Gates

**Dev Notes:**

- Vision `:437` "Product Hunt listing prepared" — "prepared" = checklist ready + assets identified; founder does the actual PH submission.
- Timeline note: this story runs near the end of Epic 20 but the _launch itself_ waits on 21.8.
- Assets exist: `public/PreWaitlist-logo.svg`, og-image route (Phase 5.1), design SVGs in `docs/design/`.

**Out of scope:** Submitting to PH; drafting listing copy; PH ads/spend; HN/Reddit copy (founder-owned too).

---

# Epic 21 — Full App Scan & Test Case Suite

**Status:** ready
**Source:** Vision Sprint 4 `:436` ("QA pass: every node in the user flow tested manually") + `:440` (exit condition), founder directive 2026-10-04 (user-flow doc outdated — derive test cases from the actual app)

## Goal

Build the launch-blocking verification suite: scan the real application end-to-end (routes, guards, API surface, state variants), capture screenshots of every relevant page, mine the source-of-truth docs for expected behavior, audit input validation with evidence, and synthesize it all into a single founder-executable manual test-case document — then fix what fails, execute the suite, and sign off on launch readiness.

## Definition of Done

`docs/qa/app-inventory.md` maps every route/guard/API/state. ~20 screenshots captured with manifest. Behavior-to-source matrix complete. Input validation failures catalogued and either fixed (21.6) or explicitly deferred with founder sign-off. `docs/qa/manual-test-cases.md` exists as a single file with every case citing its expected-result source, and every case passes in 21.7. Epic 21.8 confirms the vision exit condition + final gates.

## Story Index

| ID   | Title                                                     | Depends on                      | Status |
| ---- | --------------------------------------------------------- | ------------------------------- | ------ |
| 21.1 | Full App Inventory & Behavior Scan                        | —                               | ready  |
| 21.2 | Page Capture (Core Screenshot Set)                        | 21.1                            | ready  |
| 21.3 | Document Cross-Reference Scan (Behavior-to-Source Matrix) | —                               | ready  |
| 21.4 | Input Validation Audit                                    | 21.1                            | ready  |
| 21.5 | Manual Test-Case Document                                 | 21.1–21.4, 19.1–19.2, 20.1–20.3 | ready  |
| 21.6 | Fix Pass on Validated Failures                            | 21.4, 21.5                      | ready  |
| 21.7 | Full QA Execution                                         | 21.5, 21.6, 19.*                | ready  |
| 21.8 | Launch Verification                                       | 19.\*, 20.\*, 21.7              | ready  |

**Chain:** 21.1 → 21.2 → 21.4 are sequential within the scan phase; 21.3 runs parallel to 21.1 (independent doc mining). 21.5 waits for: scan outputs (21.1–21.4) + Epic 19 fixes (test expectations must reflect fixed behavior, especially 19.1/19.2) + Epic 20 surfaces (20.1–20.3 need test cases too). 21.6 fixes what 21.4/21.5 surface. 21.7 executes. 21.8 signs off.

**Standing rule (founder 2026-10-04):** `docs/planning-docs/user-flow-waitlist-tool.md` is historical only. Do not derive test cases from it. The app scan (21.1), screenshots (21.2), and source docs (21.3) are the only inputs to 21.5.

---

### Story 21.1 — Full App Inventory & Behavior Scan

**Status:** ready
**Story:** As the QA author, I want a code-derived inventory of every route, guard, API endpoint, and state variant so that test cases are grounded in what actually exists.

**Acceptance Criteria (EARS):**

- AC1: The scan shall produce `docs/qa/app-inventory.md` containing: (a) every App Router page (36 identified 2026-10-04) with purpose, auth requirement, tier gating, and template/tier variants; (b) every API route with method, auth model, validation inputs, and error responses; (c) proxy.ts routing behavior (subdomain rewrite, auth guards, redirects, trailing-slash/double-subdomain handling); (d) non-route surfaces: 6 email templates + footers, upgrade modal, walkthrough (20.2), feedback surfaces (20.3).
- AC2: Each entry shall list observable states: empty vs populated, free vs pro (where behavior differs), loading, error.
- AC3: Each entry shall list its guards: signed-in required, email verified, archived/`?wid` handling, rate limits, cap checks.
- AC4: The inventory shall cross-reference existing known-good behaviors (from MEMORY/audits) so 21.5 doesn't re-discover fixed items as bugs.
- AC5: Findings that contradict docs (route exists but undocumented, or doc claims route that doesn't exist) shall be listed in a "discrepancies" section.
- AC6: Lint and build shall pass.

**Tasks:** T1 (AC1a) Page inventory (glob `src/app/**/page.tsx` + read each) · T2 (AC1b) API inventory (glob `src/app/api/**/route.ts`) · T3 (AC1c) Proxy/guard mapping · T4 (AC1d) Email + component surfaces · T5 (AC2-AC4) States/guards/cross-refs · T6 (AC5) Discrepancies · T7 (AC6) Gates

**Dev Notes:**

- Starting inventory (2026-10-04 glob): 36 pages — unsubscribe, unsubscribe/resubscribe, legal/terms, legal/privacy, onboarding/{success,signup,1,2,3,4,4a,5}, auth/{auth-code-error}, dashboard/{qualification,page,leaderboard,settings/{page,waitlists,security,profile,billing},broadcast,updates,warmth,subscribers/[id],[waitlistId]/settings}, (public)/[subdomain]/{page,thank-you,leaderboard,gone}, (marketing)/page, (auth)/{forgot-password,signin,verify-email,reset-password,signup}.
- Read each page file — do not infer behavior from filenames.
- Email surfaces to inventory: confirmation, moved-up, milestone congratulatory, broadcast, unsubscribe footer variants + tier-conditional footers (19.1 changes this — inventory records post-19.1 state).
- State variants worth explicit rows: waitlist page × 3 templates × free/pro (PoweredByFooter), dashboard × free/pro (locked nav/panels), onboarding two-pane vs centered layouts.

**Out of scope:** Testing (that's 21.7); writing test cases (21.5); fixing anything found.

---

### Story 21.2 — Page Capture (Core Screenshot Set)

**Status:** ready
**Story:** As the QA author, I want ~20 representative screenshots so that test cases can reference expected visual states and the founder can eyeball pages without booting the app.

**Acceptance Criteria (EARS):**

- AC1: A Playwright capture script shall exist (`tests/e2e/capture-screenshots.spec.ts` or `scripts/capture.ts`) that seeds/uses known data and captures the core set to `docs/qa/screenshots/`.
- AC2: Core set scope (~20 shots, founder decision 2026-10-04): each unique page once in its most representative state (populated waitlist, signed-in dashboard), plus mobile-viewport captures for all public pages (waitlist page, thank-you, leaderboard, gone), plus state-differentiated shots where behavior diverges (free vs pro dashboard, one alternate template, empty dashboard).
- AC3: A manifest `docs/qa/screenshots/manifest.md` shall map filename → page → state → viewport → inventory ID (from 21.1).
- AC4: Screenshots shall be committed as PNGs at a reasonable size (target: whole set < 5 MB total; compress if needed).
- AC5: The capture script shall be re-runnable (idempotent filenames, deterministic seed).
- AC6: Lint and build shall pass.

**Tasks:** T1 (AC1, AC5) Capture script with seed data · T2 (AC2) Execute core-set captures (desktop + mobile public pages) · T3 (AC3) Manifest · T4 (AC4) Size check · T5 (AC6) Gates

**Dev Notes:**

- Playwright is configured (`playwright.config.ts`, `webServer: pnpm build && pnpm start`) but existing e2e (thank-you-flow) needs seed data — the capture script must document its data prerequisites (live DB rows: subdomains `quality`, `p`, `th`, `pr` exist per MEMORY; or seed script).
- Prior art: og:image verification used prod-mode probes; happy-dom can't screenshot — must use Playwright's real browser.
- Coordinate with 19.5 (mobile audit evidence) — capture doubles as audit evidence; 19.5 references these files rather than re-capturing.
- Naming: `NN-page-state-viewport.png` (e.g., `01-waitlist-populated-desktop.png`).
- If Playwright webServer + seed proves too flaky for CI-style capture, fallback: manual capture via browser during founder QA session — record choice in manifest. Do not silently skip AC1.

**Out of scope:** Visual regression testing (pixel diffs, Percy/Chromatic); capturing every state variant (core set only — founder decision); screenshots of emails (use rendered HTML preview if needed, noted in manifest).

---

### Story 21.3 — Document Cross-Reference Scan (Behavior-to-Source Matrix)

**Status:** ready
**Story:** As the QA author, I want every expected behavior traceable to its source document so that no test case asserts an invented expectation.

**Acceptance Criteria (EARS):**

- AC1: The scan shall produce a behavior-to-source matrix in `docs/qa/behavior-sources.md`: behavior → source (story AC / PRD REQ / audit finding / MEMORY decision / design guide section).
- AC2: Sources shall be mined: story files in `docs/stories/completed/` + remaining active stories, epic docs in `docs/epics/`, PRD REQs (incl. §7.4 data model), audit docs (`docs/scans/`, `docs/completed/` plans incl. revenue lifecycle), `MEMORY.md` standing decisions/gotchas, design guides (`dashboard-design-guide.md`, `waitlist-page-design-guide.md`).
- AC3: The matrix shall flag conflicts: places where two sources disagree (e.g., vision v1.1-vs-Sprint-4 ledger, amended ACs superseded by later founder decisions) — with the governing source identified per MEMORY amendment trail.
- AC4: Standalone decisions that govern testing shall be indexed: standing constraints (Growth tier excluded, proxy not middleware, never-inline-styles), copy-gate rule, baseline test failures (7), founder decisions from 2026-09/10 sessions.
- AC5: Lint and build shall pass.

**Tasks:** T1 (AC2) Mine each source class · T2 (AC1) Build matrix · T3 (AC3) Conflict flags · T4 (AC4) Governing-decisions index · T5 (AC5) Gates

**Dev Notes:**

- This story runs parallel to 21.1 — no dependency.
- Highest-value sources for expected behavior: story ACs are the real spec (PRD is higher-level); when story ACs were amended (trail markers like `[AMENDED 2026-09-30]`), the amendment governs.
- Known conflict to resolve here: vision `:429` vs Appendix (v1.1) for analytics — already resolved by founder 2026-10-04 (defer); record as resolved.
- Keep the matrix behavior-keyed, not doc-keyed (one row per behavior with its single governing source + secondary refs).

**Out of scope:** Updating the source docs (conflicts are flagged, fixes happen in 19.0 or later with founder input); writing test cases.

---

### Story 21.4 — Input Validation Audit

**Status:** ready
**Story:** As the founder, I want every form and API input probed for validation failures so that the "already failing" hunches are confirmed with evidence before test cases are written.

**Acceptance Criteria (EARS):**

- AC1: Every form shall be probed (boundary, malformed, empty, over-length, injection-shaped inputs): signup, signin, forgot/reset password, onboarding 1 (slug/headline), 2 (template), 3 (brand color, logo URL, CTA, milestone thresholds), 4 (decision), 4a (question builder: types, options, caps), 5 (email customisation), public email capture (email format, honeypot, timing, rate limit, consent line, phone E.164, qual answers), subscriber detail PATCH (display_name ≤100), settings (profile, waitlist fields, phone mode), broadcast (subject ≤200, body ≤10k), updates (min-10, body type), waitlist POST/PATCH (slug, milestone rewards validation).
- AC2: Every API route's validation branch shall be checked: 400s with honest error strings, ordering of guards (honeypot → timing → consent → email → rate limit → tier → referral → qual → cap — Phase 6 contract), no raw-error echo to clients.
- AC3: Each probe result shall be recorded: pass / fail-with-evidence (request + actual response vs expected from 21.3 sources) / not-applicable.
- AC4: Failures shall be grouped by severity (broken = accepts invalid or crashes; weak = accepts invalid but harmless; strict = rejects valid input) — the founder-approval list for 21.5.
- AC5: Lint and build shall pass.

**Tasks:** T1 (AC1) Form probes (manual + curl/httpie against local API) · T2 (AC2) API validation-branch walkthrough · T3 (AC3-AC4) Results + severity grouping · T4 (AC5) Gates

**Dev Notes:**

- Methods: read the validation code in each route (cheap first pass), then verify the top-risk ones live (local dev server + curl). Highest-risk: slug validation + race, milestone reward thresholds (client `validateMilestoneRewards` + server), question builder caps (Free=2/Pro=5), broadcast/update length caps, phone E.164, unsubscribe HMAC tokens.
- Existing validation inventory is good: Phase 6.4/6.8 established strict ordering; Story 14.4 RFC4180; 12.2.13 display_name cap (audit F1); step-3 milestone client validation (milestone hardening F3/F4). Expect PASS on most — this audit is evidence-collection, not re-design.
- Output feeds 21.5's "Input validation" section directly: failures become pre-flagged test cases (AC4 grouping = case priority).
- Do NOT fix failures here — 21.6 owns fixes after founder approves the list (21.5 gate).

**Out of scope:** Fixing anything; security penetration testing beyond input validation; load testing.

---

### Story 21.5 — Manual Test-Case Document

**Status:** ready (founder approval gate on validation-failure list)
**Story:** As the founder, I want a single executable test document covering every flow of the real app so that I can verify the product by hand before launch.

**Acceptance Criteria (EARS):**

- AC1: `docs/qa/manual-test-cases.md` shall exist as a single file (founder decision 2026-10-04), structured with anchored sections per flow area: (1) Auth & account, (2) Onboarding, (3) Founder dashboard, (4) Public waitlist & thank-you, (5) Leaderboard & referrals, (6) Warmth, (7) Email & broadcast, (8) Billing & upgrade, (9) Feedback/tooling surfaces (20.1–20.3), (10) Edge cases & guards, (11) Mobile, (12) Input validation (pre-flagged from 21.4).
- AC2: Every case shall have: ID (`TC-<area>-NN`), title, preconditions, numbered steps, expected result **with citation** to a 21.3 source (story AC/REQ/decision) or a 21.2 screenshot reference, and a pass/fail column.
- AC3: Cases shall be derived ONLY from 21.1 inventory + 21.2 screenshots + 21.3 matrix + 21.4 findings (not from the outdated user-flow doc).
- AC4: Coverage check: every inventory row (21.1 AC1) has ≥1 case; every 21.4 failure has a pre-flagged case; every 20.x surface has ≥1 case.
- AC5: **Founder approval gate:** the 21.4 failing-validations list is presented to the founder for fix/defer decisions BEFORE the document finalises; outcomes recorded in the doc (fixed-in-21.6 vs deferred-with-signoff).
- AC6: The doc shall open with a "How to execute" header: prerequisites (accounts, tiers, seed data, local vs prod), result-recording convention, and the sanctioned test-baseline note (7 known suite failures are code-suite, not manual — don't confuse).
- AC7: Lint and build shall pass.

**Tasks:** T1 (AC1) Outline + case skeletons from inventory · T2 (AC2-AC3) Write cases with citations · T3 (AC4) Coverage check · T4 (AC5) Founder approval gate · T5 (AC6) Exec header · T6 (AC7) Gates

**Dev Notes:**

- Target size: comprehensive but executable — expect ~150–250 cases. Prefer one case per meaningful behavior; combine trivial assertions (e.g., all legal pages render = one case with 3 checks).
- Citation format: `Expected: ... (source: story-12.3 AC5)` or `Expected: ... (see screenshots/07-broadcast-pro-desktop.png)`.
- Free/pro cases need tier-switching instructions (SQL tier flip per MEMORY or Paddle sandbox upgrade) — put in the exec header.
- Email cases: note that warmth/webhook/cron paths don't work locally (MEMORY) — mark prod-only cases explicitly.
- 19.1's fix must land first: confirmation-email footer cases assert tier-correct behavior.

**Out of scope:** Automating these cases (manual doc is the deliverable); rewriting the user-flow doc.

---

### Story 21.6 — Fix Pass on Validated Failures

**Status:** ready
**Story:** As the founder, I want the validation failures I approved for fixing corrected so that the test document's expected outcomes are honest.

**Acceptance Criteria (EARS):**

- AC1: Every failure marked "fix" in the founder approval (21.5 AC5) shall be fixed with a regression test where practical.
- AC2: Every failure marked "defer" shall carry an explicit deferral note in `docs/qa/manual-test-cases.md` (what, why, target release) — no silent drops.
- AC3: Fixed behaviors shall have their test-case expected results confirmed against the fix (no stale expectations).
- AC4: No fix shall regress the sanctioned baseline: full suite returns 7 known failures (or fewer).
- AC5: Lint and build shall pass.

**Tasks:** T1 (AC1) Fix approved failures · T2 (AC2) Deferral notes · T3 (AC3) Expectation sync · T4 (AC4-AC5) Baseline + gates

**Dev Notes:**

- Severity order: broken → weak → strict (21.4 AC4 grouping).
- If a "fix" turns out to be architecturally larger than a validation tweak (e.g., requires schema/API contract change), stop and re-scope with founder — do not expand scope silently (ask-first).
- Run targeted tests per fix + one full suite at the end.

**Out of scope:** Deferred items; any improvement not on the approved list.

---

### Story 21.7 — Full QA Execution

**Status:** ready
**Story:** As the founder, I want the complete test document executed end-to-end with results recorded so that launch blockers are visible.

**Acceptance Criteria (EARS):**

- AC1: Every case in `docs/qa/manual-test-cases.md` shall be executed against the build under test (specify local or prod per case's exec header) and its pass/fail column filled with result + date.
- AC2: Failures found during execution shall be triaged: in-scope bug → fix immediately if small, else log with severity; environmental/data issue → noted; already-known → linked.
- AC3: A results summary shall head the document: total cases, passed, failed, deferred, and a launch-blocker list (any fail = blocker unless waived).
- AC4: The full automated suite + lint + build shall be run alongside and recorded (baseline 7 failures expected).
- AC5: Zero unresolved launch blockers at story completion (or explicit founder waiver recorded per blocker).

**Tasks:** T1 (AC1) Execute all cases · T2 (AC2) Triage failures · T3 (AC3) Results summary · T4 (AC4) Automated gates record · T5 (AC5) Blocker burn-down

**Dev Notes:**

- Execution order suggestion: follow doc section order (auth → onboarding → dashboard → public → …) so environment setup (tier flips, seed data) happens once per section.
- Founder may execute personally (that's the point of the manual doc) with the agent standing by for triage/fixes — coordinate in session.
- Two-tier reality: some cases are prod-only (emails, webhooks, cron, og:image) — execute those against `www.prewaitlist.com`/subdomains and note environment per case.

**Out of scope:** Writing new cases during execution (small addendums allowed if a gap is found — add with citation, execute, note); performance/load testing.

---

### Story 21.8 — Launch Verification

**Status:** ready
**Story:** As the founder, I want a final launch-readiness sign-off against the vision exit condition so that Sprint 4 closes with a clear go/no-go.

**Acceptance Criteria (EARS):**

- AC1: The vision exit condition (`:440`) shall be walked explicitly: sign up → build waitlist → collect signups → track warmth → send broadcast → export data — each step verified working on production Vercel with no broken state (evidence: 21.7 results + live check).
- AC2: Epic 19 completion shall be confirmed: 8/8 stories done or explicitly deferred with sign-off; P0 tier fix verified in production (Pro confirmation email has no Powered-by).
- AC3: Epic 20 completion shall be confirmed: PostHog capturing events live, surveys live, walkthrough firing once for a qualifying founder, feedback button + founder link live, Dub playbook delivered, PH prep delivered.
- AC4: Final gates recorded: `pnpm lint` 0 errors, full suite at baseline (7 sanctioned failures), clean `pnpm build`, prettier clean.
- AC5: An open-items register shall list everything still pending outside code: Resend webhook URL dashboard update (www endpoint), `*.prewaitlist.com` wildcard DNS in Vercel, founder env vars (PostHog key, Tally URL, contact URL) presence in Vercel, any 21.6 deferrals.
- AC6: A launch recommendation (go / no-go with reasons) shall be stated, tied to AC1–AC5 evidence.

**Tasks:** T1 (AC1) Live exit-condition walkthrough · T2 (AC2-AC3) Epic completion confirmation · T3 (AC4) Final gates · T4 (AC5) Open-items register · T5 (AC6) Recommendation

**Dev Notes:**

- This story is the Sprint 4 exit gate — `epic-check` (Prompt #4) runs here as the independent audit layer on top of this self-verification.
- Deploy to production before AC1 (Vercel auto-deploys from `main` per MEMORY flow: merge dev → main).
- Open items from MEMORY that predate Sprint 4 and must appear in AC5: Paddle webhook prod URL (founder updated 2026-10-03 — confirm), Resend webhook (www, live-verified 2026-09-27 — confirm current), og:image:alt static string question.

**Out of scope:** Actual Product Hunt submission (20.5 prepares only); post-launch monitoring setup beyond Epic 20.

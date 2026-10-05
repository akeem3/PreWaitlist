# Epic 19 — Product Fixes & Polish

**Status:** done
**Source:** [MVP Vision Sprint 4](../product-vision-mvp-waitlist-tool.md#sprint-4--polish-qa-edge-cases-analytics-product-hunt-prep) (`:420-440`), founder report "Pro account emails still display Powered by"

## Design References

| Reference                                                      | File |
| -------------------------------------------------------------- | ---- |
| None - Epic 19 introduces no new UI (fixes, audits, docs only) | -    |

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

Stories are ordered by dependency: 19.0-19.6 are independent and may run in parallel; 19.7 depends on 19.1 so deliverability verification runs against the fixed footer code. Every story moves `ready` -> `in-progress` -> `done` (or `blocked`), and is only marked `done` when its lint/test/build gates pass. See `docs/epics/sprint-4-plan.md` for sprint-level context.

---

### Story 19.0 — Doc Debt: PRD Sprint 4 + Stale Tables

**Status:** done
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Story:** As the maintainer, I want the PRD to contain a Sprint 4 section and stale planning tables corrected so that Epics 19–21 have authoritative doc sources.

**Acceptance Criteria (EARS):**

- AC1: The PRD shall contain a Sprint 4 section describing the scope captured in this plan (fixes, tooling additions, QA suite), cross-referencing Epics 19–21.
- AC2: `docs/epics/sprint-3-plan.md` "What's NOT Built (Sprint 4 scope)" table shall be annotated: items actually moved to v1.1 (custom domain mapping), post-MVP, or shipped elsewhere (multi-waitlist) shall be relabeled so no row falsely claims "Sprint 4 scope".
- AC3: The vision doc Sprint 4 section (`:420-440`) shall carry an amendment note: referral tree + traffic summary deferred to v1.1 (founder decision 2026-10-04); the six 👑 additions are tracked in Epics 20–21.
- AC4: `docs/planning-docs/user-flow-waitlist-tool.md` shall be marked as historical/outdated with a pointer to `docs/qa/manual-test-cases.md` (once created by 21.5).
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) PRD Sprint 4 section · T2 (AC2-AC4) Stale-table + vision + user-flow annotations · T3 (AC5) Lint + build

**Out of scope:** Rewriting the user-flow doc itself.

**Dev Notes:**

- PRD currently declares 5 sprints (1, 2, 3, 3.1, 3.2) with no Sprint 4 section; header still says "Sprint 2 active" — fix the header while there.
- Keep the PRD section short and pointer-style (this plan is the detail source).
- AC4 pointer target won't exist until 21.5 — write the note as "superseded by docs/qa/manual-test-cases.md (Epic 21)".

---

### Story 19.1 — Pro Email Tier Fix (P0)

**Status:** done
**Design Refs:** - (no new UI; fixes/audits/docs only)
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

**Out of scope:** Any footer visual redesign; broadcast footer changes; email template copy.

**Dev Notes:**

- **Root cause (confirmed 2026-10-04):** `.select("founder_profiles!inner(tier)").eq("id", waitlist_id).single()` returns `waitlistWithTier.founder_profiles` as an **object** (many-to-one embed). The code casts it to `{ tier: string }[]` and indexes `[0]` → `undefined` → `|| "free"` → tier is **always "free"** → every confirmation/moved-up email gets `buildFreeEmailFooter`.
- **Correct pattern already exists in the same file** at `:526-528`: `Array.isArray(x) ? x[0] : x` — reuse it (or a small shared helper) in both email paths.
- `route.ts:898` `console.log("Email tier for waitlist ...")` is the live-verification probe — after the fix it must print `pro` for a Pro waitlist.
- `milestones.ts:22` currently: `buildEmailFooter(waitlist?.business_address)` unconditional. AC5 makes it tier-conditional — the tier is already fetched and passed into the milestone notify path (`route.ts:917`, `:1094` pass `tier`) — verify and thread through if not already.
- Broadcast footers (`buildBroadcastEmailFooter`/`WithUrl`) intentionally have NO Powered-by (address + unsubscribe only) — do not add one; broadcast is Pro-gated anyway.
- Which footer does a FREE founder's confirmation use today? `buildFreeEmailFooter` (bug side-effect) — behavior unchanged for free; only `pro` changes. AC7 test covers both.
- Footer inventory (6 paths): confirmation, moved-up, milestone (email) · waitlist page, thank-you, leaderboard (page).

---

### Story 19.2 — CSV Export Polish (Quality Column)

**Status:** done
**Design Refs:** - (no new UI; fixes/audits/docs only)
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

**Out of scope:** New computed quality scores beyond warmth; export format changes (parquet etc.). **[AMENDED 2026-10-04 — founder: referral-quality % (amended AC2) is now in scope; "beyond warmth" still excludes any third score.]**

**Dev Notes:**

- Vision `:430`: "CSV export polish (all columns, all tiers)". Existing conditional selects at `:57/:64` (phone/display_name arms) — the literal-template-literal gotcha from phone-collection applies: branch the full select per arm, never interpolate columns into a template literal.
- ~~The dashboard table shows Warmth badges — "Quality" in vision vs "Warmth" column naming: name the header `Quality` per vision, value = warmth tier string (hot/warm/cold). Founder can rename in 21.x review if desired (copy-gate — flag, don't invent).~~ **[SUPERSEDED 2026-10-04 by amended AC2 — value is now referral-quality % (dashboard parity), header stays `Quality` per vision.]**
- Free-tier CSV gating: `src/lib/pricing-features.ts` lists CSV under FREE_FEATURES (per Epic 13 AC2 note) — verify while here (AC5).
- **OWASP formula-injection flag (research 2026-10-04):** `escapeCsvCell` (`export/route.ts`) is RFC4180 quoting only — cells beginning with `=`, `+`, `-`, or `@` (free-text qual answers are subscriber-controlled) execute as formulas when the CSV is opened in Excel (OWASP WSTG-INPV-21). Mitigation is trivial (prefix `'` on formula-leading cells). **Decision (founder, 2026-10-04): FOLDED INTO THIS STORY as AC8** — flagged in the create-epic [19] Phase 5 report; no longer deferred.

---

### Story 19.3 — Edge-Case Audit

**Status:** done
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Story:** As the maintainer, I want every documented edge case exercised and either handled or deferred so that no flow dead-ends in production.

**Acceptance Criteria (EARS):**

- AC1: The system shall be audited against this edge-case matrix, each row marked pass/fixed/deferred with evidence: expired verification links, expired/invalid unsubscribe tokens, archived waitlist public access (`/gone`), unknown subdomain, deleted/missing waitlist in dashboard deep links, duplicate email signup (409 path), at-cap signup (free 500), duplicate waitlist slug race, invalid `?ref=` codes, self-referral, missing `?wid=`/unknown `?wid=`, zero-subscriber dashboard panels (all 6+ panels), `?plan=pro` on already-Pro account.
- AC2: Findings that are broken (dead-end, crash, silent failure) shall be fixed in this story.
- AC3: Findings intentionally deferred shall be recorded in the story's results section with founder sign-off.
- AC4: Each fix shall have a test or be covered by a 21.5 test case (cross-reference noted).
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Execute matrix, record evidence · T2 (AC2) Fix broken rows · T3 (AC3-AC4) Defer log + test cross-refs · T4 (AC5) Lint + build

**Out of scope:** Input-validation rules (21.4 owns); fraud/fingerprinting (post-MVP standing decision).

**Dev Notes:**

- Known-good already (don't re-fix): archived → `/gone` on leaderboard/thank-you (4.3), unknown-`?wid` self-heal (shell:203-213), duplicate email 409 (Story 7.4), self-referral silent nullify (Story 8.2), at-cap 403 (route:532), FlushGate fresh-founder path (revenue audit F1).
- Empty states per panel exist from Epic 12.1.1 — verify each of: stat cards, chart, qualification, warmth, top referrers, warning banner, subscriber table, updates.
- Rate limit / honeypot / timing paths on `POST /api/subscribers` are part of 21.4 (validation audit) — don't duplicate here; this story covers navigation/state edge cases.

---

### Story 19.4 — Error & Loading States Audit

**Status:** done
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Story:** As a user, I want every async operation to show a loading state and a recoverable error state so that failures never present as a blank or frozen screen.

**Acceptance Criteria (EARS):**

- AC1: Every client-side fetch in pages/components shall be audited: each has an in-flight indicator (spinner/skeleton/"Saving…") and a failure branch with user-visible messaging.
- AC2: Loading skeletons that exist (`onboarding/loading.tsx`, `dashboard/loading.tsx`, chart/panel skeletons) shall be verified to render on the real navigation paths.
- AC3: Server route handlers shall return non-2xx with an `error` string for every failure path (no silent 200-with-error).
- AC4: Broken rows found (fetch with no error handling, unhandled promise, error swallowed to console only) shall be fixed.
- AC5: Deferred items shall be logged with founder sign-off.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Audit matrix with evidence · T2 (AC3) Server error-path check · T3 (AC4) Fixes · T4 (AC5) Defer log · T5 (AC6) Lint + build

**Out of scope:** Redesigning skeletons; new loading UI beyond existing design-system patterns.

**Dev Notes:**

- Highest-risk spots (check first): `use-paddle-upgrade.ts` (known console-only silent failure — flagged, not fixed, in Pro-CTA session), settings `saveField` paths, dashboard auto-refresh, `FlushGate`, onboarding debounced slug check, broadcast send, updates publish, CSV download.
- Existing patterns to reuse: `EMAIL_FAILED_COPY` honest-status pattern (Phase B), `res.ok`/`data.error` modal pattern (Epic 13 post-deploy fix).

---

### Story 19.5 — Mobile Responsiveness Audit

**Status:** done
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Story:** As a visitor on a phone, I want every public and dashboard screen usable so that mobile traffic isn't lost.

**Acceptance Criteria (EARS):**

- AC1: Each screen shall be audited at 375×667 and 768×1024 viewports: public waitlist page (3 templates), thank-you, leaderboard, gone, marketing home, auth pages (signup/signin/verify/forgot/reset), onboarding steps 1–5/4a/success (two-pane and centered layouts, sticky mobile CTA), dashboard home + all 7 section pages + subscriber detail + settings tree (hub/list/detail/billing/profile).
- AC2: Findings (overflow, unreachable controls, table clipping, text collision) shall be listed with screenshots as evidence.
- AC3: All P0/P1 findings (unusable at 375px) shall be fixed.
- AC4: P2 findings (polish-level) shall be logged for founder triage.
- AC5: Mobile fixes shall use existing responsive utilities only — no new breakpoints or tokens.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Audit with evidence · T2 (AC3) Fix P0/P1 · T3 (AC4) Triage log · T4 (AC5-AC6) Token compliance + lint/build

**Out of scope:** Native app behavior; tablet-specific layouts beyond the 768 check.

**Dev Notes:**

- Playwright (21.2 capture) can double as evidence gathering — coordinate with 21.2's mobile viewport shots so the audit doesn't re-capture.
- Prior mobile work: 12.1.5 (table overflow, responsive grids), Epic 4 sticky mobile CTA, leaderboard mobile responsive (7.5) — audit verifies these still hold post-Epic 18 redesign.
- Epic 18.6–18.8 redesigned the live page + preview fit — re-verify preview scaling on small screens (this is where regressions are most likely).

---

### Story 19.6 — Second-Waitlist Flow Audit

**Status:** done
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Story:** As a Pro founder, I want the multi-waitlist experience (switcher, create-second-list, per-waitlist settings) verified so that the feature shipped in Epic 12.2 works end-to-end.

**Acceptance Criteria (EARS):**

- AC1: The flow shall be exercised: create second waitlist from settings hub → appears in waitlist list → switch via `?wid`/switcher → dashboard + all section pages reflect active waitlist → per-waitlist settings edit persists → archived list behaves (hidden/gone).
- AC2: Free-tier attempt at a second list (if gated) shall show the correct upgrade/limit behavior; ungated behavior shall be recorded as-is.
- AC3: Cross-waitlist data isolation shall be verified: subscribers, updates, broadcast, warmth of list A never render under list B.
- AC4: Findings shall be fixed or deferred with founder sign-off.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Execute flow with evidence · T2 (AC4) Fix/defer · T3 (AC5) Lint + build

**Out of scope:** Building anything new — this is audit-only per vision `:432` ("lighter path for returning Pro founders" = already shipped).

**Dev Notes:**

- Stories 12.2.14–12.2.18 built this; `resolveActiveWaitlist` adopted in 6 section pages + shell (`?wid` > stored > newest). AC3 isolation check is the highest-value part — prior bugs in this codebase were stale-closure cross-list leaks (milestone rewards disappearing fix).
- Second-list creation entry point: settings waitlists list (`/dashboard/settings/waitlists`).

---

### Story 19.7 — Email Deliverability Audit

**Status:** done
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Story:** As the maintainer, I want SPF/DKIM/DMARC for our sending domains verified so that launch emails land in inboxes.

**Acceptance Criteria (EARS):**

- AC1: DNS records for `prewaitlist.com` (SPF, DKIM, DMARC) shall be captured and verified against Resend's requirements for both `notifications@` and `updates@` streams.
- AC2: The founder shall complete the Resend dashboard domain-status check (Verified) — story provides the exact steps and records what's returned.
- AC3: Code-side sender configuration shall be verified: `resolveFromAddress` streams, `sending_domain` fallback, no hardcoded sender that bypasses verified domains.
- AC4: A findings section shall document: record values, pass/fail per record, any gaps, and remediation steps.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1, AC3) DNS + code verification · T2 (AC2) Founder Resend-dashboard step (scripted instructions) · T3 (AC4) Findings doc · T4 (AC5) Lint + build

**Out of scope:** Founder custom-domain auth UI; changing sending-domain architecture.

**Dev Notes:**

- Vision `:435`: "SPF/DKIM on tool's own sending domain confirmed". Domain `prewaitlist.com` was verified in Resend during Story 0.4 — this is re-confirmation + record capture, not initial setup.
- DNS queries: `Resolve-DnsName -Type TXT prewaitlist.com`, `-Type CNAME resend._domainkey.prewaitlist.com`, `-Type TXT _dmarc.prewaitlist.com` (founder runs against live DNS; record output in findings).
- Custom sending domains for founders (Story 13.5 wizard) are out of scope here — audit covers the tool's own domains only.
- Found during MEMORY scan: founder-run Resend webhook URL update (www vs apex) is tracked separately — include its verification status in AC4 findings while in the Resend dashboard.

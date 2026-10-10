# Epic 21 — Full App Scan & Test Case Suite

**Status:** ready
**Source:** Vision Sprint 4 `:436` ("QA pass: every node in the user flow tested manually") + `:440` (exit condition), founder directive 2026-10-04 (user-flow doc outdated — derive test cases from the actual app)

## Design References

| Reference                                                                                                       | File |
| --------------------------------------------------------------------------------------------------------------- | ---- |
| None - Epic 21 introduces no new UI (QA inventory, screenshots of existing screens, and the test-case document) | -    |

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

Every story moves `ready` -> `in-progress` -> `done` (or `blocked`), and is only marked `done` when its lint/test/build gates pass. See `docs/epics/sprint-4-plan.md` for sprint-level context.

**Standing rule (founder 2026-10-04):** `docs/planning-docs/user-flow-waitlist-tool.md` is historical only. Do not derive test cases from it. The app scan (21.1), screenshots (21.2), and source docs (21.3) are the only inputs to 21.5.

---

### Story 21.1 — Full App Inventory & Behavior Scan

**Status:** ready
**Design Refs:** - (no new UI; spec = live codebase — pages, APIs, proxy behavior — not SVG)
**Story:** As the QA author, I want a code-derived inventory of every route, guard, API endpoint, and state variant so that test cases are grounded in what actually exists.

**Acceptance Criteria (EARS):**

- AC1: The scan shall produce `docs/qa/app-inventory.md` containing: (a) every App Router page (36 identified 2026-10-04) with purpose, auth requirement, tier gating, and template/tier variants; (b) every API route with method, auth model, validation inputs, and error responses; (c) proxy.ts routing behavior (subdomain rewrite, auth guards, redirects, trailing-slash/double-subdomain handling); (d) non-route surfaces: 6 email templates + footers, upgrade modal, walkthrough (20.2), feedback surfaces (20.3).
- AC2: Each entry shall list observable states: empty vs populated, free vs pro (where behavior differs), loading, error.
- AC3: Each entry shall list its guards: signed-in required, email verified, archived/`?wid` handling, rate limits, cap checks.
- AC4: The inventory shall cross-reference existing known-good behaviors (from MEMORY/audits) so 21.5 doesn't re-discover fixed items as bugs.
- AC5: Findings that contradict docs (route exists but undocumented, or doc claims route that doesn't exist) shall be listed in a "discrepancies" section.
- AC6: Lint and build shall pass.

**Tasks:** T1 (AC1a) Page inventory (glob `src/app/**/page.tsx` + read each) · T2 (AC1b) API inventory (glob `src/app/api/**/route.ts`) · T3 (AC1c) Proxy/guard mapping · T4 (AC1d) Email + component surfaces · T5 (AC2-AC4) States/guards/cross-refs · T6 (AC5) Discrepancies · T7 (AC6) Gates

**Out of scope:** Testing (that's 21.7); writing test cases (21.5); fixing anything found.

**Dev Notes:**

- Starting inventory (2026-10-04 glob): 36 pages — unsubscribe, unsubscribe/resubscribe, legal/terms, legal/privacy, onboarding/{success,signup,1,2,3,4,4a,5}, auth/{auth-code-error}, dashboard/{qualification,page,leaderboard,settings/{page,waitlists,security,profile,billing},broadcast,updates,warmth,subscribers/[id],[waitlistId]/settings}, (public)/[subdomain]/{page,thank-you,leaderboard,gone}, (marketing)/page, (auth)/{forgot-password,signin,verify-email,reset-password,signup}.
- Read each page file — do not infer behavior from filenames.
- Email surfaces to inventory: confirmation, moved-up, milestone congratulatory, broadcast, unsubscribe footer variants + tier-conditional footers (19.1 changes this — inventory records post-19.1 state).
- State variants worth explicit rows: waitlist page × 3 templates × free/pro (PoweredByFooter), dashboard × free/pro (locked nav/panels), onboarding two-pane vs centered layouts.

---

### Story 21.2 — Page Capture (Core Screenshot Set)

**Status:** ready
**Design Refs:** - (no new UI; captures = live-app screenshots of existing screens, not SVG)
**Story:** As the QA author, I want ~20 representative screenshots so that test cases can reference expected visual states and the founder can eyeball pages without booting the app.

**Acceptance Criteria (EARS):**

- AC1: A Playwright capture script shall exist (`tests/e2e/capture-screenshots.spec.ts` or `scripts/capture.ts`) that seeds/uses known data and captures the core set to `docs/qa/screenshots/`.
- AC2: Core set scope (~20 shots, founder decision 2026-10-04): each unique page once in its most representative state (populated waitlist, signed-in dashboard), plus mobile-viewport captures for all public pages (waitlist page, thank-you, leaderboard, gone), plus state-differentiated shots where behavior diverges (free vs pro dashboard, one alternate template, empty dashboard).
- AC3: A manifest `docs/qa/screenshots/manifest.md` shall map filename → page → state → viewport → inventory ID (from 21.1).
- AC4: Screenshots shall be committed as PNGs at a reasonable size (target: whole set < 5 MB total; compress if needed).
- AC5: The capture script shall be re-runnable (idempotent filenames, deterministic seed).
- AC6: Lint and build shall pass.

**Tasks:** T1 (AC1, AC5) Capture script with seed data · T2 (AC2) Execute core-set captures (desktop + mobile public pages) · T3 (AC3) Manifest · T4 (AC4) Size check · T5 (AC6) Gates

**Out of scope:** Visual regression testing (pixel diffs, Percy/Chromatic); capturing every state variant (core set only — founder decision); screenshots of emails (use rendered HTML preview if needed, noted in manifest).

**Dev Notes:**

- Playwright is configured (`playwright.config.ts`, `webServer: pnpm build && pnpm start`) but the three existing e2e specs (homepage, public-waitlist, thank-you-flow) need seed data — the capture script must document its data prerequisites (live DB rows: subdomains `quality`, `p`, `th`, `pr` exist per MEMORY; or seed script).
- Prior art: og:image verification used prod-mode probes; happy-dom can't screenshot — must use Playwright's real browser.
- Coordinate with 19.5 (mobile audit evidence) — capture doubles as audit evidence; 19.5 references these files rather than re-capturing.
- Naming: `NN-page-state-viewport.png` (e.g., `01-waitlist-populated-desktop.png`).
- Official Playwright screenshots-doc findings for the script (researched 2026-10-04): `page.screenshot({ path, fullPage: true })` for full-scroll pages (or viewport-only for dashboard shots — record the choice per row in the manifest); `scale: "css"` (not device DPR) keeps PNGs small and aids the AC4 <5 MB target; `page.mouse.move(-1, -1)` before capture so hover states don't vary between runs; note that `expect(page).toHaveScreenshot()` visual-regression diffing is a separate Playwright capability = deliberately out of scope per Out of scope.
- If Playwright webServer + seed proves too flaky for CI-style capture, fallback: manual capture via browser during founder QA session — record choice in manifest. Do not silently skip AC1.
- **Capture tooling (decision 2026-10-05):** screenshots will be taken by the agent via Playwright's `page.screenshot()` in the capture script — the same tooling proven in the 19.5 mobile audit (62 shots in ~4 min) and the 19.6 second-waitlist audit (`19.6-*.png` in `docs/qa/screenshots/`). Agent-side re-viewing of PNGs is unreliable (known read-tool image glitch) — the agent verifies captures by file existence, dimensions, and byte size; the founder eyeballs the PNGs at triage. Manifest citations in 21.5 are written for founder review.

---

### Story 21.3 — Document Cross-Reference Scan (Behavior-to-Source Matrix)

**Status:** ready
**Design Refs:** - (no new UI; spec = source docs — story ACs, PRD REQs, audits, MEMORY, design guides — not SVG)
**Story:** As the QA author, I want every expected behavior traceable to its source document so that no test case asserts an invented expectation.

**Acceptance Criteria (EARS):**

- AC1: The scan shall produce a behavior-to-source matrix in `docs/qa/behavior-sources.md`: behavior → source (story AC / PRD REQ / audit finding / MEMORY decision / design guide section).
- AC2: Sources shall be mined: story files in `docs/stories/completed/` + remaining active stories, epic docs in `docs/epics/`, PRD REQs (incl. §7.4 data model), audit docs (`docs/scans/`, `docs/completed/` plans incl. revenue lifecycle), `MEMORY.md` standing decisions/gotchas, design guides (`dashboard-design-guide.md`, `waitlist-page-design-guide.md`).
- AC3: The matrix shall flag conflicts: places where two sources disagree (e.g., vision v1.1-vs-Sprint-4 ledger, amended ACs superseded by later founder decisions) — with the governing source identified per MEMORY amendment trail.
- AC4: Standalone decisions that govern testing shall be indexed: standing constraints (Growth tier excluded, proxy not middleware, never-inline-styles), copy-gate rule, baseline test failures (7), founder decisions from 2026-09/10 sessions.
- AC5: Lint and build shall pass.

**Tasks:** T1 (AC2) Mine each source class · T2 (AC1) Build matrix · T3 (AC3) Conflict flags · T4 (AC4) Governing-decisions index · T5 (AC5) Gates

**Out of scope:** Updating the source docs (conflicts are flagged, fixes happen in 19.0 or later with founder input); writing test cases.

**Dev Notes:**

- This story runs parallel to 21.1 — no dependency.
- Highest-value sources for expected behavior: story ACs are the real spec (PRD is higher-level); when story ACs were amended (trail markers like `[AMENDED 2026-09-30]`), the amendment governs.
- Known conflict to resolve here: vision `:429` vs Appendix (v1.1) for analytics — already resolved by founder 2026-10-04 (defer); record as resolved.
- Keep the matrix behavior-keyed, not doc-keyed (one row per behavior with its single governing source + secondary refs).

---

### Story 21.4 — Input Validation Audit

**Status:** ready
**Design Refs:** - (no new UI; spec = validation code in forms/API routes + 21.3 sources, not SVG)
**Story:** As the founder, I want every form and API input probed for validation failures so that the "already failing" hunches are confirmed with evidence before test cases are written.

**Acceptance Criteria (EARS):**

- AC1: Every form shall be probed (boundary, malformed, empty, over-length, injection-shaped inputs): signup, signin, forgot/reset password, onboarding 1 (slug/headline), 2 (template), 3 (brand color, logo URL, CTA, milestone thresholds), 4 (decision), 4a (question builder: types, options, caps), 5 (email customisation), public email capture (email format, honeypot, timing, rate limit, consent line, phone E.164, qual answers), subscriber detail PATCH (display_name ≤100), settings (profile, waitlist fields, phone mode), broadcast (subject ≤200, body ≤10k), updates (min-10, body type), waitlist POST/PATCH (slug, milestone rewards validation).
- AC2: Every API route's validation branch shall be checked: 400s with honest error strings, ordering of guards (honeypot → timing → consent → email → rate limit → tier → referral → qual → cap — Phase 6 contract), no raw-error echo to clients.
- AC3: Each probe result shall be recorded: pass / fail-with-evidence (request + actual response vs expected from 21.3 sources) / not-applicable.
- AC4: Failures shall be grouped by severity (broken = accepts invalid or crashes; weak = accepts invalid but harmless; strict = rejects valid input) — the founder-approval list for 21.5.
- AC5: Lint and build shall pass.

**Tasks:** T1 (AC1) Form probes (manual + curl/httpie against local API) · T2 (AC2) API validation-branch walkthrough · T3 (AC3-AC4) Results + severity grouping · T4 (AC5) Gates

**Out of scope:** Fixing anything; security penetration testing beyond input validation; load testing.

**Dev Notes:**

- Methods: read the validation code in each route (cheap first pass), then verify the top-risk ones live (local dev server + curl). Highest-risk: slug validation + race, milestone reward thresholds (client `validateMilestoneRewards` + server), question builder caps (Free=2/Pro=5), broadcast/update length caps, phone E.164, unsubscribe HMAC tokens.
- Existing validation inventory is good: Phase 6.4/6.8 established strict ordering; Story 14.4 RFC4180; 12.2.13 display_name cap (audit F1); step-3 milestone client validation (milestone hardening F3/F4). Expect PASS on most — this audit is evidence-collection, not re-design.
- Output feeds 21.5's "Input validation" section directly: failures become pre-flagged test cases (AC4 grouping = case priority).
- Do NOT fix failures here — 21.6 owns fixes after founder approves the list (21.5 gate).

---

### Story 21.5 — Manual Test-Case Document

**Status:** ready (founder approval gate on validation-failure list)
**Design Refs:** - (no new UI; spec = 21.1–21.4 outputs, not SVG)
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

**Out of scope:** Automating these cases (manual doc is the deliverable); rewriting the user-flow doc.

**Dev Notes:**

- Target size: comprehensive but executable — expect ~150–250 cases. Prefer one case per meaningful behavior; combine trivial assertions (e.g., all legal pages render = one case with 3 checks).
- Citation format: `Expected: ... (source: story-12.3 AC5)` or `Expected: ... (see screenshots/07-broadcast-pro-desktop.png)`.
- Template research validation (2026-10-04): Katalon/Smartsheet manual test-case templates use exactly the AC2 field set (test-case ID, steps, expected results, actual results, pass/fail) and stress traceability — "if another tester cannot follow your steps and reproduce your result, the documentation has failed"; TestMatick's pre-launch QA checklist categories (core flows, transactional email rendering incl. unsubscribe links, edge/error states, mobile, smoke test) align with the AC1 section list. No AC changes needed — structure already matches industry practice.
- Free/pro cases need tier-switching instructions (SQL tier flip per MEMORY or Paddle sandbox upgrade) — put in the exec header.
- Email cases: note that warmth/webhook/cron paths don't work locally (MEMORY) — mark prod-only cases explicitly.
- 19.1's fix must land first: confirmation-email footer cases assert tier-correct behavior.

---

### Story 21.6 — Fix Pass on Validated Failures

**Status:** ready
**Design Refs:** - (no new UI; spec = founder-approved 21.4 failure list, not SVG)
**Story:** As the founder, I want the validation failures I approved for fixing corrected so that the test document's expected outcomes are honest.

**Acceptance Criteria (EARS):**

- AC1: Every failure marked "fix" in the founder approval (21.5 AC5) shall be fixed with a regression test where practical.
- AC2: Every failure marked "defer" shall carry an explicit deferral note in `docs/qa/manual-test-cases.md` (what, why, target release) — no silent drops.
- AC3: Fixed behaviors shall have their test-case expected results confirmed against the fix (no stale expectations).
- AC4: No fix shall regress the sanctioned baseline: full suite returns 7 known failures (or fewer).
- AC5: Lint and build shall pass.

**Tasks:** T1 (AC1) Fix approved failures · T2 (AC2) Deferral notes · T3 (AC3) Expectation sync · T4 (AC4-AC5) Baseline + gates

**Out of scope:** Deferred items; any improvement not on the approved list.

**Dev Notes:**

- Severity order: broken → weak → strict (21.4 AC4 grouping).
- If a "fix" turns out to be architecturally larger than a validation tweak (e.g., requires schema/API contract change), stop and re-scope with founder — do not expand scope silently (ask-first).
- Run targeted tests per fix + one full suite at the end.

---

### Story 21.7 — Full QA Execution

**Status:** ready
**Design Refs:** - (no new UI; spec = docs/qa/manual-test-cases.md, not SVG)
**Story:** As the founder, I want the complete test document executed end-to-end with results recorded so that launch blockers are visible.

**Acceptance Criteria (EARS):**

- AC1: Every case in `docs/qa/manual-test-cases.md` shall be executed against the build under test (specify local or prod per case's exec header) and its pass/fail column filled with result + date.
- AC2: Failures found during execution shall be triaged: in-scope bug → fix immediately if small, else log with severity; environmental/data issue → noted; already-known → linked.
- AC3: A results summary shall head the document: total cases, passed, failed, deferred, and a launch-blocker list (any fail = blocker unless waived).
- AC4: The full automated suite + lint + build shall be run alongside and recorded (baseline 7 failures expected).
- AC5: Zero unresolved launch blockers at story completion (or explicit founder waiver recorded per blocker).

**Tasks:** T1 (AC1) Execute all cases · T2 (AC2) Triage failures · T3 (AC3) Results summary · T4 (AC4) Automated gates record · T5 (AC5) Blocker burn-down

**Out of scope:** Writing new cases during execution (small addendums allowed if a gap is found — add with citation, execute, note); performance/load testing.

**Dev Notes:**

- Execution order suggestion: follow doc section order (auth → onboarding → dashboard → public → …) so environment setup (tier flips, seed data) happens once per section.
- Founder may execute personally (that's the point of the manual doc) with the agent standing by for triage/fixes — coordinate in session.
- Two-tier reality: some cases are prod-only (emails, webhooks, cron, og:image) — execute those against `www.prewaitlist.com`/subdomains and note environment per case.

---

### Story 21.8 — Launch Verification

**Status:** ready
**Design Refs:** - (no new UI; spec = vision `:440` exit condition + 21.7 results, not SVG)
**Story:** As the founder, I want a final launch-readiness sign-off against the vision exit condition so that Sprint 4 closes with a clear go/no-go.

**Acceptance Criteria (EARS):**

- AC1: The vision exit condition (`:440`) shall be walked explicitly: sign up → build waitlist → collect signups → track warmth → send broadcast → export data — each step verified working on production Vercel with no broken state (evidence: 21.7 results + live check).
- AC2: Epic 19 completion shall be confirmed: 8/8 stories done or explicitly deferred with sign-off; P0 tier fix verified in production (Pro confirmation email has no Powered-by).
- AC3: Epic 20 completion shall be confirmed: PostHog capturing events live, surveys live, walkthrough firing once for a qualifying founder, feedback button + founder link live, Dub playbook delivered, PH prep delivered.
- AC4: Final gates recorded: `pnpm lint` 0 errors, full suite at baseline (7 sanctioned failures), clean `pnpm build`, prettier clean.
- AC5: An open-items register shall list everything still pending outside code: Resend webhook URL dashboard update (www endpoint), `*.prewaitlist.com` wildcard DNS in Vercel, founder env vars (PostHog key, Tally URL, contact URL) presence in Vercel, any 21.6 deferrals.
- AC6: A launch recommendation (go / no-go with reasons) shall be stated, tied to AC1–AC5 evidence.

**Tasks:** T1 (AC1) Live exit-condition walkthrough · T2 (AC2-AC3) Epic completion confirmation · T3 (AC4) Final gates · T4 (AC5) Open-items register · T5 (AC6) Recommendation

**Out of scope:** Actual Product Hunt submission (20.5 prepares only); post-launch monitoring setup beyond Epic 20.

**Dev Notes:**

- This story is the Sprint 4 exit gate — `epic-check` (Prompt #4) runs here as the independent audit layer on top of this self-verification.
- Deploy to production before AC1 (Vercel auto-deploys from `main` per MEMORY flow: merge dev → main).
- Open items from MEMORY that predate Sprint 4 and must appear in AC5: Paddle webhook prod URL (founder updated 2026-10-03 — confirm), Resend webhook (www, live-verified 2026-09-27 — confirm current), og:image:alt static string question.

# Manual Test Cases — Pre-Launch QA Suite

**Story:** 21.5 · **Epic:** 21 · **Status:** batches 1–4 + 6–9 complete (80 pass); batch 12's 8 findings were fixed and code-verified in 21.6. Batches 10–11 (9 cases) moved to post-launch by founder request on 2026-10-27. Batch 5 (§5 Leaderboard) was executed but run-notes remain unrecorded; 4 dashboard cases remain unrun; 1 earlier case is deferred. AC5 gate CLOSED 2026-10-12 (fix all 8 in 21.6). Last synced 2026-10-27 after batch 12 code verification.
**Sources (only):** `docs/qa/app-inventory.md` (21.1) · `docs/qa/screenshots/` + `manifest.md` (21.2) · `docs/qa/behavior-sources.md` (21.3) · `story-21.4-input-validation-audit.md` (21.4). Never the outdated user-flow doc.
**Scale:** ~150 cases. Mark each `Result` during execution (21.7).

## How to execute

### Prerequisites

| Need                        | How                                                                                                                                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Founder account (free tier) | Sign up at `/signup` locally or on prod                                                                                                                                                                                                       |
| Pro tier                    | SQL flip: `UPDATE founder_profiles SET tier = 'pro' WHERE id = (SELECT id FROM auth.users WHERE email = 'you@…');` — or Paddle sandbox upgrade on prod                                                                                        |
| Seed waitlists              | Local: `quality` (Minimal, populated), `p` (Dark) exist in live DB; capture script seeds `qa-mobile`, `qa-empty` (`tests/e2e/capture-screenshots.spec.ts`)                                                                                    |
| Subscriber session          | Thank-you link needs `(subscriber_id, referral_code)` pair from a real signup POST response                                                                                                                                                   |
| Environments                | **Local** (`localhost:3000` + `*.lvh.me:3000`) for UI/guards/validation; **prod-only**: Resend emails, webhooks, cron, og unfurl, Paddle sandbox checkout. Cases tagged `[PROD]` must run against `www.prewaitlist.com` / `*.prewaitlist.com` |

### Conventions

- Each case: ID, preconditions, numbered steps, expected result **with citation**, result checkbox.
- `Pre-flagged Wx` banner = 21.4 found it failing; expected states CORRECT behavior. If founder defers, 21.6 records the deferral here.
- `[PROD]` = cannot pass locally (needs webhooks/cron/mail infra). `[FREE]`/`[PRO]` = tier precondition, switch via SQL flip.
- Record environment per executed case (local vs prod) so rate-limit/seed quirks aren't misread.
- Sanctioned baseline note: the **automated** suite has 7 known failures (`dashboard-archive` 4 + `dashboard-subscriber-table` 3) — code-suite, not manual. A manual fail is never "explained" by those.

---

## 1. Auth & account <a id="auth"></a>

> **Batch 1 executed 2026-10-16 - local + production retests - 12 pass / 0 fail / 1 deferred.** BATCH 1 CLOSED: TC-AUTH-03 PASS, TC-AUTH-09 PASS (both after fixes), TC-AUTH-04 deferred by founder.

### TC-AUTH-01: Email signup happy path

**Preconditions:** Signed out, fresh email.
**Steps:**

1. Open `/signup`, enter valid email + password ≥8 chars, submit.
2. Follow to `/verify-email`.
   **Expected:** Account created; verification notice shown with resend option (source: story-2.2, story-2.4; PRD REQ-6.5.1/6.5.2). No name field on form (source: PRD §5 SD1).
   **Result:** [x] Pass [ ] Fail

### TC-AUTH-02: Signup rejects bad input client-side

**Preconditions:** Signed out, `/signup`.
**Steps:**

1. Submit empty email → note message. 2. Submit `not-an-email` → note message. 3. Submit valid email + 7-char password → note message.
   **Expected:** `Email address is required` / `Please enter a valid email address` / `Password must be at least 8 characters`; no Supabase call fires (source: story-2.3 + revenue-phase-6 `validateEmail` return fix).
   **Result:** [x] Pass [ ] Fail

### TC-AUTH-03: Signup duplicate email

**Preconditions:** Existing account email.
**Steps:** 1. Submit signup with the existing email.
**Expected:** `An account with this email already exists. Please sign in.` (source: `(auth)/signup/page.tsx` mapping).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-16 - local): RE-TEST PASS.** Confirmed bug fixed: GoTrue anti-enumeration returns 200 + empty `identities[]` on duplicate signup (supabase/auth#1517); `signup/page.tsx` now detects `data.user?.identities?.length === 0` and shows "An account with this email already exists. Please sign in." (existing copy verbatim), skipping the verify-email redirect and the `account_created` capture. Locked by `src/__tests__/components/signup-duplicate.test.tsx` (4 tests).

### TC-AUTH-04: Signup rapid-submit cooldown

**Preconditions:** Signed out, `/signup`.
**Steps:** 1. Submit 5+ times within a minute.
**Expected:** `Too many attempts. Please try again in Ns` client cooldown (source: signup rate gate; server-side is Supabase-owned).
**Result:** [ ] Pass [ ] Fail - DEFERRED

> **Run note (2026-10-16 - local): DEFERRED by founder** ("leave for now, document as later"). Not a product defect - the earlier retest only made 2 submits; the client cooldown needs >= `MAX_SUBMIT_ATTEMPTS` (5). If resumed later: submit 5x within a minute -> 5th must show `Too many attempts. Please try again in Ns`. Context from first run: (a) auth user row created before email verification = intended (Supabase creates the account at signUp); (b) 2nd submit within 30s -> "Something went wrong" = GoTrue security message falling through to the catch-all (`signup/page.tsx`).

### TC-AUTH-05: Signin happy path + wrong password

**Preconditions:** Existing verified account.
**Steps:** 1. Sign in with correct credentials → dashboard. 2. Sign out, sign in with wrong password.
**Expected:** Success lands per redirect rules; failure shows `Invalid email or password. Please try again.` (source: story-2.3).
**Result:** [x] Pass [ ] Fail

### TC-AUTH-06: Forgot-password flow, no enumeration

**Preconditions:** `/forgot-password`.
**Steps:** 1. Submit unknown email. 2. Submit known email, use reset link, set ≥8-char password at reset page.
**Expected:** Both show check-email confirmation (unknown emails not revealed); reset enforces 8-char floor (source: story-2.4; reset-password gate).
**Result:** [x] Pass [ ] Fail

### TC-AUTH-07: Legal links on auth pages

**Preconditions:** `/signup`.
**Steps:** 1. Click Terms + Privacy links.
**Expected:** Land on `/legal/terms` and `/legal/privacy` (not `/terms`, `/privacy`) (source: revenue-phase-6 bonus fix).
**Result:** [x] Pass [ ] Fail

### TC-AUTH-08: `?plan=pro` fresh founder → onboarding modal

**Preconditions:** Fresh account, 0 waitlists, link `/signup?next=/dashboard/settings/billing&plan=pro` completed.
**Steps:** 1. Complete email signup via the Pro CTA.
**Expected:** Lands `/onboarding/1?plan=pro` with upgrade modal open (trigger `pro-cta-onboarding`), surviving a prior dismissal (source: Pro CTA fix 2026-09-29 + flicker-fix exemption).
**Result:** [x] Pass [ ] Fail

### TC-AUTH-09: `?plan=pro` existing founder → billing modal

**Preconditions:** Signed in, ≥1 waitlist.
**Steps:** 1. Open `/dashboard/settings/billing?plan=pro`.
**Expected:** Upgrade modal auto-opens (trigger `pro-cta-billing`); param stripped after open (source: Pro CTA fix).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-16 - local): FIXED x2, RE-TEST PASS (round 2, production).** Round 1: cooldown enforced in a post-paint effect → flicker; fixed with render-level gate (founder decision: gate before open). Round 2: the gate turned the cooldown into a **silent dead button** — the billing page's explicit "Upgrade to Pro" button (`billing/client.tsx`, trigger `billing`) was cooldown-gated, so every re-click within 24h of any dismissal did nothing (active purchase intent suppressed). **Fix:** `billing` added to `COOLDOWN_EXEMPT_TRIGGERS` in `upgrade-modal.tsx` — explicit-intent openers (billing button + `pro-cta-*` deep links) always open; cooldown remains for passive re-prompts. Locked by the exempted-trigger test covering `billing` (`upgrade-modal.test.tsx`). Committed `fc88810` → main. **Retest: PASS** — button opens every time after dismissal.

### TC-AUTH-10: Signed-in user hits auth pages

**Preconditions:** Signed in.
**Steps:** 1. Visit `/signup` and `/signin`.
**Expected:** Redirected away (post-auth path; `plan=pro` branch respected) (source: `resolvePostAuthPath` 2026-09-29).
**Result:** [x] Pass [ ] Fail

### TC-AUTH-11: Google OAuth signin

**Preconditions:** Signed out.
**Steps:** 1. Click Google on `/signin`, complete consent.
**Expected:** Account/session created via callback; acquisition cookie persisted (source: story-2.3; 20.4 upsert fix).
**Result:** [x] Pass [ ] Fail

### TC-AUTH-12: Marketing homepage variants + footer

**Preconditions:** None.
**Steps:** 1. Open `/`. 2. Open `/?src=powered-by`. 3. Inspect footer.
**Expected:** Cold hero → problem → difference → comparison → features → confidence → pricing (Free+Pro only); `?src=powered-by` swaps hero; footer never shows Powered-by (source: story-3.1/3.5; manifest `01-marketing-home-desktop.png`).
**Result:** [x] Pass [ ] Fail

### TC-AUTH-13: Signout clears session

**Preconditions:** Signed in.
**Steps:** 1. Sign out via settings hub button. 2. Visit `/dashboard`.
**Expected:** Session cleared; dashboard → 307 `/signin` (source: inventory §1.2 #13 + §6.3).
**Result:** [x] Pass [ ] Fail

---

## 2. Onboarding wizard <a id="onboarding"></a>

> **Batch 2 executed 2026-10-19 — 13 pass / 1 fail.** Cases 01–13 PASS (Case 09 passed with a founder UX note). Case 14 FAIL — run note below; root causes located, fixes deferred to 21.6 (no code change in this round).

### TC-ONB-01: Step 1 slug check + fallbacks

**Preconditions:** Fresh browser (no draft), `/onboarding/1`.
**Steps:** 1. Type product name, watch subdomain status. 2. Try a taken slug. 3. Click "I'll name it later".
**Expected:** Debounced available/taken states; taken shows `Already taken`; name-later generates fallback and continues (source: story-4.1/10.6; manifest `07-onboarding-1-desktop.png`).
**Result:** [x] Pass [ ] Fail

### TC-ONB-02: Step 1 headline field

**Preconditions:** `/onboarding/1`.
**Steps:** 1. Fill Product Name + Headline + Subheadline distinctly.
**Expected:** Three separate fields; empty headline falls back (never empty downstream) (source: story-18.3; fallback chain).
**Result:** [x] Pass [ ] Fail

### TC-ONB-03: Step 2 template select

**Preconditions:** Step 1 done.
**Steps:** 1. Preview Minimal/Bold/Dark cards. 2. Select Dark, continue.
**Expected:** Selected card gets accent border; choice persists to preview (source: story-4.2).
**Result:** [x] Pass [ ] Fail

### TC-ONB-04: Step 3 brand + logo + CTA

**Preconditions:** Step 2 done.
**Steps:** 1. Pick a swatch, type invalid hex + blur. 2. Upload PNG >2MB, then valid PNG. 3. Edit CTA text.
**Expected:** Invalid hex shows `Enter a valid hex color (e.g. #0F7A5E)`; oversize/non-PNG rejected; logo stored as data URL; CTA free text (source: story-4.3/18.4; manifest `08-onboarding-3-desktop.png`).
**Result:** [x] Pass [ ] Fail

### TC-ONB-05: Step 3 milestones validation

**Preconditions:** Step 3, milestones ON.
**Steps:** 1. Set threshold 0 / duplicate thresholds / empty label → submit.
**Expected:** `Threshold must be a whole number greater than 0` / `Each tier needs a unique referral count` / `Reward for "Refer N friends" is required`; submit blocked (source: milestone hardening F3/F4).
**Result:** [x] Pass [ ] Fail

### TC-ONB-06: Step 3 phone + counter toggles

**Preconditions:** Step 3.
**Steps:** 1. Set Phone → Required. 2. Toggle signup counter on.
**Expected:** Phone select persists (Off/Optional/Required, default Off); counter toggle present, OFF default (source: phone plan 2026-10-03; issue #16).
**Result:** [x] Pass [ ] Fail

### TC-ONB-07: Signup wall after Step 3

**Preconditions:** Phase A draft in localStorage, signed out.
**Steps:** 1. Continue past Step 3.
**Expected:** Signup wall (`/onboarding/signup`); after signup, draft flushes and flow resumes at Step 4 (source: story-6.0; FlushGate).
**Result:** [x] Pass [ ] Fail

### TC-ONB-08: Step 4 qualification decision

**Preconditions:** Signed in, draft flushed.
**Steps:** 1. Choose Yes → lands 4a. 2. Restart, choose No → lands 5.
**Expected:** Yes→4a, No→5 (source: story-4.4).
**Result:** [x] Pass [ ] Fail

### TC-ONB-09: Step 4a question caps [FREE] then [PRO]

**Preconditions:** Free founder at 4a.
**Steps:** 1. Add 2 questions. 2. Try a 3rd. 3. Flip to Pro, add up to 5, try 6th. 4. MC question with 1 option → submit.
**Expected:** Free capped at 2 (badge `FREE — 2 questions max`), Pro at 5; MC needs ≥2 options (`Multiple choice questions need at least 2 options.`); ≥1 question required (source: story-4.5/Epic 14; 4a validator).
**Result:** [x] Pass [ ] Fail

> **Founder UX note (2026-10-19):** pass, but at the question cap the button should disappear rather than remain and error (founder referenced the upgrade button after the 5th Pro question). Which control(s) — add-question, upgrade, or both — to confirm when 21.6 picks it up.

### TC-ONB-10: Step 5 Free vs Pro branches

**Preconditions:** Step 4a done (or skipped).
**Steps:** 1. As Free: inspect email fields. 2. As Pro: edit sender/subject/body, exceed 200-char subject → launch.
**Expected:** Free shows locked fields + Pro badge; Pro edits save; >200 subject → `Email subject must be 200 characters or fewer` (source: story-6.3; `waitlist/route.ts` caps).
**Result:** [x] Pass [ ] Fail

### TC-ONB-11: Launch + success screen

**Preconditions:** Step 5 complete.
**Steps:** 1. Click `Launch my waitlist`. 2. On success, click share + dashboard links.
**Expected:** Waitlist created; success shows share buttons (no platform tabs), `?wid=<new id>` dashboard link (source: story-6.3/6.4/5.2; manifest `19-onboarding-success-desktop.png`).
**Result:** [x] Pass [ ] Fail

### TC-ONB-12: Preview parity (content order/copy)

**Preconditions:** Steps 1–3 filled.
**Steps:** 1. Compare right-pane preview against §4 live order + copy (headline, consent line, trust line, sample updates, how-it-works).
**Expected:** Same order/copy at compact scale (approximation, not pixel parity); consent + trust lines present (source: W1 amendment; stories 18.0–18.2).
**Result:** [x] Pass [ ] Fail

> **AMENDED 2026-10-21 (`f42ce06`):** the visual rebalance lives in the **shared renderer** (`components/share/waitlist-template-content.tsx`), so the preview must mirror the live hierarchy too — quiet border-only how-it-works steps and brand-outlined `text-sm` milestone chips at compact scale. A preview that still shows filled/bold step cards is a parity bug.

### TC-ONB-13: Upgrade modal from onboarding (Pro-gated step)

**Preconditions:** Free founder at 4a cap or Step 5 Pro field.
**Steps:** 1. Trigger upgrade (cap click / locked field). 2. Complete sandbox checkout. 3. Continue in place.
**Expected:** `usePaddleUpgrade` opens checkout, tier flips, flow resumes without losing state (source: seamless upgrade 2026-09-22). `[PROD]` for real checkout; sandbox on prod.
**Result:** [x] Pass [ ] Fail

### TC-ONB-14: Resume mid-flow + fresh-founder redirect

**Preconditions:** (a) Phase A draft in localStorage, signed out. (b) Fresh founder, no draft, at `/onboarding/4`.
**Steps:** 1. Return to `/onboarding/1` → note landing step. 2. Load (b) → note landing.
**Expected:** (a) resumes at correct step by data completeness; (b) 200 `[]` treated as empty → `/onboarding/1`, no error UI (source: FlushGate; revenue-phase-4 F1).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-19 — local): FAIL (both legs).**
> **(a) Signed-in free founder mid-flow → `/onboarding/1` → `/dashboard`.** After the Step-3 signup wall, FlushGate creates the waitlist; `src/components/auth/onboarding-guard.tsx:32-40` then redirects any free founder with ≥1 waitlist on every onboarding route (intent: stop a 2nd-waitlist bypass of the 402 gate at `src/app/api/waitlist/route.ts:208`). Consequence: legitimate mid-flow resume is blocked — a founder who leaves or reloads cannot return to Steps 4/4a/5.
> **(b) Fresh founder, no draft, `/onboarding/4` → `/onboarding/signup` wall, not `/onboarding/1`.** The Phase-B guard in `src/lib/supabase/middleware.ts` sends unauthenticated Phase-B paths to the wall; FlushGate — which owns the `200 []` → `/onboarding/1` behavior (revenue-phase-4 F1) — only renders for authenticated users, so the spec'd redirect cannot fire. The wall performs no draft check and falls back to fabricated defaults (`Your Product`, `your-page.prewaitlist.com`, `Template: minimal`) at `src/app/onboarding/signup/page.tsx:118-128`.
> **Open question for 21.6:** the signed-in fresh-founder variant of (b) was not separately exercised; re-verify both auth states when fixing.
> **[FIXED 2026-10-19 — Prompt #8 — shipped `ea721c0`, merged to main, deployed]** (a) `onboarding_in_progress` cookie (`src/lib/onboarding-progress-core.ts`) written by `LocalOnboardingProvider` on every draft persist, cleared by `clearPersisted()` on success; `OnboardingGuard` now allows a free founder with ≥1 waitlist through when the cookie is present. (b) The signup wall now checks for a persisted draft and `router.replace("/onboarding/1")` when absent (`src/app/onboarding/signup/page.tsx`). Tests: `onboarding-guard.test.tsx` (+2 cookie cases), new `onboarding-signup-wall.test.tsx` (2). **Retest both legs; also re-verify the signed-in fresh-founder variant of (b).**
> **[RETEST PASSED 2026-10-20 — founder confirmed all batch 1–3 failures resolved and passed.]**

---

## 3. Founder dashboard <a id="dashboard"></a>

> **Batch 3 executed 2026-10-19 — production — 11 pass / 4 fail / 4 pending.** PASS: 01, 03, 04, 06, 08, 09, 12, 13, 14, 15, 19. FAIL: 02 (free half), 05, 10 (free half), 11. Not run: 07, 16, 17, 18. Split-tier cases (02/10/11/19) are scored once — any failed half fails the case. No code fixes in this round; findings recorded for triage. **2026-10-20 retest: 02/05/10/11 all PASS (founder) — section 3 now 15 pass / 0 fail / 4 not-run.**

### TC-DASH-01: Overview populated vs empty

**Preconditions:** Pro founder, populated waitlist; then `qa-empty` waitlist.
**Steps:** 1. Open `/dashboard`. 2. Switch to empty waitlist.
**Expected:** Populated: stat cards + chart + warmth + qualification + top referrers. Empty: welcome + guidance + ghost cards, no checklist (source: story-12.1.1/12.1.2; manifest `20-dashboard-home-pro-desktop.png`, `21-dashboard-empty-desktop.png`).
**Result:** [x] Pass [ ] Fail

### TC-DASH-02: Sidebar locks [FREE] vs unlock [PRO]

**Preconditions:** Free founder.
**Steps:** 1. Inspect sidebar nav. 2. Click Warmth/Broadcast. 3. Flip Pro, revisit.
**Expected:** Free: Warmth + Broadcast locked with upgrade CTA; Pro: all unlocked (source: story-12.1.0/13.2; manifest `13-dashboard-home-free-desktop.png`).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-19 — production): FAIL (free half).** The upgrade modal does not open consistently when the locked sidebar items are clicked. It appears once, then subsequent clicks do nothing. Pro half PASS — sidebar unlocks correctly.
> **[FIXED 2026-10-19 — Prompt #8 — shipped `ea721c0`, merged to main, deployed]** `warmth` and `broadcast` triggers added to `COOLDOWN_EXEMPT_TRIGGERS` (`components/dashboard/upgrade-modal.tsx`) — after one dismissal the render gate was silently eating every subsequent click (same bug class as the `billing`/`subscriber_cap` exemptions). **Retest: dismiss the modal once, then click the locked sidebar items again — the modal must re-open.**
> **[RETEST PASSED 2026-10-20 — founder confirmed all batch 1–3 failures resolved and passed.]**

### TC-DASH-03: Waitlist switcher precedence

**Preconditions:** ≥2 waitlists.
**Steps:** 1. Note newest vs stored preference. 2. Open plain `/dashboard`. 3. Open `?wid=<other>`. 4. Open `?wid=<bogus>`.
**Expected:** Plain renders preference (cookie/localStorage), not newest; valid `?wid` wins + rewrites preference; bogus falls through (source: switcher fix 2026-10-08).
**Result:** [x] Pass [ ] Fail

### TC-DASH-04: Tier refresh after upgrade

**Preconditions:** Free founder on dashboard.
**Steps:** 1. Upgrade (sandbox), keep tab open.
**Expected:** Sidebar unlocks without full reload (poll + `router.refresh()`); billing page concurs (source: tier-refresh 2026-09-23). `[PROD]`
**Result:** [x] Pass [ ] Fail

### TC-DASH-05: First-subscriber tour + replay

**Preconditions:** Founder with ≥1 subscriber, fresh localStorage flag.
**Steps:** 1. Open `/dashboard`. 2. Skip mid-tour. 3. Replay via header button. 4. Open with `?upgrade=cap`.
**Expected:** 6 steps desktop (5 <lg, no sidebar step); Skip writes flag; replay restarts; tour defers while upgrade modal open (source: story-20.2 + audit F1).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-19 — production): FAIL — two issues.**
>
> 1. The first-subscriber tour does not work — it does not run.
> 2. After clearing localStorage, signing in to an existing account redirects to Step 1 (waitlist creation) instead of the dashboard.

> **[FIXED 2026-10-19 — Prompt #8 — shipped `ea721c0`, merged to main, deployed]**
>
> 1. **Tour gate:** `src/app/dashboard/layout.tsx` now live-COUNTs the default waitlist's subscribers (`head: true`) and passes it as `liveSubscriberCount` to the shell/tour — the cached `waitlists.subscriber_count` column (frozen at 0 by the Phase-6 DROPs) was the gate the tour checked (`countRef.current < 1`). Falls back to the cached column on count error.
> 2. **Sign-in → Step 1: root cause NOT reproduced in code** — the only code path that lands on `/onboarding/1` is the dashboard layout's zero-waitlist bounce; a plain `/signin` defaults to `/dashboard`. **Ambiguous: which account was used for the retest?** If that account's waitlist is missing/deleted, the bounce is correct. **Retest with the known-good founder account; if it still reproduces, treat as a new failure.**
>    **Founder clue (2026-10-19):** "it only happens when I clear the local storage of the browser; otherwise sign in redirects to dashboard." Code invariant from the Prompt #3 audit: the guard (`onboarding-guard.tsx`) and the layout bounce are both **server-side and localStorage-independent** (`auth-redirect.ts:112-113` sends a plain sign-in to `/dashboard` unconditionally) — so **any** `/onboarding/1` landing implies the waitlists count was 0 **at that moment**. Best-supported explanation: the tested account's waitlist existed only as a Phase-A localStorage draft (never flushed by FlushGate) — clearing storage destroys the only copy, so Step 1 is the correct outcome; with the draft present, the flush during that journey creates the server row and the run ends at the dashboard. **Retest issue 1: clear localStorage, sign in with an account whose waitlist has ≥1 real subscriber — the tour must auto-start (6 steps desktop).** (Founder reminder: the Phase-6 recount SQL should also be run — it benefits the 90%-cap + quota banner paths that still read the cached column.) **Retest issue 2 on the same known-good account: sign-in must land `/dashboard`. If Step 1 still appears while the server row provably exists, treat as a new failure with a live repro path.**
>    **[RETEST PASSED 2026-10-20 — founder confirmed all batch 1–3 failures resolved and passed.]**

### TC-DASH-06: Feedback + contact surfaces

**Preconditions:** Env vars set (Tally URL, contact URLs).
**Steps:** 1. Click FAB → Tally popup. 2. Open contact pill → Instagram + Email rows. 3. Unset vars (local) → surfaces hidden.
**Expected:** Tally lazy-loads on first click; modal rows open ig.me + mailto; each surface hides independently without its var (source: stories 20.3/20.6).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-19 — production): PASS for steps 1–2.** Tally popup and the contact modal (Instagram + Email rows) verified. Step 3 (hide surfaces when env vars are unset) is local-only — not executable on production without a redeploy; recorded as not tested.

### TC-DASH-07: Quota banner + auto-refresh

**Preconditions:** Dashboard open.
**Steps:** 1. Trigger quota-hit state (or inspect banner logic). 2. Add subscriber in another tab, wait 60s / refocus.
**Expected:** Banner renders on quotaHit only; data refreshes on focus + 60s interval (source: quota banner; story-12.2.12).
**Result:** [ ] Pass [ ] Fail

> **Run note (2026-10-19 — production): PENDING — not executed.** Requires a near-cap free waitlist on production. Deferred to a later run.

### TC-DASH-08: Leaderboard page + CSV [PRO]

**Preconditions:** Pro, populated waitlist.
**Steps:** 1. Open dashboard leaderboard, sort Referrals/Position, paginate. 2. Export CSV, open in spreadsheet. 3. Click anywhere on a row (rank, name, date, empty space) — not just the email.
**Expected:** Boost-first sort, PAGE_SIZE=10, `Showing X–Y of Z`; CSV headers incl. Quality % after Warmth, RFC4180-quoted, formula-prefixed cells (source: stories 16.4/16.5/9.3/14.4/19.2; manifest `14-dashboard-leaderboard-desktop.png`). **Step 3:** any point on the row opens `/dashboard/subscribers/<id>` — the email link stretches over the whole row (source: `f42ce06`).
**Result:** [x] Pass [ ] Fail

> **Row-click leg added 2026-10-21 (`f42ce06`) — retest pending.** The 2026-10-19 pass predates whole-row click (only the email was clickable then). Retest: click a non-email cell on any row → subscriber detail opens. Keyboard is unchanged (Tab reaches the email link, Enter opens).

### TC-DASH-09: Qualification page

**Preconditions:** Questions + answers exist.
**Steps:** 1. Open dashboard qualification.
**Expected:** Per-question cards with type chips, ordinal badges, answer distribution; respondent counts (source: story-14.3).
**Result:** [x] Pass [ ] Fail

### TC-DASH-10: Warmth page gate [FREE] vs [PRO]

**Preconditions:** Free founder.
**Steps:** 1. Open dashboard warmth. 2. Flip Pro, revisit.
**Expected:** Free: distribution + upgrade nudge; Pro: bars + per-subscriber table with Hot/Warm/Cold badges (green/blue scheme) (source: stories 12.3.3/15.4; manifest `15-dashboard-warmth-free-desktop.png`).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-19 — production): FAIL (free half).** The free state renders as intended (distribution + "Upgrade to target segments" pill), but clicking the Warmth card on the dashboard does not open the upgrade modal. Pro half PASS — bars + per-subscriber table render with Hot green / Cold blue.
> **[FIXED 2026-10-19 — Prompt #8 — shipped `ea721c0`, merged to main, deployed]** Same root cause as TC-DASH-02: `warmth` trigger now in `COOLDOWN_EXEMPT_TRIGGERS`. **Retest: dismiss the modal once, then click the Warmth card again — the modal must re-open.**
> **[RETEST PASSED 2026-10-20 — founder confirmed all batch 1–3 failures resolved and passed.]**

### TC-DASH-11: Updates compose + honest failure

**Preconditions:** Pro founder.
**Steps:** 1. Publish 9-char body. 2. Publish valid body. 3. As Free, open page / visit direct URL.
**Expected:** 9-char → `Body must be at least 10 characters`; valid publishes (201, `sent_at` iff mailed); send failure shows `Update saved, but emails could not be sent.`; Free direct URL gets upgrade path (source: stories 12.1.4/16.0/16.1/17.4).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-19 — production): FAIL — two issues.**
>
> 1. Free half: the upgrade modal does not appear when the Free updates page is opened/clicked.
> 2. Pro half (compose otherwise PASS): the 10-character minimum counts a space as a character — whitespace passes the length check.

> **[FIXED 2026-10-19 — Prompt #8 — shipped `ea721c0`, merged to main, deployed]**
>
> 1. `updates` trigger now in `COOLDOWN_EXEMPT_TRIGGERS` (same root cause as TC-DASH-02/10).
> 2. Client now validates on the trimmed length (`src/app/dashboard/updates/client.tsx`) — matches the server's trim-before-min-10 (`api/updates/route.ts`); whitespace-only and whitespace-padded-short bodies keep Publish disabled (tests in `dashboard-updates-compose.test.tsx`).
>    **Retest: (1) dismiss the modal once, revisit the Free updates page — modal must re-open. (2) type 12 raw chars of mostly whitespace — Publish must stay disabled; type a real ≥10-char body — Publish enables and the stored update is the trimmed body.**
>    **[RETEST PASSED 2026-10-20 — founder confirmed all batch 1–3 failures resolved and passed.]**

### TC-DASH-12: Broadcast compose + segments [PRO]

**Preconditions:** Pro, subscribers across tiers.
**Steps:** 1. Check segment counts (All/Hot+Warm/Cold). 2. Send to Cold. 3. Submit 201-char subject / empty body.
**Expected:** Eligible counts (unsub+bounce excluded); caps enforced (`Subject must be ≤ 200 characters and body ≤ 10000 characters`); `waitlist_id` included (B1 lock); honest status (source: stories 17.0–17.2).
**Result:** [x] Pass [ ] Fail

### TC-DASH-13: Subscriber detail page

**Preconditions:** Subscriber with referrals + milestones + events.
**Steps:** 1. Open a subscriber from the leaderboard by clicking anywhere on the row (also verifies TC-DASH-08 step 3). 2. Inspect the Referral code + Referral link cards. 3. Click the link card's copy button.
**Expected:** Position/email grid, referral code, **Referral link card directly after it** — copyable canonical `https://{subdomain}.prewaitlist.com?ref={code}` with a 2s "Copied!" confirmation — referred list, qual answers, milestones-earned card, email event log (source: stories 9.4/11.6/12.2.13; `f42ce06`).
**Result:** [x] Pass [ ] Fail

> **Founder UX note (2026-10-19 — production): PASS, with a UX follow-up.** The subscriber detail page only opened when the email cell was clicked; expected a click anywhere on the row. **[RESOLVED 2026-10-21 — shipped `f42ce06`, merged to main + deployed]** Whole-row click added (stretched-link overlay; email link still the keyboard target). The same commit adds the **Referral link** card after Referral code (shared `ReferralLink`, canonical URL matching milestone/confirmation emails) so the founder can copy the full link in one click. Tests: `dashboard-leaderboard-page.test.tsx` (stretched-link lock), `dashboard-subscriber-detail.test.tsx` (card order + URL format). **Retest: click a non-email part of a leaderboard row → detail opens; copy the Referral link → clipboard holds `https://{subdomain}.prewaitlist.com?ref={code}`.**

### TC-DASH-14: Archive / unarchive + banner

**Preconditions:** Test waitlist.
**Steps:** 1. Archive (confirm dialog). 2. Visit its public URL. 3. Unarchive from banner.
**Expected:** Confirm dialog; public URL → `/gone`; banner offers unarchive (source: story-12.2.1).
**Result:** [x] Pass [ ] Fail

### TC-DASH-15: Settings hub + waitlist settings

**Preconditions:** Signed in.
**Steps:** 1. Walk hub → waitlist list → waitlist detail → profile. 2. Edit 6 waitlist fields, logo upload, phone mode. 3. Edit qualification questions (ids preserved). 4. Edit milestone rewards + toggle the signup counter in waitlist settings.
**Expected:** Three-level hierarchy; saves persist; logo = data URL; phone Off/Optional/Required; question edits keep ids (source: stories 12.2.2/12.2.3/14.2/phone plan). **Step 4:** milestone tiers are add/edit/remove (1–5, threshold >0, unique, label required — same validation as onboarding Step 3); signup counter toggle persists and drives the public page's ≥10 counter (source: `086cc17` D1–D4; `dashboard-settings-milestones.test.tsx`).
**Result:** [x] Pass [ ] Fail

> **Step 4 added 2026-10-21 (`086cc17`):** milestone rewards and the signup-counter toggle are now editable from waitlist settings (previously onboarding Step 3 only). Retest: change tiers in settings → public page chips reflect it; toggle counter → public page hides/shows at the ≥10 threshold.

### TC-DASH-16: Billing page + cancel

**Preconditions:** Pro (sandbox) founder.
**Steps:** 1. Open billing, check status/invoices. 2. Cancel via portal.
**Expected:** Tier from context; status + invoices render; portal cancel flows; downgrade reconciles (source: story-13.3; reconcile cron). `[PROD]`
**Result:** [ ] Pass [ ] Fail

> **Run note (2026-10-19 — production): PENDING — not executed.** Sandbox billing/cancel flow was not run in this batch.

### TC-DASH-17: Chart range + stat deltas

**Preconditions:** Populated waitlist, signups across >30 days.
**Steps:** 1. Toggle chart 30d / All Time. 2. Read stat-card deltas.
**Expected:** Bars re-aggregate per range; deltas show comparison tone; empty metrics show em-dash (source: stories 9.6/12.1.2).
**Result:** [ ] Pass [ ] Fail

> **Run note (2026-10-19 — production): PENDING — not executed.** Requires signups older than 30 days on production.

### TC-DASH-18: Profile danger zone + data export

**Preconditions:** Test founder account.
**Steps:** 1. GET `/api/profile/export` → inspect. 2. Delete account from profile (confirm), verify session + data gone.
**Expected:** Export returns profile payload (graceful degradation); delete cancels via Paddle then removes user (source: inventory §2 `profile` row; D4).
**Result:** [ ] Pass [ ] Fail

> **Run note (2026-10-19 — production): PENDING — not executed.** Requires a separate throwaway founder account.

### TC-DASH-19: Second waitlist create (free 402 / pro ok)

**Preconditions:** Free founder with 1 active waitlist.
**Steps:** 1. Create from header/switcher or settings list. 2. Flip Pro, create again.
**Expected:** Free → 402 upgrade prompt (no deadlock); Pro → created, `?wid=<new>` lands on it (source: story-13.4 tier limit; 19.6 flow GREEN).
**Result:** [x] Pass [ ] Fail

---

## 4. Public waitlist & thank-you <a id="public"></a>

> **Batch 4 executed 2026-10-20 — production (per batch instructions; per-case env not separately recorded) — 12 pass / 1 fail / 3 agent-verification.** PASS: TC-PUB-01..12 (incl. both `8edf472` retest vehicles — 03 settings-added questions render + auto-refresh, 08 updates auto-refresh). FAIL: TC-PUB-14 — og card visual/layout, founder: "not arranged properly and does not look like previewed in the app" (Prompt #8 → **fixed 2026-10-19, uncommitted — retest pending deploy**). AGENT-VERIFICATION COMPLETE: TC-PUB-13, 15, 16 — all 3 pass (method + evidence in each case's run note). **2026-10-20 retest: TC-PUB-14 PASS (founder: "batch 4 is fully a pass") — section 4 final: 16/16 pass.**

### TC-PUB-01: Live page section order + brand

**Preconditions:** `quality.lvh.me:3000`.
**Steps:** 1. Load page, scroll top→bottom.
**Expected:** Brand top-left → headline (5xl/6xl extrabold) → subheadline → counter → form → milestones → how-it-works cards → updates below fold (source: stories 18.0/18.6; manifest `02-waitlist-populated-desktop.png`).
**Result:** [x] Pass [ ] Fail

> **AMENDED 2026-10-21 (`f42ce06` — visual rebalance, founder):** order and copy are unchanged; the **hierarchy** is not. Milestone chips are now the second focal point (`text-sm`, brand-color outline on every template), while how-it-works step cards are quiet metadata (border only, no fill, `text-xs`, muted) — previously the step cards carried `text-sm` fills and competed with the chips. Retest: the chips should draw the eye before the step cards; no template should show filled/bold step cards.

### TC-PUB-02: Form field order + trust + consent

**Preconditions:** Public page.
**Steps:** 1. Inspect form bottom: button, consent sentence, trust line. 2. Click Terms/Privacy in consent line.
**Expected:** Order button → consent → trust; trust verbatim `No spam. Unsubscribe anytime.`; links land `/legal/*` (source: story-18.7 round-3; story-18.1/W3).
**Result:** [x] Pass [ ] Fail

### TC-PUB-03: Qual question rendering (both types)

**Preconditions:** Waitlist with free-text (optional) + MC questions.
**Steps:** 1. Inspect free-text field. 2. Open MC dropdown.
**Expected:** Question text inside field, amber `(optional)` right; MC label above + collapsed select showing `Select an option`, brand border when answered (source: story-18.7 + 2026-10-03 MC directive).
**Result:** [x] Pass [ ] Fail

> **Retest for `8edf472` (2026-10-20):** also verify the exact original bug — use a waitlist whose owner answered **No** at onboarding step 4 (never visited 4a), then add a question via **dashboard settings → Qualification tab → save**, and load the public page. The question must appear (before the fix, `qualification_enabled` stayed false forever and the form never asked it). Optionally leave the public page open while saving and confirm it appears within ~60s via auto-refresh, without reloading.

### TC-PUB-04: Phone modes on form

**Preconditions:** Waitlists with phone off / optional / required.
**Steps:** 1. Load each variant. 2. Submit required-mode without phone; with `+15551234567`; with `abc`.
**Expected:** Off hides field; required-empty → `Phone number is required`; garbage → `Please enter a valid phone number`; valid E.164 stored (source: phone plan).
**Result:** [x] Pass [ ] Fail

### TC-PUB-05: Successful signup → position + email [PROD for email]

**Preconditions:** Public page, fresh email.
**Steps:** 1. Submit valid email (wait ≥2s on page first).
**Expected:** Position shown; confirmation email `You're #N in line for {product}` with tier-correct footer (Free: Powered-by; Pro: address-only) (source: stories 7.2/12.0/19.1).
**Result:** [x] Pass [ ] Fail

### TC-PUB-06: Duplicate + bot guards

**Preconditions:** Public page.
**Steps:** 1. Re-submit same email → note. 2. Submit with `website` filled / instantly (<2s).
**Expected:** Duplicate → 409 `already on the waitlist` + position; bot/fast submits rejected generically (source: stories 7.4 + phase-6).
**Result:** [x] Pass [ ] Fail

### TC-PUB-07: Counter visibility threshold

**Preconditions:** Waitlists with counter on +9 subs / +10 subs.
**Steps:** 1. Load both pages.
**Expected:** Hidden below 10, visible at ≥10 when enabled (source: issue #16).
**Result:** [x] Pass [ ] Fail

### TC-PUB-08: Milestones + updates card on page

**Preconditions:** Milestones + ≥1 founder update.
**Steps:** 1. Check milestone chips vs referral state. 2. Check updates card content/position. 3. Leave the public page open; publish a **new** update from `/dashboard/updates`; watch the public page.
**Expected:** Locked/unlocked chip states; latest-update card only, below fold, centered restyle (source: stories 4.3/7.6/7.7 + 2026-10-03 restyle). **Step 3:** the new update appears within ~60s with **no manual reload** (auto-refresh, `8edf472`); an in-progress form field on the page must keep its typed text.
**Result:** [x] Pass [ ] Fail

> **AMENDED 2026-10-21 (`f42ce06` — founder rebalance):** milestone chips are now the page's second focal point — brand-color outline (`border-[var(--brand-color)]`) on **all** templates, `rounded-(--radius-lg)`, `px-3.5 py-2`, `text-sm` (threshold bold foreground, label semibold brand), backgrounds minimal `bg-card` / bold `bg-muted` / dark `bg-dark-template-input`. Retest: chips read clearly above the quiet how-it-works row on Minimal, Bold and Dark; unlocked labels use the founder's brand color.

### TC-PUB-09: Powered-by gating [FREE] vs [PRO]

**Preconditions:** Free + Pro waitlists.
**Steps:** 1. Load both public pages + thank-you + leaderboard.
**Expected:** Free shows footer; Pro shows none anywhere (source: story-12.2.11).
**Result:** [x] Pass [ ] Fail

### TC-PUB-10: Archived → gone

**Preconditions:** Archived waitlist.
**Steps:** 1. Load public URL, thank-you URL, leaderboard URL.
**Expected:** All → `/{subdomain}/gone` notice (source: story-12.2.1; manifest `04-gone-archived-desktop.png`).
**Result:** [x] Pass [ ] Fail

### TC-PUB-11: Thank-you direct variant

**Preconditions:** Fresh signup (no ref).
**Steps:** 1. Land on thank-you, note position/link/buttons.
**Expected:** Position + referral link (`/{sub} ?ref={8-char}`) + equal-weight share buttons; display-name input saves (≤100) (source: stories 8.0/8.1/12.2.13; manifest `12-thank-you-desktop.png`).
**Result:** [x] Pass [ ] Fail

### TC-PUB-12: Thank-you referred variant

**Preconditions:** Signup via `?ref=<valid code>`.
**Steps:** 1. Complete signup with ref. 2. Re-submit edge: ref of another waitlist; self-ref.
**Expected:** `Referred by {Name}` pill; referrer credited; cross-waitlist → `Invalid referral code` + uncredited retry; self-ref silently uncredited (source: stories 8.2/8.3; AC wording superseded C15).
**Result:** [x] Pass [ ] Fail

### TC-PUB-13: Milestone progress line states

**Preconditions:** Subscriber below / above all tiers.
**Steps:** 1. View thank-you at low count. 2. At count past top tier.
**Expected:** `N of M` next-tier line while tiers remain; hidden when all passed (no all-earned copy) (source: hardening F2).
**Result:** [x] Pass [ ] Fail

> **Agent-verified (2026-10-20 — production, `test.prewaitlist.com`).** State 1 (tiers remain): thank-you for subscriber `10c78e35` rendered `You've referred 0 of 1 friends toward: Early access` + position line + both tier chips. State 2 (all passed): temporary service-role seed of 5 rows with `referrer_id` = that subscriber (direct DB insert — no API → no confirmation emails, no rate-limit), same URL re-rendered with **no progress line** (chips intact, zero all-earned copy) — matching the F2 hide-state. Seed rows deleted immediately after (204; waitlist back to the 2 intentional rows). Note: no natural all-passed subscriber existed anywhere in the DB (every referral count was 0).

### TC-PUB-14: Social metadata + og cards [PROD]

**Preconditions:** Prod subdomain pages.
**Steps:** 1. View source: `og:title`, `twitter:title`, image URLs. 2. Hit image URLs directly. 3. Paste into X composer.
**Expected:** Titles carry `— Join the waitlist` suffix (og/twitter only); images 200 PNG; Pro card has no Powered-by; Free card has it (source: Phase C + og redesign 2026-10-04).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-20 - production): FAIL - og card visual/layout.** Founder report: "not arranged properly and does not look like previewed in the app." **[FIXED 2026-10-19 — uncommitted at fix time, retest pending deploy.]** Prompt #8 root cause: both card files left-anchored content (no `alignItems`/`textAlign: center`) — content sat in the left third of the 1200×630 canvas, diverging from the app's centered hero and failing platform center-crops (X summary / Discord / WhatsApp keep only the middle 630px square). Fix = center-composition on both files (`src/app/(public)/[subdomain]/opengraph-image.tsx` + `src/app/opengraph-image.tsx`: `alignItems: "center"` on columns, `textAlign: "center"` on headline/subtitle, `alignSelf: "center"` on the Powered-by footer so it also clears X's bottom-left domain overlay). No copy/color/size changes. Verified locally (`next build` + `:3100` render of real `test` data): both cards center-weighted ✓. Free-tier footer path also agent-verified during the Prompt #3 audit (real component + mocked free waitlist → footer `alignSelf: center` renders centered, clears the X overlay ✓). Two independent Prompt #3 audits passed with 0 findings.
> **[RETEST PASSED 2026-10-20 — founder: "batch 4 is fully a pass" — fix accepted, TC-PUB-14 closed. Batch 4 final: 16/16 pass.]**

### TC-PUB-15: Formula-injection answer → safe CSV cell

**Preconditions:** Qual free-text question; Pro founder.
**Steps:** 1. Submit qual answer `=CMD|'/C calc'!A0`. 2. Export CSV, open raw.
**Expected:** Cell stored raw but exported as `'=CMD|…` (formula-lead defense); pure numbers unprefixed (source: story-19.2 AC8).
**Result:** [x] Pass [ ] Fail

> **Agent-verified (2026-10-20 — production) — method disclosed.** Storage: real public `POST /api/subscribers` on `test` with answer `=CMD|'/C calc'!A0` + phone `+15551234567` → 201; row `e8df9d1e` stores the answer **raw** in `qual_answers` (service-role read-back). Export: live CSV download not executed (QA creds file `tests/e2e/.auth/qa-credentials.json` → `Invalid login credentials`); verified instead by code (`export/route.ts` L11-16 `escapeCsvCell` — lead regex `^[=+\-@\t\r]` + pure-number exemption — and L163 `cells.map(escapeCsvCell)` applied to every cell incl. qual answers + phone) plus targeted run `csv-export.test.ts` + `subscribers.test.ts` = **41/41** incl. the OWASP 3-vector. Founder spot-check (~30s): `/dashboard/leaderboard` → Export CSV for `test` → formula cell must read `'=CMD|'/C calc'!A0` and phone `+15551234567` unprefixed. Side effect: one confirmation email sent to the tagged founder inbox (`hazaak004+pub15qa@gmail.com`).

### TC-PUB-16: Root og-image anon + metadataBase [PROD]

**Preconditions:** Prod apex + subdomain.
**Steps:** 1. GET `/opengraph-image` with no session → 200 PNG. 2. Check subdomain page `og:image` host.
**Expected:** Anon 200 (allowlisted); subdomain image URL on subdomain host (segment metadataBase) (source: Phase C; twitter-card fix 2026-10-04).
**Result:** [x] Pass [ ] Fail

> **Agent-verified (2026-10-20 — production).** `https://www.prewaitlist.com/opengraph-image` with no session → **200 image/png** (29 996 B); apex with `-L` → 200 (308 → www). `test.prewaitlist.com` page source: `og:image` + `twitter:image` both `https://test.prewaitlist.com/test/opengraph-image-lc1qod?…` (**subdomain host** ✓ via segment metadataBase); direct image fetch → 200. Note: the older `quality`/`p`/`th`/`pr` waitlists have been deleted from the DB — only `test`/`sup`/`bat`/`prod`/`product` remain; verification used `test`.

---

## 5. Leaderboard & referrals <a id="leaderboard"></a>

### TC-LEAD-01: Public leaderboard rank + pages

**Preconditions:** Populated waitlist.
**Steps:** 1. Open leaderboard. 2. Page through. 3. Compare top rows vs referral counts.
**Expected:** Boost-first sort, anonymized `a•••@domain` emails, `Showing X–Y of Z` pagination (source: stories 7.5/16.4/16.5/16.7; manifest `03-leaderboard-public-desktop.png`).
**Result:** [ ] Pass [ ] Fail

### TC-LEAD-02: Referral credit end-to-end [PROD for email]

**Preconditions:** Subscriber A with code; fresh email B.
**Steps:** 1. B signs up via A's `?ref=`. 2. Check A's count + A's moved-up email on next signup.
**Expected:** A credited; referrer gains position; moved-up email `🎉 You moved up {n} spot(s)!` with S4 body (never founder custom) (source: stories 8.2/12.2; 2026-09-28 decisions).
**Result:** [ ] Pass [ ] Fail

### TC-LEAD-03: Milestone earn + skip-the-line [PROD for email]

**Preconditions:** Milestones configured (incl. skip-the-line tier).
**Steps:** 1. Drive referrals to a threshold.
**Expected:** Congratulatory email (`Congratulations! You earned: {label}`) + Share-&-Move-Up CTA; skip tier moves subscriber to #1; idempotent re-checks (source: stories 7.6 + hardening F1).
**Result:** [ ] Pass [ ] Fail

### TC-LEAD-04: Cap behavior at 500 [FREE]

**Preconditions:** Free waitlist near cap (staging).
**Steps:** 1. Fill to 500, attempt 501st. 2. Check 90%-warning email at 450.
**Expected:** 501st → 403 `Subscriber limit reached…`; warning email at ≥450 with `/dashboard?upgrade=cap` CTA; Pro exempt (source: stories 13.4/12.x; 2026-09-22 decision). `[PROD]` for emails.
**Result:** [ ] Pass [ ] Fail

> **Cap-test procedure (staging — verbatim SQL; no real 500 rows needed).** The cap enforces on the cached `waitlists.subscriber_count`, so seed the counter directly. Use a throwaway **Free** waitlist (e.g. subdomain `cap-test`); everything below runs in the Supabase SQL Editor + the public page.
>
> 1. **Seed at 449:** `UPDATE waitlists SET subscriber_count = 449 WHERE subdomain = 'cap-test';`
> 2. **Signup #1** (public page form, fresh email) → succeeds; counter becomes 450 via the atomic claim (`increment_subscriber_count(id, 500)`).
> 3. **90% email check [PROD]:** founder inbox receives `{product} is almost full` (`You've reached 450 of 500 subscribers on the Free plan.` + `Upgrade to Pro` CTA → `/dashboard?upgrade=cap`). **Batch 5:** the email must also carry a plain-text part (multipart — open the raw email / "Show original"; body is readable text, not HTML source).
> 4. **Seed at 499:** `UPDATE waitlists SET subscriber_count = 499 WHERE subdomain = 'cap-test';`
> 5. **Signup #2** (fresh email) → succeeds; counter hits exactly 500.
> 6. **Signup #3** (fresh email) → **403** with body `{"error":"Subscriber limit reached. Upgrade to Pro for unlimited signups."}` — two independent gates fire: pre-check (`route.ts:560`, `count >= 500`) and the atomic claim (`route.ts:685`, `NULL` = capped).
> 7. **Pro exempt:** SQL flip the founder to `pro` (`UPDATE founder_profiles SET tier = 'pro' WHERE id = (SELECT id FROM auth.users WHERE email = '…');`), retry Signup #3 → 201 (`p_cap: null` for Pro at `route.ts:677`).
> 8. **Cleanup:** delete the throwaway waitlist + its subscribers, or reset `subscriber_count = 0`.
>
> **Notes:** same-IP signups are fine — rate limit is 5/hour per IP and the test uses 3. The 90% email idempotency key is `cap-warning/{waitlist_id}`, so a repeat send at 500 dedupes rather than spamming (second fire is expected, second _delivery_ is not). Local runs only prove steps 2/4/5/6/7 (emails are `[PROD]`).

### TC-LEAD-05: Top-referrers visibility by tier

**Preconditions:** Referrals exist; free then pro.
**Steps:** 1. View overview as Free. 2. Flip Pro.
**Expected:** Free hides TopReferrers (warmth numbers visible, no lock icon); Pro shows top-5 by quality score (source: founder decision 2026-09-22).
**Result:** [ ] Pass [ ] Fail

---

## 6. Warmth <a id="warmth"></a>

> **Batch 6 executed 2026-10-23 - local + prod probes - 5 pass / 0 fail.** BATCH 6 CLOSED: TC-WARM-01..05 all PASS. Waitlist under test: `belt` (id `900b1600-ae25-4c4d-8755-e7349f35c4bb`, Pro, 21 real subscribers → 26 with QA fixtures). Fixtures: `warmfresh-belt` (signup today), `warm29-belt` (−29d), `warm30-belt` (−30d), `warmcap-belt` (−60d + 6 clicks @ −40d), `warm90-belt` (−90d). Batch trigger: local `POST /api/cron/warmth` with `CRON_SECRET` bearer (4 runs). Fixture end-state left as evidence: `warmfresh-belt` unsubscribed, `warm29-belt` hard-bounced (both by TC-05).

### TC-WARM-01: Scoring math + tiers

**Preconditions:** Subscribers with known events (clicks/referrals/qual).
**Steps:** 1. Compare dashboard badges vs `70 + 5c + 15r + 8q − decay` (decay: 0–29 free / 30–89 −25 / 90+ → 0).
**Expected:** Baseline 70 = Hot at signup; ≥70 Hot, ≥40 Warm, else Cold; Hot also requires activity within 29 days (recency cap); never null (source: restructure 2026-09-25; decay + cap amended 2026-10-23).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-23 - local): PASS.** Baseline batch `28 hot / 25 warm / 2 cold / 1 total-mismatch-none` → fixtures read exactly as model predicts: `warmfresh-belt` 70 Hot, `warm29-belt` 70 Hot, `warm30-belt` 45 Warm, `warmcap-belt` 75 (clicks) but **capped to Warm** by recency (60d silent), `warm90-belt` 0 Cold. Click leg: new `clicked` event on `warmfresh-belt` → re-batch → still Hot (75). Distribution after runs: belt = 24 hot / 1 warm / 1 cold / 26 total (21 real all hot + 5 fixtures), matching DB head-count.

### TC-WARM-02: Badge colors + panel

**Preconditions:** Mixed tiers.
**Steps:** 1. Check subscriber warmth displays + overview panel bars.
**Expected:** Hot green `#0f7a5e`, Cold blue (never red); 3 bars with counts (source: Epic 11 + 2026-09-27 flip + 15.4 redesign).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-23 - founder screenshots): PASS.** Tokens in `globals.css:40-42` = hot `#0f7a5e` / warm `#c7841a` / cold `#3b6fa6`. Warmth page cards 23/2/1 + "4% cold"; overview panel 3 bars 88%/8%/4% with colored counts (`warmth-panel.tsx`); badges `bg-status-* text-white` (`warmth/client.tsx`); `/api/dashboard/warmth` head-counts match DB exactly.

### TC-WARM-03: Decay boundary

**Preconditions:** Aged test subscribers (30/90-day events).
**Steps:** 1. Check scores at day 29 vs 30 vs 90+.
**Expected:** Day 29 unpenalized (70 Hot); 30–89 −25 (45 Warm) and **cannot be Hot even with high engagement** (recency cap); 90+ → 0 (Cold); clock = latest meaningful action (source: 30-day grace + recency cap, 2026-10-23, `>= 30` boundary).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-23 - local): PASS.** All four boundaries proven on belt fixtures in one batch: day 29 = 70 Hot · day 30 = 45 Warm · day 90 = 0 Cold · 60d-silent-but-click-heavy = 75 **Warm** (recency cap — the key amendment). Clock reset leg: new click on `warm30-belt` → re-batch → flipped warm→hot (batch `28/26/1/1`). Note: `warmth.ts` model changes were **uncommitted at run time** — prod still ran the old 60-day model until deploy; local runs are authoritative for this case.

### TC-WARM-04: Opens ignored; cron + webhook [PROD]

**Preconditions:** Prod, Resend events flowing.
**Steps:** 1. Confirm opens don't move scores. 2. Check cron ran 05:00 UTC (Vercel logs). 3. Check webhook 401/401/200 handling.
**Expected:** Clicks/referrals/qual only; daily batch; idempotent webhook (source: stories 15.0–15.2; 15.6).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-23 - local batch + prod webhook probes): PASS.** **Part A:** injected `email.opened` event on `warm90-belt` (dated now) → re-batch → **still cold** (batch unchanged `28/26/1/1`) — opens enter neither score nor recency clock. **Part B:** cron schedule present in `vercel.json:9-10` (`/api/cron/warmth` @ `0 5 * * *` = 05:00 UTC daily); prior live verify Epic 15 (2026-09-27, prod invoke `200 {processed:9,...}`). Vercel dashboard glance still open as optional founder confirm — code-side + prior live invoke cover the expectation. **Part C (prod `https://www.prewaitlist.com/api/webhooks/resend`):** no svix headers → 401 `Missing svix headers` · garbage signature → 401 `Invalid signature` · **valid signed `email.opened`** (signed + sent with the same `standardwebhooks@1.0.0` library the server uses) → 200 `{"received":true}` + exactly one `email_events` row (`svix_id: qa-node-79t1f7xk`) · **replay same svix-id** → 200, **still one row** (idempotent). Local server accepts the same probe with the same `.env.local` secret → local and prod secrets proven identical. Gotcha: earlier PowerShell-signed probes 401'd due to body-encoding fidelity in the inline-arg path — harness issue, not product (recorded so it isn't re-diagnosed).

### TC-WARM-05: Segments eligibility [PRO]

**Preconditions:** Pro, mixed tiers + unsub/bounced.
**Steps:** 1. GET segments with/without `?wid=`; multi-waitlist without wid.
**Expected:** Eligible counts (unsub+bounce excluded); tier gate before lookup; `wid` required when multi (source: stories 15.3/17.1).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-23 - local, founder address bar + service REST setup): PASS.** Fixtures: unsubscribed `warmfresh-belt`, hard-bounced `warm29-belt` (inserted via service REST; founder tier flipped free→pro for the run). Four legs on `/api/dashboard/broadcast/segments` (founder owns 3 waitlists): valid `?wid=belt` → `200 {"all":24,"hot_warm":23,"cold":1}` (26 − 1 unsub − 1 hard-bounce; hot_warm = 22 hot + 1 warm) · no wid → `400 {"error":"wid is required when multiple waitlists exist"}` · unknown wid → `404 {"error":"No waitlist found"}` · tier temporarily `free` → `403 {"error":"Broadcast requires a Pro subscription"}` (**gate fires before any waitlist lookup — no counts leak**), flipped back to `pro` after. Founder ran legs via address bar (console blocked in their Chrome) — GETs carry session cookies on same-origin navigation. Eligible-count math mirrored from DB and matches route's in-memory filter (`unsubscribed_at IS NULL` + active bounce suppression).

---

## 7. Email & broadcast <a id="email"></a>

> **Batch 7 executed 2026-10-26 — production — 7 pass / 0 fail. BATCH 7 CLOSED.** All 7 cases passed, confirmed, and fixed. TC-EMAIL-01 (Pro logo inversion defect fixed & verified on fresh signups), TC-EMAIL-02 (stream separation verified: notifications@ vs updates@mail.), TC-EMAIL-03 (unsubscribe/resubscribe full loop closed & verified in DB + sends), TC-EMAIL-04 (complaint bounce classification bug fixed & verified), TC-EMAIL-05 (physical address footers verified: custom & default fallback), TC-EMAIL-06 (custom HMAC unsubscribe link + List-Unsubscribe headers verified), TC-EMAIL-07 (quota retry queue replay verified).

### TC-EMAIL-01: Confirmation footer per tier [PROD]

**Preconditions:** Free + Pro waitlists.
**Steps:** 1. Sign up to each.
**Expected:** Free footer = Powered-by lockup + address; Pro = address only; custom sender honored for Pro (source: stories 12.5/12.6/19.1).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-26 — production): PASS — with a defect found, fixed, and accepted on fresh emails.** Agent legs (2026-10-23): `qa-free-em` → hazaak009+qafree delivered From `QA Free Email <notifications@prewaitlist.com>` (sender_name null → default) · `qa-em-pro` → hazaak009+qaempro delivered From `QA Pro Sender <notifications@prewaitlist.com>` (custom sender honored, 12.5/12.6 ✓). **DEFECT FOUND ON THIS CASE (reported by founder 2026-10-26): the Pro confirmation rendered a PreWaitlist logo header.** Root cause: `subscribers/route.ts` gated the 140×28 header logo `tier !== "free"` (`<!-- Logo (Pro only) -->`) — inverted vs the standing brand rule (Free = Powered-by attribution, Pro = white-label). Identical inverted block in `buildMovedUpEmail`. **Fixed 2026-10-26 (founder chose "remove header logo entirely"):** both header blocks + the dead `tier` param removed from both builders and their call sites; footer tier gating untouched (footers were already correct everywhere: confirmation/moved-up/milestone `free → buildFreeEmailFooter`, broadcast/updates logo-free). Locked by `not.toContain("PreWaitlist-logo.svg")` assertions on pro + free confirmation html and pro + free moved-up html (`subscribers.test.ts`, `subscribers-referral.test.ts`). **Acceptance (fresh emails 2026-10-26, `+qafree2` + `+qaempro2`, both delivered 20:21Z, built by the fixed code): founder verified free footer = Powered-by lockup + default address, pro = no top logo + address-only footer → both tier expectations PASS.**

### TC-EMAIL-02: Stream separation [PROD]

**Preconditions:** Sent transactional + broadcast.
**Steps:** 1. Inspect From headers.
**Expected:** Transactional via `notifications@prewaitlist.com`; bulk via `updates@mail.prewaitlist.com` (verified domain) (source: story-12.6 amended 2026-10-10).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-26 — production): PASS.** Transactional confirmations From `notifications@prewaitlist.com` (both free + pro legs, 2026-10-23, display names "QA Free Email" / "QA Pro Sender"); bulk broadcast From `updates@mail.prewaitlist.com` verified by founder inspecting broadcast #1 (step A, 2026-10-25). Streams never mixed.

### TC-EMAIL-03: Unsubscribe → resubscribe loop [PROD]

**Preconditions:** Received email with footer.
**Steps:** 1. Click unsubscribe → confirm. 2. Verify no further bulk mail. 3. Resubscribe via token link.
**Expected:** One-click unsub (no login); suppression enforced pre-send; resubscribe restores (source: stories 12.2.7/12.2.8).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-26 — production): PASS — full loop closed.** Step B (2026-10-25): founder clicked Unsubscribe in broadcast #1 → confirmation page rendered with "Changed your mind? Resubscribe" link (no login) = PASS; DB verified same day: `subscribers.unsubscribed_at = 2026-10-25T10:13:43Z` on `0d712ab1` (hazaak009+qaempro) — suppression persisted. **Suppression leg (2026-10-26):** broadcast #2 on qa-em-pro → eligible count **1** (was 3 rows: 2 unsubscribed excluded — incl. the complaint row) and exactly one copy delivered To `hazaak009+qaempro2@gmail.com`, never to an unsubscribed row → pre-send suppression enforced (12.2.7). **Resubscribe leg:** founder clicked the email's Unsubscribe → Resubscribe in the browser flow → "You have been resubscribed" rendered; DB re-verified: `+qaempro2.unsubscribed_at = null`. Agent then proved the toggle server-side with mid-flight DB reads on `0d712ab1` using a real HMAC token: start `2026-10-25T10:13:43Z` → POST `/api/unsubscribe/resubscribe` 200 → `null` → POST `/api/unsubscribe` (RFC 8058 one-click) 200 → `2026-10-26T20:32:03Z` → resubscribe 200 → `null` final. Both directions persist; resubscribe requires a matched row (no silent success, 4.6). **Re-delivery leg (broadcast #3, 2026-10-26T20:39Z):** `broadcasts` row `recipient_count = 2`; Resend webhook events show `sent`+`delivered` for both `0d712ab1` (+qaem-pro) and `93932b9e` (+qaempro2); the still-unsubscribed complaint row got **zero** events — resubscribed subscribers receive bulk mail again while suppression continues to hold for the rest. Founder screenshots: two copies, To `+qaempro2` and To `+qaempro`, From `QA Pro Sender <updates@mail.prewaitlist.com>`. Final fixture state: `+qaem-pro` + `+qaempro2` subscribed, `qa-complaint` still unsubscribed/suppressed.

### TC-EMAIL-04: Bounce suppression [PROD]

**Preconditions:** Hard-bounced address on list.
**Steps:** 1. Attempt sends to it.
**Expected:** Suppressed pre-send; `bounced_emails` row; complaint = hard (source: stories 12.2.8/15.2).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-26 — production): PASS — with a bug found & fixed mid-run.** (a) Bounce half: `qa-bounced@example.com` signup → 201 but **zero** `email_events` rows = `isEmailBounced` suppression ran pre-send (12.2.8) ✓. (b) Complaint half: **BUG** — Resend's official `email.complained` payload carries the type only at event top level (`data` has no complaint marker, no `data.type`), so `determineBounceType` sniffing `data` classified it "soft". **Fixed:** webhook passes its already-correct `mappedType` → `mappedType === "complained"` → "hard" + auto-unsubscribe. Live re-probe: `20cb256c` → `bounce_type:"hard"` + `unsubscribed_at` set. Locked by `webhook-resend.test.ts` regression using Resend's official payload shape (8/8 green).

### TC-EMAIL-05: Physical address footer [PROD]

**Preconditions:** Waitlist with `business_address` set + one without.
**Steps:** 1. Inspect footers of both.
**Expected:** Configured address rendered; fallback present when unset (source: story-12.2.9).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-26 — production): PASS — both halves.** Broadcast #1 footer showed `123 QA Test Avenue, QA City, QA 12345` exactly as configured on qa-em-pro (founder step A, 2026-10-25). Fallback half: `qa-free-em` has `business_address` null → fresh confirmation to `hazaak009+qafree2` (2026-10-26) rendered the `DEFAULT_ADDRESS` fallback (`buildFreeEmailFooter(business_address ?? DEFAULT_ADDRESS)`) — founder verified the fallback address present in the footer.

### TC-EMAIL-06: Broadcast CAN-SPAM + custom HMAC [PROD]

**Preconditions:** Pro broadcast sent.
**Steps:** 1. Inspect footer + headers.
**Expected:** Address + working custom unsubscribe URL; `List-Unsubscribe(-Post)` headers; never Resend merge tag (source: stories 12.3/17.x; C10).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-26 — production): PASS — full case confirmed by founder.** Body half: configured address + working custom-HMAC Unsubscribe link (founder click → unsubscribe page, step B) ✓; zero Resend merge-tag usage in code (17.x correction + tests). Header half: confirmed by founder via "show original" on broadcast #1 — `List-Unsubscribe` / `List-Unsubscribe-Post` headers present and verified. Full case PASS.

### TC-EMAIL-07: Quota warning + retry replay [PROD]

**Preconditions:** Resend quota exhausted (staging key or simulated).
**Steps:** 1. Trigger a send past quota. 2. Restore quota, let `cron/email-retry` drain.
**Expected:** Quota-warning email to founder; confirmation/moved-up replay with original idempotency keys; others dead-letter (source: inventory §4 templates 7–8; retry-queue rules).
**Result:** [x] Pass [ ] Fail

> **Run note (2026-10-26 — production replay + local cron; scope per batch-7 consolidation = retry replay): PASS.** Queue row `5e35bd2c` inserted past-dated → local `GET /api/cron/email-retry` (CRON_SECRET) → `{"processed":1,"sent":1,"reparked":0,"deadLettered":0}`; replayed confirmation kept its original idempotency key (`confirmation-email/<id>`), email arrived in the founder inbox, row drained + deleted. Quota-warning half cannot exhaust the production Resend quota — covered instead by unit tests (90%-cap warning idempotency key + plain-text part, batch 5) and the TC-LEAD-04 cap procedure; repark/dead-letter paths covered by retry-queue unit tests (live sim exercised only the sent path).

---

## 8. Billing & upgrade <a id="billing"></a>

> **Batch 8 executed 2026-10-27 — local + production sandbox — 6 pass / 0 fail. BATCH 8 CLOSED.** Confirmed by founder across sandbox testing and verified under the hood. TC-BILL-01 (checkout & webhook tier flip via subscription.created/transaction.completed with instant UI refresh), TC-BILL-02 (already-subscribed 400 guard rendered inline in modal), TC-BILL-03 (modal cooldown logic + explicit trigger bypasses), TC-BILL-04 (1-waitlist limit 402 + scheduled cancellation & period-end surplus archive + stale tx guard), TC-BILL-05 (domain wizard 3 steps + Resend DNS verification), TC-BILL-06 (sandbox card decline & 3DS challenge completion).

### TC-BILL-01: Checkout + webhook tier flip [PROD, sandbox]

**Preconditions:** Free founder.
**Steps:** 1. Open checkout, pay with `4000 0566 5566 5556`. 2. Watch tier + sidebar.
**Expected:** Webhook flips tier to pro (incl. `transaction.completed` path); UI refreshes without reload (source: stories 13.0–13.2; 2026-09-22 fixes).
**Result:** [x] Pass [ ] Fail

### TC-BILL-02: Already-subscribed guard

**Preconditions:** Pro founder.
**Steps:** 1. POST checkout again.
**Expected:** 400 `Already subscribed` surfaced in modal (not silent) (source: checkout route + modal fix).
**Result:** [x] Pass [ ] Fail

### TC-BILL-03: Upgrade modal triggers + cooldown

**Preconditions:** Free founder.
**Steps:** 1. Fire 4+ triggers (sidebar lock, cap buttons, `?upgrade=cap`, settings button). 2. Dismiss, re-fire same trigger same day. 3. Use `?plan=pro` deep link after dismiss.
**Expected:** All open with `Unlock all Pro features` fallback copy family; 1-day cooldown for passive keys only — explicit-intent triggers (`subscriber_cap` buttons, `billing`, `pro-cta-onboarding`, `pro-cta-billing`) always open; `?upgrade=cap` uses its own passive key `cap-email` and still cools down (source: stories 13.1 + 2026-09-22/29/10-16 decisions).
**Result:** [x] Pass [ ] Fail

### TC-BILL-04: Free creation limit + cancel-guard [PROD]

**Preconditions:** Free founder with 1 active waitlist.
**Steps:** 1. Create 2nd → note. 2. Cancel sub in portal (sandbox), then land a same-sub `transaction.completed`.
**Expected:** 2nd → 402 upgrade prompt; stale charge-after-cancel ignored (no re-upgrade); reconcile cron heals drift (source: stories 13.4; Phase A guard + cron).
**Result:** [x] Pass [ ] Fail

### TC-BILL-05: Sender domain wizard [PRO]

**Preconditions:** Pro founder.
**Steps:** 1. Register domain, read DNS records, verify.
**Expected:** 3-step wizard; Resend-backed verify; status via separate fetch (source: story-13.5).
**Result:** [x] Pass [ ] Fail

### TC-BILL-06: Decline + 3DS sandbox cards

**Preconditions:** Free founder, Paddle sandbox checkout.
**Steps:** 1. Pay with `4000 0000 0000 0002` (decline). 2. Pay with `4000 0276 0003 1981` (3DS), complete challenge.
**Expected:** Decline shows helpful error (no dead end, no tier change); 3DS completes and flips tier (source: sandbox cards 2026-09-27; story-13.0). `[PROD]`
**Result:** [x] Pass [ ] Fail

---

## 9. Feedback & tooling <a id="tooling"></a>

> **Batch 9 executed 2026-10-27 — automated + under-the-hood verification — 5 pass / 0 fail. BATCH 9 CLOSED.** TC-TOOL-01 (PostHog event flow & PII safety), TC-TOOL-02 (Surveys live + modal suppression), TC-TOOL-03 (UTM to profile attribution via mw_acquisition cookie & auth confirmation upsert), TC-TOOL-04 (Tour & Feedback FAB covered via TC-DASH-05/06), TC-TOOL-05 (?ref= wins over ?src= acquisition verified by regression test).

### TC-TOOL-01: PostHog event flow [PROD]

**Preconditions:** PostHog key in Vercel; prod session.
**Steps:** 1. Sign up (email) → onboard → get subscriber → upgrade → cancel-intent.
**Expected:** `account_created`, `subscriber_received`, `subscription_started`, funnel events fire; surveys suppressed mid-walkthrough only for triggers (source: story-20.1 D1–D7).
**Result:** [x] Pass [ ] Fail

### TC-TOOL-02: Surveys live

**Preconditions:** PostHog surveys configured per spec.
**Steps:** 1. Hit first-subscriber dashboard (Survey 1). 2. Open billing cancel (Survey 2).
**Expected:** Each shows once (Just-once), bottom-left position (clear of FAB) (source: story-20.1 AC5; audit reposition note).
**Result:** [x] Pass [ ] Fail

### TC-TOOL-03: UTM → profile attribution

**Preconditions:** Fresh browser.
**Steps:** 1. Land `/ ?utm_source=x&utm_medium=y&utm_campaign=z`, sign up same window, create waitlist.
**Expected:** Profile row carries utm_* (upsert, not silent no-op) (source: story-20.4 + audit F3; playbook §3).
**Result:** [x] Pass [ ] Fail

### TC-TOOL-04: Tour + feedback + contact (covered in TC-DASH-05/06 — execute there, record here)

**Expected:** See TC-DASH-05, TC-DASH-06.
**Result:** [x] Pass [ ] Fail

### TC-TOOL-05: `?ref=` wins over `?src=` acquisition

**Preconditions:** Fresh browser, homepage.
**Steps:** 1. Open `/?ref=abc12345&src=powered-by&utm_source=t&utm_medium=m&utm_campaign=c`. 2. Sign up same window, create waitlist, check profile row.
**Expected:** Stored `ref_param=abc12345`; hero shows powered-by variant; utm_* persisted via upsert (source: matrix §2 acquisition row; story-20.4).
**Result:** [x] Pass [ ] Fail

---

## 10. Edge cases & guards <a id="edge"></a>

> **Post-launch by founder request (2026-10-27).** Skip these 6 manual cases for now; they are deferred, not passed or failed.

### TC-EDGE-01: Anon redirect matrix

**Preconditions:** Signed out.
**Steps:** 1. Visit `/dashboard`, `/onboarding/4`, `/legal/terms`, `/unsubscribe?token=x`, `/opengraph-image`, subdomain page.
**Expected:** Dashboard/onboarding-4 → 307 signin/signup; legal/unsub/og-image + all subdomain hosts → 200 (source: inventory §3; 19.5 F8).
**Result:** [ ] Pass [ ] Fail

### TC-EDGE-02: `?wid` fallthrough + archived recovery

**Preconditions:** Archived + active waitlists.
**Steps:** 1. Dashboard with foreign/stale `?wid`. 2. Thank-you on archived list without params.
**Expected:** Falls to preference/newest; recovery card (not crash) (source: switcher fix; phase-4 4.3).
**Result:** [ ] Pass [ ] Fail

### TC-EDGE-03: Multi-waitlist disambiguation 400s

**Preconditions:** ≥2 waitlists.
**Steps:** 1. POST updates without `waitlist_id`. 2. GET segments without `?wid=`.
**Expected:** 400 `waitlist_id is required…` family (source: stories 16.0/17.1).
**Result:** [ ] Pass [ ] Fail

### TC-EDGE-04: Free-tier walls (402/403/upgrade paths)

**Preconditions:** Free founder.
**Steps:** 1. Create 2nd waitlist. 2. POST broadcast. 3. Exceed 2 questions. 4. Open updates URL directly.
**Expected:** 402 / 403 `Broadcast requires…` / 400 cap / upgrade modal (not dead end) (source: stories 13.2/13.4/14.0/17.4).
**Result:** [ ] Pass [ ] Fail

### TC-EDGE-05: Grandfathering + resubscribe-404 + export gate

**Preconditions:** Free founder with 3 legacy questions (pre-cap).
**Steps:** 1. Save questions untouched. 2. Resubscribe with unknown token. 3. As Free, GET export route directly.
**Expected:** Untouched over-cap saves pass (grandfathered); unknown token → 404; export route answers Free callers (D6 — UI-gated only, known) (source: Epic 14 cap; resubscribe route; inventory D6).
**Result:** [ ] Pass [ ] Fail

### TC-EDGE-06: D1/D2/D4/D5/D7/D9/D10 discrepancy notes

**Preconditions:** None (read-only review + light probes).
**Steps:** 1. Confirm domains GET/verify lack tier gate (D1/D2 — POST gated, benign). 2. Confirm export graceful degradation (D4/D5). 3. Confirm no email-verification gate (D7 — deferred by design). 4. Confirm caps parity route≡client (D9). 5. Confirm updates no-idempotency-key documented (D10).
**Expected:** All match inventory §9 as documented infos, not blockers (source: inventory D1–D10).
**Result:** [ ] Pass [ ] Fail

---

## 11. Mobile <a id="mobile"></a>

> **Post-launch by founder request (2026-10-27).** Skip these 3 manual cases for now; they are deferred, not passed or failed.

### TC-MOB-01: Public pages on 375px

**Preconditions:** Phone or 375px viewport.
**Steps:** 1. Walk waitlist → thank-you → leaderboard → gone.
**Expected:** No overflow/overlap; full-width stacked form; tables scroll in-card (source: 19.5 F1–F4 fixes; manifest `09/10/11/17`).
**Result:** [ ] Pass [ ] Fail

### TC-MOB-02: Dashboard + modal on small screens

**Preconditions:** 375px, dashboard + upgrade modal + hamburger.
**Steps:** 1. Open nav, table pages, upgrade modal.
**Expected:** Hamburger 38px clears content (`pt-14`); modal scrolls in-viewport; tables `overflow-x-auto` (source: 19.5 F-fixes).
**Result:** [ ] Pass [ ] Fail

### TC-MOB-03: Known P2 limitations (not blockers)

**Preconditions:** 768px viewport.
**Steps:** 1. Open onboarding two-pane steps.
**Expected:** 768px two-pane can overflow (steps 1–3 ≈835px, 4a ≈950px) — accepted P2 at Epic 19 close; record, don't fail (source: 19.5 F5).
**Result:** [ ] Pass [ ] Fail (N/A if fixed)

---

## 12. Input validation (pre-flagged from 21.4) <a id="validation"></a>

> Pre-flagged cases assert CORRECT behavior. The initial 2026-10-27 code-only review found 8 failures (some are compound cases with passing subchecks); all 8 were fixed and verified with regression tests. No manual, live API, or production probes were performed.

> **Initial batch 12 review (2026-10-27): 0 pass / 8 fail.** Evidence: TC-VAL-01 — check-slug accepted malformed values as available; POST relied on the database constraint, returning 500 instead of 400. TC-VAL-02 — reserved and taken slugs both displayed “Already taken.” TC-VAL-03 — unknown or omitted segments fell through to all subscribers. TC-VAL-04 — referral-code pair was required, but PATCH had no rate limit. TC-VAL-05 — signin and forgot-password read stale `emailError` state after setting it; native browser validation may block some malformed values, and that browser path was not tested. TC-VAL-06 — rendering the unsubscribe page updated `unsubscribed_at`. TC-VAL-07 — Paddle DB errors and Resend domain errors were returned to clients. TC-VAL-08 — template, CTA text, and brand color lacked server validation; the Free question cap was already enforced.

> **21.6 code verification (2026-10-27): 8 pass / 0 fail.** The 11 focused regression suites passed (146 tests); lint passed with 0 errors and 5 warnings; the production build passed. Full `pnpm test:run` reported 8 failures: the 7 documented baseline dashboard failures and one billing test timeout; the billing suite passed when rerun in isolation (4 tests). This verifies source and automated behavior only. No manual, live API, or production probes were performed.

### TC-VAL-01: Slug format rejected [pre-flagged W1]

**Preconditions:** `/api/waitlist/check-slug`.
**Steps:** 1. GET `?slug=ABC DEF!!`. 2. POST waitlist with un-normalized subdomain.
**Expected:** Format-invalid slugs rejected (400), not `available:true` / raw insert (source: 21.4 W1).
**Result:** [x] Pass — code/regression-test verified; no manual/live API probe

### TC-VAL-02: Reserved slug message [pre-flagged W2]

**Preconditions:** Step 1 slug field.
**Steps:** 1. Type `admin`.
**Expected:** Reserved-specific message (not misleading `Already taken`) (source: 21.4 W2).
**Result:** [x] Pass — code/regression-test verified; no manual/live API probe

### TC-VAL-03: Broadcast segment validated [pre-flagged W3]

**Preconditions:** Pro, broadcast API.
**Steps:** 1. POST with `segment: "hot "` (typo) / missing.
**Expected:** 400 on unknown segment — never silent send-to-all (source: 21.4 W3).
**Result:** [x] Pass — code/regression-test verified; no manual/live API probe

### TC-VAL-04: Subscriber PATCH authorized [pre-flagged W4]

**Preconditions:** Thank-you link pair.
**Steps:** 1. PATCH display_name from a different session/IP without the pair. 2. Burst 20 PATCHes.
**Expected:** Pair required (already) + rate limit present (source: 21.4 W4).
**Result:** [x] Pass — code/regression-test verified; no manual/live API probe

### TC-VAL-05: Signin/forgot first-submit validation [pre-flagged W5]

**Preconditions:** `/signin`, `/forgot-password`.
**Steps:** 1. Type invalid email, submit without blurring.
**Expected:** Client blocks before Supabase call (signup pattern) (source: 21.4 W5).
**Result:** [x] Pass — code/regression-test verified; no manual/live API probe

### TC-VAL-06: Unsubscribe GET side-effect free [pre-flagged W6]

**Preconditions:** Valid unsubscribe link.
**Steps:** 1. GET the page via prefetcher-style request (no click).
**Expected:** View does not unsubscribe; only explicit confirm POST mutates (source: 21.4 W6).
**Result:** [x] Pass — code/regression-test verified; no manual/live API probe

### TC-VAL-07: No raw error echo [pre-flagged W7]

**Preconditions:** Paddle sandbox event with failing DB write; domains verify failure.
**Expected:** Generic 500/400 strings; driver/Resend messages log-only (source: 21.4 W7 — 9 lines, 3 files).
**Result:** [x] Pass — code/regression-test verified; no manual/live API probe

### TC-VAL-08: Founder-text server caps [pre-flagged W8]

**Preconditions:** Authed waitlist PATCH.
**Steps:** 1. PATCH garbage `template`, 5k-char `cta_text`, non-hex `brand_color`, 6 questions as Free.
**Expected:** Whitelist/length/cap 400s (currently raw passthrough / degrade-to-minimal) (source: 21.4 W8).
**Result:** [x] Pass — code/regression-test verified; no manual/live API probe

---

## Coverage check (AC4, mechanical)

- **Inventory rows → cases:** pages 1–36 → TC-ONB/AUTH/DASH/PUB/LEAD/MOB rows above (all 36 covered: `auth-code-error` via TC-AUTH-05 failure path; signout via TC-AUTH-13; `loading` skeletons via TC-DASH-01; og-image via TC-EDGE-01 + TC-PUB-16; resume/redirect via TC-ONB-14). API 32 files → TC-EMAIL/BILL/EDGE/VAL rows (cron/webhook/billing as `[PROD]` + TC-EDGE-06 notes; export as Free direct-call in TC-EDGE-05; profile delete/export in TC-DASH-18; chart toggle in TC-DASH-17; second-waitlist create in TC-DASH-19). Proxy/guard rows → TC-EDGE-01/02. Email templates 1–8 → TC-EMAIL-01–07 + TC-PUB-05 + TC-DASH-11/12 + TC-LEAD-02–04. Components (6) → TC-DASH-04/05/06/07 + TC-BILL-03.
- **21.4 failures → cases:** W1–W8 → TC-VAL-01–08 (1:1).
- **20.x surfaces → cases:** 20.1 events → TC-TOOL-01/02; 20.2 tour → TC-DASH-05; 20.3/20.6 feedback → TC-DASH-06; 20.4 UTM + ref/src precedence → TC-TOOL-03/05; 20.5 prep → deliverable exists (no runtime case; PH submission itself out of scope per 21.8).
- **D1–D10 discrepancies →** TC-EDGE-05/06.
- **Count:** 107 cases (below the ~150–250 estimate — kept tight per "one case per meaningful behavior"; every AC4 leg above is 1:1 green, no padding).

## Results summary (filled in 21.7)

| Total | Passed | Failed | Deferred | Post-launch   | Not run / unrecorded                  | Launch blockers                                                                                        |
| ----- | ------ | ------ | -------- | ------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 107   | 88     | 0      | 1        | 9 (Sec 10–11) | Batch 5 run-notes + 4 dashboard cases | **0 batch-12 blockers**; 8 cases code/regression-test verified only (no manual/live/production probes) |

> **Progress (2026-10-19):** batch 1 (Sec 1 Auth) **CLOSED — 12 pass / 0 fail / 1 deferred** (TC-AUTH-04 signup rate cooldown, deferred by founder: "document as later"). Fixes shipped: duplicate-detection (`signup-duplicate.test.tsx`) + billing button cooldown exemption (`fc88810`). Batch 2 (Sec 2 Onboarding) **executed — 13 pass / 1 fail** (TC-ONB-14 resume/fresh-redirect; root causes located, fixes queued for 21.6). Batch 3 (Sec 3 Dashboard, TC-DASH-01..19) **executed on production — 11 pass / 4 fail / 4 pending.** Fails: 02 (free half — upgrade modal inconsistent), 05 (tour does not run + post-localStorage login lands on Step 1 instead of dashboard), 10 (free half — Warmth card click does not open modal), 11 (free half — no modal; Pro — whitespace counts toward 10-char minimum). Pending: 07, 16, 17, 18. Running total: **36 pass / 5 fail / 1 deferred**; 65 cases remaining (4 pending in Sec 3 + 61 in Sec 4–12). Next: batch 4 (Sec 4 Public waitlist & thank-you).

> **Progress (2026-10-20):** all batch-2/3 fix work now **committed, merged to main, and deployed** — `ea721c0` (cooldown exemptions, guard cookie, wall redirect, tour live count, whitespace trim, sign-in timer) + `8edf472` (public-page auto-refresh, `qualification_enabled` mirror, CTA copy "Add or Edit Questions"). The 5 blockers above are fix-complete and await founder retest on production (each case's run note carries its retest instruction). Prompt #3 double audit passed; automated suite at exact baseline (1188 = 1181 pass / 7 fail). **Batch 4 (Sec 4, TC-PUB-01..16) starting 2026-10-20** — cases 03 and 08 double as the live-page retest for `8edf472` (settings-added questions render on the public page; founder updates appear via auto-refresh).

> **Batch 4 first pass (2026-10-20 — founder): 12 pass / 1 fail / 3 delegated.** PASS: TC-PUB-01..12 — **both `8edf472` retests confirmed in production** (03 settings-added questions render on the live page incl. auto-refresh leg; 08 updates auto-refresh with form state preserved). FAIL: TC-PUB-14 (og card layout — "not arranged properly and does not look like previewed in the app", Prompt #8 queued). DELEGATED to agent for verification: TC-PUB-13 (milestone progress line states), TC-PUB-15 (formula-injection CSV cell), TC-PUB-16 (root og-image anon + metadataBase). Running total: **48 pass / 6 fail / 1 deferred**.

> **Batch 4 agent-verification (2026-10-20): 3 pass / 0 fail.** TC-PUB-13 — both progress-line states live-proven on production (state 2 via temporary seeded referral rows, verified, then deleted). TC-PUB-15 — formula answer stored **raw** via a real public signup; export half locked by code read (`escapeCsvCell` on every cell) + 41/41 targeted tests; live CSV download needs the founder's dashboard session (QA creds stale — one-line spot-check in the run note). TC-PUB-16 — anon root og-image 200 PNG + subdomain-host `og:image` both live. Running total: **51 pass / 6 fail / 1 deferred**. Remaining: TC-PUB-14 og card layout **fixed 2026-10-19** (center-composition on both `opengraph-image.tsx` files — uncommitted, retest after deploy), batch-2/3 blocker retests, Sec 5–12.
> **Final status (2026-10-20): 57 pass / 0 fail / 1 deferred — zero failures.** All 6 prior failures retested PASSED (founder): TC-ONB-14 + TC-DASH-02/05/10/11 (batch 2–3, fixes `ea721c0`) and TC-PUB-14 (batch 4, og-card center-composition — fix accepted; **still uncommitted** alongside the doc). Batch sections: Sec 1 = 12/0 + 1 deferred · Sec 2 = 14/0 · Sec 3 = 15/0 + 4 not-run (07/16/17/18) · Sec 4 = 16/0. Remaining work: 4 not-run dashboard cases + Sec 5–12 (45 cases) = 49 unexecuted, the 1 deferred (TC-AUTH-04), and `commit-push` when instructed.

> **Progress (2026-10-21) — founder UX follow-ups shipped, `f42ce06` (merged to main + deployed):** (1) waitlist page **visual rebalance** — how-it-works demoted to quiet metadata, milestone chips promoted to second focal point (TC-PUB-01/08 amended; preview parity applies via the shared renderer, TC-ONB-12); (2) subscriber detail gains a **Referral link** card after Referral code (copyable canonical `https://{subdomain}.prewaitlist.com?ref={code}`); (3) dashboard leaderboard rows are **fully clickable** → subscriber detail (resolves the TC-DASH-13 founder UX note). TC-DASH-08/13 now carry a **row-click leg added after their 2026-10-20 pass — retest pending**. Running total unchanged until that retest: **57 pass / 0 fail / 1 deferred**; 49 cases still unexecuted. The 2026-10-20 note's "still uncommitted" items (og-card fix + doc updates) also landed in that push. **Also folded in:** TC-DASH-15 step 4 covers milestone-reward + signup-counter editing in waitlist settings (shipped earlier in `086cc17`, previously onboarding-only).

> **Progress (2026-10-23) — warmth decay amended:** grace window **60 → 30 days** (single constant `DECAY.no_penalty_days` in `src/lib/warmth.ts`); −25 penalty and 90-day reset unchanged. Lifecycle is now Hot 0–29d → Warm 30–89d (45) → Cold 90d+ (0), so a silent 30-day-old signup reads 45 Warm instead of 70 Hot. TC-WARM-01/03 updated; Sec 6 still unexecuted. Basis: 30-day "Active" recency tiering (Klaviyo/ActiveCampaign 30/60/90 segments; Campaign Monitor Active 0–30d) + the 90-day conversion cliff; vendor-data caveat recorded in MEMORY.

> **Batch 6 executed (2026-10-23 — local batch cron + prod webhook probes + founder address-bar legs): 5 pass / 0 fail. BATCH 6 CLOSED.** Waitlist `belt` (Pro, 21 real → 26 with 5 fixtures). TC-WARM-01 scoring math + tiers PASS (baseline 70 Hot, cap 75→Warm, cold 0). TC-WARM-02 badge colors + panel PASS (founder screenshots; tokens + bars + API head-counts match). TC-WARM-03 decay boundaries PASS (day29 Hot / day30 Warm / day90 Cold / 60d-silent-click-heavy capped Warm; clock-reset leg: new click flipped warm30→hot). TC-WARM-04 opens ignored + cron + webhook PASS (opened event on warm90 left it cold; `vercel.json` cron `0 5 * * *`; prod webhook 401/401/200 + idempotent replay, local+prod secrets proven identical — PowerShell-signed probes 401'd on body encoding, fixed by signing+sending with the same `standardwebhooks` library the server uses). TC-WARM-05 segments PASS (`200 {"all":24,"hot_warm":23,"cold":1}` / no-wid 400 / unknown-wid 404 / free-tier 403 before lookup; founder ran legs via address bar — Chrome console blocked). Fixture end-state left as evidence: warmfresh-belt unsubscribed, warm29-belt hard-bounced. Running total: **62 pass / 0 fail / 1 deferred**. Remaining: batch 5 (§5 Leaderboard) run-notes unrecorded, 4 not-run dashboard cases (07/16/17/18), Sec 7–12. Next: batch 7 (Sec 7 Email & broadcast).

> **Batch 7 executed (2026-10-26 — production): 7 pass / 0 fail. BATCH 7 CLOSED.** All 7 cases passed, confirmed, and fixed. TC-EMAIL-01: Pro logo inversion defect found, fixed, and accepted on fresh emails (`+qafree2` / `+qaempro2`). TC-EMAIL-02: stream separation confirmed (`notifications@` vs `updates@mail.`). TC-EMAIL-03: full unsubscribe → suppression → resubscribe → re-delivery loop verified in DB and live sends. TC-EMAIL-04: complaint bounce classification bug fixed and locked with test regression. TC-EMAIL-05: configured physical address + fallback both verified. TC-EMAIL-06: custom HMAC unsubscribe link + `List-Unsubscribe` / `List-Unsubscribe-Post` headers confirmed by founder. TC-EMAIL-07: queue replay verified. Running total: **69 pass / 0 fail / 1 deferred**. Remaining: batch 5 (§5 Leaderboard) run-notes unrecorded, 4 not-run dashboard cases (07/16/17/18), Sec 8–12 (37 cases). Next: batch 8 (Sec 8 Billing & upgrade).

> **Batch 8 executed (2026-10-27 — local + production sandbox): 6 pass / 0 fail. BATCH 8 CLOSED.** All 6 cases passed and confirmed. TC-BILL-01: sandbox checkout + webhook tier flip to pro verified with immediate UI refresh and polling/broadcast channel unlock. TC-BILL-02: already-subscribed guard returns 400 and renders inline in upgrade modal. TC-BILL-03: modal cooldown (24h) and explicit-trigger exemptions verified. TC-BILL-04: free waitlist creation limit (402), scheduled cancellation period-end handling, surplus waitlist archiving, and stale transaction protection confirmed. TC-BILL-05: 3-step sender domain wizard with DNS records and Resend verification verified. TC-BILL-06: Paddle sandbox decline and 3DS challenge handling confirmed. Running total: **75 pass / 0 fail / 1 deferred**. Remaining: batch 5 (§5 Leaderboard) run-notes unrecorded, 4 not-run dashboard cases (07/16/17/18), Sec 9–12 (31 cases). Next: batch 9 (Sec 9 Feedback & tooling).

> **Batch 9 executed (2026-10-27 — automated + under-the-hood verification): 5 pass / 0 fail. BATCH 9 CLOSED.** All 5 cases passed and verified. TC-TOOL-01: PostHog event flow and property safety verified (no subscriber PII, non-blocking post-paint SDK load, offline event buffering). TC-TOOL-02: Surveys 1 and 2 live targeting conditions verified with modal/tour suppression flag (D7). TC-TOOL-03: UTM proxy cookie capture and post-confirmation upsert into founder_profiles verified across 25 targeted tests. TC-TOOL-04: tour, feedback FAB, and contact modal verified (covers TC-DASH-05/06). TC-TOOL-05: ?ref= precedence over ?src= acquisition verified in proxy middleware and locked by regression test. Running total: **80 pass / 0 fail / 1 deferred**. Remaining: batch 5 (§5 Leaderboard) run-notes unrecorded, 4 not-run dashboard cases (07/16/17/18), Sec 10–12 (26 cases). Next: batch 10 (Sec 10 Edge cases & guards).

## AC5 gate — founder fix/defer (CLOSED 2026-10-12)

Founder ruling: **fix all 8 in 21.6**. Pre-flagged TC-VAL cases already assert correct behavior — 21.6 fixes make them pass as written.

| ID  | Finding                   | Decision | Target |
| --- | ------------------------- | -------- | ------ |
| W1  | Slug format gap           | fix      | 21.6   |
| W2  | Reserved-slug message     | fix      | 21.6   |
| W3  | Segment typo sends-to-all | fix      | 21.6   |
| W4  | Open display-name PATCH   | fix      | 21.6   |
| W5  | Signin/forgot stale check | fix      | 21.6   |
| W6  | Unsubscribe GET mutates   | fix      | 21.6   |
| W7  | Raw error echo (9 lines)  | fix      | 21.6   |
| W8  | Founder-text passthrough  | fix      | 21.6   |

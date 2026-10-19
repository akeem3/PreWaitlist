# Manual Test Cases — Pre-Launch QA Suite

**Story:** 21.5 · **Epic:** 21 · **Status:** draft — AC5 founder gate OPEN (W1–W8 fix/defer pending; pre-flagged cases assert correct behavior)
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

### TC-ONB-13: Upgrade modal from onboarding (Pro-gated step)

**Preconditions:** Free founder at 4a cap or Step 5 Pro field.
**Steps:** 1. Trigger upgrade (cap click / locked field). 2. Complete sandbox checkout. 3. Continue in place.
**Expected:** `usePaddleUpgrade` opens checkout, tier flips, flow resumes without losing state (source: seamless upgrade 2026-09-22). `[PROD]` for real checkout; sandbox on prod.
**Result:** [x] Pass [ ] Fail

### TC-ONB-14: Resume mid-flow + fresh-founder redirect

**Preconditions:** (a) Phase A draft in localStorage, signed out. (b) Fresh founder, no draft, at `/onboarding/4`.
**Steps:** 1. Return to `/onboarding/1` → note landing step. 2. Load (b) → note landing.
**Expected:** (a) resumes at correct step by data completeness; (b) 200 `[]` treated as empty → `/onboarding/1`, no error UI (source: FlushGate; revenue-phase-4 F1).
**Result:** [ ] Pass [x] Fail

> **Run note (2026-10-19 — local): FAIL (both legs).**
> **(a) Signed-in free founder mid-flow → `/onboarding/1` → `/dashboard`.** After the Step-3 signup wall, FlushGate creates the waitlist; `src/components/auth/onboarding-guard.tsx:32-40` then redirects any free founder with ≥1 waitlist on every onboarding route (intent: stop a 2nd-waitlist bypass of the 402 gate at `src/app/api/waitlist/route.ts:208`). Consequence: legitimate mid-flow resume is blocked — a founder who leaves or reloads cannot return to Steps 4/4a/5.
> **(b) Fresh founder, no draft, `/onboarding/4` → `/onboarding/signup` wall, not `/onboarding/1`.** The Phase-B guard in `src/lib/supabase/middleware.ts` sends unauthenticated Phase-B paths to the wall; FlushGate — which owns the `200 []` → `/onboarding/1` behavior (revenue-phase-4 F1) — only renders for authenticated users, so the spec'd redirect cannot fire. The wall performs no draft check and falls back to fabricated defaults (`Your Product`, `your-page.prewaitlist.com`, `Template: minimal`) at `src/app/onboarding/signup/page.tsx:118-128`.
> **Open question for 21.6:** the signed-in fresh-founder variant of (b) was not separately exercised; re-verify both auth states when fixing.

---

## 3. Founder dashboard <a id="dashboard"></a>

### TC-DASH-01: Overview populated vs empty

**Preconditions:** Pro founder, populated waitlist; then `qa-empty` waitlist.
**Steps:** 1. Open `/dashboard`. 2. Switch to empty waitlist.
**Expected:** Populated: stat cards + chart + warmth + qualification + top referrers. Empty: welcome + guidance + ghost cards, no checklist (source: story-12.1.1/12.1.2; manifest `20-dashboard-home-pro-desktop.png`, `21-dashboard-empty-desktop.png`).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-02: Sidebar locks [FREE] vs unlock [PRO]

**Preconditions:** Free founder.
**Steps:** 1. Inspect sidebar nav. 2. Click Warmth/Broadcast. 3. Flip Pro, revisit.
**Expected:** Free: Warmth + Broadcast locked with upgrade CTA; Pro: all unlocked (source: story-12.1.0/13.2; manifest `13-dashboard-home-free-desktop.png`).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-03: Waitlist switcher precedence

**Preconditions:** ≥2 waitlists.
**Steps:** 1. Note newest vs stored preference. 2. Open plain `/dashboard`. 3. Open `?wid=<other>`. 4. Open `?wid=<bogus>`.
**Expected:** Plain renders preference (cookie/localStorage), not newest; valid `?wid` wins + rewrites preference; bogus falls through (source: switcher fix 2026-10-08).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-04: Tier refresh after upgrade

**Preconditions:** Free founder on dashboard.
**Steps:** 1. Upgrade (sandbox), keep tab open.
**Expected:** Sidebar unlocks without full reload (poll + `router.refresh()`); billing page concurs (source: tier-refresh 2026-09-23). `[PROD]`
**Result:** [ ] Pass [ ] Fail

### TC-DASH-05: First-subscriber tour + replay

**Preconditions:** Founder with ≥1 subscriber, fresh localStorage flag.
**Steps:** 1. Open `/dashboard`. 2. Skip mid-tour. 3. Replay via header button. 4. Open with `?upgrade=cap`.
**Expected:** 6 steps desktop (5 <lg, no sidebar step); Skip writes flag; replay restarts; tour defers while upgrade modal open (source: story-20.2 + audit F1).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-06: Feedback + contact surfaces

**Preconditions:** Env vars set (Tally URL, contact URLs).
**Steps:** 1. Click FAB → Tally popup. 2. Open contact pill → Instagram + Email rows. 3. Unset vars (local) → surfaces hidden.
**Expected:** Tally lazy-loads on first click; modal rows open ig.me + mailto; each surface hides independently without its var (source: stories 20.3/20.6).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-07: Quota banner + auto-refresh

**Preconditions:** Dashboard open.
**Steps:** 1. Trigger quota-hit state (or inspect banner logic). 2. Add subscriber in another tab, wait 60s / refocus.
**Expected:** Banner renders on quotaHit only; data refreshes on focus + 60s interval (source: quota banner; story-12.2.12).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-08: Leaderboard page + CSV [PRO]

**Preconditions:** Pro, populated waitlist.
**Steps:** 1. Open dashboard leaderboard, sort Referrals/Position, paginate. 2. Export CSV, open in spreadsheet.
**Expected:** Boost-first sort, PAGE_SIZE=10, `Showing X–Y of Z`; CSV headers incl. Quality % after Warmth, RFC4180-quoted, formula-prefixed cells (source: stories 16.4/16.5/9.3/14.4/19.2; manifest `14-dashboard-leaderboard-desktop.png`).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-09: Qualification page

**Preconditions:** Questions + answers exist.
**Steps:** 1. Open dashboard qualification.
**Expected:** Per-question cards with type chips, ordinal badges, answer distribution; respondent counts (source: story-14.3).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-10: Warmth page gate [FREE] vs [PRO]

**Preconditions:** Free founder.
**Steps:** 1. Open dashboard warmth. 2. Flip Pro, revisit.
**Expected:** Free: distribution + upgrade nudge; Pro: bars + per-subscriber table with Hot/Warm/Cold badges (green/blue scheme) (source: stories 12.3.3/15.4; manifest `15-dashboard-warmth-free-desktop.png`).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-11: Updates compose + honest failure

**Preconditions:** Pro founder.
**Steps:** 1. Publish 9-char body. 2. Publish valid body. 3. As Free, open page / visit direct URL.
**Expected:** 9-char → `Body must be at least 10 characters`; valid publishes (201, `sent_at` iff mailed); send failure shows `Update saved, but emails could not be sent.`; Free direct URL gets upgrade path (source: stories 12.1.4/16.0/16.1/17.4).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-12: Broadcast compose + segments [PRO]

**Preconditions:** Pro, subscribers across tiers.
**Steps:** 1. Check segment counts (All/Hot+Warm/Cold). 2. Send to Cold. 3. Submit 201-char subject / empty body.
**Expected:** Eligible counts (unsub+bounce excluded); caps enforced (`Subject must be ≤ 200 characters and body ≤ 10000 characters`); `waitlist_id` included (B1 lock); honest status (source: stories 17.0–17.2).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-13: Subscriber detail page

**Preconditions:** Subscriber with referrals + milestones + events.
**Steps:** 1. Open `/dashboard/subscribers/<id>` from table row.
**Expected:** Position/email grid, referral code, referred list, qual answers, milestones-earned card, email event log (source: stories 9.4/11.6/12.2.13).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-14: Archive / unarchive + banner

**Preconditions:** Test waitlist.
**Steps:** 1. Archive (confirm dialog). 2. Visit its public URL. 3. Unarchive from banner.
**Expected:** Confirm dialog; public URL → `/gone`; banner offers unarchive (source: story-12.2.1).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-15: Settings hub + waitlist settings

**Preconditions:** Signed in.
**Steps:** 1. Walk hub → waitlist list → waitlist detail → profile. 2. Edit 6 waitlist fields, logo upload, phone mode. 3. Edit qualification questions (ids preserved).
**Expected:** Three-level hierarchy; saves persist; logo = data URL; phone Off/Optional/Required; question edits keep ids (source: stories 12.2.2/12.2.3/14.2/phone plan).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-16: Billing page + cancel

**Preconditions:** Pro (sandbox) founder.
**Steps:** 1. Open billing, check status/invoices. 2. Cancel via portal.
**Expected:** Tier from context; status + invoices render; portal cancel flows; downgrade reconciles (source: story-13.3; reconcile cron). `[PROD]`
**Result:** [ ] Pass [ ] Fail

### TC-DASH-17: Chart range + stat deltas

**Preconditions:** Populated waitlist, signups across >30 days.
**Steps:** 1. Toggle chart 30d / All Time. 2. Read stat-card deltas.
**Expected:** Bars re-aggregate per range; deltas show comparison tone; empty metrics show em-dash (source: stories 9.6/12.1.2).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-18: Profile danger zone + data export

**Preconditions:** Test founder account.
**Steps:** 1. GET `/api/profile/export` → inspect. 2. Delete account from profile (confirm), verify session + data gone.
**Expected:** Export returns profile payload (graceful degradation); delete cancels via Paddle then removes user (source: inventory §2 `profile` row; D4).
**Result:** [ ] Pass [ ] Fail

### TC-DASH-19: Second waitlist create (free 402 / pro ok)

**Preconditions:** Free founder with 1 active waitlist.
**Steps:** 1. Create from header/switcher or settings list. 2. Flip Pro, create again.
**Expected:** Free → 402 upgrade prompt (no deadlock); Pro → created, `?wid=<new>` lands on it (source: story-13.4 tier limit; 19.6 flow GREEN).
**Result:** [ ] Pass [ ] Fail

---

## 4. Public waitlist & thank-you <a id="public"></a>

### TC-PUB-01: Live page section order + brand

**Preconditions:** `quality.lvh.me:3000`.
**Steps:** 1. Load page, scroll top→bottom.
**Expected:** Brand top-left → headline (5xl/6xl extrabold) → subheadline → counter → form → milestones → how-it-works cards → updates below fold (source: stories 18.0/18.6; manifest `02-waitlist-populated-desktop.png`).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-02: Form field order + trust + consent

**Preconditions:** Public page.
**Steps:** 1. Inspect form bottom: button, consent sentence, trust line. 2. Click Terms/Privacy in consent line.
**Expected:** Order button → consent → trust; trust verbatim `No spam. Unsubscribe anytime.`; links land `/legal/*` (source: story-18.7 round-3; story-18.1/W3).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-03: Qual question rendering (both types)

**Preconditions:** Waitlist with free-text (optional) + MC questions.
**Steps:** 1. Inspect free-text field. 2. Open MC dropdown.
**Expected:** Question text inside field, amber `(optional)` right; MC label above + collapsed select showing `Select an option`, brand border when answered (source: story-18.7 + 2026-10-03 MC directive).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-04: Phone modes on form

**Preconditions:** Waitlists with phone off / optional / required.
**Steps:** 1. Load each variant. 2. Submit required-mode without phone; with `+15551234567`; with `abc`.
**Expected:** Off hides field; required-empty → `Phone number is required`; garbage → `Please enter a valid phone number`; valid E.164 stored (source: phone plan).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-05: Successful signup → position + email [PROD for email]

**Preconditions:** Public page, fresh email.
**Steps:** 1. Submit valid email (wait ≥2s on page first).
**Expected:** Position shown; confirmation email `You're #N in line for {product}` with tier-correct footer (Free: Powered-by; Pro: address-only) (source: stories 7.2/12.0/19.1).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-06: Duplicate + bot guards

**Preconditions:** Public page.
**Steps:** 1. Re-submit same email → note. 2. Submit with `website` filled / instantly (<2s).
**Expected:** Duplicate → 409 `already on the waitlist` + position; bot/fast submits rejected generically (source: stories 7.4 + phase-6).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-07: Counter visibility threshold

**Preconditions:** Waitlists with counter on +9 subs / +10 subs.
**Steps:** 1. Load both pages.
**Expected:** Hidden below 10, visible at ≥10 when enabled (source: issue #16).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-08: Milestones + updates card on page

**Preconditions:** Milestones + ≥1 founder update.
**Steps:** 1. Check milestone chips vs referral state. 2. Check updates card content/position.
**Expected:** Locked/unlocked chip states; latest-update card only, below fold, centered restyle (source: stories 4.3/7.6/7.7 + 2026-10-03 restyle).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-09: Powered-by gating [FREE] vs [PRO]

**Preconditions:** Free + Pro waitlists.
**Steps:** 1. Load both public pages + thank-you + leaderboard.
**Expected:** Free shows footer; Pro shows none anywhere (source: story-12.2.11).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-10: Archived → gone

**Preconditions:** Archived waitlist.
**Steps:** 1. Load public URL, thank-you URL, leaderboard URL.
**Expected:** All → `/{subdomain}/gone` notice (source: story-12.2.1; manifest `04-gone-archived-desktop.png`).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-11: Thank-you direct variant

**Preconditions:** Fresh signup (no ref).
**Steps:** 1. Land on thank-you, note position/link/buttons.
**Expected:** Position + referral link (`/{sub} ?ref={8-char}`) + equal-weight share buttons; display-name input saves (≤100) (source: stories 8.0/8.1/12.2.13; manifest `12-thank-you-desktop.png`).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-12: Thank-you referred variant

**Preconditions:** Signup via `?ref=<valid code>`.
**Steps:** 1. Complete signup with ref. 2. Re-submit edge: ref of another waitlist; self-ref.
**Expected:** `Referred by {Name}` pill; referrer credited; cross-waitlist → `Invalid referral code` + uncredited retry; self-ref silently uncredited (source: stories 8.2/8.3; AC wording superseded C15).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-13: Milestone progress line states

**Preconditions:** Subscriber below / above all tiers.
**Steps:** 1. View thank-you at low count. 2. At count past top tier.
**Expected:** `N of M` next-tier line while tiers remain; hidden when all passed (no all-earned copy) (source: hardening F2).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-14: Social metadata + og cards [PROD]

**Preconditions:** Prod subdomain pages.
**Steps:** 1. View source: `og:title`, `twitter:title`, image URLs. 2. Hit image URLs directly. 3. Paste into X composer.
**Expected:** Titles carry `— Join the waitlist` suffix (og/twitter only); images 200 PNG; Pro card has no Powered-by; Free card has it (source: Phase C + og redesign 2026-10-04).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-15: Formula-injection answer → safe CSV cell

**Preconditions:** Qual free-text question; Pro founder.
**Steps:** 1. Submit qual answer `=CMD|'/C calc'!A0`. 2. Export CSV, open raw.
**Expected:** Cell stored raw but exported as `'=CMD|…` (formula-lead defense); pure numbers unprefixed (source: story-19.2 AC8).
**Result:** [ ] Pass [ ] Fail

### TC-PUB-16: Root og-image anon + metadataBase [PROD]

**Preconditions:** Prod apex + subdomain.
**Steps:** 1. GET `/opengraph-image` with no session → 200 PNG. 2. Check subdomain page `og:image` host.
**Expected:** Anon 200 (allowlisted); subdomain image URL on subdomain host (segment metadataBase) (source: Phase C; twitter-card fix 2026-10-04).
**Result:** [ ] Pass [ ] Fail

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

### TC-LEAD-05: Top-referrers visibility by tier

**Preconditions:** Referrals exist; free then pro.
**Steps:** 1. View overview as Free. 2. Flip Pro.
**Expected:** Free hides TopReferrers (warmth numbers visible, no lock icon); Pro shows top-5 by quality score (source: founder decision 2026-09-22).
**Result:** [ ] Pass [ ] Fail

---

## 6. Warmth <a id="warmth"></a>

### TC-WARM-01: Scoring math + tiers

**Preconditions:** Subscribers with known events (clicks/referrals/qual).
**Steps:** 1. Compare dashboard badges vs `70 + 5c + 15r + 8q − decay`.
**Expected:** Baseline 70 = Hot at signup; ≥70 Hot, ≥40 Warm, else Cold; never null (source: restructure 2026-09-25).
**Result:** [ ] Pass [ ] Fail

### TC-WARM-02: Badge colors + panel

**Preconditions:** Mixed tiers.
**Steps:** 1. Check subscriber warmth displays + overview panel bars.
**Expected:** Hot green `#0f7a5e`, Cold blue (never red); 3 bars with counts (source: Epic 11 + 2026-09-27 flip + 15.4 redesign).
**Result:** [ ] Pass [ ] Fail

### TC-WARM-03: Decay boundary

**Preconditions:** Aged test subscribers (60/90-day events).
**Steps:** 1. Check scores at day 59 vs 60 vs 90+.
**Expected:** Day 59 unpenalized; 60–89 −25; 90+ → 0; clock = latest meaningful action (source: Epic 15, `>= 60` boundary).
**Result:** [ ] Pass [ ] Fail

### TC-WARM-04: Opens ignored; cron + webhook [PROD]

**Preconditions:** Prod, Resend events flowing.
**Steps:** 1. Confirm opens don't move scores. 2. Check cron ran 05:00 UTC (Vercel logs). 3. Check webhook 401/401/200 handling.
**Expected:** Clicks/referrals/qual only; daily batch; idempotent webhook (source: stories 15.0–15.2; 15.6).
**Result:** [ ] Pass [ ] Fail

### TC-WARM-05: Segments eligibility [PRO]

**Preconditions:** Pro, mixed tiers + unsub/bounced.
**Steps:** 1. GET segments with/without `?wid=`; multi-waitlist without wid.
**Expected:** Eligible counts (unsub+bounce excluded); tier gate before lookup; `wid` required when multi (source: stories 15.3/17.1).
**Result:** [ ] Pass [ ] Fail

---

## 7. Email & broadcast <a id="email"></a>

### TC-EMAIL-01: Confirmation footer per tier [PROD]

**Preconditions:** Free + Pro waitlists.
**Steps:** 1. Sign up to each.
**Expected:** Free footer = Powered-by lockup + address; Pro = address only; custom sender honored for Pro (source: stories 12.5/12.6/19.1).
**Result:** [ ] Pass [ ] Fail

### TC-EMAIL-02: Stream separation [PROD]

**Preconditions:** Sent transactional + broadcast.
**Steps:** 1. Inspect From headers.
**Expected:** Transactional via `notifications@prewaitlist.com`; bulk via `updates@mail.prewaitlist.com` (verified domain) (source: story-12.6 amended 2026-10-10).
**Result:** [ ] Pass [ ] Fail

### TC-EMAIL-03: Unsubscribe → resubscribe loop [PROD]

**Preconditions:** Received email with footer.
**Steps:** 1. Click unsubscribe → confirm. 2. Verify no further bulk mail. 3. Resubscribe via token link.
**Expected:** One-click unsub (no login); suppression enforced pre-send; resubscribe restores (source: stories 12.2.7/12.2.8).
**Result:** [ ] Pass [ ] Fail

### TC-EMAIL-04: Bounce suppression [PROD]

**Preconditions:** Hard-bounced address on list.
**Steps:** 1. Attempt sends to it.
**Expected:** Suppressed pre-send; `bounced_emails` row; complaint = hard (source: stories 12.2.8/15.2).
**Result:** [ ] Pass [ ] Fail

### TC-EMAIL-05: Physical address footer [PROD]

**Preconditions:** Waitlist with `business_address` set + one without.
**Steps:** 1. Inspect footers of both.
**Expected:** Configured address rendered; fallback present when unset (source: story-12.2.9).
**Result:** [ ] Pass [ ] Fail

### TC-EMAIL-06: Broadcast CAN-SPAM + custom HMAC [PROD]

**Preconditions:** Pro broadcast sent.
**Steps:** 1. Inspect footer + headers.
**Expected:** Address + working custom unsubscribe URL; `List-Unsubscribe(-Post)` headers; never Resend merge tag (source: stories 12.3/17.x; C10).
**Result:** [ ] Pass [ ] Fail

### TC-EMAIL-07: Quota warning + retry replay [PROD]

**Preconditions:** Resend quota exhausted (staging key or simulated).
**Steps:** 1. Trigger a send past quota. 2. Restore quota, let `cron/email-retry` drain.
**Expected:** Quota-warning email to founder; confirmation/moved-up replay with original idempotency keys; others dead-letter (source: inventory §4 templates 7–8; retry-queue rules).
**Result:** [ ] Pass [ ] Fail

---

## 8. Billing & upgrade <a id="billing"></a>

### TC-BILL-01: Checkout + webhook tier flip [PROD, sandbox]

**Preconditions:** Free founder.
**Steps:** 1. Open checkout, pay with `4000 0566 5566 5556`. 2. Watch tier + sidebar.
**Expected:** Webhook flips tier to pro (incl. `transaction.completed` path); UI refreshes without reload (source: stories 13.0–13.2; 2026-09-22 fixes).
**Result:** [ ] Pass [ ] Fail

### TC-BILL-02: Already-subscribed guard

**Preconditions:** Pro founder.
**Steps:** 1. POST checkout again.
**Expected:** 400 `Already subscribed` surfaced in modal (not silent) (source: checkout route + modal fix).
**Result:** [ ] Pass [ ] Fail

### TC-BILL-03: Upgrade modal triggers + cooldown

**Preconditions:** Free founder.
**Steps:** 1. Fire 4+ triggers (sidebar lock, cap buttons, `?upgrade=cap`, settings button). 2. Dismiss, re-fire same trigger same day. 3. Use `?plan=pro` deep link after dismiss.
**Expected:** All open with `Unlock all Pro features` fallback copy family; 1-day cooldown for passive keys only — explicit-intent triggers (`subscriber_cap` buttons, `billing`, `pro-cta-onboarding`, `pro-cta-billing`) always open; `?upgrade=cap` uses its own passive key `cap-email` and still cools down (source: stories 13.1 + 2026-09-22/29/10-16 decisions).
**Result:** [ ] Pass [ ] Fail

### TC-BILL-04: Free creation limit + cancel-guard [PROD]

**Preconditions:** Free founder with 1 active waitlist.
**Steps:** 1. Create 2nd → note. 2. Cancel sub in portal (sandbox), then land a same-sub `transaction.completed`.
**Expected:** 2nd → 402 upgrade prompt; stale charge-after-cancel ignored (no re-upgrade); reconcile cron heals drift (source: stories 13.4; Phase A guard + cron).
**Result:** [ ] Pass [ ] Fail

### TC-BILL-05: Sender domain wizard [PRO]

**Preconditions:** Pro founder.
**Steps:** 1. Register domain, read DNS records, verify.
**Expected:** 3-step wizard; Resend-backed verify; status via separate fetch (source: story-13.5).
**Result:** [ ] Pass [ ] Fail

### TC-BILL-06: Decline + 3DS sandbox cards

**Preconditions:** Free founder, Paddle sandbox checkout.
**Steps:** 1. Pay with `4000 0000 0000 0002` (decline). 2. Pay with `4000 0276 0003 1981` (3DS), complete challenge.
**Expected:** Decline shows helpful error (no dead end, no tier change); 3DS completes and flips tier (source: sandbox cards 2026-09-27; story-13.0). `[PROD]`
**Result:** [ ] Pass [ ] Fail

---

## 9. Feedback & tooling <a id="tooling"></a>

### TC-TOOL-01: PostHog event flow [PROD]

**Preconditions:** PostHog key in Vercel; prod session.
**Steps:** 1. Sign up (email) → onboard → get subscriber → upgrade → cancel-intent.
**Expected:** `account_created`, `subscriber_received`, `subscription_started`, funnel events fire; surveys suppressed mid-walkthrough only for triggers (source: story-20.1 D1–D7).
**Result:** [ ] Pass [ ] Fail

### TC-TOOL-02: Surveys live

**Preconditions:** PostHog surveys configured per spec.
**Steps:** 1. Hit first-subscriber dashboard (Survey 1). 2. Open billing cancel (Survey 2).
**Expected:** Each shows once (Just-once), bottom-left position (clear of FAB) (source: story-20.1 AC5; audit reposition note).
**Result:** [ ] Pass [ ] Fail

### TC-TOOL-03: UTM → profile attribution

**Preconditions:** Fresh browser.
**Steps:** 1. Land `/ ?utm_source=x&utm_medium=y&utm_campaign=z`, sign up same window, create waitlist.
**Expected:** Profile row carries utm_* (upsert, not silent no-op) (source: story-20.4 + audit F3; playbook §3).
**Result:** [ ] Pass [ ] Fail

### TC-TOOL-04: Tour + feedback + contact (covered in TC-DASH-05/06 — execute there, record here)

**Expected:** See TC-DASH-05, TC-DASH-06.
**Result:** [ ] Pass [ ] Fail

### TC-TOOL-05: `?ref=` wins over `?src=` acquisition

**Preconditions:** Fresh browser, homepage.
**Steps:** 1. Open `/?ref=abc12345&src=powered-by&utm_source=t&utm_medium=m&utm_campaign=c`. 2. Sign up same window, create waitlist, check profile row.
**Expected:** Stored `ref_param=abc12345`; hero shows powered-by variant; utm_* persisted via upsert (source: matrix §2 acquisition row; story-20.4).
**Result:** [ ] Pass [ ] Fail

---

## 10. Edge cases & guards <a id="edge"></a>

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

> Pre-flagged cases assert CORRECT behavior. All currently fail per 21.4 evidence; each needs a founder fix/defer call (AC5 gate) before 21.6/21.7.

### TC-VAL-01: Slug format rejected [pre-flagged W1]

**Preconditions:** `/api/waitlist/check-slug`.
**Steps:** 1. GET `?slug=ABC DEF!!`. 2. POST waitlist with un-normalized subdomain.
**Expected:** Format-invalid slugs rejected (400), not `available:true` / raw insert (source: 21.4 W1).
**Result:** [ ] Pass [ ] Fail

### TC-VAL-02: Reserved slug message [pre-flagged W2]

**Preconditions:** Step 1 slug field.
**Steps:** 1. Type `admin`.
**Expected:** Reserved-specific message (not misleading `Already taken`) (source: 21.4 W2).
**Result:** [ ] Pass [ ] Fail

### TC-VAL-03: Broadcast segment validated [pre-flagged W3]

**Preconditions:** Pro, broadcast API.
**Steps:** 1. POST with `segment: "hot "` (typo) / missing.
**Expected:** 400 on unknown segment — never silent send-to-all (source: 21.4 W3).
**Result:** [ ] Pass [ ] Fail

### TC-VAL-04: Subscriber PATCH authorized [pre-flagged W4]

**Preconditions:** Thank-you link pair.
**Steps:** 1. PATCH display_name from a different session/IP without the pair. 2. Burst 20 PATCHes.
**Expected:** Pair required (already) + rate limit present (source: 21.4 W4).
**Result:** [ ] Pass [ ] Fail

### TC-VAL-05: Signin/forgot first-submit validation [pre-flagged W5]

**Preconditions:** `/signin`, `/forgot-password`.
**Steps:** 1. Type invalid email, submit without blurring.
**Expected:** Client blocks before Supabase call (signup pattern) (source: 21.4 W5).
**Result:** [ ] Pass [ ] Fail

### TC-VAL-06: Unsubscribe GET side-effect free [pre-flagged W6]

**Preconditions:** Valid unsubscribe link.
**Steps:** 1. GET the page via prefetcher-style request (no click).
**Expected:** View does not unsubscribe; only explicit confirm POST mutates (source: 21.4 W6).
**Result:** [ ] Pass [ ] Fail

### TC-VAL-07: No raw error echo [pre-flagged W7]

**Preconditions:** Paddle sandbox event with failing DB write; domains verify failure.
**Expected:** Generic 500/400 strings; driver/Resend messages log-only (source: 21.4 W7 — 9 lines, 3 files).
**Result:** [ ] Pass [ ] Fail

### TC-VAL-08: Founder-text server caps [pre-flagged W8]

**Preconditions:** Authed waitlist PATCH.
**Steps:** 1. PATCH garbage `template`, 5k-char `cta_text`, non-hex `brand_color`, 6 questions as Free.
**Expected:** Whitelist/length/cap 400s (currently raw passthrough / degrade-to-minimal) (source: 21.4 W8).
**Result:** [ ] Pass [ ] Fail

---

## Coverage check (AC4, mechanical)

- **Inventory rows → cases:** pages 1–36 → TC-ONB/AUTH/DASH/PUB/LEAD/MOB rows above (all 36 covered: `auth-code-error` via TC-AUTH-05 failure path; signout via TC-AUTH-13; `loading` skeletons via TC-DASH-01; og-image via TC-EDGE-01 + TC-PUB-16; resume/redirect via TC-ONB-14). API 32 files → TC-EMAIL/BILL/EDGE/VAL rows (cron/webhook/billing as `[PROD]` + TC-EDGE-06 notes; export as Free direct-call in TC-EDGE-05; profile delete/export in TC-DASH-18; chart toggle in TC-DASH-17; second-waitlist create in TC-DASH-19). Proxy/guard rows → TC-EDGE-01/02. Email templates 1–8 → TC-EMAIL-01–07 + TC-PUB-05 + TC-DASH-11/12 + TC-LEAD-02–04. Components (6) → TC-DASH-04/05/06/07 + TC-BILL-03.
- **21.4 failures → cases:** W1–W8 → TC-VAL-01–08 (1:1).
- **20.x surfaces → cases:** 20.1 events → TC-TOOL-01/02; 20.2 tour → TC-DASH-05; 20.3/20.6 feedback → TC-DASH-06; 20.4 UTM + ref/src precedence → TC-TOOL-03/05; 20.5 prep → deliverable exists (no runtime case; PH submission itself out of scope per 21.8).
- **D1–D10 discrepancies →** TC-EDGE-05/06.
- **Count:** 107 cases (below the ~150–250 estimate — kept tight per "one case per meaningful behavior"; every AC4 leg above is 1:1 green, no padding).

## Results summary (filled in 21.7)

| Total | Passed | Failed | Deferred | Launch blockers |
| ----- | ------ | ------ | -------- | --------------- |
| 107   | 25     | 1      | 1        |                 |

> **Progress (2026-10-19):** batch 1 (Sec 1 Auth) **CLOSED — 12 pass / 0 fail / 1 deferred** (TC-AUTH-04 signup rate cooldown, deferred by founder: "document as later"). Fixes shipped: duplicate-detection (`signup-duplicate.test.tsx`) + billing button cooldown exemption (`fc88810`). Batch 2 (Sec 2 Onboarding) **executed — 13 pass / 1 fail** (TC-ONB-14 resume/fresh-redirect; root causes located, fixes queued for 21.6). 81 cases not yet executed → next: batch 3 (Sec 3 Dashboard, TC-DASH-01..19).

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

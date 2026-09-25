# Dashboard Plan — Warmth Card Redesign + Switcher Refresh + Warmth Model Restructure

**Status:** IMPLEMENTED — executed 2026-09-25 via Prompt #2 (`execute`) on branch `dev`; all gates green (see Implementation Status below). **Not committed** (D9 — founder runs `commit-push` later).
**Date:** 2026-09-25
**Method:** Prompt #8 `investigate` (`docs/PROMPTS.md`) — Phases 1–5 complete for all issues; 5 web research queries run. Executed with Prompt #2 (`execute`) after founder OK (R10).
**Scope:** (1) Warmth Distribution overview card redesign, (2) waitlist switcher refresh bug fix, (3) warmth-after-referral root cause + test guide, (4) **warmth model restructure — remove Unscored, everyone starts Hot, decays to Cold based on activity** (resolved 2026-09-25, full plan below).

---

## Implementation Status (2026-09-25)

Executed in D7 order: switcher (Fix A + B) → restructure + card redesign → tests → gates → doc sync (§4.8).

**Gates:**

- [x] `pnpm lint` — 0 errors / 5 warnings (exact baseline)
- [x] Targeted warmth tests — 79/79 passed (`warmth`, `warmth-batch`, `warmth-panel`, `dashboard-tier-gating`, `dashboard-warmth-page`, `warning-banner`, `cron-warmth`, `dashboard-segments`)
- [x] Full suite — 535 total, 528 pass / 7 fail = exact pre-existing baseline (`dashboard-archive` 4 + `dashboard-subscriber-table` 3; identical failures verified on clean HEAD via `git stash`)
- [x] `pnpm build` — exit 0 (must delete `.next` first — stale `.next/dev/types/validator.ts` referenced the deleted `/api/warmth/[subdomain]` route)
- [x] Doc sync §4.8 — PRD, product vision, design guide, sprint-3 specs, MEMORY, Epic 15/17/11/12.3 + story files (11.1, 11.2, 11.3, 11.5, 11.6, 12.3.3, 15.0, 15.1, 15.4, 15.5, 17.0, 17.1)

**Open manual gates (founder-run):**

- [ ] Run `docs/stories/sql-writeups/warmth-restructure-no-unscored.sql` in Supabase SQL Editor (R6 — safe to run any time: DEFAULT-first ordering)
- [ ] Epic 15.2: run `docs/stories/sql-writeups/epic15-story2-email-events-svix-unique.sql`
- [ ] Epic 15.1: verify Vercel cron `0 5 * * *` UTC is deployed + `CRON_SECRET` set in Vercel

**Pending:** manual verification walkthrough (switcher Fix A/B + redesigned card) → founder `commit-push` (D9).

---

## Section 0 — Decision record (founder, 2026-09-25)

All decisions below were answered by the founder in interactive Q&A. **No open copy gates remain.**

| ID    | Decision                                                                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1→R9 | Meta line = **`"{n} subscribers"`** (accent count, pluralized, only when `total > 0`). Old `"20 subscribers · 2 unscored"` is dead (Unscored removed).                          |
| D2    | Card redesign approved **as drafted**, adapted to 3 bars (title-link + overlay, status-token value colors, flex-distributed rows, `waitlistId` prop).                           |
| D3    | Switcher fix = **A + B** (hard-nav CTA + shell self-heal). Fix C not included.                                                                                                  |
| D4    | Superseded by D1/R10 — restructure replaces the status-quo pick.                                                                                                                |
| D5    | Warmth stays **batch-only** (daily cron). Docs/test-guide only. Research corroborates daily recalc as industry ideal (Bounceproof).                                             |
| D6    | Doc updates: **all 6 targets** (PRD, vision, design-guide, sprint-3-specs, MEMORY, this plan) **+ Epic 15/17/11/12.3 amendments** (governance — see §4.4).                      |
| D7    | Execution order: switcher → restructure (+ redesign) → docs.                                                                                                                    |
| D8    | Panel tests + manual switcher verification; **engine tests are mandatory** (AC-level behavior change).                                                                          |
| D9    | Work on `dev`, **stop before commit** — founder runs `commit-push` later.                                                                                                       |
| D10   | Proceed despite Epic 15's two open manual gates.                                                                                                                                |
| R1    | Baseline = **70** (everyone starts Hot).                                                                                                                                        |
| R2    | Decay (0–59d free / 60–89d −25 / 90d+ → 0) + thresholds (≥70 Hot / ≥40 Warm / else Cold) **kept as-is** — industry-standard bands confirmed (HubSpot/BetaCompression/Outsolvi). |
| R3    | Signal weights **keep 5 / 15 / 8** — benchmark-verified (see §4.2).                                                                                                             |
| R4    | Decay clock = **max(last click, latest referred signup, own signup)** — any meaningful action (research-flipped from clicks-only).                                              |
| R5    | New subscribers **insert `warmth_score = 'hot'`** at signup.                                                                                                                    |
| R6    | **SQL migration approved** (DEFAULT + backfill + NOT NULL) — new manual gate. Proper DB-level invariant, not a UI workaround.                                                   |
| R7    | `unscored` field **removed cleanly** from all APIs/types.                                                                                                                       |
| R8    | Orphan public `GET /api/warmth/[subdomain]` **deleted** (route + its test file).                                                                                                |
| R10   | Document plan first (this file); execute only after founder OK.                                                                                                                 |

---

## Section 1 — Warmth Distribution card redesign (overview)

### Problem

- Card content (~120px of bar rows) does not fill the equal-height grid stretch next to Qualification (~half the card empty).
- Pro variant has no link/action — never did (git history `git log -S "href="` on `warmth-panel.tsx` = zero hits). Only the KPI stat card links to `/dashboard/warmth`.
- Color communication weak: values all `text-muted-foreground`; only tiny fills carry color.

### Research (3 web queries, 2026-09-25)

| #   | Query                                                                                                   | Key finding                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | dashboard UI card design patterns distribution breakdown segment visualization best practices 2025      | Part-to-whole → labeled horizontal bars with exact **count + % on every segment**; labels adjacent, never tooltip-only; one color system — same entity = same color across every widget (DataCamp, Salt, Desisle)                                                         |
| 2   | full card clickable link accessibility UX pattern vs view all link card header                          | Never wrap card in `<a>`. **Title-as-link + `::after` overlay stretched `inset-0`** → one tab stop, one accessible name, whole card clickable; requires hover cue + visible focus ring; no duplicate real links (UC Berkeley DAP, GovtNZ, Inclusive Components, A11yPath) |
| 3   | semantic status colors dashboard segment distribution legend color palette best practices accessibility | Color always paired with text labels (SAP Fiori, WCAG 1.4.1); status colors keep fixed meaning everywhere; exact % + count shown (NHS Turas)                                                                                                                              |

**Approach:** title-link + `::after` overlay (Berkeley pattern); header "View all →" as `aria-hidden` visual reuse of the Qualification string; status-token colors on **values** (mirrors KPI stat card `client.tsx:453-467`); flex-distribute rows to fill stretched height. **Rendered against the post-restructure 3-bar model (§4).**

### Redesign (pro variant — post-restructure)

```
┌────────────────────────────────────────────────────┐
│ Warmth Distribution                      View all →│  title = <Link>, after:absolute after:inset-0
│ ▓ hover:bg-muted/30 · focus ring on card ▓▓▓▓▓▓▓▓▓│  "View all →" aria-hidden (reuse qual string)
│                                                    │
│ 20 subscribers                                      │  meta line (approved copy) — only when total > 0
│                                                    │
│ Hot       ▓▓▓▓▓▓▓▓▓░░░░░░   10 (50%)              │  value = text-status-hot
│ Warm      ▓▓▓░░░░░░░░░░░░    5 (25%)              │  value = text-status-warm
│ Cold      ▓░░░░░░░░░░░░░░    3 (15%)              │  value = text-status-cold
│                                                    │  rows: flex-1 justify-between → fills any height
└────────────────────────────────────────────────────┘
        ↳ whole card → /dashboard/warmth?wid=…
```

Free variant: identical bars/meta/colors; wrapper stays the `<button>` + upgrade badge (unchanged).

### Changes

| File                                             | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/dashboard/warmth-panel.tsx`          | 1. Props: `+ waitlistId?: string`<br>2. Remove `unscored` from `WarmthData` + delete both Unscored `WarmthBar`s (free `:109-114`, pro `:141-146`) — **3 bars**<br>3. `WarmthBar`: value color prop (`text-status-hot/warm/cold`); **row DOM order Hot/Warm/Cold unchanged** so `barFill()` helper keeps working<br>4. Pro: `Panel className="relative flex flex-col hover:bg-muted/30 transition-colors"`; title = `<Link href={/dashboard/warmth${waitlistId…}}>` with `after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:outline-2 focus-visible:after:outline-accent`; action = `<span aria-hidden>` visual "View all →"; children wrapped `flex flex-1 flex-col justify-between`; bars container `space-y-3` → `flex flex-1 flex-col justify-between`<br>5. Meta line (both tiers): **`{n} subscribers`**, accent count (pattern = Qualification `qualification-panel.tsx:231-237`), `subscriberLabel()` pluralizer; **rendered only when `total > 0`** (keeps em-dash tests exact) |
| `src/app/dashboard/client.tsx:528`               | Pass `waitlistId={waitlistId}` to `WarmthPanel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `src/__tests__/components/warmth-panel.test.tsx` | 3-bar assertions (was 4); remove Unscored `bg-muted` case; add: pro title-link href, `aria-hidden` action, meta `"{n} subscribers"` shown at `total > 0`, meta hidden + **3 em-dashes** at `total = 0`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

**Story AC amendments required** (was "stays within ACs" — no longer true after restructure): 11.3 AC1 "four horizontal bars" → three; 11.3 AC4 response shape (drop `unscored`); 15.4 AC1 Unscored fill clause → removed. Handled in §4.8 doc sync.

**Rejected alternative:** 100% stacked bar (research-valid) — spec §S1 and ACs describe labeled rows; bigger deviation for no functional gain.

### Verification

1. `pnpm lint`
2. Targeted: `pnpm vitest run src/__tests__/components/warmth-panel.test.tsx src/__tests__/components/dashboard-tier-gating.test.tsx`
3. Full suite — baseline **520 pass / 7 fail** (dashboard-archive 4, dashboard-subscriber-table 3)
4. `pnpm build`
5. Manual: pro card click → `/dashboard/warmth?wid=…`; free card opens upgrade modal; Tab shows card-level focus ring; `total=0` → exactly 3 em-dashes, no meta line.

---

## Section 2 — Waitlist switcher / product name not refreshing after onboarding

**Report:** On a pro account, after creating a new waitlist through onboarding and clicking **Go to my dashboard**, the sidebar waitlist switcher still shows the previous waitlist ("Quality") — product name section and dropdown don't reflect the new waitlist until a manual browser refresh. Founder thinks the waitlist wasn't created.

### Phase 1 — Deep investigation (files read + root cause + evidence chain)

| File                                                    | What was found                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/onboarding/success/page.tsx:129-151`           | CTA is `<Link href={form.waitlistId ? /dashboard?wid=ID : /dashboard}>` — **client-side navigation**                                                                                  |
| `src/components/auth/flush-gate.tsx:140-157`            | On success mount, GET returns array ascending; takes last element = **newest waitlist** → `form.waitlistId` = NEW → `?wid=NEW` present                                                |
| `src/app/api/waitlist/route.ts:489-633`                 | GET returns array with `waitlistId` field (:610), ordered `created_at` ascending (:506)                                                                                               |
| `src/app/dashboard/layout.tsx:28-32`                    | Server layout fetches full waitlists array → passed to `DashboardShell` — this is the **sidebar data source**                                                                         |
| `src/app/dashboard/shell.tsx:185-195`                   | Effect: `wid && waitlists.some(w => w.id === wid)` → set active; **if wid not in (stale) list → falls back to `getStoredId` (:72-78) or `getServerDefaultId` (:68-70)** → OLD id wins |
| `src/app/dashboard/shell.tsx:96-98`                     | `useState(() => getServerDefaultId(waitlists))` — server default = last of whatever array the (possibly cached) layout rendered                                                       |
| `components/dashboard/waitlist-switcher.tsx:38,107-108` | Renders `active.product_name` — the "Quality" label; list = same stale `waitlists` prop                                                                                               |
| `src/app/dashboard/page.tsx:28-42`                      | Page segment honours `?wid` (`.eq("id", wid)`) — only fetched if wid resolves                                                                                                         |
| `src/app/dashboard/client.tsx:196-217`                  | Existing self-heal exists but is **passive**: `visibilitychange` + 60s interval → `router.refresh()` — only fires on tab switch or after 60s, not on arrival                          |
| `next.config.ts`                                        | No `experimental.staleTimes` → framework defaults                                                                                                                                     |

**Root cause (one sentence):** The success CTA performs a client-side (soft) navigation, and Next.js serves the previously-cached dashboard **layout** payload from the client Router Cache / partial rendering — the pre-creation waitlists array — so `?wid=NEW` fails the `waitlists.some(...)` check and the switcher falls back to the stored/default (old) waitlist, until a hard refresh re-runs the layout server-side.

**Evidence chain:**
`sidebar shows "Quality" after creating new waitlist` → `success/page.tsx:129 Link (soft nav)` → `layout.tsx:28-32 waitlists query served from cached segment (stale, no NEW)` → `shell.tsx:186-189 wid check fails → :191-194 stored/default = OLD` → `waitlist-switcher.tsx:108 renders stale product_name` → **hard refresh bypasses client cache → layout re-fetches → NEW appears**.

### Phase 2 — Research (2 web queries, 2026-09-25)

| #   | Query                                                                                                                      | Key finding                                                                                                                                                                                                                                                                                                                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Next.js 16 router cache stale layout data after creating new record until hard refresh staleTimes default                  | Official `staleTimes` docs: **"shared layouts won't automatically be refetched on every navigation, only the page segment that changes"** (partial rendering — unaffected by staleTimes); `dynamic` default 0s since v15 (page segments only)                                                                                                                                    |
| 2   | Next.js Link navigation shows stale data after creating record hard refresh fixes it router.refresh after mutation pattern | Vercel Community #18761/#22800: identical symptom ("invisible until Ctrl+R/F5" despite revalidate/refresh); GitHub #49450: **"the only way to get fresh data is to navigate with `<a>` anchor or `window.location.href`"**; Discussion #91785: `router.refresh()` after mutation or server redirect bypass; Discussion #52012: plain `<a>` = standard hard-navigation workaround |

**Approach named:** bypass the client Router Cache on the onboarding → dashboard transition with a **full document navigation (plain `<a>`)** — cited from GitHub #49450 + Vercel Community #22800 — plus a defensive single-shot `router.refresh()` self-heal in the shell when `?wid` is missing from the list (pattern from Discussion #91785).

### Phase 3 — Impact analysis

| File                                         | Why affected                                                      |
| -------------------------------------------- | ----------------------------------------------------------------- |
| `src/app/onboarding/success/page.tsx`        | Fix A — `<Link>` → `<a>` on the dashboard CTA                     |
| `src/app/dashboard/shell.tsx`                | Fix B — one self-heal effect (guarded, runs once per unknown wid) |
| `components/dashboard/waitlist-switcher.tsx` | **Not changed** — consumes props only                             |
| `src/app/dashboard/layout.tsx`, `page.tsx`   | **Not changed** — already fetch fresh server-side                 |

**Existing tests:** no tests cover the success page (glob `*success*` = none). Shell is covered by `dashboard-tier-refresh.test.tsx` (10) and `dashboard-context.test.tsx` — Fix B must not fire spuriously in those (fires only when wid present AND absent from list). No design-token impact.

**Worst-case regression:** Fix B loops `router.refresh()` if a wid never resolves → prevented by ref guard (refresh once per wid). Fix A loses the SPA transition after onboarding → acceptable (full reload after onboarding is desirable; fresh localStorage/RSC state).

### Phase 4 — Fix plan (approved: A + B)

**Fix A (required) — hard navigation on success CTA**

`src/app/onboarding/success/page.tsx:129` — replace `<Link href={…}>` with a plain anchor (same classes/children):

```tsx
<a
  href={form.waitlistId ? `/dashboard?wid=${form.waitlistId}` : "/dashboard"}
  className="inline-flex h-12 w-full max-w-lg items-center justify-center gap-2 rounded-[var(--button-radius)] bg-accent text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
>
  Go to my dashboard …
</a>
```

Drop the `Link` import if unused elsewhere in the file.

**Fix B (defense-in-depth) — shell self-heal**

`src/app/dashboard/shell.tsx` — add alongside the existing wid effect (:185-196):

```tsx
const widRefreshRef = useRef<string | null>(null);
useEffect(() => {
  const wid = searchParams.get("wid");
  if (
    wid &&
    !waitlists.some((w) => w.id === wid) &&
    widRefreshRef.current !== wid
  ) {
    widRefreshRef.current = wid;
    router.refresh(); // re-runs layout server-side → fresh waitlists → wid resolves
  }
}, [searchParams, waitlists, router]);
```

Ref guard guarantees at most one refresh per unknown wid — no loop.

**Rollback:** each fix is independent and single-file — revert `success/page.tsx` (A), delete the effect (B).

**Verification (manual):**

1. `pnpm dev`
2. As a founder with ≥1 existing waitlist, switcher shows old name → click **Add New Waitlist** → complete onboarding → **Go to my dashboard**.
3. Expect (no refresh pressed): sidebar switcher shows **new** name immediately; dropdown lists both; URL = `/dashboard?wid=<new>`.
4. Repeat with the browser devtools network tab open → confirm a full document request (not RSC fetch) on the CTA click.
5. Regression: switch waitlists in the dropdown → still navigates/updates (`?wid=` push path unchanged); tier-refresh tests still pass.

### Phase 5 — Confidence check

1. Problem fully understood? **yes** 2. Root cause understood? **yes** 3. Fix research-based (official docs + community-confirmed)? **yes** 4. All affected areas considered? **yes** 5. Confident no test/regression break? **yes**

---

## Section 3 — Warmth not updating after a referral (+ how to test)

### Root cause — by design + cron not running

`warmth_score` is written by **exactly one code path**: `batchRecalculateWarmth()` (`src/lib/warmth.ts:107-211`), invoked **only** by `GET /api/cron/warmth` (`src/app/api/cron/warmth/route.ts:20`, Bearer `CRON_SECRET`). `POST /api/subscribers` never touches warmth (grep: only a marketing-copy line matches).

So after a referral (pre-restructure):

1. The referred row gets `referrer_id` immediately — **referral counts, dashboard referral columns, positions all update live**.
2. The referrer's `warmth_score` **does not change** until the next cron run recalcutes everyone.
3. **Locally there is no scheduler at all** — warmth never moves without manually calling the endpoint.
4. **Production cron is an open manual gate (Story 15.1)** — `vercel.json` schedules `0 5 * * *` UTC, but deployment of the cron + `CRON_SECRET` presence in Vercel env is unverified. If missing → 401/500 → never updates.
5. ~~New subscribers start `warmth_score = null` → Unscored until first cron~~ — **fixed by restructure** (R5: insert `'hot'` at signup).

**Batch-only stays (D5)** — no per-referral trigger. Research: daily recalculation is the industry-ideal cadence (Bounceproof: _"Daily recalculation is ideal… the key is that the score reflects current recency"_); Tarvent recalcs on a schedule too. Docs only.

### Expected numbers — AFTER restructure (new model, §4.3)

| Situation                                                 | Score                   | Tier shown                                               |
| --------------------------------------------------------- | ----------------------- | -------------------------------------------------------- |
| Fresh signup, no actions (insert `'hot'`, no cron needed) | 70                      | **Hot**                                                  |
| 1 referral made                                           | 85                      | **Hot** (was Cold at 15 — the reported confusion, fixed) |
| 2 referrals + qual                                        | 70+30+8 = 100 (clamped) | **Hot**                                                  |
| Qual answered only                                        | 78                      | **Hot**                                                  |
| 60–89 days since last meaningful action, no signals       | 45                      | **Warm**                                                 |
| 60–89 days, 1 referral (+15)                              | 60                      | **Warm**                                                 |
| 90+ days since last meaningful action                     | 0                       | **Cold**                                                 |
| Clicks never score separately from baseline               | +5 each                 | pushes toward 100 / offsets decay                        |

Semantics: **Hot = joined or active within 60 days · Warm = quiet for 2–3 months · Cold = silent for 3+ months.** Opens never score (standing decision — Apple MPP). Signals: click +5, referral +15, qual +8 (R3, benchmark-verified).

### Test guide (manual — run these to see warmth move)

**Local:**

1. Ensure `.env.local` contains `CRON_SECRET` (any long random string).
2. `pnpm dev`.
3. Open the public waitlist page, join as subscriber **A** (answer a qual question if enabled), capture A's referral link from the thank-you page (`…?ref=CODE`).
4. Incognito: join via A's referral link as subscriber **B**.
5. Dashboard → warmth: **A and B already show Hot** (R5 insert — no cron needed for fresh rows).
6. Trigger the cron manually — PowerShell:
   ```powershell
   $secret = (Select-String -Path .env.local -Pattern '^CRON_SECRET=').Line.Split('=')[1]
   Invoke-RestMethod -Uri http://localhost:3000/api/cron/warmth -Headers @{ Authorization = "Bearer $secret" }
   ```
   Expected JSON: `{ processed, hot, warm, cold }` (**no `unscored`** — R7).
7. Dashboard → wait ≤60s (auto-refresh) or F5 → **A = Hot (85, 1 referral)**, **B = Hot (70)**. Distribution card counts change only if tiers changed.
8. Cold-path test: update a subscriber's `created_at` + any click `created_at` to 91+ days ago via SQL, re-run step 6 → that subscriber lands **Cold**.
9. Recency test (R4): give subscriber C a referral (referred signup `created_at` = today) with no clicks, and a signup 70 days old → after cron, C's decay clock reads from the referral, not the signup.

**Production:**

1. Verify `vercel.json` cron is deployed (Vercel → Project → Cron Jobs shows `0 5 * * *` UTC).
2. Verify `CRON_SECRET` exists in Vercel env vars (same value as local).
3. One-shot check: `curl -H "Authorization: Bearer <secret>" https://www.prewaitlist.com/api/cron/warmth`.
4. After 05:00 UTC next day, dashboard warmth should reflect the previous day's activity automatically.

---

## Section 4 — Warmth model restructure: remove Unscored, everyone starts Hot

### 4.1 The theory (founder, 2026-09-25)

> "the unscored functionality is to be removed and everyone starts from hot and they go cold based on activity"

Today: signal-accumulation from zero → fresh signup = **Unscored** (gray), a first referral (15) lands **Cold**, a brand-new list shows an all-Unscored panel that looks broken. Unscored was never in the vision — `product-vision-mvp-waitlist-tool.md:130` says _"Three states"_ and `:169` says _"Three numbers at the top of the dashboard"_. **The restructure aligns code back to the original vision.**

### 4.2 Research (5 web queries total, 2026-09-25)

**Queries 1–3 — does anyone ship an "Unscored" state? (Everyone-classified + baseline patterns):**

| #   | Query                                                                                                     | Key finding                                                                                                                                                                                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | engagement scoring model start all contacts at high score decay over time email marketing                 | **Tarvent:** new contacts get a score floor (first 30d can't drop below 40 = "at least Warm") because _"scoring on history would put every new signup straight into Inactive."_ **Mailkit:** every new recipient defaults to neutral **3/5**. Recency is the heaviest-weighted dimension. |
| 2   | Klaviyo engagement score how it works 0-100 scoring recency frequency decay                               | **Klaviyo:** engaged segments explicitly include _"subscribe date in last 15 days"_ so brand-new subscribers aren't excluded before they can engage. No "unknown" bucket — everyone is classified.                                                                                        |
| 3   | engagement score new subscriber grace period start high score decay inactivity winback reactivation model | **Tarvent FAQ:** _"Why does a brand-new contact show a score around 40 when they haven't opened anything? NEW contacts get a grace period with a minimum score."_ Grace periods + baselines are the standard mechanism; an Unscored resting state is not.                                 |

**Queries 4–5 — signal weights + decay clock:**

| #   | Query                                                                                                  | Key finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4   | email engagement scoring point values benchmark click points reply points weighting lead scoring model | Click = **5** is the most consistent number across all sources (Count.co 3–5, EmailListValidation +5, Mailflow +5, HubSpot example 5). Form submission = **8** (Mailflow, ContentBacon). Forward/share/advocacy = **10–15** (EmailListValidation 10, BetaCompression 15, Mailflow purchase 15). Tier bands **70–100 High / 40–69 Medium** are the industry standard (HubSpot, BetaCompression, Outsolvi) — matches our thresholds exactly. Caps on repeated low-intent signals recommended (ContentBacon) — our clamp-to-100 covers it. |
| 5   | engagement score decay recency clock resets on any interaction or only email click best practice       | **Every source defines recency as time since last meaningful action of ANY type:** Tarvent (_"recency carries the most weight… clicked yesterday beats clicked ten times last year"_ — across all engagement actions), Madkudu (per-event lifespan decay), Bounceproof/Outsolvi (_"recency of last engagement"_), Tarka (`days_since_last_action` across core events), Keap (opens OR clicks). **Clicks-only was an arbitrary restriction** — an actively-referring subscriber is objectively engaged.                                  |

**Conclusions:** (a) remove Unscored + classify everyone from day one = industry practice; (b) current weights 5/15/8 are already the grounded values — no retune; (c) decay clock should be any meaningful action → clicks **+ referrals**; (d) keep 60/90-day decay + ≥70/≥40 bands.

### 4.3 Final model spec (all parameters founder-approved — Section 0)

```
BASELINE = 70

score = clamp( BASELINE + clicks×5 + referrals×15 + qual×8 − decay , 0 , 100 )

lastActivity = max( last email click , latest referred-subscriber signup , own signup )

decay (from lastActivity):
  0–59 days  → 0
  60–89 days → −25
  ≥90 days   → force 0

tiers:  score ≥ 70 → "hot"
        score ≥ 40 → "warm"
        else       → "cold"          ← never null; Tier type loses `| null`
```

**Lifecycle progression (no actions):** Hot (0–59d) → Warm (60–89d, score 45) → Cold (90d+, score 0).
**Fresh signup:** score 70 → Hot, written at insert (R5) — correct even before any cron run.

**Unchanged (validated by research + prior decisions):** signal weights 5/15/8 (R3) · opens never score (Apple MPP standing decision) · batch-only daily recalc (D5) · tier string written to `subscribers.warmth_score` · cron auth `CRON_SECRET`.

### 4.4 Governance — what this reopens

This overturns **Epic 15 Standing Decision 3** ("decayed-zero → Cold; Unscored = never engaged") and the following ACs — founder sign-off obtained via the R-series answers (AGENTS.md "Standing Product Decisions — ask first" satisfied; PRD §5 does not codify the warmth model itself):

- Story 11.1 AC6 (score 0 → Unscored), AC7 (writes null)
- Story 11.2 AC2 (Unscored badge), AC3 (Unscored filter option)
- Story 11.3 AC1 (four bars), AC4 (response shape with `unscored`)
- Story 12.3.3 AC2 (summary row per-tier incl. Unscored), AC5 (filter options)
- Story 15.0 AC4 (`null` for never-engaged), AC7 (return shape + `unscored`)
- Story 15.1 AC4 (cron JSON includes `unscored`)
- Story 15.4 AC1 (Unscored fill clause), AC5 (response shape)
- Story 15.5 AC5 (panel test coverage of Unscored)
- Epic 17 (planned) AC3/AC7 (segments "unscored only in all")
- Vision: **already aligned** ("Three states" `:130`, "Three numbers" `:169`) — no contradiction; version bump only.

Amendments are documentation work (§4.8), executed with the code.

### 4.5 Implementation surface map

**Engine — `src/lib/warmth.ts`:**

| Area                     | Change                                                                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Const                    | `+ BASELINE = 70`                                                                                                                                                                                                                                |
| `scoreSubscriber`        | `rawScore` starts at `BASELINE`; return type drops `hadEngagement` (only consumer was the null branch)                                                                                                                                           |
| `assignTier`             | `≥70 hot / ≥40 warm / else cold` — remove `hadEngagement?` param + null branch; `type Tier = "hot" \| "warm" \| "cold"`                                                                                                                          |
| Decay clock              | `calculateDecay(events, referralActivityAt, fallbackDate)` — reference = max(clicks, referral activity, `created_at`)                                                                                                                            |
| `calculateWarmthScore`   | Wrapper signature gains referral activity input (test-facing)                                                                                                                                                                                    |
| `batchRecalculateWarmth` | Referral fetch `select("referrer_id")` → `select("referrer_id, created_at")`, track **latest** referred signup per referrer (reuses the page-scoped pattern already there); counts drop `unscored`; return type `{ processed, hot, warm, cold }` |

**Cron — `src/app/api/cron/warmth/route.ts`:** passthrough of batch result — shape changes automatically (no `unscored`). Amend 15.1 AC4 text.

**Insert — `src/app/api/subscribers/route.ts`:** `baseInsert` gains `warmth_score: "hot"` (covers both insert sites `:562` + `:572`).

**APIs:**

| Route                                               | Change                                                                                                                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/dashboard/warmth/route.ts`             | Remove `unscored` computation + key (`:59-66`) → `{ hot, warm, cold, total }`. Pre-migration null rows simply won't match any tier (transient; SQL gate closes it permanently). |
| `src/app/api/warmth/[subdomain]/route.ts`           | **Delete route + `src/__tests__/api/warmth.test.ts`** (R8 — orphaned; audit confirmed no callers)                                                                               |
| `src/app/api/dashboard/broadcast/segments/route.ts` | **No code change** — `hot_warm` + `cold` = `all` naturally once nulls are gone; keys stay (`broadcast/client.tsx` contract)                                                     |
| `src/app/api/dashboard/broadcast/route.ts`          | **No code change** — segment filters unchanged                                                                                                                                  |
| `src/app/api/subscribers/export/route.ts`           | No functional change (`warmth_score \|\| ""` becomes dead-nullish; simplify optional)                                                                                           |

**UI:**

| File                                      | Change                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/dashboard/warmth-panel.tsx`   | Remove `unscored` from interface + both Unscored bars; + full Section 1 redesign (3 bars, meta `{n} subscribers`, title-link, value colors, flex rows, `waitlistId`)                                                                                                                                                                                                                                                                 |
| `components/dashboard/warning-banner.tsx` | `WarmthData` interface drops `unscored` (`:5`); cold% math unchanged (`cold/total`)                                                                                                                                                                                                                                                                                                                                                  |
| `src/app/dashboard/client.tsx`            | `warmthData` state type drops `unscored` (`:151-155`); KPI subtext `:476-481` → always `{total} total` (delete `unscored > 0` branch — existing copy string, no copy gate); pass `waitlistId` at `:528`                                                                                                                                                                                                                              |
| `src/app/dashboard/warmth/page.tsx`       | Summary drops `unscored` key (`:38`, `:91`); `else` branch → counts as `hot` (defensive — unreachable post-migration)                                                                                                                                                                                                                                                                                                                |
| `src/app/dashboard/warmth/client.tsx`     | `WarmthSummary` drops `unscored`; `FilterTier` loses `"unscored"` + `<option>` (`:199`); `WarmthBadge` null branch renders **Hot** styling instead of "Unscored" text (defensive); free-tier overlay label list `["Hot","Warm","Cold","Unscored"]` → 3 (`:113`) + `grid-cols-4` → `grid-cols-3` (`:112`); summary grid `:148-171` → 3 cards, `grid-cols-4` → `grid-cols-3`; `WARMTH_ORDER` null sort-order → treat as hot (`:79-80`) |
| `src/app/dashboard/page.tsx:55`           | Keep select (harmless); TS types stay `string \| null` (tolerant) while DB enforces non-null                                                                                                                                                                                                                                                                                                                                         |

### 4.6 SQL migration (R6 approved — new manual gate)

**File:** `docs/stories/sql-writeups/warmth-restructure-no-unscored.sql`

```sql
-- Warmth restructure: everyone starts Hot; remove Unscored permanently.
-- Safe to run at any time relative to deploy:
--   1) DEFAULT protects old code that inserts without specifying the column.
--   2) Backfill classifies every existing null row.
--   3) NOT NULL locks the invariant forever.

ALTER TABLE subscribers ALTER COLUMN warmth_score SET DEFAULT 'hot';

UPDATE subscribers
SET warmth_score = 'hot'
WHERE warmth_score IS NULL;

ALTER TABLE subscribers ALTER COLUMN warmth_score SET NOT NULL;
```

No other schema change needed — CHECK constraint already allows `('hot','warm','cold')`.

### 4.7 Tests

| File                                                      | Change                                                                                                                                                         |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/__tests__/lib/warmth.test.ts`                        | All score expectations +70 (clamped); `assignTier` null cases → `cold`; new: baseline start, decay clock reads referral activity, max(click, referral, signup) |
| `src/__tests__/lib/warmth-batch.test.ts`                  | Null-write case → expects `'hot'`/`'cold'` never null; drop `unscored` counts; referral `created_at` used for clock                                            |
| `src/__tests__/components/warmth-panel.test.tsx`          | 3 bars; drop Unscored fill assertion; + title-link href, `aria-hidden` action, meta line cases (Section 1)                                                     |
| `src/__tests__/api/warmth.test.ts`                        | **Delete** (route deleted)                                                                                                                                     |
| `src/__tests__/api/cron-warmth.test.ts`                   | Response shape `{ processed, hot, warm, cold }`                                                                                                                |
| `src/__tests__/components/dashboard-warmth-page.test.tsx` | Fixtures `null` → `"hot"`; summary 3 keys; badge no "Unscored"                                                                                                 |
| `src/__tests__/components/dashboard-tier-gating.test.tsx` | Free overlay shows 3 labels                                                                                                                                    |
| `warning-banner tests` (Epic 15.5 file)                   | Drop `unscored` from prop fixtures                                                                                                                             |
| `src/__tests__/api/dashboard-segments.test.ts`            | Verify unchanged (keys `all/hot_warm/cold` stay)                                                                                                               |
| `src/__tests__/api/csv-export.test.ts`                    | `null` fixtures → `"hot"` (optional; export unaffected)                                                                                                        |

### 4.8 Documentation sync (D6 + governance)

| Doc                                                                                                                | Updates                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/PRD.md`                                                                                                      | `:594` API table drop `/unscored`; `:490` constraint → add `default 'hot'` + `not null`; grep for any other Unscored mention                  |
| `docs/product-vision-mvp-waitlist-tool.md`                                                                         | Verify Modules 3/4/5 (already "three states/numbers" ✓); add baseline-70 + any-action recency note to Module 3; version bump at `:7`          |
| `docs/design/dashboard-design-guide.md`                                                                            | `:211` filter options (drop Unscored), `:222` badge table row, `:286` "4 horizontal bars" → 3, `:288` bar colors, `:322` neutral/unscored row |
| `docs/design/sprint-3-design-specs.md`                                                                             | §S1 ASCII (3 bars, meta, title-link), `:399` unscored color row, `:404` + `:497` + `:712-714` response shapes                                 |
| `.memory/MEMORY.md`                                                                                                | Epic 15 block corrections (Standing Decision 3 overturned) + new restructure decision block (2026-09-25)                                      |
| `docs/epics/epic-15-warmth-engine-fix.md`                                                                          | Standing Decision 3 + AC annotations (superseded by restructure — align-epic annotation style, ACs marked amended not silently rewritten)     |
| `docs/epics/epic-17-broadcast-engine-fix.md`                                                                       | AC3/AC7 "unscored only in all" wording                                                                                                        |
| `docs/epics/completed/story-11.1/11.2/11.3` + `epic-11-warmth-tracking.md`, `epic-12.3-dashboard-section-pages.md` | Status annotations for overturned ACs (Dev Notes only)                                                                                        |
| `docs/dashboard-warmth-redesign-plan.md`                                                                           | This file — status flip to implemented + gate checklist                                                                                       |
| `docs/scans/engine-audit-5-engines.md`                                                                             | **No change** — point-in-time historical scan                                                                                                 |

---

## Section 5 — Execution order & gates

**Implementation order (on approval):**

1. **Switcher Fix A + B** (Section 2) — independent; manual verification steps.
2. **Engine restructure** — `warmth.ts` (baseline, tier, decay clock) + `baseInsert` `'hot'` + cron shape + `dashboard/warmth` route + **delete orphan public route + test**.
3. **SQL migration file** written → founder runs it (safe any time; DEFAULT-first protects running code).
4. **UI pass** — Unscored removal across 5 components + **card redesign in `warmth-panel.tsx`** (single pass over the same file).
5. **Tests** — update/delete per §4.7.
6. **Gates:** `pnpm lint` → targeted tests (`warmth`, `warmth-panel`, `warmth-page`, `cron`, `segments`, `tier-gating`) → full suite (baseline **520 pass / 7 fail**) → `pnpm build`.
7. **Manual verification:** Section 2 steps (switcher) + Section 3 steps (local cron with new model) + Section 1 steps (card).
8. **Docs sync** per §4.8.
9. **Stop — no commit** (D9). Founder reviews, then `commit-push`.

**Open manual gates:**

| Gate                  | What                                                                                      | When                              |
| --------------------- | ----------------------------------------------------------------------------------------- | --------------------------------- |
| **NEW — restructure** | Run `docs/stories/sql-writeups/warmth-restructure-no-unscored.sql` in Supabase SQL Editor | Any time (safe with running code) |
| Epic 15.2             | Run `docs/stories/sql-writeups/epic15-story2-email-events-svix-unique.sql`                | Still pending                     |
| Epic 15.1             | Verify Vercel cron deployed + `CRON_SECRET` in Vercel env                                 | Still pending                     |

**Rollback:** every change is localized — engine logic reverts in `warmth.ts`; SQL NOT NULL can be relaxed with `ALTER COLUMN warmth_score DROP NOT NULL` if ever needed; UI/design revert per-file.

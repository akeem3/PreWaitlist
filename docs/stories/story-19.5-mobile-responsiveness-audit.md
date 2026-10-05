# Story 19.5 — Mobile Responsiveness Audit

**Status:** done
**Epic:** 19 — Product Fixes & Polish
**Depends on:** —
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Source:** [Epic 19 Story 19.5](../epics/epic-19-product-fixes-polish.md)

## Story

As a visitor on a phone, I want every public and dashboard screen usable so that mobile traffic isn't lost.

## Acceptance Criteria (EARS)

- AC1: Each screen shall be audited at 375×667 and 768×1024 viewports: public waitlist page (3 templates), thank-you, leaderboard, gone, marketing home, auth pages (signup/signin/verify/forgot/reset), onboarding steps 1–5/4a/success (two-pane and centered layouts, sticky mobile CTA), dashboard home + all 7 section pages + subscriber detail + settings tree (hub/list/detail/billing/profile).
- AC2: Findings (overflow, unreachable controls, table clipping, text collision) shall be listed with screenshots as evidence.
- AC3: All P0/P1 findings (unusable at 375px) shall be fixed.
- AC4: P2 findings (polish-level) shall be logged for founder triage.
- AC5: Mobile fixes shall use existing responsive utilities only — no new breakpoints or tokens.
- AC6: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC2) Audit with evidence
- T2 (AC3) Fix P0/P1
- T3 (AC4) Triage log
- T4 (AC5-AC6) Token compliance + lint/build

## Audit Evidence (T1 — AC1)

**Harness:** `tests/e2e/mobile-audit.spec.ts` (Playwright, `npx playwright test tests/e2e/mobile-audit.spec.ts`). Self-captured with `19.5-` prefix to avoid 21.2's `NN-` naming (coordination note below).

- **Coverage:** 31 screens × 2 viewports (375×667, 768×1024) = **62 captures, all ok** — marketing home, public waitlist (minimal/dark/bold), public leaderboard, gone, thank-you, signup/signin/verify/forgot/reset, onboarding 1/2/3/4/4a/5/success, dashboard home + qualification/leaderboard/warmth/updates/broadcast + subscriber detail, settings hub/waitlist-list/waitlist-detail/billing/profile.
- **Run health:** 0 navigation failures, 0 console errors, 0 HTTP 5xx, all `finalUrl`s correct (no unexpected redirects). Page identity verified per capture via `document.title` + visible headings (e.g., thank-you = "You're in." — not the "Invalid link" recovery card).
- **Public captures** use the lvh host form (`http://quality.lvh.me:3000/…`) — localhost path form bounces anonymous visitors through `updateSession` → `/signin`.
- **Auth choreography:** free-tier block → REST tier flip pro (`PATCH /rest/v1/founder_profiles`) for onboarding 4/4a/5/success (OnboardingGuard bounces free+waitlist>0 to `/dashboard`) → flip back to free for thank-you (both flips HTTP 200, recorded in `seed.tierFlips`).
- **Machine report:** `docs/qa/mobile-audit/findings.json` — per-capture `finalUrl`, geometry (overflow offenders, tight text-rect overlaps, clipped overlays, small targets), page identity. T1 initial run: 559 auto-findings (528 small-target + 6 overflow + 23 fixed-overlap + 2 overlay-clip). The file on disk now holds the **final post-fix run** (`generatedAt 2026-10-05T18:55:04Z`, 528 = 524 small-target + 4 overflow, 0 overlap, 0 clip) — see Fix Results.
- **Screenshots:** `docs/qa/screenshots/19.5-<screen>-<375|768>.png` (62 files).

**Severity model (maps to AC3/AC4):** **P0/P1 = breaks the core task at 375px** (horizontal overflow of core content, unreachable/clipped controls, text collisions hiding labels). **P2 = polish-level**: 768-only overflow, ≥~40px-but-under-44px targets, 6px near-clips, guideline notes.

## Findings (T1 — AC2)

| ID  | Sev             | Screen(s)                                                                                   | Viewport                                    | Finding                                                                                                                                                                                                                                                                                                                                                    | Evidence (screenshot `19.5-…-<vp>.png`)                                                                                                                                                                             | Source                          |
| --- | --------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| F1  | P1              | onboarding-4                                                                                | 375                                         | Next button hard-codes `w-114.5` (458px) → left=−41..right=417, **page scrollWidth 417 > 375**, both button edges clipped (centered, edge-to-edge appearance). Compare 4a (`w-full md:w-114.5`) and 5 (`w-full`).                                                                                                                                          | `onboarding-4-375`                                                                                                                                                                                                  | auto + visual                   |
| F2  | P1              | dashboard-leaderboard                                                                       | 375                                         | Subscriber table grid ≥759px → **scrollWidth 759 > 375**; Quality/Date columns and part of "Showing 1–5 of 5 subscribers" clipped right. 12.1.5's responsive treatment does not hold here post-redesign.                                                                                                                                                   | `dashboard-leaderboard-375`                                                                                                                                                                                         | auto + visual                   |
| F3  | P1              | dashboard-updates, dashboard-broadcast                                                      | 375                                         | Free-tier upgrade modal card `div.fixed…max-w-[520px]` spans y=−60..728 in 667px viewport with **no internal scroll** → Close X (top) and "Maybe later" (bottom) unreachable; only dismiss = backdrop edge strips.                                                                                                                                         | `dashboard-updates-375`, `dashboard-broadcast-375`                                                                                                                                                                  | auto + visual                   |
| F4  | P1              | dashboard-home, qualification, leaderboard, warmth, updates, broadcast, subscriber-detail   | 375 **and 768** (all < lg)                  | Fixed hamburger `top-4 left-4` (x=16..54, y=16..54) **overlaps glyph start of page headings**: h1 "Qualification"/"Leaderboard"/"Warmth"/"/Updates"(x=0)/"Broadcast Email"(x=0) bite 690/630/690/874/874 px²; home URL + Copy button bite 570/150 px²; "← Back to dashboard" bites 570 px². Text visible but first letters covered.                        | `dashboard-qualification-375`, `dashboard-home-375`, `dashboard-leaderboard-375`, `dashboard-warmth-375`, `dashboard-updates-375`, `dashboard-broadcast-375`, `dashboard-subscriber-detail-375` (+ `-768` variants) | auto (tight text-rect) + visual |
| F5  | P2              | onboarding-1, 2, 3, 4a                                                                      | 768                                         | Two-pane layout overflows: scrollWidth **835 > 768** (steps 1–3), **950 > 768** (4a) — right preview pane (`div.hidden.md:block`) min-width too wide at the `md` breakpoint. No overflow at 375 (pane hidden below md).                                                                                                                                    | `onboarding-1-768`, `onboarding-2-768`, `onboarding-3-768`, `onboarding-4a-768`                                                                                                                                     | auto                            |
| F6  | P2              | dashboard-updates, dashboard-broadcast; settings hub/list/detail/billing/profile            | 768 (updates/broadcast), 375+768 (settings) | Header near-clips ≥6px, not full collisions: updates/broadcast h1 starts x=48 → 6px bite at 768 (138px²); settings breadcrumb "Dashboard" y=48..67 vs button bottom 54 → 6px vertical clip (132px²). Same header-clearance family as F4.                                                                                                                   | same captures as F4                                                                                                                                                                                                 | auto                            |
| F7  | P2              | pattern across auth/dashboard/onboarding                                                    | 375+768                                     | Tap targets under 44×44 (details in triage log) — none block a task at 375.                                                                                                                                                                                                                                                                                | see below                                                                                                                                                                                                           | auto                            |
| F8  | P1 (compliance) | `/legal/terms`, `/legal/privacy`, `/unsubscribe` — root host (anon) **and** subdomain hosts | any                                         | Legal links on every public waitlist page (consent line + footers) were dead for visitors: anon root → **307 `/signin`**, subdomain → **404**; `/unsubscribe?token` → **307 `/signin?token`** (opt-out unreachable — CAN-SPAM 16 CFR §316.5 forbids a login wall). Found via run-health `badResponses`, not viewport geometry. **Fixed** — see F8 section. | harness `badResponses` (first post-fix run, 12× legal 404) + curl probes                                                                                                                                            | run-health                      |

No **P0** found: every core task completes at 375 (F1–F4 degrade but don't fully block; the upgrade modal's backdrop strips still dismiss).

## P2 Triage Log (T3 — AC4)

For founder triage (nothing here is fixed in T2 unless founder promotes it):

1. **768 two-pane overflow (F5)** — steps 1/2/3 = 835px, 4a = 950px wide vs 768 viewport. Fix options: narrower preview min-width, preview stacks until `lg`, or accept (tablet landscape/iPad mostly ≥1024). Note 4a is 115px worse than 1–3 (question editor + preview).
2. **Header near-clips (F6)** — settings breadcrumbs and updates/broadcast h1s at 768 clip ≤6px under the hamburger zone. **Resolved as a side effect of the F4 fix** — post-fix run shows `clippedOverlaps 0` / `fixedOverlaps 0`; no action needed.
3. **Small targets (528 auto rows → grouped):**
   - Sidebar nav links 243×40 (4px under 44) + "Broadcast" button 243×37; "Upgrade to Pro" sidebar CTA — only when drawer open.
   - "Show password" eye toggle **18×18** (signup/signin/reset) — smallest finding; functional but fiddly.
   - Upgrade-modal Close 28×28; "Maybe later" 277×36; modal is itself F3-fixed.
   - "Back" links in onboarding 327×21 (text-height hit area).
   - Step-3 color swatches 32×32/35×35; "Insert variable" 121×30; Desktop/Mobile preview toggle 69×30/64×30; success "copy link" 73×26; thank-you "See where you rank →" 144×27.
   - Footer inline links: Terms 31×12, Privacy Policy 71×16, "Powered by" 62×12 (inline-flow exception in WCAG 2.2 target size; note only).
   - Inputs at 40px height (headline, email, qual inputs) — 4px under guideline, standard in practice.
   - Preview-mock "Join waitlist" button 130×37 inside the onboarding LivePreview at 768 — mock chrome, not a live public-form control (live public form button passes).
4. **Preview scaling (Dev Notes priority)** — no regression at 375 (preview pane is `hidden md:block`, form-only column is clean, zero overflow); the only preview issue is the 768 two-pane width (F5).

## Fix Plan (T2 — AC3, AC5)

Existing responsive utilities only; no new breakpoints/tokens; no copy changes:

- **F1:** `src/app/onboarding/4/page.tsx:201` — `w-114.5` → `w-full md:w-114.5` (exact pattern already used by `4a/page.tsx:129`).
- **F2:** dashboard leaderboard table at 375 — wrap table in horizontal scroll container (`overflow-x-auto`) or make grid collapse columns at 375 with existing utilities; must keep header/rows aligned and stop document-level scrollWidth expansion.
- **F3:** `components/dashboard/upgrade-modal.tsx:206` card — add `max-h-[calc(100dvh-2rem)] overflow-y-auto` so Close + "Maybe later" scroll into reach at 667px.
- **F4:** dashboard shell header clearance for the fixed hamburger zone (`pl`/`pt` on the first header row below `lg`) so h1s/URL/back-links start right of x=54+gap — existing spacing utilities; must not disturb ≥lg (sidebar visible, no hamburger).

Post-fix: re-run harness (regenerates all 62 captures + findings) and confirm F1–F4 rows clear.

## Fix Results (T2 — AC3, AC5)

**Fix log — existing responsive utilities only, no copy, no new breakpoints/tokens:**

| ID  | File                                               | Change                                                                                                                                             |
| --- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | `src/app/onboarding/4/page.tsx:201`                | `w-114.5` → `w-full md:w-114.5` (exact `4a` pattern)                                                                                               |
| F2  | `src/app/dashboard/leaderboard/client.tsx:240-241` | `overflow-x-auto` wrapper made unconditional (was `phoneEnabled`-only); `min-w-[900px]` stays phone-only; pagination footer is outside the wrapper |
| F3  | `components/dashboard/upgrade-modal.tsx:206`       | card + `max-h-[calc(100dvh-2rem)] overflow-y-auto` (existing `100vh` max-h pattern)                                                                |
| F4  | `src/app/dashboard/shell.tsx:390`                  | `<main>` + `pt-14 lg:pt-0` — reserves the fixed-hamburger zone below `lg`; zero change at ≥lg (sidebar, no hamburger)                              |
| F8  | `src/lib/supabase/middleware.ts` + `src/proxy.ts`  | see F8 section                                                                                                                                     |

**Final harness re-run** (`findings.json`, `generatedAt 2026-10-05T18:55:04.189Z`): 62/62 captures ok · 0 console errors · **fixedOverlaps 0 (was 23) → F4 cleared, F6 cleared as the same-fix side effect** · **clippedOverlays 0 (was 2) → F3 cleared** · **overflow = exactly 4 rows = F5 only** (onboarding-1/2/3/4a @768; F1 + F2 cleared) · small-target 524 (was 528).

**Run-health 4xx note:** the T1 run recorded 16 `badResponses` (12 legal 404 + 4 over 8 captures). The final run records only **2**: `onboarding-4a@375/768 → 400 POST /api/waitlist` — the harness's own `DRAFT` fixture (`waitlistId: null`, spec line 129) failing FlushGate's create-flush validation; capture identity checks passed (real 4a UI photographed), the flush path contains none of the F1–F4 files, and the condition pre-dates this story → fixture-only noise, left as-is. The 12 legal 404s were **real (F8)** and are cleared after the fix.

## F8 — Compliance routes blocked by auth/proxy (found via run-health; fixed)

Not a viewport finding — surfaced while verifying `badResponses` under AC1 run-health. Fixed here because it is P1 compliance, discovered by this audit; no copy changed.

**Root cause (two independent defects):**

1. The anon-redirect allowlist in `src/lib/supabase/middleware.ts` (lines 56-79) lists signin/signup/auth/onboarding/opengraph but **omits `/legal` and `/unsubscribe`** → anonymous root-host request → `307 /signin`. Tested surfaces: `/legal/terms`, `/legal/privacy` (linked from the consent line, marketing footer, PoweredByFooter) and `/unsubscribe?token` (the CAN-SPAM opt-out landing path from every email footer — recipients are never signed in; subscribers have no accounts).
2. The subdomain branch of `src/proxy.ts` prefixes **every** path with the subdomain → `quality.lvh.me:3000/legal/terms` rewrites to `/quality/legal/terms` → no such route → **404** (headers: `x-middleware-rewrite: /quality/legal/terms`). Legal links on public waitlist pages are host-relative, so every visitor of every founder subdomain hit the 404.

`/api/*` is exempt from both paths (matcher `src/proxy.ts:36`) — APIs/webhooks unaffected. Unsubscribe emails use root-host `NEXT_PUBLIC_BASE_URL`, so defect 1 alone killed that flow in production.

**Fix:**

- `middleware.ts`: allowlist `!startsWith("/legal")` + `!startsWith("/unsubscribe")` (comment cites 16 CFR §316.5).
- `proxy.ts`: `isSharedPublicPath` passthrough — `/legal*` and `/unsubscribe*` rewrite to the root path unprefixed; all other paths prefix as before.

**Verification:**

- Tests: `src/__tests__/lib/supabase-middleware.test.ts` +4 (13 total — anon legal/unsubscribe pass through with no `location`; private routes still → `/signin`) · new `src/__tests__/lib/proxy.test.ts` 5 (passthrough rewrites to root; normal pages still prefix; already-prefixed paths don't double-prefix) · full suite **1002 = 995 pass / 7 fail = exact sanctioned baseline**.
- Live probes after rebuild: root `/legal/terms` + `/legal/privacy` + `/unsubscribe?token=x` → **200** (were 307) · subdomain (Host header) `/legal/*` + `/unsubscribe` → **200** (were 404) · regressions: anon `/dashboard` → 307 `/signin` ✓, anon `/onboarding/4` → 307 `/onboarding/signup` ✓, subdomain `/leaderboard` still rewrites `/quality/leaderboard` ✓, `/` + public page + `/signin` → 200 ✓.
- Harness confirmation: legal 404s gone from final-run `badResponses`.
- Research: Next.js public-route allowlisting is the standard fix for legal-behind-auth (Stack Overflow precedent); CAN-SPAM requires an opt-out on a single web page with no login step (FTC 16 CFR §316.5 — "visiting a single Internet Web page").

## Out of Scope

- Native app behavior; tablet-specific layouts beyond the 768 check.

## Dev Notes

- Playwright (21.2 capture) can double as evidence gathering — coordinate with 21.2's mobile viewport shots so the audit doesn't re-capture.
- Prior mobile work: 12.1.5 (table overflow, responsive grids), Epic 4 sticky mobile CTA, leaderboard mobile responsive (7.5) — audit verifies these still hold post-Epic 18 redesign.
- Epic 18.6–18.8 redesigned the live page + preview fit — re-verify preview scaling on small screens (this is where regressions are most likely).

## Files to Create/Modify

| File                                                     | Change                                                           |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| `docs/stories/story-19.5-mobile-responsiveness-audit.md` | Findings + screenshots evidence + P2 triage log (T1, T3)         |
| `docs/qa/screenshots/` (via 21.2)                        | Reuse mobile captures as evidence (coordinate, don't re-capture) |
| Files fixed during T2                                    | TBD — existing responsive utilities only (T2)                    |

## Risk

- Coordination risk with 21.2: capture script must ship mobile viewport shots or the audit re-captures — sync before executing either story.
- Epic 18 preview-fit is the most likely regression zone (Dev Notes) — prioritize preview scaling checks at 375px.
- AC5 forbids new breakpoints/tokens — if a fix "needs" one, it's a P2 defer or a founder decision, not an inline addition.

## Close-out

All ACs met: AC1 ✓ (62 captures) · AC2 ✓ (F1–F8) · AC3 ✓ (F1–F4 + F8 fixed, re-run clean) · AC4 ✓ (P2 triage log written) · AC5 ✓ (existing utilities only) · AC6 ✓ (lint 0 errors, build clean). Gates: lint 0/5 · prettier clean · full suite **1002 = 995 pass / 7 fail = exact baseline** · clean build · final harness run green (3.7m, 62/62).

**Founder closed Epic 19 on 2026-10-05 — sign-off items below accepted as non-blocking follow-ups (re-open as a new story if any needs doing):**

1. **F5** — 768 two-pane overflow (P2): fix now, defer, or accept (see triage log #1).
2. **F7** — small-target groupings (P2): accept as guideline notes or promote any for a follow-up (see triage log #3).
3. **F8 awareness** — compliance fix shipped in this batch (outside original ACs; discovered by the audit). Fixed + tested + probe-verified locally; **needs deploy to reach production**.

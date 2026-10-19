# Story 20.4 — Founder Marketing Links (Dub + UTM Playbook)

**Status:** done
**Epic:** 20 — Feedback, Onboarding & Growth Tooling
**Depends on:** —
**Design Refs:** - (no new UI; doc-only playbook — vision Sprint 4 + founder brief, not SVG)
**Source:** [Epic 20 Story 20.4](../epics/epic-20-feedback-onboarding-growth-tooling.md)

## Story

As the founder running my own marketing, I want distinct links per social channel so that I can trace which channel drives signups.

## Acceptance Criteria (EARS)

- AC1: A founder-facing playbook document shall exist (location per Dev Notes) defining the UTM convention: `utm_source` (twitter/linkedin/reddit/ph/...), `utm_medium=social|launch|email`, `utm_campaign` (campaign name), plus worked examples for the main channels.
- AC2: The playbook shall include Dub setup steps: account creation, creating one link per channel (free tier: 25 new links/mo, 1K tracked clicks/mo, 30-day analytics, 3 domains — verified 2026-10-04), and where to read per-link click results.
- AC3: The playbook shall state how to verify attribution end-to-end: Dub/UTM link → landing → PostHog (20.1) sees matching `utm_source` on `account_created`/`onboarding_started`.
- AC4: Zero product code changes — this story is setup + documentation only (unless a UTM-pass bug is found, which routes to a fix task here).
- AC5: Lint and build shall pass (doc-only change still gated).

## Tasks

- T1 (AC1) UTM convention section
- T2 (AC2) Dub setup section
- T3 (AC3) Attribution verification section
- T4 (AC4-AC5) Confirm no code changes + gates

## Out of Scope

- Building link shortening into the product; subscriber-facing share links (already `ShareButtons`/`ReferralLink`); GA/other analytics install.

## Dev Notes

- Where: `docs/playbooks/founder-marketing-links.md` (new folder) or `docs/` root — pick one, keep flat.
- Existing attribution that already works: `?src=powered-by` footer links, acquisition cookie capture in proxy.ts (Story 3.0), `?ref=` (subscriber referrals — different system, don't confuse: `ref` = subscriber's referral code, NOT channel attribution).
- PostHog free tier captures utm params on pageviews by default (autocapture/pageview properties) — AC3 verification is realistic without extra wiring.
- Founder account creation for Dub is his step (ask-first satisfied by prior approval).

## Files to Create/Modify

| File                                                  | Change                                                                                                                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/playbooks/founder-marketing-links.md`           | New — UTM convention + Dub setup + attribution verification (path pick per Dev Notes)                                                                                                                               |
| `src/app/auth/callback/route.ts`                      | AC4 fix task (audit-found UTM-pass bug): acquisition write `.update().eq()` → atomic `.upsert({id, …}, {onConflict: "id"})` so a fresh signup with no profile row persists UTM fields instead of silently no-opping |
| `src/__tests__/api/auth-callback-acquisition.test.ts` | New — 6 tests locking the create-if-missing persist, cookie cleanup, no-cookie skip, malformed-cookie tolerance                                                                                                     |

## Risk

- AC4 = zero product code changes — if the UTM-pass bug hunt finds nothing, keep it docs-only; if a bug is found it becomes a fix task here (AC4 allows this explicitly).
- Don't confuse `?ref=` (subscriber referral) with channel attribution — the playbook must keep the two systems clearly separated (Dev Notes).
- Path decision (`docs/playbooks/` vs `docs/` root) must be made once and recorded — avoid duplicate files in both locations.

## Prompt #3 audit (2026-10-07)

**Findings: 3 — all fixed, re-audited green.**

- **F1 (playbook):** §3 gotcha #2 was factually wrong — claimed `account_created` fires "on the auth-callback path" and "won't carry the landing UTMs". Actual: fires on `/signup` page at form submit (`src/app/(auth)/signup/page.tsx:141`, email path only — OAuth skips); `onboarding_started` at `src/app/onboarding/1/page.tsx:113`; both fire in the landing session in the standard journey → PostHog session super-props merge `utm_*` into them (matches AC3's literal expectation). Rewritten with the session-boundary fallback.
- **F2 (playbook):** §3 verification steps lacked same-browser instructions — added email+password requirement + stay-in-one-window (cookie + PostHog first-touch are browser-scoped); step 4 + success table now assert `utm_source` on both events per AC3; failure triage's "different browser still records first-touch" claim corrected (browser-scope).
- **F3 (product, AC4-sanctioned):** fresh signup has no `founder_profiles` row at callback (rows created lazily at waitlist creation `api/waitlist/route.ts:141` or checkout `billing/checkout/route.ts:37`) → `.update().eq("id")` was a 0-row silent no-op (PostgREST) → `mw_acquisition` cookie deleted at `callback:97` → UTM permanently lost → playbook §3 step 5 DB check failed on its own prescribed flow. Same bug was flagged-and-deferred in the 2026-09-29 Pro CTA audit. **Fix:** atomic `upsert({id, ref_param, utm_*…}, {onConflict: "id"})` (Supabase best-practices: select-then-insert races; cited in Prompt #8 Phase 2). RLS `for all … with check (id = auth.uid())` permits own-row insert; schema needs only `id` (all else defaulted/nullable). **Test:** 6 new tests — mutation-verified (reverting to `.update()` fails exactly the 2 payload tests); existing plan-pro callback tests 6/6 unaffected (no acquisition cookie). Best-effort semantics unchanged (try/catch swallow).

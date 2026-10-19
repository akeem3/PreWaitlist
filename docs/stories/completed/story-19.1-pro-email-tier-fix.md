# Story 19.1 — Pro Email Tier Fix (P0)

**Status:** done
**Epic:** 19 — Product Fixes & Polish
**Depends on:** —
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Source:** [Epic 19 Story 19.1](../epics/epic-19-product-fixes-polish.md)

## Story

As a Pro founder, I want my confirmation and moved-up emails to omit the "Powered by PreWaitlist" branding so that my subscribers see only my brand.

## Acceptance Criteria (EARS)

- AC1: The confirmation-email tier read in `POST /api/subscribers` (fire-and-forget block, `route.ts:890-893`) shall resolve the founder tier correctly when `founder_profiles` is returned by PostgREST as a to-one object (not an array).
- AC2: The moved-up-email tier read (`route.ts:1065-1070`) shall be fixed the same way.
- AC3: The broadcast preview in `src/app/dashboard/broadcast/client.tsx:288` shall not display a hardcoded "powered by PreWaitlist" line to any tier.
- AC4: Confirmation and moved-up emails shall use `buildFreeEmailFooter` (with Powered-by) if and only if the founder's tier is `free`; tier `pro` shall use the non-Powered-by footer.
- AC5: Milestone congratulatory emails (`src/lib/milestones.ts`) shall apply the same tier-conditional footer rule (currently unconditional `buildEmailFooter` — free tier is missing attribution, the inverse bug).
- AC6: Page footers (`waitlist-page-content.tsx:74`, `thank-you/page.tsx:237`, `leaderboard/page.tsx:211`) shall be verified to render Powered-by for free tier only (no code change expected — confirm only).
- AC7: A regression test shall lock the tier-resolution behavior: object-shaped embed → `pro` → non-free footer; array-shaped embed (defensive) → same result.
- AC8: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC2) Fix both tier reads with the `Array.isArray` pattern
- T2 (AC3) Remove hardcoded preview line
- T3 (AC4-AC5) Tier-conditional footers incl. milestones
- T4 (AC6) Verify page footers
- T5 (AC7) Regression test
- T6 (AC8) Lint + build

## Out of Scope

- Any footer visual redesign; broadcast footer changes; email template copy.

## Dev Notes

- **Root cause (confirmed 2026-10-04):** `.select("founder_profiles!inner(tier)").eq("id", waitlist_id).single()` returns `waitlistWithTier.founder_profiles` as an **object** (many-to-one embed). The code casts it to `{ tier: string }[]` and indexes `[0]` → `undefined` → `|| "free"` → tier is **always "free"** → every confirmation/moved-up email gets `buildFreeEmailFooter`.
- **Correct pattern already exists in the same file** at `:526-528`: `Array.isArray(x) ? x[0] : x` — reuse it (or a small shared helper) in both email paths.
- `route.ts:898` `console.log("Email tier for waitlist ...")` is the live-verification probe — after the fix it must print `pro` for a Pro waitlist.
- `milestones.ts:22` currently: `buildEmailFooter(waitlist?.business_address)` unconditional. AC5 makes it tier-conditional — the tier is already fetched and passed into the milestone notify path (`route.ts:917`, `:1094` pass `tier`) — verify and thread through if not already.
- Broadcast footers (`buildBroadcastEmailFooter`/`WithUrl`) intentionally have NO Powered-by (address + unsubscribe only) — do not add one; broadcast is Pro-gated anyway.
- Which footer does a FREE founder's confirmation use today? `buildFreeEmailFooter` (bug side-effect) — behavior unchanged for free; only `pro` changes. AC7 test covers both.
- Footer inventory (6 paths): confirmation, moved-up, milestone (email) · waitlist page, thank-you, leaderboard (page).

## Files to Create/Modify

| File                                                | Change                                                    |
| --------------------------------------------------- | --------------------------------------------------------- |
| `src/app/api/subscribers/route.ts`                  | Fix tier reads at `:890-893` + `:1065-1070` (T1)          |
| `src/app/dashboard/broadcast/client.tsx`            | Remove hardcoded preview "powered by" line at `:288` (T2) |
| `src/lib/milestones.ts`                             | Tier-conditional footer (T3)                              |
| `src/__tests__/api/subscribers.test.ts`             | Regression test: object/array embed → correct footer (T5) |
| `src/__tests__/api/subscribers-referral.test.ts`    | Regression test: object/array embed → correct footer (T5) |
| `src/__tests__/lib/milestones.test.ts`              | Regression test: milestone tier-conditional footer (T5)   |
| `components/public/waitlist-page-content.tsx`       | Verify only — Powered-by for free tier (T4)               |
| `src/app/(public)/[subdomain]/thank-you/page.tsx`   | Verify only (T4)                                          |
| `src/app/(public)/[subdomain]/leaderboard/page.tsx` | Verify only (T4)                                          |

## Risk

- Milestone path may not actually thread `tier` into `milestones.ts` yet — AC5 could require a small signature change; verify before assuming (Dev Notes say "verify and thread through if not already").
- AC6 is verification-only — if a page footer turns out to be wrong, that's a scope decision: fix inline (small) or defer with founder sign-off, don't silently expand.
- The regression test must cover **both** embed shapes (object + defensive array) or AC7's second half is unproven.

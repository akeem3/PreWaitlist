# Story 19.2 — CSV Export Polish (Quality Column)

**Status:** done
**Epic:** 19 — Product Fixes & Polish
**Depends on:** —
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Source:** [Epic 19 Story 19.2](../epics/epic-19-product-fixes-polish.md)

## Story

As a founder, I want my CSV export to include the subscriber quality/warmth score so that my exported data matches what I see in the dashboard.

## Acceptance Criteria (EARS)

- AC1: The export headers in `src/app/api/subscribers/export/route.ts` (`:106`) shall include a Quality column in addition to Email, Name, Position, Referrals, Warmth, Signup Date.
- AC2: The Quality value shall be derived from the subscriber's warmth data already selected by the route (`warmth_score` at `:57/:64`) — no new table queries. **[AMENDED 2026-10-04 — founder: Quality = referral-quality %, matching the dashboard formula `totalReferrals > 0 ? Math.round((referrals / totalReferrals) * 100) : null` (`dashboard/leaderboard/page.tsx:140-143`), rendered as `N%` (empty when null). The "no new table queries" clause still holds — value comes from the referralCounts batch query the route already runs. `warmth_score` continues to back the Warmth column.]**
- AC3: RFC4180 escaping shall apply to Quality values as with existing columns (Story 14.4 escaping stays intact).
- AC4: Column order shall remain stable with Quality appended (or inserted adjacent to Warmth) — documented in the AC tests.
- AC5: The filename and tier gating behavior shall be unchanged by this story.
- AC6: Tests shall cover: header includes Quality, value renders, escaping, and the phone-mode conditional select paths still work. **[AMENDED 2026-10-04 — founder: + formula-injection hardening coverage.]**
- AC7: Lint and build shall pass with zero errors.
- AC8: `escapeCsvCell` shall harden formula-leading cells against OWASP WSTG-INPV-21: when a cell begins with `=`, `+`, `-`, `@`, tab, or CR it shall be prefixed with `'` to force text in spreadsheet apps (pure numerics such as E.164 phone values exempt — they evaluate as numbers, never commands), covering subscriber-controlled free text (qual answers, display names).

## Tasks

- T1 (AC1-AC2) Add Quality header + cell mapping
- T2 (AC3-AC5, AC8) Escaping/order/gating verification + formula-injection hardening
- T3 (AC6) Tests
- T4 (AC7) Lint + build

## Out of Scope

- New computed quality scores beyond warmth; export format changes (parquet etc.). **[AMENDED 2026-10-04 — founder: referral-quality % (amended AC2) is now in scope; "beyond warmth" still excludes any third score.]**

## Dev Notes

- Vision `:430`: "CSV export polish (all columns, all tiers)". Existing conditional selects at `:57/:64` (phone/display_name arms) — the literal-template-literal gotcha from phone-collection applies: branch the full select per arm, never interpolate columns into a template literal.
- ~~The dashboard table shows Warmth badges — "Quality" in vision vs "Warmth" column naming: name the header `Quality` per vision, value = warmth tier string (hot/warm/cold). Founder can rename in 21.x review if desired (copy-gate — flag, don't invent).~~ **[SUPERSEDED 2026-10-04 by amended AC2 — value is now referral-quality % (dashboard parity), header stays `Quality` per vision.]**
- Free-tier CSV gating: `src/lib/pricing-features.ts` lists CSV under FREE_FEATURES (per Epic 13 AC2 note) — verify while here (AC5).
- **OWASP formula-injection flag (research 2026-10-04):** `escapeCsvCell` (`export/route.ts`) is RFC4180 quoting only — cells beginning with `=`, `+`, `-`, or `@` (free-text qual answers are subscriber-controlled) execute as formulas when the CSV is opened in Excel (OWASP WSTG-INPV-21). Mitigation is trivial (prefix `'` on formula-leading cells). **Decision (founder, 2026-10-04): FOLDED INTO THIS STORY as AC8** — flagged in the create-epic [19] Phase 5 report; no longer deferred.

## Files to Create/Modify

| File                                      | Change                                        |
| ----------------------------------------- | --------------------------------------------- |
| `src/app/api/subscribers/export/route.ts` | Quality header + cell mapping (T1)            |
| `src/__tests__/api/csv-export.test.ts`    | Header/value/escaping/order/gating tests (T3) |

## Risk

- ~~**Open founder decision:** OWASP formula-injection hardening (Dev Notes) — if approved mid-story it adds an AC; if deferred, note it in the story results so 21.4/21.5 don't rediscover it as unknown.~~ **[RESOLVED 2026-10-04 — folded in as AC8.]**
- Template-literal select gotcha (phone-collection): conditional column strings must branch the entire `.select()` per arm or TypeScript's parser errors at build.
- "Quality" vs "Warmth" header is copy-gate territory — name it `Quality` per vision; renaming needs founder approval, don't improvise.

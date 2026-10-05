# Story 19.2 — CSV Export Polish (Quality Column)

**Status:** ready
**Epic:** 19 — Product Fixes & Polish
**Depends on:** —
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Source:** [Epic 19 Story 19.2](../epics/epic-19-product-fixes-polish.md)

## Story

As a founder, I want my CSV export to include the subscriber quality/warmth score so that my exported data matches what I see in the dashboard.

## Acceptance Criteria (EARS)

- AC1: The export headers in `src/app/api/subscribers/export/route.ts` (`:106`) shall include a Quality column in addition to Email, Name, Position, Referrals, Warmth, Signup Date.
- AC2: The Quality value shall be derived from the subscriber's warmth data already selected by the route (`warmth_score` at `:57/:64`) — no new table queries.
- AC3: RFC4180 escaping shall apply to Quality values as with existing columns (Story 14.4 escaping stays intact).
- AC4: Column order shall remain stable with Quality appended (or inserted adjacent to Warmth) — documented in the AC tests.
- AC5: The filename and tier gating behavior shall be unchanged by this story.
- AC6: Tests shall cover: header includes Quality, value renders, escaping, and the phone-mode conditional select paths still work.
- AC7: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC2) Add Quality header + cell mapping
- T2 (AC3-AC5) Escaping/order/gating verification
- T3 (AC6) Tests
- T4 (AC7) Lint + build

## Out of Scope

- New computed quality scores beyond warmth; export format changes (parquet etc.).

## Dev Notes

- Vision `:430`: "CSV export polish (all columns, all tiers)". Existing conditional selects at `:57/:64` (phone/display_name arms) — the literal-template-literal gotcha from phone-collection applies: branch the full select per arm, never interpolate columns into a template literal.
- The dashboard table shows Warmth badges — "Quality" in vision vs "Warmth" column naming: name the header `Quality` per vision, value = warmth tier string (hot/warm/cold). Founder can rename in 21.x review if desired (copy-gate — flag, don't invent).
- Free-tier CSV gating: `src/lib/pricing-features.ts` lists CSV under FREE_FEATURES (per Epic 13 AC2 note) — verify while here (AC5).
- **OWASP formula-injection flag (research 2026-10-04):** `escapeCsvCell` (`export/route.ts:6-11`) is RFC4180 quoting only — cells beginning with `=`, `+`, `-`, or `@` (free-text qual answers are subscriber-controlled) execute as formulas when the CSV is opened in Excel (OWASP WSTG-INPV-21). Mitigation is trivial (prefix `'` or tab on formula-leading cells). **Decision needed (founder):** fold a hardening AC into this story or defer post-launch — flagged in the create-epic [19] Phase 5 report.

## Files to Create/Modify

| File                                      | Change                                        |
| ----------------------------------------- | --------------------------------------------- |
| `src/app/api/subscribers/export/route.ts` | Quality header + cell mapping (T1)            |
| `src/__tests__/api/csv-export.test.ts`    | Header/value/escaping/order/gating tests (T3) |

## Risk

- **Open founder decision:** OWASP formula-injection hardening (Dev Notes) — if approved mid-story it adds an AC; if deferred, note it in the story results so 21.4/21.5 don't rediscover it as unknown.
- Template-literal select gotcha (phone-collection): conditional column strings must branch the entire `.select()` per arm or TypeScript's parser errors at build.
- "Quality" vs "Warmth" header is copy-gate territory — name it `Quality` per vision; renaming needs founder approval, don't improvise.

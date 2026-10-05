# Story 19.3 — Edge-Case Audit

**Status:** ready
**Epic:** 19 — Product Fixes & Polish
**Depends on:** —
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Source:** [Epic 19 Story 19.3](../epics/epic-19-product-fixes-polish.md)

## Story

As the maintainer, I want every documented edge case exercised and either handled or deferred so that no flow dead-ends in production.

## Acceptance Criteria (EARS)

- AC1: The system shall be audited against this edge-case matrix, each row marked pass/fixed/deferred with evidence: expired verification links, expired/invalid unsubscribe tokens, archived waitlist public access (`/gone`), unknown subdomain, deleted/missing waitlist in dashboard deep links, duplicate email signup (409 path), at-cap signup (free 500), duplicate waitlist slug race, invalid `?ref=` codes, self-referral, missing `?wid=`/unknown `?wid=`, zero-subscriber dashboard panels (all 6+ panels), `?plan=pro` on already-Pro account.
- AC2: Findings that are broken (dead-end, crash, silent failure) shall be fixed in this story.
- AC3: Findings intentionally deferred shall be recorded in the story's results section with founder sign-off.
- AC4: Each fix shall have a test or be covered by a 21.5 test case (cross-reference noted).
- AC5: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) Execute matrix, record evidence
- T2 (AC2) Fix broken rows
- T3 (AC3-AC4) Defer log + test cross-refs
- T4 (AC5) Lint + build

## Out of Scope

- Input-validation rules (21.4 owns); fraud/fingerprinting (post-MVP standing decision).

## Dev Notes

- Known-good already (don't re-fix): archived → `/gone` on leaderboard/thank-you (4.3), unknown-`?wid` self-heal (shell:203-213), duplicate email 409 (Story 7.4), self-referral silent nullify (Story 8.2), at-cap 403 (route:532), FlushGate fresh-founder path (revenue audit F1).
- Empty states per panel exist from Epic 12.1.1 — verify each of: stat cards, chart, qualification, warmth, top referrers, warning banner, subscriber table, updates.
- Rate limit / honeypot / timing paths on `POST /api/subscribers` are part of 21.4 (validation audit) — don't duplicate here; this story covers navigation/state edge cases.

## Files to Create/Modify

| File                                         | Change                                                             |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `docs/stories/story-19.3-edge-case-audit.md` | Matrix + evidence + defer log recorded in results section (T1, T3) |
| Files fixed during T2                        | TBD as findings surface (with tests per AC4)                       |

## Risk

- Scope bleed into 21.4 — input-validation paths are explicitly out; keep the matrix to navigation/state rows per Dev Notes.
- Re-testing known-good rows wastes time and can produce false "bugs" — start from the known-good list before probing.
- Deferred rows without founder sign-off fail AC3 — record sign-off explicitly, not implicitly.

# Story 16.8 — Cleanup, Label & Doc Amendments

**Status:** ready
**Epic:** 16 — Leaderboard & Founder Updates Engine Fix
**Depends on:** 16.0, 16.3, 16.4, 16.5, 16.7
**Design Refs:** — (code cleanup + documentation)
**Source:** [Audit §3.4 / §3.8 / §4.7](../scans/engine-audit-5-engines.md), [Epic 16 Standing Decisions L2/L3/L5/L7/U5](../epics/epic-16-leaderboard-updates-engine-fix.md), [PRD L63/L72](../PRD.md), Stories 7.5 / 7.6 / 7.7 / 12.1.4 / 12.1.10 / 12.3.1

## Story

As a team, I want dead leaking code removed, the misleading "Quality" label renamed, and stories/PRD/audit/MEMORY amended — so docs stop promising unbuilt behavior and security debt is closed.

## Acceptance Criteria (EARS)

- AC1: `src/app/api/leaderboard/[subdomain]/route.ts` shall be deleted; `src/__tests__/api/leaderboard.test.ts` shall be deleted or rewritten against a remaining real consumer (if none, delete — Standing Decision L7). Coordinate with **Epic 14.0 AC7**: if Epic 14 already removed the route, this AC is a verified no-op (confirm file absent; still update audit annotation with whichever story closed it).
- AC2: Dashboard leaderboard column header currently labeled **"Quality"** (`client.tsx` SortHeader) shall be renamed to the founder-approved share label (Standing Decision L3 — **COPY GAP**: default proposal "Share %"; do not ship a different string without approval). Sort key may remain `quality_score` internally — prefer **display-label-only** rename first; if renaming the field, update `page.tsx` computation and tests coherently in the same change.
- AC3: Story 12.3.1 shall be amended: AC2 → full email on founder dashboard (Standing Decision L2); AC4 → document computed share-of-total (not a stored `quality_score` column); AC5/AC6 → annotated as **implemented in Epic 16 Story 16.5**; Out-of-scope line about CSV/search → note they shipped intentionally with 12.3.x (scope acceptance); `Status` → `done` once 16.4+16.5 land; Design Ref path corrected (missing `High-fidelity-svgs/Leaderboard.svg` → dashboard-design-guide / public SVG note).
- AC4: Story 7.5 AC10 shall be updated to match shipped Prev/Next + "Showing X–Y of Z" UX **or** annotated as superseded by implementation (choose one, consistent with `leaderboard-client.tsx`); Story 7.5 Out-of-scope already defers milestone badges — PRD must match (AC5).
- AC5: PRD Sprint 2 lines **L63** and **L72** ("milestone display" / "milestone threshold display" on **public leaderboard**) shall be amended to remove unbuilt public leaderboard badge promises (Standing Decision L5) or explicitly mark deferred — **without** weakening thank-you page milestone threshold display, which **is** built.
- AC6: Story 7.6 AC2 shall be amended to match Standing Decision U5 (brand color + headline-in-email deferred/not shipped); `Status` / frontmatter for Stories 7.6, 7.7, 12.1.4 corrected to `done` where work shipped; Story 12.1.4 Out-of-scope "email sending (deferred to Epic 12)" corrected (email shipped in 7.6); Story 12.1.10 AC5 annotated with the test file(s) from 16.3 that satisfy it.
- AC7: `docs/scans/engine-audit-5-engines.md` §3 and §4 rows fixed by 16.0–16.7 shall be marked resolved/annotated with story ids (flip severity or add ✅ Epic 16 pointer) without erasing residual known debt (public opt-in L6, engagement-weighted vision formula still unbuilt, mobile grid 🟠 if untouched, U5 brand color residual).
- AC8: `.memory/MEMORY.md` shall record Epic 16 standing decisions (pagination built; full email kept + AC2 amended; Share % label; position_boost durable; updates chunk/suppress/escape/honest status; orphan API delete).
- AC9: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) Orphan API delete
- T2 (AC2) Share % label (COPY GAP gate)
- T3 (AC3–AC4) Story 12.3.1 + 7.5 amendments
- T4 (AC5) PRD L63/L72
- T5 (AC6–AC8) Updates story statuses + audit + MEMORY
- T6 (AC9) Lint + build

## Out of Scope

- Implementing engagement-weighted quality score (vision :114 — product decision beyond this epic)
- Public leaderboard opt-in default OFF (Standing Decision L6)
- Building public milestone badges (Standing Decision L5 — deferred, doc-only here)
- Dashboard mobile grid redesign (untouched 🟠 remains known debt)
- Removing CSV/search from dashboard
- Editing Epic 14/15 documents except cross-references if needed
- Deleting historical story files

## Dev Notes

### T1 — orphan API (AC1)

- Route: `src/app/api/leaderboard/[subdomain]/route.ts` — selects/returns `qual_answers` + `referral_code` (audit §3 claim 6); zero production consumers (only tests import it).
- Tests: `src/__tests__/api/leaderboard.test.ts` (4 tests) — delete with route unless rewritten for a live consumer (**none today**).
- **Cross-epic:** Epic 14.0 AC7 claims the same delete. Before coding: `test -f src/app/api/leaderboard/[subdomain]/route.ts` — if already gone, AC1 = verify absent + note in audit which epic closed it; do not recreate.
- Public leaderboard **page** stays (RSC path `src/app/(public)/[subdomain]/leaderboard/page.tsx`) — only the orphan **API** dies.

### T2 — Share % label (AC2) — COPY GAP

- Location: `src/app/dashboard/leaderboard/client.tsx` SortHeader `label="Quality"` (~L245).
- Fix-plan default: **"Share %"** — founder may prefer another string; **block label ship** until approved.
- Internal `quality_score` / `sortKey` can stay to minimize churn; page still computes share-of-total at `page.tsx:108-111`.
- Public board column "Quality" (qualified_count) is a **different** metric — do not rename public column under this AC unless founder asks (scope: dashboard header).

### T3 — Story 12.3.1 + 7.5 amendments (AC3–AC4)

**`docs/stories/completed/story-12.3.1-dashboard-leaderboard.md`:**

| Field        | Change                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| Status       | `ready` → `done` (after 16.4+16.5)                                                                                    |
| Design Ref   | Replace dead `High-fidelity-svgs/Leaderboard.svg` with `docs/design/dashboard-design-guide.md` + note public SVG only |
| AC2          | Email column: full email on founder dashboard (L2); anonymization is public-board concern                             |
| AC4          | Value is **computed share-of-total %**, not a DB column; label per 16.8 AC2                                           |
| AC5–AC6      | Annotate **Met in Epic 16 / Story 16.5**                                                                              |
| Out of scope | CSV/search shipped in 12.3.x — annotate accepted scope, do not delete history                                         |

**`docs/stories/completed/story-7.5-public-leaderboard-page.md`:**

| Field        | Change                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------- |
| AC10         | Align text to Prev/Next + "Showing X–Y of Z" (implementation truth) or mark AC superseded |
| Out of scope | Already defers milestone badges — leave; PRD fixed in T4                                  |

### T4 — PRD L63/L72 (AC5)

Sprint 2 screens table:

- L63 Public leaderboard description: remove or defer **"milestone display"** → e.g. ranked list + anonymized emails only; badges → "deferred (post-MVP)" if mentioned.
- L72 Key features bullet: same amendment for public leaderboard milestone display.
- **Do not** change thank-you rows L61–62 (milestone threshold display **is** built).

Also check L82–83 "milestone threshold display" under referral mechanics — if wording applies only to thank-you/leaderboard mix, clarify; leaderboard-only promise is the defect.

### T5 — Updates docs + audit + MEMORY (AC6–AC8)

**Story 7.6** (`story-7.6-email-first-updates-milestone-hybrid.md`):

- AC2: amend — sender uses `resolveFromAddress` chain (`senderName` first); brand color / headline **in email body not shipped** (U5 defer).
- Frontmatter `status: ready` → `done`; body **Status:** line → done.

**Story 7.7:** status → `done`.

**Story 12.1.4:**

- Status → `done`.
- Out of Scope: remove/replace "email sending (deferred to Epic 12)" — email shipped in 7.6; note Epic 16 hardens send path.

**Story 12.1.10 AC5:**

- Annotate satisfied by `src/__tests__/api/updates.test.ts` + upgraded compose tests (16.3), or amend AC to name those files.

**Audit** `docs/scans/engine-audit-5-engines.md`:

- §3.4 issues 1–5, 7, 12 (label), 21 → ✅ / annotated with 16.4, 16.5, 16.8, 16.7, 16.0 as applicable.
- §4.4 issues 1–8, 10–11 → ✅ / 16.0–16.3.
- Leave: L6 public opt-in, vision engagement-weighted formula, mobile grid, U5 brand color residual, min-10 story metadata historical notes as residual if still true.

**MEMORY.md:** append dated Epic 16 block — Standing Decisions L1–L7 / U1–U7 summaries; do not delete Sprint history.

### T6 — lint/build (AC9)

`pnpm lint && pnpm build` (docs-only portions still run lint; label + route delete are runtime).

## Files to Create/Modify

| File                                                                       | Change                                  |
| -------------------------------------------------------------------------- | --------------------------------------- |
| `src/app/api/leaderboard/[subdomain]/route.ts`                             | **Delete** (or verify absent)           |
| `src/__tests__/api/leaderboard.test.ts`                                    | **Delete** with route                   |
| `src/app/dashboard/leaderboard/client.tsx`                                 | Quality → approved share label          |
| `docs/stories/completed/story-12.3.1-dashboard-leaderboard.md`             | AC/status/design amendments             |
| `docs/stories/completed/story-7.5-public-leaderboard-page.md`              | AC10 alignment                          |
| `docs/stories/completed/story-7.6-email-first-updates-milestone-hybrid.md` | AC2 + status                            |
| `docs/stories/completed/story-7.7-founder-updates-feed.md`                 | Status                                  |
| `docs/stories/completed/story-12.1.4-founder-updates-compose.md`           | Status + out-of-scope                   |
| `docs/stories/completed/story-12.1.10-epic-tests.md`                       | AC5 annotation                          |
| `docs/PRD.md`                                                              | L63 / L72 leaderboard milestone display |
| `docs/scans/engine-audit-5-engines.md`                                     | §3/§4 resolved annotations              |
| `.memory/MEMORY.md`                                                        | Epic 16 decisions block                 |

## Risk

- **COPY GAP AC2** can block only the label line — land AC1/AC3–AC8 independently if needed; do not invent labels.
- **Epic 14 parallel:** check orphan route existence first to avoid conflict noise.
- Doc edits must not claim engagement-weighted quality or public badges exist (AC7 residual honesty).

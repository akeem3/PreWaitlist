# Story 17.7 — Doc Amendments & Status Sync

**Status:** ready
**Epic:** 17 — Broadcasting Engine Fix
**Depends on:** 17.0–17.6
**Design Refs:** — (documentation only)
**Source:** [Audit §5 documentation claims](../scans/engine-audit-5-engines.md#5-broadcasting--%EF%B8%8F-not-functional-verified-rescan-confidence-98), [Epic 17 Standing Decisions B5/B16/B17](../epics/epic-17-broadcast-engine-fix.md), [Story 12.3](../stories/completed/story-12.3-broadcast-email.md), [Story 12.4](../stories/completed/story-12.4-warmth-segmented-broadcast.md), [Story 12.5](../stories/completed/story-12.5-email-customisation.md), [Story 12.6](../stories/completed/story-12.6-email-infrastructure-separation.md), [Story 12.1.8](../stories/completed/story-12.1.8-broadcast-duplicate-fixes.md), MEMORY.md

## Story

As a founder/maintainer, I want story docs and MEMORY to match the broadcast architecture we actually ship — so future agents don’t “fix” code back onto Resend Audiences merge tags.

## Acceptance Criteria (EARS)

- AC1: Story 12.3 **AC5** shall be amended: unsubscribe mechanism is **custom HMAC URL + `List-Unsubscribe` / `List-Unsubscribe-Post` headers**, not `{{{RESEND_UNSUBSCRIBE_URL}}}` (Standing Decision B5). AC7 and AC8 shall be annotated or amended to match Story 17.4 approved behavior.
- AC2: Story 12.4 **AC6** (default cold) shall be **deleted or rewritten** to default `"all"` per Standing Decision B17 / PRD L123 / Story 12.1.8 AC1.
- AC3: MEMORY.md broadcast-related claims (`{{{RESEND_UNSUBSCRIBE_URL}}}` merge tag lines ~780/865 and any “Broadcast works” implications) shall be corrected to custom HMAC + never Audiences; note Epic 17 fix of `waitlist_id`.
- AC4: Story frontmatter `status: done` for completed 12.3, 12.4, 12.5, 12.6 files in `completed/` (Standing Decision B16); confirm sprint-3-plan table already ✅.
- AC5: Story 12.1.8 AC3 shall be marked complete in Story 17.3 notes or the story text annotated (preview now uses `resolveFromAddress`).
- AC6: Story 12.6 AC4 local-part wording shall be reconciled with stream-prefix reality (`notifications@` / `updates@`) — amend AC to describe display-name + stream local-part, not `{sender_name}@{domain}` as local-part (Standing Decision: stream separation remains).
- AC7: Audit `engine-audit-5-engines.md` §5 Executive Summary row and “Minimum to green” may be annotated “addressed by Epic 17” (optional, non-blocking).
- AC8: Lint (markdown not linted) — **no code**; verification is human/agent read-through checklist.

## Tasks

- T1 (AC1–AC2) Story 12.3/12.4 AC amendments
- T2 (AC3) MEMORY.md fix
- T3 (AC4–AC6) statuses + 12.1.8/12.6 notes
- T4 (AC7–AC8) optional audit annotate + checklist

## Out of Scope

- PRD REQ-7.1a (already correct — never Audiences)
- Design C3 optional history row (deferred Standing Decision B10)
- New product copy (COPY GAP is Story 17.4)
- Code changes (all previous stories own code)

## Dev Notes

### Files to amend

| File                                                                   | AC(s)    | Change                                                    |
| ---------------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| `docs/stories/completed/story-12.3-broadcast-email.md`                 | AC1, AC4 | AC5 → HMAC not merge tag; AC7/AC8 vs 17.4; `status: done` |
| `docs/stories/completed/story-12.4-warmth-segmented-broadcast.md`      | AC2, AC4 | AC6 delete/rewrite default → `"all"`; `status: done`      |
| `docs/stories/completed/story-12.5-email-customisation.md`             | AC4      | `status: done`                                            |
| `docs/stories/completed/story-12.6-email-infrastructure-separation.md` | AC4, AC6 | AC4 stream-prefix wording; `status: done`                 |
| `docs/stories/completed/story-12.1.8-broadcast-duplicate-fixes.md`     | AC5      | AC3 annotated complete after 17.3                         |
| `.memory/MEMORY.md`                                                    | AC3      | Fix merge-tag claims ~L780/865; Epic 17 gotcha            |
| `docs/scans/engine-audit-5-engines.md`                                 | AC7      | Optional “addressed by Epic 17” notes (forward only)      |
| `docs/sprint-3-plan.md` or equivalent                                  | AC4      | Confirm ✅ table (no change if already done)              |

### T1 — Story 12.3/12.4 AC amendments (AC1–AC2)

**12.3 AC5 before → after:**

- Before: claims `{{{RESEND_UNSUBSCRIBE_URL}}}` merge tag
- After: custom HMAC URL via `generateUnsubscribeUrl` + `List-Unsubscribe` / `List-Unsubscribe-Post` headers (PRD L171, REQ-7.1a never Audiences; code `route.ts` + `email.ts` already correct)

**12.3 AC7/AC8:** annotate to match 17.4 (honest success copy; Free direct URL upgrade path).

**12.4 AC6:** before default `"cold"` → after default `"all"` (or delete AC and renumber note). Conflicts with PRD L123 + 12.1.8 AC1 — B17 resolves toward later fix + PRD.

### T2 — MEMORY fix (AC3)

- Correct `{{{RESEND_UNSUBSCRIBE_URL}}}` bullets (~780, ~865) → custom HMAC, never Audiences.
- Add short gotcha: “Broadcast client must send `waitlist_id`; segments need `?wid=` + eligible counts (Epic 17).”
- Fix any implication “Broadcast works” without noting pre-Epic-17 400 bug if present.

### T3 — statuses + notes (AC4–AC6)

Frontmatter `status: done` on 12.3, 12.4, 12.5, 12.6 (B16; audit claim 20 — `ready` while files sit in `completed/`).

**12.6 AC4:** before may read `{sender_name}@{domain}` as local-part → after: display name + **stream** local-part (`notifications@` / `updates@` / `updates@custom-domain`) per `resolveFromAddress` stream rules — sender name is display, not local-part.

**12.1.8 AC3:** mark met after 17.3 (preview `resolveFromAddress` + `sending_domain`).

### T4 — audit optional + checklist (AC7–AC8)

Edit **forward** only — do not rewrite audit history sections. Add “Fixed by Epic 17” next to §5 Executive Summary / Minimum to green if touching.

**Read-through checklist:**

- [ ] 12.3 AC5 = HMAC, not merge tag
- [ ] 12.3 AC7/AC8 aligned with 17.4
- [ ] 12.4 AC6 = default `"all"` or removed
- [ ] MEMORY merge-tag claims corrected
- [ ] MEMORY Epic 17 gotcha added
- [ ] 12.3/12.4/12.5/12.6 `status: done`
- [ ] 12.6 AC4 stream-prefix wording
- [ ] 12.1.8 AC3 marked complete
- [ ] Optional audit annotate
- [ ] No PRD REQ-7.1a rewrite (already correct)

### Implementation order inside story

1. T1 completed story ACs
2. T2 MEMORY
3. T3 statuses + 12.1.8/12.6
4. T4 checklist (+ optional audit)
5. No `pnpm lint` required for md-only (AC8 checklist)

## Files to Create/Modify

| File                                   | Change type        |
| -------------------------------------- | ------------------ |
| Completed 12.x story files             | Amend ACs + status |
| `.memory/MEMORY.md`                    | Correct claims     |
| `docs/scans/engine-audit-5-engines.md` | Optional annotate  |
| `docs/sprint-3-plan.md`                | Confirm only       |

## Risk

- Doc-only story — code risk zero; risk is incomplete amendment leaving merge-tag traps for future agents.
- Do not rewrite audit as if bugs never existed — annotate fix, preserve history.
- MEMORY edits must not clobber unrelated sections — surgical replaces only.

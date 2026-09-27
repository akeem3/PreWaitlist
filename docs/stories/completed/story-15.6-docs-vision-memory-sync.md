# Story 15.6 — Story, Vision, MEMORY & Audit Sync

**Status:** done
**Epic:** 15 — Warmth Engine Fix & Hardening
**Depends on:** 15.0–15.5 (annotate only what shipped; can draft earlier but mark ACs after tests green)
**Design Refs:** — (documentation only)
**Source:** [Audit §2 §2.8 AC debt](../scans/engine-audit-5-engines.md), [Epic 15](../epics/epic-15-warmth-engine-fix.md)

## Story

As a team, I want Epic 11 stories, product vision, MEMORY, and the five-engine audit to state the researched truth so future agents do not rebuild dead signals or re-open closed decisions.

## Acceptance Criteria (EARS)

- AC1: Story 11.1 AC2 shall list only click +5, referral +15, qual +8; AC3/AC5/AC6/AC8 shall match 15.0 tier rules and 15.1 cron scheduling; no unimplemented reply/visit claims.
- AC2: Story 11.2 shall target `/dashboard/warmth` badge + filter only; remove subscriber-table column wording and `dashboard/client.tsx` lines 577–595; note badge lives in `warmth/client.tsx`.
- AC3: Story 11.5 AC1/AC3 shall agree: last engagement = most recent **clicked** (or signup fallback); remove “any email_events” contradiction; clear stale “NOT STARTED” where code exists.
- AC4: Story 11.6 AC1 shall say **401** for signature/header failures; AC3–AC5 shall name files from 15.5; Stories 11.0/11.3 Dev Notes shall reflect 15.2/15.4 outcomes.
- AC5: Product vision lines claiming open tracking is required for Hot/MVP warmth accuracy shall be amended to: opens **excluded** (Apple MPP); Hot rarity is weighting, not missing opens (Module ~150, Sprint 3 ~414/477, table ~211 as applicable).
- AC6: `.memory/MEMORY.md` shall record Epic 15 standing decisions (dropped signals, click-only decay, force-cold-on-engaged-zero, vercel cron, badge-on-warmth-page).
- AC7: `docs/scans/engine-audit-5-engines.md` §2 findings fixed by this epic shall be marked resolved / story-linked; residual debt (negatives, decay floor, public API orphan, local E2E) remains listed.
- AC8: Epic 11 story index statuses updated factually (11.2 = done on warmth page only) without claiming missing features.
- AC9: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1–AC4) Epic 11 story AC/Dev Note patches
- T2 (AC5) Vision amendments
- T3 (AC6) MEMORY Epic 15 block
- T4 (AC7–AC8) Audit §2 + epic-11 index
- T5 (AC9) Lint + build

## Out of Scope

- Deleting completed story files
- New marketing copy
- PRD structural rewrite beyond warmth accuracy claims already covered in vision
- Changing locked Standing Decisions

## Dev Notes

### T1 — Story file patches

| File                                                             | Patch                                                                                                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/stories/completed/story-11.1-warmth-calculation.md`        | AC2 signals only; AC5/AC6 Cold vs Unscored per 15.0 AC4; AC8 → scheduled via vercel.json 15.1                                         |
| `docs/stories/completed/story-11.2-warmth-column-filter.md`      | Rewrite AC1–AC5 → `/dashboard/warmth`; Dev Notes: badge `warmth/client.tsx:40-60`, filter same file; remove dead `client.tsx:577-595` |
| `docs/stories/completed/story-11.5-warmth-decay.md`              | AC1 engagement = email click; AC3 = max **clicked** created_at or signup; remove NOT STARTED                                          |
| `docs/stories/completed/story-11.6-epic-11-tests.md`             | AC1 401; list `webhook-resend`, `cron-warmth`, `warmth-batch`, `warmth-panel`, `dashboard-segments`, banner tests                     |
| `docs/stories/completed/story-11.0-resend-webhook.md`            | Note 401 + multi-waitlist fix landed in 15.2                                                                                          |
| `docs/stories/completed/story-11.3-warmth-distribution-panel.md` | AC3 hot = `bg-accent`; AC6 pointer to 12.3.3 page Pro-gate + 15.4                                                                     |

Do not invent product behavior — only reconcile ACs with locked decisions + shipped code.

### T2 — Vision amendments (`docs/product-vision-mvp-waitlist-tool.md`)

| Area                              | Change                                                                                                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~150 open rate/click tracking row | Replace “required for warmth accuracy / Warm not Hot” with: opens excluded due to Apple MPP preloading; clicks + referrals + qual are MVP signals; open tracking optional v1.1 analytics only if ever |
| ~211 Warmth tracking bullet       | Drop “email open tracking via Resend webhooks (elevated…)” as warmth requirement; keep Hot/Warm/Cold + segmented broadcast                                                                            |
| ~414 / ~477 Sprint 3 goal rows    | Same: not “open tracking feeding warmth score”                                                                                                                                                        |

Keep click tracking via webhooks (true). Do not claim leaderboard visits feed score.

### T3 — MEMORY

Append under Sprint 3 / new **Epic 15** section:

- Decisions: drop reply/visit weights; click-only decay + signup fallback; engaged zero → cold; vercel.json cron `0 5 * * *`; badge/filter on warmth page only; Hot ≥70 unchanged; opens never in score.
- Gotchas: referral batch `.in("referrer_id", pageIds)`; day boundary `>= 60`; settings helper is cold-% not score; segments need wid + requirePro.
- Date: implementation date when stories complete.

### T4 — Audit + Epic 11 index

- In `engine-audit-5-engines.md` §2.4 / §2.9: for each 🔴/🟠 fixed by 15.0–15.4, append `→ fixed Epic 15.x` or flip to ✅ with story id **after** 15.5 green.
- Leave as debt: negative signals, 90-day floor debate, orphan public API, local webhook without public URL.
- `docs/epics/completed/epic-11-warmth-tracking.md` story index: mark accurately (11.2 done on warmth page; others done with 15.x hardening).

### T5 — Commands

```bash
pnpm lint
pnpm build
```

## Files to Create/Modify

| File                                              | Action                 |
| ------------------------------------------------- | ---------------------- |
| `docs/stories/completed/story-11.*.md`            | Patch ACs/Dev Notes    |
| `docs/product-vision-mvp-waitlist-tool.md`        | Opens claim amendments |
| `.memory/MEMORY.md`                               | Epic 15 decisions      |
| `docs/scans/engine-audit-5-engines.md`            | §2 residual status     |
| `docs/epics/completed/epic-11-warmth-tracking.md` | Index accuracy         |

## Implementation Status

**Status: IMPLEMENTED (2026-09-25)** — all 9 ACs verified by review-read after each phase; gates green.

| AC                | Status | Evidence                                                                                                                                                                                                    |
| ----------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 Story 11.1    | ✅     | `story-11.1-warmth-calculation.md`: AC2 = click +5 / referral +15 / qual +8 only; AC3/AC5/AC6 match 15.0 tier + decay rules; AC8 = vercel.json `0 5 * * *` + `CRON_SECRET`; Dev Notes SUPERSEDED notes      |
| AC2 Story 11.2    | ✅     | AC1–AC5 rewritten → `/dashboard/warmth`; dead `dashboard/client.tsx:577–595` refs removed; badge `warmth/client.tsx:49–55`, filter `:188–199`                                                               |
| AC3 Story 11.5    | ✅     | AC1/AC3 agree: most recent **clicked** + `subscribers.created_at` fallback; "NOT STARTED" removed; status → done                                                                                            |
| AC4 Story 11.6    | ✅     | AC1 = **401** for missing/failed signature; AC3–AC5 name 15.5 files; 11.0 status block (401s, svix pre-check, multi-waitlist fix, `after()`, 6-stored/8-CHECK event types) + 11.3 Dev Notes = 15.4 outcomes |
| AC5 Vision opens  | ✅     | 5 sites amended (`:130`, `:150`, `:211`, `:414`, `:477`) — opens excluded (Apple MPP), clicks/referrals/qual = MVP signals; two sweep searches clean                                                        |
| AC6 MEMORY        | ✅     | `## Epic 15 Progress (Warmth Engine Fix & Hardening)` block: story table (15.1/15.2 🟡 in-progress), decisions, gotchas, date 2026-09-25                                                                    |
| AC7 Audit §2      | ✅     | §2.4 rows 1–14, 16, 17, 20 flipped ✅ + story-linked (15.0–15.5); rows 15/18/19 left as residual debt; §2.9 Update block appended (all 9 must-fix items + residual debt list)                               |
| AC8 Epic 11 index | ✅     | Epic-11 doc: header → done, index all `done` (11.2 = done (warmth page)), 8 embedded statuses flipped, 8 stale Dev Notes blocks rewritten (zero NOT STARTED/NOT DONE remain); story files 11.4/11.7 → done  |
| AC9 Lint + build  | ✅     | `pnpm lint` → 0 errors, 5 pre-existing warnings (baseline); `pnpm build` → exit 0, full route table compiled                                                                                                |

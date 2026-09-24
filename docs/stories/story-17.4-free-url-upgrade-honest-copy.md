# Story 17.4 — Free Direct-URL Upgrade + Honest Success Copy

**Status:** ready
**Epic:** 17 — Broadcasting Engine Fix
**Depends on:** 17.0, 17.2
**Design Refs:** Upgrade modal trigger #4 (`docs/design/sprint-3-design-specs.md` §S9); success card `client.tsx:103-121`; Story 12.3 AC7/AC8
**Source:** [Audit §5 claim 10](../scans/engine-audit-5-engines.md#5-broadcasting--%EF%B8%8F-not-functional-verified-rescan-confidence-98), [Epic 17 Standing Decisions B7/B11](../epics/epic-17-broadcast-engine-fix.md), [Story 12.3 AC7/AC8](../stories/completed/story-12.3-broadcast-email.md), PRD L171 / REQ-7.1a

## Story

As a founder, I want a clear upgrade path if I land on Broadcast while Free, and success copy that doesn’t overclaim delivery — so gating and trust match Story 12.3 AC7/AC8.

## Acceptance Criteria (EARS)

- AC1: When an unauthenticated user hits `/dashboard/broadcast`, behavior shall remain redirect to `/signin` (existing).
- AC2: When a **Free** authenticated user hits `/dashboard/broadcast` directly, the page shall **not** only `redirect("/dashboard")` with no explanation. It shall present the upgrade path consistent with Story 12.3 AC8 (upgrade modal open with trigger `broadcast`, or an interstitial that triggers the same modal) — Standing Decision B11. Sidebar lock path (`sidebar.tsx:314-325`) shall remain unchanged.
- AC3: Success screen shall not claim inbox **delivery** for Batch API accept/queue. Interim wording shall use honest “sent/queued/accepted” semantics pending founder **COPY GAP** approval of exact strings (Standing Decision B7). Until COPY GAP is approved, ship with a marked string constant and do not treat current “has been delivered” as final.
- AC4: Failure path (from Stories 17.0/17.2 `ok: false` / non-2xx) shall display error text and remain on compose (no false success) — coordinated with 17.2 AC6.
- AC5: Story 12.3 AC7 wording debt (“Email sent to {N} subscribers.”) shall be resolved either by matching approved copy or by amending the AC in Story 17.7 — this story implements whatever founder-approved string is chosen.
- AC6: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1–AC2) Free direct URL upgrade path
- T2 (AC3–AC5) success/failure copy
- T3 (AC6) Lint + build

## Out of Scope

- Modal component build (exists from Epic 13.1)
- Sidebar lock changes (`sidebar.tsx` already correct)
- API status shape (Story 17.0)
- Doc amendments (Story 17.7)

## Dev Notes

### Files

| File                                     | Line(s)  | Issue                                       |
| ---------------------------------------- | -------- | ------------------------------------------- |
| `src/app/dashboard/broadcast/page.tsx`   | L28-30   | Free → silent `redirect("/dashboard")`      |
| `src/app/dashboard/broadcast/client.tsx` | L103-121 | success card may claim “has been delivered” |
| `components/dashboard/sidebar.tsx`       | L314-325 | lock → modal (leave unchanged)              |
| Shell / DashboardContext                 | —        | upgrade listener pattern for `?upgrade=`    |

### T1 — Free direct URL (AC1–AC2)

**Unauthenticated:** keep redirect to `/signin`.

**Free authenticated:** server `page.tsx` cannot open modal. Options:

| Option | Approach                                                            | When                           |
| ------ | ------------------------------------------------------------------- | ------------------------------ |
| (a)    | Client FreeGate child calls `setUpgradeModal` via Dashboard context | Context available on page      |
| (b)    | Redirect `/dashboard?upgrade=broadcast` → shell opens modal         | Same pattern as `?upgrade=cap` |

**Prefer (b)** if context wiring from broadcast page is awkward — check `DashboardContext` / shell upgrade listeners before choosing; document choice in PR. Trigger source string `"broadcast"` for modal analytics/cooldown if pattern exists.

Sidebar lock path unchanged (B11).

### T2 — honest success/failure copy (AC3–AC5)

Current success (~L103-121) may say “has been delivered” — **overclaim**: Batch API accept/queue ≠ inbox delivery; real delivery is Epic 11 webhook `delivered`.

- Interim: use honest sent/queued/accepted semantics.
- **COPY GAP (B7):** exact final string requires founder approval — mark constant:

```ts
// COPY GAP B7 — founder approval required; do not treat as final
const SUCCESS_COPY = "…"; // interim honest wording
```

- Failure (from 17.0/17.2): show `errors` / `error`, stay on compose — no success screen.
- Story 12.3 AC7 (“Email sent to {N}”) resolved here **or** amended in 17.7 — implement founder-approved string when available.

Never invent free-form marketing copy beyond marked constants.

### T3 — lint/build (AC6)

`pnpm lint && pnpm build`. Manual gate: founder signs off COPY GAP before shipping final strings; interim constants acceptable for code merge if flagged.

### Implementation order inside story

1. T1 Free gate (a or b — document)
2. T2 success/failure strings with COPY GAP marker
3. Confirm 17.0 502 + 17.2 error path wired
4. `pnpm lint && pnpm build`
5. Flag COPY GAP to founder

## Files to Create/Modify

| File                                     | Change                                                |
| ---------------------------------------- | ----------------------------------------------------- |
| `src/app/dashboard/broadcast/page.tsx`   | Free upgrade path (replace silent dashboard redirect) |
| `src/app/dashboard/broadcast/client.tsx` | Success/failure copy constants                        |
| Possibly shell/context files             | Only if option (a) chosen                             |

## Risk

- Depends on 17.0 honest status + 17.2 error handling for AC4 — land those first.
- COPY GAP can block “final” copy but not code merge if interim strings marked.
- Do not regress Pro users (they skip the Free gate).

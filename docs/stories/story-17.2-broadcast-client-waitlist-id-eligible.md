# Story 17.2 — Broadcast Client: waitlist_id + eligible UX

**Status:** ready
**Epic:** 17 — Broadcasting Engine Fix
**Depends on:** 17.1
**Design Refs:** C3 compose form (`docs/design/sprint-3-design-specs.md` §C3); segment pills already in `client.tsx` (keep pill UI, not C3’s `<select>` — pills are current implementation + Story 12.4 AC1)
**Source:** [Audit §5 claim 1](../scans/engine-audit-5-engines.md#5-broadcasting--%EF%B8%8F-not-functional-verified-rescan-confidence-98), [Epic 17 Standing Decisions B1/B3/B15/B17](../epics/epic-17-broadcast-engine-fix.md), [Story 12.3](../stories/completed/story-12.3-broadcast-email.md), [Story 12.1.8](../stories/completed/story-12.1.8-broadcast-duplicate-fixes.md)

## Story

As a Pro founder, I want the compose form to target the correct waitlist and show deliverable counts — so my send actually goes out and the confirm number matches reality.

## Acceptance Criteria (EARS)

- AC1: `BroadcastClient` shall **destructure and use** `waitlistId` (already a prop from `page.tsx:55`) and include **`waitlist_id`** in `POST /api/dashboard/broadcast` JSON body alongside `subject`, `body`, `segment` (Standing Decision B1; audit §5 claim 1). The send shall no longer 400 for missing `waitlist_id`.
- AC2: On mount (and when `waitlistId` changes), the client shall fetch `/api/dashboard/broadcast/segments?wid={waitlistId}` and store `{ all, hot_warm, cold }` (Standing Decision B3 / B2 consumer).
- AC3: Segment pill labels, the “Send to {N} subscribers” line, the `window.confirm` message, and the Send button label shall all use the **same eligible count** from segments (no separate raw `subscriberCount` path).
- AC4: Default segment state shall remain **`"all"`** (Standing Decision B17 / PRD L123).
- AC5: Client-side validation shall enforce subject `≤ 200` and body `≤ 10_000` (shared constants from Story 17.0) in addition to existing non-empty checks; invalid input disables Send (mirror server 400).
- AC6: On `200 { ok: true, recipient_count }`, client shall show success treatment using `recipient_count` (exact success string: existing “Sent to {n}…” refined in Story 17.4 if COPY GAP). On non-2xx or `{ ok: false }`, client shall show the API `errors` / `error` message (or network error string) and **shall not** show the success screen.
- AC7: Dead `subscriberCount` prop shall be removed from the client interface **or** documented as unused fallback — prefer **remove** from `BroadcastClientProps` if no UI reads it after AC3 (Standing Decision B15); page may stop passing it if unused.
- AC8: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) include waitlist_id in POST body
- T2 (AC2–AC3) segments?wid= + eligible UX
- T3 (AC4–AC5) default all + length caps
- T4 (AC6–AC7) honest status + prop cleanup
- T5 (AC8) Lint + build

## Out of Scope

- API behavior (Stories 17.0, 17.1)
- Preview From address (Story 17.3)
- Free upgrade direct-URL (Story 17.4)
- HTML sanitization UX (Story 17.5 — wires same preview sink)
- Broadcast history

## Dev Notes

### Primary file — `src/app/dashboard/broadcast/client.tsx`

Current defects (audit §5 claim 1, issues):

| Line(s) | Defect                                                                             |
| ------- | ---------------------------------------------------------------------------------- |
| 24–26   | destructure only `{ productName, senderName }` — **`waitlistId` prop unused**      |
| 77      | POST body `{ subject, body, segment }` — **no `waitlist_id` → API 400 every send** |
| 45–54   | segments fetch without `?wid=` → multi-waitlist wrong / `.single()` break upstream |
| 66–68   | confirm uses `activeCount` — must be eligible count from segments                  |
| 24–28   | `subscriberCount` prop may be dead after AC3                                       |

### T1 — waitlist_id (AC1) — **critical path**

Minimal fix:

```ts
// destructure
const { productName, senderName, headline, waitlistId /* … */ } = props;

// POST body
const res = await fetch("/api/dashboard/broadcast", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    subject,
    body,
    segment: activeSegment,
    waitlist_id: waitlistId, // Standing Decision B1
  }),
});
```

This alone unblocks every send. Can ship ahead of rest if split PR.

### T2 — segments?wid= + eligible UX (AC2–AC3)

```ts
useEffect(() => {
  if (!waitlistId) return;
  fetch(`/api/dashboard/broadcast/segments?wid=${waitlistId}`)
    .then((r) => r.json())
    .then(setSegments);
}, [waitlistId]);
```

Derive single `eligibleCount = segments[activeSegment] ?? 0`. Use it for:

- pill badge counts
- “Send to {N} subscribers”
- `window.confirm(...)`
- Send button label if it shows N

No path through raw `subscriberCount`.

### T3 — default + caps (AC4–AC5)

- Initial segment state `"all"` (do not default `"cold"` — B17, PRD L123).
- Import `BROADCAST_SUBJECT_MAX` / `BROADCAST_BODY_MAX` from 17.0 exports (or shared lib) — disable Send when `subject.length > MAX` or `body.length > MAX` or empty-after-trim.

### T4 — honest status + prop cleanup (AC6–AC7)

```ts
if (!res.ok) {
  const err = await res.json().catch(() => null);
  setError(err?.errors?.[0] || err?.error || "Send failed");
  return;
}
const data = await res.json();
if (data.ok === false) {
  setError(data.errors?.[0] || "Send failed");
  return;
}
setSuccessCount(data.recipient_count);
```

Never show success screen on `ok: false` / non-2xx. Keep `sending` guard (B9 client half). Remove `subscriberCount` from props if unused; stop passing from page if removed.

Do not invent new success strings — COPY GAP lives in 17.4.

### T5 — lint/build (AC8)

Keep pill UI (Story 12.4 AC1). `pnpm lint && pnpm build`.

### Implementation order inside story

1. T1 waitlist_id one-liner (can ship alone)
2. T2 segments?wid=
3. T3 default + caps
4. T4 honest status + prop cleanup
5. `pnpm lint && pnpm build`

## Files to Create/Modify

| File                                       | Change                                            |
| ------------------------------------------ | ------------------------------------------------- |
| `src/app/dashboard/broadcast/client.tsx`   | Primary fix (all ACs)                             |
| `src/app/dashboard/broadcast/page.tsx`     | Stop passing dead `subscriberCount` if removed    |
| `src/app/api/dashboard/broadcast/route.ts` | Export length constants (from 17.0) or shared lib |

## Risk

- **Critical:** shipping 17.1 without 17.2 still leaves sends 400 — prioritize T1.
- 17.2 depends on 17.1 contract for eligible counts; interim: if segments still returns raw counts, UX improves only after 17.1.
- Success string may still say “delivered” until 17.4 COPY GAP — acceptable interim only if `ok: false` path never shows it.

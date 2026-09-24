# Story 16.1 — Updates Client Publish Flow + Honest Status

**Status:** ready
**Epic:** 16 — Leaderboard & Founder Updates Engine Fix
**Depends on:** 16.0
**Design Refs:** Story 12.1.4 compose layout (textarea + Publish + recent list) — no HF SVG
**Source:** [Audit §4 claims 2, 6, 12, 14](../scans/engine-audit-5-engines.md), [Story 12.1.4](../stories/completed/story-12.1.4-founder-updates-compose.md), [Epic 16 Standing Decisions U4/U6](../epics/epic-16-leaderboard-updates-engine-fix.md)

## Story

As a founder, I want the compose form to target the correct waitlist and tell me whether emails actually sent — so I trust the Updates feature after publishing.

## Acceptance Criteria (EARS)

- AC1: `/dashboard/updates/page.tsx` shall pass the resolved `waitlist.id` into `UpdatesClient` (new prop `waitlistId: string`); the client shall include `waitlist_id` in the POST body (Standing Decision U4 / audit §4 claim 2).
- AC2: On 201 with `emailSent: true`, the client shall show the existing success treatment (Story 12.1.4 AC4 — "Published!" or founder-approved replacement) and clear the textarea.
- AC3: On 201 with `emailSent: false` (or `emailError` present), the client shall **not** show the unqualified success string; it shall show a distinct failure/outcome message (**COPY GAP** — founder must approve the exact string; until approved, ship behind a clearly marked TODO/string constant and do not invent final copy in code review).
- AC4: On non-2xx or thrown network error, the client shall continue to display the API error (Story 12.1.4 AC5) — preserved behavior.
- AC5: Client min-10/max-2000 validation shall remain (Story 12.1.4 AC2); no change to placeholder/history/date rendering.
- AC6: Recent-updates list prepend behavior on successful insert shall remain (optimistic local state with returned `id`).
- AC7: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) pass waitlistId + send waitlist_id
- T2 (AC2–AC4) emailSent-aware messaging
- T3 (AC5–AC6) preserve existing UX
- T4 (AC7) Lint + build

## Out of Scope

- Server validation (16.0)
- Confirmation dialog (broadcast has one; Story 12.1.4 never promised one for updates — do not add unless founder asks)
- Dark card (16.2)
- Full test suite (16.3 — minimal smoke optional here)

## Dev Notes

### T1 — waitlist_id plumbing (AC1)

**Server** `src/app/dashboard/updates/page.tsx`:

- Already resolves `waitlist` via `maybeSingle()` / `?wid=` (L32-42).
- Today returns `<UpdatesClient updates={updates ?? []} />` (L51) — **does not pass id**.
- Change to `<UpdatesClient updates={updates ?? []} waitlistId={waitlist.id} />`.
- Multi-waitlist bare URL: `maybeSingle()` with 2+ rows returns null → redirect `/onboarding/1` (audit claim 2). **Improve:** when no `wid` and multiple waitlists exist, still need a deterministic pick or a picker — **minimum for AC1:** keep `?wid=` scoping; when `waitlist` is null due to multiple rows, either order by `created_at`/`id` and pick one (document) or surface an error. Do **not** redirect to onboarding for a Pro founder who already has waitlists. Recommended: `.order("created_at", { ascending: false }).limit(1)` when no `wid` (matches Epic 12.4.0 newest-waitlist pattern noted in 14.4 AC5).

**Client** `src/app/dashboard/updates/client.tsx`:

```ts
interface UpdatesClientProps {
  updates: Update[];
  waitlistId: string;
}

// in handlePublish:
body: JSON.stringify({ body, waitlist_id: waitlistId }),
```

### T2 — emailSent-aware messaging (AC2–AC4)

```ts
const data = await res.json();

if (!res.ok) {
  setError(data.error || "Failed to publish update");
  return;
}

setBody("");
setUpdates((prev) => [
  { id: data.id, body, created_at: new Date().toISOString() },
  ...prev,
]);

const emailSent = data.emailSent !== false; // backward compat if field missing
if (emailSent) {
  setSuccess(true);
  setTimeout(() => setSuccess(false), 3000);
} else {
  setError(/* COPY GAP: founder-approved failure string */);
}
```

**COPY GAP U6:** exact failure string requires founder approval. Options to present (do not ship unapproved):

- "Saved, but email delivery failed — try again or check your sending settings."
- "Update saved. Emails could not be sent."  
  Until approved: use a module-level constant `const EMAIL_FAILED_COPY = "TODO_COPY_GAP: ..." ` or hold the branch behind approval — prefer constant + PR note so tests can assert the constant.

Never show both success and failure for the same response.

### T3 — preserve UX (AC5–AC6)

- Keep `isValid = charCount >= 10 && charCount <= 2000` (L25).
- Keep optimistic prepend only after `res.ok` (L49-52).
- Keep network catch → "Network error — please try again" (AC4).
- Do not reintroduce Sidebar (layout owns shell — Epic 12.3.5).

### T4 — lint/build

`pnpm lint && pnpm build`.

## Files to Create/Modify

| File                                   | Change                                                    |
| -------------------------------------- | --------------------------------------------------------- |
| `src/app/dashboard/updates/page.tsx`   | Pass `waitlistId`; multi-waitlist default pick fix        |
| `src/app/dashboard/updates/client.tsx` | Send `waitlist_id`; branch success/failure on `emailSent` |

## Risk

- **COPY GAP blocks AC3 ship** — code can land with constant; production string waits for founder.
- Mid-deploy order: if client ships before API returns `emailSent`, `!== false` treats missing as success (safe default matching old behavior).

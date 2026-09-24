# Story 17.0 — Broadcast API Response Honesty & Send Hygiene

**Status:** ready
**Epic:** 17 — Broadcasting Engine Fix
**Depends on:** —
**Design Refs:** — (API only; no SVG)
**Source:** [Audit §5 Broadcasting](../scans/engine-audit-5-engines.md#5-broadcasting--%EF%B8%8F-not-functional-verified-rescan-confidence-98), [Epic 17 Standing Decisions B4/B9/B12–B14](../epics/epic-17-broadcast-engine-fix.md), [PRD L171 Unsubscribe mechanism](../PRD.md), [PRD REQ-7.1a.1–4 Never Audiences](../PRD.md), Resend Batch API + Idempotency docs

## Story

As a platform, I want broadcast sends to report truthfully, generate unsubscribe URLs once, batch-check bounces, enforce length caps, and use per-chunk idempotency keys — so partial/total failures never look like success and double-sends are prevented.

## Acceptance Criteria (EARS)

- AC1: `POST /api/dashboard/broadcast` shall validate `subject` non-empty after trim and `≤ 200` characters and `body` non-empty after trim and `≤ 10_000` characters; violations shall return **400** with a JSON error (Standing Decision B13). Existing `waitlist_id` required and `requirePro` 403/401 gates shall be preserved.
- AC2: After a send attempt, if **zero** chunks succeeded (`totalSent === 0` and at least one batch was attempted), the API shall **not** return `ok: true`. It shall return HTTP **502** (or documented non-2xx) with `{ ok: false, recipient_count: 0, errors: string[] }` (Standing Decision B4). On full or partial success (≥1 chunk), HTTP **200** `{ ok: true, recipient_count, errors?: [] }` where `recipient_count` is the sum of successfully sent chunk lengths only.
- AC3: Every `resend.batch.send(...)` call shall pass an **idempotency key** unique per request/chunk (e.g. `broadcast/{waitlist_id}/{chunkIndex}` or a per-attempt UUID retained across retries of the same logical attempt), length ≤ 256 chars (Standing Decision B9; Resend Batch Idempotency docs). Keys shall not be regenerated per subscriber.
- AC4: Unsubscribe URL shall be generated **once per recipient** and reused for both `List-Unsubscribe` header and body footer (Standing Decision B14). `generateUnsubscribeUrl` / footer generation shall be wrapped so a missing `UNSUBSCRIBE_SECRET` fails the request **before** any `batch.send` (fail-fast, no partial silent send). The route shall not call `generateUnsubscribeUrl` twice for the same subscriber.
- AC5: Bounce suppression for eligibility shall use a **batched query** against `bounced_emails` for the waitlist (`.in("email", …)` or equivalent set membership), not a sequential `await isEmailBounced` per row (Standing Decision B12). Unsubscribed (`unsubscribed_at` non-null) exclusion shall remain (existing behavior).
- AC6: The `broadcasts` insert result shall be checked; on insert failure the response shall include an error field or log at `error` level — never silently drop history (Standing Decision B10 partial: history row still written on success path).
- AC7: Auth (401), `requirePro` (403), missing `waitlist_id` (400), missing waitlist / not owner (404), empty eligible set (400 existing) shall remain. No change to segment filter semantics (`all` | `hot_warm` | `cold`; unscored only in `all`).
- AC8: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) subject/body length caps
- T2 (AC2) honest ok/failure response
- T3 (AC3) per-chunk idempotency keys
- T4 (AC4–AC5) single unsubscribe gen + batched bounces
- T5 (AC6–AC8) insert check + preserve gates + lint/build

## Out of Scope

- Client UX (Story 17.2)
- Preview From (Story 17.3)
- HTML sanitization (Story 17.5)
- Free direct-URL upgrade (Story 17.4)
- Broadcast history read UI (Standing Decision B10 defer)
- Segments route (Story 17.1)

## Dev Notes

### Primary file — `src/app/api/dashboard/broadcast/route.ts`

Current defects (audit §5):

| Line(s) | Defect                                                                                 |
| ------- | -------------------------------------------------------------------------------------- |
| 44–49   | empty-only validation — no subject/body max length                                     |
| 88–92   | sequential `isEmailBounced` N+1 per subscriber                                         |
| 115     | `generateUnsubscribeUrl` in route **and** `email.ts:135` in footer → double call       |
| 140–147 | `resend.batch.send` without idempotency key                                            |
| 142–159 | always `ok: true` even when every batch failed; `broadcasts` insert `.error` unchecked |

### T1 — length caps (AC1)

Export shared constants so client (17.2) can import:

```ts
export const BROADCAST_SUBJECT_MAX = 200;
export const BROADCAST_BODY_MAX = 10_000;
```

Validate after trim: subject/body empty or over cap → `NextResponse.json({ error }, { status: 400 })`. Preserve existing `waitlist_id` required (L37-42) and `requirePro` (L29-32).

### T2 — honest response (AC2)

Track per-chunk outcome:

```ts
const errors: string[] = [];
let totalSent = 0;
let batchesAttempted = 0;

// inside loop after each batch:
if (result.error) {
  errors.push(result.error.message ?? "Batch failed");
} else {
  totalSent += chunk.length;
}

// after loop:
if (batchesAttempted > 0 && totalSent === 0) {
  return NextResponse.json(
    {
      ok: false,
      recipient_count: 0,
      errors: errors.length ? errors : ["All batches failed"],
    },
    { status: 502 }
  );
}
return NextResponse.json(
  {
    ok: true,
    recipient_count: totalSent,
    errors: errors.length ? errors : undefined,
  },
  { status: 200 }
);
```

Partial success (≥1 chunk, some errors): **200 `ok: true`** with `errors` populated so client can surface warnings. Keep `recipient_count` name for client compatibility (17.2 AC6).

### T3 — idempotency keys (AC3)

Verify installed `resend` SDK supports options on `batch.send`:

```ts
await resend.batch.send(emails, {
  idempotencyKey: `broadcast/${waitlist_id}/${chunkIndex}`, // ≤256 chars, 24h window
});
```

If SDK option name differs (check `node_modules/resend` types), fall back to documented `Idempotency-Key` header pattern. Key is **per chunk of one request**, not per subscriber. Double-send defense: client `sending` guard (17.2) + this key (Standing Decision B9).

### T4 — single unsubscribe gen + batched bounces (AC4–AC5)

**Unsubscribe once:** generate URL before map, reuse:

```ts
const unsubUrl = generateUnsubscribeUrl(sub.id); // may throw if UNSUBSCRIBE_SECRET missing
const html = buildHtmlWithFooter(sub, unsubUrl); // helper accepts URL — adjust email.ts helper signature if needed
headers: {
  "List-Unsubscribe": `<${unsubUrl}>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
},
```

Fail-fast: wrap generation for first recipient (or pre-flight secret check) **before** the batch loop so missing `UNSUBSCRIBE_SECRET` returns 500/503 without any `batch.send`. Do not call `generateUnsubscribeUrl` twice.

**Batched bounces** (replace L88-92):

```ts
const { data: bounced } = await adminSupabase
  .from("bounced_emails")
  .select("email")
  .eq("waitlist_id", waitlist.id);
const bouncedSet = new Set((bounced ?? []).map((b) => b.email));
const eligible = subscribers.filter(
  (s) => !s.unsubscribed_at && !bouncedSet.has(s.email)
);
```

Keep unsubscribed filter. Use admin client if `bounced_emails` RLS requires it (same as `isEmailBounced`).

### T5 — insert check + preserve gates (AC6–AC7)

```ts
const { error: insertError } = await supabase.from("broadcasts").insert({...});
if (insertError) {
  console.error("broadcasts insert failed:", insertError);
  // include in response errors or log only — do not mask send success
}
```

Do **not** change: custom HMAC unsubscribe (B5), no Resend Audiences (B18), segment filter semantics, 401/403/400/404 gates.

### Implementation order inside story

1. T1 length constants + validation
2. T2 response honesty tracking
3. T3 idempotency keys on existing loop
4. T4 unsubscribe once + batched bounces
5. T5 insert check + confirm gates unchanged
6. `pnpm lint && pnpm build`

## Files to Create/Modify

| File                                       | Change                                             |
| ------------------------------------------ | -------------------------------------------------- |
| `src/app/api/dashboard/broadcast/route.ts` | Primary hardening (all ACs)                        |
| `src/lib/email.ts`                         | Adjust footer helper to accept pre-built unsub URL |
| `src/lib/unsubscribe.ts`                   | Optional: export secret pre-flight check           |

## Risk

- Response shape: total failure becomes **502** — client (17.2) must handle non-2xx; if 17.0 ships first, client still shows generic error (acceptable interim).
- Idempotency option may not exist on installed SDK — verify types before coding; document fallback.
- Bounce batch query must respect RLS / admin client — reuse `createAdminClient()` pattern from `src/lib/bounces.ts`.
- Do not wholesale-escape HTML here (17.5 owns sanitization).

# Story 15.2 — Resend Webhook Ingestion Hardening

**Status:** in-progress
**Epic:** 15 — Warmth Engine Fix & Hardening
**Depends on:** —
**Design Refs:** — (API)
**Source:** [Audit §2 claims 8, 12, 13, 20](../scans/engine-audit-5-engines.md), [Story 11.0](completed/story-11.0-resend-webhook.md), Resend Webhooks docs

## Story

As a platform, I want Resend webhooks to fail closed with correct status codes, attribute events to every correct waitlist subscriber, and never double-insert so warmth inputs stay trustworthy.

## Acceptance Criteria (EARS)

- AC1: Missing `svix-id` / `svix-timestamp` / `svix-signature` headers shall return **401** (not 400).
- AC2: Invalid signature (verification throws) shall return **401** (not 400).
- AC3: Unknown or unsupported event types shall return **200** `{ received: true }` without inserting.
- AC4: Subscriber resolution shall not depend solely on `.limit(1).single()` when the same email exists on multiple waitlists; events shall insert for **every** matching subscriber row, **or** when send-time `metadata.waitlist_id` / `metadata.subscriber_id` is present, only for that target.
- AC5: Duplicate delivery of the same Svix message id shall not create a second `email_events` row for the same waitlist — application pre-check **and** unique index on `(waitlist_id, (event_data->>'svix_id'))` where svix id is not null.
- AC6: Bounce/complaint side effects (`bounced_emails`, `unsubscribed_at`) shall remain correct for each resolved subscriber row.
- AC7: Send paths that can pass metadata (`sendEmail`, broadcast batch, updates batch) shall pass `metadata: { waitlist_id, subscriber_id }` when known; paths that cannot shall be listed in Dev Notes (AC4 multi-insert is the fallback).
- AC8: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1–AC3) Status codes on header/signature failures
- T2 (AC4, AC7) Multi-waitlist resolution + optional send metadata
- T3 (AC5) SQL unique index + insert conflict handling
- T4 (AC6) Preserve bounce/complaint behavior across rows
- T5 (AC8) Lint + build

## Out of Scope

- Webhook unit tests (Story 15.5)
- Feeding opens/clicks into scores (15.0 owns scoring)
- Inbound reply handling (`email.received`)
- Deleting orphaned public `/api/warmth/[subdomain]`
- Changing Svix/Resend secret configuration

## Dev Notes

### T1 — Status codes

File: `src/app/api/webhooks/resend/route.ts`

| Location                     | Current               | Target          |
| ---------------------------- | --------------------- | --------------- |
| `:39-44` missing headers     | **400**               | **401**         |
| `:57-59` invalid signature   | **400**               | **401**         |
| `:64-66` unknown type        | 200 `{received:true}` | unchanged (AC3) |
| `:71-73` no email on payload | 200                   | unchanged       |
| `:140` success               | 200 `{received:true}` | unchanged       |

```ts
if (!svixId || !svixTimestamp || !svixSignature) {
  return NextResponse.json({ error: "Missing svix headers" }, { status: 401 });
}
// ...
} catch {
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
}
```

Aligns Story 11.0 / 11.6 AC wording. Resend treats non-2xx as failure — 401 is correct for auth failures.

### T4 — Multi-waitlist resolution (AC4)

**Current bug `:81-86`:**

```ts
const { data: subscriber } = await supabase
  .from("subscribers")
  .select("id, waitlist_id")
  .eq("email", email)
  .limit(1)
  .single(); // arbitrary waitlist when email exists N times
```

**Fallback (always safe):**

```ts
const { data: matches } = await supabase
  .from("subscribers")
  .select("id, waitlist_id")
  .eq("email", email);

// for each match → idempotent insert + side effects scoped to match.waitlist_id
```

**Metadata path (preferred when AC7 done):**

```ts
const meta = data?.metadata as
  { waitlist_id?: string; subscriber_id?: string } | undefined;

if (meta?.subscriber_id) {
  // load that subscriber only; verify email matches if desired
} else if (meta?.waitlist_id) {
  // .eq("email", email).eq("waitlist_id", meta.waitlist_id)
} else {
  // multi-insert all matches
}
```

Idempotency key remains `svixId` stored in `event_data.svix_id`, scoped per `waitlist_id` (AC5).

### T3 — SQL (user runs before relying on race safety)

**File:** `docs/stories/sql-writeups/epic15-story2-email-events-svix-unique.sql`

```sql
-- Epic 15 Story 15.2: race-safe webhook idempotency
CREATE UNIQUE INDEX IF NOT EXISTS email_events_svix_uidx
  ON email_events (waitlist_id, (event_data ->> 'svix_id'))
  WHERE event_data ->> 'svix_id' IS NOT NULL;
```

**Insert path:** keep cheap pre-check:

```ts
.filter("event_data->>'svix_id'", "eq", svixId)
.eq("waitlist_id", waitlistId)
```

Then insert; on unique violation (Postgres 23505 / Supabase error code), swallow and return `{ received: true }`.

**Manual gate:** founder runs SQL in Supabase SQL Editor. Until then, pre-check alone still works (non-racy enough for low volume) but AC5 full guarantee is pending.

### T2 — Send metadata (AC7)

| Path          | File                                                   | Change                                                      |
| ------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| Transactional | `src/lib/email.ts` `sendParams`                        | Optional `metadata` on `resend.emails.send` when SDK allows |
| Broadcast     | `src/app/api/dashboard/broadcast/route.ts` batch array | `metadata: { waitlist_id, subscriber_id }` per row          |
| Updates       | `src/app/api/updates/route.ts`                         | `metadata: { waitlist_id }` if batch supports               |

If Resend Batch metadata shape differs, document actual shape in Implementation Status. **Minimum for AC4:** multi-insert fallback works without metadata — metadata is accuracy optimization.

### T4 — Side effects

Loop each resolved subscriber:

1. Idempotent `email_events` insert (`subscriber_id`, `waitlist_id`, `event_type`, `event_data`, `created_at`).
2. If `bounced`/`complained` → `bounced_emails` with **that** `waitlist_id`.
3. If `complained` → update **that** subscriber `unsubscribed_at`.

Keep `after()` offload from `next/server` (already). Keep `req.text()` before verify — never `req.json()`.

### T5 — Commands

```bash
pnpm lint
pnpm build
```

Route tests live in 15.5 (`webhook-resend.test.ts`).

## Files to Create/Modify

| File                                                                   | Change                                     |
| ---------------------------------------------------------------------- | ------------------------------------------ |
| `src/app/api/webhooks/resend/route.ts`                                 | 401s, multi-row resolve, conflict handling |
| `docs/stories/sql-writeups/epic15-story2-email-events-svix-unique.sql` | New — user executes                        |
| `src/lib/email.ts`                                                     | Optional metadata (AC7)                    |
| `src/app/api/dashboard/broadcast/route.ts`                             | Batch metadata (AC7)                       |
| `src/app/api/updates/route.ts`                                         | Batch metadata (AC7) if applicable         |

## Implementation Status

**Status: IMPLEMENTED — pending founder SQL gate (AC5/AC6 full guarantee)**

| AC                      | Status     | Evidence                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 missing headers 401 | ✅         | `route.ts:39-44` returns 401                                                                                                                                                                                                                                                                                                  |
| AC2 invalid sig 401     | ✅         | `route.ts:57-59` returns 401                                                                                                                                                                                                                                                                                                  |
| AC3 unknown type 200    | ✅         | `:64-66` unchanged (plus `:71-73` no-email, `:192` success)                                                                                                                                                                                                                                                                   |
| AC4 multi-waitlist      | ✅         | `.limit(1).single()` replaced by match-list loop `route.ts:91-115`; send-time target read from `data.tags` (Resend's mechanism — no metadata field) with metadata fallback `:79-101`                                                                                                                                          |
| AC5 unique index        | ⏳ founder | App pre-check + `23505` swallow `route.ts:120-151`; SQL at `sql-writeups/epic15-story2-email-events-svix-unique.sql` — **founder must run in Supabase SQL Editor**                                                                                                                                                            |
| AC6 bounce/complaint    | ⏳ founder | Per-row side effects `route.ts:157-185` scoped to each resolved row. Same SQL widens `bounced_emails.email_type` CHECK — webhook writes `'transactional'` but original CHECK only allowed `('confirmation','broadcast')`, so **every bounce insert silently failed (23514) until now**                                        |
| AC7 send metadata       | ✅         | `tags` on all 3 Resend send paths: `email.ts` sendParams (new `waitlistId` param), broadcast batch rows, updates batch rows; 4 transactional callers wired (`subscribers/route.ts` ×3, `milestones.ts`) — cap-warning gets `waitlistId` only (founder recipient, no subscriber). No path remains that "cannot" pass targeting |
| AC8 Lint + build        | ✅         | `pnpm lint` 0 errors / 5 warnings (baseline), `pnpm build` exit 0, full suite 496 passed / 7 failed (= baseline)                                                                                                                                                                                                              |

**Deviations (research-backed, story pre-authorized documenting actual shape):**

- AC7 `metadata` → Resend has **no metadata field** (SDK 6.23.0 types + official docs); `tags: [{name, value}]` is the mechanism on both single and batch sends, echoed by webhook events as a `data.tags` key/value object. Implemented via tags throughout.
- AC4 target path: tags present → query narrowed to `waitlist_id`/`subscriber_id` (+ email match); absent → insert for every matching row (AC4's sanctioned multi-insert fallback).
- Files modified beyond the story's Files table: `src/app/api/subscribers/route.ts` + `src/lib/milestones.ts` (AC7 caller wiring — Files table listed primary send paths, AC7 requires callers to pass "when known").

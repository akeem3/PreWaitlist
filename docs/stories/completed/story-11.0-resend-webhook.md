# Story 11.0 — Resend Webhook Endpoint

**Epic:** 11 — Warmth Tracking Engine
**Status:** done
**Depends on:** 11.7
**Design Refs:** None (backend API route)

## Story

As a developer, I want a webhook endpoint that receives Resend email events (opened, clicked, bounced, complained) so that the system can track subscriber engagement.

## Acceptance Criteria (EARS)

- AC1: The system shall provide a `POST /api/webhooks/resend` route handler that accepts Resend webhook payloads.
- AC2: The endpoint shall verify webhook signatures using Svix (Resend's signing mechanism) with the `RESEND_WEBHOOK_SECRET` environment variable.
- AC3: The endpoint shall store verified events in the `email_events` table with columns: `id`, `subscriber_id` (FK), `waitlist_id` (FK), `event_type` (text, check: in sent/delivered/opened/clicked/bounced/complained), `event_data` (jsonb, nullable), `created_at` (timestamptz).
- AC4: The endpoint shall resolve `email_id` from the webhook payload to a `subscriber_id` by looking up the subscriber's email address.
- AC5: The endpoint shall be idempotent — duplicate events (same Svix message ID) shall not create duplicate rows.
- AC6: The endpoint shall return HTTP 200 within 5 seconds. Heavy processing (score recalculation) shall be deferred, not blocking the response.
- AC7: The endpoint shall handle events out of order — use `created_at` timestamp from the event, not insertion order.
- AC8: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Create webhook route + Svix signature verification · T2 (AC3-AC4) Event storage + email-to-subscriber resolution · T3 (AC5-AC7) Idempotency + ordering + performance · T4 (AC8) Lint + build

## Out of Scope

Score calculation (Story 11.1), bulk event backfill, webhook retry logic (Resend handles retries for 72h).

## Implementation Details

> **Status (Epic 15):** Implemented — `src/app/api/webhooks/resend/route.ts` (hardened by Stories 15.0/15.2). Shipped deltas vs this plan:
>
> - Verification via Resend SDK `resend.webhooks.verify()` (Option A) on the raw `req.text()` body — the `svix` npm package was never added.
> - Missing svix headers → **401** (route:39–42); failed signature → **401** (route:58). The pre-fix 400-vs-401 drift from audit §2.4 finding 20 is corrected.
> - Idempotency: application-level `event_data->>'svix_id'` pre-check **plus** a DB partial unique index `email_events_svix_uidx ON email_events (waitlist_id, (event_data ->> 'svix_id'))` from `docs/stories/sql-writeups/epic15-story2-email-events-svix-unique.sql` — the route catches `23505`. **Run that SQL before deploying Epic 15.**
> - Multi-waitlist attribution (Story 15.2): one event row inserted per matching waitlist — the T2 `.single()` lookup was replaced; covered by `webhook-resend.test.ts:183`.
> - Deferred processing uses `after()` from `next/server` (AC6).
> - Stored event types = exactly AC3's six values. The `EVENT_TYPE_MAP` (route:28–29) collapses `email.failed` → `bounced` and `email.delivery_delayed` → `delivered`, so `failed` / `delivery_delayed` are never written as `event_type`. The DB CHECK (Story 11.7 AC9, `epic11-story7-sprint3-schema.sql:64`) allows 8 values — the two extras are headroom only; AC3's six-value list describes what is actually stored.

### T1: Create webhook route + Svix signature verification

- **New file:** `src/app/api/webhooks/resend/route.ts`
- **New dependency:** `npm install svix` (or use Resend SDK's built-in verification)
- **New env var:** Add `RESEND_WEBHOOK_SECRET` to `.env.local` (get from Resend Dashboard → Webhooks → Signing Secret)

Route skeleton:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // AC2: Use req.text() — NOT req.json()
  // Svix signature breaks if body is re-serialized
  const payload = await req.text();

  // AC2: Verify signature
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  // Verify using Resend SDK or svix library
  // If verification fails → return 401

  // Parse payload AFTER verification
  const body = JSON.parse(payload);

  // AC1: Accept event types: email.sent, email.delivered, email.bounced,
  // email.complained, email.opened, email.clicked, email.failed,
  // email.delivery_delayed

  // ... proceed to T2
}
```

**Critical:** `req.text()` returns raw string. `req.json()` re-serializes and breaks Svix HMAC.

**Svix verification options:**

- Option A: `resend.webhooks.verify({ payload, headers: { 'svix-id', 'svix-timestamp', 'svix-signature' }, secret })` — uses Resend SDK
- Option B: `new Webhook(secret).verify(payload, headers)` — direct svix library

### T2: Event storage + email-to-subscriber resolution

- File: `src/app/api/webhooks/resend/route.ts` (same file, continue after verification)

#### AC4 — Email-to-subscriber resolution

The webhook payload includes `data.to[]` (array of recipient email addresses). Resolution steps:

1. Extract email from `body.data.to[0]` (first recipient)
2. Look up subscriber: `supabase.from("subscribers").select("id, waitlist_id").eq("email", email).single()`
3. If subscriber not found → log warning, skip (don't fail the webhook)
4. Extract `waitlist_id` from the subscriber record

#### AC3 — Event storage

Map Resend event types to `email_events.event_type` values:

- `email.sent` → `sent`
- `email.delivered` → `delivered`
- `email.bounced` → `bounced`
- `email.complained` → `complained`
- `email.opened` → `opened`
- `email.clicked` → `clicked`
- `email.failed` → `failed`
- `email.delivery_delayed` → `delivery_delayed`

Insert into `email_events`:

```typescript
await supabase.from("email_events").insert({
  subscriber_id: subscriber.id,
  waitlist_id: subscriber.waitlist_id,
  event_type: mappedEventType,
  event_data: body.data, // Full payload for debugging
  created_at: body.created_at, // AC7: Use event timestamp, not now()
});
```

**Note:** Story 11.7 must add `event_data jsonb` column and update CHECK constraint before this insert will work.

### T3: Idempotency + ordering + performance

#### AC5 — Idempotency

Store `svix-id` in `event_data` jsonb. Before inserting, check if a row with the same `svix-id` already exists:

```typescript
// Check for duplicate
const { data: existing } = await supabase
  .from("email_events")
  .select("id")
  .eq("waitlist_id", subscriber.waitlist_id)
  .filter("event_data->>'svix_id'", "eq", svixId)
  .limit(1);

if (existing && existing.length > 0) {
  // Duplicate — return 200 silently
  return NextResponse.json({ received: true });
}
```

Alternatively, store `svix_id` as a separate indexed column (cleaner for queries, requires Story 11.7 migration update).

#### AC6 — Performance

Use `waitUntil()` (Vercel/Cloudflare) or fire-and-forget for the Postgres write to keep response fast:

```typescript
// Don't await — fire and forget
const writePromise = supabase.from("email_events").insert({ ... });
// Return 200 immediately
return NextResponse.json({ received: true });
```

Resend has a 15-second response timeout. Returning fast prevents webhook auto-disable.

#### AC7 — Out-of-order handling

Use `created_at` from the webhook payload (not `now()`). Events may arrive late or out of order — the `email_events.created_at` column preserves original timing.

### T4: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any TypeScript errors

## Verification

1. No `svix` install — verification uses the Resend SDK (`resend.webhooks.verify`) on the raw `req.text()` body
2. `RESEND_WEBHOOK_SECRET` set in `.env.local`; endpoint registered in Resend (`https://waitlist-build.vercel.app/api/webhooks/resend`)
3. Run `docs/stories/sql-writeups/epic15-story2-email-events-svix-unique.sql` in Supabase (DB-level idempotency, Story 15.2)
4. Send a test email → verify webhook fires
5. Check `email_events` for a new row (`event_type`, `subscriber_id`, `waitlist_id`, `event_data.svix_id`)
6. Replay the same webhook → no duplicate row (pre-check or `23505` catch, HTTP 200)
7. Request without/with bad svix headers → HTTP 401
8. Verify response is 200 and returns within 5 seconds (`after()` defers processing)
9. Run `pnpm lint` and `pnpm build` — verify zero errors

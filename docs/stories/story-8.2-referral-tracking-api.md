---
id: epic8.story02
epic: epic-8-thank-you-referral-loop
title: Referral Tracking in Subscriber API
status: ready
depends_on: [epic7.story00]
updated: 2026-08-17
---

# Story 8.2 — Referral Tracking in Subscriber API

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As a founder, I want the system to track which subscribers referred which other subscribers so that I can measure referral effectiveness and reward top referrers.

## Acceptance Criteria (EARS)

- AC1: The `POST /api/subscribers` route shall accept an optional `referrer_id` field in the request body.
- AC2: When `referrer_id` is provided and valid, the system shall: (a) verify the referrer exists in the same waitlist, (b) prevent self-referral (referrer_id !== the new subscriber's own id), (c) prevent cross-waitlist referral (referrer must belong to the same waitlist_id), (d) store the `referrer_id` on the new subscriber record.
- AC3: When a new subscriber is created with a valid `referrer_id`, the system shall increment the referrer's referral count (computed at query time by counting `subscribers` where `referrer_id` matches).
- AC4: The system shall reject invalid `referrer_id` values with a 400 response and `{ error: "Invalid referral code" }`.
- AC5: The system shall reject self-referral with a 400 response and `{ error: "Cannot refer yourself" }`.
- AC6: The system shall reject cross-waitlist referral with a 400 response and `{ error: "Invalid referral code" }`.
- AC7: The system shall provide a `GET /api/subscribers/:id/referrals` route handler that returns: (a) the subscriber's total referral count, (b) a list of subscribers they referred (with position and signup date).
- AC8: The `GET /api/subscribers/:id/referrals` route shall enforce founder ownership via auth check.
- AC9: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC6): Referral validation in POST /api/subscribers
- T2 (AC7-AC8): GET /api/subscribers/:id/referrals route
- T3 (AC9): Lint + build verification

## Out of scope

Milestone fulfillment (handled by `src/lib/milestones.ts` in Story 7.6 — platform tracks thresholds + sends congratulatory emails; founder delivers actual rewards), referral analytics dashboard (Sprint 3), email notification to referrers (Epic 11).

## Dev Notes

### T1 — Referral Validation in POST /api/subscribers

Update `src/app/api/subscribers/route.ts` (created in Story 7.0 T2).

**Updated request body:**

```ts
{
  waitlist_id: string,
  email: string,
  referrer_id?: string,  // NEW — subscriber id of the referrer
  qual_answers?: Record<string, string>
}
```

**Validation logic:**

```ts
if (referrer_id) {
  // 1. Verify referrer exists in the same waitlist
  const { data: referrer } = await supabase
    .from("subscribers")
    .select("id, waitlist_id")
    .eq("id", referrer_id)
    .single();

  if (!referrer) {
    return NextResponse.json(
      { error: "Invalid referral code" },
      { status: 400 }
    );
  }

  if (referrer.waitlist_id !== waitlist_id) {
    return NextResponse.json(
      { error: "Invalid referral code" },
      { status: 400 }
    );
  }

  // 2. Prevent self-referral (after subscriber is created)
  // Note: we can't check this before insert because we don't know the new subscriber's id yet
  // Instead, check after insert and remove referrer_id if self-referral
}
```

**Self-referral prevention:** Since the new subscriber doesn't have an id yet at validation time, we need to check after insert:

```ts
// After insert, if referrer_id === data.id, update to null
if (referrer_id && referrer_id === data.id) {
  await supabase
    .from("subscribers")
    .update({ referrer_id: null })
    .eq("id", data.id);
}
```

**Alternative approach:** Skip the self-referral check at the API level and handle it in the client (don't pass referrer_id if it's the same subscriber). The server-side check is a safety net.

### T2 — GET /api/subscribers/:id/referrals

Create `src/app/api/subscribers/[id]/referrals/route.ts`.

**Route structure:**

```ts
type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id, waitlists!inner ( founder_id )")
    .eq("id", id)
    .single();

  if (!subscriber || subscriber.waitlists.founder_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get referral count
  const { count } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", id);

  // Get referred subscribers
  const { data: referrals } = await supabase
    .from("subscribers")
    .select("id, email, position, created_at")
    .eq("referrer_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    referral_count: count || 0,
    referrals: referrals || [],
  });
}
```

**Response shape:**

```ts
{
  referral_count: number,
  referrals: [{
    id: string,
    email: string,    // anonymized
    position: number,
    created_at: string
  }]
}
```

### T3 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files modified:**

- `src/app/api/subscribers/route.ts` (add referrer_id validation)

**Files created:**

- `src/app/api/subscribers/[id]/referrals/route.ts`

**Available utilities:** `cn()` ✓, `createClient()` ✓

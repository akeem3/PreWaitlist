# Story 12.2.15 — API Routes for Multi-Waitlist

**Epic:** 12.2 — Gap Fixes
**Status:** ready
**Depends on:** 12.2.14
**Design Refs:** — (no UI)

## Story

As a founder, I want the API to support multiple waitlists so that I can create and manage more than one waitlist from a single account, with tier-based limits enforced.

## Acceptance Criteria (EARS)

- AC1: `POST /api/waitlist` shall create a new waitlist row instead of updating an existing one when the founder already has one or more waitlists.
- AC2: `POST /api/waitlist` shall check the founder's tier before creation: free tier = max 1 waitlist, Pro tier = unlimited. If the limit is reached, return HTTP 402 with `{ error: "Upgrade to Pro to create more waitlists" }`.
- AC3: `GET /api/waitlist` shall return all waitlists for the authenticated founder (array of waitlist objects, not a single object).
- AC4: `PATCH /api/waitlist` shall require a `waitlist_id` field in the request body to identify which waitlist to update. If `waitlist_id` is missing, return HTTP 400 with `{ error: "waitlist_id is required" }`.
- AC5: `PATCH /api/waitlist` shall validate that the authenticated founder owns the specified `waitlist_id`. If not found or unauthorized, return HTTP 404 with `{ error: "Waitlist not found" }`.
- AC6: The `POST /api/waitlist/check-slug` endpoint shall continue to check global subdomain uniqueness (not per-founder). No changes needed.
- AC7: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) POST route — remove single-waitlist upsert, add tier enforcement · T2 (AC3) GET route — return all waitlists with subscriber counts · T3 (AC4-AC5) PATCH route — require waitlist_id, ownership check · T4 (AC6) Verify check-slug unchanged · T5 (AC7) Lint + build

## Out of Scope

Dashboard UI changes (Stories 12.2.16–12.2.17), onboarding flow changes (existing flow works as-is for new waitlists).

## Implementation Details

### T1: POST route — remove single-waitlist upsert, add tier enforcement

**File to modify:** `src/app/api/waitlist/route.ts`

**Current behavior (lines 42-118):** Checks if founder already has a waitlist. If yes, updates it (upsert). If no, creates new one.

**New behavior:** Always create a new waitlist. Check tier limit before inserting.

Remove lines 42-118 (the existing-waitlist check + update branch). Replace with tier enforcement + insert:

```typescript
// --- Tier enforcement: check waitlist count before creating ---
const { data: profile } = await supabase
  .from("founder_profiles")
  .select("tier")
  .eq("id", user.id)
  .single();

const tier = profile?.tier ?? "free";

const { count: waitlistCount } = await supabase
  .from("waitlists")
  .select("id", { count: "exact", head: true })
  .eq("founder_id", user.id);

if (tier === "free" && (waitlistCount ?? 0) >= 1) {
  return NextResponse.json(
    { error: "Upgrade to Pro to create more waitlists" },
    { status: 402 }
  );
}

// --- Always insert new waitlist ---
const insertPayload: Record<string, unknown> = {
  founder_id: user.id,
  subdomain: body.subdomain,
  headline: body.headline ?? null,
  subheadline: body.subheadline ?? null,
  product_name: body.product_name ?? null,
};
if (body.template !== undefined) insertPayload.template = body.template;
if (body.brand_color !== undefined)
  insertPayload.brand_color = body.brand_color;
if (body.logo_url !== undefined) insertPayload.logo_url = body.logo_url;
if (body.cta_text !== undefined) insertPayload.cta_text = body.cta_text;
if (body.signup_counter_enabled !== undefined)
  insertPayload.signup_counter_enabled = body.signup_counter_enabled;
if (body.signup_counter_threshold !== undefined)
  insertPayload.signup_counter_threshold = body.signup_counter_threshold;
if (Array.isArray(body.milestone_rewards)) {
  insertPayload.milestone_rewards_enabled = body.milestone_rewards.length > 0;
}

const { data: waitlist, error: insertError } = await supabase
  .from("waitlists")
  .insert(insertPayload)
  .select("id")
  .single();

if (insertError) {
  console.error("Failed to create waitlist:", insertError);
  return NextResponse.json({ error: insertError.message }, { status: 400 });
}
```

**Key changes:**

- Removed the `if (existing)` branch entirely — no more upsert
- Added tier check: free = 1 waitlist max, Pro = unlimited
- Always inserts a new row
- Returns the new waitlist ID

### T2: GET route — return all waitlists with subscriber counts

**File to modify:** `src/app/api/waitlist/route.ts` (the GET handler)

**Current behavior:** Returns a single waitlist object (`.single()`).

**New behavior:** Returns an array of all waitlists with subscriber counts.

```typescript
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: waitlists, error } = await supabase
    .from("waitlists")
    .select(
      `
      id, subdomain, product_name, headline, subheadline, template,
      brand_color, logo_url, cta_text, qualification_enabled,
      milestone_rewards_enabled, is_archived, created_at
    `
    )
    .eq("founder_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Batch-fetch subscriber counts for all waitlists
  const waitlistIds = (waitlists ?? []).map((w) => w.id);
  const { data: subscriberCounts } = await supabase
    .from("subscribers")
    .select("waitlist_id")
    .in("waitlist_id", waitlistIds);

  // Count in memory via Map
  const countMap = new Map<string, number>();
  for (const sub of subscriberCounts ?? []) {
    countMap.set(sub.waitlist_id, (countMap.get(sub.waitlist_id) ?? 0) + 1);
  }

  const result = (waitlists ?? []).map((w) => ({
    ...w,
    subscriber_count: countMap.get(w.id) ?? 0,
  }));

  return NextResponse.json(result, { status: 200 });
}
```

### T3: PATCH route — require waitlist_id, ownership check

**File to modify:** `src/app/api/waitlist/route.ts` (the PATCH handler)

**Current behavior:** Uses `body.id` or queries by `founder_id` to find the waitlist.

**New behavior:** Requires `body.waitlist_id`. Validates ownership.

```typescript
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Require waitlist_id
  if (!body.waitlist_id) {
    return NextResponse.json(
      { error: "waitlist_id is required" },
      { status: 400 }
    );
  }

  // Verify ownership
  const { data: existing, error: lookupError } = await supabase
    .from("waitlists")
    .select("id")
    .eq("id", body.waitlist_id)
    .eq("founder_id", user.id)
    .single();

  if (lookupError || !existing) {
    return NextResponse.json({ error: "Waitlist not found" }, { status: 404 });
  }

  // Build update payload (same as before, but using existing.id)
  const updatePayload: Record<string, unknown> = {};
  if (body.subdomain !== undefined) updatePayload.subdomain = body.subdomain;
  if (body.headline !== undefined) updatePayload.headline = body.headline;
  if (body.subheadline !== undefined)
    updatePayload.subheadline = body.subheadline;
  if (body.product_name !== undefined)
    updatePayload.product_name = body.product_name;
  if (body.template !== undefined) updatePayload.template = body.template;
  if (body.brand_color !== undefined)
    updatePayload.brand_color = body.brand_color;
  if (body.logo_url !== undefined) updatePayload.logo_url = body.logo_url;
  if (body.cta_text !== undefined) updatePayload.cta_text = body.cta_text;
  if (body.signup_counter_enabled !== undefined)
    updatePayload.signup_counter_enabled = body.signup_counter_enabled;
  if (body.signup_counter_threshold !== undefined)
    updatePayload.signup_counter_threshold = body.signup_counter_threshold;
  if (body.business_address !== undefined)
    updatePayload.business_address = body.business_address || null;
  if (body.sending_domain !== undefined)
    updatePayload.sending_domain = body.sending_domain || null;
  if (body.sender_name !== undefined)
    updatePayload.sender_name = body.sender_name || null;

  if (Array.isArray(body.milestone_rewards)) {
    updatePayload.milestone_rewards_enabled = body.milestone_rewards.length > 0;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("waitlists")
    .update(updatePayload)
    .eq("id", existing.id);

  if (updateError) {
    console.error("Failed to update waitlist:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // Upsert milestone_rewards if provided
  if (Array.isArray(body.milestone_rewards)) {
    await supabase
      .from("milestone_rewards")
      .delete()
      .eq("waitlist_id", existing.id);
    if (body.milestone_rewards.length > 0) {
      const rewardRows = body.milestone_rewards.map(
        (r: { threshold: number; label: string }) => ({
          waitlist_id: existing.id,
          tier_referrals: r.threshold,
          reward_label: r.label,
        })
      );
      await supabase.from("milestone_rewards").insert(rewardRows);
    }
  }

  // Upsert qualification_questions if provided
  if (Array.isArray(body.questions)) {
    await supabase
      .from("qualification_questions")
      .delete()
      .eq("waitlist_id", existing.id);
    if (body.questions.length > 0) {
      const questionRows = body.questions.map(
        (q: { text: string; required: boolean }, index: number) => ({
          waitlist_id: existing.id,
          question_text: q.text,
          question_type: "free_text" as const,
          sort_order: index,
        })
      );
      await supabase.from("qualification_questions").insert(questionRows);
    }
  }

  return NextResponse.json({ id: existing.id }, { status: 200 });
}
```

**Key changes:**

- Requires `body.waitlist_id` — returns 400 if missing
- Validates ownership via `.eq("founder_id", user.id)` — returns 404 if not found
- Uses `existing.id` (from the ownership check) instead of querying separately

### T4: Verify check-slug unchanged

The `POST /api/waitlist/check-slug` endpoint checks global subdomain uniqueness. No changes needed — it already queries `waitlists` by `subdomain` without filtering by `founder_id`.

Verify by reading `src/app/api/waitlist/check-slug/route.ts` — confirm it does `.eq("subdomain", ...)` without `.eq("founder_id", ...)`.

### T5: Lint + build

Run `pnpm lint` and `pnpm build`.

## Caller Updates Required

The following callers currently use `PATCH /api/waitlist` without `waitlist_id`. They must be updated to pass `waitlist_id`:

| Caller                   | File                                                 | Change                                   |
| ------------------------ | ---------------------------------------------------- | ---------------------------------------- |
| Onboarding FlushGate     | `src/app/onboarding/flush-gate.tsx`                  | Pass `waitlist_id` from context          |
| Onboarding context flush | `src/app/onboarding/context.tsx`                     | Pass `state.waitlistId` as `waitlist_id` |
| Edit after onboarding    | `src/app/dashboard/[waitlistId]/settings/client.tsx` | Pass `waitlistId` as `waitlist_id`       |
| Business address save    | `src/app/dashboard/settings/client.tsx`              | Pass `waitlistId` as `waitlist_id`       |
| Sender name save         | `src/app/dashboard/[waitlistId]/settings/client.tsx` | Pass `waitlistId` as `waitlist_id`       |
| Sending domain save      | `src/app/dashboard/[waitlistId]/settings/client.tsx` | Pass `waitlistId` as `waitlist_id`       |

**Pattern:** Every `fetch("/api/waitlist", { method: "PATCH", body: JSON.stringify({ ... }) })` must include `waitlist_id: <the-waitlist-id>` in the body.

## Verification

1. `POST /api/waitlist` with no existing waitlist → creates new (200)
2. `POST /api/waitlist` with 1 existing + free tier → returns 402 "Upgrade to Pro"
3. `POST /api/waitlist` with 1 existing + pro tier → creates second (200)
4. `GET /api/waitlist` → returns array of all waitlists with subscriber counts
5. `PATCH /api/waitlist` without `waitlist_id` → returns 400
6. `PATCH /api/waitlist` with wrong `waitlist_id` → returns 404
7. `PATCH /api/waitlist` with valid `waitlist_id` → updates correctly
8. `POST /api/waitlist/check-slug` → still checks global uniqueness
9. All existing callers updated to pass `waitlist_id`
10. `pnpm lint` and `pnpm build` pass with zero errors

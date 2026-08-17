---
id: epic7.story00
epic: epic-7-public-waitlist-page
title: Subscribers Table & API
status: ready
depends_on: []
updated: 2026-08-17
---

# Story 7.0 — Subscribers Table & API

**Status:** ready
**Design Refs:** — (no UI)

**Story:** As the founder, I want a subscribers table and API routes so that visitors can sign up for my waitlist and I can manage subscriber data.

## Acceptance Criteria (EARS)

- AC1: The system shall create a `subscribers` table with columns: `id` (uuid PK, default `gen_random_uuid()`), `waitlist_id` (uuid FK to `public.waitlists(id)` ON DELETE CASCADE, not null), `email` (text, not null), `referral_code` (text, not null, unique), `referrer_id` (uuid FK to `public.subscribers(id)` ON DELETE SET NULL, nullable), `position` (integer, not null), `qual_answers` (jsonb, nullable), `created_at` (timestamptz, not null, default `now()`).
- AC2: The system shall enforce a `CHECK` constraint on `email` matching the pattern `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$` (case-insensitive).
- AC3: The system shall create a unique index on `(waitlist_id, email)` to prevent duplicate signups per waitlist.
- AC4: The system shall create an index on `(referral_code)` for fast referral lookups.
- AC5: The system shall enable Row-Level Security on the `subscribers` table.
- AC6: The system shall create a policy `"founders manage own waitlist's subscribers"` allowing SELECT, INSERT, UPDATE, DELETE on `subscribers` where the founder owns the waitlist (join through `waitlists` to check `founder_id = auth.uid()`).
- AC7: The system shall create a policy `"public read access for leaderboard"` allowing SELECT on `subscribers` for all users (`USING (true)`), enabling anonymous leaderboard access.
- AC8: The system shall provide a `POST /api/subscribers` route handler that: (a) accepts `{ waitlist_id, email, referrer_id? }` in the request body, (b) validates email format, (c) generates a unique `referral_code` (8-char alphanumeric), (d) assigns the next available `position` (`SELECT COALESCE(MAX(position), 0) + 1 FROM subscribers WHERE waitlist_id = $1`), (e) inserts the subscriber row, (f) returns `{ id, email, referral_code, position }` with status 201.
- AC9: The system shall return a 409 Conflict response with `{ error: "This email is already on the waitlist" }` when a duplicate `(waitlist_id, email)` is detected.
- AC10: The system shall provide a `GET /api/leaderboard/:subdomain` route handler that: (a) looks up the waitlist by `subdomain`, (b) returns subscribers ranked by `referral_count` descending then `created_at` ascending, (c) anonymizes emails for subscribers without names, (d) returns `[{ position, email, referral_code, referral_count, qual_answers }]` with status 200.
- AC11: The system shall return an empty array `[]` with status 200 when no subscribers exist for a given subdomain.
- AC12: The system shall provide a `GET /api/subscribers/:id` route handler that returns a single subscriber with `position`, `referral_count` (count of `referrer_id` matches), and `qual_answers`, enforcing founder ownership via waitlist join.
- AC13: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC7): Create subscribers table DDL + RLS as SQL migration file
- T2 (AC8-AC9): POST /api/subscribers route handler
- T3 (AC10-AC11): GET /api/leaderboard/:subdomain route handler
- T4 (AC12): GET /api/subscribers/:id route handler
- T5 (AC13): Lint + build verification

## Out of scope

Public page rendering (Story 7.1), email capture form (Story 7.2), thank-you page (Epic 8), email sending (Epic 11), duplicate email UI handling (Story 7.4).

## Dev Notes

### T1 — DDL Migration

Create `docs/stories/sql-writeups/epic7-story0-subscribers.sql`. Follow the pattern from `epic0.story03-supabase-schema.sql` and `epic6-story0-signup-counter.sql`.

**SQL DDL (from PRD 7.4):**

```sql
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  email text not null,
  referral_code text not null unique,
  referrer_id uuid references public.subscribers(id) on delete set null,
  position integer not null,
  qual_answers jsonb,
  created_at timestamptz not null default now(),
  constraint email_format check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
create unique index subscribers_waitlist_email_idx on public.subscribers(waitlist_id, email);
create index subscribers_referral_code_idx on public.subscribers(referral_code);
```

**RLS policies:**

```sql
alter table public.subscribers enable row level security;

create policy "founders manage own waitlist's subscribers"
  on public.subscribers for all
  using (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()))
  with check (waitlist_id in (select id from public.waitlists where founder_id = auth.uid()));

create policy "public read access for leaderboard"
  on public.subscribers for select
  using (true);
```

**Note:** The `referral_count` is not a stored column — it is computed at query time by counting rows where `referrer_id = subscriber.id`. This avoids write amplification on every referral. The leaderboard query uses a subquery or join to compute this.

### T2 — POST /api/subscribers

Create `src/app/api/subscribers/route.ts`.

**Pattern to follow:** `src/app/api/waitlist/route.ts` for structure, `src/app/api/waitlist/count/route.ts` for public (unauthenticated) route pattern.

**Key implementation details:**

```ts
// Imports — match existing pattern exactly
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
```

**This is a PUBLIC route — no auth check.** The subscriber creation endpoint is called by anonymous visitors. RLS policies handle access control.

**Referral code generation:**

```ts
function generateReferralCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}
```

Use `crypto.randomUUID()`, strip hyphens, take first 8 chars. Retry once on collision (unique constraint will reject).

**Position assignment:**

```ts
const { data: maxPos } = await supabase
  .from("subscribers")
  .select("position")
  .eq("waitlist_id", waitlistId)
  .order("position", { ascending: false })
  .limit(1)
  .maybeSingle();

const position = (maxPos?.position ?? 0) + 1;
```

**Request body shape:**

```ts
{ waitlist_id: string, email: string, referrer_id?: string }
```

**Response shapes:**

- Success: `{ id, email, referral_code, position }` at 201
- Duplicate: `{ error: "This email is already on the waitlist" }` at 409
- Invalid email: `{ error: "Invalid email format" }` at 400
- Missing fields: `{ error: "Missing required fields" }` at 400

**Error handling:** Catch Supabase unique violation error code `23505` for the 409 response.

### T3 — GET /api/leaderboard/:subdomain

Create `src/app/api/leaderboard/[subdomain]/route.ts`.

**First dynamic-segment API route in the project.** Access params via:

```ts
type Props = { params: Promise<{ subdomain: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  const { subdomain } = await params;
  // ...
}
```

**Query pattern:**

```ts
// 1. Look up waitlist by subdomain
const { data: waitlist } = await supabase
  .from("waitlists")
  .select("id")
  .eq("subdomain", subdomain)
  .single();

if (!waitlist) {
  return NextResponse.json([], { status: 200 }); // empty, not 404
}

// 2. Fetch subscribers with computed referral_count
const { data: subscribers } = await supabase
  .from("subscribers")
  .select(
    `
    position,
    email,
    referral_code,
    qual_answers,
    created_at,
    referral_count:referrers(count)
  `
  )
  .eq("waitlist_id", waitlist.id)
  .order("referral_count", { ascending: false })
  .order("created_at", { ascending: true });
```

**Alternative query approach** (if Supabase PostgREST doesn't support computed counts cleanly):

```ts
// Use a subquery or RPC function. For simplicity, fetch all and compute in JS:
const { data: subscribers } = await supabase
  .from("subscribers")
  .select("position, email, referral_code, qual_answers, created_at, id")
  .eq("waitlist_id", waitlist.id)
  .order("created_at", { ascending: true });

// For each subscriber, count referrals (or use a single aggregate query)
```

**Email anonymization** (for subscribers without a display name):

```ts
function anonymizeEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}••••@${domain}`;
  return `${local[0]}••••${local[local.length - 1]}@${domain}`;
}
```

Example: `"john@example.com"` → `"j••••m@example.com"`

**Response shape:**

```ts
[
  {
    position: number,
    email: string, // anonymized
    referral_code: string,
    referral_count: number,
    qual_answers: object | null,
  },
];
```

### T4 — GET /api/subscribers/:id

Create `src/app/api/subscribers/[id]/route.ts`.

**Route structure:**

```ts
type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;
  // Auth check — founder must own the waitlist
}
```

**This IS an authenticated route.** Follow the auth pattern from `src/app/api/waitlist/route.ts`:

```ts
const supabase = await createClient();
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();
if (authError || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Query pattern:**

```ts
const { data: subscriber } = await supabase
  .from("subscribers")
  .select(
    `
    id,
    email,
    position,
    referral_code,
    qual_answers,
    created_at,
    waitlists!inner ( founder_id )
  `
  )
  .eq("id", id)
  .single();

// Ownership check
if (!subscriber || subscriber.waitlists.founder_id !== user.id) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

**Referral count computation:**

```ts
const { count } = await supabase
  .from("subscribers")
  .select("id", { count: "exact", head: true })
  .eq("referrer_id", id);
```

**Response shape:**

```ts
{
  id: string,
  email: string,
  position: number,
  referral_code: string,
  referral_count: number,
  qual_answers: object | null,
  created_at: string
}
```

### T5 — Lint + Build

Run `pnpm lint` and `pnpm build`. Fix any errors before marking done.

**Files created:**

- `docs/stories/sql-writeups/epic7-story0-subscribers.sql`
- `src/app/api/subscribers/route.ts`
- `src/app/api/leaderboard/[subdomain]/route.ts`
- `src/app/api/subscribers/[id]/route.ts`

**Available components:** `Button` ✓, `Input` ✓, `Card` ✓, `Badge` ✓ (not used in this story)
**Available utilities:** `cn()` ✓, `createClient()` ✓

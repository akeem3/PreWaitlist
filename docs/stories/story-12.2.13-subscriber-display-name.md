# Story 12.2.13 — Subscriber Display Name

**Epic:** 12.2 — Gap Fixes
**Status:** ready
**Depends on:** 12.2.0
**Design Refs:** —

## Story

As a founder, I want subscribers to optionally provide a name during signup so that I can personalize my communications and see their names in the dashboard.

## Acceptance Criteria (EARS)

- AC1: The `subscribers` table shall have a `display_name` column (text, nullable).
- AC2: The public waitlist page's email capture form shall include an optional "First name" input field above the email field.
- AC3: The `POST /api/subscribers` endpoint shall accept and store `display_name` in the `subscribers` table.
- AC4: The dashboard subscriber table shall display the subscriber's name in the Email column (name above email, muted).
- AC5: The leaderboard page shall display the subscriber's name instead of (or above) the anonymized email.
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Schema column · T2 (AC2) Name input on public form · T3 (AC3) API accept display_name · T4 (AC4-AC5) Dashboard + leaderboard display · T5 (AC6) Lint + build

## Out of Scope

Required name field, name validation, name editing in dashboard, display name on thank-you page (future story).

## Implementation Details

### T1: Schema column

Add `display_name` column to `subscribers` table. This should be included in the Story 12.2.0 schema migration (add to the existing SQL file if not already present):

```sql
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS display_name text;
```

### T2: Name input on public form

- **File to modify:** `components/public/email-capture-form.tsx`

Add an optional name field above the email input:

```tsx
<div>
  <label htmlFor="display-name" className="text-label text-foreground">
    First name <span className="text-muted-foreground">(optional)</span>
  </label>
  <input
    id="display-name"
    type="text"
    value={displayName}
    onChange={(e) => setDisplayName(e.target.value)}
    placeholder="Jane"
    className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-body-sm text-foreground"
  />
</div>
```

Update the form submission to include `display_name` in the POST body.

### T3: API accept display_name

- **File to modify:** `src/app/api/subscribers/route.ts`

Add `display_name` to the destructured body and insert:

```typescript
const { email, referral_code, display_name } = body;
// ... in the insert:
const { error } = await supabase.from("subscribers").insert({
  waitlist_id: waitlist.id,
  email: email.trim().toLowerCase(),
  referral_code: generateReferralCode(),
  referrer_id: resolvedReferrerId,
  display_name: display_name?.trim() || null,
});
```

### T4: Dashboard + leaderboard display

**Dashboard subscriber table** (`src/app/dashboard/page.tsx` or `client.tsx`):

- In the Email column, render name above email when available:

```tsx
<div>
  {subscriber.display_name && (
    <div className="text-body-sm font-medium">{subscriber.display_name}</div>
  )}
  <div className="text-body-sm text-muted-foreground">{subscriber.email}</div>
</div>
```

**Leaderboard page** (`src/app/(public)/[subdomain]/leaderboard/page.tsx`):

- Replace or augment the anonymized email with the display name when available:

```tsx
<td>
  {subscriber.display_name
    ? subscriber.display_name
    : anonymizeEmail(subscriber.email)}
</td>
```

### T5: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Public waitlist page shows optional "First name" input above email
2. Submit with name → subscriber record has `display_name`
3. Submit without name → `display_name` is null
4. Dashboard shows name above email in subscriber table
5. Leaderboard shows name instead of anonymized email when available
6. Leaderboard shows anonymized email when no name provided
7. `pnpm lint` and `pnpm build` pass with zero errors

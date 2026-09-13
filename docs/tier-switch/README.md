# Tier Switch — Manual Tier Toggle for Testing

The `founder_profiles` table stores the tier (`free` or `pro`) for each founder. Changing it in the database immediately affects what the app shows — no code deploy needed.

## How It Works

- Every dashboard page load reads `tier` from `founder_profiles`
- Sidebar nav items (Broadcast) check `tier` to show locked/unlocked state
- API routes (broadcast send) check `tier` to allow/deny access
- Changing the row in Supabase = instant tier switch on next page load

## Switch to Pro

Run in **Supabase Dashboard → SQL Editor**:

```sql
UPDATE founder_profiles
SET tier = 'pro'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@gmail.com');
```

Replace `your-email@gmail.com` with the email you signed up with.

**Unlocks:**

- Broadcast nav item in sidebar (clickable, not locked)
- `/dashboard/broadcast` compose page
- Broadcast API route (sends emails via Resend Batch API)
- Warmth distribution panel (real data)

## Switch Back to Free

```sql
UPDATE founder_profiles
SET tier = 'free'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@gmail.com');
```

**Restores:**

- Broadcast nav item shows lock icon + disabled state
- `/dashboard/broadcast` redirects to `/dashboard`
- Broadcast API returns 403 "Pro subscription required"
- Warmth panel shows locked overlay

## Verify Current Tier

```sql
SELECT id, tier FROM founder_profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@gmail.com');
```

## Notes

- No logout/login required — just refresh the page after running the SQL
- Works for any founder account, not just the owner
- The `tier` column is `text not null default 'free'` with a check constraint: `in ('free', 'pro', 'growth')`
- `growth` tier exists in the schema but is out of scope for MVP (see PRD §5)

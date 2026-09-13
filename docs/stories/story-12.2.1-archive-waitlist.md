# Story 12.2.1 — Archive Waitlist

**Epic:** 12.2 — Gap Fixes
**Status:** ready
**Depends on:** 12.2.0
**Design Refs:** —

## Story

As a founder, I want to archive my waitlist so that I can deactivate it without deleting data.

## Acceptance Criteria (EARS)

- AC1: The settings page shall display an "Archive Waitlist" button in a danger zone section at the bottom of the page.
- AC2: Clicking "Archive Waitlist" shall show a confirmation dialog: "Archiving your waitlist will stop new signups and hide your public page. This can be undone. Continue?"
- AC3: On confirmation, the system shall call `PATCH /api/waitlist` with `{ is_archived: true, archived_at: new Date().toISOString() }`.
- AC4: When `is_archived === true`, the public waitlist page (`/:subdomain`) shall return a 410 Gone status with a message: "This waitlist is no longer active."
- AC5: When archived, the sidebar shall display a banner: "This waitlist is archived. [Unarchive]" at the top.
- AC6: The founder shall be able to unarchive by calling `PATCH /api/waitlist` with `{ is_archived: false, archived_at: null }`.
- AC7: Archived waitlists shall NOT appear in any public listings or search results (currently no such feature, but guard against future regressions).
- AC8: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Archive button + confirmation dialog · T2 (AC3) API call + state update · T3 (AC4) Public page archived state · T4 (AC5-AC6) Sidebar banner + unarchive · T5 (AC7) Guard against public listing · T6 (AC8) Lint + build

## Out of Scope

Bulk archive, permanent deletion, archive reason collection.

## Implementation Details

### T1: Archive button + confirmation dialog

- **File to modify:** `src/app/dashboard/settings/client.tsx`

Add at the bottom of the settings page, below all other sections:

```tsx
{
  /* Danger Zone */
}
<div className="mt-8 rounded-(--card-radius) border border-destructive/20 p-6">
  <h2 className="mb-2 text-body-sm font-semibold text-foreground">
    Danger Zone
  </h2>
  <p className="mb-4 text-body-sm text-muted-foreground">
    Archive your waitlist to stop new signups and hide your public page.
  </p>
  <button
    type="button"
    onClick={handleArchive}
    className="rounded-lg bg-destructive px-4 py-2 text-body-sm font-medium text-white transition-colors hover:bg-destructive/90"
  >
    Archive Waitlist
  </button>
</div>;
```

### T2: API call + state update

```typescript
const [isArchived, setIsArchived] = useState(false);

async function handleArchive() {
  const confirmed = window.confirm(
    "Archiving your waitlist will stop new signups and hide your public page. This can be undone. Continue?"
  );
  if (!confirmed) return;

  try {
    const res = await fetch("/api/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: waitlistId,
        is_archived: true,
        archived_at: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      setIsArchived(true);
    }
  } catch {
    // Handle error
  }
}

async function handleUnarchive() {
  try {
    const res = await fetch("/api/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: waitlistId,
        is_archived: false,
        archived_at: null,
      }),
    });
    if (res.ok) {
      setIsArchived(false);
    }
  } catch {
    // Handle error
  }
}
```

### T3: Public page archived state

- **File to modify:** `src/app/(public)/[subdomain]/page.tsx`

Add an `is_archived` field to the waitlist query. Check it early and return 410:

```typescript
const { data: waitlist } = await supabase
  .from("waitlists")
  .select("...")
  .eq("subdomain", subdomain)
  .single();

if (!waitlist) notFound();

// AC4: Archived check
if (waitlist.is_archived) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-2 text-h2 text-foreground">Waitlist inactive</h1>
        <p className="text-body text-muted-foreground">
          This waitlist is no longer active.
        </p>
      </div>
    </div>
  );
}
```

### T4: Sidebar banner + unarchive

- **File to modify:** `components/dashboard/sidebar.tsx`

Add `isArchived` prop and render a banner at the top of the sidebar (after the product name button, before the nav):

```typescript
interface SidebarProps {
  // ... existing props
  isArchived?: boolean;
  onUnarchive?: () => void;
}
```

```tsx
{
  isArchived && (
    <div className="mx-3 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
      <p className="mb-1 text-xs text-amber-800">This waitlist is archived.</p>
      <button
        type="button"
        onClick={onUnarchive}
        className="text-xs font-medium text-amber-900 underline"
      >
        Unarchive
      </button>
    </div>
  );
}
```

Pass `isArchived` and `onUnarchive` from the parent component (dashboard page or settings page).

### T5: Guard against public listing

The public page query (line 14 of `[subdomain]/page.tsx`) fetches by subdomain. Add `.eq("is_archived", false)` to the query to prevent archived waitlists from rendering:

```typescript
const { data: waitlist } = await supabase
  .from("waitlists")
  .select("...")
  .eq("subdomain", subdomain)
  .eq("is_archived", false)
  .single();
```

This prevents archived waitlists from appearing at their URL.

### T6: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Settings page shows "Danger Zone" section with "Archive Waitlist" button
2. Click archive → confirmation dialog appears
3. Confirm → waitlist archived, settings refresh
4. Visit public waitlist URL → "This waitlist is no longer active" message
5. Sidebar shows amber banner with "Unarchive" button
6. Click unarchive → waitlist restored, banner disappears
7. Public page renders normally after unarchive
8. `pnpm lint` and `pnpm build` pass with zero errors

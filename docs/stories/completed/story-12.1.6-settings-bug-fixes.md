# Story 12.1.6 — Settings & Bug Fixes

**Epic:** 12.1 — Dashboard Overhaul
**Status:** ready
**Depends on:** —
**Design Refs:** —

## Story

As a founder, I want the settings page buttons to work and known bugs to be fixed so that the dashboard feels polished.

## Acceptance Criteria (EARS)

- AC1: The "Upgrade to Pro" button in settings (line 207–212 of `settings/client.tsx`) shall display a tooltip or note: "Paddle billing coming soon" — it must not be a dead button.
- AC2: The "Manage billing" button for Pro users (lines 214–219) shall display a tooltip or note: "Paddle billing coming soon".
- AC3: The settings save functions (`handleSaveSenderName`, `handleSaveThreshold`) shall have try/catch error handling with user-visible error feedback (currently missing — lines 43–77 have no catch block).
- AC4: The `wshrink-0` typo in `qualification-panel.tsx` line 88 shall be fixed to `shrink-0`.
- AC5: The loading skeleton sidebar width (`w-60` at line 4 of `loading.tsx`) shall match the actual sidebar width (`w-67`).
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Settings button feedback · T2 (AC3) Error handling on settings save · T3 (AC4) Fix wshrink-0 typo · T4 (AC5) Fix loading skeleton width · T5 (AC6) Lint + build

## Out of Scope

Paddle checkout integration (Epic 13), billing management page, danger zone (archive/delete).

## Implementation Details

### T1: Settings button feedback

- **File to modify:** `src/app/dashboard/settings/client.tsx`

Replace the dead "Upgrade to Pro" and "Manage billing" buttons with disabled buttons that have a title tooltip:

```tsx
{
  /* Upgrade button (line ~207) */
}
<button
  type="button"
  disabled
  title="Paddle billing coming soon"
  className="inline-flex items-center gap-2 rounded-lg border border-accent px-4 py-2 text-body-sm font-medium text-accent opacity-60 cursor-not-allowed"
>
  Upgrade to Pro
</button>;

{
  /* Manage billing button (line ~214) */
}
<button
  type="button"
  disabled
  title="Paddle billing coming soon"
  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-body-sm text-foreground opacity-60 cursor-not-allowed"
>
  Manage billing
</button>;
```

### T2: Error handling on settings save

Add error state and try/catch to the save functions:

```typescript
const [senderNameError, setSenderNameError] = useState<string | null>(null);
const [thresholdError, setThresholdError] = useState<string | null>(null);

async function handleSaveSenderName() {
  setSenderNameSaving(true);
  setSenderNameError(null);
  try {
    const res = await fetch("/api/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: waitlistId,
        sender_name: senderNameValue || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setSenderNameError(data.error || "Failed to save");
      return;
    }
    setSenderNameSaved(true);
    setTimeout(() => setSenderNameSaved(false), 2000);
  } catch {
    setSenderNameError("Network error — please try again");
  } finally {
    setSenderNameSaving(false);
  }
}
```

Display errors below the save button:

```tsx
{
  senderNameError && (
    <p className="mt-1 text-xs text-destructive">{senderNameError}</p>
  );
}
```

Apply the same pattern to `handleSaveThreshold`.

### T3: Fix wshrink-0 typo

- **File to modify:** `components/dashboard/qualification-panel.tsx`

Line 88: change `wshrink-0` to `shrink-0`.

### T4: Fix loading skeleton width

- **File to modify:** `src/app/dashboard/loading.tsx`

Line 4: change `w-60` to `w-67` to match the actual sidebar width.

### T5: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Settings page: "Upgrade to Pro" button shows "Paddle billing coming soon" tooltip on hover
2. Settings page: "Manage billing" button shows same tooltip
3. Settings page: Save sender name → network failure → error message displayed
4. Settings page: Save threshold → success → success message shown, error cleared
5. `qualification-panel.tsx`: no `wshrink-0` typo
6. `loading.tsx`: sidebar skeleton matches `w-67`
7. `pnpm lint` and `pnpm build` pass with zero errors

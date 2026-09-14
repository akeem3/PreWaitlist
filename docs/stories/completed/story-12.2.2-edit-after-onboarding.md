# Story 12.2.2 — Edit After Onboarding

**Epic:** 12.2 — Gap Fixes
**Status:** done
**Depends on:** —
**Design Refs:** —

## Story

As a founder, I want to edit my waitlist page after onboarding so that I can update content without recreating everything.

## Acceptance Criteria (EARS)

- AC1: The settings page shall display editable fields for: headline, subheadline, CTA text, brand color, logo URL, sender name.
- AC2: Each field shall have a "Save" button that calls `PATCH /api/waitlist` with the updated value.
- AC3: On successful save, the system shall display a brief success message that disappears after 3 seconds.
- AC4: On error, the system shall display the error message inline below the field.
- AC5: The live preview in settings shall update in real-time as the founder edits fields (reuse LivePreview component).
- AC6: The brand color field shall use the existing color picker component from onboarding Step 3.
- AC7: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Editable fields with save buttons · T2 (AC3-AC4) Success/error feedback · T3 (AC5-AC6) Live preview + color picker · T4 (AC7) Lint + build

## Out of Scope

Template switching, qualification question editing, milestone reward editing.

## Implementation Details

### T1: Editable fields with save buttons

- **File to modify:** `src/app/dashboard/settings/client.tsx`

Add state for each editable field:

```typescript
const [headlineValue, setHeadlineValue] = useState(headline ?? "");
const [headlineSaved, setHeadlineSaved] = useState(false);
const [headlineSaving, setHeadlineSaving] = useState(false);
const [headlineError, setHeadlineError] = useState<string | null>(null);

// Same pattern for: subheadline, ctaText, brandColor, logoUrl
```

Add a reusable save handler:

```typescript
async function handleSaveField(
  field: string,
  value: string | null,
  setSaving: (v: boolean) => void,
  setSaved: (v: boolean) => void,
  setError: (v: string | null) => void
) {
  setSaving(true);
  setError(null);
  try {
    const res = await fetch("/api/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: waitlistId, [field]: value }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  } catch {
    setError("Network error — please try again");
  } finally {
    setSaving(false);
  }
}
```

Render editable fields:

```tsx
<div className="space-y-6">
  {/* Headline */}
  <div>
    <label className="text-label text-foreground">Headline</label>
    <div className="mt-1 flex gap-2">
      <input
        value={headlineValue}
        onChange={(e) => setHeadlineValue(e.target.value)}
        className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-body-sm text-foreground"
      />
      <button
        onClick={() =>
          handleSaveField(
            "headline",
            headlineValue || null,
            setHeadlineSaving,
            setHeadlineSaved,
            setHeadlineError
          )
        }
        disabled={headlineSaving}
        className="rounded-lg bg-accent px-4 py-2 text-body-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
      >
        {headlineSaving ? "Saving..." : headlineSaved ? "Saved!" : "Save"}
      </button>
    </div>
    {headlineError && (
      <p className="mt-1 text-xs text-destructive">{headlineError}</p>
    )}
  </div>

  {/* Repeat for: subheadline, cta_text, logo_url, sender_name */}
</div>
```

### T2: Success/error feedback

Covered in T1 above. Each field has its own `saved` and `error` state. Success shows "Saved!" for 3 seconds. Error shows inline below the field.

### T3: Live preview + color picker

- **File to modify:** `src/app/dashboard/settings/client.tsx`

Add a preview section that shows the current waitlist page appearance:

```tsx
import dynamic from "next/dynamic";
const LivePreview = dynamic(
  () => import("../../../components/onboarding/live-preview"),
  { ssr: false }
);

// In JSX:
<div className="mb-6">
  <h3 className="mb-3 text-body-sm font-semibold text-foreground">Preview</h3>
  <LivePreview
    template={template}
    headline={headlineValue}
    subheadline={subheadlineValue}
    ctaText={ctaTextValue}
    brandColor={brandColorValue}
    logoUrl={logoUrlValue}
  />
</div>;
```

For brand color, reuse the color picker pattern from `src/app/onboarding/3/page.tsx`:

```tsx
<div>
  <label className="text-label text-foreground">Brand Color</label>
  <div className="mt-1 flex items-center gap-3">
    <input
      type="color"
      value={brandColorValue}
      onChange={(e) => setBrandColorValue(e.target.value)}
      className="h-10 w-10 cursor-pointer rounded-lg border border-border"
    />
    <input
      value={brandColorValue}
      onChange={(e) => setBrandColorValue(e.target.value)}
      className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-body-sm text-foreground font-mono"
    />
  </div>
</div>
```

### T4: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Settings page shows editable fields for headline, subheadline, CTA text, brand color, logo URL, sender name
2. Each field has its own Save button
3. Edit headline → click Save → "Saved!" appears for 3 seconds
4. Network failure → error message displayed below field
5. Edit brand color → color picker updates, preview reflects change
6. Live preview updates in real-time as fields change
7. `pnpm lint` and `pnpm build` pass with zero errors

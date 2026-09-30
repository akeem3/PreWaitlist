# Story 18.4 — Settings logo upload with delete/replace

**Status:** ready
**Epic:** 18 — Live Waitlist Page Redesign (Bare-Minimum Contract)
**Depends on:** —
**Design Refs:** `docs/design/High-fidelity-svgs/HF 6 onboard step 3.svg` (upload control); onboarding Step 3 implementation is the functional reference
**Source:** [Epic 18 W4/W8](../epics/epic-18-live-waitlist-page-redesign.md), [PRD REQ-6.8.4 logo upload](../PRD.md) (deviation annotated per W4), [src/app/dashboard/[waitlistId]/settings/client.tsx](../../src/app/dashboard/[waitlistId]/settings/client.tsx), [src/app/onboarding/3/page.tsx](../../src/app/onboarding/3/page.tsx)

## Story

As a founder editing settings, I want to upload, remove, and replace my logo like I did in onboarding — instead of pasting a URL or base64 blob.

## Acceptance Criteria (EARS)

- AC1: The waitlist-settings Logo URL text input (`src/app/dashboard/[waitlistId]/settings/client.tsx:299-305`) shall be replaced by an upload control accepting `image/png,image/svg+xml` files and converting to base64 via `FileReader` — the same pattern as `src/app/onboarding/3/page.tsx:112-135` (FileReader) and `:418-442` (control markup).
- AC2: When a logo is set, the control shall show a thumbnail preview plus a Remove action (clears `logo_url` through the existing `saveField` path) and a replace action (choosing a new file overwrites the value). When no logo is set, only the upload action shows.
- AC3: The settings preview panel (`:338-350`) shall continue reflecting `logoUrl`; no base64/URL blob shall be editable in a text input anywhere in settings.
- AC4: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) upload control replacing URL input
- T2 (AC2) thumbnail + remove + replace states
- T3 (AC3) preview wiring check + no text-input blobs
- T4 (AC4) lint + build

## Out of Scope

- Supabase Storage / REQ-6.8.4 full compliance (W4 locks base64 reuse this epic; 18.5 annotates the PRD)
- File-size/type enforcement beyond `accept` + existing 2MB check — mirror onboarding exactly
- Onboarding Step 3 changes (it is the reference, not a target)
- Logo rendering on the public page / preview (unchanged — renderer already displays `logoUrl`)
- Other settings fields (headline, subheadline, CTA, brand color, sender, address, thresholds)
- The edit-after-onboarding page (`dashboard-edit-after-onboarding`) — different surface, not in this epic's ACs (only one "Logo URL" input exists in the repo, in settings — verified by search)

## Dev Notes

**Verified against current code (all line refs confirmed):**

| Location                | Lines                                        | Current state                                                                                                                                                                                                                                                                                 |
| ----------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `settings/client.tsx`   | 668 L                                        | Primary file                                                                                                                                                                                                                                                                                  |
| `:56`                   |                                              | `const [logoUrl, setLogoUrl] = useState(waitlist.logo_url ?? "")`                                                                                                                                                                                                                             |
| `:87-93`                |                                              | `saveField(column, value)` → `PATCH` with dynamic key — existing save path                                                                                                                                                                                                                    |
| `:299-305`              |                                              | **Replace this:** `<Input label="Logo URL" … onBlur={() => saveField("logo_url", logoUrl)} placeholder="https://example.com/logo.png" />`                                                                                                                                                     |
| `:327-332`              |                                              | "Saving…"/"Saved" status indicators (keep — `saveField` drives them)                                                                                                                                                                                                                          |
| `:338-350`              |                                              | Preview card — `<LivePreview … logoUrl={logoUrl} …>` passthrough at `:347`                                                                                                                                                                                                                    |
| `onboarding/3/page.tsx` | `:112-135`                                   | **FileReader pattern** — `:113-116` 2MB check + `alert("File must be under 2MB")`, `:118-119` file state, `:122-129` `FileReader` → `readAsDataURL` → `setLogoUrl(dataURL)`                                                                                                                   |
| `:418-442`              |                                              | **Control markup** — label "Logo" `:420`, dashed-border button `:421-434` with 4 states: `"Uploading..."` / `logoFile.name` / `"Logo uploaded — click to replace"` / `"Click to upload logo (PNG or SVG, max 2MB)"`, hidden `<input type="file" accept="image/png,image/svg+xml">` `:435-441` |
| `api/waitlist/route.ts` | `:201` (insert), PATCH dynamic-field pattern | PATCH copies fields when `body.X !== undefined` — `logo_url: ""` saves as empty string (falsy → no logo renders; renderer guards `(logoUrl                                                                                                                                                    |     | productName)`at`waitlist-template-content.tsx:51`) |

### T1 — upload control replacing URL input (AC1)

Remove the `Logo URL` `Input` (`:299-305`). In its place, mirror onboarding's control (copy markup/classes from `onboarding/3/page.tsx:418-442` **at execution time** — do not retype from memory):

```tsx
<div className="mb-3">
  {" "}
  {/* matches Content tab field rhythm */}
  <label className="mb-1 block text-xs text-muted-foreground">Logo</label>
  <button
    type="button"
    onClick={handleLogoClick}
    disabled={saving || logoUploading}
    className="/* onboarding :425 classes verbatim */"
  >
    {logoUploading
      ? "Uploading..."
      : logoUrl
        ? "Logo uploaded — click to replace"
        : "Click to upload logo (PNG or SVG, max 2MB)"}
  </button>
  <input
    ref={fileInputRef}
    type="file"
    accept="image/png,image/svg+xml"
    onChange={handleLogoChange}
    className="hidden"
  />
</div>
```

- **New local state:** `logoUploading` + `logoFile` (mirroring onboarding `:53`/`:118`); `fileInputRef` triggers the hidden input.
- **`handleLogoChange`** (mirror onboarding `:112-135`):
  1. `file.size > 2 * 1024 * 1024` → `alert("File must be under 2MB")` (existing string) + return.
  2. `FileReader` → `onload` → `const dataUrl = reader.result as string` → `setLogoUrl(dataUrl)` → **`saveField("logo_url", dataUrl)`** (settings must persist immediately — there is no submit button; onboarding saves at Step 3 submit via context, settings has no equivalent).
- **Label:** "Logo URL" → **"Logo"** — reuses the onboarding label verbatim (W8-approved). All four button states reuse onboarding's existing strings verbatim (W8).

### T2 — thumbnail + remove + replace states (AC2)

Layout when logo set (base64 data URL):

```tsx
<div className="flex items-center gap-3">
  <Image
    src={logoUrl}
    alt="Logo"
    width={40}
    height={40}
    unoptimized
    className="h-10 w-10 rounded-md border border-border bg-card object-contain"
  />
  {/* Replace = the upload button (state "Logo uploaded — click to replace") */}
  {/* Remove = clears */}
  <button type="button" onClick={handleRemoveLogo} className="…tokens only…">
    Remove
  </button>
</div>
```

- **Thumbnail:** `next/image` with **`unoptimized`** (required for base64 data URLs — MEMORY Story 1.6). `alt="Logo"` matches renderer/test convention.
- **Replace:** choosing a new file through the same picker overwrites `logoUrl` + re-saves (T1's handler) — no separate replace button needed; the upload button's `:432` state already says "click to replace".
- **Remove:** `handleRemoveLogo` → `setLogoUrl("")` + `setLogoFile(null)` + `saveField("logo_url", "")`. Empty string persists (PATCH `!== undefined` semantics verified); falsy → preview + public page render without logo; Upload-only state returns.
- **No logo set:** only the upload button shows (thumbnail/Remove hidden) — matches AC2.
- **Copy gate (W8):** the epic approves the _Remove action_ (AC2). The visible label **"Remove"** follows existing in-product precedent — visible "Remove domain" button (`components/billing/domain-auth-section.tsx:293/:311`) and `title="Remove tier"` (`onboarding/3/page.tsx:533`). Use **"Remove"** verbatim (not "Remove logo" / "Clear logo" / "Delete") — any different wording is a COPY GAP → founder gate. If the founder prefers an icon-only control, mirror the onboarding × -icon pattern (`onboarding/3/page.tsx:527-539`) with `title`/`aria-label` instead — flag wording for approval either way.
- Save feedback: existing "Saving…"/"Saved" (`:327-332`) still fires via `saveField` — no new status strings.

### T3 — preview wiring + no blobs (AC3)

- Preview passthrough `logoUrl={logoUrl}` (`:347`) stays untouched — new state variable name is unchanged, so the panel keeps reflecting uploads/removals live.
- AC3 verification: `grep -n "Logo URL" src/app/dashboard` → zero hits after T1; no `<input type="text">` anywhere in settings accepts `data:image`/URL blobs (brand-color hex input is unrelated and stays).

### T4 — lint + build (AC4)

```bash
pnpm lint
pnpm build   # delete .next first
```

Settings-logo tests land in 18.5.

## Files to Create/Modify

| File                                                 | Change                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/app/dashboard/[waitlistId]/settings/client.tsx` | Remove URL input; upload control + FileReader + states + Remove (T1–T2); preview check (T3) |

## Risk

- **Large payloads:** base64 logos already travel through the same `saveField` → `PATCH /api/waitlist` path from onboarding (worked since Epic 6) — no new infra; 2MB check caps size.
- **`alert()` for size errors** is onboarding's existing pattern — deliberate reuse (changing it = UX/copy change out of scope).
- **SVGs via `readAsDataURL`:** data URL for `.svg` works in `<img>`/`next/image` unoptimized — same as onboarding.
- **Concurrent saves:** `saveField` fires immediately on file load — rapid pick/remove cycles queue PATCHes; existing debounce/`saving` semantics unchanged (no worse than other settings fields).
- **PRD deviation:** REQ-6.8.4 says Supabase Storage — W4 locks base64 this epic; 18.5 annotates PRD. Do not "fix" toward Storage.

# Story 12.1.4 — Founder Updates Compose UI

**Epic:** 12.1 — Dashboard Overhaul
**Status:** ready
**Depends on:** 12.1.0
**Design Refs:** —

## Story

As a founder, I want a page to compose and publish updates to my waitlist page so that I can keep my subscribers informed.

## Acceptance Criteria (EARS)

- AC1: The system shall render `/dashboard/updates` as a new page with a compose form.
- AC2: The page shall include a textarea for the update body (min 10 characters, max 2000 characters).
- AC3: The page shall include a "Publish" button that calls `POST /api/updates` with `{ body: string }`.
- AC4: On successful publish, the page shall show a success message and clear the textarea.
- AC5: On error, the page shall display the error message from the API response.
- AC6: The page shall display the 10 most recent updates in reverse chronological order below the compose form.
- AC7: Each update shall show the body text and `created_at` date.
- AC8: The sidebar "Updates" nav item (currently disabled) shall link to `/dashboard/updates` and be enabled.
- AC9: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Updates compose page with textarea · T2 (AC3-AC5) Publish button + API call + error handling · T3 (AC6-AC7) Recent updates feed · T4 (AC8) Enable sidebar nav item · T5 (AC9) Lint + build

## Out of Scope

Rich text editor, image attachments, edit/delete updates, email sending (deferred to Epic 12), update scheduling.

## Implementation Details

### T1: Updates compose page with textarea

- **New file:** `src/app/dashboard/updates/page.tsx` (server component for auth check)

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UpdatesClient from "./client";

export default async function UpdatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) redirect("/dashboard");

  // Fetch recent updates
  const { data: updates } = await supabase
    .from("founder_updates")
    .select("id, body, created_at")
    .eq("waitlist_id", waitlist.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return <UpdatesClient updates={updates ?? []} />;
}
```

- **New file:** `src/app/dashboard/updates/client.tsx` (client component for form)

```typescript
"use client";

import { useState } from "react";
import { Sidebar } from "../../../../components/dashboard/sidebar";

interface Update {
  id: string;
  body: string;
  created_at: string;
}

interface UpdatesClientProps {
  updates: Update[];
}

export default function UpdatesClient({ updates: initialUpdates }: UpdatesClientProps) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updates, setUpdates] = useState(initialUpdates);

  // AC2: Character count
  const charCount = body.length;
  const isValid = charCount >= 10 && charCount <= 2000;

  // AC3: Publish
  async function handlePublish() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to publish update");
        return;
      }

      // AC4: Success — clear form, prepend to list
      setBody("");
      setSuccess(true);
      setUpdates((prev) => [
        { id: data.id, body, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-h2 text-foreground">Updates</h1>

        {/* Compose form */}
        <div className="mb-8 rounded-(--card-radius) border border-border bg-card p-5">
          <label className="mb-2 block text-label text-foreground">
            Share an update with your waitlist
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's new? Share progress, ask questions, or just say hi..."
            rows={5}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-sm text-foreground placeholder:text-muted-foreground resize-y"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {charCount}/2000
            </span>
            <div className="flex items-center gap-3">
              {success && (
                <span className="text-xs text-accent">Published!</span>
              )}
              {error && (
                <span className="text-xs text-destructive">{error}</span>
              )}
              <button
                type="button"
                onClick={handlePublish}
                disabled={!isValid || saving}
                className="rounded-lg bg-accent px-4 py-2 text-body-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </div>

        {/* Recent updates feed */}
        {updates.length > 0 && (
          <div>
            <h2 className="mb-4 text-body-sm font-semibold text-foreground">Recent updates</h2>
            <div className="space-y-3">
              {updates.map((update) => (
                <div
                  key={update.id}
                  className="rounded-(--card-radius) border border-border bg-card p-4"
                >
                  <p className="mb-2 text-body-sm text-foreground whitespace-pre-wrap">
                    {update.body}
                  </p>
                  <time className="text-xs text-muted-foreground">
                    {new Date(update.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

### T2: Publish button + API call + error handling

Covered in T1 above. The `POST /api/updates` endpoint already exists (created in Epic 5). It accepts `{ body: string }` and returns `{ id: string }` on success or `{ error: string }` on failure.

### T3: Recent updates feed

Covered in T1 above. The server component fetches the 10 most recent updates and passes them to the client component. The client component renders them in reverse chronological order.

### T4: Enable sidebar nav item

- **File to modify:** `components/dashboard/sidebar.tsx`

In the `NAV_SECTIONS` array (from Story 12.1.0), change the Updates item from `disabled: true` to a proper link:

```typescript
{
  label: "Updates",
  href: "/dashboard/updates",
  icon: (/* existing bell SVG */),
},
```

Remove `disabled: true` from the item. This moves it from the "Coming soon" group to an active nav item in the ENGAGEMENT section.

### T5: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Navigate to `/dashboard/updates` → compose form with textarea and Publish button
2. Type < 10 characters → Publish button disabled
3. Type 10+ characters → Publish button enabled
4. Click Publish → success message, textarea cleared, update appears in recent feed
5. Network error → error message displayed
6. Sidebar "Updates" nav item is now clickable and links to `/dashboard/updates`
7. Recent updates show body text and formatted date
8. `pnpm lint` and `pnpm build` pass with zero errors

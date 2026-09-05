---
id: epic9.story03
epic: epic-9-dashboard-restructure
title: CSV Export (Pro Tier)
status: ready
depends_on: [epic9.story02]
updated: 2026-08-31
---

# Story 9.3 — CSV Export (Pro Tier)

**Status:** ready
**Design Refs:** — (no UI design — API endpoint + button only)

**Story:** As a Pro tier founder, I want to export my subscriber data as a CSV file so that I can analyze it in spreadsheet software.

## Design Specs

No design SVG for this feature. Implementation follows standard CSV export pattern.

**Button placement:** Top-right of subscriber table area, secondary variant, small size. Text: "Export CSV". Placed inside the subscriber count row, right-aligned.

**Current implementation (client.tsx:117-141, 403-411):**

- ✅ Export CSV button renders only when `tier === "pro"`
- ✅ Client-side CSV generation with correct headers: position, email, referral_code, referral_count, created_at
- ✅ Filename: `subscribers-{subdomain}-{YYYY-MM-DD}.csv`
- ✅ Button styled with `border-border bg-card`, secondary variant

## Acceptance Criteria (EARS)

- AC1: The dashboard shall display a "Export CSV" button when the founder's tier is Pro.
- AC2: The button shall not render when tier is Free.
- AC3: Clicking the button shall download a CSV file containing: position, email, referral_code, referral_count, created_at.
- AC4: The CSV file shall be named `subscribers-{subdomain}-{YYYY-MM-DD}.csv`.
- AC5: Client-side generation with server-verified tier (Option A from story spec).
- AC6: Lint and build shall pass with zero errors.

## Implementation Status

| AC  | Status | Notes                                                                    |
| --- | ------ | ------------------------------------------------------------------------ |
| AC1 | ✅     | Button renders when tier === "pro"                                       |
| AC2 | ✅     | Button hidden when tier !== "pro"                                        |
| AC3 | ✅     | CSV headers match spec (warmth_score omitted — not in subscriber select) |
| AC4 | ✅     | Filename format correct                                                  |
| AC5 | ✅     | Client-side generation, tier verified server-side                        |
| AC6 | ✅     | Lint + build pass                                                        |

## Tasks

- T1 (AC1-AC2): Already implemented
- T2 (AC3-AC4): Already implemented
- T3 (AC5): Already implemented (client-side with server-verified tier)
- T4 (AC6): Lint + build verification

## Out of scope

CSV export for Free tier (upsell opportunity), custom column selection, filtered export (Sprint 2 exports all subscribers).

## Dev Notes

### T1 — Conditional Button Render

Add `tier` to the server component query in `page.tsx`:

```diff
  const { data: waitlist } = await supabase
    .from("waitlists")
-   .select("id, headline, subdomain, template, status, logo_url")
+   .select("id, headline, subdomain, template, status, logo_url, tier")
    .eq("founder_id", user.id)
    .single();
```

Pass `tier` and `subdomain` to client component. Conditionally render button:

```tsx
{
  tier === "pro" && (
    <button
      type="button"
      onClick={handleExportCsv}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-body-sm text-foreground transition-colors hover:bg-muted/50"
    >
      Export CSV
    </button>
  );
}
```

**Status:** not started — `page.tsx:17-18` queries `waitlists` but does NOT select `tier`. `client.tsx` has no export button.

### T2 — CSV Generation + Download

Client-side CSV generation (no API needed for basic export):

```tsx
function handleExportCsv() {
  const headers = [
    "position",
    "email",
    "referral_code",
    "referral_count",
    "warmth_score",
    "created_at",
  ];
  const rows = subscribers.map((s) => [
    s.position,
    s.email,
    s.referral_code,
    s.referral_count,
    s.warmth_score || "",
    s.created_at,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `subscribers-${subdomain}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Status:** not started.

**Note:** Need to add `referral_code` and `warmth_score` to the subscriber select in `page.tsx`:

```diff
- .select("id, email, position, warmth_score, created_at")
+ .select("id, email, position, referral_code, referral_count, warmth_score, created_at")
```

Wait — `referral_count` is computed client-side (batch query in `page.tsx:36-51`), not stored in DB. Need to include it in the subscriber mapping.

### T3 — API Route (Optional — Tier Check)

For security, the tier check should happen server-side. Two approaches:

**Option A (recommended):** Client-side generation with server-verified tier. The server already verified auth and returned tier. Trust the client-side tier value since it came from the authenticated server response.

**Option B:** Dedicated API route `GET /api/subscribers/export?waitlist_id=xxx`. Check tier, query subscribers, return CSV with `Content-Type: text/csv` header. More secure but adds complexity.

Go with Option A for Sprint 2 scope. The tier was already verified by the server component before passing to client.

**Status:** not started — no export API route exists. Existing API routes: `POST /api/subscribers`, `GET /api/subscribers/[id]`, `GET /api/subscribers/[id]/referrals`.

### T4 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files modified:**

- `src/app/dashboard/page.tsx` (add `tier` to select, add `referral_code` to select, pass tier+subdomain to client)
- `src/app/dashboard/client.tsx` (add export button + CSV generation function)

**Available components:** None needed
**Available tokens:** Standard button styling from design system

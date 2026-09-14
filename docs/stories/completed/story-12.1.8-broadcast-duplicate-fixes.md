# Story 12.1.8 — Broadcast & Duplicate API Fixes

**Epic:** 12.1 — Dashboard Overhaul
**Status:** done
**Depends on:** —
**Design Refs:** —

## Story

As a founder, I want the broadcast page to default to "all" subscribers and show a confirmation before sending, and I want duplicate API calls eliminated.

## Acceptance Criteria (EARS)

- AC1: The broadcast segment selector shall default to "all" (currently defaults to "cold" at line 37 of `broadcast/client.tsx`).
- AC2: A confirmation dialog shall appear before sending a broadcast: "Send this email to {count} subscribers? This cannot be undone."
- AC3: The broadcast preview shall use the actual sender name (currently hardcoded `updates@prewaitlist.com` at line 226 of `broadcast/client.tsx`).
- AC4: The WarningBanner and WarmthPanel shall share warmth data via a single fetch instead of both calling `/api/dashboard/warmth` independently.
- AC5: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Default segment to "all" · T2 (AC2) Confirmation dialog · T3 (AC3) Dynamic sender in preview · T4 (AC4) Shared warmth data fetch · T5 (AC5) Lint + build

## Out of Scope

Subject/body length validation, broadcast scheduling, email template editor.

## Implementation Details

### T1: Default segment to "all"

- **File to modify:** `src/app/dashboard/broadcast/client.tsx`

```typescript
// Before (line 37):
const [segment, setSegment] = useState<"all" | "hot_warm" | "cold">("cold");

// After:
const [segment, setSegment] = useState<"all" | "hot_warm" | "cold">("all");
```

### T2: Confirmation dialog

Add a confirmation step before `handleSend`:

```typescript
async function handleSend() {
  if (!subject.trim() || !body.trim()) return;

  // AC2: Confirmation
  const confirmed = window.confirm(
    `Send this email to ${activeCount} subscribers? This cannot be undone.`
  );
  if (!confirmed) return;

  setSending(true);
  // ... existing send logic
}
```

For a better UX, replace `window.confirm` with a custom modal if time permits. The `window.confirm` is acceptable for MVP.

### T3: Dynamic sender in preview

- **File to modify:** `src/app/dashboard/broadcast/client.tsx`

```typescript
// Before (line ~226 — in the preview section):
<p className="text-xs text-muted-foreground">From: updates@prewaitlist.com</p>

// After:
const senderDisplay = senderName
  ? `${senderName.toLowerCase().replace(/\s+/g, ".")}@prewaitlist.com`
  : "updates@prewaitlist.com";

// In JSX:
<p className="text-xs text-muted-foreground">From: {senderDisplay}</p>
```

Pass `senderName` as a prop from the server component or fetch it from the waitlist data.

### T4: Shared warmth data fetch

- **File to modify:** `src/app/dashboard/client.tsx`
- **File to modify:** `components/dashboard/warning-banner.tsx`
- **File to modify:** `components/dashboard/warmth-panel.tsx`

Currently, `WarningBanner` and `WarmthPanel` each independently fetch from `/api/dashboard/warmth`. Lift the fetch to `client.tsx`:

```typescript
// In client.tsx — single fetch
const [warmthData, setWarmthData] = useState(null);

useEffect(() => {
  fetch("/api/dashboard/warmth")
    .then((r) => r.json())
    .then(setWarmthData)
    .catch(() => {});
}, []);

// Pass to both components:
<WarningBanner coldThreshold={coldThreshold} warmthData={warmthData} />
<WarmthPanel tier={tier} warmthData={warmthData} />
```

Modify `WarningBanner` and `WarmthPanel` to accept `warmthData` as a prop instead of fetching internally.

### T5: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Broadcast page: segment defaults to "All" (not "Cold")
2. Click Send → confirmation dialog appears with subscriber count
3. Cancel → no send. Confirm → send proceeds
4. Broadcast preview shows actual sender name (not hardcoded email)
5. Dashboard: WarningBanner and WarmthPanel share a single warmth fetch (check Network tab — only 1 `/api/dashboard/warmth` call)
6. `pnpm lint` and `pnpm build` pass with zero errors

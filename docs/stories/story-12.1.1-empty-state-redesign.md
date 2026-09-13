# Story 12.1.1 — Empty State Redesign

**Epic:** 12.1 — Dashboard Overhaul
**Status:** ready
**Depends on:** 12.1.0
**Design Refs:** `docs/design/High-fidelity-svgs/Dashboard_Empty_state_HF4.svg`

## Story

As a new founder, I want a welcoming empty state with clear next steps so that I know what to do after onboarding.

## Acceptance Criteria (EARS)

- AC1: When `subscribers.length === 0`, the dashboard shall display: a welcome heading ("Your waitlist is live at {subdomain}.prewaitlist.com"), a Copy Link button, and a View Public Page button.
- AC2: The empty state shall include a "What to do next" section with 3 benefit-led steps: "Share your page in 1–2 relevant communities", "Tell 5 people personally — personal asks convert 3x better", "Post on social with your referral link".
- AC3: The empty state shall show ghost stat cards (greyed with em-dash values) below the guidance section to preview what the dashboard will look like.
- AC4: The "Preview — this is what it'll look like once signups arrive" text (line 404–406 of `client.tsx`) shall be removed.
- AC5: The onboarding checklist (`CHECKLIST_ITEMS` at lines 79–90 of `client.tsx`) and its rendering (lines 359–402) shall be removed entirely.
- AC6: When subscribers exist, the dashboard shall skip the empty state and render stat cards, chart, and table directly.
- AC7: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Welcome heading + action buttons + guidance steps · T2 (AC3) Ghost stat cards for empty state · T3 (AC4-AC5) Remove preview text and checklist · T4 (AC6) Conditional rendering logic · T5 (AC7) Lint + build

## Out of Scope

Onboarding progress bar (deferred), persistent checklist state, copy-to-clipboard behavior (reuse existing `handleCopy`).

## Implementation Details

### T1: Welcome heading + action buttons + guidance steps

- **File to modify:** `src/app/dashboard/client.tsx`

Replace lines 333–406 (the "Get your first signups" heading, share button, checklist, and preview text) with:

```tsx
{/* Welcome heading */}
<h1 className="mb-2 text-h2 text-foreground">
  Your waitlist is live at {liveUrl}
</h1>
<p className="mb-6 text-body text-muted-foreground">
  Share your link and start collecting signups.
</p>

{/* Action buttons */}
<div className="mb-8 flex gap-3">
  <button
    type="button"
    onClick={handleCopy}
    className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-body-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
  >
    Copy Link
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 4V2.5C10 2 9.5 1.5 9 1.5H3.5C3 1.5 2.5 2 2.5 2.5V9C2.5 9.5 3 10 3.5 10H4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  </button>
  <a
    href={`https://${liveUrl}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-body-sm font-medium text-foreground transition-colors hover:bg-muted/50"
  >
    View Public Page
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5.5 2.5H3C2.5 2.5 2 3 2 3.5V11C2 11.5 2.5 12 3 12H11C11.5 12 12 11.5 12 11V8.5M9 2.5H12M12 2.5V5.5M12 2.5L7 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </a>
</div>

{/* Guidance steps */}
<div className="mb-8 rounded-(--card-radius) border border-border bg-card p-5">
  <h2 className="mb-3 text-body-sm font-semibold text-foreground">What to do next</h2>
  <ol className="space-y-3">
    <li className="flex items-start gap-3 text-body-sm text-foreground">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">1</span>
      Share your page in 1–2 relevant communities
    </li>
    <li className="flex items-start gap-3 text-body-sm text-foreground">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">2</span>
      Tell 5 people personally — personal asks convert 3x better
    </li>
    <li className="flex items-start gap-3 text-body-sm text-foreground">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">3</span>
      Post on social with your referral link
    </li>
  </ol>
</div>
```

### T2: Ghost stat cards for empty state

Keep the existing stat card grid (lines 408–437) but ensure it shows em-dashes when `subscribers.length === 0`. The current `formatStat` function already handles this:

```tsx
<div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
  {/* Total signups */}
  <div className="rounded-(--card-radius) border border-border bg-card px-4 py-3 text-center">
    <div className="mb-1 text-h3 text-foreground">
      {stats ? formatStat(stats.totalSignups) : "—"}
    </div>
    <div className="text-caption text-muted-foreground">Total signups</div>
  </div>
  {/* ... same for Referral %, Today, Warmth */}
</div>
```

### T3: Remove preview text and checklist

- **Delete** `CHECKLIST_ITEMS` constant (lines 79–90)
- **Delete** `checkedItems` state (line 114): `const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());`
- **Delete** the checklist rendering block (lines 359–402)
- **Delete** the "Preview" paragraph (lines 404–406)
- **Delete** `handleShareTwitter` function (lines 199–205) — it was only used to check the "community" checklist item
- **Delete** the Twitter share button (lines 298–304) and the checkmark SVG (lines 305–328) from the header bar — these are checklist-related

### T4: Conditional rendering logic

After T1–T3, the main content area should conditionally render:

```tsx
{subscribers.length === 0 ? (
  /* Empty state: welcome + guidance + ghost cards */
) : (
  /* Data view: stat cards + chart + panels + table */
)}
```

The stat card grid, chart, qualification panel, warmth panel, and subscriber table already exist in lines 439–665. Wrap them in the else branch.

### T5: Lint + build

Run `pnpm lint` and `pnpm build`. Remove any unused imports (`useEffect` if no longer needed).

## Verification

1. Create a founder account with 0 subscribers → dashboard shows welcome heading, Copy Link, View Public Page, guidance steps, ghost stat cards
2. Click "Copy Link" → URL copied to clipboard, button shows "Copied!"
3. Click "View Public Page" → opens public waitlist URL in new tab
4. No checklist visible, no "Preview" text, no Twitter share button in header
5. Add a subscriber → dashboard skips empty state, shows data view with chart + table
6. `pnpm lint` and `pnpm build` pass with zero errors

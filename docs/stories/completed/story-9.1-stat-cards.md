---
id: epic9.story01
epic: epic-9-dashboard-restructure
title: Stat Cards with Real Data
status: ready
depends_on: [epic9.story00]
updated: 2026-08-31
---

# Story 9.1 — Stat Cards with Real Data

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg`, `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`

**Story:** As a founder, I want to see real subscriber statistics in my dashboard so that I can track my waitlist performance.

## Design Specs (from SVG analysis + align-design)

**Active state stat cards (Dashboard_active_state_HF5.svg):**

- 4 cards in a row, white background (`#FFFFFF`), rounded corners, border
- Card 1: "Total signups" — value (subscriber count)
- Card 2: "Referral %" — value (percentage)
- Card 3: "Today" — value (today's signups)
- Card 4: "Warmth" — locked state (🔒 overlay, Pro-only)

**Empty state stat cards (Dashboard_Empty_state_HF4.svg):**

- 4 cards visible with placeholder values
- Warmth card shows locked state (🔒 overlay, Pro-only)
- Fallback: show em-dashes when no data

**Current implementation (client.tsx:307-361):**

- 4 cards: Total signups, Referral %, Today, Warmth (locked)
- Stat cards use `bg-card` (white), `rounded-[var(--card-radius)]`, `border border-border`
- Warmth card has lock icon overlay
- All show real data or em-dashes

## Acceptance Criteria (EARS)

- AC1: The dashboard shall display 4 stat cards: Total Signups, Referral %, Today, Warmth.
- AC2: The Total Signups card shall show the actual subscriber count for the founder's waitlist.
- AC3: The Referral % card shall show the percentage of subscribers who were referred (referred_count / total_count × 100).
- AC4: The Today card shall show the count of subscribers who signed up today.
- AC5: The Warmth card shall display a locked state (🔒 overlay, Pro-only feature).
- AC6: When no data exists (empty waitlist), stat cards shall display em-dashes (—) instead of 0.
- AC7: Stat cards shall be styled with white background (`bg-card`), rounded corners (`rounded-[var(--card-radius)]`), and border (`border-border`).
- AC8: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC2): Total Signups card with real subscriber count
- T2 (AC3): Referral % card with calculation
- T3 (AC4): Today card with count of today's signups
- T4 (AC5): Warmth card with locked state (Pro-only)
- T5 (AC6-AC7): Empty state em-dashes + styling
- T6 (AC8): Lint + build

## Out of scope

Cold/Unscored stat cards (not in design SVG), chart/signups-over-time (placeholder), qualification breakdown panel (not in Sprint 2 scope). Stat cards follow design labels: Total signups, Referral %, Today, Warmth (locked).

## Ambiguity Resolutions

- **Stat card colors:** Design SVG shows white cards (`bg-card`, border) with dark text. Story AC7 confirms `bg-card` (white) with border. Follow story AC7.
- **Warmth card locked:** Design shows Warmth card as locked/Pro-only with lock icon overlay. Not a live data card.
- **"Today" card:** Shows count of subscribers who signed up today (same day). Not a "Page Views" or "Heat Score" card.

## Dev Notes

### T1 — Total Signups Card

In `src/app/dashboard/page.tsx`, derive count from subscriber array length.

```tsx
const stats = {
  totalSignups: subscribersWithCounts.length,
  referralPercentage: ...,
  todaySignups: ...,
};
```

### T2 — Referral % Card

Calculate: `(subscribers with referral_count > 0) / total * 100`. Round to nearest integer. Show em-dash when total is 0.

```tsx
const referralPct = stats.referralPercentage;
// Render: {referralPct !== null ? `${referralPct}%` : "—"}
```

### T3 — Today Card

Count subscribers where `created_at` starts with today's date (YYYY-MM-DD).

```tsx
const today = new Date().toISOString().split("T")[0];
const todaySignups = subscribersWithCounts.filter((s) =>
  s.created_at.startsWith(today)
).length;
```

### T4 — Warmth Card (Locked)

Display locked state with lock icon overlay. No live data.

```tsx
<div className="relative rounded-[var(--card-radius)] border border-border bg-card px-4 py-3 text-center">
  <div className="mb-1 text-h3 text-foreground">—</div>
  <div className="text-caption text-muted-foreground">Warmth</div>
  <div className="absolute inset-0 flex items-center justify-center rounded-[var(--card-radius)] bg-background/80">
    {/* lock icon SVG */}
  </div>
</div>
```

### T5 — Empty State Em-dashes

When count is 0 or null, display `"—"`. Never render "0":

```tsx
function formatStat(value: number): string {
  return value > 0 ? String(value) : "—";
}
```

### T6 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files modified:**

- `src/app/dashboard/page.tsx` (compute stats: totalSignups, referralPercentage, todaySignups, pass to client)
- `src/app/dashboard/client.tsx` (replace stat cards with correct labels: Total signups, Referral %, Today, Warmth locked)

**Available components:** None needed — inline stat cards
**Available tokens:** `bg-card`, `rounded-[var(--card-radius)]`, `border-border`, `text-h3`, `text-caption`, `text-foreground`, `text-muted-foreground`, `bg-background/80` (for lock overlay)

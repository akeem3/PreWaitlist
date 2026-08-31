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

## Design Specs (from SVG analysis)

**Active state stat cards (Dashboard_active_state_HF5.svg):**

- 4 cards in a row, green background (`#0F7A5E` = accent), white text
- Each card: rounded corners, padding
- Card 1: "Page Views" — value "500"
- Card 2: "Heat Score" — value "40"
- Card 3: "Referrals" — value "50%"
- Card 4: "Waitlist Position" — value "32"
- Note: Design labels don't match PRD data model. Follow PRD: Total Signups, Referrals (%), Hot, Warm.

**Empty state stat cards (Dashboard_Empty_state_HF4.svg):**

- No stat cards visible in empty state (dashboard shows getting-started checklist instead)
- Fallback: show em-dashes when no data

**Current implementation (client.tsx:248-267):**

- 5 cards (total signups, referral, hot, warm, cold) — design shows 4
- All show hardcoded em-dashes
- White bg (`bg-card`), not green (`bg-accent`) as design shows

## Acceptance Criteria (EARS)

- AC1: The dashboard shall display 4 stat cards: Total Signups, Referrals, Hot, Warm.
- AC2: The Total Signups card shall show the actual subscriber count for the founder's waitlist.
- AC3: The Referrals card shall show the percentage of subscribers who were referred (referred_count / total_count × 100).
- AC4: The Hot and Warm cards shall show the count of subscribers with `warmth_score` of 'hot' and 'warm' respectively.
- AC5: When no data exists (empty waitlist), stat cards shall display em-dashes (—) instead of 0.
- AC6: Stat cards shall be styled with white background (`bg-card`), rounded corners (`rounded-[var(--card-radius)]`), and border (`border-border`).
- AC7: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC2): Total Signups card with real subscriber count
- T2 (AC3): Referrals percentage card with calculation
- T3 (AC4): Hot/Warm warmth cards with counts
- T4 (AC5): Empty state em-dash rendering
- T5 (AC6-AC7): Styling + lint + build

## Out of scope

Cold/Unscored stat cards (not in design SVG), chart/signups-over-time (placeholder), qualification breakdown panel (not in Sprint 2 scope), "Page Views" and "Heat Score" labels (design uses different data model than PRD — follow PRD).

## Ambiguity Resolutions

- **Stat card colors:** Design SVG shows green cards (`bg-accent`, white text). Story AC6 explicitly says `bg-card` (white). Resolution: Follow story AC6 — white cards with border. Story ACs are the source of truth per AGENTS.md.

## Dev Notes

### T1 — Total Signups Card

In `src/app/dashboard/page.tsx`, derive count from subscriber array length. No separate count query needed since we already fetch all subscribers.

```tsx
// page.tsx — pass stats to client
const stats = {
  totalSignups: subscribersWithCounts.length,
  referralPercentage:
    subscribersWithCounts.length > 0
      ? Math.round(
          (subscribersWithCounts.filter((s) => s.referral_count > 0).length /
            subscribersWithCounts.length) *
            100
        )
      : null,
  hotCount:
    subscribersWithCounts.filter((s) => s.warmth_score === "hot").length ||
    null,
  warmCount:
    subscribersWithCounts.filter((s) => s.warmth_score === "warm").length ||
    null,
};
```

**Status:** not started — current `page.tsx:28-32` queries subscribers but doesn't compute stats. `client.tsx:251` shows hardcoded `"— —"`.

**Important:** Need to add `warmth_score` to the subscriber select query in `page.tsx:30`:

```diff
- .select("id, email, position, created_at")
+ .select("id, email, position, warmth_score, created_at")
```

### T2 — Referrals Percentage

Calculate: `(subscribers with referral_count > 0) / total * 100`. Round to nearest integer. Show em-dash when total is 0.

```tsx
const referralPct = stats.referralPercentage;
// Render: {referralPct !== null ? `${referralPct}%` : "—"}
```

**Status:** not started — `client.tsx:252` shows hardcoded `"—%"`.

### T3 — Hot/Warm Warmth Cards

The `warmth_score` column exists on `subscribers` table (added in Story 7.6 migration). Values: `'hot'`, `'warm'`, `'cold'`, or NULL.

```tsx
// page.tsx query already selects warmth_score after T1 change
// client.tsx renders:
{
  stats.hotCount !== null ? stats.hotCount : "—";
}
{
  stats.warmCount !== null ? stats.warmCount : "—";
}
```

**Status:** schema exists, `src/app/api/warmth/[subdomain]/route.ts:22-29` queries warmth data, but `page.tsx` does NOT select `warmth_score`. `client.tsx:253-255` shows hardcoded `"—"`.

### T4 — Empty State Em-dashes

When count is 0 or null, display `"—"`. Never render "0":

```tsx
function formatStat(value: number | null): string {
  return value !== null && value > 0 ? String(value) : "—";
}
```

**Status:** not started — current implementation always shows em-dash regardless of data.

### T5 — Styling

Use existing card styling from current dashboard:

```tsx
<div className="rounded-[var(--card-radius)] border border-border bg-card px-4 py-3 text-center">
  <div className="mb-1 text-h3 text-foreground">{formatStat(value)}</div>
  <div className="text-caption text-muted-foreground">{label}</div>
</div>
```

Card radius: `var(--card-radius)`. Text: `text-h3` for value, `text-caption` for label.

**Files modified:**

- `src/app/dashboard/page.tsx` (add `warmth_score` to select, compute stats, pass to client)
- `src/app/dashboard/client.tsx` (replace 5 hardcoded cards with 4 real-data cards)

**Available components:** None needed — inline stat cards
**Available tokens:** `bg-card`, `rounded-[var(--card-radius)]`, `border-border`, `text-h3`, `text-caption`, `text-foreground`, `text-muted-foreground`

# Story 12.1.7 — Design Token Compliance

**Epic:** 12.1 — Dashboard Overhaul
**Status:** done
**Depends on:** —
**Design Refs:** —

## Story

As the founder, I want all dashboard components to use design system tokens so that the UI is consistent and maintainable.

## Acceptance Criteria (EARS)

- AC1: The sidebar background `bg-[#FCFCFB]` (line 239 of `sidebar.tsx`) shall be replaced with a design system token. Use `bg-background` or add a new token `--color-sidebar` if needed.
- AC2: The WarningBanner yellow colors (`border-yellow-200`, `bg-yellow-50`, `text-yellow-600`, `text-yellow-800` at line 36 of `warning-banner.tsx`) shall be replaced with design system tokens. Add `--color-warning-border`, `--color-warning-bg`, `--color-warning-text` tokens to `globals.css` if no existing tokens match.
- AC3: The Recharts hardcoded colors `#6b6b6b` and `#e0ddd8` (lines 106–108 of `signup-chart.tsx`) shall use CSS custom properties. Since Recharts requires inline hex, use the token hex values with a comment.
- AC4: The email event log badge colors (`bg-green-100 text-green-800`, etc.) if still hardcoded shall use design system tokens.
- AC5: All new code in this epic shall use design system tokens exclusively — no hardcoded hex values.
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Sidebar bg token · T2 (AC2) Warning banner tokens · T3 (AC3) Chart axis colors · T4 (AC4) Badge colors audit · T5 (AC5) Final audit · T6 (AC6) Lint + build

## Out of Scope

Adding new semantic tokens beyond warning colors, changing existing token values.

## Implementation Details

### T1: Sidebar background token

- **File to modify:** `components/dashboard/sidebar.tsx`

The sidebar uses `bg-[#FCFCFB]` (line 239). The closest design token is `--color-background` (#FAF8F4). Since #FCFCFB is nearly identical (a slightly cooler white), use `bg-background` which resolves to #FAF8F4:

```tsx
// Before (line 239):
"fixed top-0 left-0 z-50 flex h-full w-67 flex-col border-r border-border bg-[#FCFCFB]";

// After:
"fixed top-0 left-0 z-50 flex h-full w-67 flex-col border-r border-border bg-background";
```

If a distinct sidebar shade is needed, add to `globals.css` `@theme inline`:

```css
--color-sidebar: #fcfcfb;
```

Then use `bg-sidebar`. For MVP, `bg-background` is sufficient.

### T2: Warning banner tokens

- **File to modify:** `components/dashboard/warning-banner.tsx`
- **File to modify:** `src/app/globals.css`

Add warning tokens to `globals.css` in the `@theme inline` block:

```css
--color-warning-border: #fbbf24;
--color-warning-bg: #fefce8;
--color-warning-text: #92400e;
```

Then use in `warning-banner.tsx`:

```tsx
// Before:
className = "border-yellow-200 bg-yellow-50 text-yellow-600 ...";
className = "text-yellow-800 ...";

// After:
className = "border-warning-border bg-warning-bg text-warning-text ...";
className = "text-foreground ...";
```

### T3: Chart axis colors

- **File to modify:** `components/dashboard/signup-chart.tsx`

Recharts requires hex string values for `tick={{ fill: "..." }}`. Use the token hex values with a comment:

```typescript
// Before:
tick={{ fill: "#6b6b6b", fontSize: 12 }}
tick={{ fill: "#e0ddd8", fontSize: 12 }}

// After:
tick={{ fill: "#6B6459", fontSize: 12 }} // token: --color-muted-foreground
tick={{ fill: "#CCC9C3", fontSize: 12 }} // token: --color-border
```

These hex values match the design system tokens exactly.

### T4: Badge colors audit

- **File to search:** `components/dashboard/email-event-log.tsx`

Search for hardcoded `bg-green-`, `bg-red-`, `bg-yellow-`, `text-green-`, `text-red-` classes. Replace with design system tokens:

- `bg-green-100 text-green-800` → `bg-accent/10 text-accent` (for success)
- `bg-red-100 text-red-800` → `bg-destructive/10 text-destructive` (for error)
- `bg-yellow-100 text-yellow-800` → `bg-warning-bg text-warning-text` (for warning)

### T5: Final audit

Search all dashboard components for hardcoded hex values (excluding SVG `stroke`/`fill` attributes which are inline):

```bash
rg "#[0-9a-fA-F]{6}" components/dashboard/ src/app/dashboard/ --include "*.tsx" --include "*.ts"
```

Replace any found with token references.

### T6: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Sidebar background matches the rest of the app (warm ivory)
2. Warning banner uses warning tokens (amber/yellow)
3. Chart axis colors match muted-foreground and border tokens
4. Email event log badges use semantic tokens
5. No hardcoded hex values remain in dashboard components (except SVG attributes)
6. `pnpm lint` and `pnpm build` pass with zero errors

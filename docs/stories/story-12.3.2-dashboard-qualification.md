# Story 12.3.2 — Dashboard Qualification Page

**Epic:** 12.3 — Dashboard Section Pages
**Status:** ready
**Depends on:** 12.3.0
**Design Refs:** —

## Story

As the founder, I want to see a detailed breakdown of how subscribers answered my qualification questions so that I understand my audience.

## Acceptance Criteria (EARS)

- AC1: The page shall display at `/dashboard/qualification` with a "Qualification" heading.
- AC2: The page shall show each qualification question as a separate card.
- AC3: Each question card shall display: the question text, a horizontal bar chart showing answer distribution (answer text + count + percentage), and total number of respondents.
- AC4: Questions with zero responses shall show "No responses yet" instead of the bar chart.
- AC5: When no qualification questions are configured, the page shall show: "No qualification questions configured. Add questions during onboarding to collect subscriber data."
- AC6: The page shall reuse the Sidebar component and match the dashboard layout.
- AC7: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC3) Create qualification page with data fetch · T2 (AC4-AC5) Empty states · T3 (AC6) Layout + sidebar · T4 (AC7) Lint + build

## Out of Scope

Editing qualification questions after onboarding (Epic 12.2 Story 12.2.2).

## Implementation Details

### T1-T4: Qualification page

**New files:**

- `src/app/dashboard/qualification/page.tsx` (server component)
- `src/app/dashboard/qualification/client.tsx` (client component)

**Simplest approach:** The existing `QualificationPanel` component (`components/dashboard/qualification-panel.tsx`) already fetches from `/api/dashboard/qualification` and renders bar charts. The new page can simply render this component inside the dashboard layout:

```tsx
// page.tsx (server component)
import QualificationPanel from "../../../../components/dashboard/qualification-panel";

// After auth check + sidebar shell:
<QualificationPanel subdomain={waitlist.subdomain} />;
```

**If a custom layout is needed**, extract the rendering logic from `QualificationPanel` into the new client component. The data shape is:

```ts
{
  questions: [
    { question: string, answers: [{ value: string, count: number }] },
  ];
}
```

**Empty states:**

- Zero questions → "No qualification questions configured..."
- Questions exist but zero responses → "No responses yet" per question card

### T4: Lint + build

## Verification

1. Navigate to `/dashboard/qualification` — shows question cards with bar charts
2. Empty state shows when no questions configured
3. Zero-response questions show "No responses yet"
4. Layout matches dashboard (sidebar + main content)
5. `pnpm lint` and `pnpm build` pass

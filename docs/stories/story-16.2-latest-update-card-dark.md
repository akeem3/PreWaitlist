# Story 16.2 — LatestUpdateCard Dark Template

**Status:** ready
**Epic:** 16 — Leaderboard & Founder Updates Engine Fix
**Depends on:** —
**Design Refs:** Story 7.7 AC5 typography; dark tokens `bg-dark-template-*` / `text-dark-template-*` / `border-dark-template-border` from `src/app/globals.css`
**Source:** [Audit §4 claim 7 / issue 7](../scans/engine-audit-5-engines.md), [Story 7.7](../stories/completed/story-7.7-founder-updates-feed.md), Tailwind v4 `@theme inline` gotcha (MEMORY)

## Story

As a visitor on a dark-template waitlist, I want the Latest update card to match the page theme so it does not appear as a white box on a dark background.

## Acceptance Criteria (EARS)

- AC1: `LatestUpdateCard` shall accept an optional `template?: "minimal" | "bold" | "dark"` prop (default light/current behavior when omitted).
- AC2: When `template === "dark"`, the card shall use dark-template utility classes (e.g. `bg-dark-template-*` / `text-dark-template-*` / `border-dark-template-*`) — **never** hardcoded hex, never `bg-[--color-*]` arbitrary values (Tailwind v4 `@theme inline` does not create CSS custom properties).
- AC3: Light templates (`minimal`, `bold`) shall retain current styling (`bg-card text-foreground border-border`) — no visual regression.
- AC4: Public waitlist page shall pass `template` from the waitlist record into `LatestUpdateCard` (call site `src/app/(public)/[subdomain]/page.tsx` around the `latestUpdate ? <LatestUpdateCard .../>` slot).
- AC5: Typography from Story 7.7 AC5 shall be preserved for both themes: label `text-caption text-muted-foreground`, body `text-body`, timestamp `text-caption text-muted-foreground` (dark: muted → `text-dark-template-secondary` or `text-dark-template-muted` as appropriate for hierarchy).
- AC6: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1–AC2) template prop + dark classes
- T2 (AC3) light-path regression check
- T3 (AC4) wire page call site
- T4 (AC5–AC6) typography + lint/build

## Out of Scope

- Onboarding preview parity for latest-update card (audit open question 6)
- Full on-page updates feed
- Changes to `WaitlistTemplateContent` beyond ensuring the card slot still renders
- Thank-you page updates (no card there today)

## Dev Notes

### T1 — component (`components/public/updates-feed.tsx`)

Current (L13-15):

```tsx
<div className="rounded-[var(--card-radius)] border border-border bg-card p-4">
```

Target:

```tsx
type Template = "minimal" | "bold" | "dark";

interface LatestUpdateCardProps {
  update: Update;
  template?: Template;
}

export function LatestUpdateCard({
  update,
  template = "minimal",
}: LatestUpdateCardProps) {
  const isDark = template === "dark";

  return (
    <div
      className={`rounded-[var(--card-radius)] border p-4 ${
        isDark
          ? "border-dark-template-border bg-dark-template-bg"
          : "border-border bg-card"
      }`}
    >
      <p
        className={`text-caption mb-1 ${isDark ? "text-dark-template-muted" : "text-muted-foreground"}`}
      >
        Latest update
      </p>
      <p
        className={`text-body ${isDark ? "text-dark-template-text" : "text-foreground"}`}
      >
        {update.body}
      </p>
      <time
        className={`text-caption mt-2 block ${isDark ? "text-dark-template-secondary" : "text-muted-foreground"}`}
      >
        {new Date(update.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
    </div>
  );
}
```

Class strings must be complete literals (or template with only boolean branches) so Tailwind's scanner sees `bg-dark-template-bg` etc. — same rule as BrowserFrame/DarkTemplate fixes.

### T3 — call site

`src/app/(public)/[subdomain]/page.tsx`:

- `template` already selected (L18) and passed to `WaitlistTemplateContent` (L90/L110).
- Around L119: `latestUpdate ? <LatestUpdateCard update={latestUpdate} /> : undefined` → add `template={waitlist.template as "minimal" | "bold" | "dark"}`.
- Confirm the slot prop type on `WaitlistTemplateContent` allows the element with extra prop (it should — React node).

### T4 — lint/build

`pnpm lint && pnpm build`.

### Optional test (can land here or 16.3)

Extend `src/__tests__/components/latest-update-card.test.tsx`:

```ts
it("uses dark template classes when template=dark", () => {
  render(<LatestUpdateCard update={fixture} template="dark" />);
  const card = screen.getByText("Latest update").closest("div");
  expect(card?.className).toContain("bg-dark-template-bg");
});
```

## Files to Create/Modify

| File                                                   | Change                                               |
| ------------------------------------------------------ | ---------------------------------------------------- |
| `components/public/updates-feed.tsx`                   | `template` prop + dark/light classes                 |
| `src/app/(public)/[subdomain]/page.tsx`                | Pass `template` into card                            |
| `src/__tests__/components/latest-update-card.test.tsx` | Dark assertion (optional here, required by 16.3 AC7) |

## Risk

- Forgetting utility class literals in dynamic strings → Tailwind drops dark styles (known project gotcha). Keep classes in full literal branches.
- `components/` is project-root — page imports use relative path already; do not switch to `@/components` for this file.

# Story 18.2 — Preview parity: updates slot, trust line, shared strings

**Status:** done
**Epic:** 18 — Live Waitlist Page Redesign (Bare-Minimum Contract)
**Depends on:** 18.0, 18.1
**Design Refs:** — (no SVG); parity contract per W1 (preview = approximation of live: same order + copy, compact scale)
**Source:** [Epic 18 W1/W2/W8](../epics/epic-18-live-waitlist-page-redesign.md), [PRD REQ-6.15.3](../PRD.md), [components/onboarding/live-preview.tsx](../../components/onboarding/live-preview.tsx), [components/public/updates-feed.tsx](../../components/public/updates-feed.tsx), [components/public/email-capture-form.tsx](../../components/public/email-capture-form.tsx)

## Story

As a founder previewing onboarding, I want the preview to show the updates card and trust line like the live page — so what I configure matches what visitors see.

## Acceptance Criteria (EARS)

- AC1: The onboarding preview shall render the founder-updates slot in the same position as the live page (after how-it-works), using a static sample/mock update — the preview shall not fetch live data.
- AC2: Both preview form mocks (`PreviewEmailForm`, `PreviewQuestionForm`) shall render the trust line "No spam. Unsubscribe anytime." below the form controls, matching live placement.
- AC3: The consent sentence (18.1) and trust line shall each be sourced from a single shared module consumed by the live form and both preview mocks — no duplicated literals in `live-preview.tsx` (the current duplicate consent text at `live-preview.tsx:106` vs `email-capture-form.tsx:195` shall be gone).
- AC4: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) sample updates slot in preview
- T2 (AC2) trust line in both preview mocks
- T3 (AC3) shared-string extraction (TrustLine)
- T4 (AC4) lint + build

## Out of Scope

- Renderer order/scale (18.0 owns `variant` + section position — this story only supplies the slot **content**)
- Consent removal itself (18.1 — 18.2 only consumes its `ConsentLine` component)
- Live desktop/mobile toggle behavior, BrowserFrame
- Fetching real founder updates in preview (explicitly forbidden by AC1)
- New copy beyond W8's pre-approved list (see COPY GAP below)

## Dev Notes

**Verified against current code:**

| Location                             | Lines                                           | Current state                                                                                                           |
| ------------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `live-preview.tsx`                   | `:422-435`                                      | `WaitlistTemplateContent` call — **no `latestUpdateSlot` prop** (this story adds it)                                    |
| `:362-376`                           |                                                 | `emailCaptureForm` construction (PreviewQuestionForm / PreviewEmailForm switch)                                         |
| `:114-189`                           |                                                 | `PreviewEmailForm` — input row `:146-185`, `PreviewConsent` at `:186`; **no trust line**                                |
| `:191-310+`                          |                                                 | `PreviewQuestionForm` — `PreviewConsent` at `:308`; **no trust line**                                                   |
| `:84-112`                            |                                                 | `PreviewConsent` — already swapped to `ConsentLine` by 18.1                                                             |
| `email-capture-form.tsx:391-395`     |                                                 | Trust line markup (variant 1): `<p className={mt-2 text-center text-xs + dark-aware}>No spam. Unsubscribe anytime.</p>` |
| `email-capture-form.tsx:434-438`     |                                                 | Identical trust line (variant 2)                                                                                        |
| `components/public/updates-feed.tsx` | 49 L                                            | `LatestUpdateCard` is **presentational** — props `{ update: { id, body, created_at }, template }`; no fetch inside ✓    |
| Live page slot                       | `src/app/(public)/[subdomain]/page.tsx:162-164` | Builds `latestUpdateSlot` from `founder_updates` (`:106`) — reference for shape only                                    |

### T1 — sample updates slot (AC1)

In `live-preview.tsx`, pass a static node to `WaitlistTemplateContent` (alongside `emailCaptureForm` at `:434`):

```tsx
latestUpdateSlot={
  <LatestUpdateCard
    update={PREVIEW_UPDATE}
    template={deferredTemplate}
  />
}
```

- Import `LatestUpdateCard` from `../public/updates-feed` — it is presentational (verified), so passing a mock object renders identical markup to live. No fetch, no network, `ssr:false`-safe (LivePreview loads via `next/dynamic ssr: false` per MEMORY).
- Mock object lives **inside `live-preview.tsx`** (module constant, not per-render):

```tsx
const PREVIEW_UPDATE = {
  id: "preview-update",
  body: /* ← COPY GAP, see below */,
  created_at: "2026-01-01T00:00:00.000Z", // deterministic → "January 1, 2026" (updates-feed.tsx:41-45)
};
```

> **⚠️ COPY GAP (W8) — STOP-AND-ASK before implementing the body string.** The epic's pre-approved list (W8) covers the consent sentence, trust line, how-it-works strings, Step 1 labels, and onboarding logo labels — **not** a sample update body. Do **not** invent one (AGENTS.md: never write user-facing copy). Options to bring to the founder: (a) approve a one-off sample string, (b) reuse an existing approved product/marketing line, (c) approve rendering the card with an empty-body placeholder state. This is the only open copy gate in Epic 18; everything else in this story is pre-approved.

- Position is handled by the renderer (18.0 T3) — after how-it-works; this story only supplies content.
- Preview must not fetch: mock is static by construction.

### T2 — trust line in both preview mocks (AC2)

- Add `<TrustLine … />` (T3) **below the form controls** in both mocks:
  - `PreviewEmailForm`: after the consent line (`:186` area), i.e. last element in the fragment — mirroring live where trust sits beneath the button (`:391-395`).
  - `PreviewQuestionForm`: after its submit row / consent line (`:308` area).
- Matching live placement = below controls, `mt-2 text-center text-xs`, template-aware colors — exact live markup is the source (extracted in T3).

### T3 — shared TrustLine extraction (AC3)

**Extend** `components/public/consent-line.tsx` (created by 18.1) with a second export:

```tsx
export function TrustLine({
  isDark,
  className,
}: {
  isDark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-2 text-center text-xs",
        className,
        isDark ? "text-dark-template-muted" : "text-muted-foreground"
      )}
    >
      No spam. Unsubscribe anytime.
    </p>
  );
}
```

- String is **existing** (`email-capture-form.tsx:394`/`:437`) — W8-approved by use.
- Replace both inline trust `<p>` blocks in `email-capture-form.tsx` (`:391-395`, `:434-438`) with `<TrustLine isDark={isDark} />`.
- Both preview mocks import the same `TrustLine`.
- Result: exactly **one** literal of "No spam. Unsubscribe anytime." and **one** of the consent sentence exist in the codebase (module `components/public/consent-line.tsx`). AC3 verification: `grep -r "No spam. Unsubscribe" components/ src/` → one source file + test assertions only; old `live-preview.tsx:106` consent literal gone (18.1).

### T4 — lint + build (AC4)

```bash
pnpm lint
pnpm build   # delete .next first
```

Tests (parity coverage) land in 18.5.

## Files to Create/Modify

| File                                       | Change                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| `components/onboarding/live-preview.tsx`   | `latestUpdateSlot` + `PREVIEW_UPDATE` mock (T1); `TrustLine` in both mocks (T2) |
| `components/public/consent-line.tsx`       | Add `TrustLine` export (T3)                                                     |
| `components/public/email-capture-form.tsx` | Inline trust `<p>` ×2 → `TrustLine` import (T3)                                 |

## Risk

- **Sample-update body copy gate (above)** — the one true blocker in this story; ask before writing `body`.
- **Preview render weight:** `LivePreview` is `ssr:false` + `useDeferredValue` — do not introduce anything requiring server data; static mock keeps that intact.
- **18.0 ordering dependency:** pass the slot only after the renderer moves it below how-it-works; before 18.0 merges, the slot would appear above the form (current renderer position). Integrate after both dependencies merge (epic execution order).
- **Template-awareness:** card + trust line must look right in dark template (`text-dark-template-muted`, `border-dark-template-border` via `LatestUpdateCard`'s own `template` prop).

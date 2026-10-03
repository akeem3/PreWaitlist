# Story 18.0 — Shared renderer restructure + live/preview variants

**Status:** done
**Epic:** 18 — Live Waitlist Page Redesign (Bare-Minimum Contract)
**Depends on:** —
**Design Refs:** research anatomy (LaunchList/Waitframe/UseWait/Waitlister — see Source), `src/app/globals.css` tokens; **no public-page HF SVG exists** (W7)
**Source:** [Epic 18 Goal + W1/W2/W7](../epics/epic-18-live-waitlist-page-redesign.md), [PRD REQ-6.15.3 updates card position](../PRD.md) (position amended by W2), [components/share/waitlist-template-content.tsx](../../components/share/waitlist-template-content.tsx), [components/public/waitlist-page-content.tsx](../../components/public/waitlist-page-content.tsx), [components/onboarding/live-preview.tsx](../../components/onboarding/live-preview.tsx)

## Story

As a founder, I want my live waitlist page to be a richer, properly paced bare-minimum page while the onboarding preview stays a compact approximation — so the preview communicates the design without pretending to be pixel-identical.

## Acceptance Criteria (EARS)

- AC1: The shared renderer shall present sections in this order on both variants: brand row (logo + product name) → headline → subheadline → signup counter → email capture form slot → milestone chips → how-it-works → founder updates slot. The PoweredBy footer remains rendered by the page wrappers outside the renderer.
- AC2: The renderer shall accept `variant: "live" | "preview"` (default `"preview"`). The `"live"` treatment shall apply the richer scale per Dev Notes (larger hero headline, `text-base`+ subhead, increased section rhythm); the `"preview"` treatment shall retain today's compact scale. Section order and copy shall be identical across variants.
- AC3: The brand row shall be horizontally centered on both variants (currently left-aligned at `waitlist-template-content.tsx:51-73`).
- AC4: The founder updates slot shall render **after** how-it-works (below fold), no longer above the form (`:105-107` today). When no update exists, the slot shall not render (existing behavior, PRD REQ-6.15.3 remainder).
- AC5: How-it-works shall render as a distinct section on both variants: top divider (`border-t border-border`; dark template `border-dark-template-border`), label `text-sm font-medium`, steps `text-sm`, explicit top padding — and the dead `mt-auto` (`:154`) shall be removed. Existing strings ("How it works", "1. Enter your email", "2. Get your position", "3. Refer friends to move up") shall be unchanged.
- AC6: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1, AC3) section order + centered brand row
- T2 (AC2) variant prop + live scale spec wired from `waitlist-page-content.tsx`
- T3 (AC4) updates slot relocation
- T4 (AC5) how-it-works section rebuild
- T5 (AC6) lint + build

## Out of Scope

- Preview-slot content (18.2 — sample update + trust line)
- Consent/trust line (18.1 owns the form's consent replacement)
- Form internals (email capture, questions, cap warnings)
- Page-wrapper background/padding changes beyond what AC2's live rhythm requires
- Footer rendering changes (PoweredByFooter stays in wrappers — `waitlist-page-content.tsx:57-59`, `live-preview.tsx:437-439`)
- Any copy changes (W8 — all strings pre-approved or frozen)

## Dev Notes

**Verified against current code (all line refs confirmed):**

| File                                             | Lines       | Current state                                                                                                                                                                         |
| ------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/share/waitlist-template-content.tsx` | 177 L total | Full section layout — primary rewrite target                                                                                                                                          |
| `:41`                                            |             | `headingClass = "text-4xl font-semibold"` (all templates)                                                                                                                             |
| `:43`                                            |             | `subheadlineSize = isBold ? "text-base" : "text-sm"`                                                                                                                                  |
| `:47`                                            |             | `sectionPadding = isBold ? "pt-3 pb-6" : "pt-2 pb-4"`                                                                                                                                 |
| `:51-73`                                         |             | Brand row — `flex items-center gap-2 mb-1` (`:52`), **no `justify-center`** → left-aligned (AC3)                                                                                      |
| `:75`                                            |             | Hero block `flex flex-col items-center text-center gap-3` (headline/sub/counter/form/milestones today)                                                                                |
| `:105-107`                                       |             | `latestUpdateSlot` **above form** — must move (AC4)                                                                                                                                   |
| `:109`                                           |             | Form slot `w-full max-w-md mt-1`                                                                                                                                                      |
| `:111-150`                                       |             | Milestone chips                                                                                                                                                                       |
| `:153-174`                                       |             | How-it-works — `mt-auto pt-4` at `:154` (mt-auto dead: parent has no free flex space), label `text-xs font-medium` at `:158`, steps `text-xs` at `:164/:167/:170`, **no top divider** |
| `components/public/waitlist-page-content.tsx`    | 62 L        | Live wrapper — `py-12 md:px-8` at `:38`, renderer call `:43-55`, footer `:57-59`                                                                                                      |
| `components/onboarding/live-preview.tsx`         | 446 L       | Preview wrapper — renderer call `:422-435` (**no variant, no latestUpdateSlot today**)                                                                                                |

Only two production call sites exist for `WaitlistTemplateContent` (verified by search): `waitlist-page-content.tsx:43` (live) and `live-preview.tsx:422` (preview — also used by dashboard settings preview at `settings/client.tsx:338`, which flows through LivePreview → gets preview treatment automatically).

### T1 — section order + centered brand row (AC1, AC3)

Target order inside the renderer root:

1. Brand row (`:51-73`)
2. Hero block (`:75`): headline → subheadline → counter → **form slot** → milestones
3. How-it-works (restructured, T4)
4. **Updates slot (relocated, T3)**

Center the brand row — change `:52`:

```tsx
{/* current */}
<div className="flex items-center gap-2 mb-1">
{/* target */}
<div className="flex w-full items-center justify-center gap-2 mb-1">
```

Keep logo `Image` (`h-7 w-7`, `unoptimized` — `:54-61`) and product-name styling (`:63-71`) untouched.

### T2 — variant prop + live scale (AC2)

```tsx
type Variant = "live" | "preview";

interface WaitlistTemplateContentProps {
  // ...existing props...
  variant?: Variant; // default "preview"
}
```

Live vs preview scale (all utility classes; tokens only — no inline styles):

| Token slot                                                    | Preview (today, keep)                   | Live (new)                           |
| ------------------------------------------------------------- | --------------------------------------- | ------------------------------------ |
| Root padding (`:47`)                                          | `isBold ? "pt-3 pb-6" : "pt-2 pb-4"`    | `pt-8 pb-6`                          |
| Root rhythm                                                   | (none — internal `mt-1`/`mt-2`/`gap-3`) | `space-y-6` between root children    |
| Headline (`:41`)                                              | `text-4xl font-semibold`                | `text-4xl sm:text-5xl font-semibold` |
| Subheadline (`:43`)                                           | `isBold ? "text-base" : "text-sm"`      | `text-base` (all templates)          |
| Inner micro-gaps (`:109` `mt-1`, `:112` `mt-2`, hero `gap-3`) | unchanged                               | unchanged                            |

**Implementation guidance:**

- Derive `isLive = variant === "live"` once; apply the three slot changes above.
- **space-y vs mt conflict:** `space-y-6` sets `margin-top` on all root children except the first. The relocated updates-slot wrapper (T3) therefore must NOT carry a hard-coded `mt-4` on live — use a conditional class: `"w-full max-w-md"` (live, space-y provides rhythm) vs `"w-full max-w-md mt-4"` (preview, no space-y). Alternative equally-valid approach: keep one wrapper class and add a `space-y-6`-safe spacer — but do not let two margin-top utilities fight (cascade order in compiled Tailwind is not a contract).
- Wiring: `waitlist-page-content.tsx:43` adds `variant="live"`; `live-preview.tsx:422` adds `variant="preview"` explicitly. Default `"preview"` keeps any future/unguarded call site compact.
- Optional live rhythm bump: `waitlist-page-content.tsx:38` `py-12` → `py-16 md:py-24` (utility classes only; verify visually on mobile + desktop).

### T3 — updates slot relocation (AC4)

Move the block at `:105-107` to after the how-it-works block (before root `</div>` at `:175`):

```tsx
{
  latestUpdateSlot && <div className={updatesClass}>{latestUpdateSlot}</div>;
}
```

- Keep `w-full max-w-md`; widen to `max-w-xl` only if the card reads cramped (visual check at execution — tokens only).
- Conditional `updatesClass` per T2's space-y note.
- "No update → no render" is already satisfied by the `latestUpdateSlot &&` guard (preserve).
- Live page builds the slot at `src/app/(public)/[subdomain]/page.tsx:162-164` (`LatestUpdateCard` from `founder_updates` query `:106`) — **no change needed there**; the renderer simply reorders it.

### T4 — how-it-works rebuild (AC5)

Replace the wrapper at `:153-174`:

```tsx
<div
  className={`border-t ${isDark ? "border-dark-template-border" : isBold ? "border-foreground" : "border-border"} pt-6 text-center ${
    isDark ? "text-dark-template-muted" : "text-muted-foreground"
  }`}
>
  <p className="text-sm font-medium mb-2">How it works</p>
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-5 justify-center …">
    <span className="text-sm">
      <span className="font-semibold">1.</span> Enter your email
    </span>
    <span className="text-sm">
      <span className="font-semibold">2.</span> Get your position
    </span>
    <span className="text-sm">
      <span className="font-semibold">3.</span> Refer friends to move up
    </span>
  </div>
</div>
```

- **Remove `mt-auto`** from the wrapper (AC5) — it is dead (parent root has no free flex space) and its removal is behavior-neutral.
- Bold template divider: `border-foreground` matches bold's `border-2` language — **verify visually**; fall back to `border-border` if it reads heavy.
- Label `text-xs` → `text-sm`; steps `text-xs` → `text-sm`; explicit `pt-6` replaces `pt-4` padding role.
- Strings frozen (W8) — do not touch "How it works" or the three step strings.

### T5 — lint + build (AC6)

```bash
pnpm lint
pnpm build   # delete .next first for a clean build
```

Tests belong to 18.5 (this story ships none).

## Files to Create/Modify

| File                                             | Change                                                                           |
| ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `components/share/waitlist-template-content.tsx` | **Primary** — variant prop, order, centering, updates move, how-it-works (T1–T4) |
| `components/public/waitlist-page-content.tsx`    | Pass `variant="live"`; optional `py-16 md:py-24` bump (T2)                       |
| `components/onboarding/live-preview.tsx`         | Pass `variant="preview"` explicitly at `:422` (T2)                               |

## Risk

- **Existing renderer tests** (`src/__tests__/components/waitlist-template-content.test.tsx`, 101 L): defaultProps omit `variant` → default `"preview"` keeps current scale assertions green. Order assertions do not exist today, so the updates-slot move won't break them; 18.5 adds order/variant coverage.
- **Three templates × two variants = six visual combos** — spot-check minimal/bold/dark on live and preview (dark: `text-dark-template-*` utilities only, never `bg-[--color-*]` arbitrary values — MEMORY gotcha).
- **Bold subheadline already `text-base`** — live change is a no-op for bold subhead; don't "fix" what isn't different.
- Scope creep risk: do not restructure the form or preview mocks (18.1/18.2 own those).

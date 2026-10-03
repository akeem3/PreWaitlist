# Story 18.6 — Renderer visual redesign (brand lockup, type, rhythm)

**Status:** done
**Epic:** 18 — Live Waitlist Page Redesign (extension: visual redesign)
**Depends on:** 18.0
**Design Refs:** `docs/design/waitlist-page-design-guide.md` §2 anatomy · §3 top-left lockup · §4 type ladder · §5 hero · §7.1–§7.4 sections · §8 spacing; round-2 founder directives 2026-09-30
**Source:** [Epic 18 Story 18.6](../epics/epic-18-live-waitlist-page-redesign.md), [plan D1–D6](../epic-18-visual-redesign-plan.md), [PRD REQ-6.15.3](../PRD.md)

## Story

As a visitor, I want the waitlist page to read like a designed launch page — screen top-left brand identity, one dominant extrabold headline, readable body copy, and a distinct how-it-works block — so the page feels intentional instead of a bare form.

## Acceptance Criteria (EARS)

- AC1: The renderer module shall export a `WaitlistBrand` lockup (logo 36px live / 28px preview + wordmark `font-bold` `text-2xl` live / `text-sm` preview, dark-template-aware) that the **page shells** render at the screen top-left (live: full-width `pt-6` row above the centered column; preview: inside the frame above the content). The renderer itself shall never render the brand, and the header section shall be omitted entirely when neither logo nor product name exists (guide §3).
- AC2: The headline shall follow guide §4/§5 — live `text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight` with `max-w-xl text-balance`; preview `text-4xl`. The subheadline shall be `text-lg` live / `text-base` preview, `font-medium`, `max-w-md leading-relaxed`, foreground (never muted).
- AC3: How-it-works shall render as the designed 3-step block (guide §7.1): template-aware `border-t`, `pt-8` live / `pt-6` preview, label `text-sm font-semibold`, grid 1-col → `sm:grid-cols-3`, template step cards (minimal `border-border bg-card` · bold `border-2 border-foreground bg-muted` · dark `border-dark-template-border bg-dark-template-input`), brand-colored bold step numbers, frozen strings verbatim, no `mt-auto`.
- AC4: Section rhythm shall use the root `space-y` model on the 8px grid — live `space-y-8 pt-6 pb-8`, preview `space-y-5 pt-4 pb-6` (compact density `space-y-3 pt-3 pb-5`) — with zero ad-hoc section-level `mt-*` spacing.
- AC5: The live shell shall vertically center the content column (`flex-1 justify-center`) with the footer pinned below, and shall paint the page background per guide §9 (`bg-background`, dark `bg-dark-template-bg`).
- AC6: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) `WaitlistBrand` export + shell/frame placement + conditional header
- T2 (AC2) headline/subheadline classes
- T3 (AC3) how-it-works variant padding + label weight
- T4 (AC4–AC5) rhythm + shell centering/bg
- T5 (AC6) lint + build

## Out of Scope

- Form internals (18.7), preview fit mechanics (18.8), guide authoring/gates (18.9), footer component changes
- New copy — W8 copy gate applies (frozen how-it-works strings)

## Dev Notes

### T1 — brand lockup (AC1)

- `WaitlistBrand` exported from `components/share/waitlist-template-content.tsx` (logo `next/image` + wordmark span); dark-aware (`isDark ? "text-dark-template-text" : "text-foreground"`).
- Live shell `components/public/waitlist-page-content.tsx`: conditional `{(logoUrl || productName) && <div className="pt-6"><WaitlistBrand … /></div>}` full-width row **above** the centered content column — no row when neither exists (founder round-2: brand left the content stack, D2).
- Preview `components/onboarding/live-preview.tsx`: same conditional `pt-6` wrapper inside `BrowserFrame` above the content wrapper.
- **18.0 AC3 superseded** — centered brand row in the renderer removed; annotation added in the epic.

### T2 — type (AC2)

- Live h1: `text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-xl text-balance` (round-2 amends the 18.0 Dev Notes `text-4xl sm:text-5xl font-semibold` spec).
- Preview h1: `text-4xl font-extrabold tracking-tight leading-tight` (density model unchanged: preview keeps `text-4xl`).
- Subheadline: live `text-lg`, preview `text-base`, both `font-medium max-w-md leading-relaxed text-foreground`.
- Type ladder lives in guide §4 — the test asserts the exact class strings.

### T3 — how-it-works (AC3)

- Section wrapper gets the variant padding: `isLive ? "pt-8" : "pt-6"` (Phase-4 conformance fix — §7.1/§8 split; preview `pt-6` matches §8 row).
- Label `font-semibold` (18.0 AC5 `font-medium` annotated/superseded).
- Step cards get per-template classes per §7.1/§9 character map; step numbers `text-accent font-bold` — except dark template keeps `text-dark-template-text`-safe styling (verify against §9 dark row).

### T4 — rhythm + shell (AC4–AC5)

- Renderer root: live `space-y-8 pt-6 pb-8`, preview `space-y-5 pt-4 pb-6`, compact `space-y-3 pt-3 pb-5`; section-level `mt-*` removed.
- Live shell content column: `flex-1 flex flex-col justify-center` so the stack centers when optional modules are off (dead-space fix from plan Context); footer stays outside the flex-1 region (pinned bottom).
- Page bg per §9 on the shell root.

### T5 — tests + gates (AC6)

- `src/__tests__/components/waitlist-template-content.test.tsx`: brand tests → `WaitlistBrand` unit tests + "renderer renders no brand"; live/preview scale tests updated to the round-2 classes; +3 conformance tests (headline `max-w-xl text-balance` live; `pt-8` live; `pt-6` but not `pt-8` preview).
- **Gotcha:** preview how-it-works also carries `pt-6` — the "no header section" test must use the exact selector `div[class="pt-6"]`, not `.pt-6` (multi-element match).

## Files to Create/Modify

| File                                                          | Change                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------ |
| `components/share/waitlist-template-content.tsx`              | `WaitlistBrand` export; hero + how-it-works + rhythm classes |
| `components/public/waitlist-page-content.tsx`                 | Conditional top-left brand row; centering; page bg           |
| `components/onboarding/live-preview.tsx`                      | Conditional brand wrapper inside frame                       |
| `src/__tests__/components/waitlist-template-content.test.tsx` | Updates + 3 conformance tests                                |

## Risk

- Class-string tests are brittle by design here (spec lock) — any later class change must update guide §4 first, then the test (guide is source of truth).
- `max-w-xl` on the headline must not push the form slot off-center: hero sits inside the centered `max-w-md`-ish column but headline is allowed to run wider per §5 — verify visually in the founder review pass (§14 checklist).

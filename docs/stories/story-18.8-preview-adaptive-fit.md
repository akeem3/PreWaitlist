# Story 18.8 — Preview adaptive fit + preview template conformance

**Status:** done
**Epic:** 18 — Live Waitlist Page Redesign (extension: visual redesign)
**Depends on:** 18.2
**Design Refs:** `docs/design/waitlist-page-design-guide.md` §11 fit algorithm · §9 template character map · §3 brand row in frame · §7.6 standalone footer
**Source:** [Epic 18 Story 18.8](../epics/epic-18-live-waitlist-page-redesign.md), [plan Context (preview overcrowding)](../epic-18-visual-redesign-plan.md), [PRD REQ-6.9.x preview](../PRD.md)

## Story

As a founder previewing onboarding, I want the whole page visible in the frame at every step — and a preview whose surfaces match the live page — so the miniature stays faithful as I toggle modules.

## Acceptance Criteria (EARS)

- AC1: The frame shall grow with content first — height follows the content's natural height (incl. footer) from a sensible floor up to the available pane height.
- AC2: When natural height exceeds available height, the content shall shrink by a uniform `scale = available / natural` (`transform`, top-center origin, wrapper height compensated to `natural × scale`) clamped at ≈0.6; below the clamp the wrapper shall scroll (`overflow-y-auto`).
- AC3: Beyond ~6 visible modules, section gaps shall step to the compact density (`space-y-3`) so required scaling stays mild (static module count — never scale-driven).
- AC4: A `ResizeObserver` on the **unscaled** content wrapper shall re-fit on every content change (typing, toggles) without feedback loops.
- AC5: Frame surfaces shall conform to guide §9/§3/§7.6: the frame paints the **page background** (`bg-background` light, `bg-dark-template-bg` dark — the browser chrome header keeps its own `bg-card` strip), the brand lockup sits in a `pt-6` row inside the frame (omitted when no brand), and the PoweredBy footer renders `standalone` (no white band on the page bg).
- AC6: Fit mechanism values (scale, wrapper height, overflow) shall be inline styles — runtime-computed values are the sanctioned inline-style exception.
- AC7: Fit tests shall cover: grow (no transform), clamp+scroll at 0.6, intermediate scale on overflow, and re-fit on content growth. Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1–AC2) grow/shrink/scroll mechanics
- T2 (AC3) density step wiring
- T3 (AC4) ResizeObserver on unscaled content
- T4 (AC5) frame bg/brand/footer conformance fixes
- T5 (AC6–AC7) fit tests + lint + build

## Out of Scope

- Renderer content (18.6), form internals (18.7), desktop/mobile toggle behavior (unchanged), guide authoring (18.9)

## Dev Notes

### T1–T3 — fit mechanics (AC1–AC4)

- Primary file: `components/onboarding/live-preview.tsx` — `BrowserFrame` owns measurement state: `available` (pane height minus `h-9`/36px chrome, with class-height fallback because `offsetHeight` is 0 pre-layout), `natural` (unscaled content `scrollHeight`), derived `scale = natural > available ? Math.max(available / natural, 0.6) : 1`, `wrapperHeight = natural × scale`, `needsScroll = scale ≤ 0.6`.
- Inline styles: `style={{ transform: scale(…), … }}` on the scaler; `style={{ height: … }}` on the wrapper; `overflow-y-auto` class when `needsScroll` — runtime values only (sanctioned exception).
- Density: `LivePreview` computes `moduleCount` from visible modules (headline, subheadline, counter, form, milestones, how-it-works, updates, brand…) — `compact = moduleCount > ~6` → root `space-y-3 pt-3 pb-5` (guide §11 density step).
- `ResizeObserver` observes the **unscaled** content node (`preview-content`) so browser-induced reflows (typing into inputs, toggles) re-trigger measurement; guard against loops by only `setState`ing when values actually change (observer fires on wrapper height changes too — observe content, not wrapper).
- Test ids: `preview-scaler`, `preview-content`.

### T4 — template conformance (AC5)

- Phase-4 conformance fixes landed in this story (found by the guide §9 pass):
  1. Frame body `bg-card` → `bg-background` (light) / `bg-dark-template-bg` (dark) — chrome header strip keeps `bg-card`. This exposed a white-band footer bug →
  2. `<PoweredByFooter standalone />` in the preview (standalone = border only, no bg — aligns to §7.6 "footer inherits page bg").
  3. Preview brand row: conditional `<div className="pt-6">` wrapper (mirrors live shell; omitted with no brand).
  4. Preview in-field question text: hardcoded `text-sm` → `${textSize}` (bold template gets `text-base` per §4).
- `components/share/powered-by-footer.tsx` unchanged — only the preview call site passes `standalone`.

### T5 — tests (AC6–AC7)

- `src/__tests__/components/live-preview-fit.test.tsx` (existing 4 tests + updates): grow → no transform / scale 1; natural ≫ available → scale clamped `0.6` + `overflow-y-auto`; intermediate overflow → `0.6 < scale < 1`; content growth (typing simulation / module toggle) → scale re-computed (ResizeObserver path — happy-dom supports `ResizeObserver`; drive via the instance callback captured in the mock if needed).
- `src/__tests__/components/live-preview-parity.test.tsx`: +7 conformance tests — frame bg light (`bg-background`), frame bg dark (`bg-dark-template-bg`), footer `standalone`, brand wrapper `pt-6`, no-header exact selector `div[class="pt-6"]`, CTA `font-semibold`, bold in-field `text-base`.
- Existing fit tests must stay green — the bg/footer changes don't touch measurement, but re-run the file anyway (browser-frame class changes can shift `natural`).

## Files to Create/Modify

| File                                                    | Change                                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `components/onboarding/live-preview.tsx`                | Fit algorithm, density step, frame bg, brand wrapper, footer standalone, textSize |
| `src/__tests__/components/live-preview-fit.test.tsx`    | Fit coverage (grow/clamp/scale/re-fit)                                            |
| `src/__tests__/components/live-preview-parity.test.tsx` | +7 conformance tests                                                              |

## Risk

- **Feedback loop:** observing the wrapper (whose height depends on `scale`) causes oscillation — observe the unscaled content only.
- **`bg-background` change is user-visible in onboarding step 2/3** — the frame previously looked white on a white card; now warm ivory. Covered by §14 founder review; expected, not a bug.
- happy-dom measurement quirks (0 heights pre-layout) — keep the class-height fallback for available; never assert exact pixel scale in tests beyond clamped/intermediate buckets.

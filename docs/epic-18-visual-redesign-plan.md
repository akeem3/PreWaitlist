# Epic 18 Extension — Waitlist Page Visual Redesign Plan

**Status:** complete (2026-09-30) — Phases 0–5 executed; stories 18.6–18.9 done in `docs/epics/epic-18-live-waitlist-page-redesign.md`; uncommitted on `epic-18-waitlist-redesign` awaiting `commit-push`
**Date:** 2026-09-30
**Scope decision:** Fold into Epic 18 (founder, 2026-09-30) — new stories 18.6–18.9, one final commit together with the completed Epic 18 work (currently uncommitted on `epic-18-waitlist-redesign`).

## Context

Epic 18 (18.0–18.5) fixed the waitlist page's **anatomy** — shared renderer variants, consent click-through line, preview parity, Step 1 Headline field, settings logo upload. Founder review of the result surfaced a deeper problem: the page's **visual design** is weak — unstyled brand label "shoved to top center", no styling on How it works, qualification fields placed badly, thin/inconsistent font weights, preview overcrowding as modules accumulate, dead space on the live page when optional modules are off.

The waitlist page is the product's heartbeat (every founder's public page). This plan is a full visual redesign driven by a written design spec — not spot fixes.

## Reference & research basis

- **Primary reference:** Freelance Bold "launching soon" page (founder-supplied, 2026-09-30) — top-left logo, massive extrabold headline, real 16px body copy, stacked full-width form, generous rhythm.
- **Web research:** Spynra (7 elements + numbered structure), Waitlister (Robinhood/Superhuman anatomy), LaunchList, Stackmatix, Flowjam teardowns; hero anatomy (AIDesigner, CSS Crème, beste.co); typography (Apple HIG, Carbon, Visa DS, design.dev); forms (W3C DS, NN/g, web.dev, GitHub Primer, WAI).

## Locked decisions (founder, 2026-09-30)

| #   | Decision                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------- |
| D1  | Reference scope: Freelance Bold + web research (no more reference images)                                   |
| D2  | Logo/brand: **top-left corner** lockup — leaves the content stack                                           |
| D3  | Body copy: existing **subheadline promoted to real body copy** (16px, readable) — no schema/field additions |
| D4  | Form: **always stacked full-width** — no horizontal email+button row variant                                |
| D5  | Sequencing: **fold into Epic 18** (stories 18.6+), one commit at the end                                    |
| D6  | Copy gate (W8) still applies: restyling uses existing strings only; new micro-copy needs founder approval   |

## Phases

### Phase 0 — Design spec (hard gate: founder approval before implementation proceeds beyond it)

**Deliverable:** `docs/design/waitlist-page-design-guide.md`

Contents: page anatomy (module on/off + empty-state composition) · top-left header lockup rules · type ladder (role → size/weight/color) mapped to design-system tokens · hero rules (headline scale, body copy) · form spec (stacked, labels above questions, `(optional)` in label, 44px fields, per-template borders) · section designs (how-it-works block, counter pill, milestone chips, update card, consent/trust, footer) · 8px spacing rhythm · template character maps (minimal/bold/dark) · responsive rules · preview fit algorithm · copy-gate rules.

### Phase 1 — Renderer redesign (shared: live + preview)

**Files:** `components/share/waitlist-template-content.tsx`, `components/public/waitlist-page-content.tsx`, `src/__tests__/components/waitlist-template-content.test.tsx`

- Top-left header lockup (logo + product-name wordmark, `font-semibold` foreground) replaces the centered gray brand row
- Headline → extrabold per type ladder; subheadline → 16px body copy
- How-it-works → designed 3-step block (numbered emphasis, grid layout, template-aware cards)
- Section rhythm on the 8px grid (root `space-y` model, purge ad-hoc `mt-*` hacks)
- Live page vertical centering of the content column (kills the dead bottom band); footer stays pinned
- Preserve Epic 18 invariants: fixed section order, `variant="live"|"preview"` scale model, shared renderer, W2 updates below fold
- Update renderer tests that lock the old styling (centered brand row, divider styling, weight assertions)

### Phase 2 — Form redesign

**Files:** `components/public/email-capture-form.tsx`, `PreviewEmailForm`/`PreviewQuestionForm` in `components/onboarding/live-preview.tsx`, form tests

- Always stacked full-width (email, quals, button one column)
- Visible labels above qualification questions; `(optional)` suffix inside the label; remove the `pr-16` absolute-position hack and in-box fieldset pseudo-labels
- 44px fields, uniform gaps, email-field primacy, per-template borders (Bold keeps its border-2 identity — the complaint was placement, not the border)
- Preview/live parity maintained; parity test stays green

### Phase 3 — Preview adaptive fit (grow + smart shrink)

**Files:** `components/onboarding/live-preview.tsx`, new fit-mechanism tests

1. **Grow first:** frame height follows content natural height up to available pane height
2. **Shrink when full:** uniform `scale = available / natural` (transform, top-origin, wrapper-height compensated), clamp ≈ min 0.6, scroll as last resort
3. **Density steps:** beyond N modules, section gaps step comfortable → compact so scaling stays legible

- `ResizeObserver` measures unscaled content → real-time re-fit, no feedback loops

### Phase 4 — Template pass

Minimal / bold / dark verified against the spec end-to-end (borders, backgrounds, radius, dark tokens). No new colors, no hardcoded hex — design-system tokens only.

### Phase 5 — Epic 18 docs + gates

- Extend `docs/epics/epic-18-live-waitlist-page-redesign.md` with stories **18.6 (renderer), 18.7 (form), 18.8 (preview fit), 18.9 (spec + tests + gates)** + story files; design guide referenced as the epic's design source
- Full test pass: update structural suites for the new design; new tests for the fit mechanism
- **Gates:** lint 0 errors / 5 baseline warnings · prettier · full suite vs baseline **838 total / 831 pass / 7 fail** · clean build
- MEMORY.md sync; **one commit** for all of Epic 18 + redesign when founder runs `commit-push`

## Out of scope

- Copy changes (W8): headline/subheadline/steps/consent/trust strings unchanged
- Schema changes: no new fields (D3) — subheadline carries body copy
- Thank-you page, marketing pages, dashboard (separate surfaces)
- Resurrecting the horizontal form row (D4)

## Risk register

| Risk                                                       | Mitigation                                                                                                |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Structural test churn (renderer 22 tests lock old styling) | Update assertions in the same phase as the code change; behavioral tests untouched                        |
| Preview scale loop (ResizeObserver feedback)               | Measure unscaled content only; clamp + hysteresis                                                         |
| Bold template identity vs "black boxes" complaint          | Keep border-2 (Epic 4 standing character); fix labels/placement first — border weight tunable post-review |
| Pre-existing 7 test failures mask regressions              | Compare against exact baseline (dashboard-archive 4 + dashboard-subscriber-table 3), never raw counts     |

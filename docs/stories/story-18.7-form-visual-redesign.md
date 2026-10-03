# Story 18.7 — Form visual redesign (stacked, in-field questions, order swap)

**Status:** done
**Epic:** 18 — Live Waitlist Page Redesign (extension: visual redesign)
**Depends on:** 18.1
**Design Refs:** `docs/design/waitlist-page-design-guide.md` §6 form spec · §4 in-field question/badge rows · §13 accessibility; round-2 founder directives 2026-09-30 (in-field questions, muted qualifiers, dark visible surface, trust/consent swap)
**Source:** [Epic 18 Story 18.7](../epics/epic-18-live-waitlist-page-redesign.md), [plan D4/D6](../epic-18-visual-redesign-plan.md), [PRD REQ-6.15.x](../PRD.md)

## Story

As a visitor, I want a quiet, consistent stacked form where qualification questions sit inside their fields — so the email field stays primary and the form never changes shape.

## Acceptance Criteria (EARS)

- AC1: The form shall always be stacked full-width (D4): `max-w-md`, `gap-3`, `h-11` fields, identical structure with or without qualification questions; no horizontal row variant in live or preview.
- AC2: Free-text qualification fields shall show the question text **inside the field** — left-aligned muted/70 overlay (per-template `text-sm`/`text-base`) that hides while typing (`peer-placeholder-shown`) with the real input `bg-transparent` over a wrapper, and the `(optional)` badge (`text-xs`, muted) pinned to the field's right end; a real `<label>` plus `aria-label` shall keep the accessible name intact (guide §13). The `pr-16` hack and label-above pattern shall be gone.
- AC3: Qualification field surfaces shall be uniform so the email field keeps template character: light `border border-border bg-muted`, dark `border border-dark-template-border bg-dark-template-input` — never `border-2`, never `bg-card`, never `bg-dark-template-bg` (founder 2026-09-30 — dark fields were invisible).
- AC4: Multiple-choice questions shall keep a visible muted `<legend>` with `(optional)` and stacked radio rows — proximity grouping, no bordered box.
- AC5: Field order shall be email → questions → **trust line → button → consent line** (founder swap 2026-09-30) in the live form and both preview mocks, with consent/trust sourced from the shared `ConsentLine`/`TrustLine` components (W3 frozen strings). **[AMENDED 2026-09-30 round 3 — founder: trust line moved below the consent sentence. Current order = email → questions → button → consent line → trust line.]**
- AC6: The CTA button shall be `h-11 w-full`, brand-colored, `text-white`, **`font-semibold` on every template** (guide §4/§6), bold template keeping `px-7 text-base` and others `px-4 text-sm`.
- AC7: The preview mocks (`PreviewEmailForm`, `PreviewQuestionForm`) shall mirror live: per-template borders/bgs/text sizes, in-field question box, muted qualifier surfaces, trust/consent swap — parity tests stay green.
- AC8: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) stacked layout lock
- T2 (AC2) in-field question overlay + badge + a11y
- T3 (AC3–AC4) muted surfaces + MC legend
- T4 (AC5) order swap in live + preview
- T5 (AC6) button weight
- T6 (AC7) preview mock mirror
- T7 (AC8) lint + build

## Out of Scope

- Renderer/hero/rhythm (18.6), fit mechanics (18.8), cap-warning/error strings (unchanged), consent sentence content (18.1), any new copy (W8)

## Dev Notes

### T1–T3 — structure + in-field questions (AC1–AC4)

- `components/public/email-capture-form.tsx` consts: `qualOverlay` (muted/70 `text-sm`/`text-base` per template), `qualBg` (light `bg-muted border-border` / dark `bg-dark-template-input border-dark-template-border`), `optionalBadge` (`text-xs` muted, absolute right), `focusWithinClasses`.
- Free-text field shape: wrapper (`relative qualBg rounded-lg border … peer-focus-within:ring-1`) → `<input className="peer bg-transparent …">` → `<label className="absolute … invisible peer-placeholder-shown:visible">` → badge span.
- **Peer-order rule:** input must precede the variant target in DOM — input first, overlay label second.
- **`placeholder:` utilities only affect real placeholders** — the overlay is a `<label>`; visibility is driven by `peer-placeholder-shown:visible` on the label, not `placeholder:` classes.
- Accessible name: real `<label for>` wrapping-style association preserved via `htmlFor`/`id`, plus explicit `aria-label` on the input (§13 wording: label is the question, not the placeholder).
- MC: `<legend>` keeps question text + `(optional)`; radio rows `flex items-center gap-2`; no bordered group box (founder: proximity grouping only).

### T4 — order swap (AC5)

- Live: `consentBlock` moved to **after** the submit button; `TrustLine` placed **before** the button. **[AMENDED 2026-09-30 round 3: `TrustLine` now after `consentBlock` — button → consent → trust.]**
- Preview: same order in `PreviewEmailForm` + `PreviewQuestionForm`.
- Consent/trust remain shared `ConsentLine`/`TrustLine` renders — W3 frozen strings, no rewording.

### T5–T6 — button + preview mirror (AC6–AC7)

- Button class: add `font-semibold` to CTA in live form + both preview mocks (Phase-4 conformance fix — §4/§6 weight); keep template paddings (`bold: px-7 text-base`, others `px-4 text-sm`).
- Preview mocks adopt `qualBg`-equivalent wrapper classes, `textSize`-scaled question text (Phase-4 fix: was hardcoded `text-sm` — broke bold template parity), stacked full-width shape (D4).

### T7 — tests (AC8)

- `src/__tests__/components/email-capture-form.test.tsx`: in-field question box present; dark wrapper has `bg-dark-template-input` (not `bg-card`/`bg-dark-template-bg`); light wrapper `bg-muted`; trust line renders **before** the submit button and consent line **after**; overlay hidden after typing (peer mechanism); CTA `font-semibold`.
- `src/__tests__/components/live-preview-parity.test.tsx`: swap neighbour assertions (trust precedes button, consent follows), semibold CTA, bold in-field `text-size` follows `textSize`.
- Existing submit/payload tests unchanged — structure change must not alter the POST body (`email`, `questions`, `ts` timing helper; no consent flag per 18.1).

## Files to Create/Modify

| File                                                    | Change                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------- |
| `components/public/email-capture-form.tsx`              | Stacked shape, in-field overlay, muted surfaces, swap, semibold CTA |
| `components/onboarding/live-preview.tsx`                | `PreviewEmailForm`/`PreviewQuestionForm` mirror + swap + textSize   |
| `src/__tests__/components/email-capture-form.test.tsx`  | Conformance tests                                                   |
| `src/__tests__/components/live-preview-parity.test.tsx` | Swap/surface/weight tests                                           |

## Risk

- Overlay+peer is the most fragile CSS pattern in the epic — if `peer-placeholder-shown` misfires in happy-dom class assertions, assert on class strings rather than computed visibility.
- Changing field DOM order can silently break tests that index fields (`getAllByRole("textbox")[1]`) — run the full email-capture form file after each structural move.
- Never reintroduce `pr-16` — the badge is absolutely positioned inside the wrapper (guide §6 fix).

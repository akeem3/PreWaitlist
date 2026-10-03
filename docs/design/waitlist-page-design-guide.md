# Waitlist Page Design Guide

**Purpose:** Binding visual and UX rules for the public waitlist page and its onboarding preview. Every renderer, form, and section implementation must follow this guide — no exceptions.

**Source:** Freelance Bold reference page (founder-supplied, 2026-09-30) + web research: Spynra waitlist structure, Waitlister anatomy guide, LaunchList, Stackmatix, Flowjam teardowns; hero anatomy (AIDesigner, CSS Crème, beste.co); typography (Apple HIG, Carbon Design System, Visa DS, design.dev); forms (W3C Design System, NN/g, web.dev, GitHub Primer, WAI).

**Date:** 2026-09-30
**Status:** Phase 0 of `docs/epic-18-visual-redesign-plan.md` — founder approval required before implementation phases beyond Phase 1 proceed.

---

## 1. Design Principles

1. **One dominant element.** The headline owns the page. If everything is equally loud, nothing is. Every other element sits visibly below it in the hierarchy.
2. **Copy is readable, not decorative.** Subheadline is body copy at 16px — never caption-sized gray text.
3. **The form is quiet and consistent.** One column, stacked, full-width, identical treatment for every field. Structure never changes shape based on state (with/without qualification questions).
4. **The page breathes.** Generous, consistent vertical rhythm on the 8px grid. Air is a design element.
5. **One system, three characters.** Minimal, Bold, and Dark share the same structure and type ladder; only border weight, surfaces, and colors differ per template.
6. **The preview is a faithful miniature.** Same structure, same order, same strings — compact scale — and it always fits its frame (grow first, then shrink).

---

## 2. Page Anatomy

Section order (fixed — Epic 18 W2 preserved):

| #   | Section                                                 | Always?                             | Notes                        |
| --- | ------------------------------------------------------- | ----------------------------------- | ---------------------------- |
| 1   | **Header** — top-left logo lockup                       | Only if logo or product name exists | Left-aligned; never centered |
| 2   | **Headline**                                            | Always (fallback copy when empty)   | Centered, extrabold          |
| 3   | **Body copy** (subheadline)                             | Always (fallback copy when empty)   | Centered, 16px               |
| 4   | **Signup counter pill**                                 | Toggle                              | Below body copy              |
| 5   | **Form** (email + questions + consent + button + trust) | Always                              | Centered column, stacked     |
| 6   | **Milestone chips**                                     | Toggle                              | Below form                   |
| 7   | **How it works**                                        | Always                              | Designed 3-step block        |
| 8   | **Latest update card**                                  | When updates exist                  | Below the fold (W2)          |
| 9   | **Powered-by footer**                                   | Free tier                           | Bottom of page               |

### Empty-state composition

With counter, milestones, and updates all off, the page still must look intentional (fixes the "dead bottom 40%"):

- **Live page:** content column is **vertically centered** in the viewport (`min-h-screen` flex, content `flex-1 justify-center`); footer pinned at the bottom. Short content sits centered, not stranded at the top.
- **Rhythm does the work:** generous section gaps (§8) make header → hero → how-it-works → footer read as four deliberate bands.

---

## 3. Header — Top-Left Lockup

The brand leaves the content stack and owns the top-left of the **screen** (live) / of the preview frame (preview) — Freelance Bold reference (founder, 2026-09-30 round 2: screen top-left, larger + heavier). Rendered by `WaitlistBrand` (exported from `waitlist-template-content.tsx`): live = `waitlist-page-content.tsx` shell above the centered column; preview = inside `BrowserFrame` above the content.

| Element                 | Live                                                          | Preview                             |
| ----------------------- | ------------------------------------------------------------- | ----------------------------------- |
| Container               | `flex w-full items-center gap-2.5` in a full-width `pt-6` row | same inside frame (`px` from frame) |
| Logo                    | `h-9 w-9 rounded-lg object-contain` (36px)                    | `h-7 w-7 rounded-md object-contain` |
| Wordmark (product name) | `text-2xl font-bold text-foreground`                          | `text-sm font-bold text-foreground` |
| Spacing to hero         | renderer root top padding (§8)                                | same                                |
| Dark template           | wordmark `text-dark-template-text`                            | same                                |

**Fallbacks:**

- Logo only, no product name → logo alone
- Product name only, no logo → wordmark alone
- Neither → no header section rendered

**Rules:**

- The wordmark is **foreground, bold** — never muted gray. It is a brand mark, not metadata. Live size is deliberately large (24px) — it is the screen's identity line.
- The renderer (`WaitlistTemplateContent`) never renders the brand — the shell does.

---

## 4. Type Ladder

Role → size / weight / color. These are the only roles on the waitlist surface.

| Role                           | Size (live)                                      | Size (preview)                     | Weight                                               | Color                                                           |
| ------------------------------ | ------------------------------------------------ | ---------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| Headline                       | `text-5xl` → `sm:text-6xl` (48→60px)             | `text-4xl` (35px)                  | **extrabold (800)** + `tracking-tight leading-tight` | `text-foreground` (dark: `text-dark-template-text`)             |
| Body copy (subheadline)        | `text-lg` (18px)                                 | `text-base` (16px)                 | **medium (500)**                                     | `text-foreground` (dark: `text-dark-template-text`)             |
| Wordmark                       | `text-2xl`                                       | `text-sm`                          | bold (700)                                           | foreground                                                      |
| Counter number                 | `text-sm`                                        | `text-sm`                          | bold (700)                                           | foreground                                                      |
| Counter label                  | `text-sm`                                        | `text-sm`                          | normal (400)                                         | muted                                                           |
| Section label ("How it works") | `text-sm`                                        | `text-sm`                          | semibold (600)                                       | foreground                                                      |
| Step number ("1." …)           | `text-sm`                                        | `text-sm`                          | bold (700)                                           | **brand color**                                                 |
| Step label                     | `text-sm`                                        | `text-sm`                          | medium (500)                                         | foreground                                                      |
| Milestone "Refer N"            | `text-xs`                                        | `text-xs`                          | semibold (600)                                       | foreground                                                      |
| Milestone reward label         | `text-xs`                                        | `text-xs`                          | medium (500)                                         | brand color                                                     |
| In-field question (overlay)    | `text-sm`/`text-base` per template               | same                               | normal (400)                                         | muted /70 (foreground demoted — founder directive 2026-09-30)   |
| "(optional)" badge (in field)  | `text-xs`                                        | `text-xs`                          | normal (400)                                         | warning amber `text-warning` (founder 2026-10-03), pinned right |
| Input text                     | `text-base`                                      | `text-sm`/`text-base` per template | normal (400)                                         | foreground                                                      |
| Input placeholder              | same as input                                    | same                               | normal (400)                                         | muted                                                           |
| Button label                   | `text-base` semibold (bold) / `text-sm` semibold | same                               | semibold (600)                                       | white                                                           |
| Consent line                   | `text-xs`                                        | `text-xs`                          | normal (400)                                         | muted                                                           |
| Trust line                     | `text-xs`                                        | `text-xs`                          | normal (400)                                         | muted                                                           |
| Update card label              | `text-xs` overline                               | `text-xs` overline                 | overline (600, uppercase)                            | muted                                                           |
| Update card body               | `text-base`                                      | `text-base`                        | medium (500), `text-balance` centered                | foreground                                                      |
| Footer                         | `text-xs`                                        | `text-xs`                          | normal (400)                                         | muted / brand per existing footer spec                          |

**Ladder rules:**

- **Floors:** body copy ≥ 16px; any support text ≥ 12px. Nothing below `text-xs`.
- **Weights allowed:** 400 (body/legal), 500 (labels/step labels, **subheadline**), 600 (section labels, buttons), 700 (numbers that pop, **wordmark**), 800 (headline only). No other weights on this surface.
- **Color roles:** foreground = anything the visitor reads as content; muted = captions/legal/trust + in-field question overlays only; brand = single-accent emphasis (step numbers, reward labels, CTA). Body copy is **foreground** — never muted (reference: body paragraphs are near-black).
- Headline is the only 800-weight text on the page; subheadline is **medium, not normal** — thin body copy reads as broken (founder, 2026-09-30).

---

## 5. Hero

| Property          | Rule                                                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout            | Centered column (`items-center text-center`), inner gap `gap-3`                                                                                                                                       |
| Headline          | §4 — live `text-5xl sm:text-6xl extrabold tracking-tight leading-tight`; preview `text-4xl`; `max-w-xl`-ish line length, `text-balance`                                                               |
| Body copy         | Live `text-lg font-medium`, preview `text-base font-medium`; `max-w-md` (≈ 54ch), foreground, `leading-relaxed`                                                                                       |
| Counter pill      | Below body, `rounded-full border border-border bg-muted px-3 py-1 text-sm`: number bold foreground + space + label muted                                                                              |
| No copy invention | Headline/subheadline are founder-entered; fallbacks stay as-is. The reference's "Until then…" transition line is **not** added — that would be new copy (W8, founder supplies string if wanted later) |

---

## 6. Form Specification

### Layout (state-independent — D4)

- Container: `w-full max-w-md mx-auto flex flex-col gap-3` — **identical with or without qualification questions.**
- Order: email input → question fields → **button → consent line → trust line** (founder directive 2026-09-30, amended: consent reads like part of the button; trust line closes the form beneath it).
- No horizontal row variant anywhere (preview and live both stack).

### Fields

| Property                 | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Height                   | `h-11` (44px) — matches touch-target floor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Email field              | Placeholder "Email address" (conventional single-field exception — reference does the same); no visible label; **keeps template character** (minimal `border-border` / bold `border-2 border-foreground` / dark dark-surface) — it is the primary input                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Question fields          | **Question text sits INSIDE the field**: left-aligned overlay in muted/70 (placeholder-weight), `(optional)` badge (`text-xs`, **warning amber `text-warning`** — founder 2026-10-03) pinned to the field's right end. Overlay hides while typing (`peer-placeholder-shown`); real input is `bg-transparent` over the wrapper. **Muted on every template** (founder directive 2026-09-30)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Question surface (muted) | **Uniform across all templates** so questions never steal the email field's shine: light = `border border-border bg-muted` (recessed grey) · dark = `border border-dark-template-border bg-dark-template-input` (visible — `bg-dark-template-bg` was invisible, founder 2026-09-30). Never `border-2`, never `bg-card`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Field → field gap        | 12px (`gap-3`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Input radius             | `rounded-[var(--input-radius)]` (unchanged)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Multiple choice          | **Tally-style dropdown** (founder directive 2026-10-03, supersedes the 2026-09-30 choice-row spec): visible muted `<label for>` above the control as a **full-width row** — question `min-w-0 truncate` on the **left**, `(optional)` (`text-xs font-normal text-warning`, `shrink-0`) on the **right** via `justify-between` (founder 2026-10-03) — no `<fieldset>/<legend>`; native `<select>` `appearance-none` `h-11`, `rounded-[var(--input-radius)]`, same muted question surface (light `border-border bg-muted` · dark `border-dark-template-border bg-dark-template-input`), padding `pl-[var(--input-padding-x)] pr-10` for the chevron; placeholder = real `<option value="">Select an option</option>` (approved copy), select text muted/70 until answered then `inputText`; **answered = brand-color border**; chevron SVG `right-3 top-1/2 -translate-y-1/2`, `pointer-events-none`, muted token color; house focus classes; options indexed by position (never by value — duplicate/empty values were the React key-warning source). Preview mirrors as an **inert mock box** (label + `h-11` rounded box, muted/70 "Select an option" + chevron) — option strings are never painted as rows |
| Free text                | In-field question + `(optional)` right (no label-above, no `pr-16` absolute hack — overlay + flex-1 truncate instead)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### Per-template borders (character map)

| Template | Input border                         | Input bg                 | Notes                                                                                                                                                                |
| -------- | ------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| minimal  | `border border-border`               | `bg-card`                | quiet default                                                                                                                                                        |
| bold     | `border-2 border-foreground`         | `bg-card`                | **keeps its heavy border identity** (Epic 4 standing character) — the redesign fixes placement/labels, not the border; tunable post-review if founder still dislikes |
| dark     | `border border-dark-template-border` | `bg-dark-template-input` | unchanged                                                                                                                                                            |

### Button

- `h-11 w-full`, brand color (`brandColor`), `text-white`, `font-semibold`, `rounded-[var(--button-radius)]`
- Loading: spinner + existing loading string (unchanged)

### Consent / trust

- `TrustLine` (`text-xs`, muted, centered) **below the consent line** — closes the form (founder swap 2026-09-30, amended)
- `ConsentLine` (`text-xs`, muted, links underlined) **directly under the button** — reads as part of the click action; same frozen W3 sentence
- No checkbox, no restructuring of wording (W3)

### States

- Cap warnings, email error, API error: unchanged behavior and placement (inline, `text-xs`, existing strings)

---

## 7. Section Designs

### 7.1 How it works — designed 3-step block

Replaces the bare divider + text line.

```
border-t (template border) · pt-8 (live) / pt-6 (preview)
  "How it works"        — text-sm font-semibold, foreground, centered
  grid: 1 col mobile · 3 cols sm+ (gap-3)
    per step: rounded card (template character) · flex row centered
      <span bold brand>1.</span> <span medium foreground>Enter your email</span>
```

- **Strings frozen:** "How it works", "1. Enter your email", "2. Get your position", "3. Refer friends to move up" — rendered verbatim (number span inline within the same text run so `textContent` is unchanged).
- Step card character: minimal = `border border-border bg-card` · bold = `border-2 border-foreground bg-muted` · dark = `border border-dark-template-border bg-dark-template-input`
- Step card padding `px-3 py-2.5`, `justify-center`, `gap-1.5`, `rounded-[var(--radius-md)]`
- Number gets brand color + bold; label stays foreground medium.

### 7.2 Signup counter pill

Per §5. Visible only when enabled and count defined (unchanged logic).

### 7.3 Milestone chips

- Keep chip anatomy (`border`, `rounded-md`, `px-2.5 py-1.5`, `text-xs`), row centered `gap-2 flex-wrap`, `max-w-md`
- "Refer N" semibold foreground · `·` muted · reward label medium brand color
- Template surfaces: minimal `border-border bg-muted` · bold `border-foreground bg-muted` · dark `border-dark-template-border bg-dark-template-input`

### 7.4 Latest update card

- Slot sits **below how-it-works** (W2), `max-w-md mx-auto`, full width of the column
- **Centered, designed card** (restyle — founder 2026-10-03, was a left-aligned flat stack): card `rounded-(--card-radius) border p-5 text-center`; label = `.text-overline` preset (12px/600/uppercase/wide) muted, `mb-2`; body = `text-base font-medium text-balance`, centered; date = `text-xs font-normal` muted, `block mt-2`
- Template surfaces: minimal `border-border bg-card` · bold `border-2 border-foreground bg-card` (heavy-border identity) · dark `border-dark-template-border bg-dark-template-bg`
- Copy unchanged: "Latest update" (uppercase comes from CSS `text-transform`, not the string), body, `Month D, YYYY` date
- Colors set via utilities only — never `.text-caption` (unlayered preset color would override the dark-template color utility)

### 7.5 Consent + trust

Covered in §6 (form). They belong to the form block, not standalone sections.

### 7.6 Powered-by footer

Unchanged (`PoweredByFooter standalone`, free tier only).

---

## 8. Spacing Rhythm (8px grid)

| Level                            | Live                                                | Preview             |
| -------------------------------- | --------------------------------------------------- | ------------------- |
| Brand row (shell, §3)            | full-width `pt-6` above the centered column         | `pt` from frame     |
| Page padding (renderer root)     | `pt-6 pb-8` (`px-4 md:px-8` unchanged)              | `pt-4 pb-6`         |
| Section gap (root `space-y`)     | `space-y-8` (32px)                                  | `space-y-5` (20px)  |
| Hero inner gap (headline → body) | `gap-3`                                             | `gap-3`             |
| Body → counter                   | within hero gap-3                                   | same                |
| Form internal                    | `gap-3` fields; in-field overlay uses input padding | same                |
| Section-specific                 | how-it-works `pt-8` after border-t                  | how-it-works `pt-6` |

- **No ad-hoc `mt-1/mt-2/mt-4` spacing** — root `space-y` carries all inter-section rhythm; internal gaps carry the rest.
- Template modifiers on section padding (old `isBold pt-3` / minimal `pt-2` variants) collapse into the single preview/live model above — structure is shared, only surfaces differ (§9).

---

## 9. Template Character Map

| Token                        | Minimal                          | Bold                         | Dark                                 |
| ---------------------------- | -------------------------------- | ---------------------------- | ------------------------------------ |
| Page bg                      | `bg-background`                  | `bg-background`              | `bg-dark-template-bg`                |
| Headline color               | `text-foreground`                | `text-foreground`            | `text-dark-template-text`            |
| Body color                   | `text-foreground`                | `text-foreground`            | `text-dark-template-text`            |
| Section divider              | `border-border`                  | `border-foreground`          | `border-dark-template-border`        |
| Step / chip / input surfaces | `bg-card` / `bg-muted`           | `bg-card` / `bg-muted`       | `bg-dark-template-input`             |
| Input border                 | `border border-border`           | `border-2 border-foreground` | `border border-dark-template-border` |
| Muted text                   | `text-muted-foreground`          | `text-muted-foreground`      | `text-dark-template-muted`           |
| Brand accents                | `brandColor` via `--brand-color` | same                         | same                                 |

- Colors reference tokens only — no hardcoded hex, no new tokens required.
- Dark template secondary text stays the existing placeholder token (known gap, unchanged).

---

## 10. Responsive Rules

| Breakpoint                      | Behavior                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| < 640px (live + preview mobile) | Single column everywhere; how-it-works grid → 1 col; form full-width of column; headline `text-5xl` |
| ≥ 640px                         | How-it-works → 3 columns; headline `sm:text-6xl` (live only)                                        |
| Touch targets                   | All interactive elements ≥ 44px (`h-11`)                                                            |
| Preview frames                  | Desktop 787px / mobile 375px widths unchanged; height per §11                                       |

---

## 11. Preview Fit Algorithm (Phase 3)

The preview must show the **whole page in one view** at every onboarding step, however many modules are on.

1. **Grow first:** frame height = content natural height (incl. footer), from a sensible floor up to the available pane height. More modules → taller frame, no premature squeeze.
2. **Shrink when full:** if natural height > available height → uniform
   `scale = available / natural` via `transform: scale()` with top-center origin; wrapper height set to `natural × scale` (no dead whitespace). Clamp scale at ≈ 0.6.
3. **Scroll as last resort:** below the clamp (extreme content), allow `overflow-y-auto`.
4. **Density steps (support):** beyond ~9 visible modules, section gaps step down one level (e.g. `space-y-8 → space-y-6` equivalent) so required scaling stays mild.
5. **Measurement:** `ResizeObserver` on the **unscaled** content wrapper → recompute scale on every content change (typing, toggles). Measuring unscaled content prevents feedback loops.
6. Faithfulness: fit mechanics may scale the miniature; they never change structure, order, or strings (W1).

---

## 12. Copy Gate (W8)

- All strings on this surface are pre-approved: headline/subheadline (founder-entered), "How it works" + three steps, consent sentence, trust line, counter/chip/footer text, form placeholders, fallbacks.
- This guide **introduces no new copy.** Any future addition (e.g. an "Until then…" style transition line) stops for founder approval before implementation.

---

## 13. Accessibility

- Headline is the page's `h1` (unchanged semantics).
- Qualification questions: real `<label for>` overlay (visible while empty via `peer-placeholder-shown`, hidden once typing) **plus** `aria-label` on the input carrying the full question — accessible name never depends on placeholder text.
- MC (2026-10-03): real `<label for>` above the `<select>` (accessible name = question + `(optional)`); placeholder lives in a real `<option value="">` inside the control, not in a label-as-placeholder overlay. Free-text keeps the in-field overlay + `aria-label` pattern.
- Contrast: foreground on ivory/dark surfaces ≥ 4.5:1; muted text reserved for ≥ 12px non-essential copy; brand-colored button text stays white.
- Focus rings: existing `focus-visible:border-accent focus-visible:ring-1` on inputs (unchanged).

---

## 14. Acceptance Checklist (used by Phase 5 gates)

- [ ] Brand lockup (`WaitlistBrand`) at screen top-left of live shell + preview frame; wordmark `font-bold text-2xl` (live) / `text-sm` (preview); no centered gray brand row remains
- [ ] Headline extrabold (800) in both variants (`text-5xl sm:text-6xl` live / `text-4xl` preview); body copy 16px foreground; subheadline `font-medium`
- [ ] Type ladder contains only weights {400, 500, 600, 700, 800}; nothing < 12px; body ≥ 16px
- [ ] Form stacked full-width in every state; free-text question text sits **inside the field** (muted/70, truncating) with `(optional)` pinned right; MC = visible label **row** above (question left / `(optional)` right, `justify-between`) + native `<select>` dropdown (Tally Dropdown), muted surface, `Select an option` placeholder, chevron right, brand-color border when answered; `(optional)` = `text-warning` on **both** types; no `pr-16` hack
- [ ] Fields `h-11` with `qualBg` (dark = `bg-dark-template-input`); button `h-11` full-width brand
- [ ] Order: button → consent line → trust line (live + preview)
- [ ] How-it-works is a card grid with brand-colored numbers; frozen strings verbatim
- [ ] Root spacing = `space-y-8` live / `space-y-5` preview; zero ad-hoc `mt-*` section spacing
- [ ] Live page vertically centers content; footer pinned; no dead bottom band with modules off
- [ ] Preview fits all modules in one view (grow → shrink → scroll fallback)
- [ ] Minimal/bold/dark all conform to §9; zero hardcoded hex; zero inline styles beyond existing CSS-var patterns
- [ ] Section order + W2 + variant scale model unchanged (Epic 18 invariants)
- [ ] `pnpm lint` 0 errors · prettier clean · suite ≥ baseline (851/844/7) · clean build

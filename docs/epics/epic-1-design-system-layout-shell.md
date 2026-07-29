# Epic 1 — Design System & Layout Shell

**Status:** ready
**Source:** [PRD S5 Standing Product Decisions](../PRD-Sprint1.md#5-standing-product-decisions-do-not-relitigate), [PRD S6 Functional Requirements](../PRD-Sprint1.md#6-functional-requirements), [PRD S7 Technical Architecture](../PRD-Sprint1.md#7-technical-architecture)

## Design References

| Reference                | File                                                               |
| ------------------------ | ------------------------------------------------------------------ |
| Design System Table Map  | `@docs/design/Desing System table Map.svg`                         |
| Marketing Homepage       | `@docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg`       |
| Powered-by Homepage      | `@docs/design/High-fidelity-svgs/HF2-_Powered by_ Homepage.svg`    |
| Onboard Step 1           | `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg`          |
| Onboard Step 4 pt 1      | `@docs/design/High-fidelity-svgs/HF 4 onboard step 4 pt 1.svg`     |
| Onboard Step 2 (Minimal) | `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 v1.svg`       |
| Onboard Step 2 (Bold)    | `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 Bold.svg`     |
| Onboard Step 2 (Dark)    | `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 Dark.svg`     |
| Onboard Step 3           | `@docs/design/High-fidelity-svgs/HF 6 onboard step 3.svg`          |
| Onboard Step 4           | `@docs/design/High-fidelity-svgs/HF 6 onboard step 4.svg`          |
| Onboard Step 5           | `@docs/design/High-fidelity-svgs/HF 6 onboard step 5.svg`          |
| Onboard Step 5 Pro Tier  | `@docs/design/High-fidelity-svgs/HF 6 onboard step 5 Pro Tier.svg` |
| Sign In Screen           | `@docs/design/High-fidelity-svgs/Sign in screen.svg`               |
| Signup Screen            | `@docs/design/High-fidelity-svgs/Signup screen.svg`                |
| Email Verification       | `@docs/design/High-fidelity-svgs/Login email verification.svg`     |
| Onboard Success          | `@docs/design/High-fidelity-svgs/Onboard Success Page Founder.svg` |
| Empty Dashboard          | `@docs/design/High-fidelity-svgs/Empty Dashboard skeleton.svg`     |
| Subscriber Success       | `@docs/design/High-fidelity-svgs/Subscriber Success page.svg`      |

## Goal

Build the foundational UI primitives, shared layout shells, and the share-copy-link component that every Sprint 1 screen depends on — before any feature page is built.

## Definition of Done

All design-system primitives (Button, Card, Input, Badge, Toggle, Select, Textarea) are implemented as reusable React components with full token integration. The `cn()` utility exists. The onboarding layout shell with step progress bar is functional. The share-copy-link component is built and ready for reuse. The marketing layout shell exists. Every component has at least one unit test. All components pass lint and build.

## Story Index

| ID  | Title                                                   | Depends on | Status |
| --- | ------------------------------------------------------- | ---------- | ------ |
| 1.0 | cn() utility + component directory setup                | —          | done   |
| 1.1 | Design-system primitives (Button, Card, Input, Badge)   | 1.0        | done   |
| 1.2 | Design-system primitives (Toggle, Select, Textarea)     | 1.0        | ready  |
| 1.3 | Onboarding layout shell + step progress bar             | 1.0        | ready  |
| 1.4 | Marketing layout shell (header/footer)                  | 1.0        | ready  |
| 1.5 | Share-copy-link component                               | 1.0        | ready  |
| 1.6 | Live-preview component (shared across onboarding steps) | 1.0        | ready  |

Work through these in dependency order, one at a time. Each has a `status` you should update as you go (`ready` → `in-progress` → `blocked` or `done`). A story marked `blocked` stays blocked until manually cleared — don't silently re-attempt it next session.

---

### Story 1.0 — cn() utility + component directory setup

**Status:** done

**Design Refs:** `@docs/design/Desing System table Map.svg`

**Story:** As the founder, I want a `cn()` utility for className merging and a properly structured component directory, so every subsequent component can use consistent class composition.

**Acceptance Criteria (EARS):**

- AC1: The system shall create `components/lib/cn.ts` exporting a `cn()` function that merges class names using `clsx` and `tailwind-merge`.
- AC2: The system shall install `clsx` and `tailwind-merge` as dependencies.
- AC3: The `components/ui/`, `components/share/`, and `components/onboarding/` directories shall exist and be ready for component files.
- AC4: The `components/` directory is at the project root (not `src/components/`), matching the existing project structure.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) install clsx + tailwind-merge, create cn.ts · T2 (AC3-AC4) verify directory structure · T3 (AC5) verify lint + build.

**Out of scope:** actual components (Stories 1.1-1.6).

**Dev Notes:**

- T1: `pnpm add clsx tailwind-merge`. The `cn()` function: `import { clsx, type ClassValue } from "clsx"; import { twMerge } from "tailwind-merge"; export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }`
- T4: Per AGENTS.md, components live at `components/` (root level), not `src/components/`. The tsconfig path alias `@/*` maps to `./src/*`, so components will be imported via relative paths or a separate path alias.

---

### Story 1.1 — Design-system primitives: Button, Card, Input, Badge

**Status:** done

**Design Refs:**

- `@docs/design/Desing System table Map.svg` — token reference for all component tokens
- `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` — Button (line 28: 458×59px, rx=9.59, #0F7A5E), Input (line 19: 456×60px, rx=12.16, #CCC9C3 stroke)
- `@docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg` — Secondary Button (line 44: 323×55px, rx=11.29, white fill, #CCC9C3 stroke), Feature Cards (line 16: 298×197px, rx=8.5)
- `@docs/design/High-fidelity-svgs/Sign in screen.svg` — Input (line 3: 416×41px, rx=7.52, #CCC9C3 stroke), Sign-in Button (line 19: 417×42px, rx=10.53, #0F7A5E)

**Story:** As the founder, I want reusable Button, Card, Input, and Badge components built on Design System v2.0 tokens, so every Sprint 1 screen starts from consistent, non-duplicated primitives.

**Acceptance Criteria (EARS):**

- AC1: The system shall provide a `Button` component with `variant` prop (`primary`, `secondary`, `destructive`, `ghost`) and `size` prop (`sm`, `md`, `lg`), styled exclusively from `globals.css` tokens.
- AC2: The system shall provide a `Card` component with `CardHeader`, `CardContent`, and `CardFooter` sub-components, using `--card-radius`, `--card-padding`, and `--card-shadow` tokens.
- AC3: The system shall provide an `Input` component with `label`, `placeholder`, `error`, `disabled`, and `helperText` props, using form-field-state tokens (`--input-border-color`, `--input-border-color-focus`, `--input-border-color-error`, `--input-border-color-disabled`).
- AC4: The system shall provide a `Badge` component with `variant` prop (`default`, `success`, `warning`, `error`, `info`, `outline`), using `--badge-radius`, `--badge-padding-x`, `--badge-padding-y`, `--badge-font-size` tokens.
- AC5: All components shall use `React.forwardRef` and support `className` prop for composition via `cn()`.
- AC6: All components shall be TypeScript with explicit prop interfaces exported.
- AC7: Components shall be placed in `components/ui/` (project root, not `src/components/`).
- AC8: Each component shall have at least one unit test in `src/__tests__/components/`.
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) implement Button component with variants · T2 (AC2) implement Card with sub-components · T3 (AC3) implement Input with form states · T4 (AC4) implement Badge with variants · T5 (AC5-AC6) add forwardRef + TypeScript interfaces · T6 (AC7) verify placement in components/ui/ · T7 (AC8) write unit tests · T8 (AC9) verify lint + build.

**Out of scope:** Toggle, Select, Textarea (Story 1.2); layout shells (Story 1.3, 1.4).

**Dev Notes:**

- T1: Button — from `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` line 28: primary CTA 458×59px, rx=9.58716, fill `#0F7A5E`, text white. From `@docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg` line 44: secondary 323×55px, rx=11.2851, white fill, `#CCC9C3` stroke. Token mapping: `--button-radius` (0.5rem), bg `--color-accent`, text `--color-accent-foreground`, hover `--color-accent-hover`. Sizes: `sm` (h-8, px-3, text-xs), `md` (h-10, px-4, text-sm), `lg` (h-12, px-6, text-base).
- T2: Card — from `@docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg` line 16: feature cards 298×197px, rx=8.5, white fill, `#CCC9C3` stroke. Token: `--card-radius` (0.75rem), `--card-padding` (1.5rem), `--card-shadow` (none).
- T3: Input — from `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` line 19: 456×60px, rx=12.164, stroke `#CCC9C3`, stroke-width 1.67. From `@docs/design/High-fidelity-svgs/Sign in screen.svg` line 3: 416×41px, rx=7.524. Token: `--input-radius` (0.5rem), `--input-height` (2.5rem). Error: border `--input-border-color-error`, helper text `--color-error`. Disabled: bg `--input-background-disabled`.
- T4: Badge — token: `--badge-radius` (9999px), `--badge-font-size` (0.75rem). Variants map to semantic colors.
- T7: Use Vitest + React Testing Library. Test file: `src/__tests__/components/button.test.tsx` (etc.). Run `pnpm test:run` to verify.

---

### Story 1.2 — Design-system primitives: Toggle, Select, Textarea

**Status:** ready

**Design Refs:**

- `@docs/design/Desing System table Map.svg` — token reference for Toggle, Select tokens
- `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 v1.svg` — Select dropdown (456×60px with chevron)
- `@docs/design/High-fidelity-svgs/HF 6 onboard step 3.svg` — Textarea fields for page customization

**Story:** As the founder, I want Toggle, Select, and Textarea components built on Design System v2.0 tokens, so onboarding screens 3-5 have all the form primitives they need.

**Acceptance Criteria (EARS):**

- AC1: The system shall provide a `Toggle` (switch) component with `checked`, `onCheckedChange`, `disabled`, and `label` props, using `--toggle-width`, `--toggle-height`, `--toggle-thumb-size`, `--toggle-radius` tokens.
- AC2: The system shall provide a `Select` component with `options`, `value`, `onValueChange`, `placeholder`, `disabled`, and `label` props, using `--select-radius`, `--select-padding-x`, `--select-padding-y`, `--select-font-size`, `--select-height` tokens.
- AC3: The system shall provide a `Textarea` component with `label`, `placeholder`, `error`, `disabled`, `helperText`, `rows`, and `maxLength` props, using Input tokens with multi-line support.
- AC4: All components shall use `React.forwardRef` and support `className` prop for composition via `cn()`.
- AC5: All components shall be TypeScript with explicit prop interfaces exported.
- AC6: Each component shall have at least one unit test in `src/__tests__/components/`.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) implement Toggle component · T2 (AC2) implement Select component · T3 (AC3) implement Textarea component · T4 (AC4-AC5) add forwardRef + TypeScript interfaces · T5 (AC6) write unit tests · T6 (AC7) verify lint + build.

**Out of scope:** Onboarding Step 3 milestone rewards toggle — that's a feature story, not a primitive.

**Dev Notes:**

- T1: Toggle — token: `--toggle-width` (2.5rem), `--toggle-height` (1.5rem), `--toggle-thumb-size` (1.25rem), `--toggle-radius` (9999px). Checked: bg `--color-accent`, thumb white. Unchecked: bg `--color-border`, thumb `--color-muted-foreground`.
- T2: Select — from `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 v1.svg`: dropdown 456×60px with chevron icon. Use native `<select>` styled with tokens, or simple custom dropdown.
- T3: Textarea — use `--input-*` tokens for consistency with Input. Add resize handle styling.
- T5: Use Vitest + React Testing Library.

---

### Story 1.3 — Onboarding layout shell + step progress bar

**Status:** ready

**Design Refs:**

- `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` — primary reference for split-pane layout, step indicator dots (lines 8-12), divider (line 7), input field placement
- `@docs/design/High-fidelity-svgs/HF 4 onboard step 4 pt 1.svg` — centered layout variant for steps 4-5
- `@docs/design/High-fidelity-svgs/HF 6 onboard step 3.svg` — expanded right panel layout
- `@docs/design/High-fidelity-svgs/HF 6 onboard step 4.svg` — centered step 4 layout
- `@docs/design/High-fidelity-svgs/HF 6 onboard step 5.svg` — centered step 5 layout

**Story:** As the founder, I want an onboarding layout shell with a visible step progress bar, so I always know where I am in the 5-step onboarding flow.

**Acceptance Criteria (EARS):**

- AC1: The onboarding layout shall render a split-pane shell: left pane (566px, white bg) for the form content, right pane (flex-1, `#FAF8F4` bg) for the live preview (desktop). On mobile, the panes shall stack vertically. Ref: `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg`.
- AC2: The layout shall include a step progress bar showing 5 dot indicators at the top of the left pane, with the current step highlighted using `#0F7A5E` and inactive steps using `#C3C2C2`. Ref: `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` lines 8-12.
- AC3: The progress bar dots shall be radius ~5px, spaced ~16.7px center-to-center, positioned at y=56 from the top of the left pane. Ref: `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` lines 8-12.
- AC4: The layout shall include a "Back" navigation link on steps 2-5 that returns to the previous step without saving.
- AC5: The layout shall be responsive — split-pane on `md:` breakpoint and above, stacked on smaller viewports.
- AC6: The layout shall use the existing `src/app/onboarding/layout.tsx` file and expand it from the current minimal flex wrapper.
- AC7: The layout shall use typography preset classes (`.text-h3`, `.text-body-sm`, `.text-caption`) for step labels.
- AC8: The left pane shall have a divider line (`#CCC9C3`, 0.7px) separating it from the right pane. Ref: `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` line 7.
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) implement split-pane shell with responsive breakpoints · T2 (AC2-AC3) implement step progress bar with dot indicators · T3 (AC4) add back navigation · T4 (AC5) ensure mobile responsiveness · T5 (AC6-AC8) integrate into existing layout.tsx, use typography presets, add divider · T6 (AC9) verify lint + build.

**Out of scope:** The live-preview component itself (Story 1.6); actual form content for each step (Sprint 1 feature stories).

**Dev Notes:**

- T1: Use Tailwind's `md:grid md:grid-cols-[566px_1fr]` for the split-pane layout. Left pane: white bg, fixed width. Right pane: `#FAF8F4` bg (use `bg-[#FAF8F4]` or add as token), flex-1, sticky (`md:sticky md:top-0 md:h-screen`).
- T2: Progress bar — from `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` lines 8-12: 5 circles at top of left pane. Active: `fill="#0F7A5E"`, inactive: `fill="#C3C2C2"`. Use `--spacing-*` tokens for gaps. Circles are ~10px diameter (radius 5px).
- T3: Back link — use `--color-muted-foreground` text, chevron icon (left arrow). Use `--text-sm` font size.
- T8: Divider — from `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` line 7: `<path d="M566 0H565.3V832H566H566.7V0H566Z" fill="#CCC9C3">`. Use a 1px border or thin div with `#CCC9C3`.
- PRD references: Component tree (Section 7.6) shows `onboarding/layout.tsx` as "shared split-pane shell + live-preview frame"

---

### Story 1.4 — Marketing layout shell (header/footer)

**Status:** ready

**Design Refs:**

- `@docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg` — header with "Build it free" CTA (line 5: 134×42px, rx=11, #0F7A5E), logo area (line 8: 40×30px icon), full page layout
- `@docs/design/High-fidelity-svgs/HF2-_Powered by_ Homepage.svg` — "Powered by" hero variant
- `@docs/design/High-fidelity-svgs/Sign in screen.svg` — auth page split layout
- `@docs/design/High-fidelity-svgs/Signup screen.svg` — auth page split layout

**Story:** As the founder, I want a marketing layout shell with header and footer, so the homepage and auth pages share consistent navigation and branding.

**Acceptance Criteria (EARS):**

- AC1: The marketing layout shall render a sticky header with the product logo/name on the left and "Sign in" / "Build it free" CTAs on the right. Ref: `@docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg` lines 5-8.
- AC2: The marketing layout shall render a footer with copyright, "Powered by MyWaitlist" disclosure (for Free tier), and links to terms/privacy.
- AC3: The header shall be transparent on the homepage hero section and opaque (with background) on scroll or on non-homepage routes.
- AC4: The layout shall be responsive — hamburger menu on mobile, full navigation on `md:` and above.
- AC5: The layout shall wrap all routes under `src/app/(marketing)/` and `src/app/(auth)/` via a shared layout or route group.
- AC6: The header shall use `--z-sticky` for stacking context.
- AC7: The footer shall use `--color-muted` background and `--text-caption` typography.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) implement header with logo and CTAs · T2 (AC2) implement footer · T3 (AC3) add scroll-aware header background · T4 (AC4) add mobile hamburger menu · T5 (AC5) wire layout to route groups · T6 (AC6-AC7) verify stacking and typography tokens · T7 (AC8) verify lint + build.

**Out of scope:** The actual homepage content (hero, problem section, pricing, etc.) — that's a Sprint 1 feature story. The "Powered by" conditional hero variant (REQ-6.2.1) is also a feature story.

**Dev Notes:**

- T1: Header — from `@docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg` line 5: "Build it free" CTA is 134×42px, rx=11, fill `#0F7A5E`. Line 8: logo area has 40×30px icon. Header uses `--color-background` bg (transparent initially), `--color-foreground` text. Logo uses `.text-h4` typography preset.
- T2: Footer — use `--color-muted` bg, `--color-muted-foreground` text. Use `.text-caption` for footer links.
- T3: Use `IntersectionObserver` or scroll event to toggle header background opacity. Use `--duration-normal` (200ms) for smooth transition.
- T4: Mobile menu — use a slide-in drawer. Use `--z-overlay` (30) for backdrop, `--z-modal` (40) for drawer.
- PRD references: REQ-6.1.2 (CTA to /signup), REQ-6.1.3 (Sign in to /signin), Standing Decision item 6 ("Free-tier 'powered by' disclosure is plain, non-alarming copy")

---

### Story 1.5 — Share-copy-link component

**Status:** ready

**Design Refs:**

- `@docs/design/High-fidelity-svgs/Onboard Success Page Founder.svg` — share buttons placement on success screen
- `@docs/design/High-fidelity-svgs/Subscriber Success page.svg` — share buttons placement on dashboard

**Story:** As the founder, I want a shared share-copy-link component that uses Web Share API + Copy Link at equal visual weight, so every sharing surface in the product uses the same implementation.

**Acceptance Criteria (EARS):**

- AC1: The component shall render two buttons: "Share" (Web Share API) and "Copy Link" (clipboard copy), at equal visual weight, side by side.
- AC2: The "Share" button shall only render when `navigator.share` is supported (REQ-6.12.1).
- AC3: The "Copy Link" button shall always render, regardless of Web Share API support (REQ-6.12.1).
- AC4: When "Copy Link" is clicked, the component shall copy the provided URL to clipboard and show a "Copied!" confirmation state for 2 seconds.
- AC5: The component shall accept a `url` prop and optional `onShare` / `onCopy` callback props for analytics tracking.
- AC6: The component shall be placed in `components/share/share-copy-link.tsx` and use the `cn()` utility for className composition.
- AC7: The component shall have at least one unit test in `src/__tests__/components/`.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) implement dual-button layout with feature detection · T2 (AC4) implement clipboard copy with confirmation state · T3 (AC5) add callback props · T4 (AC6) place in correct directory, use cn() · T5 (AC7) write unit test · T6 (AC8) verify lint + build.

**Out of scope:** Using this component in the success screen or dashboard — that's a Sprint 1 feature story.

**Dev Notes:**

- T1: Use `navigator.share` for Web Share API, `navigator.clipboard.writeText()` for copy. Feature-detect with `typeof navigator.share !== 'undefined'`. Both buttons use `variant="secondary"` from the Button primitive.
- T2: Use a temporary state (`useState`) to show "Copied!" for 2 seconds, then revert. Use `--duration-normal` for the transition.
- T4: AGENTS.md mandates: "Use the shared `components/share/share-copy-link.tsx` component anywhere sharing appears — never a one-off implementation."
- T5: Use Vitest + React Testing Library. Test feature detection and clipboard copy.
- PRD references: REQ-6.12.1, Standing Decision item 3 ("Sharing anywhere uses Web Share API + Copy Link at equal visual weight")

---

### Story 1.6 — Live-preview component (shared across onboarding steps)

**Status:** ready

**Design Refs:**

- `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` — preview frame (line 33: 787×444px, rx=25.5, #CCC9C3 stroke; line 34: white header bar with 3 browser dots)
- `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 v1.svg` — minimal template variant
- `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 Bold.svg` — bold template variant
- `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 Dark.svg` — dark template variant
- `@docs/design/High-fidelity-svgs/HF 6 onboard step 3.svg` — expanded preview with form fields

**Story:** As the founder, I want a live-preview component that shows a real-time preview of my waitlist page as I configure it during onboarding, so I can see exactly what my subscribers will see.

**Acceptance Criteria (EARS):**

- AC1: The component shall render a responsive preview frame (browser window on desktop, phone mockup on mobile) showing the waitlist page. Ref: `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` lines 33-39.
- AC2: The component shall accept props for all waitlist configuration: `template`, `headline`, `subheadline`, `brandColor`, `logoUrl`, `ctaText`, and `milestoneRewards`.
- AC3: The preview shall update in real-time as props change (debounced 300-500ms, per REQ-6.6.1/6.6.5).
- AC4: The preview shall support a Desktop/Mobile toggle that changes only the viewport size, not the saved template choice (REQ-6.7.2).
- AC5: The component shall use the `template` prop to render one of three visual variants: minimal, bold, dark. Ref: `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 v1.svg` (minimal), `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 Bold.svg` (bold), `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 Dark.svg` (dark).
- AC6: The component shall be placed in `components/onboarding/live-preview.tsx`.
- AC7: The component shall use `--shadow-float` for the preview frame and `--radius-lg` for the frame corners.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) implement browser frame preview with 3 dots and header bar · T2 (AC2-AC3) add prop-driven rendering with debounced updates · T3 (AC4) implement Desktop/Mobile toggle · T4 (AC5) implement template variants (minimal/bold/dark) referencing HF5 SVGs · T5 (AC6-AC7) place in correct directory, use tokens · T6 (AC8) verify lint + build.

**Out of scope:** The actual waitlist page content (that's Sprint 2) — this component renders a preview representation, not the live page.

**Dev Notes:**

- T1: From `@docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` lines 33-39: preview frame 787×444px, rx=25.5, stroke `#CCC9C3`. Header bar: white fill, `#CCC9C3` stroke, contains 3 browser dots (radius ~5px, fill `#C3C2C2`). Use `--shadow-float` for the frame and `--radius-lg` for corners.
- T2: Accept props and render a simplified preview of the waitlist page. The actual public waitlist page is Sprint 2 — this is just a preview.
- T3: Toggle uses the Toggle primitive from Story 1.2. Desktop mode: full-width preview. Mobile mode: centered phone-width preview.
- T4: Template variants — compare `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 v1.svg` (minimal: clean, white bg, simple layout), `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 Bold.svg` (bold: large text, stronger contrast, `#0C6350` accent), `@docs/design/High-fidelity-svgs/HF 5 onboard step 2 Dark.svg` (dark: dark background, light text).
- PRD references: REQ-6.6.5 ("live preview shall update with no perceptible lag"), REQ-6.7.2 ("Desktop/Mobile toggle changes only the preview viewport"), Component tree (Section 7.6) shows `onboarding/live-preview.tsx`

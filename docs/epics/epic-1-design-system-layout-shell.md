# Epic 1 — Design System & Layout Shell

**Status:** ready
**Source:** [PRD S5 Standing Product Decisions](../PRD-Sprint-1.md#5-standing-product-decisions-do-not-relitigate), [PRD S6 Functional Requirements](../PRD-Sprint-1.md#6-functional-requirements), [PRD S7 Technical Architecture](../PRD-Sprint-1.md#7-technical-architecture)

## Goal

Build the foundational UI primitives, shared layout shells, and the share-copy-link component that every Sprint 1 screen depends on — before any feature page is built.

## Definition of Done

All design-system primitives (Button, Card, Input, Badge, Toggle, Select, Textarea) are implemented as reusable React components with full token integration. The `cn()` utility exists. The onboarding layout shell with step progress bar is functional. The share-copy-link component is built and ready for reuse. The marketing layout shell exists. Every component has at least one unit test. All components pass lint and build.

## Story Index

| ID  | Title                                                   | Depends on | Status |
| --- | ------------------------------------------------------- | ---------- | ------ |
| 1.0 | cn() utility + component directory setup                | —          | ready  |
| 1.1 | Design-system primitives (Button, Card, Input, Badge)   | 1.0        | ready  |
| 1.2 | Design-system primitives (Toggle, Select, Textarea)     | 1.0        | ready  |
| 1.3 | Onboarding layout shell + step progress bar             | 1.0        | ready  |
| 1.4 | Marketing layout shell (header/footer)                  | 1.0        | ready  |
| 1.5 | Share-copy-link component                               | 1.0        | ready  |
| 1.6 | Live-preview component (shared across onboarding steps) | 1.0        | ready  |

Work through these in dependency order, one at a time. Each has a `status` you should update as you go (`ready` → `in-progress` → `blocked` or `done`). A story marked `blocked` stays blocked until manually cleared — don't silently re-attempt it next session.

---

### Story 1.0 — cn() utility + component directory setup

**Status:** ready

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

**Status:** ready

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

- T1: Button maps to tokens:
  - `primary`: bg `--color-accent`, text `--color-accent-foreground`, hover `--color-accent-hover`
  - `secondary`: bg `--color-muted`, text `--color-muted-foreground`
  - `destructive`: bg `--color-destructive`, text `--color-destructive-foreground`
  - `ghost`: transparent bg, text `--color-foreground`
  - Sizes: `sm` (h-8, px-3, text-xs), `md` (h-10, px-4, text-sm), `lg` (h-12, px-6, text-base)
  - Radius: `--button-radius` (0.5rem)
- T2: Card uses `--color-card` bg, `--card-radius` (0.75rem), `--card-padding` (1.5rem), `--card-shadow` (none)
- T3: Input uses `--input-*` tokens. Error state: border `--input-border-color-error`, helper text in `--color-error`. Disabled: bg `--input-background-disabled`.
- T4: Badge uses `--badge-radius` (9999px), `--badge-font-size` (0.75rem). Variants map to semantic colors.
- T7: Use Vitest + React Testing Library. Test file: `src/__tests__/components/button.test.tsx` (etc.). Run `pnpm test:run` to verify.

---

### Story 1.2 — Design-system primitives: Toggle, Select, Textarea

**Status:** ready

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

- T1: Toggle maps to tokens: `--toggle-width` (2.5rem), `--toggle-height` (1.5rem), `--toggle-thumb-size` (1.25rem), `--toggle-radius` (9999px). Checked state: bg `--color-accent`, thumb white. Unchecked: bg `--color-border`, thumb `--color-muted-foreground`.
- T2: Select can use native `<select>` styled with tokens, or a custom dropdown. Keep it simple — no complex combobox behavior needed.
- T3: Textarea should use `--input-*` tokens for consistency with Input. Add resize handle styling.
- T5: Use Vitest + React Testing Library.

---

### Story 1.3 — Onboarding layout shell + step progress bar

**Status:** ready

**Story:** As the founder, I want an onboarding layout shell with a visible step progress bar, so I always know where I am in the 5-step onboarding flow.

**Acceptance Criteria (EARS):**

- AC1: The onboarding layout shall render a split-pane shell: left pane for the form content, right pane for the live preview (desktop). On mobile, the panes shall stack vertically.
- AC2: The layout shall include a step progress bar showing steps 1-5 (and 4a when active), with the current step highlighted using the accent color (`--color-accent`).
- AC3: The progress bar shall display step numbers and step labels: "Name" (1), "Template" (2), "Brand" (3), "Questions" (4/4a), "Email" (5).
- AC4: The layout shall include a "Back" navigation link on steps 2-5 that returns to the previous step without saving.
- AC5: The layout shall be responsive — split-pane on `md:` breakpoint and above, stacked on smaller viewports.
- AC6: The layout shall use the existing `src/app/onboarding/layout.tsx` file and expand it from the current minimal flex wrapper.
- AC7: The layout shall use typography preset classes (`.text-h3`, `.text-body-sm`, `.text-caption`) for step labels.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) implement split-pane shell with responsive breakpoints · T2 (AC2-AC3) implement step progress bar with step labels · T3 (AC4) add back navigation · T4 (AC5) ensure mobile responsiveness · T5 (AC6-AC7) integrate into existing layout.tsx, use typography presets · T6 (AC8) verify lint + build.

**Out of scope:** The live-preview component itself (Story 1.6); actual form content for each step (Sprint 1 feature stories).

**Dev Notes:**

- T1: Use Tailwind's `md:grid md:grid-cols-2` for the split-pane layout. Left pane scrolls, right pane is sticky (`md:sticky md:top-0 md:h-screen`).
- T2: Progress bar uses `--color-accent` for completed/current steps, `--color-muted` for incomplete steps, `--color-card` background. Use `--spacing-*` tokens for gaps.
- T3: Back link uses `--color-muted-foreground` text, chevron icon (left arrow). Use `--text-sm` font size.
- T5: Current `layout.tsx` is a minimal flex wrapper. Expand it to include the progress bar and split-pane structure.
- PRD references: Component tree (Section 7.6) shows `onboarding/layout.tsx` as "shared split-pane shell + live-preview frame"

---

### Story 1.4 — Marketing layout shell (header/footer)

**Status:** ready

**Story:** As the founder, I want a marketing layout shell with header and footer, so the homepage and auth pages share consistent navigation and branding.

**Acceptance Criteria (EARS):**

- AC1: The marketing layout shall render a sticky header with the product logo/name on the left and "Sign in" / "Build it free" CTAs on the right.
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

- T1: Header uses `--color-background` bg (transparent initially), `--color-foreground` text, accent color for CTAs. Logo uses `.text-h4` typography preset.
- T2: Footer uses `--color-muted` bg, `--color-muted-foreground` text. Use `.text-caption` for footer links.
- T3: Use `IntersectionObserver` or scroll event to toggle header background opacity. Use `--duration-normal` (200ms) for smooth transition.
- T4: Mobile menu uses a slide-in drawer. Use `--z-overlay` (30) for backdrop, `--z-modal` (40) for drawer.
- PRD references: REQ-6.1.2 (CTA to /signup), REQ-6.1.3 (Sign in to /signin), Standing Decision item 6 ("Free-tier 'powered by' disclosure is plain, non-alarming copy")

---

### Story 1.5 — Share-copy-link component

**Status:** ready

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

**Story:** As the founder, I want a live-preview component that shows a real-time preview of my waitlist page as I configure it during onboarding, so I can see exactly what my subscribers will see.

**Acceptance Criteria (EARS):**

- AC1: The component shall render a responsive preview frame (phone mockup on mobile, browser window on desktop) showing the waitlist page.
- AC2: The component shall accept props for all waitlist configuration: `template`, `headline`, `subheadline`, `brandColor`, `logoUrl`, `ctaText`, and `milestoneRewards`.
- AC3: The preview shall update in real-time as props change (debounced 300-500ms, per REQ-6.6.1/6.6.5).
- AC4: The preview shall support a Desktop/Mobile toggle that changes only the viewport size, not the saved template choice (REQ-6.7.2).
- AC5: The component shall use the `template` prop to render one of three visual variants: minimal, bold, dark.
- AC6: The component shall be placed in `components/onboarding/live-preview.tsx`.
- AC7: The component shall use `--shadow-float` for the preview frame and `--radius-lg` for the frame corners.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) implement responsive preview frame · T2 (AC2-AC3) add prop-driven rendering with debounced updates · T3 (AC4) implement Desktop/Mobile toggle · T4 (AC5) implement template variants (minimal/bold/dark) · T5 (AC6-AC7) place in correct directory, use tokens · T6 (AC8) verify lint + build.

**Out of scope:** The actual waitlist page content (that's Sprint 2) — this component renders a preview representation, not the live page.

**Dev Notes:**

- T1: Use an iframe or a scaled `<div>` with `transform: scale()` to create the preview frame. The phone mockup uses `--shadow-float` and `--radius-lg`. Desktop frame uses `--radius-lg`.
- T2: Accept props and render a simplified preview of the waitlist page. The actual public waitlist page is Sprint 2 — this is just a preview.
- T3: Toggle uses the Toggle primitive from Story 1.2. Desktop mode: full-width preview. Mobile mode: centered phone-width preview.
- T4: Template variants map to visual styles: `minimal` (clean, lots of white, `--color-card` bg), `bold` (large text, strong contrast), `dark` (dark background, light text).
- PRD references: REQ-6.6.5 ("live preview shall update with no perceptible lag"), REQ-6.7.2 ("Desktop/Mobile toggle changes only the preview viewport"), Component tree (Section 7.6) shows `onboarding/live-preview.tsx`

# Epic 1 — Design System & Layout Shell

**Status:** ready
**Source:** [PRD S5 Standing Product Decisions](../PRD-Sprint-1.md#5-standing-product-decisions-do-not-relitigate), [PRD S6 Functional Requirements](../PRD-Sprint-1.md#6-functional-requirements), [PRD S7 Technical Architecture](../PRD-Sprint-1.md#7-technical-architecture)

## Goal

Build the foundational UI primitives, shared layout shells, and the share-copy-link component that every Sprint 1 screen depends on — before any feature page is built.

## Definition of Done

All design-system primitives (Button, Card, Input, Badge, Toggle, Select, Textarea) are implemented as reusable React components with full token integration. The onboarding layout shell with step progress bar is functional. The share-copy-link component is built and ready for reuse. The marketing layout shell exists. All components pass lint and build.

## Story Index

| ID  | Title                                                   | Depends on | Status |
| --- | ------------------------------------------------------- | ---------- | ------ |
| 1.1 | Design-system primitives (Button, Card, Input, Badge)   | —          | ready  |
| 1.2 | Design-system primitives (Toggle, Select, Textarea)     | 1.1        | ready  |
| 1.3 | Onboarding layout shell + step progress bar             | 1.1        | ready  |
| 1.4 | Marketing layout shell (header/footer)                  | 1.1        | ready  |
| 1.5 | Share-copy-link component                               | 1.1        | ready  |
| 1.6 | Live-preview component (shared across onboarding steps) | 1.1        | ready  |

Work through these in dependency order, one at a time. Each has a `status` you should update as you go (`ready` → `in-progress` → `blocked` or `done`). A story marked `blocked` stays blocked until manually cleared — don't silently re-attempt it next session.

---

### Story 1.1 — Design-system primitives: Button, Card, Input, Badge

**Status:** ready

**Story:** As the founder, I want reusable Button, Card, Input, and Badge components built on Design System v2.0 tokens, so every Sprint 1 screen starts from consistent, non-duplicated primitives.

**Acceptance Criteria (EARS):**

- AC1: The system shall provide a `Button` component with `variant` prop (`primary`, `secondary`, `destructive`, `ghost`) and `size` prop (`sm`, `md`, `lg`), styled exclusively from `globals.css` tokens.
- AC2: The system shall provide a `Card` component with `CardHeader`, `CardContent`, and `CardFooter` sub-components, using `--card-radius`, `--card-padding`, and `--card-shadow` tokens.
- AC3: The system shall provide an `Input` component with `label`, `placeholder`, `error`, `disabled`, and `helperText` props, using form-field-state tokens (`--input-border-color`, `--input-border-color-focus`, `--input-border-color-error`, `--input-border-color-disabled`).
- AC4: The system shall provide a `Badge` component with `variant` prop (`default`, `success`, `warning`, `error`, `info`, `outline`), using `--badge-radius`, `--badge-padding-x`, `--badge-padding-y`, `--badge-font-size` tokens.
- AC5: All components shall use `React.forwardRef` and support `className` prop for composition.
- AC6: All components shall be TypeScript with explicit prop interfaces exported.
- AC7: Components shall be placed in `src/components/ui/` (not root-level `components/`).
- AC8: Lint and build shall pass with zero errors after implementation.

**Tasks:** T1 (AC1) implement Button component · T2 (AC2) implement Card component with sub-components · T3 (AC3) implement Input component with form states · T4 (AC4) implement Badge component · T5 (AC5-AC6) add forwardRef and TypeScript interfaces · T6 (AC7) move to src/components/ui/ · T7 (AC8) verify lint + build.

**Out of scope:** Toggle, Select, Textarea (Story 1.2); marketing/header/footer layout (Story 1.4).

**Dev Notes:**

- T1-T4: Each component should use `cn()` utility from `src/lib/cn.ts` (create if not exists) for className merging. Use `class-variance-authority` (cva) for variant management if desired, or simple conditional classes.
- Token references from `globals.css`:
  - Button: `--button-radius`, `--button-padding-x`, `--button-padding-y`, `--button-font-size`, `--button-font-weight`, `--color-accent`, `--color-accent-hover`, `--color-accent-foreground`, `--color-muted`, `--color-muted-foreground`, `--color-destructive`, `--color-destructive-foreground`
  - Card: `--card-radius`, `--card-padding`, `--card-shadow`, `--color-card`, `--color-card-foreground`
  - Input: `--input-radius`, `--input-border-width`, `--input-padding-x`, `--input-padding-y`, `--input-font-size`, `--input-height`, `--input-border-color`, `--input-border-color-focus`, `--input-border-color-error`, `--input-border-color-disabled`, `--input-background`, `--input-background-disabled`, `--input-placeholder-color`
  - Badge: `--badge-radius`, `--badge-padding-x`, `--badge-padding-y`, `--badge-font-size`
- PRD references: Design System v2.0 (Section 5, item 7), color tokens (Section 5, item 7)

---

### Story 1.2 — Design-system primitives: Toggle, Select, Textarea

**Status:** ready

**Story:** As the founder, I want Toggle, Select, and Textarea components built on Design System v2.0 tokens, so onboarding screens 3-5 have all the form primitives they need.

**Acceptance Criteria (EARS):**

- AC1: The system shall provide a `Toggle` (switch) component with `checked`, `onCheckedChange`, `disabled`, and `label` props, using `--toggle-width`, `--toggle-height`, `--toggle-thumb-size`, `--toggle-radius` tokens.
- AC2: The system shall provide a `Select` component with `options`, `value`, `onValueChange`, `placeholder`, `disabled`, and `label` props, using `--select-radius`, `--select-padding-x`, `--select-padding-y`, `--select-font-size`, `--select-height` tokens.
- AC3: The system shall provide a `Textarea` component with `label`, `placeholder`, `error`, `disabled`, `helperText`, `rows`, and `maxLength` props, using Input tokens with multi-line support.
- AC4: All components shall use `React.forwardRef` and support `className` prop for composition.
- AC5: All components shall be TypeScript with explicit prop interfaces exported.
- AC6: Lint and build shall pass with zero errors after implementation.

**Tasks:** T1 (AC1) implement Toggle component · T2 (AC2) implement Select component · T3 (AC3) implement Textarea component · T4 (AC4-AC5) add forwardRef and TypeScript interfaces · T5 (AC6) verify lint + build.

**Out of scope:** Onboarding Step 3 (milestone rewards toggle) — that's a feature story, not a primitive.

**Dev Notes:**

- T1: Toggle should visually match the design system's accent color (`#0F7A5E`) when checked. Use CSS transitions for smooth thumb movement.
- T2: Select can use native `<select>` styled with tokens, or a custom dropdown. Keep it simple — no complex combobox behavior needed.
- T3: Textarea should auto-resize or have a fixed height with scroll. Use `--input-*` tokens for consistency with Input.
- Token references from `globals.css`:
  - Toggle: `--toggle-width`, `--toggle-height`, `--toggle-thumb-size`, `--toggle-radius`, `--color-accent`, `--color-accent-foreground`, `--color-muted`, `--color-border`
  - Select: `--select-radius`, `--select-padding-x`, `--select-padding-y`, `--select-font-size`, `--select-height`, `--input-*` tokens
  - Textarea: `--input-*` tokens (shared with Input component)

---

### Story 1.3 — Onboarding layout shell + step progress bar

**Status:** ready

**Story:** As the founder, I want an onboarding layout shell with a visible step progress bar, so I always know where I am in the 5-step onboarding flow.

**Acceptance Criteria (EARS):**

- AC1: The onboarding layout shall render a split-pane shell: left pane for the form content, right pane for the live preview (desktop). On mobile, the panes shall stack vertically.
- AC2: The layout shall include a step progress bar showing steps 1-5 (and 4a when active), with the current step highlighted using the accent color (`#0F7A5E`).
- AC3: The progress bar shall display step numbers and step labels: "Name" (1), "Template" (2), "Brand" (3), "Questions" (4/4a), "Email" (5).
- AC4: The layout shall include a "Back" navigation link on steps 2-5 that returns to the previous step without saving.
- AC5: The layout shall be responsive — split-pane on `md:` breakpoint and above, stacked on smaller viewports.
- AC6: The layout shall use the existing `src/app/onboarding/layout.tsx` file (currently minimal) and expand it.
- AC7: Lint and build shall pass with zero errors after implementation.

**Tasks:** T1 (AC1) implement split-pane shell with responsive breakpoints · T2 (AC2-AC3) implement step progress bar with step labels · T3 (AC4) add back navigation · T4 (AC5) ensure mobile responsiveness · T5 (AC6) integrate into existing layout.tsx · T6 (AC7) verify lint + build.

**Out of scope:** The live-preview component itself (Story 1.6); actual form content for each step (Sprint 1 feature stories).

**Dev Notes:**

- T1: Use Tailwind's `md:grid md:grid-cols-2` for the split-pane layout. Left pane scrolls, right pane is sticky.
- T2: Progress bar should use `--color-accent` for active step, `--color-muted` for incomplete steps, `--color-card` background.
- T3: Back link uses `--color-muted-foreground` text, chevron icon (left arrow).
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
- AC6: Lint and build shall pass with zero errors after implementation.

**Tasks:** T1 (AC1) implement header with logo and CTAs · T2 (AC2) implement footer · T3 (AC3) add scroll-aware header background · T4 (AC4) add mobile hamburger menu · T5 (AC5) wire layout to route groups · T6 (AC6) verify lint + build.

**Out of scope:** The actual homepage content (hero, problem section, pricing, etc.) — that's a Sprint 1 feature story. The "Powered by" conditional hero variant (REQ-6.2.1) is also a feature story.

**Dev Notes:**

- T1: Header uses `--color-background` background (transparent initially), `--color-foreground` text, accent color for CTAs.
- T2: Footer uses `--color-muted` background, `--color-muted-foreground` text.
- T3: Use `IntersectionObserver` or scroll event to toggle header background opacity.
- T4: Mobile menu uses a slide-in drawer or dropdown. Use `--z-dropdown` or `--z-overlay` for stacking.
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
- AC6: The component shall be placed in `src/components/share/share-copy-link.tsx` and exported from a barrel file.
- AC7: Lint and build shall pass with zero errors after implementation.

**Tasks:** T1 (AC1-AC3) implement dual-button layout with feature detection · T2 (AC4) implement clipboard copy with confirmation state · T3 (AC5) add callback props · T4 (AC6) place in correct directory · T5 (AC7) verify lint + build.

**Out of scope:** Using this component in the success screen or dashboard — that's a Sprint 1 feature story.

**Dev Notes:**

- T1: Use `navigator.share` for Web Share API, `navigator.clipboard.writeText()` for copy. Feature-detect with `typeof navigator.share !== 'undefined'`.
- T2: Use a temporary state (`useState`) to show "Copied!" for 2 seconds, then revert.
- T4: AGENTS.md mandates: "Use the shared `components/share/share-copy-link.tsx` component anywhere sharing appears — never a one-off implementation."
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
- AC6: The component shall be placed in `src/components/onboarding/live-preview.tsx`.
- AC7: Lint and build shall pass with zero errors after implementation.

**Tasks:** T1 (AC1) implement responsive preview frame · T2 (AC2-AC3) add prop-driven rendering with debounced updates · T3 (AC4) implement Desktop/Mobile toggle · T4 (AC5) implement template variants (minimal/bold/dark) · T5 (AC6) place in correct directory · T6 (AC7) verify lint + build.

**Out of scope:** The actual waitlist page content (that's Sprint 2) — this component renders a preview representation, not the live page.

**Dev Notes:**

- T1: Use an iframe or a scaled `<div>` with `transform: scale()` to create the preview frame. The phone mockup can be a CSS border/shadow.
- T2: Accept props and render a simplified preview of the waitlist page. The actual public waitlist page is Sprint 2 — this is just a preview.
- T4: Template variants map to visual styles: `minimal` (clean, lots of white), `bold` (large text, strong contrast), `dark` (dark background, light text).
- PRD references: REQ-6.6.5 ("live preview shall update with no perceptible lag"), REQ-6.7.2 ("Desktop/Mobile toggle changes only the preview viewport"), Component tree (Section 7.6) shows `onboarding/live-preview.tsx`

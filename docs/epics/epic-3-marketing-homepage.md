# Epic 3 — Marketing Homepage

**Status:** done
**Source:** [PRD S6.1 Marketing Homepage — Cold Visitor](../PRD-Sprint-1.md#61-marketing-homepage--cold-visitor-f-a2), [PRD S6.2 Marketing Homepage — "Powered by" Visitor](../PRD-Sprint-1.md#62-marketing-homepage--powered-by-visitor-f-a3)

## Design References

| Reference           | File                                                           |
| ------------------- | -------------------------------------------------------------- |
| Marketing Homepage  | `docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg`    |
| Powered-by Homepage | `docs/design/High-fidelity-svgs/HF2-_Powered by_ Homepage.svg` |

## Goal

Build the marketing homepage — the first thing visitors see — matching the high-fidelity spec (`HF1-Marketing Homepage.svg`, 4,985px tall, 7+ sections). After this epic, the homepage drives signups via "Build it free" CTAs, captures acquisition sources for attribution, and renders a conditional "Powered by" hero variant for visitors arriving from a founder's shared link.

## Definition of Done

The homepage renders all sections from the HF1 SVG in order: header (already built), hero, problem section, "The Difference" section, comparison grid, feature details, confidence callout, pricing (Free + Pro only — no Growth card), and footer (already built). All "Build it free" CTAs navigate to `/signup`. "Sign in" navigates to `/signin`. The `ref`/`utm_*` acquisition values are captured via cookie on page load. The "Powered by" hero variant renders conditionally when the visitor arrives via a founder's shared link. The page is responsive (mobile-first, matching the mobile hamburger menu already in MarketingLayout). Navbar border appears at top of page and disappears on scroll. Footer uses warm ivory background with 16px text. Pricing cards have aligned CTA buttons via flex layout. Lint and build pass.

## Story Index

| ID  | Title                                                   | Depends on | Status |
| --- | ------------------------------------------------------- | ---------- | ------ |
| 3.0 | Acquisition capture API + cookie persistence            | —          | done   |
| 3.1 | Hero section + conditional "Powered by" variant         | 3.0        | done   |
| 3.2 | Problem section + "The Difference" section              | 3.1        | done   |
| 3.3 | Comparison grid + feature details                       | 3.2        | done   |
| 3.4 | Pricing section (Free + Pro only)                       | 3.3        | done   |
| 3.5 | Responsive polish + footer integration                  | 3.4        | done   |
| 3.x | Extra: Confidence section, navbar scroll, pricing align | 3.5        | done   |

Work through these in dependency order, one at a time. Each has a `status` you should update as you go (`ready` → `in-progress` → `blocked` or `done`). A story marked `blocked` stays blocked until manually cleared — don't silently re-attempt it next session.

---

### Story 3.0 — Acquisition Capture API + Cookie Persistence

**Status:** done
**Design Refs:** — (no UI)
**Story:** As the founder, I want visitor acquisition sources (`ref`/`utm_*`) captured on page load so they can be attributed to signups created later in the same browser session.

**Acceptance Criteria (EARS):**

- AC1: When `/` is requested with a `ref` query parameter, the system shall persist that value in a cookie with 30-day expiry (REQ-6.1.4).
- AC2: When `/` is requested with any `utm_*` query parameter (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`), the system shall persist those values in cookies with 30-day expiry (REQ-6.1.4).
- AC3: The cookie values shall be readable by the signup flow (`/signup`) so they can be attached to the new founder record per REQ-6.3.4.
- AC4: If no `ref` or `utm_*` parameters are present, no acquisition cookie shall be set.
- AC5: The cookie name shall be `mw_acquisition` and the value shall be a JSON-encoded object of all captured parameters.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC5) Create API route or middleware for acquisition cookie persistence · T2 (AC3) Verify cookie is readable from signup page · T3 (AC6) Run lint + build

**Out of scope:** Dashboard reporting on acquisition sources (Epic 5, REQ-6.14), display of acquisition data in any UI.

**Dev Notes:**

- T1: Option A — use `proxy.ts` to intercept `/` requests with query params and set cookies before the page renders. Option B — use a lightweight API route `src/app/api/acquisition/route.ts` called from a `useEffect` on the homepage. Option A is cleaner (no client-side JS needed). Use `NextResponse.cookies.set()` with `maxAge: 60 * 60 * 24 * 30` (30 days). **Status: done — implemented via `proxy.ts` (Option A).** `captureAcquisition()` function reads `ref`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` from query params and sets `mw_acquisition` cookie as JSON.
- T2: The auth callback (`src/app/auth/callback/route.ts`) reads the `mw_acquisition` cookie after session exchange, parses the JSON, and updates the `founder_profiles` row with `ref_param`, `utm_source`, `utm_medium`, `utm_campaign`, `acquisition_captured_at`. Cookie is deleted after capture. **Status: done — implemented in auth callback.**
- T3: Files: `proxy.ts`, `src/app/auth/callback/route.ts`. **Available components:** none needed (server-side cookie logic).

---

### Story 3.1 — Hero Section + Conditional "Powered by" Variant

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg` (hero section), `docs/design/High-fidelity-svgs/HF2-_Powered by_ Homepage.svg`
**Story:** As the visitor, I want to see a compelling hero section that explains what MyWaitlist is and invites me to sign up, so I understand the product's value immediately.

**Acceptance Criteria (EARS):**

- AC1: The homepage shall render a hero section matching the HF1 SVG layout: headline, subheadline, "Build it free" CTA button, and hero illustration/graphic.
- AC2: The hero shall be a single conditional component, not a separate page, so the cold-visitor and "Powered by" variants cannot drift from each other (REQ-6.2.1).
- AC3: When the visitor arrives via a founder's shared link (i.e., a `ref` parameter is present), the hero shall render the "Powered by" variant from HF2 SVG, showing the founder's waitlist context.
- AC4: When no `ref` parameter is present, the hero shall render the standard cold-visitor variant from HF1 SVG.
- AC5: All "Build it free" CTAs in the hero shall navigate to `/signup` (REQ-6.1.2).
- AC6: When "Sign in" is clicked, the system shall navigate to `/signin` (REQ-6.1.3).
- AC7: The hero section shall be responsive — stacked layout on mobile, side-by-side on `md:` and above.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Build hero section UI from HF1 SVG · T2 (AC2-AC4) Implement conditional hero variant (cold vs "Powered by") · T3 (AC5-AC6) Wire CTAs to /signup and /signin · T4 (AC7) Ensure responsive layout · T5 (AC8) Run lint + build

**Out of scope:** The "Powered by" public waitlist page itself (Sprint 2) — this is only the marketing homepage hero variant.

**Dev Notes:**

- T1: From `HF1-Marketing Homepage.svg`: hero section is the top portion with headline, subheadline, CTA, and illustration. Use design tokens from `globals.css` — `.text-display` or `.text-h1` for headline, `.text-body-lg` for subheadline, Button `variant="primary"` `size="lg"` for CTA. **Status: done.**
- T2: Check for `ref` query parameter using `useSearchParams()` from `next/navigation` (wrap in `<Suspense>` per Next.js 16 requirement). When present, render the HF2 "Powered by" hero variant. When absent, render HF1 standard hero. Both variants share the same CTA behavior. **Status: done.**
- T3: Use `<Link href="/signup">` with Button styling for "Build it free". Use `<Link href="/signin">` for "Sign in". **Status: done.**
- T4: Use responsive Tailwind classes. The hero should work on mobile viewports (Twitter/X-sourced traffic is predominantly mobile per User Profile doc). **Status: done.**
- T5: Files: `components/marketing/hero.tsx`. **Available components:** `Button` ✓, `Link` (Next.js).

---

### Story 3.2 — Problem Section + "The Difference" Section

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg` (problem + "The Difference" sections)
**Story:** As the visitor, I want to understand the problem MyWaitlist solves and what makes it different from alternatives, so I can decide if it's right for me.

**Acceptance Criteria (EARS):**

- AC1: The homepage shall render a problem section below the hero, matching the HF1 SVG layout — describing the pain points of pre-launch audience building.
- AC2: The homepage shall render a "The Difference" section below the problem section, matching the HF1 SVG layout — explaining MyWaitlist's unique approach.
- AC3: All text content shall match the HF1 SVG exactly — no rewritten or paraphrased copy (AGENTS.md: never write or rephrase user-facing text).
- AC4: Both sections shall use design system tokens for typography (`.text-h2`, `.text-body-lg`, etc.) and spacing.
- AC5: Both sections shall be responsive — stacked on mobile, properly spaced on `md:` and above.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Build problem section from HF1 SVG · T2 (AC2) Build "The Difference" section from HF1 SVG · T3 (AC3) Verify copy matches SVG exactly · T4 (AC4-AC5) Apply design tokens + responsive layout · T5 (AC6) Run lint + build

**Out of scope:** Any interactive elements in these sections (they are static content).

**Dev Notes:**

- T1: From `HF1-Marketing Homepage.svg`: locate the problem section (after hero). Extract text content, layout structure, and any icons/illustrations. Use `<section>` semantic HTML. Three cards with SVG icons (person, list, clipboard), rounded-[10px] corners, muted-foreground text. **Status: done.**
- T2: From `HF1-Marketing Homepage.svg`: locate "The Difference" section. Single-column centered layout with overline in accent green, heading, example users (Sarah — Hot, James — Cold) with colored dots. **Status: done.**
- T3: Copy extracted verbatim from SVG. **Status: done.**
- T5: Files: `components/marketing/problem-section.tsx`, `components/marketing/difference-section.tsx`.

---

### Story 3.3 — Comparison Grid + Feature Details

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg` (comparison + feature grid sections)
**Story:** As the visitor, I want to see a comparison of MyWaitlist vs alternatives and a detailed feature grid, so I can make an informed decision.

**Acceptance Criteria (EARS):**

- AC1: The homepage shall render a comparison section below "The Difference" section, matching the HF1 SVG layout — comparing MyWaitlist to alternatives (e.g., traditional waitlist tools, manual spreadsheets).
- AC2: The homepage shall render a feature grid/detail section showing key features with icons or descriptions, matching the HF1 SVG layout.
- AC3: All text content shall match the HF1 SVG exactly — no rewritten or paraphrased copy.
- AC4: The comparison section shall use Card components or a grid layout for clean visual separation.
- AC5: Both sections shall be responsive — stacked on mobile, grid on `md:` and above.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Build comparison section from HF1 SVG · T2 (AC2) Build feature grid from HF1 SVG · T3 (AC3) Verify copy matches SVG exactly · T4 (AC4-AC5) Apply design tokens + responsive layout · T5 (AC6) Run lint + build

**Out of scope:** Interactive comparison tools, pricing details (Story 3.4).

**Dev Notes:**

- T1: Two cards side by side on white `bg-card` background. Left card "Building it manually" with red ✗ SVG marks. Right card "This product" with green circled ✓ SVG marks. List items have `gap-4` spacing and `gap-3` icon-to-text gap for readability. **Status: done.**
- T2: 2×2 grid of feature cards with small green SVG icons (person=Qualification, flame=Warmth tracking, link=Referral quality, envelope=Communication). Centered in `max-w-4xl`. **Status: done.**
- T5: Files: `components/marketing/comparison-section.tsx`, `components/marketing/feature-grid.tsx`. **Available components:** `Card` ✓.

---

### Story 3.4 — Pricing Section (Free + Pro Only)

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg` (pricing section)
**Story:** As the visitor, I want to see clear pricing for Free and Pro tiers, so I know what I get at each level and can decide to sign up.

**Acceptance Criteria (EARS):**

- AC1: The homepage shall render a pricing section below the comparison/feature sections, matching the HF1 SVG layout.
- AC2: The pricing section shall show exactly two tiers: Free and Pro (REQ-6.1.5).
- AC3: No Growth-tier pricing card shall render on this route regardless of the founder's actual tier data — this route is static marketing content, not tier-aware (REQ-6.1.5).
- AC4: Each tier card shall show: tier name, price, feature list, and a "Build it free" CTA.
- AC5: The Free tier CTA shall navigate to `/signup`.
- AC6: All "Build it free" CTAs shall navigate to `/signup`.
- AC7: The pricing section shall be responsive — cards stacked on mobile, side-by-side on `md:` and above.
- AC8: Both pricing cards shall have CTA buttons aligned at the bottom of each card for visual uniformity.
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC4) Build pricing section with Free + Pro cards · T2 (AC5-AC6) Wire CTAs to /signup · T3 (AC7-AC8) Ensure responsive layout + button alignment · T4 (AC9) Run lint + build

**Out of scope:** Growth tier (not in Sprint 1 scope), actual payment integration (Paddle, Sprint 2+), tier comparison logic.

**Dev Notes:**

- T1: Two cards: Base "Free – $0/month" (en dash) and Pro "$15/month" with "Popular" badge. Feature lists use green ✓ SVG checkmarks; excluded items use em dash (—). Pro card has `border-accent`. **Status: done.**
- T2: Each card's CTA uses `<Link href="/signup">` with Button styling. **Status: done.**
- T3: Cards use `flex flex-col` on Card, `flex-1` on CardContent and spacer div to push CTAs to bottom of both cards equally. **Status: done.**
- T4: Files: `components/marketing/pricing-section.tsx`. **Available components:** `Card` ✓, `Button` ✓.

---

### Story 3.5 — Responsive Polish + Footer Integration

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg` (full page)
**Story:** As the visitor, I want the homepage to look polished on both mobile and desktop, with consistent spacing and no visual regressions, so I have a professional first impression.

**Acceptance Criteria (EARS):**

- AC1: The homepage shall render all sections in the correct order: hero, problem, "The Difference", comparison, feature grid, confidence callout, pricing, footer.
- AC2: The footer (already built in MarketingLayout) shall appear at the bottom of the page with no visual issues.
- AC3: The page shall be fully responsive — all sections stack properly on mobile (375px viewport minimum) and display correctly on desktop (1440px viewport).
- AC4: All section spacing shall use design system spacing tokens (`--spacing-*`) consistently.
- AC5: The page shall have no horizontal overflow on any viewport size.
- AC6: The page shall use the warm ivory background (`#FAF8F4`) from the design system, not white or grey.
- AC7: All typography shall use design system token classes (`.text-h1`, `.text-h2`, `.text-body-lg`, etc.) — no hardcoded font sizes.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Verify section order matches REQ-6.1.1 · T2 (AC2) Verify footer integration · T3 (AC3-AC5) Responsive testing and fixes · T4 (AC6-AC7) Verify design token usage · T5 (AC8) Run lint + build

**Out of scope:** Animation, parallax effects, or any interactivity beyond CTAs.

**Dev Notes:**

- T1: REQ-6.1.1 mandates this exact order: header, hero, problem section, "The Difference" section, comparison section, feature grid, confidence callout, pricing (Free/Pro only), and footer. **Status: done.**
- T3: Test at 375px (mobile), 768px (tablet), 1024px (laptop), 1440px (desktop). Ensure no horizontal scroll. **Status: done.**
- T5: Files: `src/app/(marketing)/page.tsx` and any section components created in Stories 3.1–3.4.

---

### Story 3.x — Extra: Confidence Section, Navbar Scroll, Pricing Alignment, Footer

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/HF1-Marketing Homepage.svg` (confidence callout, full page)
**Story:** As the visitor, I want the homepage to feel polished with proper section separation, a clean navbar, and uniform pricing cards.

**Changes Made:**

1. **Confidence Section** (`components/marketing/confidence-section.tsx`): Extracted the comparison callout into its own standalone section. No hardcoded background — uses default warm ivory. Text styled with `text-body-lg text-accent` (subheader weight in brand green). "free" and "500" in bold. `border-y border-border` separates it from feature grid above and pricing below.

2. **Navbar Scroll Behavior** (`components/layout/marketing-layout.tsx`): Border appears at top of page (separates nav from hero). Disappears when user scrolls (`scrollY > 0`). Uses `useState` + `useEffect` scroll listener with `{ passive: true }`.

3. **Pricing Card Alignment** (`components/marketing/pricing-section.tsx`): Both cards use `flex flex-col` on Card, `flex-1` on CardContent to stretch within the grid. A `<div className="flex-1" />` spacer between features and CTA pushes buttons to the bottom of both cards equally.

4. **Footer Update** (`components/layout/marketing-layout.tsx`): Removed `bg-muted` background (now warm ivory). Bumped text from `text-caption` (12px) to `text-body` (16px). Logo increased from 36×27 to 48×36, gap reduced from `gap-2` to `gap-1`.

5. **Section Borders**: Removed `border-b` from `ComparisonSection` and `DifferenceSection`. Added `border-y` to `ConfidenceSection` for clean section separation.

6. **Feature Grid**: Stripped to just the 4-card grid, centered in `max-w-4xl`. Callout extracted to ConfidenceSection.

7. **Comparison Section**: Added `bg-card` for white background band. Red dots → red ✗ SVG marks. Green dots → green circled ✓ SVG marks. List item spacing increased to `gap-4` for readability.

8. **Feature Grid Icons**: Added small green SVG icons (person, flame, link, envelope) next to each feature title.

9. **Pricing Features**: Dots → green ✓ checkmarks. Base price format: "Free – $0/month" (en dash). Pro price: "$15/month".

**Dev Notes:**

- Files touched: `components/marketing/confidence-section.tsx` (new), `components/marketing/feature-grid.tsx`, `components/marketing/comparison-section.tsx`, `components/marketing/pricing-section.tsx`, `components/layout/marketing-layout.tsx`, `src/app/(marketing)/page.tsx`.
- Section order on page: Hero → ProblemSection → DifferenceSection → ComparisonSection → FeatureGrid → ConfidenceSection → PricingSection.

# Epic 4 — Onboarding Wizard

**Status:** in-progress
**Source:** [PRD S6.6 Onboarding Step 1](../PRD-Sprint-1.md#66-onboarding-step-1--name-your-waitlist-f-c1), [PRD S6.7 Onboarding Step 2](../PRD-Sprint-1.md#67-onboarding-step-2--choose-a-template-f-c2), [PRD S6.8 Onboarding Step 3](../PRD-Sprint-1.md#68-onboarding-step-3--make-it-yours-f-c3), [PRD S6.9 Onboarding Step 4](../PRD-Sprint-1.md#69-onboarding-step-4--qualification-decision-f-c4), [PRD S6.10 Onboarding Step 4a](../PRD-Sprint-1.md#610-onboarding-step-4a--configure-qualification-questions-f-c4a), [PRD S6.11 Onboarding Step 5](../PRD-Sprint-1.md#611-onboarding-step-5--email-setup-f-c5), [PRD S6.12 Success Screen](../PRD-Sprint-1.md#612-success-screen-f-c6), [PRD S6.12a Powered-By Footer](../PRD-Sprint-1.md#612a-powered-by-mywaitlist-footer--onboarding-preview--public-pages)

## Design Analysis Reference

Full analysis: `docs/design/design-analysis.md` — all 10 SVGs analyzed, PRD cross-referenced, web research complete. 98% confidence.

### Cross-Screen Design Patterns

| Pattern            | Design Evidence                                                                                     | Epic Alignment                                      |
| ------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Layout**         | Steps 1–3 = two-pane (566px left + browser mockup). Steps 4, 5, Success = centered (no right pane). | Story 4.0 must handle layout switching.             |
| **Buttons**        | Steps 1–4 = arrow-only (→). Step 5 = text+arrow ("Launch my waitlist" + →), 644px wide.             | All stories must use correct button pattern.        |
| **Progress dots**  | 5 dots, 10px diameter, ~16.7px center-to-center. Same color (`#0F7A5E`) for completed AND current.  | Story 4.0 AC10 updated — no checkmarks, same color. |
| **Template cards** | 457×123px, rx=23.5, 2px accent border for selected state.                                           | Story 4.2 updated with exact dimensions.            |
| **Form inputs**    | 60.33px height, 12.164px border-radius, `#CCC9C3` 1.67px border.                                    | All stories use consistent input styling.           |
| **Success screen** | No progress dots, centered, share/copy at equal visual weight.                                      | Story 4.7 updated — terminal state.                 |

### Layout Distribution

| Step    | Layout Type           | Right Pane  | Progress Dots | Back Link                       |
| ------- | --------------------- | ----------- | ------------- | ------------------------------- |
| Step 1  | Two-pane (566px)      | LivePreview | 1 filled      | None                            |
| Step 2  | Two-pane (566px)      | LivePreview | 2 filled      | /onboarding/1                   |
| Step 3  | Two-pane (566px)      | LivePreview | 3 filled      | /onboarding/2                   |
| Step 4  | Centered (full-width) | None        | 4 filled      | /onboarding/3                   |
| Step 4a | Centered (full-width) | None        | 4 filled      | /onboarding/4                   |
| Step 5  | Centered (full-width) | None        | 5 filled      | /onboarding/4a or /onboarding/4 |
| Success | Centered (full-width) | None        | None          | None                            |

## UI/UX Stress Test Recommendations (applied to stories below)

Source: Pre-implementation stress test against NNGroup 2024, Apple HIG, Material Design 3, WCAG 2.5.8. These are folded into the relevant story ACs and Dev Notes.

| #   | Recommendation                                                                                                               | Story | Priority |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ----- | -------- |
| 1   | Sticky mobile CTA — submit buttons stay visible on long forms (Steps 3, 4a, 5) via `sticky bottom-0 md:static` wrapper       | 4.0   | High     |
| 2   | Progress dots — same accent color for completed and current steps (design spec), grey for not-yet-reached                    | 4.0   | High     |
| 3   | Step transition loading state — disable form + show Spinner during API call, re-enable on error, prevents double-submit      | 4.0   | Medium   |
| 4   | Bigger touch targets for progress dots — each `<Link>` wrapping a dot needs `min-w-[44px] min-h-[44px]` to meet WCAG 2.5.8   | 4.0   | High     |
| 5   | "I'll name it later" helper text — add `text-caption` below the link: "We'll assign a random URL — you can change it later." | 4.1   | Medium   |
| 6   | Layout switching — onboarding layout must support both two-pane (Steps 1–3) and centered (Steps 4, 5, Success)               | 4.0   | High     |
| 7   | Button patterns — arrow-only (→) for Steps 1–4, text+arrow for Step 5                                                        | 4.0   | High     |

## LivePreview Mobile/Desktop Research

**Date:** 2026-07-31
**Status:** Research complete — implementation deferred (user confirmed mobile view is not an issue)

### Research Question

How should the LivePreview component handle mobile vs desktop preview switching in an onboarding builder context?

### Findings

| Tool           | Approach                                                               |
| -------------- | ---------------------------------------------------------------------- |
| **Webflow**    | Viewport-only — width constraint to mobile breakpoints, no phone frame |
| **Framer**     | Canvas resizing — no bezel, just narrower viewport                     |
| **Carrd**      | Width-only crop to phone dimensions                                    |
| **Layout.dev** | Phone bezel outline (398×852) around iframe                            |

### Key Insights

1. **Most professional builders use width-only constraint without a phone bezel** for functional previews. Bezels are reserved for marketing/landing page demos, not builder tools.
2. **375px width is the universal standard** (iPhone X/11/12/13/14/15/16 CSS viewport width).
3. **No bezel for functional previews** — just constrain the iframe width. This is what Webflow, Framer, Carrd, and every serious builder does.
4. **Phone bezel for marketing/polished previews** — landing pages, onboarding "this is what your page looks like" moments.

### Recommended Pattern

```
Desktop: BrowserFrame { width: 100% }
         ↓ (toggle)
Mobile:  Centered container { width: 375px, rounded-2xl, shadow }
         BrowserFrame removed — just the content in a phone-like shape
```

### Implementation Notes

- **No bezel for functional previews** — just constrain the iframe width
- **Center the mobile frame** — when showing 375px mobile view, center horizontally in preview panel
- **Animate width toggle** — smooth 200-300ms transition when switching between desktop and mobile
- **Optional phone bezel for marketing** — use `react-device-bezels` library if bezel desired later (76+ device presets, pure CSS, TypeScript)

### Libraries (if bezel wanted later)

- `react-device-bezels` — 76+ device presets, pure CSS, TypeScript
- `react-mockframe` — lightweight, custom frame support

### Decision

**Not implemented** — user confirmed the current mobile view behavior is acceptable. Research documented for future reference.

---

## Design References

| Reference                   | File                                                              |
| --------------------------- | ----------------------------------------------------------------- |
| Onboarding Step 1           | `docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg`          |
| Onboarding Step 2 (Minimal) | `docs/design/High-fidelity-svgs/HF 5 onboard step 2 v1.svg`       |
| Onboarding Step 2 (Bold)    | `docs/design/High-fidelity-svgs/HF 5 onboard step 2 Bold.svg`     |
| Onboarding Step 2 (Dark)    | `docs/design/High-fidelity-svgs/HF 5 onboard step 2 Dark.svg`     |
| Onboarding Step 3           | `docs/design/High-fidelity-svgs/HF 6 onboard step 3.svg`          |
| Onboarding Step 4           | `docs/design/High-fidelity-svgs/HF 6 onboard step 4.svg`          |
| Onboarding Step 4 (variant) | `docs/design/High-fidelity-svgs/HF 4 onboard step 4 pt 1.svg`     |
| Onboarding Step 5 (Free)    | `docs/design/High-fidelity-svgs/HF 6 onboard step 5.svg`          |
| Onboarding Step 5 (Pro)     | `docs/design/High-fidelity-svgs/HF 6 onboard step 5 Pro Tier.svg` |
| Success Screen              | `docs/design/High-fidelity-svgs/Onboard Success Page Founder.svg` |

## Goal

Implement the full onboarding wizard (Steps 1–5 + Success) so a founder who has signed up can configure their waitlist, launch it, and see their live URL. This is the core product flow — the founder goes from "I just signed up" to "my waitlist is live" in under 4 minutes.

## Definition of Done

A founder can complete all onboarding steps — name their waitlist, choose a template, customize branding, decide on qualification, configure questions (if enabled), set up email, and launch — arriving at a success screen with a shareable subdomain URL. All form data persists to Supabase. The live preview renders correctly across Steps 1–3. Steps 4, 5, and Success use centered layout without preview. The "Powered by MyWaitlist" footer renders for Free tier only.

## Story Index

| ID  | Title                                               | Depends on | Status |
| --- | --------------------------------------------------- | ---------- | ------ |
| 4.0 | API routes + shared form context + layout switching | 2.1, 1.3   | done   |
| 4.1 | Step 1 — Name Your Waitlist                         | 4.0        | done   |
| 4.2 | Step 2 — Choose a Template                          | 4.0        | done   |
| 4.3 | Step 3 — Make It Yours                              | 4.0, 4.1   | done   |
| 4.4 | Step 4 — Qualification Decision (centered layout)   | 4.0        | done   |
| 4.5 | Step 4a — Configure Qualification Questions         | 4.0, 4.4   | done   |
| 4.6 | Step 5 — Email Setup + Launch (centered layout)     | 4.0        | ready  |
| 4.7 | Success Screen (centered layout, no progress dots)  | 4.0        | ready  |

Work through these in dependency order, one at a time. Each has a `status` you should update as you go (`ready` → `in-progress` → `blocked` or `done`). A story marked `blocked` stays blocked until manually cleared — don't silently re-attempt it next session.

---

### Story 4.0 — API Routes + Shared Form Context + Layout Switching

**Status:** done
**Design Refs:** — (no UI, but drives layout switching per design analysis)
**Story:** As the developer, I want API routes for waitlist CRUD and slug checking, a shared form context for multi-step state, the LivePreview wired into the onboarding layout for Steps 1–3, layout switching for centered steps (4, 5, Success), and correct progress dots/button patterns so that all subsequent step pages have a data layer, live preview, and layout that matches the design.

**Acceptance Criteria (EARS):**

- AC1: The system shall provide a `POST /api/waitlist` route handler that creates a waitlist record with the founder's user ID, returning the created record's ID.
- AC2: The system shall provide a `PATCH /api/waitlist` route handler that updates a waitlist record by ID, accepting any subset of waitlist fields.
- AC3: The system shall provide a `GET /api/waitlist/check-slug?slug=...` route handler that returns `{ available: boolean }` based on whether the slug exists in the `waitlists` table and whether it matches any reserved word.
- AC4: The slug check shall reject reserved words (api, www, app, admin, dashboard, onboarding, signin, signup, verify-email) identically to already-taken slugs (REQ-6.6.2).
- AC5: A shared `OnboardingFormContext` (React Context) shall provide form state across all onboarding step pages, including: `waitlistId`, `slug`, `headline`, `subheadline`, `template`, `brandColor`, `logoUrl`, `ctaText`, `milestoneRewards` (array), `qualificationEnabled`, `questions` (array), `emailSubject`, `emailSenderName`, `emailBody`, `tier`.
- AC6: The context shall provide `updateField(key, value)` and `setWaitlistId(id)` functions for step pages to update state.
- AC7: The onboarding layout shall render the `LivePreview` component in the right pane for Steps 1–3 (`/onboarding/1`, `/onboarding/2`, `/onboarding/3`), receiving `template`, `headline`, `subheadline`, `brandColor`, `logoUrl`, `ctaText`, `milestoneRewards`, and `tier` from the form context.
- AC8: The onboarding layout shall render a centered layout (no right pane, full-width) for Steps 4, 4a, 5, and Success (`/onboarding/4`, `/onboarding/4a`, `/onboarding/5`, `/onboarding/success`).
- AC9: The onboarding layout progress dots shall each be wrapped in a touch target with `min-w-[44px] min-h-[44px]` to meet WCAG 2.5.8 mobile tap-target requirements.
- AC10: The onboarding layout progress dots shall use the same accent color (`#0F7A5E`) for both completed steps AND the current step. Not-yet-reached steps shall use grey (`#C3C2C2`). There shall be no visual distinction between completed and current — both use filled accent dots (design spec).
- AC11: The onboarding layout shall wrap the bottom action area (Next/Submit buttons) in a `sticky bottom-0` container on mobile (`md:static`) so the primary CTA remains visible during long forms.
- AC12: The `OnboardingFormContext` shall expose a `loading` boolean and a `setLoading` function so step pages can disable the form and show a loading state during API calls.
- AC13: The onboarding layout progress dots shall be hidden on the Success screen (`/onboarding/success`) — it is a terminal state with no progress indicator (design spec).
- AC14: Lint and build shall pass with zero errors.

**Tasks:**

- T1 (AC1-AC4) Create API route handlers
- T2 (AC5-AC6, AC12) Create OnboardingFormContext with loading state
- T3 (AC7-AC8) Implement layout switching: two-pane for Steps 1–3, centered for Steps 4, 4a, 5, Success
- T4 (AC9-AC10) Update progress dots: touch targets + same color for completed/current
- T5 (AC11) Add sticky mobile CTA wrapper
- T6 (AC13) Hide progress dots on Success screen
- T7 (AC14) Run lint + build

**Out of scope:** Step-specific form UI, file upload logic, form validation, step navigation logic.

**Dev Notes:**

- T1: Use `createServerClient` from `@supabase/ssr` for server-side Supabase clients in route handlers. Route files: `src/app/api/waitlist/route.ts` (POST + PATCH), `src/app/api/waitlist/check-slug/route.ts` (GET). The `waitlists` table schema is already applied (Epic 2.1). Slug check queries `waitlists.select('id').eq('subdomain', slug)`. **Status: not started — `src/app/api/` directory does not exist.**
- T2: Create `src/app/onboarding/context.tsx` as a Client Component. Use `useState` for each field, `useContext` for access. Wrap the onboarding layout's `{children}` in the provider. Default `tier` to `"free"` (will be read from founder_profiles table once that integration exists). Add `loading` / `setLoading` state to context so step pages can disable the form during API calls. **Status: not started — `src/app/onboarding/context.tsx` does not exist.**
- T3: The onboarding layout at `src/app/onboarding/layout.tsx` currently uses a fixed two-pane layout. Import `LivePreview` from `components/onboarding/live-preview.tsx` and render it in the sticky container. Add layout switching logic: for routes `/onboarding/1`, `/onboarding/2`, `/onboarding/3` → render two-pane layout with LivePreview. For routes `/onboarding/4`, `/onboarding/4a`, `/onboarding/5`, `/onboarding/success` → render centered layout (no right pane, no back link on success). The context provider must wrap both layout variants. **Status: not started — layout exists (`src/app/onboarding/layout.tsx`) but LivePreview is not imported or rendered; right pane is empty placeholder text.** Component exists: `components/onboarding/live-preview.tsx` ✓.
- T4: In the progress dots `<nav>`, wrap each dot `<Link>` with `min-w-[44px] min-h-[44px] flex items-center justify-center`. Track current step from context/route. Render filled accent dot (`#0F7A5E`) for steps ≤ currentStep, grey dot (`#C3C2C2`) for steps > currentStep. **Do NOT use checkmarks** — design shows same color for completed and current. **Status: not started — progress dots exist in layout at 10px with no touch target sizing or completed state.**
- T5: Wrap the bottom action area in `<div className="sticky bottom-0 bg-background px-14 pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0">`. Each step page's submit button goes inside this wrapper. **Status: not started — no sticky CTA wrapper exists.**
- T6: On the Success screen route (`/onboarding/success`), hide the progress dots nav entirely. The success screen is a terminal state with no progress indicator. **Status: not started.**
- T7: Files: `src/app/api/waitlist/route.ts`, `src/app/api/waitlist/check-slug/route.ts`, `src/app/onboarding/context.tsx`, `src/app/onboarding/layout.tsx`. **Available components (all exist):** `components/ui/button.tsx` ✓, `components/ui/input.tsx` ✓, `components/ui/card.tsx` ✓, `components/ui/spinner.tsx` ✓, `components/ui/toggle.tsx` ✓, `components/ui/badge.tsx` ✓, `components/ui/textarea.tsx` ✓, `components/share/share-copy-link.tsx` ✓, `components/share/powered-by-footer.tsx` ✓, `components/lib/cn.ts` ✓, `src/lib/supabase/server.ts` ✓, `src/lib/supabase/client.ts` ✓.

---

### Story 4.1 — Step 1 — Name Your Waitlist

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg`
**Story:** As the founder, I want to name my waitlist with a headline, subheadline, and custom subdomain so my waitlist has an identity and a shareable URL.

**Design Specs (from analysis):**

- **Layout:** Two-pane (566px left + LivePreview right)
- **Progress dots:** 1 filled `#0F7A5E` (current), 4 grey `#C3C2C2`
- **Form fields:** 3 stacked vertically, x=54.836, width=456.328, gap ~46px
- **Field dimensions:** 60.33px height, 12.164px border-radius, `#CCC9C3` 1.67px border
- **Submit button:** 458×59px, rx=9.59, `#0F7A5E` fill, arrow-only (→)
- **"I'll name it later":** Link text with `text-caption` helper below: "We'll assign a random URL — you can change it later."
- **Subdomain suffix:** `.mywaitlist.com` (read-only)

**Acceptance Criteria (EARS):**

- AC1: The page shall render a form with three fields: Headline (text input), Subheadline (textarea), and Subdomain (text input with suffix showing `.mywaitlist.com`).
- AC2: While the founder types in the subdomain field, the system shall derive a candidate slug (lowercase, alphanumeric + hyphens only) and check its availability via `GET /api/waitlist/check-slug`, debounced 300-500ms after the last keystroke (REQ-6.6.1).
- AC3: The system shall display real-time availability feedback: a green checkmark + "Available" for available slugs, or a red error + "Already taken" for unavailable slugs.
- AC4: If a candidate slug matches a reserved word, the system shall reject it as unavailable, identically to an already-taken slug (REQ-6.6.2).
- AC5: The system shall constrain accepted slugs to lowercase alphanumeric characters and hyphens, maximum 63 characters (REQ-6.6.3).
- AC6: The page shall include an "I'll name it later" link that assigns a random unique fallback slug and skips the subdomain field (REQ-6.6.4). A `text-caption` helper line below the link shall read: "We'll assign a random URL — you can change it later."
- AC7: On form submission, the system shall POST to `/api/waitlist` to create the waitlist record, store the `waitlistId` in context, and navigate to `/onboarding/2`. While the API call is in progress, the form shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC8: The live preview shall update from the Headline/Sub-headline fields with no perceptible lag (REQ-6.6.5).
- AC9: The submit button shall display an arrow icon only (→), no text label, matching the design spec.
- AC10: Lint and build shall pass with zero errors.

**Tasks:**

- T1 (AC1) Build Step 1 form UI
- T2 (AC2-AC5) Implement slug derivation + availability check
- T3 (AC6) Implement "I'll name it later" fallback + helper text
- T4 (AC7) Submit handler + loading state + API call + navigation
- T5 (AC8) Verify live preview wiring
- T6 (AC9) Build arrow-only submit button
- T7 (AC10) Run lint + build

**Out of scope:** Template selection (Step 2), brand customization (Step 3), logo upload.

**Dev Notes:**

- T1: Use `Input` and `Textarea` from `components/ui/`. The subdomain input should display `{candidateSlug}.mywaitlist.com` as a read-only suffix. Form layout follows the left pane of the onboarding shell. Field height: 60.33px, border-radius: 12.164px, border: `#CCC9C3` 1.67px. **Status: not started — `src/app/onboarding/1/page.tsx` is a bare placeholder (`<div>Onboarding Step 1 — Name your waitlist — placeholder</div>`).**
- T2: Slug derivation: `slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 63)`. Debounce using `useDeferredValue` or `setTimeout`/`clearTimeout`. The check-slug API returns `{ available: boolean }`. **Status: not started — API route does not exist yet (Story 4.0 T1).**
- T3: Generate a fallback slug: `crypto.randomUUID().slice(0, 8)` or similar. Store it as the slug in context. The "I'll name it later" link should still allow the user to set headline/subheadline before proceeding. Add a `<p className="text-caption">` below the link with the helper text: "We'll assign a random URL — you can change it later." **Status: not started.**
- T4: After POST, call `setWaitlistId(response.id)` from context. Call `setLoading(true)` before the API call, `setLoading(false)` after (or on error). Navigate with `router.push('/onboarding/2')`. While loading, disable all form inputs and the submit button. **Status: not started — API route does not exist yet (Story 4.0 T1).**
- T5: The live preview in the right pane reads `headline` and `subheadline` from context. As the user types, the preview updates via context state. **Status: not started — depends on context (Story 4.0 T2) and LivePreview wiring (Story 4.0 T3).**
- T6: The submit button should be 458×59px, rx=9.59, `#0F7A5E` fill, `#FAF8F4` text, containing only the arrow icon "→" (no text label). **Status: not started.**
- T7: Files: `src/app/onboarding/1/page.tsx`. **Available components:** `Input` ✓, `Textarea` ✓.

---

### Story 4.2 — Step 2 — Choose a Template

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/HF 5 onboard step 2 v1.svg`, `docs/design/High-fidelity-svgs/HF 5 onboard step 2 Bold.svg`, `docs/design/High-fidelity-svgs/HF 5 onboard step 2 Dark.svg`
**Story:** As the founder, I want to choose a visual template for my waitlist page so it matches my brand's aesthetic.

**Design Specs (from analysis):**

- **Layout:** Two-pane (566px left + LivePreview right)
- **Progress dots:** 2 filled `#0F7A5E` (completed + current), 3 grey `#C3C2C2`
- **Template cards:** 3 cards stacked vertically, each 457×123px, rx=23.5
- **Mini preview:** 136.83×94.73px, rx=15.79, stroke `#CCC9C3`
- **Selected state:** 2px accent border (`#0F7A5E`)
- **Unselected state:** 1px `#CCC9C3` border
- **Submit button:** 458×59px, rx=9.59, `#0F7A5E` fill, arrow-only (→)

**Acceptance Criteria (EARS):**

- AC1: The page shall render three clickable template cards: Minimal, Bold, and Dark, each showing a mini preview of the template style (457×123px, rx=23.5).
- AC2: When a template card is selected, the system shall update the live preview immediately with no separate "apply" action (REQ-6.7.1).
- AC3: The Desktop/Mobile toggle shall change only the preview viewport, never the saved template choice (REQ-6.7.2).
- AC4: The selected template shall be persisted to the waitlist record via `PATCH /api/waitlist` as one of minimal, bold, dark (REQ-6.7.3).
- AC5: The "Next" button (arrow-only →) shall be disabled until a template is selected.
- AC6: On form submission, the system shall PATCH the waitlist record with the selected template and navigate to `/onboarding/3`. While the API call is in progress, the form shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC7: The selected template card shall have a 2px accent border (`#0F7A5E`). Unselected cards shall have a 1px `#CCC9C3` border.
- AC8: Each template card shall have a mini preview (136.83×94.73px, rx=15.79) showing a representative rendering of the template style.
- AC9: Lint and build shall pass with zero errors.

**Tasks:**

- T1 (AC1, AC7-AC8) Build template card selector UI with exact dimensions
- T2 (AC2-AC3) Wire template selection to live preview
- T3 (AC4-AC6) Submit handler + PATCH + navigation
- T4 (AC9) Run lint + build

**Out of scope:** Template customization (Step 3), CTA text, brand color.

**Dev Notes:**

- T1: Three cards stacked vertically. Each card: 457×123px, rx=23.5, white background. Mini preview on left (136.83×94.73px, rx=15.79, stroke `#CCC9C3`), template name + description on right. Selected state: 2px accent border (`#0F7A5E`). Unselected: 1px `#CCC9C3` border. **Status: not started — `src/app/onboarding/2/page.tsx` is a bare placeholder.**
- T2: On click, call `updateField('template', 'minimal' | 'bold' | 'dark')` from context. The right pane LivePreview updates immediately. **Status: not started — depends on context (Story 4.0 T2) and LivePreview wiring (Story 4.0 T3).**
- T3: PATCH to `/api/waitlist` with `{ id: waitlistId, template: selectedTemplate }`. Navigate with `router.push('/onboarding/3')`. **Status: not started — API route does not exist yet (Story 4.0 T1).**
- T4: Files: `src/app/onboarding/2/page.tsx`. **Available components:** `Card` ✓.

---

### Story 4.3 — Step 3 — Make It Yours

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/HF 6 onboard step 3.svg`
**Story:** As the founder, I want to customize my waitlist's branding — logo, colors, and milestone rewards — so it feels like my own product.

**Design Specs (from analysis):**

- **Layout:** Two-pane (566px left + LivePreview right)
- **Progress dots:** 3 filled `#0F7A5E` (completed + current), 2 grey `#C3C2C2`
- **Page height:** 1312px (scrollable — longer than other steps)
- **Form fields:** Stacked vertically, same dimensions as Step 1
- **Brand Color:** Text input + color swatch preview, default `#0F7A5E`
- **Logo Upload:** Dashed border variant (`stroke-dasharray="3.34 3.34"`)
- **CTA Text:** Default "Join Waitlist"
- **Meta Preview:** White card with dashed border (rx=12.11, stroke `#CCC9C3`)
- **Milestone Rewards:** Toggle OFF = completely hidden; Toggle ON = 3 input fields
- **Submit button:** 458×59px, rx=9.59, `#0F7A5E` fill, arrow-only (→)

**Acceptance Criteria (EARS):**

- AC1: The page shall render fields for: Headline (pre-filled from Step 1), Subheadline (pre-filled), Brand Color (hex input with color swatch preview, default #0F7A5E), Logo Upload (file input with dashed border), and CTA Text (text input, default "Join Waitlist").
- AC2: The brand-color field shall validate as a well-formed hex value before it can be saved; default value is #0F7A5E (REQ-6.8.5). Validate on blur, not every keystroke.
- AC3: The system shall accept logo uploads in PNG or SVG only, up to 2MB, stored in Supabase Storage (REQ-6.8.4). The upload area shall have a dashed border style.
- AC4: The Meta Preview panel (og:title/og:description preview) shall update live from Headline/Sub-headline/brand-color (REQ-6.8.1). The panel shall be a white card with dashed border (rx=12.11).
- AC5: While the milestone-rewards toggle is OFF, the system shall render no reward-tier configuration UI at all, not even collapsed (REQ-6.8.2).
- AC6: When the milestone-rewards toggle is switched ON, the system shall reveal exactly 3 reward tiers (refer-3 / refer-10 / refer-25), each with an editable label (REQ-6.8.3).
- AC7: On form submission, the system shall PATCH the waitlist record with all Step 3 fields and navigate to `/onboarding/4`. While the API call is in progress, the form shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC8: The submit button shall display an arrow icon only (→), no text label.
- AC9: Lint and build shall pass with zero errors.

**Tasks:**

- T1 (AC1-AC2) Build Step 3 form UI with brand color validation
- T2 (AC3) Implement logo upload to Supabase Storage
- T3 (AC4) Wire meta preview to live preview
- T4 (AC5-AC6) Implement milestone rewards toggle + 3-tier config
- T5 (AC7) Submit handler + loading state + PATCH + navigation
- T6 (AC8) Build arrow-only submit button
- T7 (AC9) Run lint + build

**Out of scope:** Real image optimization (logo uses `unoptimized` prop per Epic 1.6 decision), email setup (Step 5).

**Dev Notes:**

- T1: Use `Input` for headline/subheadline/brand-color/cta-text. Brand color input: text input with a small color swatch preview beside it. Validate with regex `/^#[0-9A-Fa-f]{6}$/` on blur (not every keystroke — UX best practice). **Status: not started — `src/app/onboarding/3/page.tsx` is a bare placeholder.**
- T2: Use Supabase Storage client (`supabase.storage.from('logos').upload(path, file)`). Path: `logos/{waitlistId}/{filename}`. After upload, get the public URL and store in context as `logoUrl`. Show upload progress and file name after selection. The upload area should have a dashed border style (matching design). **Status: not started — no Supabase Storage bucket created yet (manual setup required in Supabase Dashboard).**
- T3: The meta preview can be a simple `<div>` showing how the og:title/og:description would look, updating live from context fields. Style as white card with dashed border (rx=12.11, stroke `#CCC9C3`). **Status: not started.**
- T4: Toggle component from `components/ui/toggle.tsx`. When ON, show 3 Input fields with default labels "Refer 3 friends", "Refer 10 friends", "Refer 25 friends". When OFF: completely hidden, not collapsed. **Status: not started.** Component exists: `Toggle` ✓.
- T5: PATCH to `/api/waitlist` with all fields. Navigate with `router.push('/onboarding/4')`. **Status: not started — API route does not exist yet (Story 4.0 T1).**
- T6: The submit button should be 458×59px, rx=9.59, `#0F7A5E` fill, `#FAF8F4` text, containing only the arrow icon "→". **Status: not started.**
- T7: Files: `src/app/onboarding/3/page.tsx`. **Available components:** `Input` ✓, `Toggle` ✓.

---

### Story 4.4 — Step 4 — Qualification Decision (Centered Layout)

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/HF 6 onboard step 4.svg`, `docs/design/High-fidelity-svgs/HF 4 onboard step 4 pt 1.svg`
**Story:** As the founder, I want to decide whether to add qualification questions to my waitlist so I can filter for serious signups.

**Design Specs (from analysis):**

- **Layout:** Centered (full-width, NO right pane) — different from Steps 1–3!
- **Progress dots:** 4 filled `#0F7A5E` (completed + current), 1 grey `#C3C2C2`
- **Two cards side by side:** Each ~430×207px, rx=8
- **"Yes, add questions" card (left):** Border `#0F7A5E` 2px when selected, green shield icon
- **"No, keep it simple" card (right):** Border `#CCC9C3` when unselected, grey icon
- **Submit button:** 458×59px, rx=9.59, `#0F7A5E` fill, arrow-only (→)
- **No back link visible in design** (centered layout)

**Acceptance Criteria (EARS):**

- AC1: The page shall render in centered layout (no right pane, full-width) — matching the design spec for Step 4.
- AC2: The page shall render two clickable cards: "Yes, add questions" and "No, keep it simple", each ~430×207px, rx=8.
- AC3: The "No, keep it simple" card shall describe the base signup form as "Just email. Add questions later from settings." — never "name + email" (REQ-6.9.1, Standing Decision 1).
- AC4: When "Yes, add questions" is chosen, the system shall navigate to `/onboarding/4a` (REQ-6.9.2).
- AC5: When "No, keep it simple" is chosen, the system shall set `qualification_enabled = false` on the waitlist record and navigate directly to `/onboarding/5` (REQ-6.9.3).
- AC6: The system shall PATCH the waitlist record with the qualification decision before navigating. While the API call is in progress, the cards shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC7: The selected card shall have a 2px accent border (`#0F7A5E`). The unselected card shall have a 1px `#CCC9C3` border.
- AC8: The submit button shall display an arrow icon only (→), no text label.
- AC9: Lint and build shall pass with zero errors.

**Tasks:**

- T1 (AC1-AC2, AC7) Build two-card choice UI in centered layout
- T2 (AC3) Verify card copy matches REQ-6.9.1 exactly
- T3 (AC4-AC6) Implement navigation logic + PATCH
- T4 (AC8) Build arrow-only submit button
- T5 (AC9) Run lint + build

**Out of scope:** Question configuration (Step 4a), email setup (Step 5).

**Dev Notes:**

- T1: This step uses a **centered layout**, not the two-pane layout from Steps 1–3. The onboarding layout switching (Story 4.0 T3) handles this. Two `Card` components side by side. Each is clickable (button or link styled as card). Selected state: 2px accent border (`#0F7A5E`). Card dimensions: ~430×207px, rx=8. **Status: not started — `src/app/onboarding/4/page.tsx` is a bare placeholder.** Component exists: `Card` ✓.
- T2: Copy must match REQ-6.9.1 exactly — do not paraphrase. "No, keep it simple" card text: "Just email. Add questions later from settings." **Status: not started.**
- T3: "Yes" → `updateField('qualificationEnabled', true)`, PATCH, `router.push('/onboarding/4a')`. "No" → `updateField('qualificationEnabled', false)`, PATCH with `{ qualification_enabled: false }`, `router.push('/onboarding/5')`. **Status: not started — API route does not exist yet (Story 4.0 T1); depends on context (Story 4.0 T2).**
- T4: The submit button should be 458×59px, rx=9.59, `#0F7A5E` fill, `#FAF8F4` text, containing only the arrow icon "→". **Status: not started.**
- T5: Files: `src/app/onboarding/4/page.tsx`.

---

### Story 4.5 — Step 4a — Configure Qualification Questions

**Status:** done
**Design Refs:** — (derived from Step 4 SVGs, centered layout)
**Story:** As the founder, I want to configure up to 2 qualification questions (Free tier) so I can learn about my waitlist signups before they join.

**Design Specs (from analysis):**

- **Layout:** Centered (full-width, NO right pane) — same as Step 4
- **Progress dots:** 4 filled `#0F7A5E` (same as Step 4 — Step 4a is sub-step)
- **Dynamic form:** Add, edit, remove questions
- **Submit button:** 458×59px, rx=9.59, `#0F7A5E` fill, arrow-only (→)

**Acceptance Criteria (EARS):**

- AC1: The page shall render in centered layout (no right pane, full-width).
- AC2: The page shall render a dynamic form where the founder can add, edit, and remove qualification questions.
- AC3: While the founder's tier is Free, the system shall enforce a hard cap of 2 questions and shall render the "Add new question" affordance as an upsell, not a functioning control, past that cap (REQ-6.10.1).
- AC4: The Pro cap shall be 5; the Growth cap shall be unlimited — read from the founder's tier field, not hardcoded per-screen (REQ-6.10.2).
- AC5: Each question shall have a text input for the question text and a toggle for "Required" vs "Optional".
- AC6: The example question text "What are you currently using?" shall be used verbatim as placeholder/helper text; no rephrased variant shall ship (REQ-6.10.3).
- AC7: The live preview shall show each question with "(optional)" in the design system's secondary text color for optional questions (REQ-6.10.4).
- AC8: On form submission, the system shall PATCH the waitlist record with the questions array and navigate to `/onboarding/5`. While the API call is in progress, the form shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC9: The submit button shall display an arrow icon only (→), no text label.
- AC10: Lint and build shall pass with zero errors.

**Tasks:**

- T1 (AC1-AC2, AC5) Build dynamic question form in centered layout
- T2 (AC3-AC4) Implement tier-based cap logic
- T3 (AC6) Add example question placeholder
- T4 (AC7) Wire questions to live preview
- T5 (AC8) Submit handler + PATCH + navigation
- T6 (AC9) Build arrow-only submit button
- T7 (AC10) Run lint + build

**Out of scope:** Question response collection (Sprint 2), question reordering/drag-and-drop.

**Dev Notes:**

- T1: This step uses a **centered layout**, same as Step 4. Each question row: Input (question text) + Toggle (required/optional) + Remove button. "Add question" button at bottom. **Status: not started — `src/app/onboarding/4a/page.tsx` is a bare placeholder.** Components exist: `Input` ✓, `Toggle` ✓, `Badge` ✓.
- T2: Read `tier` from context (default "free"). `maxQuestions = tier === 'free' ? 2 : tier === 'pro' ? 5 : Infinity`. When at cap, render the "Add question" button as disabled with a "Upgrade to Pro" badge (reuse `Badge` component). **Status: not started — depends on context (Story 4.0 T2).**
- T3: Use "What are you currently using?" as the placeholder text in the question input field. **Status: not started.**
- T4: The live preview in the right pane shows each question with its text and "(optional)" suffix for optional ones. Use `text-muted-foreground` for the "(optional)" text. **Status: not started — depends on LivePreview wiring (Story 4.0 T3).**
- T5: PATCH to `/api/waitlist` with `{ questions: [... ] }`. Navigate with `router.push('/onboarding/5')`. **Status: not started — API route does not exist yet (Story 4.0 T1).**
- T6: The submit button should be 458×59px, rx=9.59, `#0F7A5E` fill, `#FAF8F4` text, containing only the arrow icon "→". **Status: not started.**
- T7: Files: `src/app/onboarding/4a/page.tsx`.

---

### Story 4.6 — Step 5 — Email Setup + Launch (Centered Layout)

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-svgs/HF 6 onboard step 5.svg`, `docs/design/High-fidelity-svgs/HF 6 onboard step 5 Pro Tier.svg`
**Story:** As the founder, I want to configure my confirmation email and launch my waitlist so signups can start arriving.

**Design Specs (from analysis):**

- **Layout:** Centered (full-width, NO right pane) — same as Steps 4/4a
- **Progress dots:** 5 filled `#0F7A5E` (all completed + current)
- **Free tier:** Sender name/Subject/Message body disabled with "Pro" badge
- **Pro tier:** Editable fields + "Send from your own domain" collapsed panel
- **Launch button:** 644×59px (wider than other steps!), rx=9.59, `#0F7A5E` fill
- **Button text:** "Launch my waitlist" + arrow icon (→)
- **No back link visible in design** (centered layout)

**Acceptance Criteria (EARS):**

- AC1: The page shall render in centered layout (no right pane, full-width).
- AC2: While the founder's tier is Free, the system shall render the confirmation-email fields as locked/greyed with a Pro badge, and shall render "Upgrade to Pro to customise" as the only actionable email-related control (REQ-6.11.1).
- AC3: While the founder's tier is Pro, the system shall render editable Sender name / Subject / Message body fields and the collapsed-by-default "Send from your own domain" panel (REQ-6.11.2).
- AC4: The Pro-tier SPF/DKIM panel UI is Sprint 1 scope; the backend verification logic is Sprint 3 scope. In Sprint 1, "Verify my domain setup" shall be wired to a stubbed response and shall never block "Launch my waitlist" (REQ-6.11.3).
- AC5: The page shall display a summary of the waitlist configuration (name, template, questions count) before launch.
- AC6: When "Launch my waitlist" is clicked and no subdomain was ever finalized (i.e., "I'll name it later" was used), the system shall auto-assign the fallback slug rather than blocking the action (REQ-6.11.4).
- AC7: On launch, the system shall PATCH the waitlist record with `status = 'live'` and navigate to `/onboarding/success`. While the API call is in progress, the form shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC8: The live URL shall be displayed on the success screen as `{slug}.mywaitlist.com`.
- AC9: The launch button shall be 644×59px (wider than other steps), displaying "Launch my waitlist" text + arrow icon (→).
- AC10: Lint and build shall pass with zero errors.

**Tasks:**

- T1 (AC1-AC3) Build email setup form (Free + Pro tiers) in centered layout
- T2 (AC4) Stub SPF/DKIM verification panel
- T3 (AC5-AC6) Build launch summary + fallback slug logic
- T4 (AC7-AC8) Launch handler + PATCH + navigation
- T5 (AC9) Build wider launch button with text + arrow
- T6 (AC10) Run lint + build

**Out of scope:** Real email sending (Sprint 2), real SPF/DKIM verification (Sprint 3), Resend integration.

**Dev Notes:**

- T1: This step uses a **centered layout**, same as Steps 4/4a. Free tier: show Sender name/Subject/Message body as disabled inputs with a `Badge` component showing "Pro". Add "Upgrade to Pro to customise" as a disabled-looking CTA. Pro tier: same fields but editable. "Send from your own domain" is a `Card` with a collapsed panel (use `useState` for open/close). **Status: not started — `src/app/onboarding/5/page.tsx` is a bare placeholder.** Components exist: `Input` ✓, `Badge` ✓, `Card` ✓.
- T2: The "Verify my domain setup" button calls a stubbed API route that always returns `{ verified: false, message: 'Verification will be available in a future update' }`. Do not build the real verification logic. **Status: not started — no stubbed API route exists.**
- T3: Show a summary card: waitlist name, template, questions count. The "Launch" button is always enabled (never blocked by slug or email config). If slug is missing (from "I'll name it later"), auto-assign the fallback slug. **Status: not started — depends on context (Story 4.0 T2).**
- T4: PATCH to `/api/waitlist` with `{ status: 'live', ...emailFields }`. Then `router.push('/onboarding/success')`. **Status: not started — API route does not exist yet (Story 4.0 T1).**
- T5: The launch button should be 644×59px (wider than other steps' 458px buttons), rx=9.59, `#0F7A5E` fill, `#FAF8F4` text, containing "Launch my waitlist" text + arrow icon "→". **Status: not started.**
- T6: Files: `src/app/onboarding/5/page.tsx`.

---

### Story 4.7 — Success Screen (Centered Layout, No Progress Dots)

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-svgs/Onboard Success Page Founder.svg`
**Story:** As the founder, I want a success screen that shows my live URL and lets me share it so I can start getting signups immediately.

**Design Specs (from analysis):**

- **Layout:** Centered (full-width, NO right pane)
- **Progress dots:** None — terminal state, no progress indicator
- **Success checkmark:** Large green circle (64px radius) with white checkmark
- **Success heading:** "Your waitlist is live!"
- **Live URL:** Displayed prominently
- **Share/Copy buttons:** Side by side, equal visual weight (both secondary/outline)
- **Dashboard link:** "Or, go to my dashboard" below share buttons
- **Divider:** `#CCC9C3` at y=619
- **Powered by footer:** Below divider, centered, 24px vertical padding

**Acceptance Criteria (EARS):**

- AC1: The page shall render in centered layout (no right pane, full-width).
- AC2: The page shall display a success message ("Your waitlist is live!") and the live URL (`{slug}.mywaitlist.com`).
- AC3: The page shall display a large green checkmark icon (64px circle, `#0F7A5E` fill) above the success heading.
- AC4: The Share button shall render only where `navigator.share` is supported; Copy Link shall always render, at equal visual weight, never as a fallback-only control (REQ-6.12.1).
- AC5: The Share/Copy functionality shall use the shared `ShareCopyLink` component from `components/share/share-copy-link.tsx`.
- AC6: "Or, go to my dashboard" shall navigate to `/dashboard` (REQ-6.12.2).
- AC7: The "Powered by MyWaitlist" footer shall render below a divider line for Free tier only, using the shared `PoweredByFooter` component.
- AC8: The progress dots shall NOT be rendered on the success screen — it is a terminal state.
- AC9: Lint and build shall pass with zero errors.

**Tasks:**

- T1 (AC1-AC3) Build success screen UI with checkmark
- T2 (AC4-AC5) Integrate ShareCopyLink component
- T3 (AC6) Add dashboard link
- T4 (AC7) Integrate PoweredByFooter
- T5 (AC8) Verify progress dots are hidden
- T6 (AC9) Run lint + build

**Out of scope:** Subscriber-facing public page (Sprint 2), referral link generation (Sprint 2).

**Dev Notes:**

- T1: Centered layout with a large checkmark icon (64px circle, `#0F7A5E` fill, white checkmark), success heading ("Your waitlist is live!"), and the live URL displayed prominently. Use design tokens from globals.css. **Status: not started — `src/app/onboarding/success/page.tsx` is a bare placeholder.**
- T2: Import `ShareCopyLink` from `components/share/share-copy-link.tsx`. Pass the live URL as the copy value. The two buttons (Share + Copy Link) should be at equal visual weight — both secondary/outline style, side by side. **Status: not started.** Component exists: `ShareCopyLink` ✓.
- T3: A simple `<Link>` styled with accent color, below the Share/Copy controls. Text: "Or, go to my dashboard". **Status: not started.**
- T4: Import `PoweredByFooter` from `components/share/powered-by-footer.tsx`. Render below a divider line (`#CCC9C3`) with 24px vertical padding. Only for Free tier. **Status: not started.** Component exists: `PoweredByFooter` ✓.
- T5: The success screen route (`/onboarding/success`) should hide progress dots entirely. This is handled by Story 4.0 T6 (layout switching). **Status: not started — depends on Story 4.0 T6.**
- T6: Files: `src/app/onboarding/success/page.tsx`.

---

## Story Dependency Graph

```
Story 4.0 (API + Context + Layout)
  ├── Story 4.1 (Step 1)
  ├── Story 4.2 (Step 2)
  ├── Story 4.3 (Step 3) ← also depends on 4.1
  ├── Story 4.4 (Step 4)
  │   └── Story 4.5 (Step 4a) ← also depends on 4.4
  ├── Story 4.6 (Step 5)
  └── Story 4.7 (Success)
```

## Implementation Order

1. **Story 4.0** — API routes, context, layout switching, progress dots, sticky CTA
2. **Story 4.1** — Step 1 form (two-pane)
3. **Story 4.2** — Step 2 template selector (two-pane)
4. **Story 4.3** — Step 3 branding (two-pane)
5. **Story 4.4** — Step 4 qualification decision (centered)
6. **Story 4.5** — Step 4a question builder (centered)
7. **Story 4.6** — Step 5 email setup + launch (centered)
8. **Story 4.7** — Success screen (centered, no dots)

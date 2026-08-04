# Epic 4 — Onboarding Wizard

**Status:** done
**Source:** [PRD S6.6 Onboarding Step 1](../PRD-Sprint-1.md#66-onboarding-step-1--name-your-waitlist-f-c1), [PRD S6.7 Onboarding Step 2](../PRD-Sprint-1.md#67-onboarding-step-2--choose-a-template-f-c2), [PRD S6.8 Onboarding Step 3](../PRD-Sprint-1.md#68-onboarding-step-3--make-it-yours-f-c3), [PRD S6.9 Onboarding Step 4](../PRD-Sprint-1.md#69-onboarding-step-4--qualification-decision-f-c4), [PRD S6.10 Onboarding Step 4a](../PRD-Sprint-1.md#610-onboarding-step-4a--configure-qualification-questions-f-c4a), [PRD S6.11 Onboarding Step 5](../PRD-Sprint-1.md#611-onboarding-step-5--email-setup-f-c5), [PRD S6.12 Success Screen](../PRD-Sprint-1.md#612-success-screen-f-c6), [PRD S6.12a Powered-By Footer](../PRD-Sprint-1.md#612a-powered-by-prewaitlist-footer--onboarding-preview--public-pages)

## Design Analysis Reference

Full analysis: `docs/design/design-analysis.md` — all 10 SVGs analyzed, PRD cross-referenced, web research complete. 98% confidence.

### Cross-Screen Design Patterns

| Pattern            | Design Evidence                                                                                                                         | Epic Alignment                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Layout**         | Steps 1–3 = two-pane (566px left + browser mockup). Step 4a = two-pane (per HF design). Steps 4, 5, Success = centered (no right pane). | Story 4.0 must handle layout switching.             |
| **Buttons**        | Steps 1–4 = arrow-only (→). Step 5 = text+arrow ("Launch my waitlist" + →), 644px wide.                                                 | All stories must use correct button pattern.        |
| **Progress dots**  | 5 dots, 10px diameter, ~16.7px center-to-center. Same color (`#0F7A5E`) for completed AND current.                                      | Story 4.0 AC10 updated — no checkmarks, same color. |
| **Template cards** | 457×123px, rx=23.5, 2px accent border for selected state.                                                                               | Story 4.2 updated with exact dimensions.            |
| **Form inputs**    | 60.33px height, 12.164px border-radius, `#CCC9C3` 1.67px border.                                                                        | All stories use consistent input styling.           |
| **Success screen** | No progress dots, centered, share/copy at equal visual weight.                                                                          | Story 4.7 updated — terminal state.                 |

### Layout Distribution

| Step    | Layout Type           | Right Pane  | Progress Dots | Back Link                       |
| ------- | --------------------- | ----------- | ------------- | ------------------------------- |
| Step 1  | Two-pane (566px)      | LivePreview | 1 filled      | None                            |
| Step 2  | Two-pane (566px)      | LivePreview | 2 filled      | /onboarding/1                   |
| Step 3  | Two-pane (566px)      | LivePreview | 3 filled      | /onboarding/2                   |
| Step 4  | Centered (full-width) | None        | 4 filled      | /onboarding/3                   |
| Step 4a | Two-pane (566px)      | LivePreview | 4 filled      | /onboarding/4                   |
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
| 6   | Layout switching — onboarding layout must support both two-pane (Steps 1–3, 4a) and centered (Steps 4, 5, Success)           | 4.0   | High     |
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

A founder can complete all onboarding steps — name their waitlist, choose a template, customize branding, decide on qualification, configure questions (if enabled), set up email, and launch — arriving at a success screen with a shareable subdomain URL. All form data persists to Supabase. The live preview renders correctly across Steps 1–3. Steps 4, 5, and Success use centered layout without preview. The success screen fits within the viewport without scrolling.

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

- T1: ✅ Done — `src/app/api/waitlist/route.ts` (POST + PATCH), `src/app/api/waitlist/check-slug/route.ts` (GET) created. `src/app/onboarding/context.tsx` created with all form state + `loading`/`setLoading`.
- T2: ✅ Done — Context created, provider wraps onboarding layout's `{children}`.
- T3: ✅ Done — Layout switching implemented: Steps 1–3/4a → `TwoPaneLayout` (with LivePreview). Steps 4/5/success → `CenteredLayout`. Step 4a added to `TWO_PANE_ROUTES`. `LivePreview` imported and rendered in right pane.
- T4: ✅ Done — Progress dots (7 dots) with `min-w-[44px] min-h-[44px]` touch targets. Filled accent dot for ≤ currentStep, grey for > currentStep. No checkmarks.
- T5: ✅ Done — Sticky CTA wrapper: `sticky bottom-0 bg-background px-14 pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0` applied.
- T6: ✅ Done — Success screen hides progress dots entirely.
- T7: ✅ Done — All files created and wired. Available components: all ✓.

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
- **Subdomain suffix:** `.prewaitlist.com` (read-only)

**Acceptance Criteria (EARS):**

- AC1: The page shall render a form with three fields: Headline (text input), Subheadline (textarea), and Subdomain (text input with suffix showing `.prewaitlist.com`).
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

- T1: ✅ Done — `src/app/onboarding/1/page.tsx` built with `Input`/`Textarea` from `components/ui/`. Subdomain shows `{candidateSlug}.prewaitlist.com` read-only suffix. Field dimensions: 60.33px height, 12.164px border-radius, `#CCC9C3` 1.67px border.
- T2: ✅ Done — Slug derivation: `value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 63)`. Debounced 300ms. Check-slug API returns `{ available: boolean }`. Green checkmark / "Available" or red error / "Already taken" shown inline.
- T3: ✅ Done — "I'll name it later" generates `crypto.randomUUID().slice(0, 8)` fallback. Helper text below: "We'll assign a random URL — you can change it later."
- T4: ✅ Done — POST to `/api/waitlist`, stores `waitlistId` in context, navigates to `/onboarding/2`. `setLoading(true)` before call, `setLoading(false)` after. Form disabled during loading.
- T5: ✅ Done — LivePreview reads `headline` and `subheadline` from context, updates reactively.
- T6: ✅ Done — Submit button 458×59px, rx=9.59, `#0F7A5E` fill, `#FAF8F4` text, arrow-only "→".
- T7: ✅ Done — Files: `src/app/onboarding/1/page.tsx`. Available components: `Input` ✓, `Textarea` ✓.

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

- T1: ✅ Done — `src/app/onboarding/2/page.tsx` built with 3 template cards (Minimal, Bold, Dark). Each 457×123px, rx=23.5. Mini preview on left, template name + description on right. Selected state: 2px accent border. Unselected: 1px `#CCC9C3` border.
- T2: ✅ Done — On click, `updateField('template', 'minimal' | 'bold' | 'dark')` updates context. Right pane LivePreview updates immediately. Desktop/Mobile toggle changes only viewport, not template choice.
- T3: ✅ Done — PATCH to `/api/waitlist` with `{ id: waitlistId, template: selectedTemplate }`. Navigate to `/onboarding/3`. Loading state disables form during API call.
- T4: ✅ Done — Files: `src/app/onboarding/2/page.tsx`. Available components: `Card` ✓.

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

- T1: ✅ Done — `src/app/onboarding/3/page.tsx` built with `Input` for headline/subheadline/brand-color/cta-text. Brand color input has text input + color swatch preview. Hex validation on blur.
- T2: ✅ Done — Logo upload uses Supabase Storage (`supabase.storage.from('logos').upload(path, file)`). Path: `logos/{waitlistId}/{filename}`. Public URL stored in context as `logoUrl`. Dashed border upload area. File limited to PNG/SVG, 2MB max.
- T3: ✅ Done — Meta preview (og:title/og:description) updates live from context fields. White card with dashed border (rx=12.11, stroke `#CCC9C3`).
- T4: ✅ Done — Milestone rewards toggle: OFF = completely hidden, ON = 3 input fields (refer-3, refer-10, refer-25) with editable labels. `milestone_rewards_enabled` persisted to `waitlists` table.
- T5: ✅ Done — PATCH to `/api/waitlist` with all Step 3 fields. Navigate to `/onboarding/4`. Loading state during API call.
- T6: ✅ Done — Submit button 458×59px, rx=9.59, `#0F7A5E` fill, `#FAF8F4` text, arrow-only "→".
- T7: ✅ Done — Files: `src/app/onboarding/3/page.tsx`. Available components: `Input` ✓, `Toggle` ✓.

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

- T1: ✅ Done — `src/app/onboarding/4/page.tsx` built with two-card choice UI in centered layout. Each card ~430×207px, rx=8. Selected: 2px accent border. Unselected: 1px `#CCC9C3` border.
- T2: ✅ Done — "No, keep it simple" card text matches REQ-6.9.1 exactly: "Just email. Add questions later from settings."
- T3: ✅ Done — "Yes" → `updateField('qualificationEnabled', true)`, PATCH, `router.push('/onboarding/4a')`. "No" → `updateField('qualificationEnabled', false)`, PATCH, `router.push('/onboarding/5')`. Defensive redirect guards added in Steps 2, 3, 4, 4a.
- T4: ✅ Done — Submit button 458×59px, rx=9.59, `#0F7A5E` fill, `#FAF8F4` text, arrow-only "→".
- T5: ✅ Done — Files: `src/app/onboarding/4/page.tsx`. Available components: `Card` ✓.

---

### Story 4.5 — Step 4a — Configure Qualification Questions

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/HF 4 onboard step 4 pt 1.svg`
**Story:** As the founder, I want to configure up to 2 qualification questions (Free tier) so I can learn about my waitlist signups before they join.

**Design Specs (from analysis):**

- **Layout:** Two-pane (566px left + LivePreview right) — per `HF 4 onboard step 4 pt 1.svg` two-pane layout
- **Progress dots:** 4 filled `#0F7A5E` (same as Step 4 — Step 4a is sub-step)
- **Left pane form:** Dynamic question cards stacked vertically (2 max on Free)
- **Question card fields:** Question text input + Required/Optional toggle + Delete button
- **Accent upgrade card:** When at cap, shown as upsell card (jade accent)
- **Submit button:** 458×59px, rx=9.59, `#0F7A5E` fill, arrow-only (→)
- **Live preview:** Always shows 2 question scaffolding slots (with default text), never more

**Acceptance Criteria (EARS):**

- AC1: The page shall render in two-pane layout with LivePreview in the right pane (matching `HF 4 onboard step 4 pt 1.svg`).
- AC2: The page shall render a dynamic form where the founder can add and edit qualification questions (no delete — cards have no trash icon).
- AC3: While the founder's tier is Free, the system shall enforce a hard cap of 2 questions and shall render an accent upgrade card as upsell, not a functioning control, past that cap (REQ-6.10.1).
- AC4: The Pro cap shall be 5; the Growth cap shall be unlimited — read from the founder's tier field, not hardcoded per-screen (REQ-6.10.2).
- AC5: Each question shall have a text input for the question text and a dropdown for "Multiple Choice" vs "Free Text" answer type.
- AC6: The example question text "What are you currently using?" shall be used verbatim as the first scaffolding default; no rephrased variant shall ship (REQ-6.10.3).
- AC7: The live preview shall show 2 question scaffolding slots with default text ("What are you currently using?" and "What is your role?"). As the founder types, the preview updates reactively. When empty, scaffolding text shows in muted gray — text stays muted even when user types.
- AC8: On form submission, the system shall PATCH the waitlist record with the questions array and navigate to `/onboarding/5`. While the API call is in progress, the form shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC9: The submit button shall display "Next" text with arrow icon (→).
- AC10: Lint and build shall pass with zero errors.

**Tasks:**

- T1 (AC1-AC2, AC5) Build dynamic question form in two-pane layout
- T2 (AC3-AC4) Implement tier-based cap logic + accent upgrade card
- T3 (AC6-AC7) Wire questions to live preview with scaffolding defaults
- T4 (AC8) Submit handler + PATCH + navigation
- T5 (AC9) Build submit button with text + arrow
- T6 (AC10) Run lint + build

**Out of scope:** Question response collection (Sprint 2), question reordering/drag-and-drop.

**Dev Notes:**

- T1: ✅ Done — `src/app/onboarding/4a/page.tsx` built as two-pane layout. Question cards: Input (question text) + select (answer type) only — no delete button. "Add question" button at bottom. Card styling matches design: white card, rounded, `#CCC9C3` border.
- T2: ✅ Done — `maxQuestions = tier === 'free' ? 2 : tier === 'pro' ? 5 : Infinity`. When at cap, accent upgrade card (jade `#0F7A5E` background) shown as upsell — not a functioning add button. `Badge` component used for tier indicator.
- T3: ✅ Done — LivePreview always shows 2 question scaffolding slots. Default text: Q1="What are you currently using?", Q2="What is your role?". `useEffect` in 4a/page.tsx syncs local questions state to context on every change. Question text color always muted gray — never switches to dark even when user types.
- T4: ✅ Done — PATCH to `/api/waitlist` with `{ questions: [... ] }`. Navigate to `/onboarding/5`. Loading state during API call.
- T5: ✅ Done — Submit button with "Next →" text and arrow icon.
- T6: ✅ Done — Files: `src/app/onboarding/4a/page.tsx`. Available components: `Input` ✓, `Toggle` ✓, `Badge` ✓.

---

### Story 4.6 — Step 5 — Email Setup + Launch (Centered Layout)

**Status:** done
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
- AC2: While the founder's tier is Free, the system shall render an email preview card showing "From: [Your name]" (with PRO badge), "Subject: [Customise on Pro]" (with lock icon), grey skeleton placeholder lines, and an "Upgrade to Pro to customise →" button inside the card (REQ-6.11.1).
- AC3: While the founder's tier is Pro, the system shall render editable Sender name / Subject / Message body fields and the collapsed-by-default "Send from your own domain (recommended)" panel with subtext "Improves deliverability. Takes 2 minutes." (REQ-6.11.2).
- AC4: The Pro-tier SPF/DKIM panel UI is Sprint 1 scope; the backend verification logic is Sprint 3 scope. In Sprint 1, "Verify my domain setup" shall be wired to a stubbed response and shall never block "Launch my waitlist" (REQ-6.11.3). The expanded panel shall show SPF record and DKIM CNAME fields with Copy buttons, a "Verify my domain setup" button, a "Skip for now — send from [tool]'s domain" link, and an info box explaining why custom domains matter.
- AC5: When "Launch my waitlist" is clicked and no subdomain was ever finalized (i.e., "I'll name it later" was used), the system shall auto-assign the fallback slug rather than blocking the action (REQ-6.11.4).
- AC6: On launch, the system shall PATCH the waitlist record with `status = 'live'` and navigate to `/onboarding/success`. While the API call is in progress, the form shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC7: The live URL shall be displayed on the success screen as `{slug}.prewaitlist.com`.
- AC8: The launch button shall be 644×59px (wider than other steps), displaying "Launch my waitlist" text + arrow icon (→).
- AC9: Lint and build shall pass with zero errors.

**Tasks:**

- T1 (AC1-AC3) Build email setup UI (Free preview card + Pro editable fields) in centered layout
- T2 (AC4) Build domain panel with SPF/DKIM fields, verify button, skip link, info box
- T3 (AC5-AC6) Launch handler + fallback slug logic + PATCH + navigation
- T4 (AC7) Build launch button with text + arrow
- T5 (AC8) Build wider launch button with text + arrow
- T6 (AC10) Run lint + build

**Out of scope:** Real email sending (Sprint 2), real SPF/DKIM verification (Sprint 3), Resend integration.

**Dev Notes:**

- T1: ✅ Done (rebuilt) — `src/app/onboarding/5/page.tsx` with centered layout. Heading: "Your subscribers get a confirmation email" / "it includes their position and referral link automatically". **Free tier:** Preview card showing "From: [Your name]" (PRO badge), "Subject: [Customise on Pro]" (lock icon), 3 grey skeleton bars, "Upgrade to Pro to customise →" button inside card. Helper text below card. **Pro tier:** Editable Sender name / Email subject / Message body fields. Collapsible "Send from your own domain (recommended)" panel with subtext "Improves deliverability. Takes 2 minutes." Expanded state shows SPF record + DKIM CNAME with Copy buttons, "Verify my domain setup" button, "Skip for now — send from PreWaitlist's domain" link, info box.
- T2: ✅ Done — `src/app/api/waitlist/verify-domain/route.ts` created. Returns `{ verified: false, message: "Verification will be available in a future update" }`. Never blocks launch.
- T3: ✅ Done — Launch button always enabled. If slug is missing, auto-assigns fallback via `crypto.randomUUID().slice(0, 8)`.
- T4: ✅ Done — PATCH to `/api/waitlist` with `{ status: 'live', email_sender_name, email_subject, email_body }`. Navigates to `/onboarding/success`. Loading state during API call.
- T5: ✅ Done — Launch button styled with `md:w-161` (644px), "Launch my waitlist" text + arrow icon.
- T6: ✅ Done — Lint + build pass. Files: `src/app/onboarding/5/page.tsx`, `src/app/api/waitlist/verify-domain/route.ts`. Available components: `Input` ✓, `Textarea` ✓.

---

### Story 4.7 — Success Screen (Centered Layout, No Progress Dots)

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/Onboard Success Page Founder.svg`
**Story:** As the founder, I want a success screen that shows my live URL and lets me share it so I can start getting signups immediately.

**Design Specs (from analysis):**

- **Layout:** Centered (full-width, NO right pane)
- **Progress dots:** None — terminal state, no progress indicator
- **Success checkmark:** Large green circle (64px diameter) with white checkmark, `#0F7A5E` fill
- **Success heading:** "Your waitlist is live!"
- **Preview section:** LivePreview component (BrowserFrame with template) + URL/title/subheadline below
- **URL + copy link pill:** Inline — URL as plain text + pill-shaped copy button with clipboard icon
- **Share card:** Transparent border card containing:
  - Header: "Share it now while the momentum is fresh"
  - Dashed inner card: white fill, dashed stroke, "Suggested caption" label + dynamic quote
  - Share button: green filled (`#0F7A5E`), ~43% width
  - Copy link button: outlined (`#1C1917` stroke), ~43% width
- **Divider:** `#CCC9C3` spanning card width
- **"What will happen next?":** Section title + 3 numbered items
- **Dashboard link:** "Or, go to my dashboard →" with green text + arrow icon
- **Powered by footer:** Below dashboard link, Free tier only

**Acceptance Criteria (EARS):**

- AC1: The page shall render in centered layout (no right pane, full-width).
- AC2: The page shall display a success message ("Your waitlist is live!") above a LivePreview component showing the waitlist template.
- AC3: The page shall display a large green checkmark icon (64px circle, `#0F7A5E` fill) above the success heading.
- AC4: The page shall display the live URL inline with a pill-shaped copy link button containing a clipboard icon.
- AC5: The page shall render a share card with: header text ("Share it now while the momentum is fresh"), a dashed inner card with "Suggested caption" and dynamic quote, a green filled Share button, and an outlined Copy link button side-by-side.
- AC6: "Or, go to my dashboard →" shall navigate to `/dashboard` with green text and arrow icon (REQ-6.12.2).
- AC7: The "Powered by PreWaitlist" footer shall render below the dashboard link for Free tier only, using the shared `PoweredByFooter` component.
- AC8: The progress dots shall NOT be rendered on the success screen — it is a terminal state.
- AC9: The page shall display a "What will happen next?" section with 3 numbered items below a divider.
- AC10: Lint and build shall pass with zero errors.

**Tasks:**

- T1 (AC1-AC3) Build success screen UI with checkmark + heading
- T2 (AC2) Integrate LivePreview component as link preview
- T3 (AC4) Build inline URL + copy link pill with clipboard icon
- T4 (AC5) Build share card with suggested caption, Share/Copy buttons
- T5 (AC6-AC7) Add dashboard link with arrow + PoweredByFooter
- T6 (AC8-AC9) Verify progress dots hidden + add "What will happen next?" section
- T7 (AC10) Run lint + build

**Out of scope:** Subscriber-facing public page (Sprint 2), referral link generation (Sprint 2).

**Dev Notes:**

- T1: ✅ Done (rebuilt) — `src/app/onboarding/success/page.tsx` centered layout. Green checkmark (h-16 w-16 rounded-full bg-accent). "Your waitlist is live!" heading (text-h1).
- T2: ✅ Done (rebuilt) — `MetaPreview` component extracted to `components/onboarding/meta-preview.tsx` (shared between Step 3 and success). Shows BrowserFrame with dots, headline, subheadline, email+CTA, URL/title/subheadline. No LivePreview on success screen.
- T3: ✅ Done (rebuilt) — Inline URL text + pill-shaped copy button (no icon). Copies `https://{liveUrl}` to clipboard. Shows "Copied!" feedback for 2 seconds.
- T4: ✅ Done (rebuilt) — Share card with transparent border, header text, MetaPreview inside. Green filled Share button + outlined Copy link button side-by-side. No dashed inner card, no "Suggested caption".
- T5: ✅ Done (rebuilt) — "Or, go to my dashboard →" with green text (text-accent, !font-semibold) + arrow SVG icon. No PoweredByFooter (removed per design).
- T6: ✅ Done — Progress dots hidden via `isSuccess` check in layout.tsx. "What will happen next?" section with 3 centered numbered items added.
- T7: ✅ Done — Viewport-fit: `min-h-dvh` + `-mt-14` (cancels layout padding) + reduced margins + `overflow-hidden`. All content fits without scrolling. Lint + build pass.

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
6. **Story 4.5** — Step 4a question builder (two-pane with LivePreview)
7. **Story 4.6** — Step 5 email setup + launch (centered)
8. **Story 4.7** — Success screen (centered, no dots)

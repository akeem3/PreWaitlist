# Epic 4 — Onboarding Wizard

**Status:** ready
**Source:** [PRD S6.6 Onboarding Step 1](../PRD-Sprint-1.md#66-onboarding-step-1--name-your-waitlist-f-c1), [PRD S6.7 Onboarding Step 2](../PRD-Sprint-1.md#67-onboarding-step-2--choose-a-template-f-c2), [PRD S6.8 Onboarding Step 3](../PRD-Sprint-1.md#68-onboarding-step-3--make-it-yours-f-c3), [PRD S6.9 Onboarding Step 4](../PRD-Sprint-1.md#69-onboarding-step-4--qualification-decision-f-c4), [PRD S6.10 Onboarding Step 4a](../PRD-Sprint-1.md#610-onboarding-step-4a--configure-qualification-questions-f-c4a), [PRD S6.11 Onboarding Step 5](../PRD-Sprint-1.md#611-onboarding-step-5--email-setup-f-c5), [PRD S6.12 Success Screen](../PRD-Sprint-1.md#612-success-screen-f-c6), [PRD S6.12a Powered-By Footer](../PRD-Sprint-1.md#612a-powered-by-mywaitlist-footer--onboarding-preview--public-pages)

## UI/UX Stress Test Recommendations (applied to stories below)

Source: Pre-implementation stress test against NNGroup 2024, Apple HIG, Material Design 3, WCAG 2.5.8. These are folded into the relevant story ACs and Dev Notes.

| #   | Recommendation                                                                                                              | Story | Priority |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ----- | -------- |
| 1   | Sticky mobile CTA — submit buttons stay visible on long forms (Steps 3, 4a, 5) via `sticky bottom-0 md:static` wrapper      | 4.0   | High     |
| 2   | Progress dots completed state — show checkmark or filled accent dot for steps already submitted                             | 4.0   | High     |
| 3   | Step transition loading state — disable form + show Spinner during API call, re-enable on error, prevents double-submit     | 4.0   | Medium   |
| 4   | Bigger touch targets for progress dots — each `<Link>` wrapping a dot needs `min-w-[44px] min-h-[44px]` to meet WCAG 2.5.8  | 4.0   | High     |
| 5   | "I'll name it later" helper text — add `text-caption` below the link: "We'll assign a random URL — you can change it later" | 4.1   | Medium   |

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

A founder can complete all onboarding steps — name their waitlist, choose a template, customize branding, decide on qualification, configure questions (if enabled), set up email, and launch — arriving at a success screen with a shareable subdomain URL. All form data persists to Supabase. The live preview renders correctly across all steps. The "Powered by MyWaitlist" footer renders for Free tier only.

## Story Index

| ID  | Title                                             | Depends on | Status |
| --- | ------------------------------------------------- | ---------- | ------ |
| 4.0 | API routes + shared form context + preview wiring | 2.1, 1.3   | ready  |
| 4.1 | Step 1 — Name Your Waitlist                       | 4.0        | ready  |
| 4.2 | Step 2 — Choose a Template                        | 4.0        | ready  |
| 4.3 | Step 3 — Make It Yours                            | 4.0, 4.1   | ready  |
| 4.4 | Step 4 — Qualification Decision                   | 4.0        | ready  |
| 4.5 | Step 4a — Configure Qualification Questions       | 4.0, 4.4   | ready  |
| 4.6 | Step 5 — Email Setup + Launch                     | 4.0        | ready  |
| 4.7 | Success Screen                                    | 4.0        | ready  |

Work through these in dependency order, one at a time. Each has a `status` you should update as you go (`ready` → `in-progress` → `blocked` or `done`). A story marked `blocked` stays blocked until manually cleared — don't silently re-attempt it next session.

---

### Story 4.0 — API Routes + Shared Form Context + Preview Wiring

**Status:** ready
**Design Refs:** — (no UI)
**Story:** As the developer, I want API routes for waitlist CRUD and slug checking, a shared form context for multi-step state, and the LivePreview wired into the onboarding layout so that all subsequent step pages have a data layer and live preview to render against.

**Acceptance Criteria (EARS):**

- AC1: The system shall provide a `POST /api/waitlist` route handler that creates a waitlist record with the founder's user ID, returning the created record's ID.
- AC2: The system shall provide a `PATCH /api/waitlist` route handler that updates a waitlist record by ID, accepting any subset of waitlist fields.
- AC3: The system shall provide a `GET /api/waitlist/check-slug?slug=...` route handler that returns `{ available: boolean }` based on whether the slug exists in the `waitlists` table and whether it matches any reserved word.
- AC4: The slug check shall reject reserved words (api, www, app, admin, dashboard, onboarding, signin, signup, verify-email) identically to already-taken slugs (REQ-6.6.2).
- AC5: A shared `OnboardingFormContext` (React Context) shall provide form state across all onboarding step pages, including: `waitlistId`, `slug`, `headline`, `subheadline`, `template`, `brandColor`, `logoUrl`, `ctaText`, `milestoneRewards` (array), `qualificationEnabled`, `questions` (array), `emailSubject`, `emailSenderName`, `emailBody`, `tier`.
- AC6: The context shall provide `updateField(key, value)` and `setWaitlistId(id)` functions for step pages to update state.
- AC7: The onboarding layout right pane shall render the `LivePreview` component, receiving `template`, `headline`, `subheadline`, `brandColor`, `logoUrl`, `ctaText`, `milestoneRewards`, and `tier` from the form context.
- AC8: Lint and build shall pass with zero errors.
- AC9: The onboarding layout progress dots shall each be wrapped in a touch target with `min-w-[44px] min-h-[44px]` to meet WCAG 2.5.8 mobile tap-target requirements.
- AC10: The onboarding layout progress dots shall visually indicate completed steps — steps where the user has already submitted data shall show a filled accent dot or checkmark, distinct from the current-step filled dot and the not-yet-reached grey dot.
- AC11: The onboarding layout shall wrap the bottom action area (Next/Submit buttons) in a `sticky bottom-0` container on mobile (`md:static`) so the primary CTA remains visible during long forms.
- AC12: The `OnboardingFormContext` shall expose a `loading` boolean and a `setLoading` function so step pages can disable the form and show a loading state during API calls.

**Tasks:** T1 (AC1-AC4) Create API route handlers · T2 (AC5-AC6, AC12) Create OnboardingFormContext with loading state · T3 (AC7) Wire LivePreview into onboarding layout · T4 (AC9-AC10) Update progress dots: touch targets + completed state · T5 (AC11) Add sticky mobile CTA wrapper · T6 (AC8) Run lint + build

**Out of scope:** Step-specific form UI, file upload logic, form validation, step navigation logic.

**Dev Notes:**

- T1: Use `createServerClient` from `@supabase/ssr` for server-side Supabase clients in route handlers. Route files: `src/app/api/waitlist/route.ts` (POST + PATCH), `src/app/api/waitlist/check-slug/route.ts` (GET). The `waitlists` table schema is already applied (Epic 2.1). Slug check queries `waitlists.select('id').eq('subdomain', slug)`. **Status: not started — `src/app/api/` directory does not exist.**
- T2: Create `src/app/onboarding/context.tsx` as a Client Component. Use `useState` for each field, `useContext` for access. Wrap the onboarding layout's `{children}` in the provider. Default `tier` to `"free"` (will be read from founder_profiles table once that integration exists). Add `loading` / `setLoading` state to context so step pages can disable the form during API calls. **Status: not started — `src/app/onboarding/context.tsx` does not exist.**
- T3: The onboarding layout at `src/app/onboarding/layout.tsx` line ~110 has the empty right pane. Import `LivePreview` from `components/onboarding/live-preview.tsx` and render it in the sticky container. The context provider must wrap both the left pane (children) and right pane (LivePreview). **Status: not started — layout exists (`src/app/onboarding/layout.tsx`) but LivePreview is not imported or rendered; right pane is empty placeholder text.** Component exists: `components/onboarding/live-preview.tsx` ✓.
- T4: In the progress dots `<nav>`, wrap each dot `<Link>` with `min-w-[44px] min-h-[44px] flex items-center justify-center`. Track completed steps from context (`completedSteps: Set<number>`) and render a small checkmark SVG inside the dot `<span>` for completed steps, accent fill for current step, grey for future steps. **Status: not started — progress dots exist in layout at 10px with no touch target sizing or completed state.**
- T5: Wrap the bottom action area in `<div className="sticky bottom-0 bg-background px-14 pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0">`. Each step page's submit button goes inside this wrapper. **Status: not started — no sticky CTA wrapper exists.**
- T6: Files: `src/app/api/waitlist/route.ts`, `src/app/api/waitlist/check-slug/route.ts`, `src/app/onboarding/context.tsx`, `src/app/onboarding/layout.tsx`. **Available components (all exist):** `components/ui/button.tsx` ✓, `components/ui/input.tsx` ✓, `components/ui/card.tsx` ✓, `components/ui/spinner.tsx` ✓, `components/ui/toggle.tsx` ✓, `components/ui/badge.tsx` ✓, `components/ui/textarea.tsx` ✓, `components/share/share-copy-link.tsx` ✓, `components/share/powered-by-footer.tsx` ✓, `components/lib/cn.ts` ✓, `src/lib/supabase/server.ts` ✓, `src/lib/supabase/client.ts` ✓.

---

### Story 4.1 — Step 1 — Name Your Waitlist

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg`
**Story:** As the founder, I want to name my waitlist with a headline, subheadline, and custom subdomain so my waitlist has an identity and a shareable URL.

**Acceptance Criteria (EARS):**

- AC1: The page shall render a form with three fields: Headline (text input), Subheadline (textarea), and Subdomain (text input with prefix showing `{slug}.mywaitlist.com`).
- AC2: While the founder types in the subdomain field, the system shall derive a candidate slug (lowercase, alphanumeric + hyphens only) and check its availability via `GET /api/waitlist/check-slug`, debounced 300-500ms after the last keystroke (REQ-6.6.1).
- AC3: The system shall display real-time availability feedback: a green checkmark + "Available" for available slugs, or a red error + "Already taken" for unavailable slugs.
- AC4: If a candidate slug matches a reserved word, the system shall reject it as unavailable, identically to an already-taken slug (REQ-6.6.2).
- AC5: The system shall constrain accepted slugs to lowercase alphanumeric characters and hyphens, maximum 63 characters (REQ-6.6.3).
- AC6: The page shall include an "I'll name it later" link that assigns a random unique fallback slug and skips the subdomain field (REQ-6.6.4). A `text-caption` helper line below the link shall read: "We'll assign a random URL — you can change it later."
- AC7: On form submission, the system shall POST to `/api/waitlist` to create the waitlist record, store the `waitlistId` in context, and navigate to `/onboarding/2`. While the API call is in progress, the form shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC8: The live preview shall update from the Headline/Sub-headline fields with no perceptible lag (REQ-6.6.5).
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Build Step 1 form UI · T2 (AC2-AC5) Implement slug derivation + availability check · T3 (AC6) Implement "I'll name it later" fallback + helper text · T4 (AC7) Submit handler + loading state + API call + navigation · T5 (AC8) Verify live preview wiring · T6 (AC9) Run lint + build

**Out of scope:** Template selection (Step 2), brand customization (Step 3), logo upload.

**Dev Notes:**

- T1: Use `Input` and `Textarea` from `components/ui/`. The subdomain input should display `{candidateSlug}.mywaitlist.com` as a read-only prefix or suffix. Form layout follows the left pane of the onboarding shell. **Status: not started — `src/app/onboarding/1/page.tsx` is a bare placeholder (`<div>Onboarding Step 1 — Name your waitlist — placeholder</div>`).**
- T2: Slug derivation: `slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 63)`. Debounce using `useDeferredValue` or `setTimeout`/`clearTimeout`. The check-slug API returns `{ available: boolean }`. **Status: not started — API route does not exist yet (Story 4.0 T1).**
- T3: Generate a fallback slug: `crypto.randomUUID().slice(0, 8)` or similar. Store it as the slug in context. The "I'll name it later" link should still allow the user to set headline/subheadline before proceeding. Add a `<p className="text-caption">` below the link with the helper text: "We'll assign a random URL — you can change it later." **Status: not started.**
- T4: After POST, call `setWaitlistId(response.id)` from context. Call `setLoading(true)` before the API call, `setLoading(false)` after (or on error). Navigate with `router.push('/onboarding/2')`. While loading, disable all form inputs and the submit button. **Status: not started — API route does not exist yet (Story 4.0 T1).**
- T5: The live preview in the right pane reads `headline` and `subheadline` from context. As the user types, the preview updates via context state. **Status: not started — depends on context (Story 4.0 T2) and LivePreview wiring (Story 4.0 T3).**
- T6: Files: `src/app/onboarding/1/page.tsx`. **Available components:** `Input` ✓, `Textarea` ✓.

---

### Story 4.2 — Step 2 — Choose a Template

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-svgs/HF 5 onboard step 2 v1.svg`, `docs/design/High-fidelity-svgs/HF 5 onboard step 2 Bold.svg`, `docs/design/High-fidelity-svgs/HF 5 onboard step 2 Dark.svg`
**Story:** As the founder, I want to choose a visual template for my waitlist page so it matches my brand's aesthetic.

**Acceptance Criteria (EARS):**

- AC1: The page shall render three clickable template cards: Minimal, Bold, and Dark, each showing a mini preview of the template style.
- AC2: When a template card is selected, the system shall update the live preview immediately with no separate "apply" action (REQ-6.7.1).
- AC3: The Desktop/Mobile toggle shall change only the preview viewport, never the saved template choice (REQ-6.7.2).
- AC4: The selected template shall be persisted to the waitlist record via `PATCH /api/waitlist` as one of minimal, bold, dark (REQ-6.7.3).
- AC5: The "Next" button shall be disabled until a template is selected.
- AC6: On form submission, the system shall PATCH the waitlist record with the selected template and navigate to `/onboarding/3`. While the API call is in progress, the form shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Build template card selector UI · T2 (AC2-AC3) Wire template selection to live preview · T3 (AC4-AC6) Submit handler + PATCH + navigation · T4 (AC7) Run lint + build

**Out of scope:** Template customization (Step 3), CTA text, brand color.

**Dev Notes:**

- T1: Three cards in a grid. Each card shows a small visual preview of the template (use a `<div>` with representative styling, not the full LivePreview). Selected state: border accent color (#0F7A5E) + ring. **Status: not started — `src/app/onboarding/2/page.tsx` is a bare placeholder.**
- T2: On click, call `updateField('template', 'minimal' | 'bold' | 'dark')` from context. The right pane LivePreview updates immediately. **Status: not started — depends on context (Story 4.0 T2) and LivePreview wiring (Story 4.0 T3).**
- T3: PATCH to `/api/waitlist` with `{ id: waitlistId, template: selectedTemplate }`. Navigate with `router.push('/onboarding/3')`. **Status: not started — API route does not exist yet (Story 4.0 T1).**
- T4: Files: `src/app/onboarding/2/page.tsx`. **Available components:** `Card` ✓.

---

### Story 4.3 — Step 3 — Make It Yours

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-svgs/HF 6 onboard step 3.svg`
**Story:** As the founder, I want to customize my waitlist's branding — logo, colors, and milestone rewards — so it feels like my own product.

**Acceptance Criteria (EARS):**

- AC1: The page shall render fields for: Headline (pre-filled from Step 1), Subheadline (pre-filled), Brand Color (hex input with color picker preview), Logo Upload (file input), and CTA Text (text input, default "Join Waitlist").
- AC2: The brand-color field shall validate as a well-formed hex value before it can be saved; default value is #0F7A5E (REQ-6.8.5).
- AC3: The system shall accept logo uploads in PNG or SVG only, up to 2MB, stored in Supabase Storage (REQ-6.8.4).
- AC4: The Meta Preview panel (og:title/og:description preview) shall update live from Headline/Sub-headline/brand-color (REQ-6.8.1).
- AC5: While the milestone-rewards toggle is OFF, the system shall render no reward-tier configuration UI at all, not even collapsed (REQ-6.8.2).
- AC6: When the milestone-rewards toggle is switched ON, the system shall reveal exactly 3 reward tiers (refer-3 / refer-10 / refer-25), each with an editable label (REQ-6.8.3).
- AC7: On form submission, the system shall PATCH the waitlist record with all Step 3 fields and navigate to `/onboarding/4`. While the API call is in progress, the form shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Build Step 3 form UI with brand color validation · T2 (AC3) Implement logo upload to Supabase Storage · T3 (AC4) Wire meta preview to live preview · T4 (AC5-AC6) Implement milestone rewards toggle + 3-tier config · T5 (AC7) Submit handler + loading state + PATCH + navigation · T6 (AC8) Run lint + build

**Out of scope:** Real image optimization (logo uses `unoptimized` prop per Epic 1.6 decision), email setup (Step 5).

**Dev Notes:**

- T1: Use `Input` for headline/subheadline/brand-color/cta-text. Brand color input: text input with a small color swatch preview beside it. Validate with regex `/^#[0-9A-Fa-f]{6}$/` before allowing save. **Status: not started — `src/app/onboarding/3/page.tsx` is a bare placeholder.**
- T2: Use Supabase Storage client (`supabase.storage.from('logos').upload(path, file)`). Path: `logos/{waitlistId}/{filename}`. After upload, get the public URL and store in context as `logoUrl`. Show upload progress and file name after selection. **Status: not started — no Supabase Storage bucket created yet (manual setup required in Supabase Dashboard).**
- T3: The meta preview can be a simple `<div>` showing how the og:title/og:description would look, updating live from context fields. **Status: not started.**
- T4: Toggle component from `components/ui/toggle.tsx`. When ON, show 3 Input fields with default labels "Refer 3 friends", "Refer 10 friends", "Refer 25 friends". **Status: not started.** Component exists: `Toggle` ✓.
- T5: PATCH to `/api/waitlist` with all fields. Navigate with `router.push('/onboarding/4')`. **Status: not started — API route does not exist yet (Story 4.0 T1).**
- T6: Files: `src/app/onboarding/3/page.tsx`. **Available components:** `Input` ✓, `Toggle` ✓.

---

### Story 4.4 — Step 4 — Qualification Decision

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-svgs/HF 6 onboard step 4.svg`, `docs/design/High-fidelity-svgs/HF 4 onboard step 4 pt 1.svg`
**Story:** As the founder, I want to decide whether to add qualification questions to my waitlist so I can filter for serious signups.

**Acceptance Criteria (EARS):**

- AC1: The page shall render two clickable cards: "Yes, add questions" and "No, keep it simple".
- AC2: The "No, keep it simple" card shall describe the base signup form as "Just email. Add questions later from settings." — never "name + email" (REQ-6.9.1, Standing Decision 1).
- AC3: When "Yes, add questions" is chosen, the system shall navigate to `/onboarding/4a` (REQ-6.9.2).
- AC4: When "No, keep it simple" is chosen, the system shall set `qualification_enabled = false` on the waitlist record and navigate directly to `/onboarding/5` (REQ-6.9.3).
- AC5: The system shall PATCH the waitlist record with the qualification decision before navigating. While the API call is in progress, the cards shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Build two-card choice UI · T2 (AC3-AC5) Implement navigation logic + PATCH · T3 (AC6) Run lint + build

**Out of scope:** Question configuration (Step 4a), email setup (Step 5).

**Dev Notes:**

- T1: Two `Card` components side by side. Each is clickable (button or link styled as card). Selected state: accent border. Copy must match REQ-6.9.1 exactly — do not paraphrase. **Status: not started — `src/app/onboarding/4/page.tsx` is a bare placeholder.** Component exists: `Card` ✓.
- T2: "Yes" → `updateField('qualificationEnabled', true)`, PATCH, `router.push('/onboarding/4a')`. "No" → `updateField('qualificationEnabled', false)`, PATCH with `{ qualification_enabled: false }`, `router.push('/onboarding/5')`. **Status: not started — API route does not exist yet (Story 4.0 T1); depends on context (Story 4.0 T2).**
- T3: Files: `src/app/onboarding/4/page.tsx`.

---

### Story 4.5 — Step 4a — Configure Qualification Questions

**Status:** ready
**Design Refs:** — (derived from Step 4 SVGs)
**Story:** As the founder, I want to configure up to 2 qualification questions (Free tier) so I can learn about my waitlist signups before they join.

**Acceptance Criteria (EARS):**

- AC1: The page shall render a dynamic form where the founder can add, edit, and remove qualification questions.
- AC2: While the founder's tier is Free, the system shall enforce a hard cap of 2 questions and shall render the "Add new question" affordance as an upsell, not a functioning control, past that cap (REQ-6.10.1).
- AC3: The Pro cap shall be 5; the Growth cap shall be unlimited — read from the founder's tier field, not hardcoded per-screen (REQ-6.10.2).
- AC4: Each question shall have a text input for the question text and a toggle for "Required" vs "Optional".
- AC5: The example question text "What are you currently using?" shall be used verbatim as placeholder/helper text; no rephrased variant shall ship (REQ-6.10.3).
- AC6: The live preview shall show each question with "(optional)" in the design system's secondary text color for optional questions (REQ-6.10.4).
- AC7: On form submission, the system shall PATCH the waitlist record with the questions array and navigate to `/onboarding/5`. While the API call is in progress, the form shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1, AC4) Build dynamic question form · T2 (AC2-AC3) Implement tier-based cap logic · T3 (AC5) Add example question placeholder · T4 (AC6) Wire questions to live preview · T5 (AC7) Submit handler + PATCH + navigation · T6 (AC8) Run lint + build

**Out of scope:** Question response collection (Sprint 2), question reordering/drag-and-drop.

**Dev Notes:**

- T1: Each question row: Input (question text) + Toggle (required/optional) + Remove button. "Add question" button at bottom. **Status: not started — `src/app/onboarding/4a/page.tsx` is a bare placeholder.** Components exist: `Input` ✓, `Toggle` ✓, `Badge` ✓.
- T2: Read `tier` from context (default "free"). `maxQuestions = tier === 'free' ? 2 : tier === 'pro' ? 5 : Infinity`. When at cap, render the "Add question" button as disabled with a "Upgrade to Pro" badge (reuse `Badge` component). **Status: not started — depends on context (Story 4.0 T2).**
- T3: Use "What are you currently using?" as the placeholder text in the question input field. **Status: not started.**
- T4: The live preview in the right pane shows each question with its text and "(optional)" suffix for optional ones. Use `text-muted-foreground` for the "(optional)" text. **Status: not started — depends on LivePreview wiring (Story 4.0 T3).**
- T5: PATCH to `/api/waitlist` with `{ questions: [... ] }`. Navigate with `router.push('/onboarding/5')`. **Status: not started — API route does not exist yet (Story 4.0 T1).**
- T6: Files: `src/app/onboarding/4a/page.tsx`.

---

### Story 4.6 — Step 5 — Email Setup + Launch

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-svgs/HF 6 onboard step 5.svg`, `docs/design/High-fidelity-svgs/HF 6 onboard step 5 Pro Tier.svg`
**Story:** As the founder, I want to configure my confirmation email and launch my waitlist so signups can start arriving.

**Acceptance Criteria (EARS):**

- AC1: While the founder's tier is Free, the system shall render the confirmation-email fields as locked/greyed with a Pro badge, and shall render "Upgrade to Pro to customise" as the only actionable email-related control (REQ-6.11.1).
- AC2: While the founder's tier is Pro, the system shall render editable Sender name / Subject / Message body fields and the collapsed-by-default "Send from your own domain" panel (REQ-6.11.2).
- AC3: The Pro-tier SPF/DKIM panel UI is Sprint 1 scope; the backend verification logic is Sprint 3 scope. In Sprint 1, "Verify my domain setup" shall be wired to a stubbed response and shall never block "Launch my waitlist" (REQ-6.11.3).
- AC4: The page shall display a summary of the waitlist configuration (name, template, questions count) before launch.
- AC5: When "Launch my waitlist" is clicked and no subdomain was ever finalized (i.e., "I'll name it later" was used), the system shall auto-assign the fallback slug rather than blocking the action (REQ-6.11.4).
- AC6: On launch, the system shall PATCH the waitlist record with `status = 'live'` and navigate to `/onboarding/success`. While the API call is in progress, the form shall be disabled and a loading indicator shown (uses `loading`/`setLoading` from context).
- AC7: The live URL shall be displayed on the success screen as `{slug}.mywaitlist.com`.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Build email setup form (Free + Pro tiers) · T2 (AC3) Stub SPF/DKIM verification panel · T3 (AC4-AC5) Build launch summary + fallback slug logic · T4 (AC6-AC7) Launch handler + PATCH + navigation · T5 (AC8) Run lint + build

**Out of scope:** Real email sending (Sprint 2), real SPF/DKIM verification (Sprint 3), Resend integration.

**Dev Notes:**

- T1: Free tier: show Sender name/Subject/Message body as disabled inputs with a `Badge` component showing "Pro". Add "Upgrade to Pro to customise" as a disabled-looking CTA. Pro tier: same fields but editable. "Send from your own domain" is a `Card` with a collapsed panel (use `useState` for open/close). **Status: not started — `src/app/onboarding/5/page.tsx` is a bare placeholder.** Components exist: `Input` ✓, `Badge` ✓, `Card` ✓.
- T2: The "Verify my domain setup" button calls a stubbed API route that always returns `{ verified: false, message: 'Verification will be available in a future update' }`. Do not build the real verification logic. **Status: not started — no stubbed API route exists.**
- T3: Show a summary card: waitlist name, template, questions count. The "Launch" button is always enabled (never blocked by slug or email config). **Status: not started — depends on context (Story 4.0 T2).**
- T4: PATCH to `/api/waitlist` with `{ status: 'live', ...emailFields }`. Then `router.push('/onboarding/success')`. **Status: not started — API route does not exist yet (Story 4.0 T1).**
- T5: Files: `src/app/onboarding/5/page.tsx`.

---

### Story 4.7 — Success Screen

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-svgs/Onboard Success Page Founder.svg`
**Story:** As the founder, I want a success screen that shows my live URL and lets me share it so I can start getting signups immediately.

**Acceptance Criteria (EARS):**

- AC1: The page shall display a success message ("Your waitlist is live!") and the live URL (`{slug}.mywaitlist.com`).
- AC2: The Share button shall render only where `navigator.share` is supported; Copy Link shall always render, at equal visual weight, never as a fallback-only control (REQ-6.12.1).
- AC3: The Share/Copy functionality shall use the shared `ShareCopyLink` component from `components/share/share-copy-link.tsx`.
- AC4: "Or, go to my dashboard" shall navigate to `/dashboard` (REQ-6.12.2).
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Build success screen UI · T2 (AC3) Integrate ShareCopyLink component · T3 (AC4) Add dashboard link · T4 (AC5) Run lint + build

**Out of scope:** Subscriber-facing public page (Sprint 2), referral link generation (Sprint 2).

**Dev Notes:**

- T1: Centered layout with a check icon, success heading, and the live URL displayed prominently. Use design tokens from globals.css. **Status: not started — `src/app/onboarding/success/page.tsx` is a bare placeholder.**
- T2: Import `ShareCopyLink` from `components/share/share-copy-link.tsx`. Pass the live URL as the copy value. **Status: not started.** Component exists: `ShareCopyLink` ✓.
- T3: A simple `<Link>` styled with accent color, below the Share/Copy controls. **Status: not started.**
- T4: Files: `src/app/onboarding/success/page.tsx`.

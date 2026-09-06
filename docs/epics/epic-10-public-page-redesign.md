# Epic 10 — Public Waitlist Page & Onboarding Redesign

**Status:** ready
**Source:** [PRD S6.6 Onboarding Step 1](../PRD.md#66-onboarding-step-1--name-your-waitlist-f-c1), [PRD S6.8 Onboarding Step 3](../PRD.md#68-onboarding-step-3--make-it-yours-f-c3), [PRD S6.12a PoweredByFooter](../PRD.md#612a-powered-by-prewaitlist-footer--onboarding-preview--public-pages), [PRD S2a Sprint 2](../PRD.md#2a-sprint-2--public-page-dashboard-active), [MVP Vision](../product-vision-mvp-waitlist-tool.md)

## Design References

| Reference                                 | File                                                             |
| ----------------------------------------- | ---------------------------------------------------------------- |
| Public waitlist page (Sprint 2)           | `docs/design/High-fidelity-Sprit2/Public_page_HF2.svg`           |
| Dashboard empty state (sidebar reference) | `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg` |
| Onboarding Step 1 (Sprint 1)              | `docs/design/High-fidelity-svgs/F-C1.svg`                        |
| Onboarding Step 3 (Sprint 1)              | `docs/design/High-fidelity-svgs/F-C3.svg`                        |
| Design system mapping                     | `docs/design/Desing System table Map.svg`                        |

## Goal

Fix 7 critical bugs, 4 accessibility violations, 7 design system violations, and 9 inconsistencies across the public waitlist page and onboarding Steps 1–3. Redesign the public page layout to match best practices (wider content, trust line, social proof near form, proper logo sizing). Clean up the onboarding field architecture by adding a `productName` field separate from `headline` and fixing misleading labels ("Headline" → "Product Name", "tagline" → "Subdomain"). Fix the "I'll name it later" flow to generate readable URLs and not require manual input. Ship before Sprint 3 begins — unblocks Epic 11, 12, 13.

## Definition of Done

All 7 critical bugs are fixed. All public and onboarding forms are WCAG 2.1 AA compliant. All inline styles, arbitrary Tailwind values, and hardcoded hex fallbacks are replaced with design system tokens. The public waitlist page is widened to 576–672px, headline is 36–48px, social proof is near the form, and a trust line appears below the CTA. The `productName` field exists in the database and onboarding context, separate from `headline`. Step 1 labels are accurate ("Product Name", "Subdomain"). "I'll name it later" generates readable slugs like `brave-fox-x7k2`, auto-fills a default headline, and keeps the slug input editable. Lint and build pass with zero errors.

## Story Index

| ID   | Title                         | Depends on | Status |
| ---- | ----------------------------- | ---------- | ------ |
| 10.0 | Schema Migration              | —          | ready  |
| 10.1 | Fix Critical Bugs             | 10.0       | ready  |
| 10.2 | Accessibility Fixes           | —          | ready  |
| 10.3 | Design System Normalization   | —          | ready  |
| 10.4 | Public Page Layout Redesign   | 10.3       | ready  |
| 10.5 | Onboarding Field Architecture | 10.0       | ready  |
| 10.6 | "I'll Name It Later" Fix      | 10.5       | ready  |
| 10.7 | Inconsistency Resolution      | 10.1, 10.3 | ready  |

Work through these in dependency order, one at a time. Stories 10.0, 10.2, and 10.3 have no dependencies and can be started in any order. Story 10.1 depends on 10.0 (schema must exist before API fixes). Story 10.4 depends on 10.3 (design system must be normalized before layout changes). Story 10.5 depends on 10.0 (productName column must exist). Story 10.6 depends on 10.5 (field architecture must be in place). Story 10.7 depends on 10.1 and 10.3 (bugs fixed and design system normalized before consistency pass).

---

### Story 10.0 — Schema Migration

**Status:** ready
**Design Refs:** None (database-only change)

**Story:** As a developer, I want a `product_name` column on the `waitlists` table so that the product's internal display name is separate from the public page headline.

**Acceptance Criteria (EARS):**

- AC1: The system shall apply a SQL migration that adds a `product_name` column (text, nullable) to the `waitlists` table.
- AC2: The `POST /api/waitlist` endpoint shall accept an optional `product_name` field and persist it to the `product_name` column.
- AC3: The `PATCH /api/waitlist` endpoint shall accept an optional `product_name` field and update the `product_name` column.
- AC4: The `GET /api/waitlist` endpoint shall return `productName` in the response body. When `product_name` is NULL, the system shall fall back to the `headline` value.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Add `product_name` column via migration SQL · T2 (AC2) Update POST endpoint to accept `product_name` · T3 (AC3) Update PATCH endpoint to accept `product_name` · T4 (AC4) Update GET endpoint to return `productName` with fallback · T5 (AC5) Lint + build

**Out of scope:** Changing the `headline` column behavior, renaming existing columns, modifying the `founder_profiles` table.

**Dev Notes:**

- T1: Add migration to `docs/stories/epic0.story03-supabase-schema.sql`. Column type: `text nullable`. No default value — NULL means "not yet set, fall back to headline". RLS: same policies as other waitlist columns (founder manages own).
- T2: In `src/app/api/waitlist/route.ts` POST handler (line 120–137), add `product_name: body.product_name ?? null` to `insertPayload`.
- T3: In `src/app/api/waitlist/route.ts` PATCH handler (line 199–219), the `updates` object already spreads unknown keys. Add explicit handling: `if (body.product_name !== undefined) updates.product_name = body.product_name;`.
- T4: In `src/app/api/waitlist/route.ts` GET handler (line 324–351), add `productName: waitlist.product_name || waitlist.headline || ""` to the response.

---

### Story 10.1 — Fix Critical Bugs

**Status:** ready
**Design Refs:** None (bug fixes)

**Story:** As a developer, I want 7 critical bugs fixed across the public page, onboarding context, live preview, and thank-you page so that the product functions correctly.

**Acceptance Criteria (EARS):**

- AC1: The `PoweredByFooter` component shall render different classes for dark and light templates. Dark mode shall use `bg-dark-template-bg text-dark-template-text`. Light mode shall use `bg-card text-foreground`.
- AC2: The `signup_counter_enabled` field shall be persistable as `false` in the API. When the founder disables the signup counter toggle, the PATCH request shall include `signup_counter_enabled: false` (not omit it).
- AC3: The `AuthedOnboardingProvider` shall map all camelCase field names to their snake_case API equivalents before sending PATCH requests. The mapping shall include: `brandColor` → `brand_color`, `ctaText` → `cta_text`, `signupCounterEnabled` → `signup_counter_enabled`, `signupCounterThreshold` → `signup_counter_threshold`, `emailSubject` → `email_subject`, `emailSenderName` → `email_sender_name`, `emailBody` → `email_body`.
- AC4: The LivePreview signup counter shall display a value derived from the onboarding context, not a hardcoded `1189`.
- AC5: The "What should we call you?" input on the thank-you page shall either be wired to a state variable and save handler, or be removed entirely. A non-functional decorative input shall not ship.
- AC6: The referral count on the thank-you page shall reflect the actual referral count from the server, not a hardcoded `0`.
- AC7: The template prop passed to `WaitlistTemplateContent` on the thank-you page shall reflect the actual waitlist template from the server, not a hardcoded `"minimal"`.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Fix PoweredByFooter dark/light conditional · T2 (AC2) Fix signup_counter_enabled false→undefined · T3 (AC3) Fix camelCase→snake_case mapping · T4 (AC4) Fix hardcoded signup counter · T5 (AC5) Wire up or remove thank-you name input · T6 (AC6) Fix hardcoded referral count · T7 (AC7) Fix hardcoded template · T8 (AC8) Lint + build

**Out of scope:** New features, layout changes, design system normalization (Story 10.3), accessibility fixes (Story 10.2).

**Dev Notes:**

- T1: `components/share/powered-by-footer.tsx:31-33` — **Status: not started.** The `isDark` ternary on line 31 produces identical class `text-muted-foreground` in both branches. Change to `isDark ? "text-dark-template-text" : "text-foreground"`. Note: the border logic on lines 19-23 already differentiates correctly.
- T2: `src/app/onboarding/context.tsx:274` — **Status: not started.** `data.signupCounterEnabled || undefined` drops `false`. Change to `?? undefined` (nullish coalescing preserves `false`). **Also fix line 273:** `qualification_enabled` has the same `|| undefined` bug — change to `?? undefined`.
- T3: `src/app/onboarding/context.tsx:401` — **Status: not started.** PATCH mapping only converts `brandColor` → `brand_color`. Also misses `ctaText` → `cta_text`, `logoUrl` → `logo_url`, `milestoneRewards` → `milestone_rewards`, `signupCounterEnabled` → `signup_counter_enabled`, `signupCounterThreshold` → `signup_counter_threshold`, `emailSubject` → `email_subject`, `emailSenderName` → `email_sender_name`, `emailBody` → `email_body`, `qualificationEnabled` → `qualification_enabled`. Create a `FIELD_MAP` constant.
- T4: `components/onboarding/live-preview.tsx:387` — **Status: not started.** Hardcoded `signupCounter={1189}`. Replace with `signupCounter={form.signupCounterEnabled ? form.signupCounterThreshold : 0}` or similar context-driven value. Note: the component also has `style={{ backgroundColor: brandColor }}` on lines 171, 255 — this is dynamic and acceptable per Tailwind docs (inline styles for runtime values).
- T5: `src/app/(public)/[subdomain]/thank-you/page.tsx:120-124` — **Status: not started.** Name input has no `value`, `onChange`, or `onBlur`. Either wire to state + save handler, or remove entirely. **Also fix line 29:** DB query does not select `template` field — must add `template, brand_color, logo_url, cta_text` to the select.
- T6: `src/app/(public)/[subdomain]/thank-you/page.tsx:129` — **Status: not started.** Hardcoded referral count `"0"`. Server component must query `subscribers` table for referral count where `referrer_id` matches current subscriber's ID. Pass as prop to client component.
- T7: `src/app/(public)/[subdomain]/thank-you/page.tsx:162` — **Status: not started.** `template="minimal"` hardcoded. Server component must read `template` from waitlist record and pass as prop. Replace `template="minimal"` with `template={waitlist.template}`.

---

### Story 10.2 — Accessibility Fixes

**Status:** ready
**Design Refs:** None (accessibility compliance)

**Story:** As a user relying on assistive technology, I want all form inputs on the public waitlist page and onboarding steps to have proper labels so that screen readers can announce their purpose.

**Acceptance Criteria (EARS):**

- AC1: Every `<input type="email">` in `email-capture-form.tsx` shall have an `aria-label="Email address"` attribute.
- AC2: Every dynamic question `<input type="text">` in `email-capture-form.tsx` shall have an `aria-label` attribute set to the question text.
- AC3: The name `<input type="text">` on the thank-you page shall have an `aria-label="First name"` attribute.
- AC4: Every `<label>` in onboarding Step 1 and Step 3 shall be associated with its input via `htmlFor`/`id` pairing. Clicking the label shall focus the corresponding input.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Add aria-label to email inputs · T2 (AC2) Add aria-label to question inputs · T3 (AC3) Add aria-label to name input · T4 (AC4) Add htmlFor/id pairing to onboarding labels · T5 (AC5) Lint + build

**Out of scope:** Keyboard navigation improvements, focus trap management, color contrast fixes (separate concern).

**Dev Notes:**

- T1: `components/public/email-capture-form.tsx:146,208` — **Status: not started.** Both email inputs (with-questions and no-questions variants) lack `aria-label`. Add `aria-label="Email address"` and `aria-describedby` pointing to error message `<p>` for WCAG 3.3.1 compliance.
- T2: `components/public/email-capture-form.tsx:169` — **Status: not started.** Question text inputs use `placeholder` as only label. Add `aria-label={question.text}` to each. Also add `aria-describedby` for error messages.
- T3: `src/app/(public)/[subdomain]/thank-you/page.tsx:120-124` — **Status: not started.** Name input has no `aria-label`. Add `aria-label="First name"`.
- T4: `src/app/onboarding/1/page.tsx:277,292,306` — **Status: not started.** None of the three field groups have `htmlFor`/`id` pairing. Add `htmlFor="headline"` + `id="headline"`, `htmlFor="subheadline"` + `id="subheadline"`, `htmlFor="slug"` + `id="slug"`. Repeat for Step 3 fields.

---

### Story 10.3 — Design System Normalization

**Status:** ready
**Design Refs:** `src/app/globals.css` (design system tokens)

**Story:** As a developer, I want all inline styles, arbitrary Tailwind values, and hardcoded hex fallbacks replaced with design system tokens so that the codebase is consistent and maintainable.

**Acceptance Criteria (EARS):**

- AC1: The `live-preview.tsx` component shall contain zero `style={{ ... }}` inline style blocks. All styling shall use Tailwind utility classes referencing design system tokens.
- AC2: All onboarding input fields shall use `h-10` (40px, the `--input-height` token) instead of `h-15` (60px).
- AC3: The onboarding submit button shall use a standard design system button size (e.g., `h-10` or `h-12`) instead of `h-14.75 w-114.5`.
- AC4: The thank-you page name input shall use `--input-height` token instead of `h-[52px]` and `--card-radius` token instead of `rounded-[12px]`.
- AC5: No element in the public waitlist page or onboarding Steps 1–3 shall use `text-[10px]` or `text-[11px]`. The minimum font size shall be `text-xs` (12px).
- AC6: No component shall use hardcoded hex color fallbacks (e.g., `#FAF8F4`, `#1A1A1A`) in inline styles. All colors shall reference CSS custom properties via Tailwind utility classes.
- AC7: All conditional class logic in affected files shall use the `cn()` utility from `components/lib/cn.ts`.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Replace inline styles in live-preview.tsx · T2 (AC2) Replace h-15 inputs with h-10 · T3 (AC3) Replace arbitrary button sizes · T4 (AC4) Replace thank-you input arbitrary values · T5 (AC5) Replace sub-12px font sizes · T6 (AC6) Replace hardcoded hex fallbacks · T7 (AC7) Add cn() usage · T8 (AC8) Lint + build

**Out of scope:** Changes to the marketing pages, dashboard components, or any file outside the public waitlist page and onboarding Steps 1–3 scope.

**Dev Notes:**

- T1: `components/onboarding/live-preview.tsx` — **Status: not started.** 17 inline `style={{}}` blocks at lines 50, 62, 75, 83, 91, 100, 112, 171, 255, 311, 313, 322, 342, 361, 367, 374, 380. Replace `style={{ background: 'var(--color-background)' }}` with `bg-background`, `style={{ color: 'var(--color-foreground)' }}` with `text-foreground`, etc. Use utility class names (not `var()` arbitrary values) per MEMORY.md Tailwind v4 rule. **Exception:** `style={{ backgroundColor: brandColor }}` on lines 171, 255 is dynamic (runtime value) — acceptable per Tailwind docs. Use CSS variable approach if possible: `style={{ '--brand-color': brandColor }}` then `bg-[var(--brand-color)]`.
- T2: `src/app/onboarding/1/page.tsx:286,300,317` — **Status: not started.** Replace `h-15` with `h-10` on all three inputs. `h-15` is not a standard Tailwind utility.
- T3: `src/app/onboarding/1/page.tsx:345` — **Status: not started.** Replace `h-14.75 w-114.5` with standard button sizes. Use the `Button` component's existing variants (md or lg) instead of arbitrary fractional values.
- T4: `src/app/(public)/[subdomain]/thank-you/page.tsx:120` — **Status: not started.** Replace `h-[52px]` with `h-10`, `rounded-[12px]` with `rounded-(--card-radius)`.
- T5: `components/share/waitlist-template-content.tsx:114,121` — **Status: not started.** Replace `text-[10px]` with `text-xs` (12px), `text-[11px]` with `text-2xs` (11px, defined in MEMORY.md typography system).
- T6: `components/onboarding/live-preview.tsx` — **Status: not started.** Replace hardcoded hex fallbacks with Tailwind utility classes (e.g., `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-accent`). Also fix `components/share/waitlist-template-content.tsx:58` — replace inline `style={{ height: isBold ? 48 : 40 }}` with `className="max-h-12 object-contain"`.
- T7: Add `import { cn } from "@/lib/cn"` to all affected files. Replace ternary class logic with `cn()` calls.

---

### Story 10.4 — Public Page Layout Redesign

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/Public_page_HF2.svg` (reference only — layout improvements are best-practice-driven, not design-SVG-driven)

**Story:** As a visitor, I want the public waitlist page to be wider, have a larger headline, show social proof near the form, include a trust line, and display a "how it works" section so that the page is more compelling and converts better.

**Acceptance Criteria (EARS):**

- AC1: The public waitlist page content area shall use `max-w-xl` (576px) or `max-w-2xl` (672px) instead of `max-w-lg` (512px).
- AC2: The headline on the public waitlist page shall render at 36–48px (text-4xl or text-5xl range).
- AC3: The social proof counter ("Join X others on the waitlist") shall appear above or immediately adjacent to the email capture form, not below it.
- AC4: A trust line reading "No spam. Unsubscribe anytime." shall appear below the CTA button.
- AC5: An optional "How it works" section with 3 steps shall appear below the form. Steps: "1. Enter your email → 2. Get your position → 3. Refer friends to move up".
- AC6: The logo shall use `max-w`/`max-h` with `object-contain` instead of fixed `width`/`height` inline styles, preventing distortion of uploaded logos.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Widen content area · T2 (AC2) Increase headline font size · T3 (AC3) Move social proof near form · T4 (AC4) Add trust line · T5 (AC5) Add "How it works" section · T6 (AC6) Fix logo sizing · T7 (AC7) Lint + build

**Out of scope:** Adding a product screenshot slot (future enhancement), changing the email capture form logic, modifying the referral system.

**Dev Notes:**

- T1: `components/public/waitlist-page-content.tsx:48,62` — **Status: not started.** Change `max-w-lg` (512px) to `max-w-xl` (576px) or `max-w-2xl` (672px). Web research: single-column layout is reliable default; multi-column breaks flow. Also update `components/share/waitlist-template-content.tsx` if it constrains width.
- T2: `components/share/waitlist-template-content.tsx` — **Status: not started.** Headline is currently `text-h2`/`text-h3` (24-28px). Change to `text-4xl` (35px) or `text-5xl` (48px). Web research: headline should be largest text element, 36-48px range is standard for SaaS capture pages.
- T3: `components/share/waitlist-template-content.tsx:70-85` — **Status: not started.** Social proof counter is currently below the form. Move to above the email capture form. Web research: placing social proof near the form → +10-35% conversion lift (Spiegel Research Center: 5+ reviews → +270% purchase likelihood).
- T4: `components/public/email-capture-form.tsx` — **Status: not started.** Add trust line below submit button: `<p className="mt-2 text-center text-xs text-muted-foreground">No spam. Unsubscribe anytime.</p>`. Web research: trust line goes directly under CTA, answering the visitor's last fear before they click.
- T5: `components/share/waitlist-template-content.tsx` — **Status: not started.** Add optional 3-step "How it works" section below form. Steps: "1. Enter your email → 2. Get your position → 3. Refer friends to move up". Web research: for simple email capture, "how it works" is optional — skip if the form is self-explanatory. Mark as low priority.
- T6: `components/share/waitlist-template-content.tsx:50-59` — **Status: not started.** Logo uses fixed `width={120} height={40}` (or 144x48 for bold) with inline `style={{ height }}`. Replace with `className="max-w-[144px] max-h-[48px] object-contain"` to prevent distortion of uploaded logos.

---

### Story 10.5 — Onboarding Field Architecture

**Status:** ready
**Design Refs:** None (field architecture cleanup)

**Story:** As a founder, I want onboarding Step 1 to have clear, accurate labels ("Product Name" and "Subdomain") so that I understand what each field is for without confusion.

**Acceptance Criteria (EARS):**

- AC1: The `OnboardingFormState` interface shall include a `productName: string` field.
- AC2: Onboarding Step 1 shall display a "Product Name" field (not "Headline") with placeholder "e.g. Buildly".
- AC3: Onboarding Step 1 shall display a "Subdomain" field (not "tagline") with placeholder showing the derived slug.
- AC4: The LivePreview shall use `productName` for internal display (e.g., dashboard title, email sender fallback) and `headline` for the public page heading.
- AC5: The `flushToAPI` function shall send `product_name` in the POST body.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Add productName to OnboardingFormState · T2 (AC2-AC3) Rename Step 1 labels · T3 (AC4) Update LivePreview to use productName · T4 (AC5) Update flushToAPI · T5 (AC6) Lint + build

**Out of scope:** Changing the Step 3 layout, modifying the template selector, removing fields, adding new fields beyond productName.

**Dev Notes:**

- T1: `src/app/onboarding/context.tsx:30-48` — **Status: not started.** Add `productName: string` to `OnboardingFormState`. Default: `""`. Also add to localStorage persistence and flushToAPI.
- T2: `src/app/onboarding/1/page.tsx:277-278` — **Status: not started.** Change label "Headline" to "Product Name", change placeholder to "e.g. Buildly". Change label "tagline" (line 306-307) to "Subdomain". Keep the fields in Step 1 — just fix the labels. Note: web research confirms "Headline = value reminder, not brand name" — separating product name from headline is correct.
- T3: `components/onboarding/live-preview.tsx` — **Status: not started.** Wherever the preview reads `form.headline` for internal display (dashboard title, email sender), use `form.productName || form.headline` as fallback.
- T4: `src/app/onboarding/context.tsx:264-280` — **Status: not started.** In `flushToAPI`, add `product_name: data.productName || undefined` to the POST body.

---

### Story 10.6 — "I'll Name It Later" Fix

**Status:** ready
**Design Refs:** None (UX improvement based on competitor research)

**Story:** As a founder who wants to explore the product before committing to a name, I want "I'll name it later" to generate a readable URL, auto-fill a default headline and subheadline, and keep the slug input editable so that I can proceed without friction and change my mind later.

**Acceptance Criteria (EARS):**

- AC1: Clicking "I'll name it later" shall generate a slug in the format `{adjective}-{noun}-{4hex}` (e.g., `brave-fox-x7k2`) instead of a raw 8-char hex string.
- AC2: Clicking "I'll name it later" shall auto-fill the headline with "My Waitlist" and the subheadline with "Join the waitlist", then advance to Step 2 without requiring manual input.
- AC3: The slug input shall remain editable after clicking "I'll name it later". The user can type over the generated slug.
- AC4: After clicking "I'll name it later", a message shall appear: "Your page will be at **{slug}.prewaitlist.com** — you can change this anytime in Settings".
- AC5: The page header shall read "What's your product called?" with helper text "Don't worry — you can change all of this later".
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Replace UUID fallback with readable slug generator · T2 (AC2) Auto-fill headline/subheadline and advance on skip · T3 (AC3) Keep slug input editable after skip · T4 (AC4) Show generated URL with explanation · T5 (AC5) Update header and helper text · T6 (AC6) Lint + build

**Out of scope:** Dashboard slug editing (future story), email-based slug generation, slug uniqueness guarantee beyond 4-hex collision probability.

**Dev Notes:**

- T1: `src/app/onboarding/1/page.tsx:19-21` — **Status: not started.** Replace `generateFallbackSlug()` which uses `crypto.randomUUID().slice(0, 8)` (opaque hex). New implementation uses `{adjective}-{noun}-{4hex}` pattern (e.g., `brave-fox-x7k2`). Web research: 40-60% drop on naming steps — readable slugs reduce friction.
- T2: `src/app/onboarding/1/page.tsx:174-182` — **Status: not started.** In `handleNameLater`, also call `form.updateField("headline", "My Waitlist")` and `form.updateField("subheadline", "Join the waitlist")`, then `router.push("/onboarding/2")`. Currently only sets slug.
- T3: `src/app/onboarding/1/page.tsx:316` — **Status: not started.** Remove `usedFallback` from disabled condition: `disabled={isSubmitting}` (remove `|| usedFallback`). Currently locks the input after skip.
- T4: `src/app/onboarding/1/page.tsx:319-334` — **Status: not started.** Enhance URL preview section. After skip, show: "Your page will be at **{slug}.prewaitlist.com**" in accent color, with "You can change this anytime in Settings" in muted-foreground below. Currently just shows raw URL.
- T5: `src/app/onboarding/1/page.tsx:264-273` — **Status: not started.** Change "What are you building?" to "What's your product called?". Add helper: "Don't worry — you can change all of this later" in muted-foreground. Currently has no helper text below the "I'll name it later" button.

---

### Story 10.7 — Inconsistency Resolution

**Status:** ready
**Design Refs:** None (consistency pass)

**Story:** As a developer, I want all input heights, focus border patterns, error display patterns, and type definitions unified across the public page and onboarding steps so that the codebase is consistent and maintainable.

**Acceptance Criteria (EARS):**

- AC1: All input fields across public waitlist page and onboarding Steps 1–3 shall use the same height: `h-10` (40px, the `--input-height` token).
- AC2: All input focus states shall use the same pattern: `focus:border-accent focus:ring-1 focus:ring-accent`.
- AC3: Error display in `email-capture-form.tsx` shall use inline JSX (not `alert()`).
- AC4: The LivePreview question form spacing shall match the EmailCaptureForm spacing (reconcile `gap-3` vs `mt-4`).
- AC5: The `PoweredByFooter` component shall not accept a `brandColor` prop (dead prop — never used).
- AC6: The `MilestoneReward` type shall be unified: `{ threshold: number; label: string }` everywhere. The `{ name, value }` variant in LivePreview shall be replaced.
- AC7: The question type shall be unified: adopt `{ text: string; required: boolean }` everywhere. The `OptionalQuestion` variant with `optional: boolean` shall be removed.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Unify input heights · T2 (AC2) Unify focus border patterns · T3 (AC3) Replace alert() with inline JSX · T4 (AC4) Align question form spacing · T5 (AC5) Remove dead brandColor prop · T6 (AC6) Unify MilestoneReward types · T7 (AC7) Unify question types · T8 (AC8) Lint + build

**Out of scope:** Changes to dashboard components, marketing pages, or any file outside the public waitlist page and onboarding scope.

**Dev Notes:**

- T1: `email-capture-form.tsx`, `waitlist-template-content.tsx`, `live-preview.tsx`, `onboarding/1/page.tsx`, `onboarding/3/page.tsx` — **Status: not started.** Three different input height systems exist: `h-15` (onboarding), `h-[52px]` (thank-you), `h-10`/`h-11` (email-capture-form). Standardize all to `h-10` (40px, the `--input-height` token).
- T2: Replace inconsistent focus patterns with `focus:border-accent focus:ring-1 focus:ring-accent` everywhere. Currently two patterns exist: `focus:border-accent focus:ring-1 focus:ring-accent` (email-capture-form) vs `focus:border-accent focus:outline-none` (onboarding).
- T3: `components/public/email-capture-form.tsx` — **Status: not started.** Replace `alert()` error calls with inline error message JSX (e.g., `<p className="text-sm text-destructive">{error}</p>`). Web research: errors must use `role="alert"` or `aria-live` for screen reader announcement.
- T4: Reconcile `gap-3` in LivePreview question form with `mt-4` in EmailCaptureForm. Use `gap-3` consistently.
- T5: `components/share/powered-by-footer.tsx` — **Status: not started.** Remove `brandColor` from props interface and function signature. Dead prop — never used.
- T6: `components/onboarding/live-preview.tsx` — **Status: not started.** Change `{ name: string; value: string }` to `{ threshold: number; label: string }` for milestone rewards. Update all references.
- T7: `components/public/email-capture-form.tsx` — **Status: not started.** Change `OptionalQuestion` type to match `QualificationQuestion` from context (`{ text: string; required: boolean }`). Remove the `optional` boolean variant.

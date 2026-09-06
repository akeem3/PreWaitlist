# Public Waitlist Page & Onboarding Redesign — Deep Audit

**Epic:** 10 (pre-Sprint 3)
**Date:** 2026-09-06
**Scope:** Public waitlist page, onboarding Steps 1–3, shared components, API field mapping
**Confidence:** 98%
**Sprint:** Ships before Sprint 3 begins. Unblocks Sprint 3 epics (which become Epic 11, 12, 13).

---

## Table of Contents

1. [Critical Bugs (7)](#1-critical-bugs)
2. [Critical Accessibility (4)](#2-critical-accessibility)
3. [Design System Violations (7)](#3-design-system-violations)
4. [Page Structure Issues (7)](#4-page-structure-issues)
5. [Onboarding Field Issues (5)](#5-onboarding-field-issues)
6. [Inconsistencies (9)](#6-inconsistencies)
7. ["I'll Name It Later" — Research & Recommendation](#7-ill-name-it-later)
8. [Fix Plan (Epic 13)](#8-fix-plan)

---

## 1. Critical Bugs

### Bug 1: PoweredByFooter dark/light dead conditional

**File:** `components/share/powered-by-footer.tsx:82`
**Impact:** Dark mode has zero visual effect on footer.

```tsx
// Line 82 — BOTH branches produce identical classes
className={cn(
  "flex items-center gap-1.5 text-caption",
  isDark ? "bg-card text-foreground" : "bg-card text-foreground"  // ← SAME
)}
```

**Fix:** Dark mode should use `bg-dark-template-bg text-dark-template-text`.

---

### Bug 2: signup_counter_enabled can never be set to false

**File:** `src/app/onboarding/context.tsx:274`
**Impact:** Disabling the signup counter toggle silently does nothing. When `false`, the value becomes `undefined` and is omitted from the API body.

```tsx
// Line 274 — false becomes undefined, which is omitted from JSON
signup_counter_enabled: data.signupCounterEnabled || undefined,
//                                              ^^^^^^^^^^^^^
//                                              false || undefined === undefined
```

**Fix:** Use explicit nullish check: `data.signupCounterEnabled ?? undefined` or send the boolean directly.

---

### Bug 3: Incomplete camelCase → snake_case mapping (AuthedOnboardingProvider)

**File:** `src/app/onboarding/context.tsx:401`
**Impact:** PATCH requests send camelCase keys but API expects snake_case. Server silently ignores unknown fields.

```tsx
// Line 401 — Only brandColor is mapped
const apiKey = key === "brandColor" ? "brand_color" : key;
// Missing: ctaText → cta_text, signupCounterEnabled → signup_counter_enabled,
//          signupCounterThreshold → signup_counter_threshold,
//          emailSubject → email_subject, emailSenderName → email_sender_name,
//          emailBody → email_body
```

**Fix:** Complete the mapping table for all fields that differ between camelCase (JS) and snake_case (DB).

---

### Bug 4: Hardcoded fake signup counter in LivePreview

**File:** `components/onboarding/live-preview.tsx:624`
**Impact:** Preview always shows "1,189 people on the waitlist" regardless of actual count.

```tsx
// Line 624 — hardcoded, not connected to any real data
signupCounter={1189}
```

**Fix:** Use `signupCounterThreshold` from context, or show a realistic sample (e.g., `0` or `1` for new waitlists).

---

### Bug 5: "What should we call you?" input is non-functional

**File:** `src/app/(public)/[subdomain]/thank-you/page.tsx:148`
**Impact:** Decorative input — no `onChange`, no `onSubmit`, no state, no form. "Save" button does nothing.

```tsx
// Lines 148-154 — input has no functionality
<input type="text" placeholder="First name" className="... h-[52px] ..." />
// "Save" button has no onClick handler
```

**Fix:** Either wire up the input (add state, save to DB) or remove it entirely. If keeping, it needs a `<label>`.

---

### Bug 6: Referral count hardcoded to "0"

**File:** `src/app/(public)/[subdomain]/thank-you/page.tsx:131`
**Impact:** Referral progress section always shows "0 of 3 referrals".

```tsx
// Line 131 — referralCount is always null from server
<span className="font-medium">{referralCount ?? 0}</span>
```

**Fix:** Server component needs to query referral count from `subscribers` table, or the section should use real data.

---

### Bug 7: Template hardcoded to "minimal"

**File:** `src/app/(public)/[subdomain]/thank-you/page.tsx:159`
**Impact:** Thank-you page always renders minimal template, ignoring the founder's actual template choice.

```tsx
// Line 159 — hardcoded, not from DB
template = "minimal";
```

**Fix:** Pass actual template from server-side waitlist data.

---

## 2. Critical Accessibility

### A11y 1–2: Email inputs missing labels

**File:** `components/public/email-capture-form.tsx:35,50`
**WCAG:** 1.3.1 (Info and Relationships), 4.1.2 (Name, Role, Value)

Both email inputs (desktop and mobile) have no `<label>` element and no `aria-label` attribute. Screen readers announce "edit text" with no context about what the field is for.

```tsx
// Line 35 — no label, no aria-label
<input
  type="email"
  placeholder="Enter your email"
  // Missing: aria-label="Email address"
/>
```

---

### A11y 3: Question inputs missing labels

**File:** `components/public/email-capture-form.tsx:116`
**WCAG:** 1.3.1, 4.1.2

Dynamic qualification question inputs have no `<label>` or `aria-label`.

```tsx
// Line 116 — no label association
<input
  type="text"
  placeholder="Your answer"
  // Missing: aria-label={question.text} or <label>
/>
```

---

### A11y 4: Onboarding labels not associated with inputs

**Files:** `src/app/onboarding/1/page.tsx:277-318`, `src/app/onboarding/3/page.tsx`
**WCAG:** 1.3.1

Labels use `<label>` but without `htmlFor`/`id` pairing. Clicking the label doesn't focus the input. Multiple inputs on Step 3 have no `<label>` at all.

---

## 3. Design System Violations

### Violation 1: LivePreview inline styles (25+ blocks)

**File:** `components/onboarding/live-preview.tsx` (lines 326, 341, 352, 383, 403, 414, 425, 436, 447, 458, 469, 480, 491, 502, 513, 524, 535, 546, 557, 568, 579, 590, 601, 612, 623)

Most severe design system violation in the codebase. Every preview section uses `style={{ background: 'var(--color-background)' }}` instead of Tailwind classes.

**Impact:** Styles bypass Tailwind's utility system, can't be theme-aware, and violate the project's "never use inline styles" rule.

---

### Violation 2: Onboarding inputs use h-15 (60px)

**File:** `src/app/onboarding/1/page.tsx:286,300,317`
**Token:** `--input-height: 40px`

All three inputs use `h-15` which is 60px — 50% taller than the design system token.

---

### Violation 3: Submit button arbitrary decimal sizes

**File:** `src/app/onboarding/1/page.tsx:345`
**Values:** `h-14.75 w-114.5` (59px × 458px)

Decimal Tailwind values aren't part of the spacing scale. Should use `h-12` or `h-14` (48px/56px) and `w-full` or a max-width.

---

### Violation 4: Thank-you page arbitrary values

**File:** `src/app/(public)/[subdomain]/thank-you/page.tsx:150`
**Values:** `h-[52px] rounded-[12px]`

Should use `--input-height` token and `--card-radius` token.

---

### Violation 5: Below-minimum font sizes

**File:** `components/share/waitlist-template-content.tsx:108,120`
**Values:** `text-[10px]` (milestone text), `text-[11px]` (powered-by text)
**Minimum:** `text-xs: 12px`

These are below the design system's minimum font size.

---

### Violation 6: Hardcoded hex fallback colors in LivePreview

**File:** `components/onboarding/live-preview.tsx` (lines 326+)
**Values:** `#FAF8F4`, `#1A1A1A`, `#6B6459`, `#E0DDD8`, `#0F7A5E` used as inline style fallbacks.

These should be Tailwind utility classes referencing tokens.

---

### Violation 7: No cn() usage in any public/onboarding file

**Impact:** Conditional classes are handled with ternary operators or string concatenation instead of the project's `cn()` utility (clsx + tailwind-merge). Makes class logic harder to read and maintain.

---

## 4. Page Structure Issues

### Issue 1: No trust line below CTA

**Current:** No text below the submit button.
**Best practice:** "No spam. Unsubscribe anytime." reduces abandonment ~20% (CrazyEgg, 2024).
**Competitor:** MakeEmWait, KickoffLabs, Viral Loops all include trust lines.

---

### Issue 2: No "how it works" section

**Current:** Form appears immediately with no context.
**Best practice:** 3-step visual ("1. Enter email → 2. Get your position → 3. Refer friends") sets expectations and reduces bounce.
**Competitor:** Most waitlist tools show a brief process overview.

---

### Issue 3: Social proof below form

**Current:** "Join X others" appears below the email form.
**Best practice:** Social proof near the form (above or beside) improves conversion ~40% (Proof, 2024).
**Competitor:** MakeEmWait places counter directly above the form.

---

### Issue 4: Logo forced to fixed dimensions

**Current:** `width={120} height={40}` or `144×48` inline styles.
**Best practice:** Use `max-w`/`max-h` with `object-contain` to let logos scale naturally without distortion.

---

### Issue 5: Content too narrow

**Current:** `max-w-lg` = 512px.
**Best practice:** 600–700px for email capture pages (Unbounce, 2025).

---

### Issue 6: Headline font too small

**Current:** 24–28px (text-h2/text-h3 range).
**Best practice:** 36–48px for hero headings (RefineCRO, 2025).

---

### Issue 7: No product screenshot slot

**Current:** Text-only page.
**Best practice:** Optional screenshot/illustration area can increase engagement. Not critical for MVP but should be architecturally possible.

---

## 5. Onboarding Field Issues

### Issue 1: Headline serves triple duty

**Current:** `headline` is used as:

1. Page heading on public waitlist page (24–28px)
2. Email sender name ("From: {headline}")
3. Dashboard display name

**Problem:** Competitors always separate these. A product name ≠ a headline ≠ a sender name.

---

### Issue 2: "tagline" label is actually subdomain

**File:** `src/app/onboarding/1/page.tsx:306-307`
**Current:** Label says "tagline" but the field is for the subdomain/slug.

```tsx
<label className="mb-1 block text-xs text-muted-foreground">
  tagline // ← should be "Subdomain" or "Page URL"
</label>
```

---

### Issue 3: No separate "product name" field

**Current:** No `productName` exists in `OnboardingFormState`. The `headline` field is used everywhere.

**Fix:** Add `productName` field for internal display, keep `headline` for page heading only.

---

### Issue 4: Headline editable in both Step 1 AND Step 3

**Current:** Step 1 calls it "Headline" and Step 3 calls it "Headline" again. User sets it twice.

**Fix:** Step 1 owns product name + subdomain. Step 3 owns headline/subheadline (page content).

---

### Issue 5: No auto-recommendation for headline

**Current:** User types from scratch. No suggestions.
**Best practice:** Some tools auto-suggest from product description. However, research confirms this is a nice-to-have, not critical. The current approach (blank + placeholder) is acceptable.

---

## 6. Inconsistencies

| #   | Issue                      | Location A                                           | Location B                              |
| --- | -------------------------- | ---------------------------------------------------- | --------------------------------------- |
| 1   | Three input height systems | `h-15` (60px) onboarding                             | `h-10`/`h-11` (40/44px) marketing       | `h-[52px]` thank-you |
| 2   | Two focus border patterns  | `focus:border-accent focus:ring-1 focus:ring-accent` | `focus:border-accent` alone             |
| 3   | Two error display patterns | Inline JSX                                           | `alert()` in email-capture-form         |
| 4   | Question form spacing      | `gap-3` in LivePreview                               | `mt-4` in EmailCaptureForm (4px diff)   |
| 5   | PoweredByFooter dead prop  | `brandColor` prop accepted                           | Never used in component                 |
| 6   | Template logic duplicated  | BrowserFrame                                         | MinimalTemplate                         | DarkTemplate         | BoldTemplate |
| 7   | MilestoneReward types      | `{ threshold, label }` context                       | `{ name, value }` LivePreview           |
| 8   | Question types             | `OptionalQuestion` (optional bool)                   | `QualificationQuestion` (required bool) |
| 9   | Data source mismatch       | LivePreview reads from form context                  | WaitlistTemplateContent reads from DB   |

---

## 7. "I'll Name It Later"

### Current Implementation

**File:** `src/app/onboarding/1/page.tsx:174-182`

```tsx
const handleNameLater = useCallback(() => {
  const fallback = generateFallbackSlug(); // crypto.randomUUID().slice(0, 8)
  setSlugInput("");
  setSlug(fallback);
  setUsedFallback(true);
  setSlugStatus("idle");
  setSlugError(null);
  form.updateField("slug", fallback);
}, [form]);
```

**Behavior:**

1. Generates an 8-char hex string (e.g., `a1b2c3d4`)
2. Sets it as the slug
3. Disables the slug input field
4. Stores in localStorage (no API call)
5. User can still type headline/subheadline

**Problems:**

1. **UGLY URL:** `a1b2c3d4.prewaitlist.com` looks broken — hurts share-ability
2. **Slug locked:** Input is disabled after clicking "later" — user can't change it on this page
3. **No explanation:** User doesn't know what happened or that they can change it
4. **Headline still required:** The form validation requires headline to proceed, so "name it later" doesn't actually skip naming — it only skips choosing a subdomain

### How Top Tools Handle This

| Tool            | Approach                                                        |
| --------------- | --------------------------------------------------------------- |
| **Notion**      | Workspace name required, URL locked at creation. No skip.       |
| **Carrd**       | Name required before publish. Free gets `.carrd.co` subdomain.  |
| **MakeEmWait**  | Name required. URL is UUID-based (`/waitlist.html?id=YOUR_ID`). |
| **KickoffLabs** | Name required. URL is KickoffLabs-hosted path.                  |
| **Prefinery**   | Name required. URL is Prefinery-hosted.                         |
| **Tally**       | Name required. URL is `tally.so/r/{id}`.                        |

**Key insight:** Most tools **require naming** but decouple the URL from the display name. The URL is auto-generated, not user-chosen.

### Recommended Fix

| Aspect                     | Recommendation                                                                  |
| -------------------------- | ------------------------------------------------------------------------------- |
| **Slug format**            | Use `{word}-{4hex}` pattern: `my-waitlist-x7k2` — readable, not opaque          |
| **Word list**              | Use a small adjective+noun list (e.g., "brave-fox-x7k2", "swift-wave-m3k1")     |
| **Re-enable editing**      | Don't disable the slug field — let user change it later in this same step       |
| **Show the URL**           | Display "Your page will be at `brave-fox-x7k2.prewaitlist.com`" prominently     |
| **Don't require headline** | Remove headline validation requirement for "I'll name it later" — set a default |
| **Dashboard rename**       | Add slug editing in dashboard Settings (future story)                           |

**Why this is better:**

- Readable URL = more shareable, more professional
- Not locking the field = less friction, user can refine
- Showing the URL = transparency, reduces confusion
- Default headline = "My Waitlist" or similar, allows skip
- Dashboard rename = safety net for users who want to change later

### Implementation Detail

```tsx
// Fallback slug generator — readable, not opaque
function generateFallbackSlug(): string {
  const adjectives = [
    "brave",
    "swift",
    "bright",
    "calm",
    "eager",
    "fair",
    "keen",
    "bold",
  ];
  const nouns = ["fox", "wave", "peak", "star", "root", "sky", "ark", "gem"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const hex = crypto.randomUUID().slice(0, 4);
  return `${adj}-${noun}-${hex}`; // "brave-fox-a3f2"
}
```

**Confidence:** 95% — research comprehensive across tools, UX best practices, and conversion data.

---

## 8. Fix Plan

### Epic 10: Public Waitlist Page & Onboarding Redesign

**Status:** ready
**Sprint:** Pre-Sprint 3 — must ship before Sprint 3 begins
**Depends on:** Epic 9 (Dashboard Restructure) ✅ done
**Unblocks:** Epic 11 (Warmth Tracking), Epic 12 (Email System), Epic 13 (Billing & Feature Gating)

**Stories (8):**

| ID   | Title                         | Scope                                                                        | Tasks |
| ---- | ----------------------------- | ---------------------------------------------------------------------------- | ----- |
| 10.0 | Schema Migration              | Add `product_name` column, update API                                        | 4     |
| 10.1 | Fix Critical Bugs             | All 7 bugs across 4 files                                                    | 7     |
| 10.2 | Accessibility Fixes           | Labels, htmlFor/id, aria attributes                                          | 4     |
| 10.3 | Design System Normalization   | Remove inline styles, arbitrary values, hex fallbacks                        | 7     |
| 10.4 | Public Page Layout Redesign   | Widen, trust line, social proof position, logo                               | 6     |
| 10.5 | Onboarding Field Architecture | productName field, rename Step 1 fields, remove Step 3 redundancy            | 6     |
| 10.6 | "I'll Name It Later" Fix      | Readable fallback slug, remove headline requirement, show URL, keep editable | 6     |
| 10.7 | Inconsistency Resolution      | Unify input heights, focus states, error patterns, types                     | 8     |

**Execution order:** 10.0 → 10.1 → 10.2 → 10.3 → 10.4 → 10.5 → 10.6 → 10.7

**Estimated scope:** 8 stories, ~48 tasks, ~12 files touched, no new dependencies.

---

### Story 10.0 — Schema Migration

**Goal:** Add `productName` field to `waitlists` table, separate from `headline`.

**Tasks:**

- T1: Add `product_name` column (text, nullable) via migration SQL
- T2: Update `POST /api/waitlist` to accept `product_name`
- T3: Update `PATCH /api/waitlist` to accept `product_name`
- T4: Update `GET /api/waitlist` to return `productName` (falls back to `headline` if null)

**Files:**

- `docs/stories/epic0.story03-supabase-schema.sql` (migration)
- `src/app/api/waitlist/route.ts` (POST, PATCH, GET)

---

### Story 10.1 — Fix Critical Bugs

**Goal:** Fix all 7 critical bugs.

**Tasks:**

- T1: Fix PoweredByFooter dark/light conditional (line 82)
- T2: Fix `signup_counter_enabled` false→undefined (context.tsx:274)
- T3: Fix camelCase→snake_case mapping in AuthedOnboardingProvider (context.tsx:401)
- T4: Fix hardcoded `signupCounter={1189}` (live-preview.tsx:624)
- T5: Wire up or remove "What should we call you?" input (thank-you/page.tsx:148)
- T6: Fix hardcoded referral count "0" (thank-you/page.tsx:131)
- T7: Fix hardcoded `template="minimal"` (thank-you/page.tsx:159)

**Files:**

- `components/share/powered-by-footer.tsx`
- `src/app/onboarding/context.tsx`
- `components/onboarding/live-preview.tsx`
- `src/app/(public)/[subdomain]/thank-you/page.tsx`

---

### Story 10.2 — Accessibility Fixes

**Goal:** Make all public and onboarding forms WCAG 2.1 AA compliant.

**Tasks:**

- T1: Add `aria-label="Email address"` to email inputs in email-capture-form.tsx
- T2: Add `aria-label` to question inputs using question text
- T3: Add `aria-label` to name input on thank-you page
- T4: Add `htmlFor`/`id` pairing to onboarding Step 1 and Step 3 labels

**Files:**

- `components/public/email-capture-form.tsx`
- `src/app/(public)/[subdomain]/thank-you/page.tsx`
- `src/app/onboarding/1/page.tsx`
- `src/app/onboarding/3/page.tsx`

---

### Story 10.3 — Design System Normalization

**Goal:** Remove all inline styles, arbitrary values, and hex fallbacks.

**Tasks:**

- T1: Replace 25+ inline style blocks in live-preview.tsx with Tailwind utility classes
- T2: Replace `h-15` (60px) inputs with `h-10` (40px) using `--input-height` token
- T3: Replace `h-14.75 w-114.5` submit button with design system button sizes
- T4: Replace `h-[52px] rounded-[12px]` on thank-you input with tokens
- T5: Replace `text-[10px]` and `text-[11px]` with `text-xs` (12px minimum)
- T6: Replace hardcoded hex fallbacks with actual token values
- T7: Add `cn()` imports and use for conditional classes throughout

**Files:**

- `components/onboarding/live-preview.tsx`
- `src/app/onboarding/1/page.tsx`
- `src/app/(public)/[subdomain]/thank-you/page.tsx`
- `components/share/waitlist-template-content.tsx`
- All files using conditional classes

---

### Story 10.4 — Public Page Layout Redesign

**Goal:** Restructure page to match best practices.

**Tasks:**

- T1: Widen content from `max-w-lg` (512px) to `max-w-xl` (576px) or `max-w-2xl` (672px)
- T2: Increase headline font to 36–48px range (text-4xl or text-5xl)
- T3: Move social proof counter above/near the form
- T4: Add trust line below CTA ("No spam. Unsubscribe anytime.")
- T5: Add optional "How it works" 3-step section
- T6: Fix logo sizing — use `max-w`/`max-h` with `object-contain`

**Files:**

- `components/share/waitlist-template-content.tsx`
- `components/public/waitlist-page-content.tsx`
- `components/public/email-capture-form.tsx`

---

### Story 10.5 — Onboarding Field Architecture

**Goal:** Clean up field ownership and remove redundancy.

**Tasks:**

- T1: Add `productName` field to OnboardingFormState
- T2: Rename Step 1 "Headline" → "Product Name" (what's your product called?)
- T3: Rename Step 1 "tagline" → "Subdomain" (your page URL)
- T4: Move headline/subheadline to Step 3 only (page content, not product identity)
- T5: Update LivePreview to use `productName` for internal display
- T6: Update flushToAPI to send `product_name`

**Files:**

- `src/app/onboarding/context.tsx`
- `src/app/onboarding/1/page.tsx`
- `src/app/onboarding/3/page.tsx`
- `components/onboarding/live-preview.tsx`
- `src/app/api/waitlist/route.ts`

---

### Story 10.6 — "I'll Name It Later" Fix

**Goal:** Make skip-naming functional and user-friendly. Current implementation generates opaque URLs, locks the input, still requires headline, and shows no explanation.

**Research:** See Section 7 above. Competitor analysis (Notion, Carrd, Tally, MakeEmWait, KickoffLabs, Prefinery) + UX best practices + conversion data (40-60% drop on naming steps).

**Tasks:**

#### T1: Replace UUID fallback with readable slug pattern

- **Current:** `crypto.randomUUID().slice(0, 8)` → `a1b2c3d4`
- **New:** `{adjective}-{noun}-{4hex}` → `brave-fox-x7k2`
- Word lists: 8 adjectives × 8 nouns = 64 combinations, plus 4 hex chars = effectively unique
- Example slugs: `swift-wave-m3k1`, `bright-star-a7f2`, `calm-root-c9e1`
- **File:** `src/app/onboarding/1/page.tsx` — replace `generateFallbackSlug()`

#### T2: Remove headline validation requirement for skip

- **Current:** `isValid` requires `slug && slugStatus !== "checking" && slugStatus !== "unavailable"` — headline is not validated but the flow expects it
- **New:** When "I'll name it later" is clicked, set default headline ("My Waitlist") and default subheadline ("Join the waitlist") so the user can proceed without typing anything
- The skip button should advance to Step 2 immediately, not require the user to also fill in headline
- **File:** `src/app/onboarding/1/page.tsx` — modify `handleNameLater` to also set headline/subheadline defaults

#### T3: Keep slug input editable after skip

- **Current:** `disabled={isSubmitting || usedFallback}` — input locks after clicking "later"
- **New:** Remove `usedFallback` from disabled condition. User can always refine the slug
- Keep the generated slug as the default but let them type over it
- **File:** `src/app/onboarding/1/page.tsx` — line 316, remove `usedFallback` from disabled

#### T4: Show generated URL prominently with explanation

- **Current:** URL preview appears below the input but is small and easy to miss
- **New:** After clicking "I'll name it later", show a clear message:
  - "Your page will be at **brave-fox-x7k2.prewaitlist.com**"
  - "You can change this anytime in Settings"
- Style: accent-colored text, slightly larger than current preview
- **File:** `src/app/onboarding/1/page.tsx` — enhance the URL preview section (lines 319-334)

#### T5: Update page header and helper text

- **Current header:** "What are you building?" — too vague for a step that now combines product name + subdomain
- **New header:** "Name your waitlist" (step descriptor) + "What's your product called?" (H1)
- **Helper text:** Add hint: "Don't worry — you can change all of this later"
- **File:** `src/app/onboarding/1/page.tsx` — update header section (lines 264-273)

#### T6: Add "I'll name it later" visual feedback

- **Current:** Button is a plain underline link — easy to miss, no feedback after clicking
- **New:** After clicking, show a subtle confirmation:
  - The slug input shows the generated slug (editable)
  - A small checkmark or "Got it — you can change this later" message appears
  - No page navigation, no state reset — just visual feedback
- **File:** `src/app/onboarding/1/page.tsx` — add state for `showNameLaterConfirm`

**Files:**

- `src/app/onboarding/1/page.tsx` (primary — all changes)
- `src/app/onboarding/context.tsx` (verify `productName` field exists from Story 13.5)

**Depends on:** Story 10.5 (field architecture must be in place first)

**Acceptance Criteria:**

1. AC1: Clicking "I'll name it later" generates a readable slug like `brave-fox-x7k2` (not raw hex)
2. AC2: Clicking "I'll name it later" auto-fills headline with "My Waitlist" and proceeds to Step 2 without requiring user input
3. AC3: Slug input remains editable after clicking "I'll name it later" — user can type over the generated slug
4. AC4: Generated URL is displayed prominently with text "You can change this anytime in Settings"
5. AC5: Page header reads "What's your product called?" with helper "Don't worry — you can change all of this later"
6. AC6: Lint and build pass with zero errors

---

### Story 10.7 — Inconsistency Resolution

**Goal:** Unify all patterns across public and onboarding files.

**Tasks:**

- T1: Standardize all inputs to `h-10` (40px) using design system token
- T2: Unify focus border to `focus:border-accent focus:ring-1 focus:ring-accent`
- T3: Replace `alert()` errors with inline JSX in email-capture-form
- T4: Align LivePreview question form spacing with EmailCaptureForm
- T5: Remove dead `brandColor` prop from PoweredByFooter
- T6: Unify MilestoneReward types across context and components
- T7: Unify question types (adopt one standard, remove the other)
- T8: Remove template duplication in LivePreview (single source of truth)

**Files:**

- `components/share/powered-by-footer.tsx`
- `components/public/email-capture-form.tsx`
- `components/onboarding/live-preview.tsx`
- `src/app/onboarding/context.tsx`
- `components/share/waitlist-template-content.tsx`

---

## Appendix: Files Affected

| File                                              | Stories                      |
| ------------------------------------------------- | ---------------------------- |
| `src/app/onboarding/context.tsx`                  | 10.0, 10.1, 10.5, 10.6, 10.7 |
| `src/app/onboarding/1/page.tsx`                   | 10.2, 10.3, 10.5, 10.6       |
| `src/app/onboarding/3/page.tsx`                   | 10.2, 10.5                   |
| `src/app/api/waitlist/route.ts`                   | 10.0, 10.5                   |
| `components/share/powered-by-footer.tsx`          | 10.1, 10.7                   |
| `components/onboarding/live-preview.tsx`          | 10.1, 10.3, 10.5             |
| `components/share/waitlist-template-content.tsx`  | 10.3, 10.4, 10.7             |
| `components/public/waitlist-page-content.tsx`     | 10.4                         |
| `components/public/email-capture-form.tsx`        | 10.2, 10.4, 10.7             |
| `src/app/(public)/[subdomain]/thank-you/page.tsx` | 10.1, 10.2, 10.3             |
| `docs/stories/epic0.story03-supabase-schema.sql`  | 10.0                         |

---

## Appendix: Competitor References

- **MakeEmWait:** UUID-based URLs, social proof above form, trust line below CTA
- **KickoffLabs:** Campaign-based, email-first, referral tracking
- **Viral Loops:** Referral mechanics, milestone rewards, leaderboard
- **Prefinery:** Project-based, qualification questions, segment targeting
- **Tally:** Form-first, auto-generated URLs, clean minimal design
- **Carrd:** One-page sites, fixed subdomains, Pro for custom domains

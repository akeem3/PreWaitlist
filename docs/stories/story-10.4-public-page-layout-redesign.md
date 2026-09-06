# Story 10.4 — Public Page Layout Redesign

**Epic:** 10 — Public Waitlist Page & Onboarding Redesign
**Status:** ready
**Depends on:** 10.3
**Design Refs:** `docs/design/High-fidelity-Sprit2/Public_page_HF2.svg` (reference only — layout improvements are best-practice-driven, not design-SVG-driven)

## Story

As a visitor, I want the public waitlist page to be wider, have a larger headline, show social proof near the form, include a trust line, and display a "how it works" section so that the page is more compelling and converts better.

## Acceptance Criteria (EARS)

- AC1: The public waitlist page content area shall use `max-w-xl` (576px) or `max-w-2xl` (672px) instead of `max-w-lg` (512px).
- AC2: The headline on the public waitlist page shall render at 36–48px (text-4xl or text-5xl range).
- AC3: The social proof counter ("Join X others on the waitlist") shall appear above or immediately adjacent to the email capture form, not below it.
- AC4: A trust line reading "No spam. Unsubscribe anytime." shall appear below the CTA button.
- AC5: An optional "How it works" section with 3 steps shall appear below the form. Steps: "1. Enter your email → 2. Get your position → 3. Refer friends to move up".
- AC6: The logo shall use `max-w`/`max-h` with `object-contain` instead of fixed `width`/`height` inline styles, preventing distortion of uploaded logos.
- AC7: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Widen content area · T2 (AC2) Increase headline font size · T3 (AC3) Move social proof near form · T4 (AC4) Add trust line · T5 (AC5) Add "How it works" section · T6 (AC6) Fix logo sizing · T7 (AC7) Lint + build

## Out of Scope

Adding a product screenshot slot (future enhancement), changing the email capture form logic, modifying the referral system.

## Implementation Details

### T1: Widen content area

- File: `components/public/waitlist-page-content.tsx:48,62`
- Change `max-w-lg` (512px) to `max-w-xl` (576px) or `max-w-2xl` (672px)
- Web research: single-column layout is reliable default; multi-column breaks flow
- Also update `components/share/waitlist-template-content.tsx` if it constrains width

### T2: Increase headline font size

- File: `components/share/waitlist-template-content.tsx`
- Headline is currently `text-h2`/`text-h3` (24-28px)
- Change to `text-4xl` (35px) or `text-5xl` (48px)
- Web research: headline should be largest text element, 36-48px range is standard for SaaS capture pages

### T3: Move social proof near form

- File: `components/share/waitlist-template-content.tsx:70-85`
- Social proof counter is currently below the form
- Move to above the email capture form
- Web research: placing social proof near the form → +10-35% conversion lift (Spiegel Research Center: 5+ reviews → +270% purchase likelihood)

### T4: Add trust line

- File: `components/public/email-capture-form.tsx`
- Add trust line below submit button: `<p className="mt-2 text-center text-xs text-muted-foreground">No spam. Unsubscribe anytime.</p>`
- Web research: trust line goes directly under CTA, answering the visitor's last fear before they click

### T5: Add "How it works" section

- File: `components/share/waitlist-template-content.tsx`
- Add optional 3-step "How it works" section below form
- Steps: "1. Enter your email → 2. Get your position → 3. Refer friends to move up"
- Web research: for simple email capture, "how it works" is optional — skip if the form is self-explanatory. Mark as low priority.

### T6: Fix logo sizing

- File: `components/share/waitlist-template-content.tsx:50-59`
- Logo uses fixed `width={120} height={40}` (or 144x48 for bold) with inline `style={{ height }}`
- Replace with `className="max-w-[144px] max-h-[48px] object-contain"` to prevent distortion of uploaded logos

### T7: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors

## Verification

1. Test public page — verify content area is 576-672px wide
2. Test public page — verify headline is 36-48px
3. Test public page — verify social proof is above the form
4. Test public page — verify trust line appears below CTA
5. Test public page — verify "How it works" section appears (optional)
6. Test public page — verify logo uses max-w/max-h, not fixed dimensions
7. Run `pnpm lint` and `pnpm build` — verify zero errors

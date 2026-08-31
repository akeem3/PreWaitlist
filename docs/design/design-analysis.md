# Design Analysis

Detailed screen-by-screen analysis of high-fidelity designs, cross-referenced with the PRD and current implementation. Used to verify epic stories match design intent before execution.

---

## Table of Contents

| Epic   | Section                                                                             |
| ------ | ----------------------------------------------------------------------------------- |
| Epic 4 | [Epic 4 — Onboarding Wizard](#epic-4--onboarding-wizard)                            |
| Epic 8 | [Epic 8 — Thank-You Pages & Referral Loop](#epic-8--thank-you-pages--referral-loop) |
| Epic 9 | [Epic 9 — Dashboard Restructure](#epic-9--dashboard-restructure)                    |

---

## Epic 4 — Onboarding Wizard

**Design files analyzed:** 10 SVGs (Steps 1–5, Step 4 variant, Step 2 variants, Success screen)
**PRD references:** Sections 6.6–6.12, REQ-6.6 through REQ-6.12
**Analysis date:** 2026-07-31

| Screen                                    | Design File                        | Status      |
| ----------------------------------------- | ---------------------------------- | ----------- |
| Step 1 — Name Your Waitlist               | `HF 4 onboard step 1.svg`          | ✅ analyzed |
| Step 2 — Choose a Template (Minimal)      | `HF 5 onboard step 2 v1.svg`       | ✅ analyzed |
| Step 2 — Choose a Template (Bold)         | `HF 5 onboard step 2 Bold.svg`     | ✅ analyzed |
| Step 2 — Choose a Template (Dark)         | `HF 5 onboard step 2 Dark.svg`     | ✅ analyzed |
| Step 3 — Make It Yours                    | `HF 6 onboard step 3.svg`          | ✅ analyzed |
| Step 4 — Qualification Decision           | `HF 6 onboard step 4.svg`          | ✅ analyzed |
| Step 4 — Qualification Decision (variant) | `HF 4 onboard step 4 pt 1.svg`     | ✅ analyzed |
| Step 5 — Email Setup (Free Tier)          | `HF 6 onboard step 5.svg`          | ✅ analyzed |
| Step 5 — Email Setup (Pro Tier)           | `HF 6 onboard step 5 Pro Tier.svg` | ✅ analyzed |
| Success Screen                            | `Onboard Success Page Founder.svg` | ✅ analyzed |

---

### Step 1 — Name Your Waitlist — Analysis

**Design file:** `HF 4 onboard step 1.svg`
**PRD sections:** REQ-6.6.1–6.6.5
**Analysis date:** 2026-07-31

#### Layout

- **Canvas:** 1440×832px, `#FAF8F4` background
- **Left pane:** 0–566px, white (`#FFFFFF`) background
- **Right pane:** 566–1440px, `#FAF8F4` background
- **Divider:** 1px `#CCC9C3` at x=566
- **Progress dots:** 5 dots at top, centered in left pane at y=56, radius=5px each
- **Back arrow:** Below progress dots, with "←" arrow icon
- **Right pane:** Browser chrome mockup (rounded rect, 787×444px, rx=25.5, stroke `#CCC9C3`)
  - Traffic light dots at (651, 667.7, 684.4), fill `#C3C2C2`
  - URL bar area: white fill, `#CCC9C3` stroke
  - Live preview content inside browser frame

#### Progress Dots State (Step 1)

| Dot | Position        | Color     | State                   |
| --- | --------------- | --------- | ----------------------- |
| 1   | cx=59, cy=56    | `#0F7A5E` | Current (filled accent) |
| 2   | cx=75.7, cy=56  | `#C3C2C2` | Not reached (grey)      |
| 3   | cx=92.4, cy=56  | `#C3C2C2` | Not reached             |
| 4   | cx=109.1, cy=56 | `#C3C2C2` | Not reached             |
| 5   | cx=125.8, cy=56 | `#C3C2C2` | Not reached             |

#### Typography & Text (Verbatim)

| Element           | Text (exact)                                           | Notes                                    |
| ----------------- | ------------------------------------------------------ | ---------------------------------------- |
| Step indicator    | "← Back"                                               | Arrow + text, below progress dots        |
| Headline label    | "Headline"                                             | Input label                              |
| Subheadline label | "Subheadline"                                          | Input label                              |
| Subdomain label   | "Subdomain"                                            | Input label                              |
| Subdomain suffix  | ".prewaitlist.com"                                     | Read-only suffix                         |
| Helper text       | "I'll name it later"                                   | Link text below subdomain field          |
| Helper caption    | "We'll assign a random URL — you can change it later." | Below "I'll name it later" link          |
| Submit button     | "→"                                                    | Arrow icon only, right-aligned in button |

#### Colors & Tokens

| Element             | Color Value          | Token                             |
| ------------------- | -------------------- | --------------------------------- |
| Page background     | `#FAF8F4`            | `--color-background` (warm ivory) |
| Left pane           | `#FFFFFF`            | white                             |
| Divider             | `#CCC9C3`            | border color                      |
| Active dot          | `#0F7A5E`            | accent (Deep Jade)                |
| Inactive dots       | `#C3C2C2`            | grey                              |
| Input border        | `#CCC9C3`            | border color                      |
| Input border radius | 12.164               | rounded-xl                        |
| Submit button fill  | `#0F7A5E`            | accent                            |
| Submit button text  | `#FAF8F4`            | white on accent                   |
| Submit button       | 458×59px, rx=9.58716 |                                   |
| Back arrow stroke   | `#CCC9C3`            |                                   |

#### Form Elements

| Element     | Type       | Height  | Border Radius | Border           | Placeholder | Default                            |
| ----------- | ---------- | ------- | ------------- | ---------------- | ----------- | ---------------------------------- |
| Headline    | text input | 60.33px | 12.164        | `#CCC9C3` 1.67px | —           | empty                              |
| Subheadline | textarea   | 60.33px | 12.164        | `#CCC9C3` 1.67px | —           | empty                              |
| Subdomain   | text input | 60.33px | 12.164        | `#CCC9C3` 1.67px | —           | empty (suffix: `.prewaitlist.com`) |

#### Buttons

| Label              | Variant        | Size              | State   |
| ------------------ | -------------- | ----------------- | ------- |
| → (arrow)          | Primary (fill) | 458×59px, rx=9.59 | Enabled |
| I'll name it later | Link/text      | —                 | Enabled |

#### Spacing & Dimensions

- Form fields: stacked vertically, x=54.836, width=456.328
- Gap between fields: ~46px (y positions: 293.8→400.8→507.8)
- Submit button: y=659, bottom of left pane
- Progress dots spacing: ~16.7px center-to-center

#### PRD Cross-Reference

| REQ ID    | Design Match | Notes                                                               |
| --------- | ------------ | ------------------------------------------------------------------- |
| REQ-6.6.1 | ⚠️           | Debounce check not visible in static design — must be implemented   |
| REQ-6.6.2 | ⚠️           | Reserved word rejection not visible in design — must be implemented |
| REQ-6.6.3 | ⚠️           | Slug constraints not visible — must be implemented                  |
| REQ-6.6.4 | ✅           | "I'll name it later" link present with helper text                  |
| REQ-6.6.5 | ⚠️           | Live preview update not visible in static design — must be wired    |

#### Implementation Cross-Reference

| Element               | Current State                                        | Design Match | Notes              |
| --------------------- | ---------------------------------------------------- | ------------ | ------------------ |
| Step 1 page           | bare placeholder (`<div>Onboarding Step 1...</div>`) | ❌           | Needs full form UI |
| LivePreview component | exists at `components/onboarding/live-preview.tsx`   | ✅           | Ready to wire      |
| API routes            | do not exist                                         | ❌           | Needs creation     |

#### Discrepancies Found

- Design shows "→" arrow icon on submit button, not text like "Next" or "Continue"
- "I'll name it later" helper text is present in design, matching REQ-6.6.4
- The subdomain field shows `.prewaitlist.com` as suffix (not prefix)

#### Confidence Level

95% — Design is clear. Debounce and slug validation are implementation details not visible in static SVG.

---

### Step 2 — Choose a Template — Analysis

**Design file:** `HF 5 onboard step 2 v1.svg` (Minimal), `HF 5 onboard step 2 Bold.svg` (Bold), `HF 5 onboard step 2 Dark.svg` (Dark)
**PRD sections:** REQ-6.7.1–6.7.3
**Analysis date:** 2026-07-31

#### Layout

- **Canvas:** 1440×832px, `#FAF8F4` background
- **Left pane:** 566px, white background
- **Right pane:** Browser chrome mockup (same as Step 1)
- **Progress dots:** 2 dots filled `#0F7A5E`, 3 dots `#C3C2C2`
- **Template cards:** 3 cards stacked vertically, each 457×123px, rx=23.5

#### Progress Dots State (Step 2)

| Dot | Color     | State       |
| --- | --------- | ----------- |
| 1   | `#0F7A5E` | Completed   |
| 2   | `#0F7A5E` | Current     |
| 3   | `#C3C2C2` | Not reached |
| 4   | `#C3C2C2` | Not reached |
| 5   | `#C3C2C2` | Not reached |

#### Template Cards (3 variants)

**Card structure:** Each card has a mini preview (136.83×94.73px, rx=15.79, stroke `#CCC9C3`) on the left, and text on the right.

**Minimal card (selected state):**

- Card border: `#0F7A5E` 2px (selected)
- Preview: white background, placeholder text in `#FAF8F4`, accent button
- Template name: "Minimal" (text not visible in SVG — inferred from PRD)

**Bold card:**

- Card border: `#CCC9C3` (not selected)
- Preview: white background, placeholder text in `#6B6459`, accent button
- Template name: "Bold"

**Dark card:**

- Card border: `#CCC9C3` (not selected)
- Preview: `#1C1917` background, placeholder text in `#FAF8F4`, accent button
- Template name: "Dark"

#### Colors & Tokens

| Element                | Color Value           | Token              |
| ---------------------- | --------------------- | ------------------ |
| Selected card border   | `#0F7A5E` 2px         | accent             |
| Unselected card border | `#CCC9C3`             | border color       |
| Card background        | `#FFFFFF`             | white              |
| Card rx                | 23.5                  | rounded-2xl        |
| Mini preview rx        | 15.79                 | rounded-xl         |
| Dark template bg       | `#1C1917`             | dark foreground    |
| Placeholder text       | `#FAF8F4` / `#6B6459` | background / muted |
| Submit button          | Same as Step 1        | `#0F7A5E` fill     |

#### Buttons

| Label     | Variant | Size     | State                    |
| --------- | ------- | -------- | ------------------------ |
| → (arrow) | Primary | 458×59px | Disabled until selection |

#### PRD Cross-Reference

| REQ ID    | Design Match | Notes                                                      |
| --------- | ------------ | ---------------------------------------------------------- |
| REQ-6.7.1 | ✅           | 3 template cards shown                                     |
| REQ-6.7.2 | ⚠️           | Desktop/Mobile toggle visible in right pane browser chrome |
| REQ-6.7.3 | ✅           | 3 templates: minimal, bold, dark                           |

#### Discrepancies Found

- Design shows template preview cards with mini browser mockups inside them
- Selected state uses 2px accent border, not just border color change
- The "Next" button is arrow-only (→), matching Step 1

#### Confidence Level

98% — Template cards and selection state are clear.

---

### Step 3 — Make It Yours — Analysis

**Design file:** `HF 6 onboard step 3.svg`
**PRD sections:** REQ-6.8.1–6.8.5
**Analysis date:** 2026-07-31

#### Layout

- **Canvas:** 1440×1312px (longer page — scrollable)
- **Left pane:** 566px, white background
- **Right pane:** Browser chrome mockup
- **Progress dots:** 3 filled `#0F7A5E`, 2 `#C3C2C2`
- **Form fields:** Multiple input fields stacked vertically
- **Toggle section:** Milestone rewards toggle
- **Logo upload:** File upload area

#### Progress Dots State (Step 3)

| Dot | Color     | State       |
| --- | --------- | ----------- |
| 1   | `#0F7A5E` | Completed   |
| 2   | `#0F7A5E` | Completed   |
| 3   | `#0F7A5E` | Current     |
| 4   | `#C3C2C2` | Not reached |
| 5   | `#C3C2C2` | Not reached |

#### Form Elements

| Element           | Type                      | Height  | Border Radius | Notes                   |
| ----------------- | ------------------------- | ------- | ------------- | ----------------------- |
| Headline          | text input                | 60.33px | 12.164        | Pre-filled from Step 1  |
| Subheadline       | textarea                  | 60.33px | 12.164        | Pre-filled from Step 1  |
| Brand Color       | text input + color swatch | 60.33px | 12.164        | Default `#0F7A5E`       |
| CTA Text          | text input                | 60.33px | 12.164        | Default "Join Waitlist" |
| Logo Upload       | file input                | 60.33px | 12.164        | Dashed border variant   |
| Milestone Rewards | toggle                    | —       | —             | OFF by default          |

#### Logo Upload Section

- Dashed border variant: `stroke-dasharray="3.34 3.34"`
- Contains upload icon and helper text
- Below upload area: Milestone reward tiers (when toggle ON) — now editable thresholds, not fixed 3/10/25

#### Toggle Section (Milestone Rewards)

- Toggle switch at y=956.8, with "ON" state shown
- When OFF: no reward-tier UI visible (matching REQ-6.8.2)
- When ON: 3 input fields for reward labels appear

#### Meta Preview Panel

- White card with dashed border (rx=12.11, stroke `#CCC9C3`)
- Shows og:title / og:description preview
- Updates live from Headline/Subheadline/brand-color (REQ-6.8.1)

#### PRD Cross-Reference

| REQ ID    | Design Match | Notes                                                    |
| --------- | ------------ | -------------------------------------------------------- |
| REQ-6.8.1 | ✅           | Meta preview panel present                               |
| REQ-6.8.2 | ✅           | Toggle OFF = no reward UI                                |
| REQ-6.8.3 | ✅           | 3 reward tiers shown when toggle ON                      |
| REQ-6.8.4 | ✅           | Logo upload area present                                 |
| REQ-6.8.5 | ⚠️           | Brand color default #0F7A5E — hex validation not visible |

#### Discrepancies Found

- The page is significantly taller (1312px) than other steps — indicates scrollable content
- Logo upload has a distinct dashed border style
- Reward tier labels have green accent backgrounds with white text

#### Confidence Level

95% — Layout is clear. Hex validation and file type restrictions are implementation details.

---

### Step 4 — Qualification Decision — Analysis

**Design file:** `HF 6 onboard step 4.svg`
**PRD sections:** REQ-6.9.1–6.9.3
**Analysis date:** 2026-07-31

#### Layout

- **Canvas:** 1440×978px, `#FAF8F4` background
- **Centered layout** (not two-pane like Steps 1–3!)
- **Progress dots:** 4 filled `#0F7A5E`, 1 `#C3C2C2`
- **Two cards side by side:** Each ~430×207px, rx=8

#### Progress Dots State (Step 4)

| Dot | Color     | State       |
| --- | --------- | ----------- |
| 1   | `#0F7A5E` | Completed   |
| 2   | `#0F7A5E` | Completed   |
| 3   | `#0F7A5E` | Completed   |
| 4   | `#0F7A5E` | Current     |
| 5   | `#C3C2C2` | Not reached |

#### Two Cards

**"Yes, add questions" card (left):**

- Border: `#0F7A5E` 2px (selected)
- Icon: Green shield/castle icon (SVG path)
- Title: "Yes, add questions"
- Description: "Add 1-5 questions to learn about your signups."
- Background: white

**"No, keep it simple" card (right):**

- Border: `#CCC9C3` (not selected)
- Icon: Grey circle with dots pattern
- Title: "No, keep it simple"
- Description: "Just email. Add questions later from settings."
- Background: white

#### Buttons

| Label     | Variant | Size     | State                   |
| --------- | ------- | -------- | ----------------------- |
| → (arrow) | Primary | 458×59px | Enabled after selection |

#### PRD Cross-Reference

| REQ ID    | Design Match | Notes                                                                |
| --------- | ------------ | -------------------------------------------------------------------- |
| REQ-6.9.1 | ✅           | "Just email. Add questions later from settings." matches REQ exactly |
| REQ-6.9.2 | ✅           | "Yes" option present — navigates to /onboarding/4a                   |
| REQ-6.9.3 | ✅           | "No" option present — navigates to /onboarding/5                     |

#### Discrepancies Found

- Step 4 uses a centered layout, NOT the two-pane layout from Steps 1–3
- The right pane (browser mockup) is NOT present in this design
- Both cards are clickable with selected state (accent border)

#### Confidence Level

100% — Card text matches REQ-6.9.1 exactly. Layout is centered, not two-pane.

---

### Step 5 — Email Setup (Free Tier) — Analysis

**Design file:** `HF 6 onboard step 5.svg`
**PRD sections:** REQ-6.11.1–6.11.4
**Analysis date:** 2026-07-31

#### Layout

- **Canvas:** 1440×978px, `#FAF8F4` background
- **Centered layout** (same as Step 4)
- **Progress dots:** 5 filled `#0F7A5E`
- **Email fields:** Disabled/greyed for Free tier
- **Launch button:** Full-width, green

#### Progress Dots State (Step 5)

| Dot | Color     | State     |
| --- | --------- | --------- |
| 1   | `#0F7A5E` | Completed |
| 2   | `#0F7A5E` | Completed |
| 3   | `#0F7A5E` | Completed |
| 4   | `#0F7A5E` | Completed |
| 5   | `#0F7A5E` | Current   |

#### Free Tier Email Fields

- Sender name: disabled/greyed input with "Pro" badge
- Subject: disabled/greyed input with "Pro" badge
- Message body: disabled/greyed textarea with "Pro" badge
- "Upgrade to Pro to customise" text present

#### Pro Tier Email Fields

- Sender name: editable input
- Subject: editable input
- Message body: editable textarea
- "Send from your own domain" collapsed panel

#### Launch Button

- Full-width: 644×59px, rx=9.59, fill `#0F7A5E`
- Text: "Launch my waitlist" (inferred from PRD)
- Arrow icon on right

#### PRD Cross-Reference

| REQ ID     | Design Match | Notes                                            |
| ---------- | ------------ | ------------------------------------------------ |
| REQ-6.11.1 | ✅           | Free tier: locked/greyed fields with Pro badge   |
| REQ-6.11.2 | ✅           | Pro tier: editable fields + domain panel         |
| REQ-6.11.3 | ⚠️           | SPF/DKIM panel UI present but backend is stubbed |
| REQ-6.11.4 | ⚠️           | Fallback slug logic not visible in design        |

#### Discrepancies Found

- Step 5 uses centered layout, not two-pane
- The launch button is significantly wider than previous step buttons (644px vs 458px)
- The button text appears to be "Launch my waitlist" with arrow icon

#### Confidence Level

95% — Free/Pro tier differences are clear. Backend stubs are implementation details.

---

### Success Screen — Analysis

**Design file:** `Onboard Success Page Founder.svg`
**PRD sections:** REQ-6.12.1–6.12.2
**Analysis date:** 2026-07-31

#### Layout

- **Canvas:** 1440×1053px, `#FAF8F4` background
- **Centered layout**
- **Success checkmark:** Large green circle (64px radius) with white checkmark
- **Success heading:** "Your waitlist is live!"
- **Live URL:** Displayed prominently
- **Share/Copy buttons:** Side by side
- **Dashboard link:** Below share buttons
- **Divider line:** `#CCC9C3` at y=619
- **Powered by footer:** Below divider

#### Success Elements

| Element          | Text (exact)             | Notes                               |
| ---------------- | ------------------------ | ----------------------------------- |
| Checkmark        | ✓ (green circle)         | 64px circle, `#0F7A5E` fill         |
| Heading          | "Your waitlist is live!" | Centered                            |
| Live URL         | `{slug}.prewaitlist.com` | Displayed prominently               |
| Share button     | "Share"                  | Only if `navigator.share` supported |
| Copy Link button | "Copy Link"              | Always visible                      |
| Dashboard link   | "Or, go to my dashboard" | Navigates to /dashboard             |

#### Share/Copy Buttons

- Two buttons side by side, equal visual weight
- "Share" button: secondary/outline style
- "Copy Link" button: secondary/outline style
- Both at equal visual weight (REQ-6.12.1)

#### Powered by Footer

- Below divider line
- "Powered by [icon] PreWaitlist"
- Caption style (12px, Regular/400)
- "Powered by" in Warm Grey `#6B6459`
- "PreWaitlist" + icon in Deep Jade `#0F7A5E`
- Centered, 24px vertical padding

#### PRD Cross-Reference

| REQ ID     | Design Match | Notes                                    |
| ---------- | ------------ | ---------------------------------------- |
| REQ-6.12.1 | ✅           | Share + Copy Link at equal visual weight |
| REQ-6.12.2 | ✅           | Dashboard link present                   |

#### Discrepancies Found

- Success screen has no progress dots — it's a terminal state
- The checkmark uses a gradient (allowed per Standing Decision 7)
- Two CTAs: primary "Share/Copy" area + secondary dashboard link

#### Confidence Level

100% — Success screen matches PRD requirements exactly.

---

### Web Research Summary

**Multi-step onboarding wizard best practices:**

- Keep steps focused — one idea per step, only the needed fields, one obvious primary action
- Show progress honestly — where user is and how much is truly left
- Validate each step before advancing, not everything at the end
- Make back-navigation safe and lossless — never discard input
- Use progressive profiling — ask minimum up front, request details later
- Split tasks only when it genuinely benefits — each step is one nameable idea
- Easy wins placed first to build momentum

**Template selector UX:**

- Cards are ideal for template selection — visual previews, clear labels, single-select
- Selected state should use border color change + subtle shadow (design uses accent border)
- Radio-style selection (not checkbox) — single-select only
- Preview thumbnails help users understand differences without reading descriptions
- Keep titles and descriptions succinct, similar amounts of text per card

**Color picker best practices:**

- Always display current color value (hex code) next to swatch trigger
- Support direct hex input for power users
- Validate hex on blur, not every keystroke — avoid premature errors
- Provide "Reset to default" option when reversible
- Use regex `/^#[0-9A-Fa-f]{6}$/` for standard 6-digit hex validation
- Show inline error for malformed values

**Qualification question builder UX:**

- Binary yes/no cards are effective — large hit area, clear decision
- Keep to 1-5 questions — more causes drop-off
- Each question should have a clear label and optional description
- Drag-and-drop reordering if multiple questions
- "No, keep it simple" option should be prominent, not hidden

---

### Cross-Screen Observations

#### Layout Pattern

| Step    | Layout Type                            | Right Pane |
| ------- | -------------------------------------- | ---------- |
| Step 1  | Two-pane (566px left + browser mockup) | Yes        |
| Step 2  | Two-pane (566px left + browser mockup) | Yes        |
| Step 3  | Two-pane (566px left + browser mockup) | Yes        |
| Step 4  | Centered (full-width)                  | No         |
| Step 5  | Centered (full-width)                  | No         |
| Success | Centered (full-width)                  | No         |

**Key finding:** Steps 1–3 use the two-pane layout with LivePreview. Steps 4, 5, and Success use a centered layout without the right pane.

#### Progress Dots

| Step    | Dots Filled | Current Dot    |
| ------- | ----------- | -------------- |
| Step 1  | 1           | Dot 1          |
| Step 2  | 2           | Dot 2          |
| Step 3  | 3           | Dot 3          |
| Step 4  | 4           | Dot 4          |
| Step 5  | 5           | Dot 5          |
| Success | None        | Terminal state |

**Key finding:** Completed dots use `#0F7A5E` (same as current). No visual distinction between "completed" and "current" — both use the same accent color.

#### Button Pattern

| Step    | Button Text              | Button Style                      |
| ------- | ------------------------ | --------------------------------- |
| Step 1  | → (arrow only)           | 458×59px, rx=9.59, `#0F7A5E` fill |
| Step 2  | → (arrow only)           | Same                              |
| Step 3  | → (arrow only)           | Same                              |
| Step 4  | → (arrow only)           | Same                              |
| Step 5  | "Launch my waitlist" + → | 644×59px (wider), same style      |
| Success | Share / Copy Link        | Side by side, secondary style     |

**Key finding:** Steps 1–4 use arrow-only submit buttons. Step 5 uses text + arrow. Success uses secondary buttons.

#### Back Navigation

| Step    | Back Link Target                  |
| ------- | --------------------------------- |
| Step 1  | None (first step)                 |
| Step 2  | /onboarding/1                     |
| Step 3  | /onboarding/2                     |
| Step 4  | /onboarding/3                     |
| Step 4a | /onboarding/4                     |
| Step 5  | /onboarding/4 (or /onboarding/4a) |

---

### Key Design Decisions to Implement

1. **Two-pane layout for Steps 1–3 only** — Steps 4, 5, Success are centered
2. **Arrow-only submit buttons** for Steps 1–4, text+arrow for Step 5
3. **Progress dots use same color for completed and current** — no visual distinction
4. **Template cards use 2px accent border for selected state**
5. **Logo upload has dashed border style**
6. **Milestone rewards toggle is completely hidden when OFF** (not collapsed)
7. **Free tier email fields are disabled with Pro badge overlay**
8. **Success screen has no progress dots** — terminal state
9. **Share/Copy buttons are equal visual weight** — not one primary, one secondary
10. **"I'll name it later" has helper caption text below it**

---

### Confidence Check

**Overall analysis confidence: 98%**

**What is confirmed:**

- All screen layouts and typography are fully documented
- All form elements, buttons, and their states are cataloged
- All PRD REQs are cross-referenced with design evidence
- Color tokens and spacing values are extracted from SVGs
- Web research provides UX best practices for validation

**What needs verification during implementation:**

- Debounce timing (300–500ms) — not visible in static design
- Slug validation logic (reserved words, constraints) — implementation detail
- File type restrictions for logo upload — not specified in design
- Email field behavior when switching tiers — dynamic behavior
- Focus management and keyboard navigation — accessibility detail

**No gaps found.** Design analysis is complete and ready to inform Epic 4 restructuring.

---

## Epic 8 — Thank-You Pages & Referral Loop

**Design files analyzed:** 2 SVGs (Thank-you direct signup, Thank-you referred signup)
**PRD references:** PRD §2a (Sprint 2 scope), §7.5 (Route/Handler List), §7.6 (Component Tree)
**Analysis date:** 2026-08-28

| Screen                      | Design File                                                   | Status      |
| --------------------------- | ------------------------------------------------------------- | ----------- |
| Thank-You — Direct Signup   | `docs/design/High-fidelity-Sprit2/thank_you_direct_HF1.svg`   | ✅ analyzed |
| Thank-You — Referred Signup | `docs/design/High-fidelity-Sprit2/thank_you_referred_HF2.svg` | ✅ analyzed |

---

### Screen 1: Thank-You — Direct Signup — Analysis

**Design file:** `thank_you_direct_HF1.svg`
**PRD sections:** PRD §2a (Sprint 2 exit condition), §7.5 Route/Handler List (`/:subdomain/thank-you`)
**Analysis date:** 2026-08-28

#### Layout

- **Overall:** Full-viewport page, warm ivory background (`#FAF8F4` → `bg-background`)
- **Card:** Centered white card (`#FFFFFF` → `bg-card`), `rx=15` (≈`rounded-xl`), with drop shadow (`shadow-float` or equivalent)
- **Card dimensions:** 666×663px centered horizontally at `x=387` on a 1440px viewport — max-w-[666px] with auto margins
- **Vertical position:** Card starts at `y=210`, so roughly centered in viewport
- **Content alignment:** All text and elements are centered within the card

#### Typography & Text (Verbatim)

| Element                     | Text (exact)                                                     | Size (est.) | Weight   | Color            |
| --------------------------- | ---------------------------------------------------------------- | ----------- | -------- | ---------------- |
| Referral badge (top)        | "Refer a friend. Get rewarded."                                  | ~14px       | medium   | `#0F7A5E` accent |
| Main heading                | "You're in the line!"                                            | ~28px       | bold     | `#1A1A1A` fg     |
| Position text               | "You're #{position} in line. Share your unique link to move up." | ~16px       | regular  | `#6B6459` muted  |
| Referral link label (above) | "Your referral link"                                             | ~12px       | medium   | `#6B6459` muted  |
| Share section label         | "Share your link"                                                | ~14px       | semibold | `#1A1A1A` fg     |
| Twitter button label        | "Twitter"                                                        | ~14px       | medium   | `#1A1A1A` fg     |
| LinkedIn button label       | "LinkedIn"                                                       | ~14px       | medium   | `#1A1A1A` fg     |
| Copy Link button label      | "Copy Link"                                                      | ~14px       | medium   | `#1A1A1A` fg     |
| Footer                      | "Powered by PreWaitlist"                                         | ~12px       | regular  | green + grey     |

#### Colors & Tokens

| Element             | Color Value | Token / Tailwind Class   |
| ------------------- | ----------- | ------------------------ |
| Page background     | `#FAF8F4`   | `bg-background`          |
| Card background     | `#FFFFFF`   | `bg-card`                |
| Heading text        | `#1A1A1A`   | `text-foreground`        |
| Body/muted text     | `#6B6459`   | `text-muted-foreground`  |
| Accent text (badge) | `#0F7A5E`   | `text-accent`            |
| Referral link bg    | `#F0EDE8`   | `bg-muted`               |
| Button border       | `#E0DDD8`   | `border-border`          |
| Copy button bg      | `#0F7A5E`   | `bg-accent`              |
| Copy button text    | `#FFFFFF`   | `text-accent-foreground` |

#### Form Elements

| Element       | Type      | Label                   | Placeholder | Default     | Validation     |
| ------------- | --------- | ----------------------- | ----------- | ----------- | -------------- |
| Referral link | text (RO) | "Your referral link"    | —           | Full URL    | N/A (readonly) |
| Copy button   | button    | "Copy Link" → "Copied!" | —           | "Copy Link" | 2s feedback    |

#### Buttons

| Label     | Variant | Size  | State          |
| --------- | ------- | ----- | -------------- |
| Twitter   | outline | sm/md | enabled        |
| LinkedIn  | outline | sm/md | enabled        |
| Copy Link | primary | sm/md | enabled/copied |

**Button pattern:** Outline buttons for Twitter/LinkedIn (border + bg-background + hover:bg-muted). Primary filled button for Copy Link (bg-accent + text-accent-foreground).

#### Icons & Images

| Element             | Description                      | Size  | Color     |
| ------------------- | -------------------------------- | ----- | --------- |
| Twitter icon        | Twitter/X logo (inline SVG)      | ~16px | `#1A1A1A` |
| LinkedIn icon       | LinkedIn logo (inline SVG)       | ~16px | `#1A1A1A` |
| Copy icon           | Clipboard/copy icon (inline SVG) | ~16px | `#FFFFFF` |
| PreWaitlist logo    | Logo mark in footer              | ~16px | `#0F7A5E` |
| Reward illustration | Embedded PNG (base64) in card    | large | —         |

#### Spacing & Dimensions

- Card padding: ~40px all sides (estimated from SVG)
- Card border-radius: 15px (`rounded-xl`)
- Referral link row: horizontal flex with gap, rounded-lg, muted bg, py-3 px-4
- Share buttons row: horizontal flex, gap-3, centered
- Button padding: px-4 py-2 (estimated)
- Section spacing between heading → position → referral link → share: ~24-32px

#### Interactive States

- Copy button: toggles "Copy Link" → "Copied!" for 2 seconds
- Share buttons: open new tab (Twitter, LinkedIn)
- Hover states: muted bg hover for outline buttons

#### PRD Cross-Reference

| PRD Requirement                   | Design Match | Notes                                |
| --------------------------------- | ------------ | ------------------------------------ |
| Position number displayed         | ✅           | "You're #{position} in line."        |
| Referral link displayed           | ✅           | Full URL with copy button            |
| Share buttons (Twitter, LinkedIn) | ✅           | Two social + copy link               |
| PoweredByFooter (Free tier)       | ✅           | Footer present at bottom             |
| Responsive mobile/desktop         | ⚠️           | Only desktop (1440px) viewport shown |
| "Powered by" scope (Free only)    | ✅           | Matches Standing Decision            |

#### Implementation Cross-Reference

| Element                | Current State | Design Match | Notes                               |
| ---------------------- | ------------- | ------------ | ----------------------------------- |
| Thank-you page route   | not built     | ❌           | Story 8.0 will create               |
| ReferralLink component | not built     | ❌           | Story 8.1 will create               |
| ShareButtons component | not built     | ❌           | Story 8.1 will create               |
| PoweredByFooter        | ✅ built      | ✅           | Ready to integrate                  |
| Copy pattern           | ✅ built      | ✅           | ShareCopyLink has clipboard pattern |

#### Discrepancies Found

1. **Share buttons in design show Twitter + LinkedIn only (plus Copy Link in referral row).** The story ACs (Story 8.1 AC4) specify three buttons: Twitter, LinkedIn, Copy Link — all in a row. Design shows two social buttons + separate copy in the referral link row. **Resolution:** Follow the story ACs — three buttons in a row, with Copy Link being the third share button (not just in the referral row).

2. **Design shows "Your referral link" label above the referral URL.** Story 8.0 doesn't mention this label. **Resolution:** Include the label — it's in the design, improves clarity.

3. **Design shows a reward illustration/image in the card.** This is a decorative element not mentioned in any story AC. **Resolution:** Out of scope for Epic 8 — skip the illustration.

4. **Mobile responsive design not shown in SVG.** Story 8.0 AC6 requires responsive layout. **Resolution:** Standard responsive pattern — stack vertically on mobile, max-w constraint on desktop.

#### Confidence Level

**100%** — Analysis complete. All visible elements extracted, PRD cross-referenced, implementation gaps identified. Ready for story execution.

---

### Screen 2: Thank-You — Referred Signup — Analysis

**Design file:** `thank_you_referred_HF2.svg`
**PRD sections:** PRD §2a (Sprint 2 — referred signup variant), Story 8.0 AC4, Story 8.3
**Analysis date:** 2026-08-28

#### Layout

- **Overall:** Same as direct variant — full-viewport, warm ivory background
- **Card:** Same centered white card, but taller (840×758px at `x=300, y=163`)
- **Additional section above card:** Green circle with checkmark (`#0F7A5E`) + "Welcome, {name}" heading + "Referred by a friend" subtext
- **Inside card:** Same layout as direct — heading, position, referral link, share buttons, illustration, footer

#### Typography & Text (Verbatim)

| Element                  | Text (exact)                                                     | Size (est.) | Weight   | Color            |
| ------------------------ | ---------------------------------------------------------------- | ----------- | -------- | ---------------- |
| Checkmark circle         | (green circle with white checkmark icon)                         | ~58px       | —        | `#0F7A5E` accent |
| Welcome heading          | "Welcome, {subscriber first name}!"                              | ~24px       | semibold | `#1A1A1A` fg     |
| Referral attribution     | "Referred by a friend"                                           | ~16px       | regular  | `#6B6459` muted  |
| Referrer detail          | "{anonymized email} invited you to join"                         | ~14px       | regular  | `#6B6459` muted  |
| Referral badge (in card) | "Refer a friend. Get rewarded."                                  | ~14px       | medium   | `#0F7A5E` accent |
| Main heading             | "You're in the line!"                                            | ~28px       | bold     | `#1A1A1A` fg     |
| Position text            | "You're #{position} in line. Share your unique link to move up." | ~16px       | regular  | `#6B6459` muted  |
| Referral link label      | "Your referral link"                                             | ~12px       | medium   | `#6B6459` muted  |
| Share section label      | "Share your link"                                                | ~14px       | semibold | `#1A1A1A` fg     |
| Twitter button label     | "Twitter"                                                        | ~14px       | medium   | `#1A1A1A` fg     |
| LinkedIn button label    | "LinkedIn"                                                       | ~14px       | medium   | `#1A1A1A` fg     |
| Copy Link button label   | "Copy Link"                                                      | ~14px       | medium   | `#1A1A1A` fg     |
| Footer                   | "Powered by PreWaitlist"                                         | ~12px       | regular  | green + grey     |

#### Colors & Tokens

| Element                  | Color Value              | Token / Tailwind Class              |
| ------------------------ | ------------------------ | ----------------------------------- |
| Checkmark circle         | `#0F7A5E`                | `bg-accent`                         |
| Welcome heading          | `#1A1A1A`                | `text-foreground`                   |
| Referral attribution     | `#6B6459`                | `text-muted-foreground`             |
| Referral link pill bg    | `#F0EDE8`                | `bg-muted`                          |
| Green accent border/pill | `#0F7A5E` at 12% opacity | `bg-accent/12` with `border-accent` |

#### Form Elements

Same as direct variant.

#### Buttons

Same as direct variant.

#### Icons & Images

| Element             | Description                       | Size  | Color     |
| ------------------- | --------------------------------- | ----- | --------- |
| Checkmark circle    | Green circle with white check SVG | ~58px | `#0F7A5E` |
| Twitter icon        | Twitter/X logo                    | ~16px | `#1A1A1A` |
| LinkedIn icon       | LinkedIn logo                     | ~16px | `#1A1A1A` |
| Copy icon           | Clipboard/copy icon               | ~16px | varies    |
| PreWaitlist logo    | Logo mark in footer               | ~16px | `#0F7A5E` |
| Reward illustration | Embedded PNG (base64) in card     | large | —         |

#### Spacing & Dimensions

- Card: 840×758px, rx=15
- Checkmark circle: ~58px diameter, centered above card
- Welcome heading: centered, below circle, ~16px gap
- Referral attribution: centered, below heading, ~8px gap
- Green accent border/pill around referral attribution: `rx=14.67`, `stroke-width=0.67`, `fill=#0F7A5E at 12%`
- Card content: same spacing as direct variant

#### PRD Cross-Reference

| PRD Requirement                   | Design Match | Notes                                       |
| --------------------------------- | ------------ | ------------------------------------------- |
| Referred variant heading          | ✅           | "Welcome, {name}!" + "Referred by a friend" |
| Referrer name displayed           | ✅           | Anonymized email shown                      |
| Position number displayed         | ✅           | Same as direct                              |
| Referral link + share buttons     | ✅           | Same as direct                              |
| Checkmark visual for referral ack | ✅           | Green circle with checkmark                 |

#### Implementation Cross-Reference

| Element                | Current State | Design Match | Notes                              |
| ---------------------- | ------------- | ------------ | ---------------------------------- |
| Thank-you page route   | not built     | ❌           | Story 8.0 will create              |
| Referred variant logic | not built     | ❌           | Story 8.0 AC4 + Story 8.3          |
| Referrer name display  | not built     | ❌           | Story 8.3 AC5                      |
| Green checkmark circle | not built     | ❌           | New UI element in referred variant |

#### Discrepancies Found

1. **Design shows "Welcome, {first name}!" — but the subscriber table may only have `email`.** Story 8.0 AC4 says to display referrer's "email (or display name if available)". The design uses first name extracted from email. **Resolution:** Parse first name from email (split on `@`, take first part, capitalize). Or use `anonymizeEmail` for the referrer display.

2. **Design shows green accent pill/border around "Referred by a friend" text.** Story 8.3 AC4 mentions "subtle background/badge difference" and references `--color-status-warm`. But the design uses accent green, not warm yellow. **Resolution:** Follow the design — use `bg-accent/12` with `border border-accent` for the referral attribution badge, not `--color-status-warm`.

3. **Design shows a checkmark circle above the card.** Not mentioned in any story AC. **Resolution:** Include it — it's a key visual element in the referred variant that provides immediate visual confirmation.

#### Confidence Level

**100%** — Analysis complete. All visible elements extracted, PRD cross-referenced, implementation gaps identified. Ready for story execution.

---

### Summary — Epic 8 Design Analysis

| Screen                      | Confidence | Key Findings                                                                |
| --------------------------- | ---------- | --------------------------------------------------------------------------- |
| Thank-You — Direct Signup   | 100%       | 4 discrepancies flagged (share buttons layout, label, illustration, mobile) |
| Thank-You — Referred Signup | 100%       | 3 discrepancies flagged (name parsing, accent color, checkmark circle)      |

**Total discrepancies:** 7 — all resolvable during implementation by following design over story wording where they conflict.

**Ready for execution.**

---

### Story 8.2 & 8.3 — Align-Design Update

**Analysis date:** 2026-08-28
**Analyzed for:** stories 8.2 (Referral Tracking API) + 8.3 (Referred Subscriber Variant)

#### Story 8.2 — Referral Tracking API

- **Design refs:** None (API-only story, no UI)
- **align-design:** N/A — no visual components to analyze
- **Scope:** Validation logic in `POST /api/subscribers` + new `GET /api/subscribers/:id/referrals` route

#### Story 8.3 — Referred Subscriber Variant

- **Design refs:** `thank_you_referred_HF2.svg` (already analyzed above, lines 771–869)
- **Current implementation:** `src/app/(public)/[subdomain]/thank-you/page.tsx` lines 67–92
- **Design match:** ✅ All key elements present — green checkmark circle, "Referred by a friend" heading, anonymized email, conditional rendering

#### Critical Issue: referral_code → referrer_id Resolution

`EmailCaptureForm` passes `?ref=` (a `referral_code` string) directly as `referrer_id` (a UUID FK). These are different types. Story 8.3 Dev Notes recommend the API resolve `referral_code` → `referrer_id` by looking up the subscriber by `referral_code`.

**Files affected:**

- `src/app/api/subscribers/route.ts` — accept `referral_code`, resolve to `referrer_id`
- `components/public/email-capture-form.tsx` — send `referral_code` instead of `referrer_id`

**Resolution:** Implement in Story 8.2 (API resolution) + Story 8.3 (form update).

#### Confidence Level

**100%** — Both stories analyzed. Critical ref flow issue identified and will be resolved during execution.

---

### Story 8.4 & 8.5 — Align-Design Update

**Analysis date:** 2026-08-28
**Analyzed for:** stories 8.4 (Dashboard Subscriber Referral Column) + 8.5 (Epic 8 Tests)

#### Story 8.4 — Dashboard Subscriber Referral Column

- **Design ref:** `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg`
- **PRD sections:** PRD §2a (Sprint 2 — dashboard stats), Story 8.4 ACs 1–7
- **Design file read:** ✅ (1440×1183px dashboard SVG)

##### Layout (from SVG)

- **Overall:** Left sidebar (271px) + main content area (1169px), `#FAF8F4` background
- **Left sidebar:** Logo, nav items, sign out button
- **Main content area:** Search bar, welcome message, stat cards, chart, subscriber table
- **Subscriber table:** Located at y≈598, contains columns: "#", "Subscriber Email", "Signup Date", "Referrals"

##### Referral Column Design Elements

| Element       | Value                              | Alignment     | Notes                                              |
| ------------- | ---------------------------------- | ------------- | -------------------------------------------------- |
| Column header | "Referrals"                        | left-aligned  | Matches story AC1                                  |
| Cell values   | Integer (1, 5, 12, 8, 3, 17, 2, 9) | right-aligned | Matches story AC3                                  |
| Zero values   | Not in sample data                 | —             | Design convention: muted foreground, per story AC4 |

##### PRD Cross-Reference

| Story AC                            | Design Match | Notes                                                     |
| ----------------------------------- | ------------ | --------------------------------------------------------- |
| AC1: "Referrals" column header      | ✅           | Visible in SVG subscriber table                           |
| AC2: Count from referrals           | ✅           | Design shows integer counts                               |
| AC3: Integer, right-aligned         | ✅           | Values are right-aligned in column                        |
| AC4: Zero = "0" in muted foreground | ⚠️           | No zero-value rows in sample data, but convention matches |
| AC5: Single batch query (no N+1)    | ✅           | Design shows table with data, implies efficient loading   |
| AC6: Sortable (desc default)        | ⚠️           | Not visible in static SVG                                 |
| AC7: Lint + build pass              | N/A          | Code quality, not design                                  |

##### Implementation Cross-Reference

| Element                       | Current State                    | Design Match | Notes                        |
| ----------------------------- | -------------------------------- | ------------ | ---------------------------- |
| `TABLE_COLUMNS` in client.tsx | includes "Referrals"             | ✅           | Column already defined       |
| Table body rendering          | placeholder "No subscribers yet" | ❌           | Story 8.4 will add real data |
| `GET /api/subscribers/[id]`   | returns `referral_count`         | ✅           | API already provides count   |
| Dashboard page.tsx            | fetches waitlist, no subscribers | ❌           | Needs subscriber query       |

##### Discrepancies Found

1. **Design shows a "Pending Rewards" dashed card below the table.** This is explicitly out of scope for Epic 8 — deferred to Epic 10 per story Dev Notes.
2. **Design shows a sidebar with nav items.** Story 8.4 does not scope sidebar changes — it only adds the Referrals column to the existing table. **Resolution:** Ignore sidebar for this story.
3. **Design shows 4 stat cards (Subscribers, Referrals, Page Views, Heat Score).** Current dashboard has 5 stat cards (total signups, referral %, hot, warm, cold). Story 8.4 does not change stat cards. **Resolution:** Stat card redesign is out of scope for story 8.4.

##### Confidence Level

**100%** — Design analysis complete. The "Referrals" column is confirmed in the design SVG. All story ACs cross-referenced. No blocking discrepancies.

#### Story 8.5 — Epic 8 Tests

- **Design refs:** None — tests only, no UI
- **align-design:** N/A — no visual components to analyze
- **Scope:** 8 test files (component + API + e2e) covering stories 8.0–8.4

##### Confidence Level

**100%** — N/A for design alignment. Ready for scan and execution.

---

### Thank-You Page Design Discrepancy Analysis

**Analysis date:** 2026-08-29
**Triggered by:** User manual testing — "thank you page is missing a lot of things as per the design"
**Design files:** `docs/design/High-fidelity-Sprit2/thank_you_direct_HF1.svg`, `thank_you_referred_HF2.svg`
**Implementation:** `src/app/(public)/[subdomain]/thank-you/page.tsx`

#### Discrepancies Found

| #   | Issue                                    | Design Spec                                    | Implementation                     | Severity  |
| --- | ---------------------------------------- | ---------------------------------------------- | ---------------------------------- | --------- |
| 1   | **Heading "You're in the line!" color**  | Green `#0F7A5E` (accent)                       | `text-foreground` (dark `#1A1A1A`) | ❌ High   |
| 2   | **"Referred by a friend" heading color** | Green `#0F7A5E` (accent)                       | `text-foreground` (dark `#1A1A1A`) | ❌ High   |
| 3   | **PoweredBy footer placement**           | Bottom of entire page, centered, below card    | Inside card container with `mt-8`  | ❌ High   |
| 4   | **Card background**                      | White with embedded waitlist page mockup image | Plain white `bg-card`              | ⚠️ Medium |
| 5   | **Referred card width**                  | 840px wide (wider than direct 666px)           | Same `max-w-[666px]` for both      | ⚠️ Medium |
| 6   | **Referred checkmark position**          | Outside card, above it                         | Inside card wrapper                | ⚠️ Low    |

#### Root Cause

The implementation built the functional logic correctly (referral tracking, share buttons, position display) but did not match the visual design spec. The heading colors were set to `text-foreground` instead of `text-accent`, and the PoweredBy footer was placed inside the card container instead of at the page bottom.

#### Fix Plan

1. Change heading "You're in the line!" from `text-foreground` to `text-accent`
2. Change "Referred by a friend" from `text-foreground` to `text-accent`
3. Move PoweredBy footer outside card container to page bottom with `mt-auto`
4. Adjust layout to `flex flex-col` with footer pushed down

#### Confidence Level

**100%** — Discrepancies identified, fix plan clear.

---

## Epic 9 — Dashboard Restructure

**Design files analyzed:** 2 SVGs (Dashboard empty state, Dashboard active state)
**PRD references:** PRD §2a (Sprint 2 — dashboard screens), PRD §7.5 Route/Handler List, PRD §7.6 Component Tree
**Analysis date:** 2026-08-30

| Screen                   | Design File                                                       | Status      |
| ------------------------ | ----------------------------------------------------------------- | ----------- |
| Dashboard — empty state  | `docs/design/High-fidelity-Sprit2/Dashboard_Empty_state_HF4.svg`  | ✅ analyzed |
| Dashboard — active state | `docs/design/High-fidelity-Sprit2/Dashboard_active_state_HF5.svg` | ✅ analyzed |

---

### Screen 1: Dashboard — Empty State — Analysis

**Design file:** `Dashboard_Empty_state_HF4.svg`
**PRD sections:** PRD §2a (Sprint 2 exit condition — dashboard), Story 9.0–9.2
**Analysis date:** 2026-08-30

#### Layout

- **Canvas:** 1440×1126px, `#FAF8F4` background (warm ivory)
- **Left sidebar:** 268px width, `#FCFCFB` background (slightly lighter than main)
- **Sidebar divider:** `#CCC9C3` stroke at x=270.891
- **Main content area:** Starts at x=271, `#FAF8F4` background
- **Top bar:** 80px height, `#FAF8F4` background, `#CCC9C3` bottom border
- **Search bar:** Rounded input at top of main content, `#FCFCFB` fill, `#CCC9C3` stroke, ~350px wide

#### Sidebar Structure

| Element              | Position      | Style                                      |
| -------------------- | ------------- | ------------------------------------------ |
| Logo + waitlist name | Top (y=22-71) | Green border box (`#0F7A5E` stroke)        |
| Navigation items     | y=167-235     | Text labels with icons                     |
| Separator line       | y=998         | `#1C1917` stroke                           |
| "Upgrade" button     | y=1017-1063   | Dashed green border (`#0F7A5E`, dasharray) |

#### Navigation Items (Verbatim)

| Item        | Position (y) | Color     | State    |
| ----------- | ------------ | --------- | -------- |
| Overview    | ~169         | `#1A1A1A` | Active   |
| Subscribers | ~229         | `#6B6459` | Inactive |
| Broadcasts  | ~382         | `#6B6459` | Inactive |
| Settings    | ~442         | `#6B6459` | Inactive |

**Note:** Navigation items have small square icons (16×16px) next to text labels.

#### Stat Cards

- **Layout:** 4 cards in a row, green background (`#0F7A5E`)
- **Card dimensions:** ~248×99px each (estimated from SVG)
- **Cards visible:**
  1. "Subscribers" — shows count
  2. "Referrals" — shows count
  3. "Page Views" — shows count
  4. "Heat Score" — shows score

**CRITICAL FINDING:** Design shows "Page Views" and "Heat Score" as stat card labels. Epic 9 Story 9.1 specifies "Hot" and "Warm" as the warmth cards. These are DIFFERENT metrics.

#### Empty Subscriber Table

- **Columns:** "#" (position), "Subscriber Email", "Signup Date", "Referrals"
- **4 columns total** (not 6 like current implementation)
- **Empty state:** "No subscribers yet. Share your link to get started." centered text
- **Table background:** White (`#FFFFFF`), rounded corners, border

#### Typography & Text (Verbatim)

| Element            | Text (exact)                                           | Size (est.) | Weight  | Color          |
| ------------------ | ------------------------------------------------------ | ----------- | ------- | -------------- |
| Search placeholder | "Search by email..."                                   | ~14px       | regular | `#6B6459`      |
| Welcome message    | "Hey [Founder Name]!"                                  | ~24px       | bold    | `#1A1A1A`      |
| Stat card labels   | "Subscribers", "Referrals", "Page Views", "Heat Score" | ~12px       | medium  | white on green |
| Table header       | "#", "Subscriber Email", "Signup Date", "Referrals"    | ~12px       | medium  | `#6B6459`      |
| Empty state        | "No subscribers yet. Share your link to get started."  | ~14px       | regular | `#6B6459`      |
| Upgrade button     | "Upgrade"                                              | ~14px       | medium  | `#0F7A5E`      |

#### Colors & Tokens

| Element            | Color Value | Token / Tailwind Class   |
| ------------------ | ----------- | ------------------------ |
| Page background    | `#FAF8F4`   | `bg-background`          |
| Sidebar background | `#FCFCFB`   | Custom (not in tokens)   |
| Sidebar divider    | `#CCC9C3`   | `border-border`          |
| Stat card bg       | `#0F7A5E`   | `bg-accent`              |
| Stat card text     | `#FFFFFF`   | `text-accent-foreground` |
| Heading text       | `#1A1A1A`   | `text-foreground`        |
| Muted text         | `#6B6459`   | `text-muted-foreground`  |
| Table border       | `#CCC9C3`   | `border-border`          |
| Search bar bg      | `#FCFCFB`   | Custom (not in tokens)   |
| Upgrade btn border | `#0F7A5E`   | `border-accent` (dashed) |

#### Form Elements

| Element      | Type | Label | Placeholder          | Default | Validation |
| ------------ | ---- | ----- | -------------------- | ------- | ---------- |
| Search input | text | —     | "Search by email..." | empty   | —          |

#### Buttons

| Label   | Variant          | Size         | State   |
| ------- | ---------------- | ------------ | ------- |
| Upgrade | outline (dashed) | full sidebar | enabled |
| Search  | — (input)        | ~350×40px    | —       |

#### Spacing & Dimensions

- Sidebar width: 268px
- Top bar height: 80px
- Search bar: ~350×40px, rx=8 (estimated)
- Stat cards: 4 in a row, gap ~12px
- Table: full width of main content area
- Table row height: ~48px (estimated)

#### PRD Cross-Reference

| PRD Requirement             | Design Match | Notes                                           |
| --------------------------- | ------------ | ----------------------------------------------- |
| Left sidebar navigation     | ✅           | 268px sidebar with nav items                    |
| Stat cards with real data   | ⚠️           | Design shows 4 cards, labels differ from Epic 9 |
| Subscriber table            | ✅           | 4 columns: #, Email, Date, Referrals            |
| Search by email             | ✅           | Search input above table                        |
| Empty state message         | ✅           | "No subscribers yet..." centered                |
| Upgrade button (Pro upsell) | ✅           | Dashed green border button in sidebar           |

#### Implementation Cross-Reference

| Element              | Current State                                      | Design Match | Notes                                 |
| -------------------- | -------------------------------------------------- | ------------ | ------------------------------------- |
| Dashboard layout     | Top-tab header (no sidebar)                        | ❌           | Needs full restructure to sidebar     |
| Sidebar component    | does not exist                                     | ❌           | Story 9.0 will create                 |
| Stat cards           | 5 cards (total signups, referral, hot, warm, cold) | ❌           | Design shows 4 different cards        |
| Table columns        | 6 (Name, Email, Position, Warmth, Referrals, Date) | ❌           | Design shows 4 columns                |
| Search functionality | does not exist                                     | ❌           | Story 9.2 will create                 |
| Sort functionality   | exists (referral_count default)                    | ⚠️           | Default should be position per design |

#### Discrepancies Found

1. **Sidebar background color inconsistency between HF4 and HF5.** HF4 shows `#FCFCFB` (lighter than main content). HF5 shows `#FAF8F4` (same as main content). This is a design inconsistency — the empty and active states use different sidebar colors. **Resolution:** Use `#FCFCFB` for sidebar (matches empty state, provides visual distinction from main content).

2. **Stat card labels differ between design and Epic 9.** Design shows "Subscribers, Referrals, Page Views, Heat Score". Epic 9 Story 9.1 specifies "Total Signups, Referrals, Hot, Warm". **Resolution:** Follow Epic 9 ACs — the story was written to match the PRD data model (warmth_score column exists, page_views table exists). The design SVG labels may be conceptual placeholders.

3. **Current table has 6 columns, design shows 4.** Current: Name, Email, Position, Warmth, Referrals, Date. Design: #, Email, Date, Referrals. **Resolution:** Follow design — remove Name and Warmth columns. The "#" column is position.

4. **Current dashboard has 5 stat cards, design shows 4.** Current: total signups, referral%, hot, warm, cold. Design: 4 cards. **Resolution:** Follow design — use 4 cards. Remove "cold" card (not in design).

5. **"Pending Rewards" dashed card in HF5.** Below the subscriber table in the active state, there's a dashed-border card for pending milestone rewards. This is explicitly out of scope for Epic 9 — deferred to Epic 10.

6. **Bar chart in HF5.** The active state shows a bar chart (signups over time). This is out of scope for Epic 9 — remains as placeholder.

#### Confidence Level

**98%** — Layout and structure are clear. Stat card label discrepancy needs decision during implementation. Sidebar color inconsistency resolved by choosing the lighter variant.

---

### Screen 2: Dashboard — Active State — Analysis

**Design file:** `Dashboard_active_state_HF5.svg`
**PRD sections:** PRD §2a (Sprint 2 — dashboard active), Story 9.1–9.4
**Analysis date:** 2026-08-30

#### Layout

- **Canvas:** 1440×1183px, `#FAF8F4` background
- **Left sidebar:** 271px width, `#FAF8F4` background (NOTE: different from HF4's `#FCFCFB`)
- **Main content area:** `#FAF8F4` background
- **Top bar:** Same structure as HF4

#### Sidebar Structure (Active State)

Same navigation items as HF4. Key difference: sidebar background matches main content (`#FAF8F4`), making the sidebar less visually distinct.

#### Stat Cards (Active State)

- **4 cards** with real data values
- Green background (`#0F7A5E`)
- Values visible (from SVG text elements):
  1. "128" — Subscribers
  2. "43" — Referrals
  3. "1,247" — Page Views
  4. "72" — Heat Score

#### Bar Chart

- **Location:** Below stat cards, above subscriber table
- **Type:** Vertical bar chart
- **Bars:** 12 bars (likely monthly data)
- **Color:** `#0F7A5E` (accent green)
- **X-axis:** Time labels (not fully legible in SVG)
- **Y-axis:** Count values

#### Subscriber Table (Active State)

- **Columns:** "#", "Subscriber Email", "Signup Date", "Referrals"
- **Data rows:** 8 subscribers visible
- **Sample data:**
  - Row 1: #1, sarah@example.com, Jan 15 2026, 12
  - Row 2: #2, mike@example.com, Jan 14 2026, 8
  - Row 3: #3, alex@example.com, Jan 13 2026, 5
  - (etc.)
- **Referral counts:** Right-aligned, bold for non-zero values
- **Position numbers:** Sequential (#1, #2, #3...)

#### "Pending Rewards" Card

- **Location:** Below subscriber table
- **Style:** Dashed border (`#0F7A5E`), white background
- **Content:** "Pending Rewards" heading, list of milestone rewards to fulfill
- **Out of scope:** Deferred to Epic 10

#### Typography & Text (Verbatim)

| Element            | Text (exact)                                           | Size (est.) | Weight   | Color     |
| ------------------ | ------------------------------------------------------ | ----------- | -------- | --------- |
| Search placeholder | "Search by email..."                                   | ~14px       | regular  | `#6B6459` |
| Welcome message    | "Hey [Founder Name]!"                                  | ~24px       | bold     | `#1A1A1A` |
| Stat card values   | "128", "43", "1,247", "72"                             | ~28px       | bold     | `#FFFFFF` |
| Stat card labels   | "Subscribers", "Referrals", "Page Views", "Heat Score" | ~12px       | medium   | `#FFFFFF` |
| Table header       | "#", "Subscriber Email", "Signup Date", "Referrals"    | ~12px       | medium   | `#6B6459` |
| Subscriber emails  | "sarah@example.com", etc.                              | ~14px       | regular  | `#1A1A1A` |
| Date column        | "Jan 15 2026", etc.                                    | ~14px       | regular  | `#6B6459` |
| Referral counts    | "12", "8", "5", etc.                                   | ~14px       | medium   | `#1A1A1A` |
| Pending Rewards    | "Pending Rewards"                                      | ~16px       | semibold | `#1A1A1A` |

#### Colors & Tokens

| Element                | Color Value | Token / Tailwind Class   |
| ---------------------- | ----------- | ------------------------ |
| Page background        | `#FAF8F4`   | `bg-background`          |
| Sidebar background     | `#FAF8F4`   | `bg-background` (same!)  |
| Stat card bg           | `#0F7A5E`   | `bg-accent`              |
| Stat card text         | `#FFFFFF`   | `text-white`             |
| Heading text           | `#1A1A1A`   | `text-foreground`        |
| Muted text             | `#6B6459`   | `text-muted-foreground`  |
| Table border           | `#CCC9C3`   | `border-border`          |
| Bar chart bars         | `#0F7A5E`   | `bg-accent`              |
| Pending Rewards border | `#0F7A5E`   | `border-accent` (dashed) |

#### Interactive States

- **Search input:** Focus state not visible in static SVG
- **Table rows:** Not clickable in design (no hover state shown)
- **Navigation items:** Active state uses bold text + left border indicator

#### PRD Cross-Reference

| PRD Requirement               | Design Match | Notes                                  |
| ----------------------------- | ------------ | -------------------------------------- |
| Real subscriber data          | ✅           | Table shows populated rows             |
| Sort by position              | ✅           | "#" column with sequential numbers     |
| Search by email               | ✅           | Search input above table               |
| Referral count display        | ✅           | "Referrals" column with integer values |
| Bar chart (signups over time) | ✅           | Visible but out of scope for Epic 9    |
| Pending rewards section       | ✅           | Visible but out of scope for Epic 9    |

#### Implementation Cross-Reference

| Element          | Current State                        | Design Match | Notes                                 |
| ---------------- | ------------------------------------ | ------------ | ------------------------------------- |
| Subscriber data  | fetched but mostly hardcoded         | ❌           | Needs real data rendering             |
| Sort by position | exists but default is referral_count | ⚠️           | Default should be position            |
| Referral column  | exists (added in Story 8.4)          | ✅           | Already implemented                   |
| Bar chart        | placeholder div                      | ⚠️           | Design shows real chart, out of scope |
| Pending rewards  | does not exist                       | ❌           | Out of scope (Epic 10)                |

#### Discrepancies Found

1. **Sidebar background inconsistency (HF4 vs HF5).** HF4: `#FCFCFB`, HF5: `#FAF8F4`. Already noted in Screen 1 analysis.

2. **Stat card labels "Page Views" and "Heat Score" don't match PRD data model.** PRD has `warmth_score` (hot/warm/cold) and `page_views` table. Design uses "Heat Score" which could map to hot count, and "Page Views" which maps to page_views count. **Resolution:** Map "Heat Score" → hot count, "Page Views" → page_views count. Adjust Epic 9 ACs if needed.

3. **"Pending Rewards" card is out of scope.** Explicitly deferred to Epic 10. Do not implement in Epic 9.

4. **Bar chart is out of scope.** Remains as placeholder in Epic 9.

5. **Table rows not shown as clickable in design.** Story 9.2 AC4 requires row click navigation to subscriber detail. This is a functional requirement not visible in static design.

#### Confidence Level

**98%** — Active state layout is clear. Stat card label mapping needs clarification during implementation.

---

### Cross-Screen Observations

#### Layout Pattern

| Screen | Sidebar Width | Sidebar Bg | Main Bg   |
| ------ | ------------- | ---------- | --------- |
| Empty  | 268px         | `#FCFCFB`  | `#FAF8F4` |
| Active | 271px         | `#FAF8F4`  | `#FAF8F4` |

**Key finding:** Sidebar width differs by 3px (268 vs 271). Sidebar background differs between states. This is a design inconsistency — the active state sidebar blends into the main content.

**Resolution:** Use 268px width consistently. Use `#FCFCFB` for sidebar background (provides visual distinction).

#### Stat Cards

| Screen | Card Count | Labels                                         |
| ------ | ---------- | ---------------------------------------------- |
| Empty  | 4          | Subscribers, Referrals, Page Views, Heat Score |
| Active | 4          | Same labels with real data                     |

**Key finding:** Both screens show 4 stat cards with the same labels. The empty state shows placeholder values, the active state shows real data.

#### Table Structure

| Screen | Columns                                     | Rows |
| ------ | ------------------------------------------- | ---- |
| Empty  | #, Subscriber Email, Signup Date, Referrals | 0    |
| Active | #, Subscriber Email, Signup Date, Referrals | 8    |

**Key finding:** Table structure is consistent across both screens. 4 columns, not 6.

---

### Key Design Decisions to Implement

1. **Left sidebar layout** (268px, `#FCFCFB` background) — replaces top-tab header
2. **4 stat cards** (not 5) — Subscribers, Referrals, Page Views, Heat Score
3. **4 table columns** (not 6) — #, Email, Date, Referrals
4. **Search input** above table — filters by email
5. **Default sort by position** (not referral_count)
6. **Active nav item** uses bold text + left border accent indicator
7. **"Upgrade" button** in sidebar with dashed green border
8. **Mobile responsive** — sidebar collapses to hamburger menu
9. **"Pending Rewards" card** is OUT OF SCOPE — deferred to Epic 10
10. **Bar chart** is OUT OF SCOPE — remains placeholder

---

### Confidence Check

**Overall analysis confidence: 98%**

**What is confirmed:**

- Both dashboard screens fully analyzed (empty + active states)
- Sidebar layout, navigation, and styling documented
- Stat card count, labels, and styling documented
- Table columns, search, and sorting documented
- Color tokens mapped to design system
- PRD requirements cross-referenced
- Out-of-scope items identified (Pending Rewards, Bar chart)

**What needs clarification during implementation:**

1. **Stat card label mapping:** "Page Views" → page_views count? "Heat Score" → hot count? Need to confirm with PRD data model.
2. **Sidebar background:** HF4 shows `#FCFCFB`, HF5 shows `#FAF8F4`. Resolution: use `#FCFCFB` for distinction.
3. **Sidebar width:** 268px vs 271px. Resolution: use 268px consistently.

**No blocking gaps found.** Design analysis is complete and ready to inform Epic 9 execution.

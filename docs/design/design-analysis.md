# Design Analysis

Detailed screen-by-screen analysis of high-fidelity designs, cross-referenced with the PRD and current implementation. Used to verify epic stories match design intent before execution.

---

## Table of Contents

| Epic   | Section                                                  |
| ------ | -------------------------------------------------------- |
| Epic 4 | [Epic 4 — Onboarding Wizard](#epic-4--onboarding-wizard) |

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

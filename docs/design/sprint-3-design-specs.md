# Sprint 3 Design Specs

**Purpose:** Textual design specifications for all Sprint 3 screens. Each spec provides enough detail to implement without SVG mockups. Stories reference these specs via `Design Ref: docs/design/sprint-3-design-specs.md — [Section]`.

**Source of truth:** `src/app/globals.css` for all tokens. `docs/design/dashboard-design-guide.md` for dashboard layout rules, spacing, typography, color system, and anti-patterns. Every decision below is derived from these two files.

**Date:** 2026-09-09

---

## Token Reference (Quick Lookup)

| Token                      | Value     | Tailwind Class                       | Use                     |
| -------------------------- | --------- | ------------------------------------ | ----------------------- |
| `--color-background`       | `#FAF8F4` | `bg-background`                      | Page background         |
| `--color-card`             | `#FFFFFF` | `bg-card`                            | Card/panel backgrounds  |
| `--color-foreground`       | `#1A1A1A` | `text-foreground`                    | Primary text            |
| `--color-muted-foreground` | `#6B6B6B` | `text-muted-foreground`              | Secondary text, labels  |
| `--color-border`           | `#E0DDD8` | `border-border`                      | Borders, dividers       |
| `--color-accent`           | `#0F7A5E` | `bg-accent`, `text-accent`           | CTAs, active states     |
| `--color-accent-hover`     | `#0D6B52` | `hover:bg-accent-hover`              | Button hover            |
| `--color-destructive`      | `#DC2626` | `text-destructive`                   | Errors                  |
| `--color-status-hot`       | `#D0492F` | `bg-status-hot`, `text-status-hot`   | Hot warmth              |
| `--color-status-warm`      | `#C7841A` | `bg-status-warm`, `text-status-warm` | Warm warmth             |
| `--color-status-cold`      | `#3B6FA6` | `bg-status-cold`, `text-status-cold` | Cold warmth             |
| `--color-warning`          | `#D97706` | `bg-warning`                         | Warning states          |
| `--color-muted`            | `#F0EDE8` | `bg-muted`                           | Bar tracks, disabled bg |

## Spacing Reference

| Gap          | Value                          | Use                              |
| ------------ | ------------------------------ | -------------------------------- |
| Section gap  | 24px                           | Between major dashboard sections |
| Card gap     | 16px                           | Between cards in a row           |
| Card padding | 24px (`p-5`)                   | Inside every card/panel          |
| Inline gap   | 8px                            | Between badges, buttons in a row |
| Table row    | 12px vertical, 16px horizontal | Inside table rows                |

## Typography Reference

| Element         | Size    | Weight | Class                                            |
| --------------- | ------- | ------ | ------------------------------------------------ |
| KPI value       | 28–32px | 600    | `text-3xl font-semibold`                         |
| Section heading | 18px    | 600    | `text-lg font-semibold`                          |
| Panel heading   | 18px    | 600    | `text-lg font-semibold`                          |
| Table header    | 14px    | 500    | `text-body-sm font-medium text-muted-foreground` |
| Body text       | 14–16px | 400    | `text-body-sm` / `text-body`                     |
| Caption         | 12px    | 400    | `text-caption`                                   |
| Button label    | 14px    | 500    | `text-sm font-medium`                            |

---

# Reusable Component Specs

---

## C1 — Modal / Dialog Component

**New component:** `components/ui/modal.tsx`
**Referenced by:** S9 (Upgrade Modal), future modals

### Structure

```
┌──────────────────────────────────────────────┐
│ backdrop (fixed inset-0, bg-black/50,        │
│   backdrop-blur-sm, z-[var(--z-modal)])      │
│                                              │
│   ┌──────────────────────────────────┐       │
│   │                          [X]     │       │  ← close button (top-right)
│   │  Contextual headline             │       │  ← text-h3
│   │                                  │       │
│   │  Feature list                    │       │  ← bullet list
│   │  Price                           │       │
│   │                                  │       │
│   │  [Upgrade to Pro]   Maybe later  │       │  ← primary + ghost buttons
│   └──────────────────────────────────┘       │
│                                              │
└──────────────────────────────────────────────┘
```

### Props

```ts
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
```

### Layout Rules

| Property        | Value                              | Token/Class                        |
| --------------- | ---------------------------------- | ---------------------------------- |
| Backdrop        | `fixed inset-0 z-[var(--z-modal)]` | —                                  |
| Backdrop color  | `bg-black/50`                      | `backdrop-blur-sm`                 |
| Modal card      | `max-w-md mx-auto mt-[15vh]`       | Vertically offset from top         |
| Card bg         | White                              | `bg-card`                          |
| Card border     | 1px solid                          | `border-border`                    |
| Card radius     | 12px                               | `rounded-[var(--card-radius)]`     |
| Card shadow     | None                               | `--card-shadow: none`              |
| Card padding    | 24px                               | `p-6`                              |
| Card max-height | `max-h-[80vh]`                     | Prevents overflow on small screens |
| Card overflow   | `overflow-y-auto`                  | Scrollable if content exceeds      |

### Close Button

| Property | Value                                 |
| -------- | ------------------------------------- |
| Position | Top-right corner, inside card padding |
| Size     | 32x32px (`h-8 w-8`)                   |
| Style    | Ghost button, `rounded-lg`            |
| Icon     | X (16x16), `text-muted-foreground`    |
| Hover    | `hover:bg-muted`                      |
| Label    | `aria-label="Close"`                  |

### Dismiss Behavior

Three ways to close:

1. **X button** — calls `onClose()`
2. **"Maybe later" button** — calls `onClose()`
3. **Backdrop click** — clicking outside the card calls `onClose()`

Do NOT close on Escape key for MVP (accessible enhancement later).

### Animation

| State | Transition                          |
| ----- | ----------------------------------- |
| Enter | `animate-in fade-in duration-200`   |
| Exit  | `animate-out fade-out duration-150` |

For MVP: no animation. Mount/unmount is sufficient. Add transitions in v1.1.

### Accessibility

- Focus trap: on open, focus moves to the first focusable element (CTA button)
- On close, focus returns to the element that triggered the modal
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to headline

---

## C2 — Settings Page Layout

**New page:** `src/app/dashboard/settings/page.tsx`
**Referenced by:** S6 (Email), S7 (Billing), S8 (Domain Auth)

### Route

`/dashboard/settings` — activated for all tiers (sidebar nav item changes from `disabled: true` to active link).

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Sidebar  │  Main Content                           │
│           │                                         │
│           │  ┌─────────────────────────────────┐    │
│           │  │  Settings                       │    │  ← text-h2
│           │  └─────────────────────────────────┘    │
│           │                                         │
│           │  ┌─────────────────────────────────┐    │
│           │  │  Email                          │    │  ← Section card (S6)
│           │  │  (sender name, subject)         │    │
│           │  └─────────────────────────────────┘    │
│           │                                         │
│           │  ┌─────────────────────────────────┐    │
│           │  │  Billing                        │    │  ← Section card (S7)
│           │  │  (plan, payment, manage)        │    │
│           │  └─────────────────────────────────┘    │
│           │                                         │
│           │  ┌─────────────────────────────────┐    │
│           │  │  Sender Domain                  │    │  ← Section card (S8)
│           │  │  (SPF/DKIM walkthrough)         │    │
│           │  └─────────────────────────────────┘    │
│           │                                         │
└─────────────────────────────────────────────────────┘
```

### Page Structure

- Server component fetches waitlist data (tier, sender_name, sending_domain, paddle_subscription_id)
- Passes data to client component for interactivity
- Each section is a card panel following dashboard-design-guide.md pattern

### Section Card Pattern

Every settings section uses:

```tsx
<div className="rounded-[var(--card-radius)] border border-border bg-card p-6">
  <h3 className="mb-4 text-lg font-semibold text-foreground">
    {Section Title}
  </h3>
  {/* Section content */}
</div>
```

### Section Spacing

- Between sections: 24px (`gap-6`)
- Between form fields within a section: 16px (`gap-4`)
- Section card padding: 24px (`p-6`)

### Form Field Pattern

Settings form fields use the same pattern as onboarding Step 3:

```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-xs font-medium text-muted-foreground">{Label}</label>
  <input
    className="h-10 rounded-[var(--input-radius)] border border-border bg-card px-3 py-2 text-sm
      placeholder:text-muted-foreground
      focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent
      disabled:cursor-not-allowed disabled:opacity-50"
    placeholder={Placeholder}
  />
  {error && (
    <p className="text-xs text-destructive" role="alert">
      {error}
    </p>
  )}
</div>
```

### Save Button

| Property       | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Label          | "Save changes"                                          |
| Variant        | `primary`                                               |
| Size           | `md` (h-10, px-4, text-sm)                              |
| Position       | Below form fields, right-aligned                        |
| Disabled state | Until changes are made (dirty tracking)                 |
| Loading state  | Spinner + "Saving..." while API call in progress        |
| Success state  | Brief "Saved" confirmation (2s), then revert to default |

### Mobile

- Single column, full width
- Sections stack vertically
- Form fields full width
- Padding: 16px horizontal (`px-4`)

---

## C3 — Broadcast Compose Shell

**New page:** `src/app/dashboard/broadcast/page.tsx`
**Referenced by:** S5 (Broadcast Compose Screen)

### Route

`/dashboard/broadcast` — active for Pro tier, locked for Free tier.

### Sidebar Activation

Current state in `sidebar.tsx`: Broadcast nav item is `locked: true` with `href="#"`.

Changes needed:

- **Pro tier:** `locked: false`, `href="/dashboard/broadcast"`, active state when on this route
- **Free tier:** Keep `locked: true`, clicking shows upgrade modal (S9 trigger #4)

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Sidebar  │  Main Content                           │
│           │                                         │
│           │  ┌─────────────────────────────────┐    │
│           │  │  Broadcast                      │    │  ← text-h2
│           │  └─────────────────────────────────┘    │
│           │                                         │
│           │  ┌─────────────────────────────────┐    │
│           │  │  Subject                        │    │  ← input field
│           │  ├─────────────────────────────────┤    │
│           │  │  Body                           │    │  ← textarea
│           │  │                                 │    │
│           │  │                                 │    │
│           │  ├─────────────────────────────────┤    │
│           │  │  Segment: [All ▼]               │    │  ← dropdown (S12.4)
│           │  │  Send to 234 subscribers        │    │  ← count text
│           │  ├─────────────────────────────────┤    │
│           │  │  [Preview]        [Send email]  │    │  ← secondary + primary
│           │  └─────────────────────────────────┘    │
│           │                                         │
│           │  ┌─────────────────────────────────┐    │
│           │  │  Recent broadcasts              │    │  ← history table (optional)
│           │  │  — No broadcasts yet            │    │
│           │  └─────────────────────────────────┘    │
│           │                                         │
└─────────────────────────────────────────────────────┘
```

### Compose Form Details

| Element          | Type                  | Height          | Placeholder                                       |
| ---------------- | --------------------- | --------------- | ------------------------------------------------- |
| Subject          | `<input type="text">` | `h-10` (40px)   | "What's this email about?"                        |
| Body             | `<textarea>`          | `min-h-[200px]` | "Write your email body here. You can use HTML..." |
| Segment selector | `<select>`            | `h-10`          | "All subscribers" (default)                       |

### Segment Selector (Story 12.4)

```tsx
<select>
  <option value="all">All subscribers ({count})</option>
  <option value="hot-warm">Hot + Warm only ({count})</option>
  <option value="cold">Cold only ({count})</option>
</select>
```

### Buttons

| Button     | Variant     | Position         | State                                   |
| ---------- | ----------- | ---------------- | --------------------------------------- |
| Preview    | `secondary` | Left             | Opens email preview in new tab or modal |
| Send email | `primary`   | Right of Preview | Disabled until subject + body filled    |

### Send Confirmation State

After successful send, replace compose form with:

```
┌─────────────────────────────────────────┐
│  ✓                                     │  ← green checkmark (24x24, text-accent)
│                                         │
│  Email sent to 234 subscribers          │  ← text-h3
│  or                                     │
│  Sent to 54 cold subscribers            │
│                                         │
│  [Compose another]                      │  ← secondary button, resets form
└─────────────────────────────────────────┘
```

### Loading State

While sending: button shows spinner + "Sending..." text. Form fields disabled.

### Error State

If send fails: inline error message below the send button.

```
<p className="text-sm text-destructive" role="alert">
  Failed to send email. Please try again.
</p>
```

---

# Screen Specs

---

## S1 — Warmth Distribution Panel (Real Data)

**Story:** 11.3
**Component:** `components/dashboard/warmth-panel.tsx` (rewrite existing placeholder)
**Location:** Dashboard main content, bottom-right of the 2-column grid (alongside QualificationPanel)

### Layout

```
┌─────────────────────────────────────────┐
│  Warmth Distribution                    │  ← text-lg font-semibold
│                                         │
│  Hot      ████████████░░░░  12 (32%)    │  ← bg-status-hot
│  Warm     ████████████████████████  25  │  ← bg-status-warm
│  Cold     ████░░░░░░░░░░░░░░░░░  8     │  ← bg-status-cold
│  —        ██░░░░░░░░░░░░░░░░░░░  5     │  ← bg-muted
│                                         │
└─────────────────────────────────────────┘
```

### Elements

| Element        | Detail                                                                       |
| -------------- | ---------------------------------------------------------------------------- |
| **Panel card** | `rounded-[var(--card-radius)] border border-border bg-card p-5`              |
| **Heading**    | "Warmth Distribution" — `text-lg font-semibold text-foreground mb-4`         |
| **Bar rows**   | Flex row: label (left), bar (flex-1), count + percentage (right)             |
| **Bar track**  | `h-2 flex-1 overflow-hidden rounded-full bg-muted`                           |
| **Bar fill**   | `h-full rounded-full {color}` — width = `Math.round((count / total) * 100)%` |
| **Bar label**  | Left of bar — `text-xs font-medium text-foreground`, width `w-16`            |
| **Bar value**  | Right of bar — `text-xs text-muted-foreground`, min-width `w-20`             |

### Bar Colors (Design System Tokens)

| Tier     | Fill Color | Token                 | Tailwind         |
| -------- | ---------- | --------------------- | ---------------- |
| Hot      | `#D0492F`  | `--color-status-hot`  | `bg-status-hot`  |
| Warm     | `#C7841A`  | `--color-status-warm` | `bg-status-warm` |
| Cold     | `#3B6FA6`  | `--color-status-cold` | `bg-status-cold` |
| Unscored | `#F0EDE8`  | `--color-muted`       | `bg-muted`       |

### Data Source

**API:** `GET /api/dashboard/warmth`
**Response:** `{ hot: number, warm: number, cold: number, unscored: number }`
**Auth:** Required (founder only)
**Fetch pattern:** Client-side `useState` + `useEffect` with cancellation flag

### Changes from Current Placeholder

1. **Remove** `tier` and `subdomain` props — warmth visible to all tiers, fetches from authenticated endpoint
2. **Remove** `LockedOverlay` — no more blur/lock for Free tier
3. **Replace** fetch URL from `/api/warmth/${subdomain}` (public) to `/api/dashboard/warmth` (authenticated)
4. **Replace** bar colors from `bg-red-500` etc. to `bg-status-hot` etc. (design system tokens)
5. **Add** percentage display: `(count / total * 100).toFixed(0)%`

### Empty State

When `total === 0` (no subscribers):

```
┌─────────────────────────────────────────┐
│  Warmth Distribution                    │
│                                         │
│  Hot      —                             │  ← em-dash, not "0"
│  Warm     —                             │
│  Cold     —                             │
│  —        —                             │
│                                         │
└─────────────────────────────────────────┘
```

All bars at 0% width. Labels show "—" instead of "0".

### Responsive

- **Desktop (>1024px):** Half-width in `grid-cols-2` with QualificationPanel
- **Tablet (768-1024px):** Full width, stacks below chart
- **Mobile (<768px):** Full width, single column

### Skeleton Loader

While loading: 4 rows of bar-track-shaped placeholders with `animate-pulse bg-muted`.

```tsx
<div className="flex items-center gap-3">
  <div className="h-3 w-12 animate-pulse rounded bg-muted" /> {/* label */}
  <div className="h-2 flex-1 animate-pulse rounded-full bg-muted" /> {/* bar */}
  <div className="h-3 w-10 animate-pulse rounded bg-muted" /> {/* value */}
</div>
```

---

## S2 — Dashboard Warning Banner

**Story:** 11.4
**Component:** `components/dashboard/warning-banner.tsx` (new)
**Location:** Dashboard main content, below stat cards row, above chart

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  42% of your list has gone cold. Consider sending a    │
│      re-engagement email.                                   │
└─────────────────────────────────────────────────────────────┘
```

### Elements

| Element        | Detail                                                                                  |
| -------------- | --------------------------------------------------------------------------------------- |
| **Container**  | `rounded-[var(--card-radius)] border border-yellow-200 bg-yellow-50 px-5 py-4`          |
| **Icon**       | ⚠️ — inline emoji, 16px, not an SVG. Alternatively: `text-yellow-600` SVG triangle icon |
| **Text**       | `{coldPercent}% of your list has gone cold. Consider sending a re-engagement email.`    |
| **Text style** | `text-sm font-medium text-yellow-800`                                                   |
| **Layout**     | Flex row: icon (left, not shrunk), text (flex-1)                                        |

### Text (Verbatim)

**Primary message:** `⚠️ {X}% of your list has gone cold. Consider sending a re-engagement email.`

- `{X}` = `Math.round((coldCount / totalCount) * 100)` — integer, no decimals
- "re-engagement email" is not a link for MVP (no target page exists)

### Visibility Rules

| Rule | Condition                                                         |
| ---- | ----------------------------------------------------------------- |
| Show | `coldPercent >= coldThreshold` (default 40%, configurable 20-80%) |
| Show | `totalCount >= 10` (avoid warning on tiny lists)                  |
| Hide | `totalCount < 10`                                                 |
| Hide | `coldPercent < coldThreshold`                                     |

### Data Source

- **coldCount, totalCount:** From `GET /api/dashboard/warmth` response (`{ hot, warm, cold, unscored }`)
- **coldThreshold:** From `waitlists.cold_threshold` column (integer, default 40)

### Position in Dashboard Layout

Insert between stat cards row and chart:

```tsx
{
  /* Stat cards grid-cols-4 */
}
{
  /* Warning banner — conditional */
}
{
  showWarning && <WarningBanner coldPercent={coldPercent} />;
}
{
  /* SignupChart */
}
```

### Dismiss Behavior

**Not dismissible for MVP.** The banner disappears when the condition is no longer met (cold % drops below threshold).

### Responsive

- **Desktop:** Full width of content area (max-w-6xl)
- **Mobile:** Full width with horizontal padding matching content area

---

## S3 — Confirmation Email

**Story:** 12.0
**Type:** Transactional email HTML template
**Sender:** `{senderName} <notifications@prewaitlist.com>`

### Email Structure

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  {Product Logo (optional)}                       │
│                                                  │
│  You're on the list!                             │
│                                                  │
│  You're #{position} in line for {product_name}.  │
│                                                  │
│  Share your unique link to move up:              │
│  {referral_link}                                 │
│                                                  │
│  ┌──────────────────────────────┐                │
│  │  Copy your link              │                │  ← styled button (link)
│  └──────────────────────────────┘                │
│                                                  │
│  ────────────────────────────────                │  ← divider
│                                                  │
│  You received this because you signed up for     │
│  {product_name}. [Unsubscribe]                   │
│  {physical_address}                              │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Text (Verbatim)

| Element           | Text                                                          |
| ----------------- | ------------------------------------------------------------- |
| **Subject**       | `You're #{position} in line for {product_name}`               |
| **Heading**       | `You're on the list!`                                         |
| **Body line 1**   | `You're #{position} in line for {product_name}.`              |
| **Body line 2**   | `Share your unique link to move up:`                          |
| **CTA button**    | `Copy your link`                                              |
| **Footer line 1** | `You received this because you signed up for {product_name}.` |
| **Footer line 2** | `Unsubscribe` (link to `{{{RESEND_UNSUBSCRIBE_URL}}}`)        |
| **Footer line 3** | `{physical_address}` (CAN-SPAM requirement)                   |

### HTML Template Rules

| Property      | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Max width     | 600px (email client safe)                                                  |
| Font          | System font stack (Arial, sans-serif)                                      |
| Background    | `#FAF8F4` (warm ivory)                                                     |
| Content bg    | `#FFFFFF` (white card)                                                     |
| Heading color | `#1A1A1A` (foreground)                                                     |
| Body text     | `#6B6B6B` (muted-foreground), 14px                                         |
| Link color    | `#0F7A5E` (accent)                                                         |
| Divider       | `#E0DDD8` (border), 1px, 40px margins                                      |
| Footer text   | 12px, `#6B6B6B`                                                            |
| Button bg     | `#0F7A5E` (accent), text white, `border-radius: 8px`, `padding: 12px 24px` |

### Template Implementation

Use inline HTML with inline CSS (no `<style>` blocks — email clients strip them). Follow the pattern in `src/lib/milestones.ts:10-30` (`buildMilestoneEmailHTML`).

### Variables

| Variable           | Source                                                    | Fallback                               |
| ------------------ | --------------------------------------------------------- | -------------------------------------- |
| `position`         | Subscriber's position after insert                        | —                                      |
| `product_name`     | `waitlists.product_name`                                  | `waitlists.headline` → "Your waitlist" |
| `referral_link`    | `https://{subdomain}.prewaitlist.com?ref={referral_code}` | —                                      |
| `sender_name`      | `waitlists.sender_name`                                   | `product_name` → "PreWaitlist"         |
| `physical_address` | Hardcoded: "PreWaitlist, [address]"                       | —                                      |

### Error Handling

- Email send failure MUST NOT block subscriber creation
- `try/catch` around `resend.emails.send()` — log error, continue
- Subscriber record is created regardless of email success

---

## S4 — "You Moved Up" Trigger Email

**Story:** 12.2
**Type:** Transactional email HTML template
**Sender:** `{senderName} <notifications@prewaitlist.com>`

### Email Structure

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  🎉 You moved up!                                │
│                                                  │
│  Great news — someone you referred just joined.  │
│  You moved up {spots_moved} spots!               │
│                                                  │
│  You're now #{new_position} in line.             │
│                                                  │
│  Keep sharing to move up further:                │
│  {referral_link}                                 │
│                                                  │
│  ┌──────────────────────────────┐                │
│  │  Share your link             │                │  ← styled button
│  └──────────────────────────────┘                │
│                                                  │
│  ────────────────────────────────                │
│                                                  │
│  You received this because you're on the         │
│  {product_name} waitlist. [Unsubscribe]          │
│  {physical_address}                              │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Text (Verbatim)

| Element           | Text                                                               |
| ----------------- | ------------------------------------------------------------------ |
| **Subject**       | `🎉 You moved up {spots_moved} spots!`                             |
| **Heading**       | `🎉 You moved up!`                                                 |
| **Body line 1**   | `Great news — someone you referred just joined.`                   |
| **Body line 2**   | `You moved up {spots_moved} spots!`                                |
| **Body line 3**   | `You're now #{new_position} in line.`                              |
| **Body line 4**   | `Keep sharing to move up further:`                                 |
| **CTA button**    | `Share your link`                                                  |
| **Footer line 1** | `You received this because you're on the {product_name} waitlist.` |
| **Footer line 2** | `Unsubscribe` (link)                                               |
| **Footer line 3** | `{physical_address}`                                               |

### HTML Template Rules

Same as S3 (confirmation email). Reuse the same base HTML structure — only content differs.

### Trigger Conditions

| Condition           | Behavior                                           |
| ------------------- | -------------------------------------------------- |
| `spots_moved >= 1`  | Send email                                         |
| `spots_moved === 0` | Do NOT send (position unchanged)                   |
| Email send fails    | Log error, do NOT roll back position recalculation |

### Variables

| Variable        | Source                                                            |
| --------------- | ----------------------------------------------------------------- |
| `spots_moved`   | `old_position - new_position` (calculated in Story 12.1)          |
| `new_position`  | Subscriber's new position after recalculation                     |
| `referral_link` | `https://{subdomain}.prewaitlist.com?ref={referral_code}`         |
| `product_name`  | `waitlists.product_name` → `waitlists.headline` → "Your waitlist" |

---

## S5 — Broadcast Compose Screen

**Story:** 12.3 + 12.4
**Page:** `src/app/dashboard/broadcast/page.tsx`
**Component spec:** See C3 (Broadcast Compose Shell)

### Full Spec

See **C3 — Broadcast Compose Shell** above for complete layout, elements, and states.

### Additional S5 Details

**Segment Selector (Story 12.4):**

```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-xs font-medium text-muted-foreground">Send to</label>
  <select className="h-10 rounded-[var(--input-radius)] border border-border bg-card px-3 py-2 text-sm ...">
    <option value="all">All subscribers ({allCount})</option>
    <option value="hot-warm">Hot + Warm only ({hotWarmCount})</option>
    <option value="cold">Cold only ({coldCount})</option>
  </select>
</div>
```

**Segment Counts:**

Fetch from `GET /api/dashboard/warmth` — already returns `{ hot, warm, cold, unscored }`. Compute:

- `allCount = hot + warm + cold + unscored`
- `hotWarmCount = hot + warm`
- `coldCount = cold`

**Send Confirmation (segment-aware):**

| Segment    | Confirmation text                             |
| ---------- | --------------------------------------------- |
| All        | "Email sent to {N} subscribers."              |
| Hot + Warm | "Email sent to {N} hot and warm subscribers." |
| Cold       | "Email sent to {N} cold subscribers."         |

**Broadcast History (optional):**

Table below compose form showing recent broadcasts from `broadcasts` table:

| Column     | Value                                  |
| ---------- | -------------------------------------- |
| Subject    | `{subject}`                            |
| Sent       | `{sent_at}` formatted as relative time |
| Recipients | `{recipient_count}`                    |

Empty state: "No broadcasts yet."

---

## S6 — Settings: Email Section

**Story:** 12.5
**Location:** `/dashboard/settings` → "Email" card
**Spec reference:** C2 (Settings Page Layout)

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Email                                              │  ← text-lg font-semibold
│                                                     │
│  Sender name                                        │
│  ┌───────────────────────────────────────────────┐  │
│  │ Buildly                                        │  │  ← input, placeholder: "PreWaitlist"
│  └───────────────────────────────────────────────┘  │
│  The name recipients see in their inbox.            │  ← text-xs text-muted-foreground
│                                                     │
│                          [Save changes]             │  ← primary button, right-aligned
└─────────────────────────────────────────────────────┘
```

### Elements

| Element                | Type         | Detail                                                                      |
| ---------------------- | ------------ | --------------------------------------------------------------------------- |
| **Section card**       | Card wrapper | `rounded-[var(--card-radius)] border border-border bg-card p-6`             |
| **Heading**            | Text         | "Email" — `text-lg font-semibold text-foreground mb-4`                      |
| **Sender name label**  | Label        | "Sender name" — `text-xs font-medium text-muted-foreground`                 |
| **Sender name input**  | Input        | `h-10`, standard input styling per C2                                       |
| **Sender name helper** | Helper text  | "The name recipients see in their inbox." — `text-xs text-muted-foreground` |
| **Save button**        | Button       | `primary` variant, `md` size                                                |

### Default Value

`sender_name` from `waitlists` table (nullable). If null, input shows empty with placeholder "PreWaitlist".

### Fallback Chain (for email sending)

1. `sender_name` (from this settings field)
2. `product_name` (from onboarding)
3. `headline` (from onboarding)
4. "PreWaitlist" (hardcoded)

### Save Behavior

- **API:** `PATCH /api/waitlist` with `{ id, sender_name: value }`
- **Optimistic:** Show "Saved" briefly, then revert button to default state
- **Validation:** Non-empty string. If empty, save `null` (revert to fallback)

### Mobile

- Full width card
- Input full width
- Save button full width, below input

---

## S7 — Settings: Billing Section

**Story:** 13.3
**Location:** `/dashboard/settings` → "Billing" card
**Spec reference:** C2 (Settings Page Layout)

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Billing                                            │  ← text-lg font-semibold
│                                                     │
│  Current plan          Pro                          │  ← label + value
│  Next billing date     October 9, 2026              │  ← Pro only
│  Payment method        •••• 4242                    │  ← Pro only
│                                                     │
│  ┌──────────────────────────────┐                   │
│  │  Manage billing              │                   │  ← secondary button (Pro)
│  └──────────────────────────────┘                   │
│                                                     │
│  ── or ──                                           │  ← divider (Free only)
│                                                     │
│  ┌──────────────────────────────┐                   │
│  │  Upgrade to Pro — $15/mo     │                   │  ← primary button (Free)
│  └──────────────────────────────┘                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Elements — Free Tier

| Element            | Detail                                                   |
| ------------------ | -------------------------------------------------------- |
| **Current plan**   | "Free" — `text-sm font-medium text-foreground`           |
| **Upgrade button** | `primary` variant, "Upgrade to Pro — $15/mo"             |
| **On click**       | Opens Paddle checkout overlay (`Paddle.Checkout.open()`) |

### Elements — Pro Tier

| Element               | Detail                                            |
| --------------------- | ------------------------------------------------- |
| **Current plan**      | "Pro" — `text-sm font-medium text-accent` (green) |
| **Next billing date** | Formatted date — `text-sm text-foreground`        |
| **Payment method**    | "•••• {last4}" — `text-sm text-foreground`        |
| **Manage button**     | `secondary` variant, "Manage billing"             |
| **On click**          | Opens Paddle customer portal (external link)      |

### Section Structure

```tsx
<div className="flex flex-col gap-4">
  {/* Info rows */}
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">Current plan</span>
    <span className="font-medium text-foreground">
      {tier === "pro" ? "Pro" : "Free"}
    </span>
  </div>
  {/* ... more rows ... */}

  {/* CTA */}
  {tier === "free" ? (
    <Button onClick={handleUpgrade}>Upgrade to Pro — $15/mo</Button>
  ) : (
    <Button variant="secondary" onClick={handleManage}>
      Manage billing
    </Button>
  )}
</div>
```

### Data Source

| Field                  | Source                                        |
| ---------------------- | --------------------------------------------- |
| `tier`                 | `founder_profiles.tier` (fetched in page.tsx) |
| `nextBillingDate`      | Paddle API (if Pro)                           |
| `paymentLast4`         | Paddle API (if Pro)                           |
| `paddleSubscriptionId` | `founder_profiles.paddle_subscription_id`     |

### Paddle Integration

- **Checkout:** `Paddle.Checkout.open({ items: [{ priceId: "...", quantity: 1 }], customData: { user_id, waitlist_id } })`
- **Portal:** `POST /api/billing/portal` → returns `{ url }` → `window.open(url)`
- **Script:** Loaded via `next/script` with `strategy="afterInteractive"` in root layout

---

## S8 — Settings: Sender Domain Authentication

**Story:** 13.5
**Location:** `/dashboard/settings` → "Sender Domain" card
**Spec reference:** C2 (Settings Page Layout)

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Sender Domain                                      │  ← text-lg font-semibold
│                                                     │
│  Verify your own domain to send emails from          │
│  your@domain.com instead of prewaitlist.com.        │  ← helper text
│                                                     │
│  Domain                                              │
│  ┌───────────────────────────────────────────────┐  │
│  │ mail.yourdomain.com                            │  │  ← input
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  DNS records to add:                                │
│                                                     │
│  Type   Name              Value                     │
│  ─────  ────────────────  ──────────────────────    │
│  TXT    @                 v=spf1 include:...        │  ← copyable
│  CNAME  resend._domainkey  resend.domainkey...      │  ← copyable
│                                                     │
│  [Verify domain]                                    │  ← primary button
│                                                     │
│  Status: ⏳ Pending verification                    │  ← or ✅ Verified / ❌ Failed
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Elements

| Element               | Type   | Detail                                                                                                                                        |
| --------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Heading**           | Text   | "Sender Domain" — `text-lg font-semibold`                                                                                                     |
| **Helper text**       | Text   | "Verify your own domain to send emails from your@domain.com instead of prewaitlist.com." — `text-sm text-muted-foreground mb-4`               |
| **Domain input**      | Input  | `h-10`, placeholder "mail.yourdomain.com"                                                                                                     |
| **DNS records table** | Table  | 2 columns: Type + Name                                                                                                                        | Value. Value is monospace (`font-mono text-xs`). Each value has a copy button (16x16 copy icon). |
| **Verify button**     | Button | `primary` variant, "Verify domain"                                                                                                            |
| **Status indicator**  | Badge  | Pending: `bg-yellow-100 text-yellow-800` with ⏳. Verified: `bg-green-100 text-green-800` with ✅. Failed: `bg-red-100 text-red-800` with ❌. |

### DNS Records (Verbatim)

| Type  | Name                | Value                                          |
| ----- | ------------------- | ---------------------------------------------- |
| TXT   | `@`                 | `v=spf1 include:amazonses.com ~all`            |
| CNAME | `resend._domainkey` | `resend.domainkey.{domain}.dkim.amazonses.com` |

### Status States

| State           | Badge                                                       | Action                                                                                        |
| --------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Not started** | No badge, input + DNS records visible                       | User enters domain, sees DNS records                                                          |
| **Pending**     | ⏳ "Pending verification" — `bg-yellow-100 text-yellow-800` | Verify button disabled, polling every 30s                                                     |
| **Verified**    | ✅ "Verified" — `bg-green-100 text-green-800`               | Input disabled, DNS records collapsed                                                         |
| **Failed**      | ❌ "Verification failed" — `bg-red-100 text-red-800`        | Show error: "DNS records not found. Please check your DNS settings." Verify button re-enabled |

### Copy Button

Each DNS value row has a copy icon button (right-aligned):

```tsx
<button
  onClick={() => navigator.clipboard.writeText(value)}
  className="p-1 rounded hover:bg-muted text-muted-foreground"
  aria-label="Copy to clipboard"
>
  <CopyIcon className="h-4 w-4" />
</button>
```

On click: icon changes to checkmark for 2s, then reverts.

### Mobile

- DNS records: horizontal scroll with `overflow-x-auto` (values can be long)
- Or stack: Type + Name on one line, Value on next line with copy button

---

## S9 — Upgrade Modal (7 Triggers)

**Story:** 13.1
**Component:** `components/dashboard/upgrade-modal.tsx`
**Spec reference:** C1 (Modal/Dialog Component)

### Layout

```
┌──────────────────────────────────────────────────────┐
│                                                  [X] │
│                                                      │
│  Upgrade to send broadcasts                          │  ← contextual headline (varies by trigger)
│                                                      │
│  Unlock the full power of PreWaitlist:               │
│                                                      │
│  ✓  Unlimited subscribers                            │
│  ✓  Broadcast emails to your list                    │
│  ✓  Warmth-segmented targeting                       │
│  ✓  Email customisation                              │
│  ✓  CSV export                                       │
│  ✓  Custom sender domain                             │
│  ✓  5 qualification questions                        │
│                                                      │
│  $15/month                                           │  ← text-body-lg font-semibold text-foreground
│                                                      │
│  ┌──────────────────────────────┐  ┌──────────────┐  │
│  │  Upgrade to Pro              │  │  Maybe later  │  │  ← primary + ghost
│  └──────────────────────────────┘  └──────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Trigger Variants

Each trigger shows a **different headline** but the same feature list and CTA.

| #   | Trigger                      | Headline                                   | Detection                                            |
| --- | ---------------------------- | ------------------------------------------ | ---------------------------------------------------- |
| 1   | Signup cap hit (500)         | "You've reached the subscriber limit"      | `POST /api/subscribers` returns 403                  |
| 2   | Qual question cap hit (2)    | "Upgrade for more qualification questions" | User tries to add 3rd question in onboarding Step 4a |
| 3   | Warmth panel clicked         | "Unlock warmth insights"                   | Click on warmth panel (Free tier)                    |
| 4   | Broadcast attempted          | "Upgrade to send broadcasts"               | Click Broadcast nav item (Free tier)                 |
| 5   | CSV export attempted         | "Upgrade to export subscribers"            | Click Export CSV button (Free tier)                  |
| 6   | Domain auth attempted        | "Upgrade for custom sender domain"         | Click domain auth in Settings (Free tier)            |
| 7   | Settings email customisation | "Upgrade for email customisation"          | Click sender name field in Settings (Free tier)      |

### Feature List (Verbatim)

```
✓  Unlimited subscribers
✓  Broadcast emails to your list
✓  Warmth-segmented targeting
✓  Email customisation
✓  CSV export
✓  Custom sender domain
✓  5 qualification questions
```

- Each item: `text-sm text-foreground`, checkmark in `text-accent` (green)
- List: `flex flex-col gap-2`

### Price Display

```tsx
<p className="text-body-lg font-semibold text-foreground">$15/month</p>
```

### Buttons

| Button  | Variant        | Label            | On Click                      |
| ------- | -------------- | ---------------- | ----------------------------- |
| CTA     | `primary` (lg) | "Upgrade to Pro" | Opens Paddle checkout overlay |
| Dismiss | `ghost`        | "Maybe later"    | Closes modal                  |

### Cooldown Logic

```ts
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function shouldShowModal(trigger: string): boolean {
  const key = `upgrade-modal-dismissed-${trigger}`;
  const dismissed = localStorage.getItem(key);
  if (!dismissed) return true;
  return Date.now() - Number(dismissed) > COOLDOWN_MS;
}

function dismissModal(trigger: string): void {
  localStorage.setItem(
    `upgrade-modal-dismissed-${trigger}`,
    String(Date.now())
  );
}
```

### Detection Points in Code

| Trigger        | File                                    | Integration                                     |
| -------------- | --------------------------------------- | ----------------------------------------------- |
| 1 (signup cap) | `src/app/api/subscribers/route.ts`      | Return `{ upgradeModal: true }` in 403 response |
| 2 (qual cap)   | `src/app/onboarding/4a/page.tsx`        | Check questions.length >= 2 before adding       |
| 3 (warmth)     | `components/dashboard/warmth-panel.tsx` | onClick handler when tier === "free"            |
| 4 (broadcast)  | `components/dashboard/sidebar.tsx`      | onClick handler for Broadcast nav item          |
| 5 (CSV)        | `src/app/dashboard/client.tsx`          | onClick handler for Export CSV button           |
| 6 (domain)     | Settings page (S8)                      | onClick handler for domain section              |
| 7 (email)      | Settings page (S6)                      | onClick handler for sender name field           |

---

## S10 — Public Page: Subscriber Cap Message

**Story:** 13.4
**Location:** `/:subdomain` — replaces email capture form when cap is reached
**Component:** Modify `components/public/email-capture-form.tsx` or handle in `waitlist-template-content.tsx`

### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│  {Logo}                                 │
│  {Product Name}                         │
│                                         │
│  {Headline}                             │
│  {Subheadline}                          │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │  This waitlist has reached      │    │  ← centered in card
│  │  its subscriber limit.          │    │
│  │                                 │    │
│  │  Please check back later.       │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  {Milestone rewards}                    │
│  {How it works}                         │
│                                         │
│  {Powered by footer}                    │
│                                         │
└─────────────────────────────────────────┘
```

### Elements

| Element            | Detail                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Container**      | Same card wrapper as email input: `rounded-[var(--input-radius)] border border-border bg-card p-6 text-center` |
| **Icon**           | Optional: lock icon (24x24, `text-muted-foreground`) above text                                                |
| **Message line 1** | "This waitlist has reached its subscriber limit."                                                              |
| **Message line 2** | "Please check back later."                                                                                     |
| **Text style**     | `text-sm text-muted-foreground` (same as form helper text)                                                     |

### Text (Verbatim)

**Line 1:** `This waitlist has reached its subscriber limit.`
**Line 2:** `Please check back later.`

### Integration Point

Two approaches (pick one during implementation):

**Option A — Inside EmailCaptureForm:**
Add `capReached?: boolean` prop. When true, render message instead of form.

```tsx
if (capReached) {
  return (
    <div className="rounded-[var(--input-radius)] border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">
        This waitlist has reached its subscriber limit.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Please check back later.
      </p>
    </div>
  );
}
```

**Option B — In WaitlistTemplateContent:**
Conditionally replace `{emailCaptureForm}` slot with cap message.

**Recommended:** Option A — keeps the logic in the form component, cleaner separation.

### Data Source

- **Cap check:** `waitlists.subscriber_count >= 500` AND `founder_profiles.tier === 'free'`
- **Server-side:** Checked in `src/app/(public)/[subdomain]/page.tsx` before rendering
- **Passed as prop:** `capReached={subscriberCount >= 500 && tier === 'free'}`

### Template Awareness

The cap message should respect the active template:

| Template | Background               | Border                        | Text                       |
| -------- | ------------------------ | ----------------------------- | -------------------------- |
| Minimal  | `bg-card`                | `border-border`               | `text-muted-foreground`    |
| Bold     | `bg-card`                | `border-foreground border-2`  | `text-muted-foreground`    |
| Dark     | `bg-dark-template-input` | `border-dark-template-border` | `text-dark-template-muted` |

### Mobile

- Full width of content area (max-w-md)
- Same padding as email capture form
- Text centered

---

# Story → Design Spec Reference Map

| Story            | Design Spec | Section                        |
| ---------------- | ----------- | ------------------------------ |
| 11.3             | S1          | Warmth Distribution Panel      |
| 11.4             | S2          | Dashboard Warning Banner       |
| 12.0             | S3          | Confirmation Email             |
| 12.2             | S4          | "You Moved Up" Email           |
| 12.3 + 12.4      | S5 + C3     | Broadcast Compose Screen       |
| 12.5             | S6 + C2     | Settings — Email Section       |
| 12.6             | —           | (Code-only, no new UI)         |
| 13.0             | —           | (Code-only, Paddle SDK setup)  |
| 13.1             | S9 + C1     | Upgrade Modal                  |
| 13.2             | —           | (Code-only, tier gating logic) |
| 13.3             | S7 + C2     | Settings — Billing Section     |
| 13.4             | S10         | Public Page — Cap Message      |
| 13.5             | S8 + C2     | Settings — Domain Auth Section |
| 11.7             | —           | (SQL migration only)           |
| 11.0, 11.1, 11.5 | —           | (Backend logic, no UI)         |
| 11.6, 13.6       | —           | (Tests only)                   |

---
id: epic8.story01
epic: epic-8-thank-you-referral-loop
title: Referral Link & Share Buttons
status: ready
depends_on: [epic8.story00]
updated: 2026-08-17
---

# Story 8.1 — Referral Link & Share Buttons

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-Sprit2/thank_you_direct_HF1.svg`, `docs/design/High-fidelity-Sprit2/thank_you_referred_HF2.svg`

**Story:** As a visitor who just signed up, I want to easily copy my referral link and share it on social media so that I can invite friends and move up the waitlist.

## Design Specs (from SVG analysis)

- **Referral link display:** Rounded pill with `bg-muted` background, referral URL text, copy button on right
- **Share buttons:** Row of social share buttons below the referral link
  - Twitter: blue icon, "Share on Twitter" label
  - LinkedIn: blue icon, "Share on LinkedIn" label
  - Copy Link: neutral icon, "Copy Link" label, changes to "Copied!" on click
- **Button styling:** `rounded-md`, `px-4 py-2`, `text-body-sm`, `font-medium`

## Acceptance Criteria (EARS)

- AC1: The system shall render a `ReferralLink` component (`components/share/referral-link.tsx`) displaying the full referral URL in a read-only input field with a copy button.
- AC2: The system shall copy the referral URL to the clipboard when the copy button is clicked, using the Clipboard API (`navigator.clipboard.writeText()`).
- AC3: The system shall display "Copied!" feedback for 2 seconds after successful clipboard write, then revert to the default state.
- AC4: The system shall render `ShareButtons` component (`components/share/share-buttons.tsx`) with three buttons: Twitter, LinkedIn, and Copy Link.
- AC5: The Twitter share button shall open `https://twitter.com/intent/tweet?text={encodedText}&url={encodedUrl}` in a new tab, with `text` defaulting to "Join the waitlist!".
- AC6: The LinkedIn share button shall open `https://www.linkedin.com/sharing/share-offsite/?url={encodedUrl}` in a new tab.
- AC7: The Copy Link button shall copy the referral URL to clipboard and show "Copied!" feedback for 2 seconds.
- AC8: The share buttons shall use the existing `ShareCopyLink` component pattern from `components/share/share-copy-link.tsx` where applicable, or follow the same interaction pattern.
- AC9: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC3): ReferralLink component with copy + feedback
- T2 (AC4-AC8): ShareButtons component with Twitter, LinkedIn, Copy Link
- T3 (AC9): Lint + build verification

## Out of scope

Referral tracking/analytics (Story 8.2), referred subscriber variant (Story 8.3), real-time share count display (Sprint 3).

## Dev Notes

### T1 — ReferralLink Component

Create `components/share/referral-link.tsx` as a **client component**.

**Props interface:**

```ts
interface ReferralLinkProps {
  url: string;
  className?: string;
}
```

**Implementation:**

```tsx
"use client";

import { useState } from "react";

export function ReferralLink({ url, className }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text for manual copy
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg bg-muted px-4 py-3",
        className
      )}
    >
      <input
        type="text"
        value={url}
        readOnly
        className="flex-1 bg-transparent text-body-sm text-foreground outline-none"
        aria-label="Referral link"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-md bg-accent px-3 py-1.5 text-body-sm font-medium text-accent-foreground hover:bg-accent-hover"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
```

**Pattern reference:** `components/share/share-copy-link.tsx` — same clipboard pattern with 2-second feedback.

### T2 — ShareButtons Component

Create `components/share/share-buttons.tsx` as a **client component**.

**Props interface:**

```ts
interface ShareButtonsProps {
  url: string;
  text?: string;
  className?: string;
}
```

**Implementation:**

```tsx
"use client";

import { useState } from "react";

export function ShareButtons({
  url,
  text = "Join the waitlist!",
  className,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md bg-muted px-4 py-2 text-body-sm font-medium text-foreground hover:bg-muted/80"
      >
        Twitter
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md bg-muted px-4 py-2 text-body-sm font-medium text-foreground hover:bg-muted/80"
      >
        LinkedIn
      </a>
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-2 rounded-md bg-muted px-4 py-2 text-body-sm font-medium text-foreground hover:bg-muted/80"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
```

**Pattern reference:** `components/share/share-copy-link.tsx` — follows the same interaction pattern (clipboard write + 2s feedback).

### T3 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files created:**

- `components/share/referral-link.tsx`
- `components/share/share-buttons.tsx`

**Files modified:**

- `src/app/(public)/[subdomain]/thank-you/page.tsx` (import and render ReferralLink + ShareButtons)

**Available components:** `ShareCopyLink` ✓ (pattern reference), `Button` ✓, `Input` ✓
**Available utilities:** `cn()` ✓

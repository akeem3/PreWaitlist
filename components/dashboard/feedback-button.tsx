"use client";

import { useCallback, useState } from "react";
import { ContactModal } from "./contact-modal";

/**
 * Feedback surfaces (Stories 20.3 + 20.6) — fixed bottom-right stack of two
 * circular icon buttons (person above, bubble below):
 *
 *   ( person )   ← "Talk to the founder" as icon button (20.6): opens the
 *                  contact popup. Card-tone circle inverts the FAB so the two
 *                  are distinct at a glance.
 *   ( bubble )   ← feedback FAB (20.3): opens the founder's Tally form as a
 *                  modal popup. Accent-solid circle, original glyph restored.
 *
 * Hover copy: each button grows a label pill out of its left edge on hover /
 * keyboard focus (CSS-only, no native title tooltips). Strings are
 * founder-approved verbatim — "Talk to the founder" (feedback doc §8) and
 * "Submit A Feedback" (founder message 2026-10-09). Screen readers use the
 * matching aria-labels; tooltip spans are aria-hidden.
 *
 * Categories + free-text + follow-up live in the hosted Tally form (AC2 =
 * Tally form options, zero code).
 *
 * AC6: embed.js is injected on FIRST CLICK only (never at mount), then the
 * popup opens via Tally.openPopup — no inline iframe, no layout impact.
 * AC7: each surface hides when its env var is unset (graceful no-op).
 */

const TALLY_SCRIPT_SRC = "https://tally.so/widgets/embed.js";

type TallyWindow = Window & {
  Tally?: {
    openPopup?: (formId: string, options?: Record<string, unknown>) => void;
  };
};

/** Idempotent embed.js loader — created on first click, reused after. */
let tallyScriptPromise: Promise<void> | null = null;

function loadTallyScript(): Promise<void> {
  if (tallyScriptPromise) return tallyScriptPromise;
  if ((window as TallyWindow).Tally) {
    tallyScriptPromise = Promise.resolve();
    return tallyScriptPromise;
  }
  tallyScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TALLY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Tally embed.js"));
    document.head.appendChild(script);
  });
  return tallyScriptPromise;
}

/** formId = slug of the Tally share URL (https://tally.so/r/XXXX). */
function parseFormId(url: string): string | null {
  try {
    const match = new URL(url).pathname.match(/^\/r\/([^/]+)\/?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/** Always-openable escape hatch: raw URL in a new tab (script failed / odd URL). */
function openFallback(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Label pill that grows leftward out of its button on hover / focus.
 * Rendered inside the button (group) so no JS state is needed.
 */
function HoverLabel({
  testId,
  children,
}: {
  testId: string;
  children: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid={testId}
      className="pointer-events-none absolute top-1/2 right-full mr-3 origin-right scale-90 -translate-y-1/2 whitespace-nowrap rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-background opacity-0 shadow-[var(--shadow-float)] transition-all duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
    >
      {children}
    </span>
  );
}

export function FeedbackButton() {
  const tallyUrl = process.env.NEXT_PUBLIC_TALLY_FORM_URL;
  const instagramUrl = process.env.NEXT_PUBLIC_FOUNDER_INSTAGRAM_URL;
  const email = process.env.NEXT_PUBLIC_FOUNDER_EMAIL;
  const [opening, setOpening] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const handleOpenFeedback = useCallback(async () => {
    if (!tallyUrl || opening) return;
    const formId = parseFormId(tallyUrl);
    if (!formId) {
      openFallback(tallyUrl);
      return;
    }
    setOpening(true);
    try {
      await loadTallyScript();
      const openPopup = (window as TallyWindow).Tally?.openPopup;
      if (openPopup) {
        openPopup(formId, { layout: "modal" });
      } else {
        openFallback(tallyUrl);
      }
    } catch {
      openFallback(tallyUrl);
    } finally {
      setOpening(false);
    }
  }, [tallyUrl, opening]);

  if (!tallyUrl && !instagramUrl && !email) return null;

  return (
    <>
      <div
        data-testid="feedback-surfaces"
        className="fixed right-6 bottom-6 z-30 flex flex-col items-end gap-3"
      >
        {(instagramUrl || email) && (
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            aria-label="Talk to the founder"
            data-testid="founder-contact-pill"
            className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[var(--shadow-float)] transition-colors hover:border-accent/30 hover:text-accent"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <HoverLabel testId="founder-contact-tooltip">
              Talk to the founder
            </HoverLabel>
          </button>
        )}
        {tallyUrl && (
          <button
            type="button"
            onClick={() => void handleOpenFeedback()}
            disabled={opening}
            aria-label="Submit A Feedback"
            data-testid="feedback-fab"
            className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[var(--shadow-float)] transition-colors hover:bg-accent/90 disabled:opacity-70"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.5V6.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <HoverLabel testId="feedback-tooltip">Submit A Feedback</HoverLabel>
          </button>
        )}
      </div>
      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        instagramUrl={instagramUrl}
        email={email}
      />
    </>
  );
}

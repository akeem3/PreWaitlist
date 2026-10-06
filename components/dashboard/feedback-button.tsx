"use client";

import { useCallback, useState } from "react";

/**
 * Feedback surfaces (Story 20.3) — fixed bottom-right stack on the dashboard:
 *
 *   [ Talk to the founder ]   ← §8 link (env NEXT_PUBLIC_FOUNDER_CONTACT_URL)
 *   ( FAB )                   ← opens the founder's Tally form as a modal popup
 *
 * Copy gate (AC5): the only visible string is "Talk to the founder" (verbatim
 * from feedback doc §8). The FAB is icon-only; aria-label/title "Feedback" is
 * the doc's own word (§7 heading "Feedback button"). Categories + free-text +
 * follow-up live in the hosted Tally form (AC2 = Tally form options, zero code).
 *
 * AC6: embed.js is injected on FIRST CLICK only (never at mount), then the
 * popup opens via Tally.openPopup — no inline iframe, no layout impact.
 * AC7: both surfaces hide when their env var is unset (graceful no-op).
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

export function FeedbackButton() {
  const tallyUrl = process.env.NEXT_PUBLIC_TALLY_FORM_URL;
  const contactUrl = process.env.NEXT_PUBLIC_FOUNDER_CONTACT_URL;
  const [opening, setOpening] = useState(false);

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

  if (!tallyUrl && !contactUrl) return null;

  return (
    <div
      data-testid="feedback-surfaces"
      className="fixed right-6 bottom-6 z-30 flex flex-col items-end gap-3"
    >
      {contactUrl && (
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="founder-contact-link"
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-float)] transition-colors hover:border-accent/30 hover:text-accent"
        >
          Talk to the founder
        </a>
      )}
      {tallyUrl && (
        <button
          type="button"
          onClick={() => void handleOpenFeedback()}
          disabled={opening}
          aria-label="Feedback"
          title="Feedback"
          data-testid="feedback-fab"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[var(--shadow-float)] transition-colors hover:bg-accent/90 disabled:opacity-70"
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
        </button>
      )}
    </div>
  );
}

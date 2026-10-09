"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Founder contact popup (Story 20.6) — modal opened by the "Talk to the
 * founder" pill. One row per set channel (Instagram DM deep link, Email
 * mailto); rows hide independently, and the pill hides when both are unset.
 *
 * Copy gate (AC5): title reuses §8 "Talk to the founder"; row labels are the
 * founder-provided names (Instagram, Email); close reuses UpgradeModal's
 * aria-label="Close" verbatim. Zero new strings.
 */

type ContactModalProps = {
  open: boolean;
  onClose: () => void;
  instagramUrl?: string;
  email?: string;
};

function InstagramIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m3.5 7.5 8.5 6 8.5-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ContactModal({
  open,
  onClose,
  instagramUrl,
  email,
}: ContactModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Talk to the founder"
        data-testid="contact-modal"
        className="relative mx-4 max-h-[calc(100dvh-2rem)] w-full max-w-xs overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-float)]"
      >
        <div className="flex items-center justify-between py-1 pl-3 pr-1">
          <h2 className="text-base font-semibold text-foreground">
            Talk to the founder
          </h2>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close"
            data-testid="contact-modal-close"
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="contact-row-instagram"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <InstagramIcon />
            Instagram
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            data-testid="contact-row-email"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <EmailIcon />
            Email
          </a>
        )}
      </div>
    </div>
  );
}

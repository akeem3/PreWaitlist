"use client";

import { useEffect, useState } from "react";
import { cn } from "../lib/cn";

interface ShareButtonsProps {
  url: string;
  text?: string;
  className?: string;
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard API failed — fall through to execCommand
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function ShareButtons({
  url,
  text = "Join the waitlist!",
  className,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
      } catch {
        // User cancelled or share failed — silently ignore
      }
    } else {
      await handleCopyLink();
    }
  }

  async function handleCopyLink() {
    const ok = await copyToClipboard(url);
    if (ok) setCopied(true);
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={handleShare}
        className="flex flex-1 items-center justify-center gap-2 rounded-(--card-radius) bg-accent px-6 py-3 text-body-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        Share
      </button>
      <button
        type="button"
        onClick={handleCopyLink}
        className="flex flex-1 items-center justify-center gap-2 rounded-(--card-radius) border border-border bg-card px-6 py-3 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}

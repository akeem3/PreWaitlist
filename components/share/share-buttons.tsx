"use client";

import { useEffect, useState } from "react";
import { cn } from "../lib/cn";

interface ShareButtonsProps {
  url: string;
  text?: string;
  className?: string;
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

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard write failed — silently ignore
    }
  }

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        Twitter
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        LinkedIn
      </a>
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-body-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}

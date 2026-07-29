"use client";

import { useEffect, useState } from "react";
import { cn } from "../lib/cn";

interface ShareCopyLinkProps {
  url: string;
  onShare?: () => void;
  onCopy?: () => void;
  className?: string;
}

function getCanShare(): boolean {
  return (
    typeof navigator !== "undefined" && typeof navigator.share === "function"
  );
}

export default function ShareCopyLink({
  url,
  onShare,
  onCopy,
  className,
}: ShareCopyLinkProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleShare() {
    try {
      await navigator.share({ url });
      onShare?.();
    } catch {
      // User cancelled or share failed — silently ignore
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopy?.();
    } catch {
      // Clipboard write failed — silently ignore
    }
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {getCanShare() && (
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex h-10 items-center justify-center rounded-[var(--button-radius)] border border-border bg-background px-4 text-body-sm text-foreground transition-colors duration-normal hover:bg-muted"
        >
          Share
        </button>
      )}
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-10 items-center justify-center rounded-[var(--button-radius)] border border-border bg-background px-4 text-body-sm text-foreground transition-colors duration-normal hover:bg-muted"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}

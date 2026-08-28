"use client";

import { useEffect, useState } from "react";
import { cn } from "../lib/cn";

interface ReferralLinkProps {
  url: string;
  className?: string;
}

export function ReferralLink({ url, className }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard write failed — silently ignore
    }
  }

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
        aria-label="Referral link"
        className="flex-1 bg-transparent text-body-sm text-foreground outline-none"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-body-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

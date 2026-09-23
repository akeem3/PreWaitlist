"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "../lib/cn";

interface WaitlistItem {
  id: string;
  subdomain: string;
  product_name: string | null;
  logo_url: string | null;
  is_archived: boolean;
  subscriberCount?: number;
}

interface WaitlistSwitcherProps {
  waitlists: WaitlistItem[];
  activeWaitlistId: string;
  onSelect: (waitlistId: string) => void;
  tier?: string;
  onUpgradeClick?: () => void;
}

const STORAGE_KEY = "active_waitlist_id";

export function WaitlistSwitcher({
  waitlists,
  activeWaitlistId,
  onSelect,
  tier = "free",
  onUpgradeClick,
}: WaitlistSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const active = waitlists.find((w) => w.id === activeWaitlistId);

  const close = useCallback(() => setIsOpen(false), []);

  // Click-outside handler
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, close]);

  function handleSelect(waitlistId: string) {
    onSelect(waitlistId);
    close();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg border border-accent px-3 py-2 transition-colors hover:bg-accent/5"
      >
        {active?.logo_url ? (
          <Image
            src={active.logo_url}
            alt={active.product_name || "Logo"}
            width={32}
            height={32}
            className="rounded"
            unoptimized
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/10">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-accent"
            >
              <path
                d="M2 4L8 2L14 4V12L8 14L2 12V4Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
        <span className="flex-1 truncate text-left text-body-sm font-semibold text-foreground">
          {active?.product_name || "PreWaitlist"}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={cn(
            "text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        >
          <path
            d="M3 5L6 8L9 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
          {waitlists.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => handleSelect(w.id)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left text-body-sm transition-colors",
                w.id === activeWaitlistId
                  ? "bg-accent/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="flex-1 truncate">
                {w.product_name || "Untitled"}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {w.subscriberCount ?? ""}
              </span>
              {w.is_archived && (
                <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  Archived
                </span>
              )}
              {w.id === activeWaitlistId && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="shrink-0 text-accent"
                >
                  <path
                    d="M3 7L6 10L11 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}

          <div className="border-t border-border px-3 py-2">
            {tier === "free" ? (
              <button
                type="button"
                onClick={() => {
                  onUpgradeClick?.();
                  close();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-accent bg-transparent px-3 py-2 text-body-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 3V11M3 7H11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Add new waitlist
              </button>
            ) : (
              <Link
                href="/onboarding/1"
                onClick={close}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-body-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 3V11M3 7H11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Add New Waitlist
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { STORAGE_KEY };

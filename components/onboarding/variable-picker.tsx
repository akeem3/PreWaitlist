"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

interface VariableOption {
  id: string;
  label: string;
  description: string;
}

const VARIABLES: VariableOption[] = [
  {
    id: "first_name",
    label: "First Name",
    description: "Subscriber's first name",
  },
  { id: "position", label: "Position", description: "Their number in line" },
  {
    id: "product_name",
    label: "Product Name",
    description: "Your product name",
  },
  {
    id: "referral_link",
    label: "Referral Link",
    description: "Their unique share link",
  },
  {
    id: "referral_count",
    label: "Referral Count",
    description: "How many they've referred",
  },
  {
    id: "total_signups",
    label: "Total Signups",
    description: "Total on the waitlist",
  },
  {
    id: "spots_moved",
    label: "Spots Moved",
    description: "Positions they've climbed",
  },
];

interface VariablePickerProps {
  onSelect: (variableId: string) => void;
  disabled?: boolean;
}

export function VariablePicker({ onSelect, disabled }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  function handleSelect(id: string) {
    onSelect(id);
    close();
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent transition-all hover:bg-accent/10 hover:border-accent/40",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1V11M1 6H11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Insert variable
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] w-72 rounded-xl border border-border bg-card shadow-lg"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
            role="listbox"
          >
            <div className="border-b border-border px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">
                Available variables
              </p>
            </div>
            <div className="max-h-[280px] overflow-y-auto p-1.5">
              {VARIABLES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(v.id);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                >
                  <span className="inline-flex h-6 min-w-[60px] items-center justify-center rounded-md border border-accent/20 bg-accent/10 px-2 text-[11px] font-semibold text-accent">
                    {v.id === "position" ? `#${v.id}` : v.id}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {v.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {v.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

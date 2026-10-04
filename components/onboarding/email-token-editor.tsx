"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import {
  MentionsInput,
  Mention,
  type MentionsInputChangeEvent,
  type MentionsInputHandle,
} from "react-mentions-ts";
import { cn } from "../lib/cn";

const VARIABLE_DATA = [
  { id: "first_name", display: "First Name" },
  { id: "position", display: "Position" },
  { id: "product_name", display: "Product Name" },
  { id: "referral_link", display: "Referral Link" },
  { id: "referral_count", display: "Referral Count" },
  { id: "total_signups", display: "Total Signups" },
  { id: "spots_moved", display: "Spots Moved" },
];

interface EmailTokenEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  singleLine?: boolean;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

export interface EmailTokenEditorHandle {
  insertText: (text: string) => void;
}

export const EmailTokenEditor = forwardRef<
  EmailTokenEditorHandle,
  EmailTokenEditorProps
>(function EmailTokenEditor(
  {
    value,
    onChange,
    placeholder,
    singleLine = false,
    disabled,
    rows = 4,
    className,
  },
  ref
) {
  const mentionsRef = useRef<MentionsInputHandle>(null);

  useImperativeHandle(
    ref,
    () => ({
      insertText: (text: string) => {
        mentionsRef.current?.insertText(text);
      },
    }),
    []
  );

  const handleChange = useCallback(
    (change: MentionsInputChangeEvent) => {
      onChange(change.value);
    },
    [onChange]
  );

  return (
    <div className={cn("relative", className)}>
      <MentionsInput
        ref={mentionsRef}
        value={value}
        onMentionsChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        singleLine={singleLine}
        autoResize={!singleLine}
        rows={singleLine ? undefined : rows}
        className={cn(
          "text-sm leading-6",
          singleLine ? "h-11" : undefined,
          disabled && "pointer-events-none opacity-50"
        )}
        classNames={{
          control: cn(
            "rounded-(--radius-lg) border border-border bg-card transition-colors",
            "focus-within:border-accent focus-within:ring-1 focus-within:ring-accent",
            singleLine && "h-11"
          ),
          input: cn(
            "text-sm leading-6 text-foreground placeholder:text-muted-foreground",
            singleLine ? "h-full px-3" : "px-3 py-3",
            "disabled:cursor-not-allowed disabled:opacity-50"
          ),
          highlighter: cn(
            "text-sm leading-6 px-3",
            singleLine ? "flex h-full items-center" : "py-3"
          ),
          suggestions:
            "rounded-lg border border-border bg-card shadow-[var(--shadow-float)] overflow-hidden z-50",
          suggestionsList: "m-0 p-0 list-none",
          suggestionItem:
            "px-3 py-2 text-sm text-foreground cursor-pointer border-b border-border last:border-b-0",
          suggestionItemFocused: "bg-accent text-accent-foreground",
          suggestionDisplay: "font-medium",
        }}
      >
        <Mention
          trigger="{{"
          data={VARIABLE_DATA}
          markup="{{__id__}}"
          displayTransform={(id) => `{{${id}}}`}
          appendSpaceOnAdd
          className="bg-accent/15"
        />
      </MentionsInput>
    </div>
  );
});

export { VARIABLE_DATA };

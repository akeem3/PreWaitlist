"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";
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

type MentionStyleKeys =
  | "control"
  | "input"
  | "highlighter"
  | "suggestions"
  | "suggestionsList"
  | "suggestionItem"
  | "suggestionItemFocused"
  | "suggestionDisplay";

type MentionStyles = Record<MentionStyleKeys, CSSProperties>;

const MENTION_STYLES: MentionStyles = {
  control: {
    minHeight: "80px",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  input: {
    width: "100%",
    minHeight: "80px",
    padding: "12px",
    fontSize: "14px",
    lineHeight: "1.5",
    fontFamily: "inherit",
    color: "var(--color-foreground)",
    backgroundColor: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--input-radius, 8px)",
    outline: "none",
    resize: "vertical" as const,
  },
  highlighter: {
    padding: "12px",
    fontSize: "14px",
    lineHeight: "1.5",
    fontFamily: "inherit",
    overflow: "hidden",
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none" as const,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
  },
  suggestions: {
    borderRadius: "var(--input-radius, 8px)",
    border: "1px solid var(--color-border)",
    backgroundColor: "var(--color-background)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  suggestionsList: {
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  suggestionItem: {
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "13px",
    borderBottom: "1px solid var(--color-border)",
    color: "var(--color-foreground)",
  },
  suggestionItemFocused: {
    backgroundColor: "var(--color-accent)",
    color: "var(--color-accent-foreground)",
  },
  suggestionDisplay: {
    fontWeight: 500,
  },
};

const SINGLE_LINE_STYLES: MentionStyles = {
  ...MENTION_STYLES,
  control: {
    minHeight: "40px",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  input: {
    ...MENTION_STYLES.input,
    minHeight: "40px",
    resize: "none" as const,
    overflow: "hidden" as const,
  },
  highlighter: {
    ...MENTION_STYLES.highlighter,
    whiteSpace: "nowrap" as const,
    overflow: "hidden" as const,
  },
};

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

  const styles = (singleLine
    ? SINGLE_LINE_STYLES
    : MENTION_STYLES) as unknown as CSSProperties;

  return (
    <div className={cn("relative", className)}>
      <MentionsInput
        ref={mentionsRef}
        value={value}
        onMentionsChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        singleLine={singleLine}
        rows={singleLine ? undefined : rows}
        style={styles}
        classNames={{
          control: "email-token-control",
          highlighter: "email-token-highlighter",
          input: "email-token-input",
          suggestions: "email-token-suggestions",
          suggestionsList: "email-token-suggestions-list",
          suggestionItem: "email-token-suggestion-item",
          suggestionItemFocused: "email-token-suggestion-item-focused",
          suggestionDisplay: "email-token-suggestion-display",
        }}
      >
        <Mention
          trigger="{{"
          data={VARIABLE_DATA}
          markup="{{__id__}}"
          displayTransform={(id, display) =>
            id === "position" ? `#${display || id}` : `{{${display || id}}}`
          }
          appendSpaceOnAdd
          className="rounded-sm bg-accent/15 text-accent font-semibold"
        />
      </MentionsInput>
    </div>
  );
});

export { VARIABLE_DATA };

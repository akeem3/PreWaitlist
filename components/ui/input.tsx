import * as React from "react";
import { cn } from "../lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, disabled, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-[var(--input-radius)] border bg-[var(--input-background)] px-[var(--input-padding-x)] py-[var(--input-padding-y)] text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:border-[var(--input-border-color-focus)]",
            "disabled:cursor-not-allowed disabled:bg-[var(--input-background-disabled)] disabled:opacity-50",
            error
              ? "border-[var(--input-border-color-error)]"
              : "border-[var(--input-border-color)]",
            className
          )}
          ref={ref}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-error"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-caption">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input, type InputProps };

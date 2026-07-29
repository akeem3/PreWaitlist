import * as React from "react";
import { cn } from "../lib/cn";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showStrength?: boolean;
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "#E53E3E" };
  if (score <= 3) return { score, label: "Medium", color: "#F59E0B" };
  return { score, label: "Strong", color: "#0F7A5E" };
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      disabled,
      id,
      showStrength = false,
      value,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const password = typeof value === "string" ? value : "";
    const strength =
      showStrength && password.length > 0
        ? getPasswordStrength(password)
        : null;
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
        <div className="relative">
          <input
            id={inputId}
            type={visible ? "text" : "password"}
            className={cn(
              "flex h-10 w-full rounded-[var(--input-radius)] border bg-[var(--input-background)] px-[var(--input-padding-x)] py-[var(--input-padding-y)] pr-10 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium",
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
                  : strength
                    ? `${inputId}-strength`
                    : undefined
            }
            value={value}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6459] hover:text-foreground"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {strength && (
          <div
            id={`${inputId}-strength`}
            role="progressbar"
            aria-label={`Password strength: ${strength.label}`}
            aria-valuenow={strength.score}
            aria-valuemin={0}
            aria-valuemax={5}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor:
                      strength.score >= i + 1 ? strength.color : "#E2E0DC",
                  }}
                />
              ))}
            </div>
            <p className="mt-1 text-xs" style={{ color: strength.color }}>
              {strength.label}
            </p>
          </div>
        )}
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
PasswordInput.displayName = "PasswordInput";

export { PasswordInput, type PasswordInputProps };

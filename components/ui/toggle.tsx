import * as React from "react";
import { cn } from "../lib/cn";

interface ToggleProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      className,
      checked = false,
      onCheckedChange,
      label,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const toggleId = id || generatedId;

    return (
      <div className="flex items-center gap-2">
        <button
          id={toggleId}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onCheckedChange?.(!checked)}
          className={cn(
            "peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-normal ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-accent" : "bg-border",
            className
          )}
          style={{
            width: 40,
            height: 24,
          }}
          ref={ref}
          {...props}
        >
          <span
            className="pointer-events-none block rounded-full bg-white shadow-sm ring-0 transition-transform duration-normal ease-out"
            style={{
              width: 20,
              height: 20,
              transform: checked ? "translateX(18px)" : "translateX(2px)",
            }}
          />
        </button>
        {label && (
          <label
            htmlFor={toggleId}
            className="text-label text-foreground cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Toggle.displayName = "Toggle";

export { Toggle, type ToggleProps };

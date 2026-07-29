import * as React from "react";
import { cn } from "../lib/cn";

type BadgeVariant =
  "default" | "success" | "warning" | "error" | "info" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-muted text-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  error: "bg-error text-error-foreground",
  info: "bg-info text-info-foreground",
  outline: "border border-border bg-transparent text-foreground",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-[var(--badge-radius)] px-[var(--badge-padding-x)] py-[var(--badge-padding-y)] text-[length:var(--badge-font-size)] font-medium",
          variantStyles[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, type BadgeProps, type BadgeVariant };

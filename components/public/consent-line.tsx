import Link from "next/link";
import { cn } from "../lib/cn";

export function ConsentLine({
  isDark,
  className,
}: {
  isDark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-xs",
        className,
        isDark ? "text-dark-template-muted" : "text-muted-foreground"
      )}
    >
      By joining, you agree to receive emails and accept our{" "}
      <Link
        href="/legal/terms"
        className={cn(
          "underline",
          isDark ? "hover:text-dark-template-text" : "hover:text-foreground"
        )}
      >
        Terms
      </Link>{" "}
      and{" "}
      <Link
        href="/legal/privacy"
        className={cn(
          "underline",
          isDark ? "hover:text-dark-template-text" : "hover:text-foreground"
        )}
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}

export function TrustLine({
  isDark,
  className,
}: {
  isDark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-2 text-center text-xs",
        className,
        isDark ? "text-dark-template-muted" : "text-muted-foreground"
      )}
    >
      No spam. Unsubscribe anytime.
    </p>
  );
}

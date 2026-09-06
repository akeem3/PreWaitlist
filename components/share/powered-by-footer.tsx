import Image from "next/image";
import Link from "next/link";

type Template = "minimal" | "bold" | "dark";

interface PoweredByFooterProps {
  template: Template;
}

export function PoweredByFooter({ template }: PoweredByFooterProps) {
  const isDark = template === "dark";

  return (
    <div
      className={`flex items-center justify-center gap-1 py-6 text-xs font-normal leading-none ${
        isDark
          ? "border-t border-dark-template-border bg-dark-template-bg text-dark-template-text"
          : "border-t border-border bg-card text-foreground"
      }`}
    >
      <span className="inline-flex items-center gap-1">
        <Link
          href="/?ref=powered-by"
          className="inline-flex items-center gap-1 no-underline"
        >
          <span
            className={isDark ? "text-dark-template-text" : "text-foreground"}
          >
            Powered by
          </span>
        </Link>
        <Link href="/" className="inline-flex items-center no-underline">
          <Image
            src="/PreWaitlist-logo.svg"
            alt="PreWaitlist"
            width={90}
            height={31}
            className="inline-block"
          />
        </Link>
      </span>
    </div>
  );
}

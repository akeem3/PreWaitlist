import Image from "next/image";
import Link from "next/link";

type Template = "minimal" | "bold" | "dark";

interface PoweredByFooterProps {
  template: Template;
  brandColor?: string;
}

export function PoweredByFooter({
  template,
  brandColor,
}: PoweredByFooterProps) {
  const isDark = template === "dark";

  return (
    <div
      className={`flex items-center justify-center gap-1 py-6 text-xs font-normal leading-none ${
        isDark
          ? "border-t border-dark-template-border"
          : "border-t border-border"
      }`}
    >
      <Link
        href="/?ref=powered-by"
        className="inline-flex items-center gap-1 no-underline"
      >
        <span
          className={isDark ? "text-muted-foreground" : "text-muted-foreground"}
        >
          Powered by
        </span>
        <Image
          src="/PreWaitlist-logo.svg"
          alt="PreWaitlist"
          width={90}
          height={31}
          className="inline-block"
        />
      </Link>
    </div>
  );
}

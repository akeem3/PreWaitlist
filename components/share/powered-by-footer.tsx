import Image from "next/image";
import Link from "next/link";

type Template = "minimal" | "bold" | "dark";

interface PoweredByFooterProps {
  template: Template;
  /** When true, renders without bg color — for public/thank-you pages */
  standalone?: boolean;
}

export function PoweredByFooter({
  template,
  standalone,
}: PoweredByFooterProps) {
  const isDark = template === "dark";

  const borderClass = isDark ? "border-dark-template-border" : "border-border";
  const textClass = isDark ? "text-dark-template-text" : "text-foreground";

  return (
    <div
      className={`flex items-center justify-center gap-1 py-6 text-xs font-normal leading-none border-t ${
        standalone
          ? borderClass
          : `${borderClass} ${isDark ? "bg-dark-template-bg" : "bg-card"} ${textClass}`
      }`}
    >
      <span className="inline-flex items-center gap-1">
        <Link
          href="/?ref=powered-by"
          className="inline-flex items-center gap-1 no-underline"
        >
          <span className={textClass}>Powered by</span>
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
        <span className={`mx-1 ${textClass}`}>·</span>
        <Link
          href="/legal/privacy"
          className={`no-underline ${textClass} hover:underline`}
        >
          Privacy
        </Link>
        <span className={`mx-1 ${textClass}`}>·</span>
        <Link
          href="/legal/terms"
          className={`no-underline ${textClass} hover:underline`}
        >
          Terms
        </Link>
      </span>
    </div>
  );
}

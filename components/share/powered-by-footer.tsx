import Image from "next/image";
import Link from "next/link";

type Template = "minimal" | "bold" | "dark";

// Footer always links to the marketing site root — never the founder's
// subdomain — so legal pages and the "Powered by" attribution are absolute.
const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.prewaitlist.com";

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
          href={`${SITE_URL}/?src=powered-by`}
          className="inline-flex items-center gap-1 no-underline"
        >
          <span className={textClass}>Powered by</span>
        </Link>
        <Link
          href={`${SITE_URL}/?src=powered-by`}
          className="inline-flex items-center no-underline"
        >
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
          href={`${SITE_URL}/legal/privacy`}
          className={`no-underline ${textClass} hover:underline`}
        >
          Privacy
        </Link>
        <span className={`mx-1 ${textClass}`}>·</span>
        <Link
          href={`${SITE_URL}/legal/terms`}
          className={`no-underline ${textClass} hover:underline`}
        >
          Terms
        </Link>
      </span>
    </div>
  );
}

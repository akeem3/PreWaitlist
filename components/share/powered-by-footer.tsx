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
          ? "border-t border-dark-template-border"
          : "border-t border-border"
      }`}
    >
      <Link href="/" className="inline-flex items-center gap-1 no-underline">
        <span
          className={isDark ? "text-muted-foreground" : "text-muted-foreground"}
        >
          Powered by
        </span>
        <Image
          src="/main-logo.svg"
          alt=""
          width={16}
          height={16}
          className="inline-block"
        />
        <span className="font-medium text-accent">MyWaitlist</span>
      </Link>
    </div>
  );
}

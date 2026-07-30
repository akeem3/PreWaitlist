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
      style={{
        borderTop: isDark ? "1px solid #292524" : "1px solid #E5E0D6",
        paddingTop: 24,
        paddingBottom: 24,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        fontSize: "var(--text-xs, 0.75rem)",
        fontWeight: "var(--font-regular, 400)",
        lineHeight: 1,
      }}
    >
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          textDecoration: "none",
        }}
      >
        <span
          style={{
            color: isDark ? "#A8A29E" : "#6B6459",
          }}
        >
          Powered by
        </span>
        <Image
          src="/main-logo.svg"
          alt=""
          width={16}
          height={16}
          style={{ display: "inline-block" }}
        />
        <span
          style={{
            color: isDark ? "#0F7A5E" : "#0F7A5E",
            fontWeight: "var(--font-medium, 500)",
          }}
        >
          MyWaitlist
        </span>
      </Link>
    </div>
  );
}

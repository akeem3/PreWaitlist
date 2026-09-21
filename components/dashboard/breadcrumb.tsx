"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  settings: "Settings",
  waitlists: "Waitlist Settings",
  profile: "Profile",
  security: "Security",
  billing: "Billing",
};

function formatSegment(
  segment: string,
  overrides?: Record<string, string>
): string {
  if (overrides?.[segment]) return overrides[segment];
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (segment.startsWith("[") && segment.endsWith("]")) return "";
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  segmentOverrides?: Record<string, string>;
  items?: BreadcrumbItem[];
}

export function Breadcrumb({ segmentOverrides, items }: BreadcrumbProps) {
  const pathname = usePathname();

  let resolvedItems: { label: string; href: string; isLast: boolean }[];

  if (items && items.length > 0) {
    resolvedItems = items.map((item, i) => ({
      label: item.label,
      href: item.href ?? pathname,
      isLast: i === items.length - 1,
    }));
  } else {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 1) return null;

    const computed: { label: string; href: string; isLast: boolean }[] = [];
    let builtPath = "";

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      builtPath += `/${segment}`;
      const label = formatSegment(segment, segmentOverrides);

      if (!label) {
        if (i < segments.length - 1) builtPath += `/${segments[i + 1]}`;
        continue;
      }

      computed.push({
        label,
        href: builtPath,
        isLast: i === segments.length - 1,
      });
    }

    resolvedItems = computed;
  }

  if (resolvedItems.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm">
        {resolvedItems.map((item, index) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {index > 0 && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="shrink-0 text-muted-foreground/50"
              >
                <path
                  d="M4.5 2L7.5 6L4.5 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {item.isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

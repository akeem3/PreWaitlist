"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "../lib/cn";

interface SidebarProps {
  waitlistName: string | null;
  logoUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  tier?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
  locked?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "COMMAND CENTER",
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect
              x="2"
              y="2"
              width="5"
              height="5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x="9"
              y="2"
              width="5"
              height="5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x="2"
              y="9"
              width="5"
              height="5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x="9"
              y="9"
              width="5"
              height="5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        ),
      },
      {
        label: "Subscribers",
        href: "/dashboard",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle
              cx="6"
              cy="5"
              r="2.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M1.5 14C1.5 11.5 3.5 10 6 10C8.5 10 10.5 11.5 10.5 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle
              cx="11"
              cy="5"
              r="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M10.5 10C12 10.5 13.5 11.5 14.5 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
    ],
  },
  {
    title: "INSIGHTS",
    items: [
      {
        label: "Qualification",
        href: "#",
        disabled: true,
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect
              x="2"
              y="2"
              width="12"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M5 8L7 10L11 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        label: "Leaderboard",
        href: "#",
        disabled: true,
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 2H12V6C12 8.2 10.2 10 8 10C5.8 10 4 8.2 4 6V2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M6 10V12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M10 10V12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M4 12H12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        label: "Warmth",
        href: "#",
        locked: true,
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2C8 2 4 6 4 9.5C4 11.7 5.8 13.5 8 13.5C10.2 13.5 12 11.7 12 9.5C12 6 8 2 8 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ],
  },
  {
    title: "ENGAGEMENT",
    items: [
      {
        label: "Updates",
        href: "/dashboard/updates",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 6C12 3.8 10.2 2 8 2C5.8 2 4 3.8 4 6V9L2.5 11V12H13.5V11L12 9V6Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M6.5 13C6.8 13.6 7.3 14 8 14C8.7 14 9.2 13.6 9.5 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        label: "Broadcast",
        href: "/dashboard/broadcast",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M13 3L6 7H3V9H6L13 13V3Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M10 5.5C11 6.5 11 9.5 10 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
    ],
  },
  {
    title: "CONFIG",
    items: [
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 1.5V3M8 13V14.5M14.5 8H13M3 8H1.5M12.6 3.4L11.5 4.5M4.5 11.5L3.4 12.6M12.6 12.6L11.5 11.5M4.5 4.5L3.4 3.4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
    ],
  },
];

function flattenNavItems(sections: NavSection[]): NavItem[] {
  return sections.flatMap((s) => s.items);
}

const ALL_NAV_ITEMS = flattenNavItems(NAV_SECTIONS);

export function Sidebar({
  waitlistName,
  logoUrl,
  isOpen,
  onClose,
  onSignOut,
  tier = "free",
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-67 flex-col border-r border-border bg-background",
          "transition-transform duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-border px-3 py-4">
          <div className="flex items-center gap-3 rounded-lg border border-accent px-3 py-2">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={waitlistName || "Logo"}
                width={32}
                height={32}
                className="rounded"
                unoptimized
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/10">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-accent"
                >
                  <path
                    d="M2 4L8 2L14 4V12L8 14L2 12V4Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            <span className="flex-1 truncate text-left text-body-sm font-semibold text-foreground">
              {waitlistName || "PreWaitlist"}
            </span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-2">
              <span className="block px-3 py-1 text-overline text-muted-foreground">
                {section.title}
              </span>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href &&
                  ALL_NAV_ITEMS.findIndex((n) => n.href === item.href) ===
                    ALL_NAV_ITEMS.indexOf(item);
                const isLocked =
                  ("locked" in item && item.locked) ||
                  (item.label === "Broadcast" && tier === "free");
                const isDisabled = "disabled" in item && item.disabled;

                if (isLocked) {
                  return (
                    <span
                      key={item.label}
                      title="Pro feature — upgrade to unlock"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm text-muted-foreground opacity-50 cursor-not-allowed"
                    >
                      {item.icon}
                      {item.label}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        className="ml-auto text-muted-foreground"
                      >
                        <rect
                          x="2.5"
                          y="5"
                          width="7"
                          height="5.5"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M4 5V3.5C4 2.4 4.9 1.5 6 1.5C7.1 1.5 8 2.4 8 3.5V5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  );
                }

                if (isDisabled) {
                  return (
                    <span
                      key={item.label}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm text-muted-foreground opacity-50 cursor-not-allowed"
                    >
                      {item.icon}
                      {item.label}
                      <span className="ml-auto text-xs text-muted-foreground">
                        Coming soon
                      </span>
                    </span>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-full px-3 py-2 text-body-sm transition-colors",
                      isActive
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-border px-3 py-4">
          {tier === "free" && (
            <button
              type="button"
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-accent bg-transparent px-3 py-2 text-body-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground group"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-accent group-hover:text-accent-foreground"
              >
                <path
                  d="M7 1L8.8 5.2L13.5 5.8L10.1 9L11 13.5L7 11.4L3 13.5L3.9 9L0.5 5.8L5.2 5.2L7 1Z"
                  fill="currentColor"
                />
              </svg>
              Upgrade to Pro
            </button>
          )}
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-body-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

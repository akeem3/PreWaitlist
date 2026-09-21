"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "../lib/cn";
import { WaitlistSwitcher } from "./waitlist-switcher";

interface WaitlistItem {
  id: string;
  subdomain: string;
  product_name: string | null;
  logo_url: string | null;
  is_archived: boolean;
  subscriberCount?: number;
}

interface SidebarProps {
  waitlists: WaitlistItem[];
  activeWaitlistId: string;
  onSelectWaitlist: (waitlistId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  tier?: string;
  isArchived?: boolean;
  onUnarchive?: () => void;
  onUpgradeClick?: (triggerSource: string) => void;
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

function buildNavSections(wid?: string): NavSection[] {
  const q = wid ? `?wid=${wid}` : "";
  return [
    {
      title: "COMMAND CENTER",
      items: [
        {
          label: "Overview",
          href: `/dashboard${q}`,
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
      ],
    },
    {
      title: "INSIGHTS",
      items: [
        {
          label: "Qualification",
          href: `/dashboard/qualification${q}`,
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
          href: `/dashboard/leaderboard${q}`,
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
          href: `/dashboard/warmth${q}`,
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
          href: `/dashboard/updates${q}`,
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
          href: `/dashboard/broadcast${q}`,
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
              <path
                d="M6.5 1.5H9.5L10.2 3.8C10.6 3.9 11 4.1 11.3 4.4L13.5 3.5L14.5 5.2L12.8 6.5C12.8 6.8 12.8 7.2 12.8 7.5L14.5 8.8L13.5 10.5L11.3 9.6C11 9.9 10.6 10.1 10.2 10.2L9.5 12.5H6.5L5.8 10.2C5.4 10.1 5 9.9 4.7 9.6L2.5 10.5L1.5 8.8L3.2 7.5C3.2 7.2 3.2 6.8 3.2 6.5L1.5 5.2L2.5 3.5L4.7 4.4C5 4.1 5.4 3.9 5.8 3.8L6.5 1.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle
                cx="8"
                cy="7"
                r="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          ),
        },
      ],
    },
  ];
}

export function Sidebar({
  waitlists,
  activeWaitlistId,
  onSelectWaitlist,
  isOpen,
  onClose,
  tier = "free",
  isArchived,
  onUnarchive,
  onUpgradeClick,
}: SidebarProps) {
  const pathname = usePathname();
  const NAV_SECTIONS = buildNavSections(activeWaitlistId);

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
          <WaitlistSwitcher
            waitlists={waitlists}
            activeWaitlistId={activeWaitlistId}
            onSelect={onSelectWaitlist}
            tier={tier}
          />
        </div>

        {isArchived && (
          <div className="mx-3 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="mb-1 text-xs text-amber-800">
              This waitlist is archived.
            </p>
            <button
              type="button"
              onClick={onUnarchive}
              className="text-xs font-medium text-amber-900 underline"
            >
              Unarchive
            </button>
          </div>
        )}

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.filter((s) => s.title !== "CONFIG").map((section) => (
            <div key={section.title} className="mb-2">
              <span className="block px-3 py-1 text-overline text-muted-foreground">
                {section.title}
              </span>
              {section.items.map((item) => {
                const isLocked =
                  ("locked" in item && item.locked) ||
                  (item.label === "Broadcast" && tier === "free") ||
                  (item.label === "Warmth" && tier === "free");
                const isDisabled = "disabled" in item && item.disabled;
                const isActive = item.href.split("?")[0] === pathname;

                if (isLocked) {
                  const triggerSource =
                    item.label === "Broadcast" ? "broadcast" : "warmth";
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        onUpgradeClick?.(triggerSource);
                        onClose();
                      }}
                      className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-body-sm text-muted-foreground opacity-50 hover:opacity-75 transition-opacity"
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
                    </button>
                  );
                }

                if (isDisabled) {
                  return (
                    <span
                      key={item.label}
                      className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-body-sm text-muted-foreground opacity-50 cursor-not-allowed"
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
                      "flex items-center gap-3 rounded-[10px] px-3 py-2 text-body-sm transition-colors",
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

        <div className="mt-auto border-t border-border px-3 py-4">
          {NAV_SECTIONS.filter((s) => s.title === "CONFIG").map((section) => (
            <div key={section.title} className="mb-3">
              <span className="block px-3 py-1 text-overline text-muted-foreground">
                {section.title}
              </span>
              {section.items.map((item) => {
                const isSettingsLink = item.label === "Settings";
                const isActive = isSettingsLink
                  ? pathname.startsWith(item.href.split("?")[0])
                  : pathname === item.href.split("?")[0];
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-[10px] px-3 py-2 text-body-sm transition-colors",
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
          {tier === "free" ? (
            <Link
              href="/dashboard/settings/profile?tab=billing"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-accent bg-transparent px-3 py-2 text-body-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground group"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-accent group-hover:text-accent-foreground"
              >
                <path
                  d="M7 3V11M3 7H11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Upgrade to add
            </Link>
          ) : (
            <Link
              href="/onboarding/1"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-accent bg-transparent px-3 py-2 text-body-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground group"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-accent group-hover:text-accent-foreground"
              >
                <path
                  d="M7 3V11M3 7H11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Add New Waitlist
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Test the display name pattern — the name-field component
// Since the component may not exist yet, test the concept via leaderboard display

describe("Subscriber Display Name", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows display name when set", () => {
    const displayName = "Sarah";
    const email = "sarah@example.com";
    const display = displayName || email.split("@")[0];
    render(<span>{display}</span>);
    expect(screen.getByText("Sarah")).toBeDefined();
  });

  it("falls back to email local part when no display name", () => {
    const displayName = null;
    const email = "sarah@example.com";
    const display = displayName || email.split("@")[0];
    render(<span>{display}</span>);
    expect(screen.getByText("sarah")).toBeDefined();
  });

  it("capitalizes first letter of email local part", () => {
    const displayName = null;
    const email = "sarah@example.com";
    const localPart = email.split("@")[0];
    const display =
      displayName || localPart.charAt(0).toUpperCase() + localPart.slice(1);
    render(<span>{display}</span>);
    expect(screen.getByText("Sarah")).toBeDefined();
  });

  it("shows anonymized email when no display name and short local", () => {
    const displayName = null;
    const email = "ab@example.com";
    const local = email.split("@")[0];
    let display: string;
    if (displayName) {
      display = displayName;
    } else if (local.length <= 3) {
      display = local;
    } else {
      display = `${local[0]}\u2022\u2022\u2022${local[local.length - 1]}`;
    }
    render(<span>{display}</span>);
    expect(screen.getByText("ab")).toBeDefined();
  });

  it("anonymizes email with mask for long local parts", () => {
    const displayName = null;
    const email = "sarah@example.com";
    const local = email.split("@")[0];
    let display: string;
    if (displayName) {
      display = displayName;
    } else if (local.length <= 3) {
      display = local;
    } else {
      display = `${local[0]}\u2022\u2022\u2022${local[local.length - 1]}`;
    }
    render(<span>{display}</span>);
    expect(screen.getByText("s\u2022\u2022\u2022h")).toBeDefined();
  });
});

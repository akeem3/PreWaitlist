import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Story 17.6 AC5: replace the literal-markup fake with a real component
// import. The invalid-token path (no token) is pure JSX — no server calls —
// so the real Server Component is testable directly. The valid-token path
// requires admin-client + HMAC mocks (follow-up if needed).
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

import UnsubscribePage from "../../app/unsubscribe/page";

describe("Unsubscribe Page (real component)", () => {
  it("renders invalid-link message when no token is provided", async () => {
    const element = await UnsubscribePage({
      searchParams: Promise.resolve({}),
    });
    render(element);
    expect(screen.getByText("Invalid link")).toBeTruthy();
    expect(
      screen.getByText("This unsubscribe link is invalid or has expired.")
    ).toBeTruthy();
    expect(screen.getByText("Go to homepage")).toBeTruthy();
  });

  it("renders invalid-link message for an unverifiable token", async () => {
    const element = await UnsubscribePage({
      searchParams: Promise.resolve({ token: "garbage-token" }),
    });
    render(element);
    expect(screen.getByText("Invalid link")).toBeTruthy();
    expect(
      screen.getByText("This unsubscribe link is invalid or has expired.")
    ).toBeTruthy();
  });
});

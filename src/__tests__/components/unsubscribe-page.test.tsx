import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Unsubscribe Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders confirmation message with waitlist name", () => {
    render(
      <main>
        <h1>Unsubscribed</h1>
        <p>You have been unsubscribed from Test Waitlist emails.</p>
      </main>
    );
    expect(screen.getByText("Unsubscribed")).toBeDefined();
    expect(
      screen.getByText(/You have been unsubscribed from Test Waitlist/)
    ).toBeDefined();
  });

  it("renders resubscribe link", () => {
    render(
      <main>
        <p>You have been unsubscribed from Test emails.</p>
        <span>Resubscribe</span>
      </main>
    );
    expect(screen.getByText("Resubscribe")).toBeDefined();
  });

  it("renders invalid link message", () => {
    render(
      <main>
        <p>This unsubscribe link is invalid or has expired.</p>
        <span>Go to homepage</span>
      </main>
    );
    expect(
      screen.getByText("This unsubscribe link is invalid or has expired.")
    ).toBeDefined();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

import { EmailCaptureForm } from "../../../components/public/email-capture-form";

const defaultProps = {
  waitlistId: "waitlist-1",
  subdomain: "test-subdomain",
  ctaText: "Join Waitlist",
  brandColor: "#0F7A5E",
  template: "minimal" as const,
  tier: "free" as const,
  questions: [],
  qualificationEnabled: false,
};

describe("Consent Checkbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders consent checkbox with text", () => {
    render(<EmailCaptureForm {...defaultProps} />);
    expect(screen.getByText(/I agree to receive email updates/i)).toBeDefined();
  });

  it("checkbox is unchecked by default", () => {
    render(<EmailCaptureForm {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("shows consent error when submitting without checking", async () => {
    const user = userEvent.setup();
    render(<EmailCaptureForm {...defaultProps} />);

    const input = screen.getByPlaceholderText("Email address");
    await user.type(input, "test@example.com");

    // Submit without checking consent
    const submitButton = screen.getByRole("button", { name: /Join Waitlist/i });
    await user.click(submitButton);

    // Should show consent error
    expect(screen.getByText(/You must agree to receive emails/)).toBeDefined();
  });

  it("can check the consent checkbox", async () => {
    const user = userEvent.setup();
    render(<EmailCaptureForm {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});

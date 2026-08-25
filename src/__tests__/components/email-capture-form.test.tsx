import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmailCaptureForm } from "../../../components/public/email-capture-form";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

describe("EmailCaptureForm", () => {
  it("renders email input with placeholder", () => {
    render(<EmailCaptureForm {...defaultProps} />);
    expect(screen.getByPlaceholderText("Email address")).toBeDefined();
  });

  it("renders submit button with ctaText", () => {
    render(<EmailCaptureForm {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /Join Waitlist/i })
    ).toBeDefined();
  });

  it("displays error for invalid email", async () => {
    const user = userEvent.setup();
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[
          { id: "q1", text: "What brings you here?", type: "free_text" },
        ]}
      />
    );

    const input = screen.getByPlaceholderText("Email address");
    await user.type(input, "invalid-email");

    // Use fireEvent.submit to bypass native HTML5 email validation
    fireEvent.submit(screen.getByRole("button", { name: /Join Waitlist/i }));

    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("clears error on input change", async () => {
    const user = userEvent.setup();
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[
          { id: "q1", text: "What brings you here?", type: "free_text" },
        ]}
      />
    );

    const input = screen.getByPlaceholderText("Email address");
    await user.type(input, "invalid-email");
    fireEvent.submit(screen.getByRole("button", { name: /Join Waitlist/i }));
    expect(screen.getByRole("alert")).toBeDefined();

    await user.type(input, "a");
    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  it("shows loading state during submission", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  status: 201,
                  json: () =>
                    Promise.resolve({ id: "1", referral_code: "abc" }),
                }),
              100
            )
          )
      );
    vi.stubGlobal("fetch", mockFetch);

    const user = userEvent.setup();
    render(<EmailCaptureForm {...defaultProps} />);

    const input = screen.getByPlaceholderText("Email address");
    await user.type(input, "test@example.com");
    await user.click(screen.getByRole("button", { name: /Join Waitlist/i }));

    await waitFor(() => {
      expect(screen.getByText(/Joining/i)).toBeDefined();
    });
  });

  it("displays error on 409 duplicate email", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 409,
      json: () =>
        Promise.resolve({ error: "This email is already on the waitlist" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const user = userEvent.setup();
    render(<EmailCaptureForm {...defaultProps} />);

    const input = screen.getByPlaceholderText("Email address");
    await user.type(input, "test@example.com");
    await user.click(screen.getByRole("button", { name: /Join Waitlist/i }));

    await waitFor(() => {
      expect(
        screen.getByText("This email is already on the waitlist")
      ).toBeDefined();
    });
  });

  it("calls fetch with correct body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 201,
      json: () => Promise.resolve({ id: "1", referral_code: "abc12345" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const user = userEvent.setup();
    render(<EmailCaptureForm {...defaultProps} />);

    const input = screen.getByPlaceholderText("Email address");
    await user.type(input, "test@example.com");
    await user.click(screen.getByRole("button", { name: /Join Waitlist/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waitlist_id: "waitlist-1",
          email: "test@example.com",
        }),
      });
    });
  });
});

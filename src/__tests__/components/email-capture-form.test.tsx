import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
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

function freeTextQuestion(text: string, id = "q-1") {
  return {
    id,
    text,
    type: "free_text" as const,
    options: null,
  };
}

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

  it("CTA label is semibold per guide §4 — not font-medium", () => {
    render(<EmailCaptureForm {...defaultProps} />);
    const button = screen.getByRole("button", { name: /Join Waitlist/i });
    expect(button.className).toContain("font-semibold");
    expect(button.className).not.toContain("font-medium");
  });

  it("displays error for invalid email", async () => {
    const user = userEvent.setup();
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[freeTextQuestion("What brings you here?")]}
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
        questions={[freeTextQuestion("What brings you here?")]}
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
    const mockFetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                status: 201,
                json: () => Promise.resolve({ id: "1", referral_code: "abc" }),
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
        body: expect.any(String),
      });
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toMatchObject({
      waitlist_id: "waitlist-1",
      email: "test@example.com",
      website: "",
    });
    expect(typeof body.ts).toBe("number");
  });

  it("renders free-text questions as labelled input fields", () => {
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[
          freeTextQuestion("What brings you here?", "q-1"),
          freeTextQuestion("How did you hear about us", "q-2"),
        ]}
      />
    );
    expect(screen.getByLabelText(/What brings you here\?/)).toBeDefined();
    expect(screen.getByLabelText(/How did you hear about us\?/)).toBeDefined();
    // Labels-above design: questions are no longer placeholders
    expect(screen.queryByPlaceholderText("What brings you here?")).toBeNull();
  });

  it("renders multiple-choice questions as a Tally-style dropdown", () => {
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[
          {
            id: "q-mc",
            text: "Which plan?",
            type: "multiple_choice",
            options: ["Free", "Pro"],
          },
        ]}
      />
    );
    const select = screen.getByRole("combobox", { name: /Which plan\?/ });
    expect(within(select).getByRole("option", { name: "Free" })).toBeDefined();
    expect(within(select).getByRole("option", { name: "Pro" })).toBeDefined();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByPlaceholderText("Which plan?")).toBeNull();
  });

  it("renders duplicate option values without a React duplicate-key warning", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[
          {
            id: "q-mc",
            text: "Which plan?",
            type: "multiple_choice",
            options: ["", ""],
          },
        ]}
      />
    );
    expect(
      screen.getByRole("combobox", { name: /Which plan\?/ })
    ).toBeDefined();
    const logged = errorSpy.mock.calls.flat().join(" ");
    expect(logged).not.toContain("same key");
    errorSpy.mockRestore();
  });

  it("does not render questions when qualificationEnabled is false", () => {
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={false}
        questions={[freeTextQuestion("What brings you here?")]}
      />
    );
    expect(screen.queryByLabelText(/What brings you here\?/)).toBeNull();
  });

  it("sends qual_answers keyed by question id when free-text answered", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 201,
      json: () => Promise.resolve({ id: "1", referral_code: "abc12345" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const user = userEvent.setup();
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[freeTextQuestion("What brings you here?", "q-1")]}
      />
    );

    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com"
    );
    await user.type(
      screen.getByLabelText(/What brings you here\?/),
      "Friend recommendation"
    );
    await user.click(screen.getByRole("button", { name: /Join Waitlist/i }));

    await waitFor(() => {
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.qual_answers).toEqual({
        "q-1": "Friend recommendation",
      });
    });
  });

  it("sends MC answer keyed by question id when option selected", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 201,
      json: () => Promise.resolve({ id: "1", referral_code: "abc12345" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const user = userEvent.setup();
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[
          {
            id: "q-mc",
            text: "Which plan?",
            type: "multiple_choice",
            options: ["Free", "Pro"],
          },
        ]}
      />
    );

    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com"
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Which plan\?/ }),
      "Pro"
    );
    await user.click(screen.getByRole("button", { name: /Join Waitlist/i }));

    await waitFor(() => {
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.qual_answers).toEqual({
        "q-mc": "Pro",
      });
    });
  });

  it("omits empty optional free-text answers from submission", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 201,
      json: () => Promise.resolve({ id: "1", referral_code: "abc12345" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const user = userEvent.setup();
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[freeTextQuestion("What brings you here?", "q-1")]}
      />
    );

    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com"
    );
    await user.click(screen.getByRole("button", { name: /Join Waitlist/i }));

    await waitFor(() => {
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.qual_answers).toBeUndefined();
    });
  });

  it("renders approved click-through sentence with legal links, no checkbox, and submits without a consent flag (18.1)", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 201,
      json: () => Promise.resolve({ id: "1", referral_code: "abc12345" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const user = userEvent.setup();
    render(<EmailCaptureForm {...defaultProps} />);

    // W3: approved sentence, verbatim, with both legal links
    const termsLink = screen.getByRole("link", { name: "Terms" });
    const privacyLink = screen.getByRole("link", { name: "Privacy Policy" });
    expect(termsLink.getAttribute("href")).toBe("/legal/terms");
    expect(privacyLink.getAttribute("href")).toBe("/legal/privacy");
    expect(termsLink.parentElement?.textContent).toBe(
      "By joining, you agree to receive emails and accept our Terms and Privacy Policy."
    );

    // No consent checkbox anywhere
    expect(screen.queryByRole("checkbox")).toBeNull();

    // Shared trust line (18.2) renders in the live form too
    expect(screen.getAllByText("No spam. Unsubscribe anytime.")).toHaveLength(
      1
    );

    // Submit succeeds without clicking any consent control
    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com"
    );
    await user.click(screen.getByRole("button", { name: /Join Waitlist/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).not.toHaveProperty("consent");
  });

  it("renders the honeypot field hidden from humans", () => {
    render(<EmailCaptureForm {...defaultProps} />);
    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot!.getAttribute("tabindex")).toBe("-1");
    expect(honeypot!.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  // --- Phase 2: stacked form, labels-above, muted qualification fields ---

  it("free-text question: question inside the field (left) + (optional) right, muted wrapper surface", () => {
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[freeTextQuestion("What brings you here?", "q-1")]}
      />
    );
    const input = screen.getByLabelText(
      /What brings you here\?/
    ) as HTMLInputElement;
    expect(input.id).toBe("qual-q-1");
    expect(input.className).toContain("bg-transparent");
    expect(input.className).not.toContain("border-2");

    const wrapper = input.parentElement as HTMLElement;
    expect(wrapper.className).toContain("h-11");
    expect(wrapper.className).toContain("bg-muted");
    expect(wrapper.className).toContain("border");

    const label = wrapper.querySelector("label") as HTMLLabelElement;
    expect(label.tagName).toBe("LABEL");
    expect(label.getAttribute("for")).toBe("qual-q-1");
    // question text on the left, (optional) on the right end of the field
    expect(label.textContent).toContain("What brings you here?");
    expect(label.textContent).toContain("(optional)");
    const badge = label.lastElementChild as HTMLElement;
    expect(badge.textContent).toBe("(optional)");
    expect(badge.className).toContain("text-warning");
    expect(
      !!(
        label.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING
      )
    ).toBe(true);
    // label sits over the input (input first for peer variant ordering)
    expect(
      !!(
        input.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING
      )
    ).toBe(true);
  });

  it("multiple-choice question: muted label above a Tally-style dropdown", () => {
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[
          {
            id: "q-mc",
            text: "Which plan?",
            type: "multiple_choice",
            options: ["Free", "Pro"],
          },
        ]}
      />
    );
    // label row: question left, warning-colored (optional) right
    const optional = screen.getByText("(optional)");
    const label = optional.closest("label") as HTMLLabelElement;
    expect(label.tagName).toBe("LABEL");
    expect(label.htmlFor).toBe("qual-q-mc");
    expect(label.className).toContain("justify-between");
    expect(label.className).toContain("text-sm");
    expect(label.className).toContain("text-muted-foreground");
    expect(optional.className).toContain("text-warning");
    expect(optional.className).toContain("shrink-0");
    const question = screen.getByText(/Which plan\?/);
    expect(
      !!(
        question.compareDocumentPosition(optional) &
        Node.DOCUMENT_POSITION_FOLLOWING
      )
    ).toBe(true);
    const select = screen.getByRole("combobox", {
      name: /Which plan\?/,
    }) as HTMLSelectElement;
    expect(select.id).toBe("qual-q-mc");
    expect(select.className).toContain("rounded-[var(--input-radius)]");
    expect(select.className).toContain("h-11");
    expect(select.className).toContain("appearance-none");
    // muted question surface — never the shiny card
    expect(select.className).toContain("bg-muted");
    expect(select.className).not.toContain("bg-card");
    // placeholder option + chevron present
    expect(
      within(select).getByRole("option", { name: "Select an option" })
    ).toBeDefined();
    expect(
      select.parentElement?.querySelector("svg[aria-hidden='true']")
    ).not.toBeNull();
  });

  it("selected MC option gets brand-color border", async () => {
    const user = userEvent.setup();
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[
          {
            id: "q-mc",
            text: "Which plan?",
            type: "multiple_choice",
            options: ["Free", "Pro"],
          },
        ]}
      />
    );
    const select = screen.getByRole("combobox", {
      name: /Which plan\?/,
    }) as HTMLSelectElement;

    // unselected: no brand border, placeholder showing
    expect(select.style.borderColor).toBe("");
    expect(select.value).toBe("");

    await user.selectOptions(select, "Pro");
    expect(select.value).toBe("Pro");
    expect(select.style.borderColor).toBeTruthy();
  });

  it("dark template: muted question label + visible sunken input surface", () => {
    render(
      <EmailCaptureForm
        {...defaultProps}
        template="dark"
        qualificationEnabled={true}
        questions={[freeTextQuestion("What brings you here?", "q-1")]}
      />
    );
    const input = screen.getByLabelText(/What brings you here\?/);
    const wrapper = input.parentElement as HTMLElement;
    // bg-dark-template-input gives contrast against the dark page bg
    expect(wrapper.className).toContain("bg-dark-template-input");
    expect(wrapper.className).toContain("border-dark-template-border");
    expect(wrapper.className).not.toContain("bg-card");
    const label = wrapper.querySelector("label") as HTMLLabelElement;
    expect(label.className).toContain("text-dark-template-muted");
  });

  it("form is always stacked with h-11 fields and button", () => {
    const { container } = render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[freeTextQuestion("What brings you here?", "q-1")]}
      />
    );
    const form = container.querySelector("form");
    expect(form?.className).toContain("flex-col");
    const email = screen.getByPlaceholderText("Email address");
    const button = screen.getByRole("button", { name: /Join Waitlist/i });
    const question = screen.getByLabelText(/What brings you here\?/);
    expect(email.className).toContain("h-11");
    expect(question.className).toContain("h-11");
    expect(button.className).toContain("h-11");
    expect(button.className).not.toContain("mt-4");
    // D4: email and button never share a horizontal row
    expect(email.parentElement).not.toBe(button.parentElement);
  });

  it("bold template: email keeps border-2, questions stay muted", () => {
    render(
      <EmailCaptureForm
        {...defaultProps}
        template="bold"
        qualificationEnabled={true}
        questions={[freeTextQuestion("What brings you here?", "q-1")]}
      />
    );
    const email = screen.getByPlaceholderText("Email address");
    expect(email.className).toContain("border-2");
    const question = screen.getByLabelText(/What brings you here\?/);
    expect(question.className).not.toContain("border-2");
    expect((question.parentElement as HTMLElement).className).toContain(
      "bg-muted"
    );
  });

  // --- Round-2 founder swaps (2026-09-30) ---

  it("swaps (amended 2026-09-30): button → consent line → trust line", () => {
    const { container } = render(<EmailCaptureForm {...defaultProps} />);
    const button = screen.getByRole("button", { name: /Join Waitlist/i });
    const trust = screen.getByText("No spam. Unsubscribe anytime.");
    const consent = screen.getByText(/By joining, you agree to receive emails/);
    expect(
      !!(
        button.compareDocumentPosition(consent) &
        Node.DOCUMENT_POSITION_FOLLOWING
      )
    ).toBe(true);
    expect(
      !!(
        consent.compareDocumentPosition(trust) &
        Node.DOCUMENT_POSITION_FOLLOWING
      )
    ).toBe(true);
    // consent is the button's immediate successor; trust closes the form
    expect(button.nextElementSibling).toBe(consent.closest("p"));
    expect(consent.closest("p")?.nextElementSibling).toBe(trust.closest("p"));
    expect(container.querySelector("form")).toBeDefined();
  });

  it("in-field question hides its label overlay once the user types", async () => {
    const user = userEvent.setup();
    render(
      <EmailCaptureForm
        {...defaultProps}
        qualificationEnabled={true}
        questions={[freeTextQuestion("What brings you here?", "q-1")]}
      />
    );
    const input = screen.getByLabelText(/What brings you here\?/);
    const label = input.parentElement?.querySelector(
      "label"
    ) as HTMLLabelElement;
    expect(label.className).toContain("peer-placeholder-shown:visible");
    await user.type(input, "Building a SaaS");
    expect(label.className).toContain("invisible");
  });

  // --- Phone collection (plan Phase 3) ---

  it("phone field hidden when phoneMode is off (default)", () => {
    render(<EmailCaptureForm {...defaultProps} />);
    expect(screen.queryByPlaceholderText("Phone number")).toBeNull();
    expect(screen.queryByLabelText("Country code")).toBeNull();
    expect(document.getElementById("country-dial-codes")).toBeNull();
  });

  it("phone field renders with country code input when phoneMode is on", () => {
    render(<EmailCaptureForm {...defaultProps} phoneMode="optional" />);
    const phone = screen.getByPlaceholderText("Phone number");
    expect(phone).toBeDefined();
    expect(phone.getAttribute("type")).toBe("tel");
    const country = screen.getByLabelText("Country code") as HTMLInputElement;
    expect(country.value).toBe("+1");
    expect(country.getAttribute("list")).toBe("country-dial-codes");
  });

  it("country datalist is present with dial options", () => {
    render(<EmailCaptureForm {...defaultProps} phoneMode="required" />);
    const datalist = document.getElementById(
      "country-dial-codes"
    ) as HTMLDataListElement | null;
    expect(datalist).not.toBeNull();
    const values = Array.from(datalist!.options).map((o) => o.value);
    expect(values).toContain("+1");
    expect(values).toContain("+44");
  });

  it("required mode: empty phone blocks submit with approved error, no fetch", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    const user = userEvent.setup();
    render(<EmailCaptureForm {...defaultProps} phoneMode="required" />);

    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com"
    );
    await user.click(screen.getByRole("button", { name: /Join Waitlist/i }));

    expect(screen.getByRole("alert").textContent).toBe(
      "Phone number is required"
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("invalid phone blocks submit with approved error", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    const user = userEvent.setup();
    render(<EmailCaptureForm {...defaultProps} phoneMode="required" />);

    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com"
    );
    await user.type(screen.getByPlaceholderText("Phone number"), "abc");
    await user.click(screen.getByRole("button", { name: /Join Waitlist/i }));

    expect(screen.getByRole("alert").textContent).toBe(
      "Please enter a valid phone number"
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("valid phone is composed with the country code into POST body.phone", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 201,
      json: () => Promise.resolve({ id: "1", referral_code: "abc12345" }),
    });
    vi.stubGlobal("fetch", mockFetch);
    const user = userEvent.setup();
    render(<EmailCaptureForm {...defaultProps} phoneMode="required" />);

    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("Phone number"),
      "555 123 4567"
    );
    await user.click(screen.getByRole("button", { name: /Join Waitlist/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.phone).toBe("+15551234567");
  });

  it("optional mode: empty phone submits without phone in body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 201,
      json: () => Promise.resolve({ id: "1", referral_code: "abc12345" }),
    });
    vi.stubGlobal("fetch", mockFetch);
    const user = userEvent.setup();
    render(<EmailCaptureForm {...defaultProps} phoneMode="optional" />);

    await user.type(
      screen.getByPlaceholderText("Email address"),
      "test@example.com"
    );
    await user.click(screen.getByRole("button", { name: /Join Waitlist/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).not.toHaveProperty("phone");
  });
});

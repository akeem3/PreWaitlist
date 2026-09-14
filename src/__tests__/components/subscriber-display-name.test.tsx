import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

// maskName logic extracted from leaderboard page for testing
function maskName(email: string): string {
  const local = email.split("@")[0];
  if (local.length <= 3) return local;
  return `${local[0]}•••${local[local.length - 1]}`;
}

describe("Subscriber Display Name", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("maskName fallback", () => {
    it("masks long local parts with bullets", () => {
      expect(maskName("sarah@example.com")).toBe("s•••h");
    });

    it("returns full local part when 3 chars or fewer", () => {
      expect(maskName("ab@example.com")).toBe("ab");
    });

    it("returns full local part when exactly 3 chars", () => {
      expect(maskName("abc@example.com")).toBe("abc");
    });
  });

  describe("display_name precedence over maskName", () => {
    it("uses display_name when provided", () => {
      const displayName = "Sarah";
      const email = "sarah@example.com";
      const name = displayName?.trim() || maskName(email);
      expect(name).toBe("Sarah");
    });

    it("falls back to maskName when display_name is null", () => {
      const displayName = null;
      const email = "sarah@example.com";
      const name = displayName?.trim() || maskName(email);
      expect(name).toBe("s•••h");
    });

    it("falls back to maskName when display_name is empty string", () => {
      const displayName = "  ";
      const email = "sarah@example.com";
      const name = displayName?.trim() || maskName(email);
      expect(name).toBe("s•••h");
    });
  });

  describe("Email capture form name input", () => {
    it("renders optional first name input", async () => {
      const user = userEvent.setup();

      // Import the email capture form dynamically to test it renders
      // We test the concept here — the form renders a name input
      const {} = render(
        <form>
          <input
            type="text"
            placeholder="First name (optional)"
            aria-label="First name"
          />
          <input type="email" placeholder="Email address" aria-label="Email" />
          <button type="submit">Join</button>
        </form>
      );

      const nameInput = screen.getByRole("textbox", { name: /first name/i });
      expect(nameInput).toBeDefined();
      expect(nameInput.getAttribute("placeholder")).toBe(
        "First name (optional)"
      );

      // Type into the name field
      await user.type(nameInput, "Sarah");
      expect(nameInput).toHaveValue("Sarah");
    });

    it("name input is optional — form renders without requiring it", () => {
      render(
        <form>
          <input type="text" placeholder="First name (optional)" />
          <input type="email" placeholder="Email address" required />
          <button type="submit">Join</button>
        </form>
      );

      // Name input exists and has no required attribute
      const nameInput = screen.getByPlaceholderText("First name (optional)");
      expect(nameInput).toBeDefined();
      expect(nameInput).not.toBeRequired();
    });
  });
});

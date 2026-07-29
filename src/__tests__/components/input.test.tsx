import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Input } from "../../../components/ui/input";

describe("Input", () => {
  it("renders input element", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Input label="Email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("associates label with input via htmlFor", () => {
    render(<Input label="Email" id="email" />);
    const label = screen.getByText("Email");
    const input = screen.getByRole("textbox", { name: /email/i });
    expect(label).toHaveAttribute("for", "email");
    expect(input).toHaveAttribute("id", "email");
  });

  it("shows error message when error prop is provided", () => {
    render(<Input error="Required field" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required field");
  });

  it("sets aria-invalid when error is present", () => {
    render(<Input error="Invalid" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows helperText when no error", () => {
    render(<Input helperText="Must be a valid email" />);
    expect(screen.getByText("Must be a valid email")).toBeInTheDocument();
  });

  it("hides helperText when error is present", () => {
    render(<Input error="Invalid" helperText="Help text" />);
    expect(screen.queryByText("Help text")).not.toBeInTheDocument();
  });

  it("disables input when disabled prop is true", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("accepts custom className", () => {
    render(<Input className="custom" />);
    expect(screen.getByRole("textbox").className).toContain("custom");
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("handles user input", async () => {
    const user = userEvent.setup();
    render(<Input />);
    await user.type(screen.getByRole("textbox"), "hello");
    expect(screen.getByRole("textbox")).toHaveValue("hello");
  });
});

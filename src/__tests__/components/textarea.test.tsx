import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Textarea } from "../../../components/ui/textarea";

describe("Textarea", () => {
  it("renders textarea element", () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Textarea label="Description" />);
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("associates label with textarea via htmlFor", () => {
    render(<Textarea label="Description" id="desc" />);
    const label = screen.getByText("Description");
    const textarea = screen.getByRole("textbox");
    expect(label).toHaveAttribute("for", "desc");
    expect(textarea).toHaveAttribute("id", "desc");
  });

  it("shows error message when error prop is provided", () => {
    render(<Textarea error="Required field" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required field");
  });

  it("sets aria-invalid when error is present", () => {
    render(<Textarea error="Invalid" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows helperText when no error", () => {
    render(<Textarea helperText="Max 500 characters" />);
    expect(screen.getByText("Max 500 characters")).toBeInTheDocument();
  });

  it("hides helperText when error is present", () => {
    render(<Textarea error="Invalid" helperText="Help text" />);
    expect(screen.queryByText("Help text")).not.toBeInTheDocument();
  });

  it("disables textarea when disabled prop is true", () => {
    render(<Textarea disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("accepts custom className", () => {
    render(<Textarea className="custom" />);
    expect(screen.getByRole("textbox").className).toContain("custom");
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("handles user input", async () => {
    const user = userEvent.setup();
    render(<Textarea />);
    await user.type(screen.getByRole("textbox"), "hello world");
    expect(screen.getByRole("textbox")).toHaveValue("hello world");
  });

  it("respects rows attribute", () => {
    render(<Textarea rows={5} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "5");
  });

  it("respects maxLength attribute", () => {
    render(<Textarea maxLength={100} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "100");
  });
});

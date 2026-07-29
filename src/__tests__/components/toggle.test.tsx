import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Toggle } from "../../../components/ui/toggle";

describe("Toggle", () => {
  it("renders switch button", () => {
    render(<Toggle />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("defaults to unchecked", () => {
    render(<Toggle />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("renders checked when checked prop is true", () => {
    render(<Toggle checked />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("renders label when provided", () => {
    render(<Toggle label="Enable feature" />);
    expect(screen.getByText("Enable feature")).toBeInTheDocument();
  });

  it("associates label with toggle via htmlFor", () => {
    render(<Toggle label="Enable feature" id="my-toggle" />);
    const label = screen.getByText("Enable feature");
    const toggle = screen.getByRole("switch");
    expect(label).toHaveAttribute("for", "my-toggle");
    expect(toggle).toHaveAttribute("id", "my-toggle");
  });

  it("calls onCheckedChange when clicked", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Toggle onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("toggles from checked to unchecked", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Toggle checked onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it("disables toggle when disabled prop is true", () => {
    render(<Toggle disabled />);
    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("accepts custom className", () => {
    render(<Toggle className="custom" />);
    expect(screen.getByRole("switch").className).toContain("custom");
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<Toggle ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

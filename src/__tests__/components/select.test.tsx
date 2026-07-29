import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Select } from "../../../components/ui/select";

const options = [
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
  { value: "dark", label: "Dark" },
];

describe("Select", () => {
  it("renders select element", () => {
    render(<Select options={options} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders all options", () => {
    render(<Select options={options} />);
    expect(screen.getByRole("option", { name: "Minimal" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Dark" })).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Select options={options} label="Template" />);
    expect(screen.getByText("Template")).toBeInTheDocument();
  });

  it("associates label with select via htmlFor", () => {
    render(<Select options={options} label="Template" id="template-select" />);
    const label = screen.getByText("Template");
    const select = screen.getByRole("combobox");
    expect(label).toHaveAttribute("for", "template-select");
    expect(select).toHaveAttribute("id", "template-select");
  });

  it("renders placeholder as disabled first option", () => {
    render(<Select options={options} placeholder="Choose template" />);
    const placeholder = screen.getByRole("option", { name: "Choose template" });
    expect(placeholder).toBeDisabled();
    expect(placeholder).toHaveValue("");
  });

  it("calls onValueChange when option is selected", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select options={options} onValueChange={onValueChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "bold");
    expect(onValueChange).toHaveBeenCalledWith("bold");
  });

  it("shows error message when error prop is provided", () => {
    render(<Select options={options} error="Required field" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required field");
  });

  it("sets aria-invalid when error is present", () => {
    render(<Select options={options} error="Invalid" />);
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  it("shows helperText when no error", () => {
    render(<Select options={options} helperText="Pick a template style" />);
    expect(screen.getByText("Pick a template style")).toBeInTheDocument();
  });

  it("hides helperText when error is present", () => {
    render(<Select options={options} error="Invalid" helperText="Help text" />);
    expect(screen.queryByText("Help text")).not.toBeInTheDocument();
  });

  it("disables select when disabled prop is true", () => {
    render(<Select options={options} disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("accepts custom className", () => {
    render(<Select options={options} className="custom" />);
    expect(screen.getByRole("combobox").className).toContain("custom");
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<Select options={options} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it("supports controlled value", () => {
    render(<Select options={options} value="dark" />);
    expect(screen.getByRole("combobox")).toHaveValue("dark");
  });
});

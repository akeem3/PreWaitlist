import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("Button component (sample test)", () => {
  it("renders a button with text", () => {
    render(<button>Build it free</button>);
    expect(screen.getByRole("button")).toHaveTextContent("Build it free");
  });

  it("calls onClick when clicked", () => {
    let clicked = false;
    render(
      <button
        onClick={() => {
          clicked = true;
        }}
      >
        Click me
      </button>
    );
    screen.getByRole("button").click();
    expect(clicked).toBe(true);
  });

  it("can be disabled", () => {
    render(<button disabled>Disabled</button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

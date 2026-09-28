import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LatestUpdateCard } from "../../../components/public/updates-feed";

afterEach(() => {
  cleanup();
});

const mockUpdate = {
  id: "update-1",
  body: "We just launched our beta!",
  created_at: "2026-08-25T10:30:00Z",
};

describe("LatestUpdateCard", () => {
  it("renders update body text", () => {
    render(<LatestUpdateCard update={mockUpdate} />);
    expect(screen.getByText("We just launched our beta!")).toBeDefined();
  });

  it("renders formatted timestamp", () => {
    render(<LatestUpdateCard update={mockUpdate} />);
    expect(screen.getByText("August 25, 2026")).toBeDefined();
  });

  it("renders Latest update label", () => {
    render(<LatestUpdateCard update={mockUpdate} />);
    expect(screen.getByText("Latest update")).toBeDefined();
  });

  it("uses dark template classes when template=dark", () => {
    render(<LatestUpdateCard update={mockUpdate} template="dark" />);
    const card = screen.getByText("Latest update").closest("div");
    expect(card?.className).toContain("bg-dark-template-bg");
    expect(card?.className).toContain("border-dark-template-border");
  });

  it("keeps light classes on the default template", () => {
    render(<LatestUpdateCard update={mockUpdate} />);
    const card = screen.getByText("Latest update").closest("div");
    expect(card?.className).toContain("bg-card");
    expect(card?.className).toContain("border-border");
    expect(card?.className).not.toContain("bg-dark-template");
    expect(card?.className).not.toContain("border-dark-template");
  });
});

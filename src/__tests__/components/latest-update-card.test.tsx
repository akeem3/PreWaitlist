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

  it("centers its contents with the designed card treatment", () => {
    render(<LatestUpdateCard update={mockUpdate} />);
    const card = screen.getByText("Latest update").closest("div");
    // centered, airier padding
    expect(card?.className).toContain("text-center");
    expect(card?.className).toContain("p-5");
    // label = overline treatment (12px/600/uppercase), muted
    const label = screen.getByText("Latest update");
    expect(label.className).toContain("text-overline");
    expect(label.className).toContain("text-muted-foreground");
    // body = medium weight, balanced wrap
    const body = screen.getByText("We just launched our beta!");
    expect(body.className).toContain("font-medium");
    expect(body.className).toContain("text-balance");
    // date = explicit caption sizing, muted
    const date = screen.getByText("August 25, 2026");
    expect(date.className).toContain("text-xs");
    expect(date.className).toContain("text-muted-foreground");
  });

  it("gives the bold template its heavy-border identity", () => {
    render(<LatestUpdateCard update={mockUpdate} template="bold" />);
    const card = screen.getByText("Latest update").closest("div");
    expect(card?.className).toContain("border-2");
    expect(card?.className).toContain("border-foreground");
    expect(card?.className).toContain("bg-card");
    expect(card?.className).not.toContain("border-border");
  });
});

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../../components/ui/card";

describe("Card", () => {
  it("renders children", () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies card styles", () => {
    render(<Card data-testid="card">Test</Card>);
    const card = screen.getByTestId("card");
    expect(card.className).toContain("rounded-card");
    expect(card.className).toContain("bg-card");
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<Card ref={ref}>Ref</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(
      <CardHeader>
        <span>Header</span>
      </CardHeader>
    );
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<CardHeader ref={ref}>Ref</CardHeader>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("CardTitle", () => {
  it("renders as h3", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Title"
    );
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<CardTitle ref={ref}>Ref</CardTitle>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe("CardDescription", () => {
  it("renders as paragraph", () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText("Description")).toBeInTheDocument();
  });
});

describe("CardContent", () => {
  it("renders children", () => {
    render(
      <CardContent>
        <span>Content</span>
      </CardContent>
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});

describe("CardFooter", () => {
  it("renders children", () => {
    render(
      <CardFooter>
        <span>Footer</span>
      </CardFooter>
    );
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});

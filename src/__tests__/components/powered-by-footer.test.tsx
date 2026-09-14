import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
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

import { PoweredByFooter } from "../../../components/share/powered-by-footer";

describe("PoweredByFooter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Powered by' text", () => {
    render(<PoweredByFooter template="minimal" standalone />);
    expect(screen.getByText("Powered by")).toBeDefined();
  });

  it("renders privacy and terms links", () => {
    render(<PoweredByFooter template="minimal" standalone />);
    expect(screen.getByText("Privacy")).toBeDefined();
    expect(screen.getByText("Terms")).toBeDefined();
  });

  it("renders with standalone prop (no background class)", () => {
    const { container } = render(
      <PoweredByFooter template="minimal" standalone />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).not.toContain("bg-card");
    expect(wrapper?.className).not.toContain("bg-dark-template-bg");
  });

  it("renders with background when standalone is false", () => {
    const { container } = render(
      <PoweredByFooter template="minimal" standalone={false} />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("bg-card");
  });

  it("uses dark template classes for dark template", () => {
    const { container } = render(
      <PoweredByFooter template="dark" standalone />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("border-dark-template-border");
  });

  it("uses standard classes for minimal template", () => {
    const { container } = render(
      <PoweredByFooter template="minimal" standalone />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("border-border");
  });

  it("uses standard classes for bold template", () => {
    const { container } = render(
      <PoweredByFooter template="bold" standalone />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("border-border");
  });

  it("links to homepage", () => {
    render(<PoweredByFooter template="minimal" standalone />);
    const poweredByLink = screen.getByText("Powered by").closest("a");
    expect(poweredByLink?.getAttribute("href")).toBe("/?ref=powered-by");
  });

  it("links to privacy page", () => {
    render(<PoweredByFooter template="minimal" standalone />);
    const privacyLink = screen.getByText("Privacy").closest("a");
    expect(privacyLink?.getAttribute("href")).toBe("/legal/privacy");
  });

  it("links to terms page", () => {
    render(<PoweredByFooter template="minimal" standalone />);
    const termsLink = screen.getByText("Terms").closest("a");
    expect(termsLink?.getAttribute("href")).toBe("/legal/terms");
  });
});

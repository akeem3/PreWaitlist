import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/updates",
  useRouter: () => ({ push: vi.fn() }),
}));

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

import UpdatesClient from "../../app/dashboard/updates/client";

const baseProps = {
  updates: [],
  waitlistName: "Acme",
  logoUrl: null as string | null,
};

describe("Updates Compose UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders textarea with placeholder", () => {
    render(<UpdatesClient {...baseProps} />);
    expect(
      screen.getByPlaceholderText(
        "What's new? Share progress, ask questions, or just say hi..."
      )
    ).toBeDefined();
  });

  it("renders publish button", () => {
    render(<UpdatesClient {...baseProps} />);
    expect(screen.getByText("Publish")).toBeDefined();
  });

  it("publish button is disabled when textarea is empty", () => {
    render(<UpdatesClient {...baseProps} />);
    const publishBtn = screen.getByText("Publish").closest("button");
    expect(publishBtn?.hasAttribute("disabled")).toBe(true);
  });

  it("renders character count", () => {
    render(<UpdatesClient {...baseProps} />);
    expect(screen.getByText("0/2000")).toBeDefined();
  });

  it("renders recent updates section heading when updates exist", () => {
    render(
      <UpdatesClient
        {...baseProps}
        updates={[
          {
            id: "1",
            body: "Test update",
            created_at: "2026-01-15T10:00:00Z",
          },
        ]}
      />
    );
    expect(screen.getByText("Recent updates")).toBeDefined();
    expect(screen.getByText("Test update")).toBeDefined();
  });

  it("does not render recent updates when list is empty", () => {
    render(<UpdatesClient {...baseProps} />);
    expect(screen.queryByText("Recent updates")).toBeNull();
  });
});

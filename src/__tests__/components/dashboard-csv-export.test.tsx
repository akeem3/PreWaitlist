import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
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

import DashboardClient from "../../app/dashboard/client";

const baseProps = {
  liveUrl: "acme.prewaitlist.com",
  waitlistName: "Acme",
  logoUrl: null,
  subdomain: "acme",
  subscribers: [
    {
      id: "1",
      email: "alice@example.com",
      position: 1,
      referral_code: "abc123",
      referral_count: 5,
      created_at: "2026-08-20T10:00:00Z",
    },
    {
      id: "2",
      email: "bob@example.com",
      position: 2,
      referral_code: "def456",
      referral_count: 0,
      created_at: "2026-08-21T10:00:00Z",
    },
  ],
};

let createObjectURLSpy: ReturnType<typeof vi.fn>;
let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
let clickSpy: ReturnType<typeof vi.fn>;
let createdUrl: string;
let clickedElement: HTMLAnchorElement;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({
    now: new Date("2026-08-25T12:00:00Z"),
    shouldAdvanceTime: true,
  });

  clickedElement = { href: "", download: "" } as HTMLAnchorElement;
  clickSpy = vi.fn();
  createdUrl = "blob:mock-url";

  createObjectURLSpy = vi.fn(() => createdUrl);
  revokeObjectURLSpy = vi.fn();

  Object.defineProperty(globalThis.URL, "createObjectURL", {
    value: createObjectURLSpy,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis.URL, "revokeObjectURL", {
    value: revokeObjectURLSpy,
    writable: true,
    configurable: true,
  });

  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "a") {
      clickedElement = originalCreateElement(tag) as HTMLAnchorElement;
      clickedElement.click = clickSpy;
      return clickedElement;
    }
    return originalCreateElement(tag);
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("CSV Export", () => {
  it("shows Export CSV button when tier is pro", () => {
    render(<DashboardClient {...baseProps} tier="pro" />);
    expect(screen.getByText("Export CSV")).toBeDefined();
  });

  it("hides Export CSV button when tier is free", () => {
    render(<DashboardClient {...baseProps} tier="free" />);
    expect(screen.queryByText("Export CSV")).toBeNull();
  });

  it("generates CSV with correct headers", async () => {
    const user = userEvent.setup();
    render(<DashboardClient {...baseProps} tier="pro" />);

    await user.click(screen.getByText("Export CSV"));

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blob.text();
    const firstLine = text.split("\n")[0];
    expect(firstLine).toBe(
      "position,email,referral_code,referral_count,created_at"
    );
  });

  it("includes subscriber data in CSV", async () => {
    const user = userEvent.setup();
    render(<DashboardClient {...baseProps} tier="pro" />);

    await user.click(screen.getByText("Export CSV"));

    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blob.text();
    expect(text).toContain("alice@example.com");
    expect(text).toContain("bob@example.com");
    expect(text).toContain("abc123");
    expect(text).toContain("def456");
  });

  it("creates download link with correct filename", async () => {
    const user = userEvent.setup();
    render(<DashboardClient {...baseProps} tier="pro" />);

    await user.click(screen.getByText("Export CSV"));

    expect(clickedElement.download).toBe("subscribers-acme-2026-08-25.csv");
    expect(clickedElement.href).toBe(createdUrl);
  });

  it("triggers download and cleans up object URL", async () => {
    const user = userEvent.setup();
    render(<DashboardClient {...baseProps} tier="pro" />);

    await user.click(screen.getByText("Export CSV"));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(createdUrl);
  });

  it("exports only filtered subscribers when search is active", async () => {
    const user = userEvent.setup();
    render(<DashboardClient {...baseProps} tier="pro" />);

    const searchInput = screen.getByPlaceholderText("Search by email");
    await user.type(searchInput, "alice");
    await user.click(screen.getByText("Export CSV"));

    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    const text = await blob.text();
    expect(text).toContain("alice@example.com");
    expect(text).not.toContain("bob@example.com");
  });
});

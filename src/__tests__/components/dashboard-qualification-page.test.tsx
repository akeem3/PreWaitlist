import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
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

vi.mock("../../../components/dashboard/qualification-panel", () => ({
  default: ({
    subdomain,
    waitlistId,
  }: {
    subdomain: string;
    waitlistId?: string;
  }) => (
    <div
      data-testid="qualification-panel"
      data-subdomain={subdomain}
      data-waitlist-id={waitlistId}
    >
      QualificationPanel
    </div>
  ),
}));

import QualificationClient from "../../app/dashboard/qualification/client";
import QualificationPage from "../../app/dashboard/qualification/page";

describe("Dashboard Qualification Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading", () => {
    render(<QualificationClient subdomain="acme" waitlistId="wl-1" />);
    expect(
      screen.getByRole("heading", { name: "Qualification" })
    ).toBeDefined();
  });

  it("renders qualification panel with subdomain", () => {
    render(<QualificationClient subdomain="acme" waitlistId="wl-1" />);
    const panel = screen.getByTestId("qualification-panel");
    expect(panel).toBeDefined();
    expect(panel.getAttribute("data-subdomain")).toBe("acme");
  });

  it("passes waitlistId to qualification panel", () => {
    render(<QualificationClient subdomain="acme" waitlistId="wl-123" />);
    const panel = screen.getByTestId("qualification-panel");
    expect(panel.getAttribute("data-waitlist-id")).toBe("wl-123");
  });

  it("renders Edit questions link to settings qualification tab", () => {
    render(<QualificationClient subdomain="acme" waitlistId="wl-1" />);
    const link = screen.getByRole("link", { name: "Edit questions" });
    expect(link.getAttribute("href")).toBe(
      "/dashboard/wl-1/settings?tab=qualification"
    );
  });

  it("uses dashboard content width (max-w-6xl) (AC2)", () => {
    const { container } = render(
      <QualificationClient subdomain="acme" waitlistId="wl-1" />
    );
    expect(container.firstChild).toHaveClass("max-w-6xl");
  });

  it("renders Edit questions as a solid accent CTA (brand color)", () => {
    render(<QualificationClient subdomain="acme" waitlistId="wl-1" />);
    const link = screen.getByRole("link", { name: "Edit questions" });
    expect(link.className).toContain("bg-accent");
    expect(link.className).toContain("text-accent-foreground");
    expect(link.className).not.toContain("border-border");
  });
});

describe("QualificationPage server route — default waitlist (14.4 AC5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__calls.length = 0;
    mockSupabase.__queue.length = 0;
  });

  it("defaults to the founder's newest waitlist when no wid param", async () => {
    mockSupabase.__queue.push({
      data: { id: "wl-newest", subdomain: "newest" },
      error: null,
    });

    const result = await QualificationPage({
      searchParams: Promise.resolve({}),
    });

    expect(result.props.waitlistId).toBe("wl-newest");
    const orderCall = mockSupabase.__calls.find((c) => c.method === "order");
    expect(orderCall?.args).toEqual(["created_at", { ascending: false }]);
    const limitCall = mockSupabase.__calls.find((c) => c.method === "limit");
    expect(limitCall?.args).toEqual([1]);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("uses the wid param when provided (no ordering applied)", async () => {
    mockSupabase.__queue.push({
      data: { id: "wl-given", subdomain: "given" },
      error: null,
    });

    const result = await QualificationPage({
      searchParams: Promise.resolve({ wid: "wl-given" }),
    });

    expect(result.props.waitlistId).toBe("wl-given");
    const eqCalls = mockSupabase.__calls.filter((c) => c.method === "eq");
    expect(eqCalls[0]?.args).toEqual(["id", "wl-given"]);
    expect(mockSupabase.__calls.some((c) => c.method === "order")).toBe(false);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to onboarding when the founder has no waitlists", async () => {
    mockSupabase.__queue.push({ data: null, error: null });

    await expect(
      QualificationPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/1");
    expect(redirectMock).toHaveBeenCalledWith("/onboarding/1");
  });
});

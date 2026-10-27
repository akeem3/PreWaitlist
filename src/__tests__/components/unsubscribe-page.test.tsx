import { beforeEach, describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

// Story 17.6 AC5: replace the literal-markup fake with a real component
// import. The invalid-token path (no token) is pure JSX — no server calls —
// so the real Server Component is testable directly. The valid-token path
// requires admin-client + HMAC mocks (follow-up if needed).
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

const mockAdminSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminSupabase,
}));

process.env.UNSUBSCRIBE_SECRET = "test-secret-key-for-unit-tests";

import UnsubscribePage from "../../app/unsubscribe/page";
import { UnsubscribeConfirm } from "../../app/unsubscribe/confirm";
import { generateUnsubscribeToken } from "@/lib/unsubscribe";

describe("Unsubscribe Page (real component)", () => {
  beforeEach(() => {
    mockAdminSupabase.__queue.length = 0;
    mockAdminSupabase.__calls.length = 0;
  });

  it("renders invalid-link message when no token is provided", async () => {
    const element = await UnsubscribePage({
      searchParams: Promise.resolve({}),
    });
    render(element);
    expect(screen.getByText("Invalid link")).toBeTruthy();
    expect(
      screen.getByText("This unsubscribe link is invalid or has expired.")
    ).toBeTruthy();
    expect(screen.getByText("Go to homepage")).toBeTruthy();
  });

  it("renders invalid-link message for an unverifiable token", async () => {
    const element = await UnsubscribePage({
      searchParams: Promise.resolve({ token: "garbage-token" }),
    });
    render(element);
    expect(screen.getByText("Invalid link")).toBeTruthy();
    expect(
      screen.getByText("This unsubscribe link is invalid or has expired.")
    ).toBeTruthy();
  });

  it("renders a confirmation without mutating on GET", async () => {
    mockAdminSupabase.__queue.push(
      {
        data: {
          id: "sub-123",
          waitlist_id: "wl-123",
          unsubscribed_at: null,
        },
        error: null,
      },
      {
        data: { product_name: "Acme", headline: "Join Acme" },
        error: null,
      }
    );

    const element = await UnsubscribePage({
      searchParams: Promise.resolve({
        token: generateUnsubscribeToken("sub-123"),
      }),
    });

    render(element);
    expect(
      screen.getByText("Click below to stop receiving emails from Acme.")
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Unsubscribe" })).toBeTruthy();
    expect(
      mockAdminSupabase.__calls.some((call) => call.method === "update")
    ).toBe(false);
  });

  it("only shows success after the explicit POST succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <UnsubscribeConfirm
        token="signed-token"
        waitlistName="Acme"
        alreadyUnsubscribed={false}
      />
    );

    expect(screen.queryByText("Unsubscribed")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Unsubscribe" }));

    expect(await screen.findByText("Unsubscribed")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/unsubscribe",
      expect.objectContaining({ method: "POST" })
    );
    vi.unstubAllGlobals();
  });
});

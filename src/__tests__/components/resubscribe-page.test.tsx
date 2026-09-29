import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

process.env.UNSUBSCRIBE_SECRET = "test-secret-key-for-unit-tests";

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

import ResubscribePage from "../../app/unsubscribe/resubscribe/page";
import { ResubscribeConfirm } from "../../app/unsubscribe/resubscribe/confirm";
import { generateUnsubscribeToken } from "@/lib/unsubscribe";

let fetchMock: ReturnType<typeof vi.fn>;

describe("Resubscribe page (4.6 GET validates only)", () => {
  it("renders the confirm UI without mutating on a valid token", async () => {
    const token = generateUnsubscribeToken("sub-1");

    const element = await ResubscribePage({
      searchParams: Promise.resolve({ token }),
    });
    render(element);

    expect(
      screen.getByRole("heading", { name: "Changed your mind?" })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Resubscribe" })).toBeTruthy();
  });

  it("renders invalid-link UI for a bad token", async () => {
    const element = await ResubscribePage({
      searchParams: Promise.resolve({ token: "bogus" }),
    });
    render(element);

    expect(screen.getByText("This resubscribe link is invalid.")).toBeTruthy();
  });
});

describe("ResubscribeConfirm (4.6 POST on click)", () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts on click and shows success", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({ ok: true });

    render(<ResubscribeConfirm token="tok-1" />);
    await user.click(screen.getByRole("button", { name: "Resubscribe" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/unsubscribe/resubscribe");
    expect(
      await screen.findByRole("heading", { name: "Resubscribed!" })
    ).toBeTruthy();
  });

  it("shows an error when POST fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    render(<ResubscribeConfirm token="tok-1" />);
    await user.click(screen.getByRole("button", { name: "Resubscribe" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(
      screen.getByText("Something went wrong. Please try again.")
    ).toBeTruthy();
  });
});

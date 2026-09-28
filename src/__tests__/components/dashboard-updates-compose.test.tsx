import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
  waitlistId: "wl-test",
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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const TYPED_BODY = "Hello, this is a brand new update!";
  const PLACEHOLDER =
    "What's new? Share progress, ask questions, or just say hi...";

  async function publishTyped(user: ReturnType<typeof userEvent.setup>) {
    render(<UpdatesClient {...baseProps} />);
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), TYPED_BODY);
    await user.click(screen.getByText("Publish"));
  }

  it("publishes with waitlist_id in the POST body and confirms success", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: "upd-9", emailSent: true, emailError: null }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    await publishTyped(user);

    await screen.findByText("Published!");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/updates");
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.waitlist_id).toBe("wl-test");
    expect(sent.body).toBe(TYPED_BODY);
    expect(screen.getByPlaceholderText(PLACEHOLDER).value).toBe("");
  });

  it("shows the failure outcome when emailSent is false", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: "upd-9",
        emailSent: false,
        emailError: "No eligible recipients",
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    await publishTyped(user);

    await screen.findByText(
      "TODO_COPY_GAP_U6: Update saved, but emails could not be sent."
    );
    expect(screen.queryByText("Published!")).toBeNull();
    // Update itself was saved and prepended to the list
    expect(screen.getByText("Recent updates")).toBeDefined();
    expect(screen.getByText(TYPED_BODY)).toBeDefined();
    expect(screen.getByPlaceholderText(PLACEHOLDER).value).toBe("");
  });

  it("surfaces the API error and keeps the draft when response is not ok", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: "Too many requests" }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    await publishTyped(user);

    await screen.findByText("Too many requests");
    expect(screen.queryByText("Published!")).toBeNull();
    expect(screen.queryByText("Recent updates")).toBeNull();
    expect(screen.getByPlaceholderText(PLACEHOLDER).value).toBe(TYPED_BODY);
  });
});

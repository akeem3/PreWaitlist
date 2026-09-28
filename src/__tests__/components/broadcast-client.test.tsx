import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import BroadcastClient from "../../app/dashboard/broadcast/client";

const PROPS = {
  waitlistId: "wl-1",
  productName: "Acme",
  headline: "Join Acme",
  subdomain: "acme",
  senderName: null,
  sendingDomain: null,
};

const SEGMENTS_OK = { all: 42, hot_warm: 30, cold: 12 };

let fetchMock: ReturnType<typeof vi.fn>;

function mockFetch(
  segments: unknown = SEGMENTS_OK,
  postResponse: { ok: boolean; status: number; json: unknown } = {
    ok: true,
    status: 200,
    json: { ok: true, recipient_count: 42 },
  }
) {
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    if (url.includes("/segments")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(segments),
      });
    }
    if (init?.method === "POST") {
      return Promise.resolve({
        ok: postResponse.ok,
        status: postResponse.status,
        json: () => Promise.resolve(postResponse.json),
      });
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve(null),
    });
  });
}

async function renderAndSettle() {
  const user = userEvent.setup();
  render(<BroadcastClient {...PROPS} />);
  await waitFor(() =>
    expect(screen.getByText(/Send to\s+42\s+subscribers/i)).toBeTruthy()
  );
  return user;
}

describe("BroadcastClient (Story 17.6 AC3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", () => true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches segments with ?wid= on mount", async () => {
    mockFetch();
    render(<BroadcastClient {...PROPS} />);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/dashboard/broadcast/segments?wid=wl-1"
      )
    );
  });

  it("POST body includes waitlist_id (B1 regression lock)", async () => {
    mockFetch();
    const user = await renderAndSettle();

    await user.type(screen.getByLabelText("Subject"), "Hello");
    await user.type(screen.getByLabelText("Body"), "<p>Hi there</p>");
    await user.click(screen.getByRole("button", { name: /Send to 42/ }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        (c) => c[0] === "/api/dashboard/broadcast" && c[1]?.method === "POST"
      );
      expect(postCall).toBeTruthy();
      const body = JSON.parse(postCall![1].body as string);
      expect(body.waitlist_id).toBe("wl-1");
      expect(body.subject).toBe("Hello");
      expect(body.body).toBe("<p>Hi there</p>");
      expect(body.segment).toBe("all");
    });
  });

  it("defaults segment to 'all'", async () => {
    mockFetch();
    render(<BroadcastClient {...PROPS} />);
    await waitFor(() =>
      expect(screen.getByText(/Send to\s+42\s+subscribers/i)).toBeTruthy()
    );
    // default pill is active (accent bg class) — assert via counts display
    expect(screen.getByText("All (42)")).toBeTruthy();
    expect(screen.getByText("Hot + Warm (30)")).toBeTruthy();
    expect(screen.getByText("Cold (12)")).toBeTruthy();
  });

  it("disables Send when subject or body is empty", async () => {
    mockFetch();
    render(<BroadcastClient {...PROPS} />);
    await waitFor(() =>
      expect(screen.getByText(/Send to\s+42\s+subscribers/i)).toBeTruthy()
    );
    const sendBtn = screen.getByRole("button", { name: /Send to 42/ });
    expect(sendBtn).toHaveProperty("disabled", true);
  });

  it("disables Send when subject exceeds length cap", async () => {
    mockFetch();
    const user = userEvent.setup();
    render(<BroadcastClient {...PROPS} />);
    await waitFor(() =>
      expect(screen.getByText(/Send to\s+42\s+subscribers/i)).toBeTruthy()
    );
    await user.type(screen.getByLabelText("Subject"), "x".repeat(201));
    await user.type(screen.getByLabelText("Body"), "ok body");
    const sendBtn = screen.getByRole("button", { name: /Send to 42/ });
    expect(sendBtn).toHaveProperty("disabled", true);
  });

  it("shows success screen on { ok: true, recipient_count }", async () => {
    mockFetch();
    const user = await renderAndSettle();

    await user.type(screen.getByLabelText("Subject"), "Hello");
    await user.type(screen.getByLabelText("Body"), "<p>Hi</p>");
    await user.click(screen.getByRole("button", { name: /Send to 42/ }));

    await waitFor(() => {
      expect(screen.getByText(/Sent to 42 subscribers/)).toBeTruthy();
    });
    expect(screen.getByText("Your broadcast has been sent.")).toBeTruthy();
  });

  it("shows error on non-2xx response", async () => {
    mockFetch(SEGMENTS_OK, {
      ok: false,
      status: 502,
      json: { ok: false, recipient_count: 0, errors: ["Chunk 0: failed"] },
    });
    const user = await renderAndSettle();

    await user.type(screen.getByLabelText("Subject"), "Hello");
    await user.type(screen.getByLabelText("Body"), "<p>Hi</p>");
    await user.click(screen.getByRole("button", { name: /Send to 42/ }));

    await waitFor(() => {
      expect(screen.getByText("Chunk 0: failed")).toBeTruthy();
    });
    // stays on compose screen
    expect(screen.getByLabelText("Subject")).toBeTruthy();
  });

  it("shows error when response is 200 but ok:false (B4)", async () => {
    mockFetch(SEGMENTS_OK, {
      ok: true,
      status: 200,
      json: { ok: false, recipient_count: 0, errors: ["All batches failed"] },
    });
    const user = await renderAndSettle();

    await user.type(screen.getByLabelText("Subject"), "Hello");
    await user.type(screen.getByLabelText("Body"), "<p>Hi</p>");
    await user.click(screen.getByRole("button", { name: /Send to 42/ }));

    await waitFor(() => {
      expect(screen.getByText("All batches failed")).toBeTruthy();
    });
    expect(screen.getByLabelText("Subject")).toBeTruthy();
  });
});

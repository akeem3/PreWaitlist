import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockAdmin = createMockSupabaseClient();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdmin,
}));

vi.mock("@/lib/resend", () => ({
  resend: { webhooks: { verify: vi.fn() } },
}));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: vi.fn((fn: () => unknown) => {
      void fn();
    }),
  };
});

import { resend } from "@/lib/resend";
import { POST } from "../../app/api/webhooks/resend/route";

const mockVerify = resend.webhooks.verify as unknown as ReturnType<
  typeof vi.fn
>;

const URL = "http://localhost/api/webhooks/resend";

function makeRequest(
  body: Record<string, unknown>,
  opts: { headers?: Record<string, string>; rawBody?: string } = {}
) {
  const headers: Record<string, string> = {
    "svix-id": "msg_1",
    "svix-timestamp": "1758777600",
    "svix-signature": "v1,c2ln",
    ...opts.headers,
  };
  return new NextRequest(URL, {
    method: "POST",
    body: opts.rawBody ?? JSON.stringify(body),
    headers,
  });
}

const CLICK_BODY = { type: "email.clicked" };

const CLICK_EVENT = {
  type: "email.clicked",
  created_at: "2026-09-25T10:00:00Z",
  data: {
    to: ["fan@example.com"],
    tags: { waitlist_id: "wl-1", subscriber_id: "sub-1" },
  },
};

function sub(id: string, waitlistId: string) {
  return { id, waitlist_id: waitlistId };
}

/** after() runs async work in microtasks — drain them before asserting. */
async function flushAfter() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function respond(request: NextRequest) {
  const response = await POST(request);
  await flushAfter();
  return response;
}

describe("POST /api/webhooks/resend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdmin.__queue.length = 0;
    mockAdmin.__calls.length = 0;
    mockVerify.mockImplementation(() => CLICK_EVENT);
  });

  it("returns 401 when svix headers are missing", async () => {
    const request = new NextRequest(URL, {
      method: "POST",
      body: JSON.stringify(CLICK_BODY),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Missing svix headers");
    expect(mockVerify).not.toHaveBeenCalled();
    expect(mockAdmin.__calls.length).toBe(0);
  });

  it("returns 401 when signature verification fails", async () => {
    mockVerify.mockImplementation(() => {
      throw new Error("signature mismatch");
    });

    const response = await respond(makeRequest(CLICK_BODY));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Invalid signature");
    expect(mockAdmin.__calls.length).toBe(0);
  });

  it("stores a valid click event with subscriber, waitlist and svix id", async () => {
    mockAdmin.__queue.push(
      { data: [sub("sub-1", "wl-1")], error: null },
      { data: null, error: null },
      { data: null, error: null }
    );

    const response = await respond(makeRequest(CLICK_BODY));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });

    const eqCalls = mockAdmin.__calls.filter(
      (c) => c.method === "eq" && c.args[0] === "waitlist_id"
    );
    expect(eqCalls.some((c) => c.args[1] === "wl-1")).toBe(true);
    const idCalls = mockAdmin.__calls.filter(
      (c) => c.method === "eq" && c.args[0] === "id"
    );
    expect(idCalls.some((c) => c.args[1] === "sub-1")).toBe(true);

    const inserts = mockAdmin.__calls.filter((c) => c.method === "insert");
    expect(inserts).toHaveLength(1);
    const payload = inserts[0].args[0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      subscriber_id: "sub-1",
      waitlist_id: "wl-1",
      event_type: "clicked",
      created_at: "2026-09-25T10:00:00Z",
    });
    expect((payload.event_data as Record<string, unknown>).svix_id).toBe(
      "msg_1"
    );
  });

  it("skips insert when the svix id already exists for the waitlist", async () => {
    mockAdmin.__queue.push(
      { data: [sub("sub-1", "wl-1")], error: null },
      { data: [{ id: "evt-existing" }], error: null }
    );

    const response = await respond(makeRequest(CLICK_BODY));

    expect(response.status).toBe(200);
    expect(mockAdmin.__calls.filter((c) => c.method === "insert")).toHaveLength(
      0
    );
  });

  it("returns 200 without insert for unknown event types", async () => {
    mockVerify.mockReturnValue({ type: "email.spam", data: {} });

    const response = await respond(makeRequest({ type: "email.spam" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(mockAdmin.__calls.length).toBe(0);
  });

  it("returns 200 without failing when the email matches no subscriber", async () => {
    mockAdmin.__queue.push({ data: [], error: null });

    const response = await respond(makeRequest(CLICK_BODY));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(mockAdmin.__calls.filter((c) => c.method === "insert")).toHaveLength(
      0
    );
  });

  it("inserts once per waitlist when the same email exists on multiple", async () => {
    const noTagsEvent = {
      type: "email.clicked",
      created_at: "2026-09-25T10:00:00Z",
      data: { to: ["fan@example.com"] },
    };
    mockVerify.mockReturnValue(noTagsEvent);

    mockAdmin.__queue.push(
      { data: [sub("sub-a", "wl-1"), sub("sub-b", "wl-2")], error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null }
    );

    const response = await respond(makeRequest({ type: "email.clicked" }));

    expect(response.status).toBe(200);

    const inserts = mockAdmin.__calls.filter((c) => c.method === "insert");
    expect(inserts).toHaveLength(2);
    const waitlistIds = inserts.map(
      (c) => (c.args[0] as { waitlist_id: string }).waitlist_id
    );
    expect(waitlistIds).toEqual(["wl-1", "wl-2"]);
  });
});

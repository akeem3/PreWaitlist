import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const { mockUnmarshal } = vi.hoisted(() => ({ mockUnmarshal: vi.fn() }));

vi.mock("@paddle/paddle-node-sdk", () => ({
  Paddle: class {
    webhooks = { unmarshal: mockUnmarshal };
  },
}));

const mockAdminSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminSupabase,
}));

import { POST } from "../../app/api/webhooks/paddle/route";

const OK = { data: null, error: null };

function paddleRequest() {
  return new NextRequest("http://localhost/api/webhooks/paddle", {
    method: "POST",
    body: JSON.stringify({ fake: "event" }),
    headers: { "paddle-signature": "sig" },
  });
}

function subEvent(eventType: string, overrides: Record<string, unknown> = {}) {
  return {
    eventType,
    eventId: "evt-1",
    data: {
      id: "sub-1",
      status: "active",
      customerId: "cus-1",
      customData: { user_id: "user-1", waitlist_id: "wl-1" },
      nextBilledAt: "2026-11-01T00:00:00Z",
      scheduledChange: null,
      ...overrides,
    },
  };
}

function updatePayloads(): Record<string, unknown>[] {
  return mockAdminSupabase.__calls
    .filter((c) => c.method === "update")
    .map((c) => c.args[0] as Record<string, unknown>);
}

describe("POST /api/webhooks/paddle — Phase 2 billing correctness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminSupabase.__queue.length = 0;
    mockAdminSupabase.__calls.length = 0;
    process.env.PADDLE_WEBHOOK_SECRET = "test-secret";
  });

  it("updated with scheduled cancel persists status + schedule, keeps Pro, no archive", async () => {
    mockUnmarshal.mockResolvedValueOnce(
      subEvent("subscription.updated", {
        scheduledChange: {
          action: "cancel",
          effectiveAt: "2026-11-01T00:00:00Z",
        },
      })
    );
    mockAdminSupabase.__queue.push(OK);

    const res = await POST(paddleRequest());
    expect(res.status).toBe(200);

    const payloads = updatePayloads();
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatchObject({
      paddle_subscription_status: "active",
      scheduled_change: {
        action: "cancel",
        effective_at: "2026-11-01T00:00:00Z",
      },
      paddle_next_billed_at: "2026-11-01T00:00:00Z",
    });
    expect(payloads[0]).not.toHaveProperty("tier");
    // no surplus-archive lookup ran (no second DB round trip)
    expect(
      mockAdminSupabase.__calls.filter((c) => c.method === "select").length
    ).toBe(0);
  });

  it("updated without a schedule clears scheduled_change", async () => {
    mockUnmarshal.mockResolvedValueOnce(subEvent("subscription.updated"));
    mockAdminSupabase.__queue.push(OK);

    const res = await POST(paddleRequest());
    expect(res.status).toBe(200);

    expect(updatePayloads()[0]).toMatchObject({ scheduled_change: null });
  });

  it("updated with status canceled downgrades and archives surplus, keeping newest active", async () => {
    mockUnmarshal.mockResolvedValueOnce(
      subEvent("subscription.updated", { status: "canceled" })
    );
    mockAdminSupabase.__queue.push(
      OK,
      {
        data: [
          { id: "w3", is_archived: false, created_at: "2026-09-03T00:00:00Z" },
          { id: "w2", is_archived: false, created_at: "2026-09-02T00:00:00Z" },
          { id: "w1", is_archived: false, created_at: "2026-09-01T00:00:00Z" },
        ],
        error: null,
      },
      OK
    );

    const res = await POST(paddleRequest());
    expect(res.status).toBe(200);

    const payloads = updatePayloads();
    expect(payloads[0]).toMatchObject({
      tier: "free",
      paddle_subscription_id: null,
      paddle_customer_id: null,
    });
    const inCalls = mockAdminSupabase.__calls.filter((c) => c.method === "in");
    expect(inCalls).toHaveLength(1);
    expect(inCalls[0].args[0]).toBe("id");
    expect(inCalls[0].args[1]).toEqual(["w2", "w1"]);
  });

  it("canceled downgrades and preserves manually-archived lists", async () => {
    mockUnmarshal.mockResolvedValueOnce(subEvent("subscription.canceled"));
    mockAdminSupabase.__queue.push(
      OK,
      {
        data: [
          { id: "w3", is_archived: false, created_at: "2026-09-03T00:00:00Z" },
          { id: "w2", is_archived: true, created_at: "2026-09-02T00:00:00Z" },
          { id: "w1", is_archived: false, created_at: "2026-09-01T00:00:00Z" },
        ],
        error: null,
      },
      OK
    );

    const res = await POST(paddleRequest());
    expect(res.status).toBe(200);

    expect(updatePayloads()[0]).toMatchObject({
      tier: "free",
      paddle_subscription_status: "canceled",
      scheduled_change: null,
    });
    const inCalls = mockAdminSupabase.__calls.filter((c) => c.method === "in");
    expect(inCalls).toHaveLength(1);
    // w3 stays (newest active), w2 already archived by hand, w1 archived now
    expect(inCalls[0].args[1]).toEqual(["w1"]);
  });

  it("canceled with a single active list skips the archive write", async () => {
    mockUnmarshal.mockResolvedValueOnce(subEvent("subscription.canceled"));
    mockAdminSupabase.__queue.push(OK, {
      data: [
        { id: "w1", is_archived: false, created_at: "2026-09-01T00:00:00Z" },
      ],
      error: null,
    });

    const res = await POST(paddleRequest());
    expect(res.status).toBe(200);
    expect(
      mockAdminSupabase.__calls.filter((c) => c.method === "in").length
    ).toBe(0);
  });

  it("canceled with archive failure returns 500 for Paddle retry", async () => {
    mockUnmarshal.mockResolvedValueOnce(subEvent("subscription.canceled"));
    mockAdminSupabase.__queue.push(
      OK,
      {
        data: [
          { id: "w2", is_archived: false, created_at: "2026-09-02T00:00:00Z" },
          { id: "w1", is_archived: false, created_at: "2026-09-01T00:00:00Z" },
        ],
        error: null,
      },
      { data: null, error: { message: "archive boom" } }
    );

    const res = await POST(paddleRequest());
    expect(res.status).toBe(500);
  });

  it("past_due keeps Pro and persists only the status", async () => {
    mockUnmarshal.mockResolvedValueOnce(
      subEvent("subscription.past_due", { status: "past_due" })
    );
    mockAdminSupabase.__queue.push(OK);

    const res = await POST(paddleRequest());
    expect(res.status).toBe(200);

    const payloads = updatePayloads();
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toEqual({ paddle_subscription_status: "past_due" });
  });

  it("created upgrades to Pro with ids, status and next bill date", async () => {
    mockUnmarshal.mockResolvedValueOnce(subEvent("subscription.created"));
    mockAdminSupabase.__queue.push(OK);

    const res = await POST(paddleRequest());
    expect(res.status).toBe(200);

    expect(updatePayloads()[0]).toMatchObject({
      tier: "pro",
      paddle_subscription_id: "sub-1",
      paddle_customer_id: "cus-1",
      paddle_subscription_status: "active",
      paddle_next_billed_at: "2026-11-01T00:00:00Z",
    });
  });

  it("missing user_id acks without touching the database", async () => {
    mockUnmarshal.mockResolvedValueOnce(
      subEvent("subscription.updated", { customData: null })
    );

    const res = await POST(paddleRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(mockAdminSupabase.__calls.length).toBe(0);
  });

  it("invalid signature returns 401", async () => {
    mockUnmarshal.mockRejectedValueOnce(new Error("bad signature"));

    const res = await POST(paddleRequest());
    expect(res.status).toBe(401);
  });
});

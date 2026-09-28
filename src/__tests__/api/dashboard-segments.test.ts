import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET } from "../../app/api/dashboard/broadcast/segments/route";

function makeRequest(
  url = "http://localhost/api/dashboard/broadcast/segments"
) {
  return new NextRequest(url);
}

const USER = { id: "user-1", email: "founder@test.com" };

function sub(
  email: string,
  warmth_score: string,
  unsubscribed_at: string | null = null
) {
  return { email, warmth_score, unsubscribed_at };
}

function primeProSubscribers(
  subscribers: ReturnType<typeof sub>[],
  bounced: { email: string; bounce_type: string; created_at: string }[] = []
) {
  mockSupabase.__queue.push(
    { data: { tier: "pro" }, error: null },
    { data: { id: "wl-9" }, error: null },
    { data: subscribers, error: null },
    { data: bounced, error: null }
  );
}

describe("GET /api/dashboard/broadcast/segments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: USER },
      error: null,
    });
  });

  it("returns 401 without a session", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(mockSupabase.__calls.length).toBe(0);
  });

  it("returns 403 for Free tier before any waitlist lookup", async () => {
    mockSupabase.__queue.push({ data: { tier: "free" }, error: null });

    // Unknown wid must NOT win over the tier gate (audit fix regression guard).
    const response = await GET(
      makeRequest(
        "http://localhost/api/dashboard/broadcast/segments?wid=does-not-exist"
      )
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBeTruthy();
    const waitlistLookups = mockSupabase.__calls.filter(
      (c) => c.method === "select" && c.args[0] === "id"
    );
    expect(waitlistLookups).toHaveLength(0);
  });

  it("returns scoped counts with all|hot_warm|cold keys for Pro + wid", async () => {
    primeProSubscribers([
      sub("a@t.com", "hot"),
      sub("b@t.com", "warm"),
      sub("c@t.com", "warm"),
      sub("d@t.com", "warm"),
      sub("e@t.com", "cold"),
    ]);

    const response = await GET(
      makeRequest("http://localhost/api/dashboard/broadcast/segments?wid=wl-9")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["all", "cold", "hot_warm"]);
    expect(body).toEqual({ all: 5, hot_warm: 4, cold: 1 });

    const founderScoped = mockSupabase.__calls.some(
      (c) =>
        c.method === "eq" && c.args[0] === "founder_id" && c.args[1] === USER.id
    );
    expect(founderScoped).toBe(true);

    const widScoped = mockSupabase.__calls.some(
      (c) => c.method === "eq" && c.args[0] === "id" && c.args[1] === "wl-9"
    );
    expect(widScoped).toBe(true);

    const subscriberScoped = mockSupabase.__calls.filter(
      (c) => c.method === "eq" && c.args[0] === "waitlist_id"
    );
    expect(subscriberScoped.length).toBeGreaterThanOrEqual(2);
    expect(subscriberScoped.every((c) => c.args[1] === "wl-9")).toBe(true);
  });

  it("excludes unsubscribed subscribers from all three counts", async () => {
    primeProSubscribers([
      sub("a@t.com", "hot"),
      sub("b@t.com", "warm"),
      sub("c@t.com", "cold"),
      sub("u1@t.com", "hot", "2026-01-01"),
      sub("u2@t.com", "warm", "2026-01-02"),
      sub("u3@t.com", "cold", "2026-01-03"),
    ]);

    const response = await GET(
      makeRequest("http://localhost/api/dashboard/broadcast/segments?wid=wl-9")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ all: 3, hot_warm: 2, cold: 1 });
  });

  it("excludes hard-bounced emails from all three counts", async () => {
    primeProSubscribers(
      [sub("a@t.com", "hot"), sub("b@t.com", "warm"), sub("c@t.com", "cold")],
      [
        {
          email: "b@t.com",
          bounce_type: "hard",
          created_at: new Date().toISOString(),
        },
      ]
    );

    const response = await GET(
      makeRequest("http://localhost/api/dashboard/broadcast/segments?wid=wl-9")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ all: 2, hot_warm: 1, cold: 1 });
  });

  it("returns 404 for unknown wid and 400 for multi-waitlist without wid", async () => {
    // Unknown wid → 404 (profile + null waitlist).
    mockSupabase.__queue.push(
      { data: { tier: "pro" }, error: null },
      { data: null, error: null }
    );
    const notFound = await GET(
      makeRequest(
        "http://localhost/api/dashboard/broadcast/segments?wid=does-not-exist"
      )
    );
    expect(notFound.status).toBe(404);

    // Multi-waitlist without wid → 400 (profile + 2-row array).
    mockSupabase.__queue.push(
      { data: { tier: "pro" }, error: null },
      { data: [{ id: "wl-1" }, { id: "wl-2" }], error: null }
    );
    const ambiguous = await GET(makeRequest());
    expect(ambiguous.status).toBe(400);
    const ambiguousBody = await ambiguous.json();
    expect(ambiguousBody.error).toBeTruthy();
  });
});

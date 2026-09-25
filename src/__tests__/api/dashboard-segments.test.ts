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

function primeProCounts(counts: {
  all: number;
  hotWarm: number;
  cold: number;
}) {
  mockSupabase.__queue.push(
    { data: { tier: "pro" }, error: null },
    { data: { id: "wl-9" }, error: null },
    { data: [], error: null },
    { data: null, error: null, count: counts.all },
    { data: null, error: null, count: counts.hotWarm },
    { data: null, error: null, count: counts.cold }
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
    primeProCounts({ all: 5, hotWarm: 4, cold: 1 });

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
    expect(subscriberScoped.length).toBeGreaterThanOrEqual(3);
    expect(subscriberScoped.every((c) => c.args[1] === "wl-9")).toBe(true);
  });

  it("excludes unsubscribed subscribers from all three counts", async () => {
    primeProCounts({ all: 9, hotWarm: 6, cold: 3 });

    const response = await GET(
      makeRequest("http://localhost/api/dashboard/broadcast/segments?wid=wl-9")
    );

    expect(response.status).toBe(200);

    const unsubFilters = mockSupabase.__calls.filter(
      (c) =>
        c.method === "is" &&
        c.args[0] === "unsubscribed_at" &&
        c.args[1] === null
    );
    // One .is() per eligibleCount() chain — all, hot_warm, cold.
    expect(unsubFilters).toHaveLength(3);
  });
});

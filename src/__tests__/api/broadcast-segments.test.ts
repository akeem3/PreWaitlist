import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET } from "../../app/api/dashboard/broadcast/segments/route";

const USER = { id: "user-1", email: "founder@test.com" };

function makeRequest(
  url = "http://localhost/api/dashboard/broadcast/segments"
) {
  return new NextRequest(url);
}

function sub(email: string, warmth: string, unsub: string | null = null) {
  return { email, warmth_score: warmth, unsubscribed_at: unsub };
}

function primePro(
  subs: ReturnType<typeof sub>[],
  bounced: { email: string; bounce_type: string; created_at: string }[] = [],
  waitlistId = "wl-9"
) {
  mockSupabase.__queue.push(
    { data: { tier: "pro" }, error: null },
    { data: { id: waitlistId }, error: null },
    { data: subs, error: null },
    { data: bounced, error: null }
  );
}

describe("GET /api/dashboard/broadcast/segments (Story 17.6 AC2)", () => {
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
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 403 for free tier before any waitlist lookup", async () => {
    mockSupabase.__queue.push({ data: { tier: "free" }, error: null });
    const res = await GET(
      makeRequest("http://localhost/api/dashboard/broadcast/segments?wid=wl-9")
    );
    expect(res.status).toBe(403);
    const waitlistLookups = mockSupabase.__calls.filter(
      (c) => c.method === "select" && c.args[0] === "id"
    );
    expect(waitlistLookups).toHaveLength(0);
  });

  it("returns {all, hot_warm, cold} numeric shape for ?wid= scoped success", async () => {
    primePro([
      sub("a@t.com", "hot"),
      sub("b@t.com", "warm"),
      sub("c@t.com", "warm"),
      sub("d@t.com", "cold"),
    ]);

    const res = await GET(
      makeRequest("http://localhost/api/dashboard/broadcast/segments?wid=wl-9")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(["all", "cold", "hot_warm"]);
    expect(body).toEqual({ all: 4, hot_warm: 3, cold: 1 });
    expect(typeof body.all).toBe("number");
    expect(typeof body.hot_warm).toBe("number");
    expect(typeof body.cold).toBe("number");
  });

  it("returns 400 when multiple waitlists exist and no wid is provided", async () => {
    mockSupabase.__queue.push(
      { data: { tier: "pro" }, error: null },
      { data: [{ id: "wl-1" }, { id: "wl-2" }], error: null }
    );
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("wid is required");
  });

  it("returns 404 for foreign or missing wid", async () => {
    mockSupabase.__queue.push(
      { data: { tier: "pro" }, error: null },
      { data: null, error: null }
    );
    const res = await GET(
      makeRequest(
        "http://localhost/api/dashboard/broadcast/segments?wid=foreign-id"
      )
    );
    expect(res.status).toBe(404);
  });

  it("excludes unsubscribed subscribers from all counts", async () => {
    primePro([
      sub("a@t.com", "hot"),
      sub("b@t.com", "warm"),
      sub("c@t.com", "cold"),
      sub("u1@t.com", "hot", "2026-01-01"),
      sub("u2@t.com", "cold", "2026-01-02"),
    ]);
    const res = await GET(
      makeRequest("http://localhost/api/dashboard/broadcast/segments?wid=wl-9")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ all: 3, hot_warm: 2, cold: 1 });
  });

  it("excludes hard-bounced emails from all counts", async () => {
    primePro(
      [sub("a@t.com", "hot"), sub("b@t.com", "warm"), sub("c@t.com", "cold")],
      [
        {
          email: "b@t.com",
          bounce_type: "hard",
          created_at: new Date().toISOString(),
        },
      ]
    );
    const res = await GET(
      makeRequest("http://localhost/api/dashboard/broadcast/segments?wid=wl-9")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ all: 2, hot_warm: 1, cold: 1 });
  });

  it("does not exclude soft bounces older than 24h", async () => {
    primePro(
      [sub("a@t.com", "hot"), sub("b@t.com", "warm")],
      [
        {
          email: "b@t.com",
          bounce_type: "soft",
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        },
      ]
    );
    const res = await GET(
      makeRequest("http://localhost/api/dashboard/broadcast/segments?wid=wl-9")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ all: 2, hot_warm: 2, cold: 0 });
  });
});

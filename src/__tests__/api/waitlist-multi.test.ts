import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { POST, GET, PATCH } from "../../app/api/waitlist/route";

function makeRequest(
  url: string,
  options?: { method?: string; body?: unknown }
) {
  return new Request(url, {
    method: options?.method || "GET",
    headers: { "Content-Type": "application/json" },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  }) as import("next/server").NextRequest;
}

describe("POST /api/waitlist (multi-waitlist)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const response = await POST(
      makeRequest("http://localhost/api/waitlist", {
        method: "POST",
        body: { subdomain: "new-waitlist" },
      })
    );
    expect(response.status).toBe(401);
  });

  it("creates first waitlist for free tier user", async () => {
    // Auth (default user), profile (free tier), count (0 waitlists), insert
    mockSupabase.__queue.push({
      data: { id: "user-1", tier: "free" },
      error: null,
    });
    mockSupabase.__queue.push({ count: 0, data: null, error: null });
    mockSupabase.__queue.push({ data: { id: "wl-new" }, error: null });

    const response = await POST(
      makeRequest("http://localhost/api/waitlist", {
        method: "POST",
        body: { subdomain: "new-waitlist", headline: "My new waitlist" },
      })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBe("wl-new");
  });

  it("allows Pro tier user to create additional waitlists", async () => {
    // Auth (default user), profile (pro tier), count (0 — but doesn't matter for pro), insert
    mockSupabase.__queue.push({
      data: { id: "user-1", tier: "pro" },
      error: null,
    });
    mockSupabase.__queue.push({ count: 3, data: null, error: null });
    mockSupabase.__queue.push({ data: { id: "wl-pro-new" }, error: null });

    const response = await POST(
      makeRequest("http://localhost/api/waitlist", {
        method: "POST",
        body: { subdomain: "pro-new-waitlist" },
      })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBe("wl-pro-new");
  });

  it("returns 402 when free tier user already has one waitlist", async () => {
    // Auth (default user), profile (free tier), count (1 waitlist exists)
    mockSupabase.__queue.push({
      data: { id: "user-1", tier: "free" },
      error: null,
    });
    mockSupabase.__queue.push({ count: 1, data: null, error: null });

    const response = await POST(
      makeRequest("http://localhost/api/waitlist", {
        method: "POST",
        body: { subdomain: "another-waitlist" },
      })
    );
    expect(response.status).toBe(402);
    const body = await response.json();
    expect(body.error).toContain("Pro");
  });
});

describe("GET /api/waitlist (multi-waitlist)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all waitlists for authenticated founder", async () => {
    // Auth (default user), waitlist fetch (2 waitlists),
    // subscriberCounts query (dequeues but unused), 2 individual subscriber counts
    mockSupabase.__queue.push({
      data: [
        {
          id: "wl-1",
          subdomain: "acme",
          product_name: "Acme",
          headline: "Join Acme",
        },
        {
          id: "wl-2",
          subdomain: "globex",
          product_name: "Globex",
          headline: "Join Globex",
        },
      ],
      error: null,
    });
    mockSupabase.__queue.push({ count: 0, data: null, error: null });
    mockSupabase.__queue.push({ count: 42, data: null, error: null });
    mockSupabase.__queue.push({ count: 7, data: null, error: null });

    const response = await GET(makeRequest("http://localhost/api/waitlist"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(2);
    expect(body[0].slug).toBe("acme");
    expect(body[0].subscriberCount).toBe(42);
    expect(body[1].slug).toBe("globex");
    expect(body[1].subscriberCount).toBe(7);
  });

  it("returns empty array when founder has no waitlists", async () => {
    // Auth (default user), waitlist fetch (empty)
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(makeRequest("http://localhost/api/waitlist"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const response = await GET(makeRequest("http://localhost/api/waitlist"));
    expect(response.status).toBe(401);
  });
});

describe("PATCH /api/waitlist (multi-waitlist)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when waitlist_id is missing", async () => {
    const response = await PATCH(
      makeRequest("http://localhost/api/waitlist", {
        method: "PATCH",
        body: { headline: "Updated headline" },
      })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("waitlist_id");
  });

  it("returns 404 when waitlist does not belong to user", async () => {
    // Auth (default user), ownership check (null — not found)
    mockSupabase.__queue.push({ data: null, error: null });

    const response = await PATCH(
      makeRequest("http://localhost/api/waitlist", {
        method: "PATCH",
        body: { waitlist_id: "wl-other", headline: "Hacked headline" },
      })
    );
    expect(response.status).toBe(404);
  });

  it("updates correct waitlist owned by user", async () => {
    // Auth (default user), ownership check (found), update
    mockSupabase.__queue.push({ data: { id: "wl-1" }, error: null });
    mockSupabase.__queue.push({ data: null, error: null });

    const response = await PATCH(
      makeRequest("http://localhost/api/waitlist", {
        method: "PATCH",
        body: { waitlist_id: "wl-1", headline: "Updated headline" },
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("upserts milestone_rewards when provided", async () => {
    // Auth (default user), ownership check (found), update
    mockSupabase.__queue.push({ data: { id: "wl-1" }, error: null });
    mockSupabase.__queue.push({ data: null, error: null });

    const response = await PATCH(
      makeRequest("http://localhost/api/waitlist", {
        method: "PATCH",
        body: {
          waitlist_id: "wl-1",
          milestone_rewards: [
            { threshold: 5, label: "Early access" },
            { threshold: 10, label: "VIP badge" },
          ],
        },
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET } from "../../app/api/dashboard/stats/route";

function makeRequest(url: string) {
  return new Request(url) as import("next/server").NextRequest;
}

describe("GET /api/dashboard/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when waitlist_id is missing", async () => {
    const response = await GET(
      makeRequest("http://localhost/api/dashboard/stats")
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("waitlist_id is required");
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const response = await GET(
      makeRequest("http://localhost/api/dashboard/stats?waitlist_id=wl-1")
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when no waitlist exists", async () => {
    mockSupabase.__queue.push({ data: null, error: new Error("Not found") });

    const response = await GET(
      makeRequest("http://localhost/api/dashboard/stats?waitlist_id=wl-1")
    );
    expect(response.status).toBe(404);
  });
});

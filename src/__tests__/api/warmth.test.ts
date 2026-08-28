import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET } from "../../app/api/warmth/[subdomain]/route";

describe("GET /api/warmth/:subdomain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns warmth distribution counts", async () => {
    mockSupabase.__queue.push(
      { data: { id: "wl-1" }, error: null }, // waitlist lookup
      {
        data: [
          { warmth_score: "hot" },
          { warmth_score: "hot" },
          { warmth_score: "warm" },
          { warmth_score: "cold" },
          { warmth_score: null },
          { warmth_score: null },
        ],
        error: null,
      } // subscribers
    );

    const request = new NextRequest("http://localhost/api/warmth/test-sub");
    const response = await GET(request, {
      params: Promise.resolve({ subdomain: "test-sub" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      hot: 2,
      warm: 1,
      cold: 1,
      unscored: 2,
      total: 6,
    });
  });

  it("returns 404 for unknown subdomain", async () => {
    mockSupabase.__queue.push({ data: null, error: null }); // waitlist not found

    const request = new NextRequest("http://localhost/api/warmth/unknown");
    const response = await GET(request, {
      params: Promise.resolve({ subdomain: "unknown" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns zeros for empty subscriber list", async () => {
    mockSupabase.__queue.push(
      { data: { id: "wl-1" }, error: null }, // waitlist lookup
      { data: [], error: null } // no subscribers
    );

    const request = new NextRequest("http://localhost/api/warmth/test-sub");
    const response = await GET(request, {
      params: Promise.resolve({ subdomain: "test-sub" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      hot: 0,
      warm: 0,
      cold: 0,
      unscored: 0,
      total: 0,
    });
  });

  it("counts null warmth_score as unscored", async () => {
    mockSupabase.__queue.push(
      { data: { id: "wl-1" }, error: null },
      {
        data: [
          { warmth_score: null },
          { warmth_score: null },
          { warmth_score: null },
        ],
        error: null,
      }
    );

    const request = new NextRequest("http://localhost/api/warmth/test-sub");
    const response = await GET(request, {
      params: Promise.resolve({ subdomain: "test-sub" }),
    });
    const data = await response.json();

    expect(data).toEqual({
      hot: 0,
      warm: 0,
      cold: 0,
      unscored: 3,
      total: 3,
    });
  });
});

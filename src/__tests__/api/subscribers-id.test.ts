import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET } from "../../app/api/subscribers/[id]/route";

describe("GET /api/subscribers/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns subscriber with position and referral count", async () => {
    mockSupabase.__queue.push(
      {
        data: {
          id: "sub-1",
          email: "test@test.com",
          position: 5,
          referral_code: "abc12345",
          qual_answers: null,
          created_at: "2026-01-01",
          waitlist_id: "wl-1",
        },
        error: null,
      }, // subscriber lookup
      { data: { founder_id: "user-1" }, error: null }, // waitlist lookup
      { count: 3, error: null } // referral count
    );

    const request = new NextRequest("http://localhost/api/subscribers/sub-1");
    const response = await GET(request, {
      params: Promise.resolve({ id: "sub-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("sub-1");
    expect(data.position).toBe(5);
    expect(data.referral_count).toBe(3);
  });

  it("returns 401 without auth", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const request = new NextRequest("http://localhost/api/subscribers/sub-1");
    const response = await GET(request, {
      params: Promise.resolve({ id: "sub-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 for unknown subscriber", async () => {
    mockSupabase.__queue.push(
      { data: null, error: null } // subscriber not found
    );

    const request = new NextRequest("http://localhost/api/subscribers/unknown");
    const response = await GET(request, {
      params: Promise.resolve({ id: "unknown" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 when subscriber belongs to different founder", async () => {
    mockSupabase.__queue.push(
      {
        data: {
          id: "sub-1",
          email: "test@test.com",
          position: 1,
          referral_code: "abc",
          qual_answers: null,
          created_at: "2026-01-01",
          waitlist_id: "wl-1",
        },
        error: null,
      },
      { data: { founder_id: "other-user" }, error: null } // different founder
    );

    const request = new NextRequest("http://localhost/api/subscribers/sub-1");
    const response = await GET(request, {
      params: Promise.resolve({ id: "sub-1" }),
    });

    expect(response.status).toBe(404);
  });
});

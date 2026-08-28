import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET } from "../../app/api/subscribers/[id]/referrals/route";

describe("GET /api/subscribers/:id/referrals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns referral_count and referrals list", async () => {
    mockSupabase.__queue.push(
      {
        data: {
          id: "sub-1",
          waitlists: { founder_id: "user-1" },
        },
        error: null,
      },
      { count: 2, error: null },
      {
        data: [
          {
            id: "ref-1",
            email: "a@test.com",
            position: 2,
            created_at: "2026-01-01",
          },
          {
            id: "ref-2",
            email: "b@test.com",
            position: 3,
            created_at: "2026-01-02",
          },
        ],
        error: null,
      }
    );

    const request = new NextRequest(
      "http://localhost/api/subscribers/sub-1/referrals"
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "sub-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.referral_count).toBe(2);
    expect(data.referrals).toHaveLength(2);
  });

  it("returns 404 for unknown subscriber", async () => {
    mockSupabase.__queue.push({ data: null, error: null });

    const request = new NextRequest(
      "http://localhost/api/subscribers/unknown/referrals"
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "unknown" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 401 without auth", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const request = new NextRequest(
      "http://localhost/api/subscribers/sub-1/referrals"
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "sub-1" }),
    });

    expect(response.status).toBe(401);
  });
});

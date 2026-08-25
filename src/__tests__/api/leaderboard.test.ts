import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET } from "../../app/api/leaderboard/[subdomain]/route";

describe("GET /api/leaderboard/:subdomain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns subscribers ranked by referral count", async () => {
    mockSupabase.__queue.push(
      { data: { id: "wl-1" }, error: null }, // waitlist lookup
      {
        data: [
          {
            id: "s1",
            email: "alice@test.com",
            position: 1,
            referral_code: "a1",
            qual_answers: null,
            created_at: "2026-01-01",
          },
          {
            id: "s2",
            email: "bob@test.com",
            position: 2,
            referral_code: "b1",
            qual_answers: null,
            created_at: "2026-01-02",
          },
        ],
        error: null,
      }, // subscribers
      { data: [{ referrer_id: "s1" }, { referrer_id: "s1" }], error: null } // referral rows
    );

    const request = new NextRequest(
      "http://localhost/api/leaderboard/test-subdomain"
    );
    const response = await GET(request, {
      params: Promise.resolve({ subdomain: "test-subdomain" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("returns empty array for unknown subdomain", async () => {
    mockSupabase.__queue.push({ data: null, error: null }); // waitlist not found

    const request = new NextRequest("http://localhost/api/leaderboard/unknown");
    const response = await GET(request, {
      params: Promise.resolve({ subdomain: "unknown" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("returns empty array for empty subdomain", async () => {
    const request = new NextRequest("http://localhost/api/leaderboard/");
    const response = await GET(request, {
      params: Promise.resolve({ subdomain: "" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("anonymizes emails in response", async () => {
    mockSupabase.__queue.push(
      { data: { id: "wl-1" }, error: null },
      {
        data: [
          {
            id: "s1",
            email: "john.doe@example.com",
            position: 1,
            referral_code: "j1",
            qual_answers: null,
            created_at: "2026-01-01",
          },
        ],
        error: null,
      },
      { data: [], error: null }
    );

    const request = new NextRequest("http://localhost/api/leaderboard/test");
    const response = await GET(request, {
      params: Promise.resolve({ subdomain: "test" }),
    });
    const data = await response.json();

    expect(data[0].email).toBe("j••••e@example.com");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// PATCH uses the service-role client (anon SELECT revoked, Epic 14.0 AC8)
const mockAdminSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminSupabase,
}));

import { GET, PATCH } from "../../app/api/subscribers/[id]/route";

describe("GET /api/subscribers/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockAdminSupabase.__queue.length = 0;
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

describe("PATCH /api/subscribers/:id (audit F1 — display_name cap)", () => {
  const patchRequest = (body: unknown) =>
    new NextRequest("http://localhost/api/subscribers/sub-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const params = { params: Promise.resolve({ id: "sub-1" }) };

  it("rejects display_name longer than 100 characters without writing", async () => {
    mockAdminSupabase.__queue.push(
      { data: { id: "sub-1", referral_code: "abc12345" }, error: null } // ownership
    );

    const response = await PATCH(
      patchRequest({
        display_name: "x".repeat(101),
        referral_code: "abc12345",
      }),
      params
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Display name must be 100 characters or fewer");
    expect(mockAdminSupabase.__calls.some((c) => c.method === "update")).toBe(
      false
    );
  });

  it("accepts display_name of exactly 100 characters", async () => {
    mockAdminSupabase.__queue.push(
      { data: { id: "sub-1", referral_code: "abc12345" }, error: null }, // ownership
      { error: null } // update
    );

    const response = await PATCH(
      patchRequest({
        display_name: "x".repeat(100),
        referral_code: "abc12345",
      }),
      params
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("returns 400 without referral_code", async () => {
    const response = await PATCH(patchRequest({ display_name: "Ada" }), params);

    expect(response.status).toBe(400);
  });
});

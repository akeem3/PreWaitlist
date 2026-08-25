import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

// Mock Supabase server client
const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { POST } from "../../app/api/subscribers/route";

describe("POST /api/subscribers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates subscriber with valid data", async () => {
    // Mock: max position query returns position 2, then insert returns subscriber
    mockSupabase.__queue.push(
      { data: { position: 2 }, error: null }, // max position
      {
        data: {
          id: "sub-1",
          email: "test@test.com",
          referral_code: "abc12345",
          position: 3,
        },
        error: null,
      } // insert
    );

    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "waitlist-1",
        email: "test@test.com",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe("sub-1");
    expect(data.email).toBe("test@test.com");
    expect(data.referral_code).toBeDefined();
    expect(data.position).toBe(3);
  });

  it("returns 400 for missing fields", async () => {
    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "waitlist-1",
        email: "not-an-email",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 409 on duplicate email", async () => {
    // Mock: max position query, then insert fails with 23505
    mockSupabase.__queue.push(
      { data: { position: 1 }, error: null },
      {
        data: null,
        error: {
          message:
            'duplicate key value violates unique constraint "subscribers_waitlist_email_idx"',
          code: "23505",
          details: "",
          hint: "",
        },
      }
    );

    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "waitlist-1",
        email: "test@test.com",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(409);
  });

  it("stores qual_answers when provided", async () => {
    mockSupabase.__queue.push(
      { data: { position: 0 }, error: null },
      {
        data: {
          id: "sub-1",
          email: "test@test.com",
          referral_code: "abc",
          position: 1,
        },
        error: null,
      }
    );

    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "waitlist-1",
        email: "test@test.com",
        qual_answers: { q1: "answer" },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it("generates 8-char referral code", async () => {
    mockSupabase.__queue.push(
      { data: { position: 0 }, error: null },
      {
        data: {
          id: "sub-1",
          email: "test@test.com",
          referral_code: "abcdefgh",
          position: 1,
        },
        error: null,
      }
    );

    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "waitlist-1",
        email: "test@test.com",
      }),
    });

    const response = await POST(request);
    const data = await response.json();
    expect(data.referral_code).toHaveLength(8);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

// Mock next/server after() — execute callback immediately in tests
vi.mock("next/server", async () => {
  const actual =
    await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    after: (fn: () => Promise<void>) => fn(),
  };
});

// Mock Supabase server client
const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// Mock Supabase admin client (used in fire-and-forget IIFE)
const mockAdminSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminSupabase,
}));

// Mock Resend (needs RESEND_API_KEY in env)
vi.mock("@/lib/resend", () => ({
  resend: { emails: { send: vi.fn() } },
}));

// Mock milestones (depends on Resend)
vi.mock("@/lib/milestones", () => ({
  checkAndFulfillMilestones: vi.fn(),
}));

// Mock positions (RPC-based position recalculation)
vi.mock("@/lib/positions", () => ({
  recalculatePositions: vi.fn().mockResolvedValue([]),
  getPositionUpdate: vi.fn().mockReturnValue(null),
}));

// Mock email utilities
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true }),
  buildEmailFooter: vi.fn().mockReturnValue(""),
  isUnsubscribed: vi.fn().mockResolvedValue(false),
}));

// Mock bounces
vi.mock("@/lib/bounces", () => ({
  isEmailBounced: vi.fn().mockResolvedValue(false),
}));

import { POST } from "../../app/api/subscribers/route";

describe("POST /api/subscribers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates subscriber with valid data", async () => {
    mockSupabase.__queue.push(
      {
        data: {
          id: "sub-1",
          email: "test@test.com",
          referral_code: "abc12345",
          position: 1,
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
    // Insert fails with 23505 unique constraint violation
    mockSupabase.__queue.push({
      data: null,
      error: {
        message:
          'duplicate key value violates unique constraint "subscribers_waitlist_email_idx"',
        code: "23505",
        details: "",
        hint: "",
      },
    });

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
    mockSupabase.__queue.push({
      data: {
        id: "sub-1",
        email: "test@test.com",
        referral_code: "abc",
        position: 1,
      },
      error: null,
    });

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
    mockSupabase.__queue.push({
      data: {
        id: "sub-1",
        email: "test@test.com",
        referral_code: "abcdefgh",
        position: 1,
      },
      error: null,
    });

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

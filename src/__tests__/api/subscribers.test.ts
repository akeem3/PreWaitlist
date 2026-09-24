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

// Mock Supabase server client (waitlists cap check)
const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// Mock Supabase admin client — 14.0 uses admin for subscriber insert/read paths
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

function pushCreateSubscriber() {
  // cap check on server client
  mockSupabase.__queue.push({
    data: {
      subscriber_count: 10,
      founder_profiles: { tier: "free" },
    },
    error: null,
  });
  // insert on admin client
  mockAdminSupabase.__queue.push({
    data: {
      id: "sub-1",
      email: "test@test.com",
      referral_code: "abc12345",
      position: 1,
    },
    error: null,
  });
}

describe("POST /api/subscribers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockAdminSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
    mockAdminSupabase.__calls.length = 0;
  });

  it("creates subscriber with valid data", async () => {
    pushCreateSubscriber();

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
    mockSupabase.__queue.push({
      data: {
        subscriber_count: 10,
        founder_profiles: { tier: "free" },
      },
      error: null,
    });
    mockAdminSupabase.__queue.push({
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

  it("stores qual_answers when valid question_id keys provided", async () => {
    mockSupabase.__queue.push({
      data: {
        subscriber_count: 10,
        founder_profiles: { tier: "free" },
      },
      error: null,
    });
    // questions lookup for AC11 validation
    mockAdminSupabase.__queue.push({
      data: [{ id: "q-1" }],
      error: null,
    });
    // insert
    mockAdminSupabase.__queue.push({
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
        qual_answers: { "q-1": "answer" },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it("drops unknown qual_answers keys (AC11)", async () => {
    mockSupabase.__queue.push({
      data: {
        subscriber_count: 10,
        founder_profiles: { tier: "free" },
      },
      error: null,
    });
    mockAdminSupabase.__queue.push({
      data: [{ id: "q-1" }],
      error: null,
    });
    mockAdminSupabase.__queue.push({
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
        qual_answers: { "q-1": "keep", "text-key": "drop" },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    // Find insert call on admin client and verify sanitized keys
    const insertCalls = mockAdminSupabase.__calls.filter(
      (c) => c.method === "insert"
    );
    expect(insertCalls.length).toBeGreaterThan(0);
    const payload = insertCalls[insertCalls.length - 1].args[0] as {
      qual_answers: Record<string, string> | null;
    };
    expect(payload.qual_answers).toEqual({ "q-1": "keep" });
  });

  it("generates 8-char referral code", async () => {
    pushCreateSubscriber();

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

  it("increments subscriber_count via RPC after successful insert", async () => {
    pushCreateSubscriber();

    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "waitlist-1",
        email: "test@test.com",
      }),
    });

    await POST(request);

    expect(mockAdminSupabase.rpc).toHaveBeenCalledWith(
      "increment_subscriber_count",
      { p_waitlist_id: "waitlist-1" }
    );
  });
});

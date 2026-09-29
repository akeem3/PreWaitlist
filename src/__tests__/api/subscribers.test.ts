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
  buildFreeEmailFooter: vi.fn().mockReturnValue(""),
  isUnsubscribed: vi.fn().mockResolvedValue(false),
}));

// Mock bounces
vi.mock("@/lib/bounces", () => ({
  isEmailBounced: vi.fn().mockResolvedValue(false),
}));

import { POST } from "../../app/api/subscribers/route";
import { sendEmail } from "@/lib/email";

const mockedSendEmail = vi.mocked(sendEmail);

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

  // --- Sender identity fallback (2.5 rule B) ---

  function pushConfirmationSenderQueue(
    tier: string,
    senderName: string | null,
    sendingDomain: string | null
  ) {
    // insert
    mockAdminSupabase.__queue.push({
      data: {
        id: "sub-1",
        email: "test@test.com",
        referral_code: "abc12345",
        position: 1,
      },
      error: null,
    });
    // confirmation IIFE: waitlist select
    mockAdminSupabase.__queue.push({
      data: {
        product_name: "Acme",
        headline: "Join Acme",
        subdomain: "acme",
        sender_name: senderName,
        sending_domain: sendingDomain,
        business_address: null,
        email_subject: null,
        email_body: null,
      },
      error: null,
    });
    // after() IIFEs interleave round-robin: the cap-warning IIFE (registered
    // after confirmation) drains its single lookup here, before confirmation's
    // remaining awaits — so its null row goes second.
    mockAdminSupabase.__queue.push({ data: null, error: null });
    // confirmation IIFE: subscriber display_name
    mockAdminSupabase.__queue.push({
      data: { display_name: null },
      error: null,
    });
    // confirmation IIFE: subscriber count
    mockAdminSupabase.__queue.push({ data: null, error: null, count: 1 });
    // confirmation IIFE: milestone rewards
    mockAdminSupabase.__queue.push({ data: [], error: null });
    // confirmation IIFE: founder tier
    mockAdminSupabase.__queue.push({
      data: { founder_profiles: [{ tier }] },
      error: null,
    });
  }

  async function postDirectSignup() {
    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "waitlist-1",
        email: "test@test.com",
      }),
    });
    const response = await POST(request);
    await new Promise((resolve) => setTimeout(resolve, 0));
    return response;
  }

  it("passes custom sender identity through on Pro for confirmation email", async () => {
    // server cap check only — pushConfirmationSenderQueue owns the insert
    mockSupabase.__queue.push({
      data: {
        subscriber_count: 10,
        founder_profiles: { tier: "free" },
      },
      error: null,
    });
    pushConfirmationSenderQueue("pro", "Ada", "ada.com");

    const response = await postDirectSignup();
    expect(response.status).toBe(201);

    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    expect(mockedSendEmail.mock.calls[0][0]).toMatchObject({
      senderName: "Ada",
      sendingDomain: "ada.com",
    });
  });

  it("falls back to default sender on Free for confirmation email", async () => {
    // server cap check only — pushConfirmationSenderQueue owns the insert
    mockSupabase.__queue.push({
      data: {
        subscriber_count: 10,
        founder_profiles: { tier: "free" },
      },
      error: null,
    });
    pushConfirmationSenderQueue("free", "Ada", "ada.com");

    const response = await postDirectSignup();
    expect(response.status).toBe(201);

    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    expect(mockedSendEmail.mock.calls[0][0]).toMatchObject({
      senderName: null,
      sendingDomain: null,
    });
  });

  // --- Quota failure paths (3.1c) ---

  function eventInserts() {
    return mockAdminSupabase.__calls
      .filter((c) => c.method === "insert")
      .map((c) => c.args[0] as Record<string, unknown>);
  }

  it("parks daily-quota confirmation failures and logs delivery_delayed", async () => {
    mockSupabase.__queue.push({
      data: {
        subscriber_count: 10,
        founder_profiles: { tier: "free" },
      },
      error: null,
    });
    pushConfirmationSenderQueue("free", null, null);
    mockedSendEmail.mockResolvedValueOnce({
      ok: false,
      error: "Daily quota exceeded",
      errorKind: "daily_quota",
      errorName: "daily_quota_exceeded",
    });

    const response = await postDirectSignup();
    expect(response.status).toBe(201);

    const inserts = eventInserts();
    const parked = inserts.filter((r) => "to_email" in r);
    expect(parked).toHaveLength(1);
    expect(parked[0]).toMatchObject({
      email_type: "confirmation",
      idempotency_key: "confirmation-email/sub-1",
    });
    const delayed = inserts.filter(
      (r) => (r as { event_type?: string }).event_type === "delivery_delayed"
    );
    expect(delayed).toHaveLength(1);
    expect((delayed[0].event_data as Record<string, unknown>).type).toBe(
      "confirmation"
    );
  });

  it("dead-letters monthly-quota confirmation failures without parking", async () => {
    mockSupabase.__queue.push({
      data: {
        subscriber_count: 10,
        founder_profiles: { tier: "free" },
      },
      error: null,
    });
    pushConfirmationSenderQueue("free", null, null);
    mockedSendEmail.mockResolvedValueOnce({
      ok: false,
      error: "Monthly quota exceeded",
      errorKind: "monthly_quota",
      errorName: "monthly_quota_exceeded",
    });

    const response = await postDirectSignup();
    expect(response.status).toBe(201);

    const inserts = eventInserts();
    expect(inserts.filter((r) => "to_email" in r)).toHaveLength(0);
    const failed = inserts.filter(
      (r) => (r as { event_type?: string }).event_type === "failed"
    );
    expect(failed).toHaveLength(1);
    expect(failed[0]).toMatchObject({ subscriber_id: "sub-1" });
    expect((failed[0].event_data as Record<string, unknown>).error_name).toBe(
      "monthly_quota_exceeded"
    );
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

vi.mock("next/server", async () => {
  const actual =
    await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    after: (fn: () => Promise<void>) => fn(),
  };
});

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

const mockAdminSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminSupabase,
}));

vi.mock("@/lib/resend", () => ({
  resend: { emails: { send: vi.fn() } },
}));

vi.mock("@/lib/milestones", () => ({
  checkAndFulfillMilestones: vi.fn(),
}));

vi.mock("@/lib/positions", () => ({
  recalculatePositions: vi.fn().mockResolvedValue([]),
  getPositionUpdate: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true }),
  buildEmailFooter: vi.fn().mockReturnValue(""),
  isUnsubscribed: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/bounces", () => ({
  isEmailBounced: vi.fn().mockResolvedValue(false),
}));

import { POST } from "../../app/api/subscribers/route";

function pushCapCheck() {
  mockSupabase.__queue.push({
    data: {
      subscriber_count: 10,
      founder_profiles: { tier: "free" },
    },
    error: null,
  });
}

describe("POST /api/subscribers — referral tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockAdminSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
    mockAdminSupabase.__calls.length = 0;
  });

  it("stores referrer_id on valid referral", async () => {
    pushCapCheck();
    // referral lookup on admin (14.0)
    mockAdminSupabase.__queue.push({
      data: { id: "referrer-1", waitlist_id: "wl-1" },
      error: null,
    });
    // insert on admin
    mockAdminSupabase.__queue.push({
      data: {
        id: "sub-new",
        email: "new@example.com",
        referral_code: "new123",
        position: 3,
      },
      error: null,
    });
    // referral count (head) on admin after insert
    mockAdminSupabase.__queue.push({
      data: null,
      error: null,
      count: 0,
    });

    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "wl-1",
        email: "new@example.com",
        referral_code: "ref123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe("sub-new");
  });

  it("rejects invalid referral code", async () => {
    pushCapCheck();
    // referral lookup on admin → not found
    mockAdminSupabase.__queue.push({ data: null, error: null });

    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "wl-1",
        email: "new@example.com",
        referral_code: "nonexistent",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rejects cross-waitlist referral code", async () => {
    pushCapCheck();
    // referral lookup on admin → wrong waitlist
    mockAdminSupabase.__queue.push({
      data: { id: "referrer-1", waitlist_id: "wl-other" },
      error: null,
    });

    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "wl-1",
        email: "new@example.com",
        referral_code: "ref123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("handles self-referral by nullifying referrer_id", async () => {
    pushCapCheck();
    // referral lookup on admin — same subscriber id will be inserted below
    mockAdminSupabase.__queue.push({
      data: { id: "sub-1", waitlist_id: "wl-1" },
      error: null,
    });
    // insert returns same id → self-referral detected
    mockAdminSupabase.__queue.push({
      data: {
        id: "sub-1",
        email: "self@example.com",
        referral_code: "self123",
        position: 1,
      },
      error: null,
    });
    // update referrer_id=null on admin
    mockAdminSupabase.__queue.push({
      data: null,
      error: null,
    });

    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "wl-1",
        email: "self@example.com",
        referral_code: "self123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});

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

describe("POST /api/subscribers — referral tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores referrer_id on valid referral", async () => {
    mockSupabase.__queue.push(
      { data: { id: "referrer-1", waitlist_id: "wl-1" }, error: null },
      {
        data: {
          id: "sub-new",
          email: "new@example.com",
          referral_code: "new123",
          position: 3,
        },
        error: null,
      }
    );

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
    mockSupabase.__queue.push({ data: null, error: null });

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
    mockSupabase.__queue.push({
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
    mockSupabase.__queue.push(
      { data: { id: "sub-1", waitlist_id: "wl-1" }, error: null },
      {
        data: {
          id: "sub-1",
          email: "self@example.com",
          referral_code: "self123",
          position: 1,
        },
        error: null,
      }
    );

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

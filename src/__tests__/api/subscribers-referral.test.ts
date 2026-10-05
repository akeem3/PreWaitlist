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

// Mock email utilities — distinct footer markers so tests can prove which
// tier's footer actually shipped (19.1 AC2/AC7).
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true }),
  buildEmailFooter: vi.fn().mockReturnValue("<pro-footer>"),
  buildFreeEmailFooter: vi.fn().mockReturnValue("<free-footer>"),
  isUnsubscribed: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/bounces", () => ({
  isEmailBounced: vi.fn().mockResolvedValue(false),
}));

import { POST } from "../../app/api/subscribers/route";
import { sendEmail } from "@/lib/email";
import { getPositionUpdate } from "@/lib/positions";

const mockedGetPositionUpdate = vi.mocked(getPositionUpdate);
const mockedSendEmail = vi.mocked(sendEmail);

function pushCapCheck() {
  mockSupabase.__queue.push({
    data: {
      subscriber_count: 10,
      founder_profiles: { tier: "free" },
    },
    error: null,
  });
}

// Phase 6: form-load timestamp (>=2s old) required by the route
const FORM_TS = Date.now() - 5000;

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
        ts: FORM_TS,
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
        ts: FORM_TS,
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
        ts: FORM_TS,
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
        ts: FORM_TS,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  // --- Moved-up trigger (Story 12.2 AC1-AC4; Prompt #8 investigation) ---

  const movedUpReferrerUpdate = {
    subscriber_id: "referrer-1",
    old_position: 7,
    new_position: 5,
    spots_moved: 2,
  };

  function pushMovedUpReferralQueue() {
    // referrer lookup (admin)
    mockAdminSupabase.__queue.push({
      data: { id: "referrer-1", waitlist_id: "wl-1" },
      error: null,
    });
    // insert new subscriber (temp position)
    mockAdminSupabase.__queue.push({
      data: {
        id: "sub-new",
        email: "new@example.com",
        referral_code: "new123",
        position: 9,
      },
      error: null,
    });
    // referral count head for milestones
    mockAdminSupabase.__queue.push({
      data: null,
      error: null,
      count: 3,
    });
    // confirmation IIFE waitlist select → null → early return (1 dequeue)
    mockAdminSupabase.__queue.push({ data: null, error: null });
    // moved-up IIFE: referrer select
    mockAdminSupabase.__queue.push({
      data: {
        email: "referrer@example.com",
        referral_code: "REF123",
        display_name: null,
      },
      error: null,
    });
    // 90% cap-warning IIFE (registered after moved-up) dequeues at
    // registration → null → early return
    mockAdminSupabase.__queue.push({ data: null, error: null });
    // moved-up IIFE: waitlist select (has confirmation customization → must NOT be used)
    mockAdminSupabase.__queue.push({
      data: {
        product_name: "Acme",
        headline: null,
        subdomain: "acme",
        sender_name: null,
        sending_domain: null,
        business_address: null,
        email_subject: "CUSTOM CONFIRMATION",
        email_body: "Custom confirmation body",
      },
      error: null,
    });
    // moved-up IIFE: milestone_rewards
    mockAdminSupabase.__queue.push({
      data: [{ tier_referrals: 3, reward_label: "Early access" }],
      error: null,
    });
    // moved-up IIFE: founder tier
    mockAdminSupabase.__queue.push({
      data: { founder_profiles: [{ tier: "free" }] },
      error: null,
    });
  }

  async function postReferralSignup() {
    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "wl-1",
        email: "new@example.com",
        referral_code: "ref123",
        ts: FORM_TS,
      }),
    });
    const response = await POST(request);
    // flush microtasks so the synchronous after() IIFEs complete
    await new Promise((resolve) => setTimeout(resolve, 0));
    return response;
  }

  it("sends moved-up email to referrer when referrer's rank improves", async () => {
    pushCapCheck();
    pushMovedUpReferralQueue();
    mockedGetPositionUpdate.mockImplementation((_updates, id) =>
      id === "referrer-1" ? movedUpReferrerUpdate : null
    );

    const response = await postReferralSignup();
    expect(response.status).toBe(201);

    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    const sendArgs = mockedSendEmail.mock.calls[0][0];
    expect(sendArgs.to).toBe("referrer@example.com");
    expect(sendArgs.subject).toBe("🎉 You moved up 2 spots!");
    // F2: confirmation customization must never leak into the moved-up template
    expect(sendArgs.subject).not.toBe("CUSTOM CONFIRMATION");
  });

  it("does not send moved-up email when referrer's spots_moved is 0", async () => {
    pushCapCheck();
    // referrer lookup + insert + count + confirmation waitlist only
    mockAdminSupabase.__queue.push({
      data: { id: "referrer-1", waitlist_id: "wl-1" },
      error: null,
    });
    mockAdminSupabase.__queue.push({
      data: {
        id: "sub-new",
        email: "new@example.com",
        referral_code: "new123",
        position: 9,
      },
      error: null,
    });
    mockAdminSupabase.__queue.push({ data: null, error: null, count: 3 });
    mockAdminSupabase.__queue.push({ data: null, error: null });
    mockedGetPositionUpdate.mockImplementation((_updates, id) =>
      id === "referrer-1"
        ? { ...movedUpReferrerUpdate, spots_moved: 0, new_position: 7 }
        : null
    );

    const response = await postReferralSignup();
    expect(response.status).toBe(201);
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it("does not send moved-up email when signup has no referrer", async () => {
    pushCapCheck();
    // no referral lookup: insert only
    mockAdminSupabase.__queue.push({
      data: {
        id: "sub-direct",
        email: "direct@example.com",
        referral_code: "dir123",
        position: 9,
      },
      error: null,
    });
    // confirmation IIFE waitlist → null
    mockAdminSupabase.__queue.push({ data: null, error: null });
    mockedGetPositionUpdate.mockImplementation(() => null);

    const request = new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "wl-1",
        email: "direct@example.com",
        ts: FORM_TS,
      }),
    });
    const response = await POST(request);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(response.status).toBe(201);
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  // --- Sender identity fallback (2.5 rule B) ---

  function pushMovedUpReferralQueueWithSender(
    tier: string,
    senderName: string | null,
    sendingDomain: string | null,
    // 19.1 AC7: "object" mirrors the production PostgREST to-one embed shape;
    // default "array" exercises the defensive branch (legacy test fixture).
    embedShape: "object" | "array" = "array"
  ) {
    mockAdminSupabase.__queue.push({
      data: { id: "referrer-1", waitlist_id: "wl-1" },
      error: null,
    });
    mockAdminSupabase.__queue.push({
      data: {
        id: "sub-new",
        email: "new@example.com",
        referral_code: "new123",
        position: 9,
      },
      error: null,
    });
    mockAdminSupabase.__queue.push({
      data: null,
      error: null,
      count: 3,
    });
    mockAdminSupabase.__queue.push({ data: null, error: null });
    mockAdminSupabase.__queue.push({
      data: {
        email: "referrer@example.com",
        referral_code: "REF123",
        display_name: null,
      },
      error: null,
    });
    mockAdminSupabase.__queue.push({ data: null, error: null });
    mockAdminSupabase.__queue.push({
      data: {
        product_name: "Acme",
        headline: null,
        subdomain: "acme",
        sender_name: senderName,
        sending_domain: sendingDomain,
        business_address: null,
        email_subject: null,
        email_body: null,
      },
      error: null,
    });
    mockAdminSupabase.__queue.push({
      data: [{ tier_referrals: 3, reward_label: "Early access" }],
      error: null,
    });
    mockAdminSupabase.__queue.push({
      data: {
        founder_profiles: embedShape === "object" ? { tier } : [{ tier }],
      },
      error: null,
    });
  }

  it("passes custom sender identity through on Pro for moved-up email", async () => {
    pushCapCheck();
    pushMovedUpReferralQueueWithSender("pro", "Ada", "ada.com");
    mockedGetPositionUpdate.mockImplementation((_updates, id) =>
      id === "referrer-1" ? movedUpReferrerUpdate : null
    );

    const response = await postReferralSignup();
    expect(response.status).toBe(201);

    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    expect(mockedSendEmail.mock.calls[0][0]).toMatchObject({
      senderName: "Ada",
      sendingDomain: "ada.com",
    });
  });

  it("falls back to default sender on Free for moved-up email", async () => {
    pushCapCheck();
    pushMovedUpReferralQueueWithSender("free", "Ada", "ada.com");
    mockedGetPositionUpdate.mockImplementation((_updates, id) =>
      id === "referrer-1" ? movedUpReferrerUpdate : null
    );

    const response = await postReferralSignup();
    expect(response.status).toBe(201);

    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    expect(mockedSendEmail.mock.calls[0][0]).toMatchObject({
      senderName: null,
      sendingDomain: null,
    });
  });

  // --- 19.1 AC2/AC7: moved-up tier-resolution regression lock ---

  it("19.1 AC2/AC7: object-shaped embed (production) resolves pro → non-free footer on moved-up", async () => {
    pushCapCheck();
    pushMovedUpReferralQueueWithSender("pro", "Ada", "ada.com", "object");
    mockedGetPositionUpdate.mockImplementation((_updates, id) =>
      id === "referrer-1" ? movedUpReferrerUpdate : null
    );

    const response = await postReferralSignup();
    expect(response.status).toBe(201);

    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    const html = mockedSendEmail.mock.calls[0][0]?.html;
    expect(html).toContain("<pro-footer>");
    expect(html).not.toContain("<free-footer>");
  });

  it("19.1 AC2: free tier gets the Powered-by footer on moved-up (iff tier is free)", async () => {
    pushCapCheck();
    pushMovedUpReferralQueueWithSender("free", null, null, "object");
    mockedGetPositionUpdate.mockImplementation((_updates, id) =>
      id === "referrer-1" ? movedUpReferrerUpdate : null
    );

    const response = await postReferralSignup();
    expect(response.status).toBe(201);

    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    const html = mockedSendEmail.mock.calls[0][0]?.html;
    expect(html).toContain("<free-footer>");
    expect(html).not.toContain("<pro-footer>");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

process.env.UNSUBSCRIBE_SECRET = "test-secret-key-for-unit-tests";

const { batchSend, isEmailBouncedMock } = vi.hoisted(() => ({
  batchSend: vi.fn(),
  isEmailBouncedMock: vi.fn(),
}));

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

const mockAdminSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminSupabase,
}));

vi.mock("@/lib/resend", () => ({
  resend: { batch: { send: batchSend } },
}));

vi.mock("@/lib/bounces", () => ({
  isEmailBounced: isEmailBouncedMock,
}));

import { POST } from "../../app/api/updates/route";

const VALID_BODY = "Hello everyone, we just shipped a big update!";

const PROF_PRO = { data: { tier: "pro" }, error: null };
const PROF_FREE = { data: { tier: "free" }, error: null };

function waitlistRow(id: string) {
  return {
    id,
    subdomain: "acme",
    name: "Acme",
    product_name: "Acme",
    headline: "Join the Acme waitlist",
    sender_name: null,
    sending_domain: null,
    business_address: null,
  };
}

const INSERT_OK = {
  data: { id: "upd-1", created_at: "2026-09-28T00:00:00Z" },
  error: null,
};

function subscriber(
  i: number,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id: `sub-${i}`,
    email: `user${i}@example.com`,
    unsubscribed_at: null,
    ...overrides,
  };
}

function makeSubscribers(n: number): Record<string, unknown>[] {
  return Array.from({ length: n }, (_, i) => subscriber(i));
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/updates", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function sentAtUpdateCount(): number {
  return mockSupabase.__calls.filter(
    (c) =>
      c.method === "update" &&
      (c.args[0] as { sent_at?: string }).sent_at !== undefined
  ).length;
}

describe("POST /api/updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
    mockAdminSupabase.__queue.length = 0;
    mockAdminSupabase.__calls.length = 0;
    batchSend.mockResolvedValue({ data: { id: "batch-1" }, error: null });
    isEmailBouncedMock.mockResolvedValue(false);
  });

  describe("AC1 — auth, tier, validation, scoping", () => {
    it("returns 401 when unauthenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const response = await POST(makeRequest({ body: VALID_BODY }));

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 403 for free tier", async () => {
      mockSupabase.__queue.push(PROF_FREE);

      const response = await POST(makeRequest({ body: VALID_BODY }));

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("Pro subscription");
    });

    it("returns 400 when body is under 10 characters", async () => {
      mockSupabase.__queue.push(PROF_PRO);

      const response = await POST(makeRequest({ body: "short" }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("at least 10 characters");
    });

    it("returns 400 when body is empty", async () => {
      mockSupabase.__queue.push(PROF_PRO);

      const response = await POST(makeRequest({ body: "" }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("at least 10 characters");
    });

    it("returns 400 when body exceeds 2000 characters", async () => {
      mockSupabase.__queue.push(PROF_PRO);

      const response = await POST(makeRequest({ body: "x".repeat(2001) }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("under 2000 characters");
    });

    it("returns 400 when founder has no waitlist", async () => {
      mockSupabase.__queue.push(PROF_PRO, { data: [], error: null });

      const response = await POST(makeRequest({ body: VALID_BODY }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("No waitlist found");
    });

    it("returns 400 when multiple waitlists exist and waitlist_id is missing", async () => {
      mockSupabase.__queue.push(PROF_PRO, {
        data: [waitlistRow("wl-1"), waitlistRow("wl-2")],
        error: null,
      });

      const response = await POST(makeRequest({ body: VALID_BODY }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("waitlist_id is required");
    });

    it("scopes insert to the provided waitlist_id when multiple exist", async () => {
      mockSupabase.__queue.push(
        PROF_PRO,
        { data: [waitlistRow("wl-2")], error: null },
        {
          data: { id: "upd-2", created_at: "2026-09-28T00:00:00Z" },
          error: null,
        },
        { data: [subscriber(0)], error: null },
        { data: null, error: null }
      );

      const response = await POST(
        makeRequest({ body: VALID_BODY, waitlist_id: "wl-2" })
      );

      expect(response.status).toBe(201);
      const insertCalls = mockSupabase.__calls.filter(
        (c) => c.method === "insert"
      );
      expect(insertCalls).toHaveLength(1);
      expect(
        (insertCalls[0].args[0] as { waitlist_id: string }).waitlist_id
      ).toBe("wl-2");
    });

    it("defaults to the single waitlist when waitlist_id is omitted", async () => {
      mockSupabase.__queue.push(
        PROF_PRO,
        { data: [waitlistRow("wl-1")], error: null },
        INSERT_OK,
        { data: [subscriber(0)], error: null },
        { data: null, error: null }
      );

      const response = await POST(makeRequest({ body: VALID_BODY }));

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.emailSent).toBe(true);
      const insertCalls = mockSupabase.__calls.filter(
        (c) => c.method === "insert"
      );
      expect(
        (insertCalls[0].args[0] as { waitlist_id: string }).waitlist_id
      ).toBe("wl-1");
    });
  });

  describe("AC2 — batch chunking", () => {
    it("splits 250 subscribers into 3 batches of at most 100", async () => {
      mockSupabase.__queue.push(
        PROF_PRO,
        { data: [waitlistRow("wl-1")], error: null },
        INSERT_OK,
        { data: makeSubscribers(250), error: null },
        { data: null, error: null }
      );

      const response = await POST(makeRequest({ body: VALID_BODY }));

      expect(response.status).toBe(201);
      expect(batchSend).toHaveBeenCalledTimes(3);
      const sizes = batchSend.mock.calls.map((c) => (c[0] as unknown[]).length);
      expect(sizes).toEqual([100, 100, 50]);
      for (const size of sizes) {
        expect(size).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("AC3 — recipient suppression", () => {
    it("excludes unsubscribed and bounced subscribers from the batch", async () => {
      isEmailBouncedMock.mockImplementation(
        async (_client, _waitlistId, email) => email === "bounced@example.com"
      );
      mockSupabase.__queue.push(
        PROF_PRO,
        { data: [waitlistRow("wl-1")], error: null },
        INSERT_OK,
        {
          data: [
            subscriber(0),
            subscriber(1, {
              unsubscribed_at: "2026-09-01T00:00:00Z",
            }),
            subscriber(2, { email: "bounced@example.com" }),
          ],
          error: null,
        },
        { data: null, error: null }
      );

      const response = await POST(makeRequest({ body: VALID_BODY }));

      expect(response.status).toBe(201);
      expect(batchSend).toHaveBeenCalledTimes(1);
      const sent = (batchSend.mock.calls[0][0] as { to: string }[]).map(
        (m) => m.to
      );
      expect(sent).toEqual(["user0@example.com"]);
      expect(sent).not.toContain("user1@example.com");
      expect(sent).not.toContain("bounced@example.com");
    });
  });

  describe("AC4 — HTML escaping", () => {
    it("escapes HTML in the html payload and keeps the raw string in text", async () => {
      const body = `Hello <script>alert("x")</script> & more friends`;
      mockSupabase.__queue.push(
        PROF_PRO,
        { data: [waitlistRow("wl-1")], error: null },
        INSERT_OK,
        { data: [subscriber(0)], error: null },
        { data: null, error: null }
      );

      const response = await POST(makeRequest({ body }));

      expect(response.status).toBe(201);
      expect(batchSend).toHaveBeenCalledTimes(1);
      const payload = (
        batchSend.mock.calls[0][0] as { html: string; text: string }[]
      )[0];
      expect(payload.html).toContain("&lt;script&gt;");
      expect(payload.html).toContain("&amp;");
      expect(payload.html).not.toContain("<script>");
      expect(payload.text).toContain('<script>alert("x")</script>');
    });
  });

  describe("AC5 — response honesty", () => {
    it("updates sent_at and reports emailSent true on success", async () => {
      mockSupabase.__queue.push(
        PROF_PRO,
        { data: [waitlistRow("wl-1")], error: null },
        INSERT_OK,
        { data: [subscriber(0)], error: null },
        { data: null, error: null }
      );

      const response = await POST(makeRequest({ body: VALID_BODY }));

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.emailSent).toBe(true);
      expect(data.emailError).toBeNull();
      expect(sentAtUpdateCount()).toBe(1);
    });

    it("reports emailSent false without sent_at when the batch send fails", async () => {
      batchSend.mockResolvedValue({
        data: null,
        error: { message: "Resend unavailable" },
      });
      mockSupabase.__queue.push(
        PROF_PRO,
        { data: [waitlistRow("wl-1")], error: null },
        INSERT_OK,
        { data: [subscriber(0)], error: null }
      );

      const response = await POST(makeRequest({ body: VALID_BODY }));

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.emailSent).toBe(false);
      expect(data.emailError).toBe("Resend unavailable");
      expect(sentAtUpdateCount()).toBe(0);
    });

    it("reports emailSent false without sent_at when batch.send throws", async () => {
      batchSend.mockRejectedValue(new Error("Connection reset"));
      mockSupabase.__queue.push(
        PROF_PRO,
        { data: [waitlistRow("wl-1")], error: null },
        INSERT_OK,
        { data: [subscriber(0)], error: null }
      );

      const response = await POST(makeRequest({ body: VALID_BODY }));

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.emailSent).toBe(false);
      expect(data.emailError).toBe("Connection reset");
      expect(sentAtUpdateCount()).toBe(0);
    });

    it("reports emailSent false with No eligible recipients when everyone is suppressed", async () => {
      mockSupabase.__queue.push(
        PROF_PRO,
        { data: [waitlistRow("wl-1")], error: null },
        INSERT_OK,
        {
          data: [
            subscriber(0, { unsubscribed_at: "2026-09-01T00:00:00Z" }),
            subscriber(1, { unsubscribed_at: "2026-09-02T00:00:00Z" }),
          ],
          error: null,
        }
      );

      const response = await POST(makeRequest({ body: VALID_BODY }));

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.emailSent).toBe(false);
      expect(data.emailError).toBe("No eligible recipients");
      expect(batchSend).not.toHaveBeenCalled();
      expect(sentAtUpdateCount()).toBe(0);
    });

    it("D4: reports Failed to load subscribers when the subscriber read errors", async () => {
      mockSupabase.__queue.push(
        PROF_PRO,
        { data: [waitlistRow("wl-1")], error: null },
        INSERT_OK,
        { data: null, error: { message: "read boom" } }
      );

      const response = await POST(makeRequest({ body: VALID_BODY }));

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.emailSent).toBe(false);
      expect(data.emailError).toBe("Failed to load subscribers");
      // Must NOT masquerade as an empty list
      expect(data.emailError).not.toBe("No eligible recipients");
      expect(batchSend).not.toHaveBeenCalled();
      expect(sentAtUpdateCount()).toBe(0);
    });

    it("D9iii: returns 400 for a non-string body instead of crashing", async () => {
      mockSupabase.__queue.push(PROF_PRO);

      const response = await POST(makeRequest({ body: 12345 }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Body must be at least 10 characters");
    });
  });
});

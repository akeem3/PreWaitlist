import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

process.env.UNSUBSCRIBE_SECRET = "test-secret-key-for-unit-tests";

const { batchSend } = vi.hoisted(() => ({ batchSend: vi.fn() }));

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

import { POST } from "../../app/api/dashboard/broadcast/route";

const PROF_PRO = { data: { tier: "pro" }, error: null };
const PROF_FREE = { data: { tier: "free" }, error: null };

function waitlistRow(id = "wl-1") {
  return {
    id,
    product_name: "Acme",
    headline: "Join Acme",
    subdomain: "acme",
    sender_name: null,
    sending_domain: null,
    business_address: null,
  };
}

function sub(i: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `sub-${i}`,
    email: `user${i}@example.com`,
    referral_code: `ref${i}`,
    unsubscribed_at: null,
    ...overrides,
  };
}

function makeSubs(n: number) {
  return Array.from({ length: n }, (_, i) => sub(i));
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/dashboard/broadcast", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function primeHappy(subs: Record<string, unknown>[], bounced: unknown[] = []) {
  mockSupabase.__queue.push(
    PROF_PRO,
    { data: waitlistRow(), error: null },
    { data: subs, error: null },
    { data: null, error: null } // broadcasts insert
  );
  mockAdminSupabase.__queue.push({ data: bounced, error: null });
}

const VALID = {
  subject: "Launch day",
  body: "<p>We are live!</p>",
  segment: "all",
  waitlist_id: "wl-1",
};

describe("POST /api/dashboard/broadcast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
    mockAdminSupabase.__queue.length = 0;
    mockAdminSupabase.__calls.length = 0;
    batchSend.mockResolvedValue({ data: { id: "batch-1" }, error: null });
  });

  it("returns 401 when unauthenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(401);
  });

  it("returns 403 for free tier", async () => {
    mockSupabase.__queue.push(PROF_FREE);

    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Pro subscription");
  });

  it("returns 400 when waitlist_id is missing", async () => {
    mockSupabase.__queue.push(PROF_PRO);

    const { subject, body, segment } = VALID;
    const res = await POST(makeRequest({ subject, body, segment }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("waitlist_id");
  });

  it.each(["hot ", undefined])(
    "rejects invalid broadcast segment %s before looking up a waitlist",
    async (segment) => {
      mockSupabase.__queue.push(PROF_PRO);
      const body = {
        ...VALID,
        segment,
      };

      const res = await POST(makeRequest(body));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: "Invalid segment. Choose all, hot + warm, or cold.",
      });
      expect(batchSend).not.toHaveBeenCalled();
      expect(mockSupabase.__queue).toHaveLength(0);
    }
  );

  it("returns 400 when subject is empty", async () => {
    mockSupabase.__queue.push(PROF_PRO);
    const res = await POST(makeRequest({ ...VALID, subject: "   " }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is empty", async () => {
    mockSupabase.__queue.push(PROF_PRO);
    const res = await POST(makeRequest({ ...VALID, body: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when subject exceeds 200 chars", async () => {
    mockSupabase.__queue.push(PROF_PRO);
    const res = await POST(makeRequest({ ...VALID, subject: "x".repeat(201) }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when body exceeds 10000 chars", async () => {
    mockSupabase.__queue.push(PROF_PRO);
    const res = await POST(makeRequest({ ...VALID, body: "x".repeat(10001) }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when waitlist not found or not owner", async () => {
    mockSupabase.__queue.push(PROF_PRO, { data: null, error: null });
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(404);
  });

  it("returns 400 when no subscribers", async () => {
    mockSupabase.__queue.push(
      PROF_PRO,
      { data: waitlistRow(), error: null },
      { data: [], error: null }
    );
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("No subscribers");
  });

  it("returns 400 when all subscribers are excluded (unsub + bounced)", async () => {
    mockSupabase.__queue.push(
      PROF_PRO,
      { data: waitlistRow(), error: null },
      {
        data: [
          sub(0, { unsubscribed_at: "2026-01-01T00:00:00Z" }),
          sub(1, { email: "bounced@example.com" }),
        ],
        error: null,
      }
    );
    mockAdminSupabase.__queue.push({
      data: [
        {
          email: "bounced@example.com",
          bounce_type: "hard",
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    });

    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("eligible");
  });

  it("happy path: sends via batch with waitlist_id tag and idempotency key", async () => {
    primeHappy(makeSubs(3));

    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.recipient_count).toBe(3);

    expect(batchSend).toHaveBeenCalledTimes(1);
    const emails = batchSend.mock.calls[0][0] as Record<string, unknown>[];
    expect(emails).toHaveLength(3);

    // waitlist_id tag present on every payload (B1 regression lock)
    for (const email of emails) {
      const tags = email.tags as { name: string; value: string }[];
      expect(
        tags.some((t) => t.name === "waitlist_id" && t.value === "wl-1")
      ).toBe(true);
    }

    // idempotency key present, unique per request
    const opts = batchSend.mock.calls[0][1] as { idempotencyKey: string };
    expect(opts.idempotencyKey).toContain("broadcast/wl-1/");
    expect(opts.idempotencyKey).toContain("chunk-0");
    expect(opts.idempotencyKey.length).toBeLessThanOrEqual(256);
  });

  it("chunks 250 subscribers into 3 batch calls of ≤100", async () => {
    primeHappy(makeSubs(250));

    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(200);

    expect(batchSend).toHaveBeenCalledTimes(3);
    const sizes = batchSend.mock.calls.map((c) => (c[0] as unknown[]).length);
    expect(sizes).toEqual([100, 100, 50]);
    for (const size of sizes) {
      expect(size).toBeLessThanOrEqual(100);
    }

    // distinct idempotency key per chunk
    const keys = batchSend.mock.calls.map(
      (c) => (c[1] as { idempotencyKey: string }).idempotencyKey
    );
    expect(new Set(keys).size).toBe(3);
  });

  it("returns 502 with ok:false when all batches fail (B4)", async () => {
    batchSend.mockResolvedValue({
      data: null,
      error: { message: "Resend down" },
    });
    primeHappy(makeSubs(5));

    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.recipient_count).toBe(0);
    expect(data.errors.length).toBeGreaterThan(0);
  });

  it("excludes unsubscribed and bounced subscribers from recipients", async () => {
    mockSupabase.__queue.push(
      PROF_PRO,
      { data: waitlistRow(), error: null },
      {
        data: [
          sub(0),
          sub(1, { unsubscribed_at: "2026-01-01T00:00:00Z" }),
          sub(2, { email: "bounced@example.com" }),
        ],
        error: null,
      },
      { data: null, error: null }
    );
    mockAdminSupabase.__queue.push({
      data: [
        {
          email: "bounced@example.com",
          bounce_type: "hard",
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    });

    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(200);
    expect(batchSend).toHaveBeenCalledTimes(1);
    const tos = (batchSend.mock.calls[0][0] as { to: string[] }[]).map(
      (m) => m.to[0]
    );
    expect(tos).toEqual(["user0@example.com"]);
    expect(tos).not.toContain("user1@example.com");
    expect(tos).not.toContain("bounced@example.com");
  });

  it("applies warmth_score filter for segment=cold", async () => {
    mockSupabase.__queue.push(
      PROF_PRO,
      { data: waitlistRow(), error: null },
      {
        data: [sub(0, { warmth_score: "cold" })],
        error: null,
      },
      { data: null, error: null }
    );
    mockAdminSupabase.__queue.push({ data: [], error: null });

    const res = await POST(makeRequest({ ...VALID, segment: "cold" }));
    expect(res.status).toBe(200);
    // Mock doesn't execute filters — assert the route chained the filter.
    const warmthFilters = mockSupabase.__calls.filter(
      (c) => c.method === "eq" && c.args[0] === "warmth_score"
    );
    expect(warmthFilters.some((c) => c.args[1] === "cold")).toBe(true);
    expect(batchSend).toHaveBeenCalledTimes(1);
  });

  it("sanitizes script tags from the body before send", async () => {
    primeHappy([sub(0)]);

    const res = await POST(
      makeRequest({ ...VALID, body: "<p>Hi</p><script>alert(1)</script>" })
    );
    expect(res.status).toBe(200);
    const emails = batchSend.mock.calls[0][0] as { html: string }[];
    expect(emails[0].html).toContain("<p>Hi</p>");
    expect(emails[0].html).not.toContain("<script>");
  });

  it("returns 500 when UNSUBSCRIBE_SECRET is missing (fail-fast)", async () => {
    const original = process.env.UNSUBSCRIBE_SECRET;
    delete process.env.UNSUBSCRIBE_SECRET;
    try {
      primeHappy(makeSubs(2));
      const res = await POST(makeRequest(VALID));
      expect(res.status).toBe(500);
      expect(batchSend).not.toHaveBeenCalled();
    } finally {
      process.env.UNSUBSCRIBE_SECRET = original;
    }
  });

  // Prompt #8 (2026-10-10): HTML email shell + optional CTA link.
  describe("cta_url (optional per-broadcast link)", () => {
    it("returns 400 'Invalid link URL' for a javascript: URL", async () => {
      mockSupabase.__queue.push(PROF_PRO);
      const res = await POST(
        makeRequest({ ...VALID, cta_url: "javascript:alert(1)" })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid link URL");
      // Validated before any waitlist/subscriber read — only the profile
      // select was consumed.
      expect(batchSend).not.toHaveBeenCalled();
    });

    it("returns 400 for a non-URL string", async () => {
      mockSupabase.__queue.push(PROF_PRO);
      const res = await POST(makeRequest({ ...VALID, cta_url: "not a url" }));
      expect(res.status).toBe(400);
    });

    it("renders the approved CTA button when cta_url is valid", async () => {
      primeHappy(makeSubs(1));

      const res = await POST(
        makeRequest({ ...VALID, cta_url: "https://example.com/launch" })
      );
      expect(res.status).toBe(200);

      const emails = batchSend.mock.calls[0][0] as { html: string }[];
      expect(emails[0].html).toContain('href="https://example.com/launch"');
      expect(emails[0].html).toContain("Read more");
      expect(emails[0].html).toContain("#0F7A5E");
      // CTA button from the shared shell (unique padding block).
      expect(emails[0].html).toContain("padding: 13px 28px");
      // No inline text-link (the removed shape appended " →" after the label).
      expect(emails[0].html).not.toContain("Read more →");
    });

    it("omits the CTA link entirely when cta_url is absent", async () => {
      primeHappy(makeSubs(1));

      const res = await POST(makeRequest(VALID));
      expect(res.status).toBe(200);
      const emails = batchSend.mock.calls[0][0] as { html: string }[];
      expect(emails[0].html).not.toContain("Read more");
    });
  });

  describe("HTML email shell (replaces the old bare <div>)", () => {
    it("sends a full document with doctype, preheader and brand header", async () => {
      primeHappy(makeSubs(1));

      const res = await POST(makeRequest(VALID));
      expect(res.status).toBe(200);
      const emails = batchSend.mock.calls[0][0] as {
        html: string;
        text: string;
      }[];
      const html = emails[0].html;

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain('role="presentation"');
      expect(html).toContain("max-width: 600px");
      // Brand header from waitlist data (product_name; CSS uppercases visually).
      expect(html).toContain("Acme");
      // Derived preheader (hidden preview text).
      expect(html).toContain("display: none; max-height: 0");
      // Plain-text part present (text-forward deliverability).
      expect(emails[0].text).toContain("We are live!");
      expect(emails[0].text).not.toContain("<p>");
    });

    it("escapes the founder body but keeps intentional markup (17.5)", async () => {
      primeHappy([sub(0)]);

      const res = await POST(
        makeRequest({ ...VALID, body: "<strong>Hi</strong><script>x</script>" })
      );
      expect(res.status).toBe(200);
      const emails = batchSend.mock.calls[0][0] as { html: string }[];
      expect(emails[0].html).toContain("<strong>Hi</strong>");
      expect(emails[0].html).not.toContain("<script>");
      // Still wrapped in the shell, not bare.
      expect(emails[0].html).toContain("<!DOCTYPE html>");
    });
  });

  // Prompt #8 spam follow-up (2026-10-10): hygiene locks — trimmed subject
  // on the wire and in history, and a multipart text part that is never empty.
  describe("subject + plain-text hardening", () => {
    it("sends the trimmed subject, not the raw input", async () => {
      primeHappy([sub(0)]);

      const res = await POST(
        makeRequest({ ...VALID, subject: "  Launch day  " })
      );
      expect(res.status).toBe(200);
      const emails = batchSend.mock.calls[0][0] as { subject: string }[];
      expect(emails[0].subject).toBe("Launch day");
    });

    it("stores the trimmed subject in broadcast history", async () => {
      primeHappy([sub(0)]);

      const res = await POST(
        makeRequest({ ...VALID, subject: "  Launch day  " })
      );
      expect(res.status).toBe(200);
      const insertCall = mockSupabase.__calls.find(
        (c) => c.method === "insert"
      );
      expect(insertCall).toBeDefined();
      const row = insertCall!.args[0] as { subject?: string };
      expect(row.subject).toBe("Launch day");
    });

    it("falls back to the brand name when the body strips to an empty text part", async () => {
      primeHappy([sub(0)]);

      const res = await POST(makeRequest({ ...VALID, body: "<div> </div>" }));
      expect(res.status).toBe(200);
      const emails = batchSend.mock.calls[0][0] as {
        text?: string;
        subject: string;
      }[];
      expect(emails[0].text).toBe("Acme");
      expect(emails[0].text?.length).toBeGreaterThan(0);
    });
  });

  // Prompt #8 (2026-10-11): per-recipient personalization + Primary-parity
  // body wrapper (white-space: pre-wrap) + inline text-link CTA.
  describe("personalization + body wrapper (Primary parity)", () => {
    it("interpolates {{first_name}} from display_name in subject and body", async () => {
      primeHappy([sub(0, { display_name: "Alice Smith" })]);

      const res = await POST(
        makeRequest({
          ...VALID,
          subject: "Hello {{first_name}}",
          body: "<p>Hi {{first_name}}, we are live with {{product_name}}!</p>",
        })
      );
      expect(res.status).toBe(200);

      const emails = batchSend.mock.calls[0][0] as {
        subject: string;
        html: string;
        text?: string;
      }[];
      expect(emails[0].subject).toBe("Hello Alice");
      expect(emails[0].html).toContain("Hi Alice");
      expect(emails[0].html).toContain("we are live with Acme!");
      expect(emails[0].text).toContain("Hi Alice");
      // Tokens fully resolved — no leftover braces.
      expect(emails[0].html).not.toContain("{{first_name}}");
      expect(emails[0].html).not.toContain("{{product_name}}");
    });

    it("falls back to 'there' when display_name is null", async () => {
      primeHappy([sub(0, { display_name: null })]);

      const res = await POST(
        makeRequest({
          ...VALID,
          subject: "Hello {{first_name}}",
          body: "<p>Hi {{first_name}}!</p>",
        })
      );
      expect(res.status).toBe(200);

      const emails = batchSend.mock.calls[0][0] as {
        subject: string;
        html: string;
      }[];
      expect(emails[0].subject).toBe("Hello there");
      expect(emails[0].html).toContain("Hi there!");
    });

    it("uses only the first word of a multi-word display_name", async () => {
      primeHappy([sub(0, { display_name: "Alice Marie Smith" })]);

      const res = await POST(
        makeRequest({
          ...VALID,
          body: "<p>Hi {{first_name}}!</p>",
        })
      );
      expect(res.status).toBe(200);
      const emails = batchSend.mock.calls[0][0] as { html: string }[];
      expect(emails[0].html).toContain("Hi Alice!");
    });

    it("escapes HTML in display_name before interpolating into the body", async () => {
      primeHappy([sub(0, { display_name: '<img src=x onerror="alert(1)">' })]);

      const res = await POST(
        makeRequest({
          ...VALID,
          body: "<p>Hi {{first_name}}!</p>",
        })
      );
      expect(res.status).toBe(200);
      const emails = batchSend.mock.calls[0][0] as { html: string }[];
      // Escaped as text — never a live tag.
      expect(emails[0].html).toContain("&lt;img");
      expect(emails[0].html).not.toContain("<img src=x");
      expect(emails[0].html).not.toContain('onerror="alert(1)"');
    });

    it("leaves unknown tokens as-is (house interpolateEmail behavior)", async () => {
      primeHappy([sub(0)]);

      const res = await POST(
        makeRequest({
          ...VALID,
          body: "<p>Hi {{first_name}}, position {{position}}</p>",
        })
      );
      expect(res.status).toBe(200);
      const emails = batchSend.mock.calls[0][0] as { html: string }[];
      // {{first_name}} resolved (fallback "there"), {{position}} untouched.
      expect(emails[0].html).toContain("Hi there");
      expect(emails[0].html).toContain("{{position}}");
    });

    it("wraps the body in white-space: pre-wrap (parity with updates route)", async () => {
      primeHappy([sub(0)]);

      const res = await POST(makeRequest(VALID));
      expect(res.status).toBe(200);
      const emails = batchSend.mock.calls[0][0] as { html: string }[];
      expect(emails[0].html).toContain("white-space: pre-wrap");
      // Wrapped in the same styled <p> the updates route uses.
      expect(emails[0].html).toContain(
        '<p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; color: #4b5563; white-space: pre-wrap;">'
      );
    });

    it("builds unique subjects and html per recipient (different names)", async () => {
      primeHappy([
        sub(0, { display_name: "Alice Smith", email: "alice@example.com" }),
        sub(1, { display_name: "Bob Jones", email: "bob@example.com" }),
      ]);

      const res = await POST(
        makeRequest({
          ...VALID,
          subject: "Hi {{first_name}}",
          body: "<p>Welcome {{first_name}}!</p>",
        })
      );
      expect(res.status).toBe(200);

      const emails = batchSend.mock.calls[0][0] as {
        to: string[];
        subject: string;
        html: string;
      }[];
      expect(emails).toHaveLength(2);
      expect(emails[0].subject).toBe("Hi Alice");
      expect(emails[1].subject).toBe("Hi Bob");
      expect(emails[0].html).toContain("Welcome Alice!");
      expect(emails[1].html).toContain("Welcome Bob!");
      expect(emails[0].html).not.toBe(emails[1].html);
      expect(emails[0].subject).not.toBe(emails[1].subject);
    });
  });
});

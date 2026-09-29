import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const { mockSendEmail, mockGetUserById } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
  mockGetUserById: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mockSendEmail,
}));

import {
  nextMidnightUtc,
  enqueueEmailRetry,
  drainEmailRetryQueue,
  maybeWarnFounderQuota,
} from "@/lib/retry-queue";

function queueRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "q-1",
    waitlist_id: "wl-1",
    subscriber_id: "sub-1",
    to_email: "user@example.com",
    subject: "Hello",
    html: "<p>Hello</p>",
    text_payload: null,
    stream: "transactional",
    sender_name: null,
    product_name: "Acme",
    headline: null,
    sending_domain: null,
    idempotency_key: "confirmation-email/sub-1",
    email_type: "confirmation",
    attempts: 0,
    max_attempts: 3,
    ...overrides,
  };
}

describe("nextMidnightUtc", () => {
  it("returns midnight UTC after the given time", () => {
    expect(nextMidnightUtc(new Date("2026-09-29T12:00:00Z"))).toBe(
      "2026-09-30T00:00:00.000Z"
    );
    expect(nextMidnightUtc(new Date("2026-09-29T23:59:59Z"))).toBe(
      "2026-09-30T00:00:00.000Z"
    );
  });
});

describe("enqueueEmailRetry", () => {
  it("inserts a parked row defaulting to next midnight UTC", async () => {
    const mock = createMockSupabaseClient();
    mock.__queue.push({ data: null, error: null });

    await enqueueEmailRetry(mock as never, {
      waitlist_id: "wl-1",
      subscriber_id: "sub-1",
      to_email: "user@example.com",
      subject: "Hello",
      html: "<p>Hello</p>",
      idempotency_key: "confirmation-email/sub-1",
      email_type: "confirmation",
    });

    const inserts = mock.__calls.filter((c) => c.method === "insert");
    expect(inserts).toHaveLength(1);
    const row = inserts[0].args[0] as Record<string, unknown>;
    expect(row).toMatchObject({
      waitlist_id: "wl-1",
      email_type: "confirmation",
      idempotency_key: "confirmation-email/sub-1",
    });
    expect(typeof row.not_before).toBe("string");
    expect((row.not_before as string).endsWith("T00:00:00.000Z")).toBe(true);
  });
});

describe("drainEmailRetryQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue({ ok: true, id: "email-9" });
  });

  function mockClient() {
    const mock = createMockSupabaseClient();
    mock.__queue.length = 0;
    mock.__calls.length = 0;
    return mock;
  }

  it("sends due rows, deletes them, and logs retried sent events", async () => {
    const mock = mockClient();
    mock.__queue.push(
      { data: [queueRow()], error: null },
      { data: null, error: null },
      { data: null, error: null }
    );

    const result = await drainEmailRetryQueue(mock as never);

    expect(result).toMatchObject({
      processed: 1,
      sent: 1,
      reparked: 0,
      deadLettered: 0,
    });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail.mock.calls[0][0]).toMatchObject({
      to: "user@example.com",
      idempotencyKey: "confirmation-email/sub-1",
    });
    const sentRows = mock.__calls
      .filter((c) => c.method === "insert")
      .map((c) => c.args[0] as Record<string, unknown>);
    expect(sentRows).toHaveLength(1);
    expect(sentRows[0]).toMatchObject({ event_type: "sent" });
    expect((sentRows[0].event_data as Record<string, unknown>).retried).toBe(
      true
    );
  });

  it("re-parks daily-quota failures with bumped attempts", async () => {
    const mock = mockClient();
    mock.__queue.push(
      { data: [queueRow()], error: null },
      { data: null, error: null }
    );
    mockSendEmail.mockResolvedValueOnce({
      ok: false,
      error: "quota out",
      errorKind: "daily_quota",
      errorName: "daily_quota_exceeded",
    });

    const result = await drainEmailRetryQueue(mock as never);

    expect(result).toMatchObject({
      processed: 1,
      sent: 0,
      reparked: 1,
      deadLettered: 0,
    });
    const updates = mock.__calls
      .filter((c) => c.method === "update")
      .map((c) => c.args[0] as Record<string, unknown>);
    expect(updates).toHaveLength(1);
    expect(updates[0].attempts).toBe(1);
    expect(typeof updates[0].not_before).toBe("string");
  });

  it("dead-letters monthly-quota failures immediately", async () => {
    const mock = mockClient();
    mock.__queue.push(
      { data: [queueRow()], error: null },
      { data: null, error: null },
      { data: null, error: null },
      // warn path: today's quota rows lookup → empty → no warning email
      { data: [], error: null }
    );
    mockSendEmail.mockResolvedValueOnce({
      ok: false,
      error: "quota out",
      errorKind: "monthly_quota",
      errorName: "monthly_quota_exceeded",
    });

    const result = await drainEmailRetryQueue(mock as never);

    expect(result).toMatchObject({
      processed: 1,
      sent: 0,
      reparked: 0,
      deadLettered: 1,
    });
    const failedRows = mock.__calls
      .filter((c) => c.method === "insert")
      .map((c) => c.args[0] as Record<string, unknown>);
    expect(failedRows).toHaveLength(1);
    expect(failedRows[0]).toMatchObject({ event_type: "failed" });
  });

  it("dead-letters rows that exhaust max attempts", async () => {
    const mock = mockClient();
    mock.__queue.push(
      { data: [queueRow({ attempts: 2, max_attempts: 3 })], error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: [], error: null }
    );
    mockSendEmail.mockResolvedValueOnce({
      ok: false,
      error: "still out",
      errorKind: "daily_quota",
      errorName: "daily_quota_exceeded",
    });

    const result = await drainEmailRetryQueue(mock as never);

    expect(result).toMatchObject({ deadLettered: 1, reparked: 0 });
    const failedRows = mock.__calls
      .filter((c) => c.method === "insert")
      .map((c) => c.args[0] as Record<string, unknown>);
    expect(failedRows[0]).toMatchObject({ event_type: "failed" });
    expect((failedRows[0].event_data as Record<string, unknown>).retried).toBe(
      true
    );
  });
});

describe("maybeWarnFounderQuota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue({ ok: true, id: "warn-1" });
    mockGetUserById.mockResolvedValue({
      data: { user: { email: "founder@example.com" } },
    });
  });

  function warnClient(quotaRows: unknown[]) {
    const mock = createMockSupabaseClient();
    mock.__queue.length = 0;
    mock.__calls.length = 0;
    (mock as Record<string, unknown>).auth = {
      ...(mock.auth as object),
      admin: { getUserById: mockGetUserById },
    };
    mock.__queue.push(
      { data: quotaRows, error: null },
      { data: { founder_id: "user-1" }, error: null }
    );
    return mock;
  }

  function quotaRow(id: string, warned = false) {
    return {
      id,
      event_data: {
        type: "confirmation",
        error: "quota out",
        error_name: "monthly_quota_exceeded",
        warned,
      },
    };
  }

  it("emails the founder once and marks today's rows warned", async () => {
    const mock = warnClient([quotaRow("e-1"), quotaRow("e-2")]);

    await maybeWarnFounderQuota(mock as never, "wl-1", "monthly");

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail.mock.calls[0][0]).toMatchObject({
      to: "founder@example.com",
      subject: "Your waitlist emails hit the Resend quota",
    });
    const updates = mock.__calls.filter((c) => c.method === "update");
    expect(updates).toHaveLength(2);
    expect(
      (updates[0].args[0] as { event_data: { warned: boolean } }).event_data
        .warned
    ).toBe(true);
  });

  it("skips when today's rows are already warned", async () => {
    const mock = warnClient([quotaRow("e-1", true)]);

    await maybeWarnFounderQuota(mock as never, "wl-1", "monthly");

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips when no quota-classified rows exist", async () => {
    const mock = warnClient([
      { id: "e-9", event_data: { type: "confirmation", error: "bad address" } },
    ]);

    await maybeWarnFounderQuota(mock as never, "wl-1", "daily");

    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSingleSend, mockBatchSend } = vi.hoisted(() => ({
  mockSingleSend: vi.fn(),
  mockBatchSend: vi.fn(),
}));

vi.mock("@/lib/resend", () => ({
  resend: {
    emails: { send: mockSingleSend },
    batch: { send: mockBatchSend },
  },
}));

process.env.UNSUBSCRIBE_SECRET = "test-secret-key-for-unit-tests";

import {
  sendEmail,
  sendBatchWithRetry,
  classifyResendError,
} from "@/lib/email";

const BASE = {
  to: "user@example.com",
  subject: "Hello",
  html: "<p>Hello</p>",
  stream: "transactional" as const,
};

describe("classifyResendError (3.1 taxonomy)", () => {
  it("classifies the three 429 names", () => {
    expect(classifyResendError({ name: "rate_limit_exceeded" })).toBe(
      "rate_limit"
    );
    expect(classifyResendError({ name: "daily_quota_exceeded" })).toBe(
      "daily_quota"
    );
    expect(classifyResendError({ name: "monthly_quota_exceeded" })).toBe(
      "monthly_quota"
    );
  });

  it("treats a bare 429 as transient and everything else as other", () => {
    expect(classifyResendError({ statusCode: 429 })).toBe("rate_limit");
    expect(
      classifyResendError({ name: "validation_error", statusCode: 400 })
    ).toBe("other");
    expect(classifyResendError(null)).toBe("other");
    expect(classifyResendError(undefined)).toBe("other");
  });
});

describe("sendEmail rate-limit retry (3.1a)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retries a rate_limit failure then succeeds with the same idempotency key", async () => {
    mockSingleSend
      .mockResolvedValueOnce({
        data: null,
        error: {
          message: "slow down",
          statusCode: 429,
          name: "rate_limit_exceeded",
        },
      })
      .mockResolvedValueOnce({ data: { id: "email-1" }, error: null });

    const result = await sendEmail({
      ...BASE,
      idempotencyKey: "test/key-1",
      retryDelaysMs: [0],
    });

    expect(result).toMatchObject({ ok: true, id: "email-1" });
    expect(mockSingleSend).toHaveBeenCalledTimes(2);
    expect(mockSingleSend.mock.calls[1][1]).toEqual({
      idempotencyKey: "test/key-1",
    });
  });

  it("gives up after the delays are exhausted, preserving the classification", async () => {
    mockSingleSend.mockResolvedValue({
      data: null,
      error: {
        message: "slow down",
        statusCode: 429,
        name: "rate_limit_exceeded",
      },
    });

    const result = await sendEmail({ ...BASE, retryDelaysMs: [0, 0] });

    expect(result).toMatchObject({
      ok: false,
      errorKind: "rate_limit",
      errorName: "rate_limit_exceeded",
    });
    expect(mockSingleSend).toHaveBeenCalledTimes(3);
  });

  it("never retries quota failures", async () => {
    mockSingleSend.mockResolvedValue({
      data: null,
      error: {
        message: "quota out",
        statusCode: 429,
        name: "daily_quota_exceeded",
      },
    });

    const result = await sendEmail({ ...BASE, retryDelaysMs: [0, 0] });

    expect(result).toMatchObject({ ok: false, errorKind: "daily_quota" });
    expect(mockSingleSend).toHaveBeenCalledTimes(1);
  });
});

describe("sendBatchWithRetry (3.1e)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retries a rate-limited chunk with the same idempotency key", async () => {
    mockBatchSend
      .mockResolvedValueOnce({
        data: null,
        error: {
          message: "slow down",
          statusCode: 429,
          name: "rate_limit_exceeded",
        },
      })
      .mockResolvedValueOnce({ data: [{ id: "b-1" }], error: null });

    const emails = [
      { from: "a@x.com", to: ["b@x.com"], subject: "s", html: "h" },
    ];
    const result = await sendBatchWithRetry(emails, {
      idempotencyKey: "broadcast/wl/r/chunk-0",
      retryDelaysMs: [0],
    });

    expect(result.error).toBeNull();
    expect(mockBatchSend).toHaveBeenCalledTimes(2);
    expect(mockBatchSend.mock.calls[1][1]).toEqual({
      idempotencyKey: "broadcast/wl/r/chunk-0",
    });
  });

  it("returns quota failures immediately without retrying", async () => {
    mockBatchSend.mockResolvedValue({
      data: null,
      error: {
        message: "quota out",
        statusCode: 429,
        name: "monthly_quota_exceeded",
      },
    });

    const result = await sendBatchWithRetry(
      [{ from: "a@x.com", to: ["b@x.com"], subject: "s", html: "h" }],
      { retryDelaysMs: [0, 0] }
    );

    expect(result.error).not.toBeNull();
    expect(mockBatchSend).toHaveBeenCalledTimes(1);
  });
});

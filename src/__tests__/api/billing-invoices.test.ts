import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const { mockList, mockGet, mockGetPdf } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockGet: vi.fn(),
  mockGetPdf: vi.fn(),
}));

vi.mock("@paddle/paddle-node-sdk", () => ({
  Paddle: class {
    transactions = {
      list: mockList,
      get: mockGet,
      getInvoicePDF: mockGetPdf,
    };
  },
}));

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET as listInvoices } from "../../app/api/billing/invoices/route";
import { GET as invoicePdf } from "../../app/api/billing/invoices/[transactionId]/pdf/route";

function txFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "txn-1",
    invoiceNumber: "INV-001",
    billedAt: "2026-09-01T00:00:00Z",
    createdAt: "2026-09-01T00:00:00Z",
    customerId: "cus-1",
    subscriptionId: "sub-1",
    currencyCode: "USD",
    details: { totals: { grandTotal: "15.00", currencyCode: "USD" } },
    ...overrides,
  };
}

function asyncTxs(items: unknown[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of items) yield item;
    },
  };
}

describe("GET /api/billing/invoices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
  });

  it("returns 401 for unauthenticated user", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const res = await listInvoices();
    expect(res.status).toBe(401);
  });

  it("returns an empty list when no subscription is on file", async () => {
    mockSupabase.__queue.push({
      data: { paddle_subscription_id: null },
      error: null,
    });

    const res = await listInvoices();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ invoices: [] });
    expect(mockList).not.toHaveBeenCalled();
  });

  it("maps Paddle transactions to invoice summaries", async () => {
    mockSupabase.__queue.push({
      data: { paddle_subscription_id: "sub-1" },
      error: null,
    });
    mockList.mockReturnValueOnce(
      asyncTxs([
        txFixture(),
        txFixture({ id: "txn-2", invoiceNumber: "INV-002" }),
      ])
    );

    const res = await listInvoices();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invoices).toHaveLength(2);
    expect(body.invoices[0]).toMatchObject({
      id: "txn-1",
      invoiceNumber: "INV-001",
      date: "2026-09-01T00:00:00Z",
      amount: "15.00",
      currency: "USD",
    });
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionId: ["sub-1"], perPage: 20 })
    );
  });

  it("falls back to createdAt / id / null amount when fields are missing", async () => {
    mockSupabase.__queue.push({
      data: { paddle_subscription_id: "sub-1" },
      error: null,
    });
    mockList.mockReturnValueOnce(
      asyncTxs([
        txFixture({ invoiceNumber: null, billedAt: null, details: null }),
      ])
    );

    const res = await listInvoices();
    const body = await res.json();
    expect(body.invoices[0]).toMatchObject({
      id: "txn-1",
      invoiceNumber: "txn-1",
      date: "2026-09-01T00:00:00Z",
      amount: null,
    });
  });

  it("returns 502 when Paddle listing fails", async () => {
    mockSupabase.__queue.push({
      data: { paddle_subscription_id: "sub-1" },
      error: null,
    });
    mockList.mockImplementationOnce(() => {
      throw new Error("paddle down");
    });

    const res = await listInvoices();
    expect(res.status).toBe(502);
  });
});

describe("GET /api/billing/invoices/[transactionId]/pdf", () => {
  const params = Promise.resolve({ transactionId: "txn-1" });

  function pdfRequest() {
    return new NextRequest("http://localhost/api/billing/invoices/txn-1/pdf");
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
  });

  it("returns 401 for unauthenticated user", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const res = await invoicePdf(pdfRequest(), { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when no subscription or customer is on file", async () => {
    mockSupabase.__queue.push({
      data: { paddle_customer_id: null, paddle_subscription_id: null },
      error: null,
    });

    const res = await invoicePdf(pdfRequest(), { params });
    expect(res.status).toBe(404);
  });

  it("returns 404 for another founder's transaction", async () => {
    mockSupabase.__queue.push({
      data: { paddle_customer_id: "cus-1", paddle_subscription_id: "sub-1" },
      error: null,
    });
    mockGet.mockResolvedValueOnce(
      txFixture({ customerId: "cus-other", subscriptionId: "sub-other" })
    );

    const res = await invoicePdf(pdfRequest(), { params });
    expect(res.status).toBe(404);
    expect(mockGetPdf).not.toHaveBeenCalled();
  });

  it("redirects to the Paddle-hosted PDF for the owning founder", async () => {
    mockSupabase.__queue.push({
      data: { paddle_customer_id: "cus-1", paddle_subscription_id: "sub-1" },
      error: null,
    });
    mockGet.mockResolvedValueOnce(txFixture());
    mockGetPdf.mockResolvedValueOnce({ url: "https://paddle.test/inv.pdf" });

    const res = await invoicePdf(pdfRequest(), { params });
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toBe("https://paddle.test/inv.pdf");
  });
});

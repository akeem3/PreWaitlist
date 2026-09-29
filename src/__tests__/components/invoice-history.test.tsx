import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { InvoiceHistory } from "../../../components/billing/invoice-history";

let fetchMock: ReturnType<typeof vi.fn>;

describe("InvoiceHistory", () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the Free upsell without fetching", () => {
    render(<InvoiceHistory isPro={false} />);

    expect(
      screen.getByText(
        "Upgrade to Pro to receive invoices for your subscription."
      )
    ).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders invoice rows with download links", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          invoices: [
            {
              id: "txn-1",
              invoiceNumber: "INV-001",
              date: "2026-09-01T00:00:00Z",
              amount: "15.00",
              currency: "USD",
            },
          ],
        }),
    });

    render(<InvoiceHistory isPro={true} />);

    await waitFor(() => expect(screen.getByText("INV-001")).toBeTruthy());
    expect(screen.getByText("$15.00")).toBeTruthy();
    const download = screen.getByRole("link", { name: "Download" });
    expect(download.getAttribute("href")).toBe(
      "/api/billing/invoices/txn-1/pdf"
    );
  });

  it("shows the empty state when no invoices exist", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ invoices: [] }),
    });

    render(<InvoiceHistory isPro={true} />);

    await waitFor(() =>
      expect(
        screen.getByText(/No invoices yet\. Invoices will appear here/)
      ).toBeTruthy()
    );
  });

  it("shows an error when the invoice list fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502 });

    render(<InvoiceHistory isPro={true} />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(
      screen.getByText("Something went wrong. Please try again.")
    ).toBeTruthy();
  });
});

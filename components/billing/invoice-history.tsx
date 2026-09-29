"use client";

import { useEffect, useState } from "react";

interface InvoiceHistoryProps {
  isPro: boolean;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: string | null;
  currency: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: string | null, currency: string): string {
  if (amount === null) return "—";
  const n = Number(amount);
  if (Number.isNaN(n)) return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(n);
}

export function InvoiceHistory({ isPro }: InvoiceHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isPro) return;

    let cancelled = false;

    fetch("/api/billing/invoices")
      .then((res) => {
        if (!res.ok) throw new Error("invoice list failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
        setError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setInvoices([]);
        setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isPro]);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-h4 font-medium text-foreground">
        Invoice History
      </h3>

      {!isPro ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <p className="text-body-sm text-muted-foreground">
            Upgrade to Pro to receive invoices for your subscription.
          </p>
        </div>
      ) : invoices === null ? (
        <div
          className="h-24 animate-pulse rounded-lg bg-muted/20"
          aria-hidden="true"
        />
      ) : error ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <p role="alert" className="text-body-sm text-destructive">
            Something went wrong. Please try again.
          </p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <p className="text-body-sm text-muted-foreground">
            No invoices yet. Invoices will appear here after your first billing
            cycle.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                  Invoice
                </th>
                <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                  Date
                </th>
                <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">
                  Download
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="py-3 pr-4 text-sm text-foreground">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 pr-4 text-sm text-muted-foreground">
                    {formatDate(inv.date)}
                  </td>
                  <td className="py-3 pr-4 text-sm text-foreground">
                    {formatAmount(inv.amount, inv.currency)}
                  </td>
                  <td className="py-3 text-sm">
                    <a
                      href={`/api/billing/invoices/${inv.id}/pdf`}
                      className="font-medium text-accent hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

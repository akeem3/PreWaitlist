"use client";

interface InvoiceHistoryProps {
  isPro: boolean;
}

export function InvoiceHistory({ isPro }: InvoiceHistoryProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-h4 font-medium text-foreground">
        Invoice History
      </h3>

      {isPro ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <p className="text-body-sm text-muted-foreground">
            No invoices yet. Invoices will appear here after your first billing
            cycle.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <p className="text-body-sm text-muted-foreground">
            Upgrade to Pro to receive invoices for your subscription.
          </p>
        </div>
      )}
    </div>
  );
}

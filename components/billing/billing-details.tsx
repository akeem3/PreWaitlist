"use client";

import { useState, useCallback } from "react";

interface BillingDetailsProps {
  businessAddress: string;
  onAddressSave: (address: string) => Promise<void>;
}

export function BillingDetails({
  businessAddress,
  onAddressSave,
}: BillingDetailsProps) {
  const [address, setAddress] = useState(businessAddress);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onAddressSave(address);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }, [address, onAddressSave]);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-h4 font-medium text-foreground">
        Billing Details
      </h3>

      <div className="max-w-md space-y-4">
        <div>
          <label className="mb-1.5 block text-body-sm font-medium text-foreground">
            Physical address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Acme Inc., 123 Main St, City, State 12345"
            rows={3}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-body-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Required in marketing emails (CAN-SPAM). Transactional emails always
            include your address from the email settings tab.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save address"}
        </button>

        {saved && <p className="text-xs text-accent">Address saved</p>}
      </div>
    </div>
  );
}

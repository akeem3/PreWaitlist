"use client";

import { useEffect, useState } from "react";

/**
 * 3.1d: reliable leg of the founder quota warning (the warning email rides
 * the same exhausted Resend account and can itself 429). Fetches
 * email-health on mount; renders nothing when no quota failures occurred
 * in the last 24h. Copy approved verbatim 2026-09-29.
 */
export function QuotaWarningBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/email-health")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.quotaHit) setVisible(true);
      })
      .catch((err) => {
        console.error("[quota-banner] email-health fetch failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="border-b border-destructive/20 bg-destructive/5 px-6 py-3"
    >
      <p className="text-body-sm text-destructive">
        Some emails couldn&apos;t be sent because the email quota was exceeded.
        Daily-quota emails retry automatically after midnight UTC.
      </p>
    </div>
  );
}

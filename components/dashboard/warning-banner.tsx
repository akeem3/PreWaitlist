"use client";

import { useEffect, useState } from "react";

interface WarningBannerProps {
  coldThreshold: number;
}

export default function WarningBanner({ coldThreshold }: WarningBannerProps) {
  const [coldPercent, setColdPercent] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/warmth")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json.total) return;
        const total = json.total as number;
        const cold = json.cold as number;
        const pct = Math.round((cold / total) * 100);
        setColdPercent(pct);
        if (total >= 10 && pct >= coldThreshold) {
          setVisible(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [coldThreshold]);

  if (!visible || coldPercent === null) return null;

  return (
    <div className="rounded-[var(--card-radius)] border border-yellow-200 bg-yellow-50 px-5 py-4">
      <div className="flex items-center gap-3">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 text-yellow-600"
        >
          <path
            d="M8 1L1.5 14H14.5L8 1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M8 6V9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
        </svg>
        <p className="text-sm font-medium text-yellow-800">
          {coldPercent}% of your list has gone cold. Consider sending a
          re-engagement email.
        </p>
      </div>
    </div>
  );
}

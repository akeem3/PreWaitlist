interface WarmthData {
  hot: number;
  warm: number;
  cold: number;
  total: number;
}

interface WarningBannerProps {
  coldThreshold: number;
  warmthData?: WarmthData | null;
}

function computeColdPercent(
  data: WarmthData | null | undefined
): number | null {
  if (!data || data.total === 0) return null;
  return Math.round((data.cold / data.total) * 100);
}

export default function WarningBanner({
  coldThreshold,
  warmthData,
}: WarningBannerProps) {
  // AC2: no fetch fallback — the old internal call omitted waitlist_id and
  // always 400'd. The banner renders only from the warmthData prop.
  const coldPercent = computeColdPercent(warmthData);
  const visible =
    coldPercent !== null &&
    (warmthData?.total ?? 0) >= 10 &&
    coldPercent >= coldThreshold;

  if (!visible || coldPercent === null) return null;

  return (
    <div className="rounded-[var(--card-radius)] border border-warning-border bg-warning-background px-5 py-4">
      <div className="flex items-center gap-3">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 text-warning"
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
        <p className="text-sm font-medium text-foreground">
          {coldPercent}% of your list has gone cold. Consider sending a
          re-engagement email.
        </p>
      </div>
    </div>
  );
}

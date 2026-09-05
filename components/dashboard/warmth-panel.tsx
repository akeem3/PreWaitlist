"use client";

export default function WarmthPanel() {
  return (
    <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Warmth Distribution
      </h3>
      <div className="relative">
        <div className="pointer-events-none space-y-3 blur-[2px]">
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            <div className="w-1/4 bg-red-500" />
            <div className="w-1/4 bg-amber-500" />
            <div className="w-1/4 bg-blue-500" />
            <div className="w-1/4 bg-gray-400" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Hot: 12</span>
            <span>Warm: 8</span>
            <span>Cold: 5</span>
            <span>Unscored: 3</span>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            Warmth tracking coming in a future update
          </p>
        </div>
      </div>
    </div>
  );
}

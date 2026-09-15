"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  date: string;
  count: number;
}

interface SignupChartProps {
  subdomain: string;
  waitlistId?: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string } }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
      <p className="text-xs text-muted-foreground">
        {payload[0]?.payload?.date}
      </p>
      <p className="text-sm font-medium text-foreground">
        {payload[0]?.value} signup{payload[0]?.value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function ChartBody({
  subdomain,
  range,
  waitlistId,
}: {
  subdomain: string;
  range: string;
  waitlistId?: string;
}) {
  const [data, setData] = useState<ChartData[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const widParam = waitlistId ? `&waitlist_id=${waitlistId}` : "";
    fetch(`/api/dashboard/chart?range=${range}${widParam}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json.days || []);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      });
    return () => {
      cancelled = true;
    };
  }, [range, subdomain, waitlistId]);

  if (data === null) {
    const heights = [40, 65, 30, 80, 55, 45, 70, 35, 60, 50, 75, 42, 58, 68];
    return (
      <div className="space-y-3">
        <div className="flex items-end gap-1" style={{ height: 200 }}>
          {heights.map((h, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t bg-muted"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex gap-1">
          {heights.map((_, i) => (
            <div
              key={i}
              className="h-3 flex-1 animate-pulse rounded bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-200px items-center justify-center">
        <span className="text-body-sm text-muted-foreground">
          No signups in this period
        </span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-100">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#6B6459" }} // token: --color-muted-foreground
              axisLine={{ stroke: "#CCC9C3" }} // token: --color-border
              tickLine={false}
              tickFormatter={(value: string) => {
                const d = new Date(value);
                return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6B6459" }} // token: --color-muted-foreground
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar
              dataKey="count"
              fill="var(--color-accent)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function SignupChart({
  subdomain,
  waitlistId,
}: SignupChartProps) {
  const [range, setRange] = useState<"30d" | "all">("30d");

  return (
    <div className="rounded-(--card-radius) border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Signups Over Time
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setRange("30d")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              range === "30d"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            30d
          </button>
          <button
            type="button"
            onClick={() => setRange("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              range === "all"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      <ChartBody
        key={range}
        subdomain={subdomain}
        range={range}
        waitlistId={waitlistId}
      />
    </div>
  );
}

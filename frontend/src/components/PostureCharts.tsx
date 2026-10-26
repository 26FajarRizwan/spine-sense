"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SlumpBucket, TrendPoint } from "@/types/posture";

interface PostureChartsProps {
  dailyTrend: TrendPoint[];
  weeklyTrend: TrendPoint[];
  slumps: SlumpBucket[];
}

function ChartTooltip({
  active,
  payload,
  valueLabel,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: TrendPoint | SlumpBucket; value?: number }>;
  valueLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const value = payload[0]?.value;
  if (!point || typeof value !== "number") return null;

  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-[0_12px_32px_-20px_rgba(15,23,42,0.4)]">
      <p className="font-medium text-ink">{point.label}</p>
      <p className="text-ink-soft">
        {valueLabel} {value}
      </p>
    </div>
  );
}

export function PostureCharts({
  dailyTrend,
  weeklyTrend,
  slumps,
}: PostureChartsProps) {
  const [period, setPeriod] = useState<"daily" | "weekly">("weekly");
  const trend = period === "daily" ? dailyTrend : weeklyTrend;

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)] xl:col-span-3">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Posture score trend</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {period === "daily" ? "Session averages by hour today." : "Daily averages for the last seven days."}
            </p>
          </div>
          <div aria-label="Trend period" className="inline-flex rounded-lg border border-line p-1">
            {(["daily", "weekly"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                onClick={() => setPeriod(value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${
                  period === value ? "bg-brand text-white" : "text-ink-soft hover:bg-mist"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="relative h-72">
          {trend.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#005AF1" stopOpacity={0.3} />
                    <stop offset="55%" stopColor="#01AA6C" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#01AA6C" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#475569", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#475569", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip valueLabel="Score" />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#005AF1"
                  strokeWidth={2.5}
                  fill="url(#scoreFill)"
                  dot={{ r: 3, fill: "#01AA6C", stroke: "#FFFFFF", strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-ink-soft">
              No sessions to chart for this period.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)] xl:col-span-2">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink">Slump frequency</h2>
          <p className="mt-1 text-sm text-ink-soft">Slump count across your tracked periods.</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={slumps} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#475569", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#475569", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip valueLabel="Slumps" />} />
              <Bar dataKey="slumps" fill="#EF4444" radius={[8, 8, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

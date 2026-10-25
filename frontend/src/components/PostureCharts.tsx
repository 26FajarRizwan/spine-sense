"use client";

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
  trend: TrendPoint[];
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

export function PostureCharts({ trend, slumps }: PostureChartsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)] xl:col-span-3">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink">Posture score</h2>
          <p className="mt-1 text-sm text-ink-soft">Daily average for the current week.</p>
        </div>
        <div className="h-72">
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
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)] xl:col-span-2">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink">Slump frequency</h2>
          <p className="mt-1 text-sm text-ink-soft">How often posture dropped, by time of day.</p>
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

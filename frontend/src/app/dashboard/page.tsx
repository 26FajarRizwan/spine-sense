import type { Metadata } from "next";
import { AnalyticsCards } from "@/components/AnalyticsCards";
import { PostureCharts } from "@/components/PostureCharts";
import { SAMPLE_SUMMARY, SLUMP_BY_PERIOD, WEEKLY_TREND } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Review posture score trends, session time, and slump frequency.",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
            Sample analytics for recent sittings. Scores, time, and slump counts will replace this once sessions are saved.
          </p>
        </div>
        <span className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-ink-soft ring-1 ring-line">
          This week
        </span>
      </div>

      <AnalyticsCards
        totalSessionSeconds={SAMPLE_SUMMARY.totalSessionSeconds}
        averageScore={SAMPLE_SUMMARY.averageScore}
        slumpCount={SAMPLE_SUMMARY.slumpCount}
      />

      <div className="mt-4">
        <PostureCharts trend={WEEKLY_TREND} slumps={SLUMP_BY_PERIOD} />
      </div>
    </div>
  );
}

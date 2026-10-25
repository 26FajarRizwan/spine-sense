import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnalyticsCards } from "@/components/AnalyticsCards";
import { PostureCharts } from "@/components/PostureCharts";
import { SAMPLE_SUMMARY, SLUMP_BY_PERIOD, WEEKLY_TREND } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Review posture score trends, session time, and slump frequency.",
};

export default function DashboardPage() {
  return (
    <div className="relative overflow-x-hidden bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_70%_80%_at_90%_0%,rgba(0,90,241,0.08),transparent_55%),radial-gradient(ellipse_50%_60%_at_0%_20%,rgba(1,170,108,0.07),transparent_50%),linear-gradient(180deg,#F5F8FF_0%,#FFFFFF_100%)]"
      />

      <div className="relative container mx-auto px-6 py-8 lg:py-9">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
              Analytics
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
              Weekly posture trends from demo sessions. Sign in to sync live history.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 items-center rounded-xl border border-spine/25 bg-spine-soft px-3 text-xs font-semibold text-spine">
              Avg aligned
            </span>
            <span className="inline-flex h-9 items-center rounded-xl border border-line bg-white px-3 text-xs font-semibold text-ink-soft">
              This week
            </span>
            <Link
              href="/session"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              New session
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <AnalyticsCards
          totalSessionSeconds={SAMPLE_SUMMARY.totalSessionSeconds}
          averageScore={SAMPLE_SUMMARY.averageScore}
          slumpCount={SAMPLE_SUMMARY.slumpCount}
        />

        <div className="mt-5">
          <PostureCharts trend={WEEKLY_TREND} slumps={SLUMP_BY_PERIOD} />
        </div>
      </div>
    </div>
  );
}

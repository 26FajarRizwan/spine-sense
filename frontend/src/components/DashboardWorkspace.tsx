"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3 } from "lucide-react";
import { AnalyticsCards } from "@/components/AnalyticsCards";
import { PostureCharts } from "@/components/PostureCharts";
import { formatSessionLength } from "@/lib/posture";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import type { SlumpBucket, TrendPoint } from "@/types/posture";

interface SessionRow {
  id: string;
  duration_seconds: number;
  average_score: number;
  slump_count: number;
  created_at: string;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getStatus(score: number) {
  if (score >= 80) return { label: "Good", className: "bg-spine-soft text-spine-deep" };
  if (score >= 60) return { label: "Needs attention", className: "bg-amber-50 text-amber-800" };
  return { label: "Slumping", className: "bg-red-50 text-red-700" };
}

export function DashboardWorkspace() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let cancelled = false;

    async function loadSessions() {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError("Supabase is not configured. Your posture history cannot be loaded.");
        setLoading(false);
        return;
      }

      try {
        const loadedSessions: SessionRow[] = [];
        for (let offset = 0; ; offset += 500) {
          const { data, error: queryError } = await supabase
            .from("posture_sessions")
            .select("id, duration_seconds, average_score, slump_count, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .range(offset, offset + 499);

          if (queryError) throw new Error(queryError.message);
          if (cancelled) return;
          const page = (data ?? []) as SessionRow[];
          loadedSessions.push(...page);
          if (page.length < 500) break;
        }
        if (cancelled) return;
        setSessions(loadedSessions);
      } catch (queryError) {
        if (!cancelled) {
          setError(
            `Could not load posture history: ${
              queryError instanceof Error ? queryError.message : "unexpected error"
            }`,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSessions();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const summary = useMemo(() => {
    const seconds = sessions.reduce((total, session) => total + session.duration_seconds, 0);
    const weightedScore = sessions.reduce(
      (total, session) => total + Number(session.average_score) * session.duration_seconds,
      0,
    );
    const trackedSeconds = sessions.reduce(
      (total, session) => total + session.duration_seconds,
      0,
    );
    const averageScore =
      trackedSeconds > 0
        ? weightedScore / trackedSeconds
        : sessions.length
          ? sessions.reduce((total, session) => total + Number(session.average_score), 0) /
            sessions.length
          : 0;

    return {
      totalSessionSeconds: seconds,
      averageScore,
      slumpCount: sessions.reduce((total, session) => total + session.slump_count, 0),
    };
  }, [sessions]);

  const { dailyTrend, weeklyTrend, slumpBuckets } = useMemo(() => {
    const now = new Date();
    const todayKey = dateKey(now);
    const dayRows = new Map<string, SessionRow[]>();
    const hourRows = new Map<number, SessionRow[]>();

    sessions.forEach((session) => {
      const created = new Date(session.created_at);
      const key = dateKey(created);
      dayRows.set(key, [...(dayRows.get(key) ?? []), session]);
      if (key === todayKey) {
        hourRows.set(created.getHours(), [...(hourRows.get(created.getHours()) ?? []), session]);
      }
    });

    const scoreFor = (rows: SessionRow[]) => {
      const duration = rows.reduce((total, row) => total + row.duration_seconds, 0);
      const score =
        duration > 0
          ? rows.reduce(
              (total, row) => total + Number(row.average_score) * row.duration_seconds,
              0,
            ) / duration
          : rows.reduce((total, row) => total + Number(row.average_score), 0) /
            Math.max(rows.length, 1);
      return rows.length > 0 ? Math.round(score) : null;
    };

    const weekly: TrendPoint[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
      const rows = dayRows.get(dateKey(day)) ?? [];
      weekly.push({
        label: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(day),
        score: scoreFor(rows),
        slumps: rows.reduce((total, row) => total + row.slump_count, 0),
      });
    }

    const daily: TrendPoint[] = [...hourRows.entries()]
      .sort(([left], [right]) => left - right)
      .map(([hour, rows]) => ({
        label: new Intl.DateTimeFormat(undefined, {
          hour: "numeric",
        }).format(new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour)),
        score: scoreFor(rows),
        slumps: rows.reduce((total, row) => total + row.slump_count, 0),
      }));

    const slumpBuckets: SlumpBucket[] = weekly.map(({ label, slumps }) => ({
      label,
      slumps,
    }));

    return { dailyTrend: daily, weeklyTrend: weekly, slumpBuckets };
  }, [sessions]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-sm font-medium text-ink-soft">
          {authLoading ? "Checking your session…" : "Redirecting to sign in…"}
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-hidden bg-white">
      <div className="relative container mx-auto px-4 py-8 sm:px-6 lg:py-9">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
              Personal analytics
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
              Your saved posture sessions, trends, and sitting time.
            </p>
          </div>
          <Link
            href="/session"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            New session
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {error ? (
          <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <AnalyticsCards
          totalSessionSeconds={summary.totalSessionSeconds}
          averageScore={summary.averageScore}
          slumpCount={summary.slumpCount}
        />

        <div className="mt-5">
          <PostureCharts
            dailyTrend={dailyTrend}
            weeklyTrend={weeklyTrend}
            slumps={slumpBuckets}
          />
        </div>

        <section className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Recent sessions</h2>
              <p className="mt-1 text-sm text-ink-soft">Your latest saved posture summaries.</p>
            </div>
            <Clock3 className="h-5 w-5 text-brand" aria-hidden="true" />
          </div>
          {loading ? (
            <p className="px-5 py-10 text-center text-sm text-ink-soft">Loading posture history…</p>
          ) : sessions.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-ink">No sessions saved yet.</p>
              <Link href="/session" className="mt-2 inline-flex text-sm font-semibold text-brand hover:underline">
                Start your first session
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="bg-mist text-xs uppercase tracking-wide text-ink-soft">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Duration</th>
                    <th className="px-5 py-3 font-semibold">Score</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sessions.slice(0, 10).map((session) => {
                    const score = Number(session.average_score);
                    const status = getStatus(score);
                    return (
                      <tr key={session.id} className="text-ink">
                        <td className="px-5 py-3.5 text-ink-soft">
                          {new Intl.DateTimeFormat(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(session.created_at))}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">
                          {formatSessionLength(session.duration_seconds)}
                        </td>
                        <td className="px-5 py-3.5 font-semibold tabular-nums">{Math.round(score)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

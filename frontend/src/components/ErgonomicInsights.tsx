"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Lightbulb } from "lucide-react";

interface InsightSession {
  duration_seconds: number;
  average_score: number;
  slump_count: number;
  created_at: string;
}

interface ErgonomicInsightsProps {
  sessions: InsightSession[];
  averageScore: number;
}

interface Insight {
  title: string;
  body: string;
}

const HEALTHY_SCORE = 75;
const DAILY_GOAL_MINUTES = 30;

const DAY_PARTS = [
  { label: "morning", start: 5, end: 12 },
  { label: "afternoon", start: 12, end: 17 },
  { label: "evening", start: 17, end: 22 },
  { label: "late night", start: 22, end: 29 },
];

function postureStatus(score: number) {
  if (score >= 80) return "Good";
  if (score >= 60) return "Needs attention";
  return "Slumping";
}

function dayPartFor(date: Date) {
  const hour = date.getHours() < 5 ? date.getHours() + 24 : date.getHours();
  return DAY_PARTS.find((part) => hour >= part.start && hour < part.end) ?? DAY_PARTS[3];
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function computeConsistency(sessions: InsightSession[], now: number) {
  const healthy = sessions.filter(
    (session) => Number(session.average_score) >= HEALTHY_SCORE,
  );
  const healthyDays = new Set(healthy.map((session) => dayKey(new Date(session.created_at))));
  const today = new Date(now);

  let offset = healthyDays.has(dayKey(today)) ? 0 : 1;
  let streak = 0;
  while (
    healthyDays.has(
      dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)),
    )
  ) {
    streak += 1;
    offset += 1;
  }

  const todaySeconds = healthy
    .filter((session) => dayKey(new Date(session.created_at)) === dayKey(today))
    .reduce((total, session) => total + session.duration_seconds, 0);

  return { streak, todayMinutes: Math.floor(todaySeconds / 60) };
}

function buildInsights(sessions: InsightSession[], averageScore: number): Insight[] {
  const insights: Insight[] = [];
  const rounded = Math.round(averageScore);

  const exposure = new Map<string, { slumps: number; seconds: number }>();
  sessions.forEach((session) => {
    const part = dayPartFor(new Date(session.created_at)).label;
    const current = exposure.get(part) ?? { slumps: 0, seconds: 0 };
    exposure.set(part, {
      slumps: current.slumps + session.slump_count,
      seconds: current.seconds + session.duration_seconds,
    });
  });

  const peak = [...exposure.entries()]
    .filter(([, value]) => value.slumps > 0 && value.seconds >= 60)
    .map(([label, value]) => ({
      label,
      slumps: value.slumps,
      perHour: value.slumps / (value.seconds / 3600),
    }))
    .sort((left, right) => right.perHour - left.perHour)[0];

  if (peak) {
    insights.push({
      title: `Slumps peak in the ${peak.label}`,
      body: `You average ${peak.perHour.toFixed(1)} slumps per hour of ${peak.label} sitting, across ${peak.slumps} recorded slumps. Plan your next focused work block for another part of the day or add a posture check to this one.`,
    });
  }

  if (averageScore < 75) {
    const interval = averageScore < 60 ? 15 : 20;
    insights.push({
      title: "Add micro breaks",
      body: `Your average score is ${rounded} out of 100. Stand up, roll your shoulders and reset your desk posture every ${interval} minutes to keep your spine supported through long sessions.`,
    });
  } else if (averageScore >= 85) {
    insights.push({
      title: "Consistent desk posture",
      body: `Your average score is ${rounded} out of 100. Keep your current setup and sitting habits, and continue taking short breaks to hold this level.`,
    });
  } else {
    insights.push({
      title: "Steady progress",
      body: `Your average score is ${rounded} out of 100. Reaching 85 will take small gains, such as keeping your screen at eye level and your shoulders relaxed.`,
    });
  }

  const longest = sessions.reduce<InsightSession | null>(
    (best, session) =>
      best === null || session.duration_seconds > best.duration_seconds ? session : best,
    null,
  );
  if (longest && longest.duration_seconds >= 3600 && Number(longest.average_score) < 80) {
    insights.push({
      title: "Long sessions drift",
      body: `Your longest session lasted ${Math.round(longest.duration_seconds / 60)} minutes and scored ${Math.round(Number(longest.average_score))}. Splitting extended sitting into shorter blocks helps posture hold up.`,
    });
  }

  return insights;
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv(sessions: InsightSession[]) {
  const dateFormat = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const rows = sessions.map((session) => {
    const score = Math.round(Number(session.average_score));
    return [
      dateFormat.format(new Date(session.created_at)),
      (session.duration_seconds / 60).toFixed(1),
      score,
      session.slump_count,
      postureStatus(score),
    ];
  });
  return [
    ["Session Date", "Duration Minutes", "Posture Score", "Slump Count", "Posture Status"],
    ...rows,
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

function downloadCsv(sessions: InsightSession[]) {
  const blob = new Blob([buildCsv(sessions)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "spinesense-posture-report.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ErgonomicInsights({ sessions, averageScore }: ErgonomicInsightsProps) {
  const insights = useMemo(() => buildInsights(sessions, averageScore), [sessions, averageScore]);
  const [now] = useState(() => Date.now());
  const { streak, todayMinutes } = useMemo(
    () => computeConsistency(sessions, now),
    [sessions, now],
  );
  const hasSessions = sessions.length > 0;
  const goalPercent = Math.min(100, Math.round((todayMinutes / DAILY_GOAL_MINUTES) * 100));

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-spine-soft text-spine">
            <Lightbulb className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">Ergonomic insights</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Guidance drawn from your saved desk posture sessions.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => downloadCsv(sessions)}
          disabled={!hasSessions}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-brand bg-white px-3.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:border-line disabled:text-ink-soft disabled:hover:bg-white"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Export CSV Report
        </button>
      </div>

      {hasSessions ? (
        <>
          <div className="grid gap-3 border-b border-line bg-white p-4 sm:grid-cols-2 sm:p-5">
            <div className="rounded-xl bg-[#F8FAFC] px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Current Healthy Streak</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[#2563EB]">
                {streak} {streak === 1 ? "day" : "days"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Days in a row with a saved session scoring {HEALTHY_SCORE} or above
              </p>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">
                  Today Healthy Session Goal
                </p>
                <p className="text-xs font-semibold tabular-nums text-[#059669]">
                  {goalPercent}%
                </p>
              </div>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                {todayMinutes} of {DAILY_GOAL_MINUTES} minutes
              </p>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200"
                role="progressbar"
                aria-label="Today healthy session goal"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={goalPercent}
              >
                <div
                  className="h-full rounded-full bg-[#059669] transition-[width] duration-200"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
            </div>
          </div>
          <ul className="grid gap-3 bg-mist p-4 sm:p-5 lg:grid-cols-3">
            {insights.map((insight) => (
              <li
                key={insight.title}
                className="rounded-xl border border-line border-l-4 border-l-spine bg-white p-4"
              >
                <h3 className="text-sm font-semibold text-ink">{insight.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-soft">{insight.body}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-ink">No insights yet.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Record a posture session to unlock personalised ergonomic guidance.
          </p>
          <Link
            href="/session"
            className="mt-2 inline-flex text-sm font-semibold text-brand hover:underline"
          >
            Start your first session
          </Link>
        </div>
      )}
    </section>
  );
}

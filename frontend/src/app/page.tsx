import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ChartLine, ScanLine } from "lucide-react";

export const metadata: Metadata = {
  title: "Start a session",
  description: "Begin a SpineSense posture session or review analytics from previous sittings.",
};

const FEATURES = [
  {
    title: "Live skeleton",
    body: "A canvas overlay traces shoulders, spine, and hips on the camera frame.",
    icon: ScanLine,
  },
  {
    title: "Instant score",
    body: "A 0–100 gauge marks good alignment, a warning drift, or a slump.",
    icon: Activity,
  },
  {
    title: "Session analytics",
    body: "Review time spent, average score, and how often posture collapsed.",
    icon: ChartLine,
  },
] as const;

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8 lg:py-20">
        <div>
          <img
            src="/logo-lockup.png"
            alt="SpineSense. Better posture, healthier you."
            className="h-40 w-auto max-w-full object-contain sm:h-48"
          />
          <p className="mt-6 text-sm font-semibold tracking-wide text-accent">AI-powered ergonomics</p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl sm:leading-[1.08]">
            Better posture. Healthier you.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ink-soft">
            SpineSense watches how you sit, draws a live skeleton, and scores alignment before a slump becomes a habit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/session"
              className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5]"
            >
              Start session
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-canvas px-5 text-sm font-semibold text-ink transition-colors hover:bg-mist"
            >
              View dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-line bg-canvas p-4 shadow-card sm:p-6">
          <div className="rounded-2xl bg-mist p-4 ring-1 ring-line">
            <div className="flex items-center justify-between text-xs font-medium text-ink-soft">
              <span>Preview</span>
              <span className="inline-flex items-center gap-1.5 text-posture-good-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-posture-good" aria-hidden="true" />
                Aligned
              </span>
            </div>
            <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl bg-canvas ring-1 ring-line">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,#EEF2FF,transparent_60%)]" />
              <svg viewBox="0 0 320 180" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <g fill="none" stroke="#10B981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5">
                  <path d="M160 28v28" />
                  <path d="M108 70h104" />
                  <path d="M160 56v78" />
                  <path d="M128 148h64" />
                  <path d="M108 70l-18 36" />
                  <path d="M212 70l18 36" />
                </g>
                <g fill="#6366F1" stroke="#FFFFFF" strokeWidth="2">
                  <circle cx="160" cy="28" r="7" />
                  <circle cx="108" cy="70" r="6" />
                  <circle cx="212" cy="70" r="6" />
                  <circle cx="160" cy="96" r="9" />
                  <circle cx="128" cy="148" r="6" />
                  <circle cx="192" cy="148" r="6" />
                  <circle cx="90" cy="106" r="5" />
                  <circle cx="230" cy="106" r="5" />
                </g>
              </svg>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-canvas px-3 py-3 ring-1 ring-line">
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">Score</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">86</p>
              </div>
              <div className="rounded-2xl bg-canvas px-3 py-3 ring-1 ring-line">
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">Status</p>
                <p className="mt-2 text-sm font-semibold text-posture-good-ink">GOOD</p>
              </div>
              <div className="rounded-2xl bg-canvas px-3 py-3 ring-1 ring-line">
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">Time</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-ink">12:40</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:grid-cols-3 lg:px-8" aria-label="Product features">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="rounded-3xl border border-line bg-canvas p-5 shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-ink">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{feature.body}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

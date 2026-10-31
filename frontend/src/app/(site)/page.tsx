import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, Play } from "lucide-react";

export const metadata: Metadata = {
  title: "Home",
  description:
    "SpineSense real-time AI posture and ergonomics assistant with live skeleton tracking.",
};

const FEATURES = [
  {
    title: "Live skeleton",
    body: "Shoulders, spine, and hips tracked on canvas in real time.",
  },
  {
    title: "Instant score",
    body: "0–100 gauge that shifts from good to warning to slump.",
  },
  {
    title: "Session analytics",
    body: "Review time spent upright and average alignment per session.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative overflow-x-hidden bg-white">
      <section className="relative">
        <div className="container mx-auto grid items-stretch gap-8 px-6 py-7 lg:grid-cols-12 lg:gap-10 lg:py-9">
          <div className="flex flex-col lg:col-span-5 animate-rise">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
              SpineSense
            </p>

            <h1 className="mt-3 max-w-md text-[2.05rem] font-bold leading-[1.1] tracking-tight text-ink sm:text-[2.4rem] lg:text-[2.55rem] lg:leading-[1.08]">
              Sit better.
              <span className="block text-spine">Know it live.</span>
            </h1>

            <p className="mt-3.5 max-w-[22rem] text-sm leading-6 text-ink-soft sm:text-[0.95rem] sm:leading-7">
              AI watches your desk posture, draws a live skeleton, and scores
              alignment before a slump becomes a habit.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/demo"
                className="group inline-flex h-11 items-center gap-2 rounded-xl bg-spine px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-spine-hover active:scale-[0.98]"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                Start Live Demo
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-brand/35 hover:text-brand"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                View Dashboard
              </Link>
            </div>

            {/* Pins to HUD bottom — kills the empty left well */}
            <dl className="mt-auto grid max-w-md grid-cols-3 gap-4 border-t border-line pt-5">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Score
                </dt>
                <dd className="mt-1 text-lg font-bold tabular-nums text-ink">0–100</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Latency
                </dt>
                <dd className="mt-1 text-lg font-bold tabular-nums text-ink">&lt;50ms</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Alert
                </dt>
                <dd className="mt-1 text-lg font-bold text-spine">Audio</dd>
              </div>
            </dl>
          </div>

          <div className="relative flex lg:col-span-7 animate-rise-delay">
            <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_44px_-28px_rgba(15,23,42,0.4)]">
              <div className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">Live HUD</p>
                  <p className="text-xs text-ink-soft">Skeleton pose tracking</p>
                </div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-spine">
                  <span
                    className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-spine"
                    aria-hidden="true"
                  />
                  Aligned
                </p>
              </div>

              <div className="relative mx-5 mb-3 h-56 overflow-hidden rounded-xl bg-[#EEF4FF] ring-1 ring-line sm:h-60">
                <svg
                  viewBox="0 0 480 300"
                  className="absolute inset-0 h-full w-full animate-skeleton-breathe"
                  aria-hidden="true"
                >
                  <g
                    fill="none"
                    stroke="#01AA6C"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="6"
                  >
                    <path d="M240 36v44" />
                    <path d="M155 96h170" />
                    <path d="M240 80v122" />
                    <path d="M188 230h104" />
                    <path d="M155 96l-34 60" />
                    <path d="M325 96l34 60" />
                    <path d="M188 230l-12 40" />
                    <path d="M292 230l12 40" />
                  </g>
                  <g fill="#005AF1" stroke="#FFFFFF" strokeWidth="2.5">
                    <circle cx="240" cy="36" r="10" />
                    <circle cx="155" cy="96" r="9" />
                    <circle cx="325" cy="96" r="9" />
                    <circle cx="240" cy="148" r="12" fill="#01AA6C" />
                    <circle cx="188" cy="230" r="9" />
                    <circle cx="292" cy="230" r="9" />
                    <circle cx="121" cy="156" r="8" />
                    <circle cx="359" cy="156" r="8" />
                    <circle cx="176" cy="270" r="7" />
                    <circle cx="304" cy="270" r="7" />
                  </g>
                </svg>
              </div>

              <div className="mt-auto grid grid-cols-3 divide-x divide-line border-t border-line">
                <div className="px-5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    Score
                  </p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums text-ink">86</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-bold uppercase tracking-wide text-spine">
                    Good
                  </p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    Time
                  </p>
                  <p className="mt-0.5 font-mono text-xl font-bold tabular-nums text-ink">
                    12:40
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-line bg-white">
        <div className="container mx-auto grid gap-0 px-6 sm:grid-cols-3">
          {FEATURES.map((item, index) => (
            <div
              key={item.title}
              className={`py-6 ${
                index > 0
                  ? "border-t border-line sm:border-t-0 sm:border-l sm:pl-8 lg:pl-10"
                  : "sm:pr-8 lg:pr-10"
              }`}
            >
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-1.5 max-w-xs text-sm leading-6 text-ink-soft">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  CircleCheck,
  Compass,
  Gauge,
  LayoutDashboard,
  Lock,
  Play,
  ShieldCheck,
  Timer,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Home",
  description:
    "SpineSense realtime AI posture and ergonomics assistant with live skeleton tracking.",
};

type Tone = "brand" | "spine";

const FEATURES: ReadonlyArray<{
  title: string;
  body: string;
  tags: string;
  icon: LucideIcon;
  tone: Tone;
}> = [
  {
    title: "Live Skeleton Overlay",
    body: "Realtime 33 point anatomical landmark tracking rendered smoothly over your workspace feed.",
    tags: "MediaPipe Pose · 3D Landmarks · Canvas HUD · Low Latency",
    icon: Activity,
    tone: "brand",
  },
  {
    title: "Neck & Shoulder Alignment",
    body: "Continuous monitoring of craniovertebral angle and shoulder symmetry to prevent forward head drift.",
    tags: "CVA Angle · Symmetry Delta · Tilt Detection · Baseline Sync",
    icon: Compass,
    tone: "spine",
  },
  {
    title: "Lumbar Slouch Detection",
    body: "Tracks vertical upper body compression and torso inclination against your calibrated neutral spine baseline.",
    tags: "Torso Slope · Depth Ratio · Calibration · Posture Score",
    icon: ShieldCheck,
    tone: "brand",
  },
  {
    title: "Smart Grace Period Alerts",
    body: "Configurable delay timer filters out brief natural movements before triggering gentle dual tone audio cues.",
    tags: "Web Audio · Custom Delay · Zero Spam · Corrective Cues",
    icon: BellRing,
    tone: "spine",
  },
  {
    title: "Session Analytics & Trends",
    body: "Track daily sitting duration, mean alignment scores and slump frequency across work sessions.",
    tags: "0 to 100 Score · Weekly Trends · Slump Logs · Progress",
    icon: BarChart3,
    tone: "brand",
  },
  {
    title: "Privacy First Architecture",
    body: "Video frames stay local in your browser while only numerical posture metrics sync securely to your account.",
    tags: "Local Processing · Skeleton Only Mode · Supabase Auth · Encrypted",
    icon: Lock,
    tone: "spine",
  },
];

const TONE_STYLES: Record<Tone, { icon: string; hover: string }> = {
  brand: { icon: "text-brand", hover: "hover:border-brand" },
  spine: { icon: "text-spine", hover: "hover:border-spine" },
};

const STEPS = [
  {
    title: "Calibrate",
    body: "Sit tall for a few seconds so SpineSense learns your neutral spine baseline.",
  },
  {
    title: "Track",
    body: "Your camera feed stays in the browser while the skeleton overlay scores alignment live.",
  },
  {
    title: "Correct",
    body: "A gentle audio cue fires after your grace period and the session lands in your dashboard.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative overflow-x-hidden">
      <section className="bg-dot-grid relative">
        <div className="container mx-auto grid items-stretch gap-8 px-6 py-7 lg:grid-cols-12 lg:gap-10 lg:py-9">
          <div className="flex flex-col lg:col-span-5 animate-rise">
            <p className="inline-flex w-fit items-center rounded-full border border-brand/20 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
              SpineSense
            </p>

            <h1 className="mt-3 max-w-md text-[2.05rem] font-bold leading-[1.1] tracking-tight text-ink sm:text-[2.4rem] lg:text-[2.55rem] lg:leading-[1.08]">
              <span className="block text-brand">Sit better.</span>
              <span className="block text-spine">Know it live.</span>
            </h1>

            <p className="mt-3.5 max-w-[22rem] text-sm leading-6 text-ink-soft sm:text-[0.95rem] sm:leading-7">
              AI watches your desk posture, draws a live skeleton and scores
              alignment before a slump becomes a habit.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/demo"
                className="group inline-flex h-11 items-center gap-2 rounded-xl bg-spine px-5 text-sm font-semibold text-white shadow-xs transition-[background-color,transform] duration-200 hover:bg-spine-hover focus-visible:outline-spine active:scale-[0.99]"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                Start Live Session
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink shadow-xs transition-[color,border-color,transform] duration-200 hover:border-brand hover:text-brand active:scale-[0.99]"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                View Dashboard
              </Link>
            </div>

            <dl className="mt-auto grid max-w-md grid-cols-3 gap-3 pt-5">
              <div className="rounded-xl border border-line bg-white p-3.5 shadow-xs">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Score
                </dt>
                <dd className="mt-1 text-lg font-bold tabular-nums text-ink">0 to 100</dd>
              </div>
              <div className="rounded-xl border border-line bg-white p-3.5 shadow-xs">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Latency
                </dt>
                <dd className="mt-1 text-lg font-bold tabular-nums text-ink">under 50ms</dd>
              </div>
              <div className="rounded-xl border border-line bg-white p-3.5 shadow-xs">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Alert
                </dt>
                <dd className="mt-1 text-lg font-bold text-spine">Audio</dd>
              </div>
            </dl>
          </div>

          <div className="relative flex lg:col-span-7 animate-rise-delay">
            <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">Live HUD</p>
                  <p className="text-xs text-ink-soft">Skeleton pose tracking</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
                    <Activity className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
                    Tracking 33 points
                  </p>
                  <p className="inline-flex items-center gap-1.5 rounded-full border border-spine/20 bg-emerald-tint px-2.5 py-1 text-[11px] font-semibold text-spine">
                    <span
                      className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-spine"
                      aria-hidden="true"
                    />
                    Aligned
                  </p>
                </div>
              </div>

              <div className="relative mx-5 mb-3 h-56 overflow-hidden rounded-xl border border-line bg-sky-tint sm:h-60">
                <svg
                  viewBox="0 0 480 300"
                  className="absolute inset-0 h-full w-full animate-skeleton-breathe"
                  aria-hidden="true"
                >
                  <g
                    fill="none"
                    stroke="#059669"
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
                  <g fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5">
                    <circle cx="240" cy="36" r="10" />
                    <circle cx="155" cy="96" r="9" />
                    <circle cx="325" cy="96" r="9" />
                    <circle cx="240" cy="148" r="12" fill="#059669" />
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
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    <Gauge className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} aria-hidden="true" />
                    Score
                  </p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums text-ink">86</p>
                </div>
                <div className="px-5 py-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    <CircleCheck className="h-3.5 w-3.5 text-spine" strokeWidth={1.5} aria-hidden="true" />
                    Status
                  </p>
                  <p className="mt-1 text-sm font-bold uppercase tracking-wide text-spine">
                    Good
                  </p>
                </div>
                <div className="px-5 py-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    <Timer className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} aria-hidden="true" />
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

      <section className="border-y border-line bg-white/45">
        <div className="container mx-auto px-6 py-12 lg:py-14">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
              Features
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
              Everything your spine needs to stay in line
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              const tone = TONE_STYLES[item.tone];
              return (
                <article
                  key={item.title}
                  className={`flex flex-col rounded-2xl border border-line bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${tone.hover}`}
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white">
                    <Icon
                      className={`h-5 w-5 ${tone.icon}`}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-ink-soft">{item.body}</p>
                  <p className="mt-5 border-t border-line pt-4 text-xs font-medium leading-5 text-ink-soft">
                    {item.tags}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="container mx-auto px-6 py-12 lg:py-14">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-spine">
              Workflow
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
              From first sit to better habits
            </h2>
          </div>

          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-line bg-white p-6 shadow-xs"
              >
                <span className="font-mono text-xs font-semibold text-brand">
                  0{index + 1}
                </span>
                <h3 className="mt-2 text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-6 grid overflow-hidden rounded-2xl border border-spine/25 bg-white shadow-xs md:grid-cols-2">
            <div className="border-b border-spine/25 bg-white p-6 md:border-b-0 md:border-r">
              <p className="text-sm font-semibold text-spine">Start a live session</p>
              <p className="mt-1 text-sm leading-6 text-ink-soft">
                Open your camera and see your skeleton scored in realtime.
              </p>
              <Link
                href="/demo"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-spine px-4 text-sm font-semibold text-white shadow-xs transition-[background-color,transform] duration-200 hover:bg-spine-hover active:scale-[0.99]"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                Start Live Session
              </Link>
            </div>
            <div className="border-brand/25 bg-white p-6">
              <p className="text-sm font-semibold text-brand">Review your progress</p>
              <p className="mt-1 text-sm leading-6 text-ink-soft">
                Check weekly trends, mean alignment and slump frequency.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-xs transition-[background-color,transform] duration-200 hover:bg-brand-hover active:scale-[0.99]"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

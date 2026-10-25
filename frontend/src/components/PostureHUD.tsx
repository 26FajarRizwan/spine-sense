import { Timer } from "lucide-react";
import { formatTimer, postureCue, postureLabel } from "@/lib/posture";
import type { PostureStatus } from "@/types/posture";

interface PostureHUDProps {
  score: number;
  status: PostureStatus;
  elapsedSeconds: number;
  running: boolean;
  audioAlerts?: boolean;
}

const STATUS_STYLES: Record<
  PostureStatus,
  { badge: string; stroke: string; dot: string }
> = {
  GOOD: {
    badge: "bg-spine-soft text-spine-deep ring-spine/25",
    stroke: "#01AA6C",
    dot: "bg-spine",
  },
  WARNING: {
    badge: "bg-posture-warning/15 text-posture-warning-ink ring-posture-warning/30",
    stroke: "#F59E0B",
    dot: "bg-posture-warning",
  },
  SLUMPING: {
    badge: "bg-posture-slump/10 text-posture-slump-ink ring-posture-slump/25",
    stroke: "#EF4444",
    dot: "bg-posture-slump",
  },
};

function ScoreGauge({ score, status }: { score: number; status: PostureStatus }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const tone = STATUS_STYLES[status];

  return (
    <div className="relative mx-auto h-56 w-56">
      <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90" role="img" aria-label={`Posture score ${clamped} out of 100`}>
        <circle cx="110" cy="110" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="14" />
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke={tone.stroke}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-semibold tabular-nums tracking-tight text-slate-900">{clamped}</span>
        <span className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Score</span>
      </div>
    </div>
  );
}

export function PostureHUD({
  score,
  status,
  elapsedSeconds,
  running,
  audioAlerts = false,
}: PostureHUDProps) {
  const tone = STATUS_STYLES[status];
  const label = postureLabel(status);

  return (
    <aside className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Posture HUD</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Live score · alerts {audioAlerts ? "armed" : "muted"}
          </p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-semibold ring-1 ${tone.badge}`}>
          <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden="true" />
          <span aria-live="polite">{status}</span>
          <span className="sr-only">{label}</span>
        </span>
      </div>

      <div className="mt-6">
        <ScoreGauge score={score} status={status} />
      </div>

      <p className="mt-2 text-center text-sm leading-6 text-ink-soft">{postureCue(status)}</p>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-line bg-mist px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-soft">
          <Timer className="h-4 w-4 text-brand" aria-hidden="true" />
          Session time
        </div>
        <time
          dateTime={`PT${Math.max(0, Math.floor(elapsedSeconds))}S`}
          className="font-mono text-lg font-semibold tabular-nums text-ink"
        >
          {formatTimer(elapsedSeconds)}
        </time>
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        {running ? "Timer is running with the camera." : "Timer starts when the camera turns on."}
      </p>
    </aside>
  );
}

import { Clock3, Gauge, TriangleAlert, type LucideIcon } from "lucide-react";
import { formatSessionLength } from "@/lib/posture";

interface AnalyticsCardsProps {
  totalSessionSeconds: number;
  averageScore: number;
  slumpCount: number;
}

interface Metric {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  iconClass: string;
}

export function AnalyticsCards({
  totalSessionSeconds,
  averageScore,
  slumpCount,
}: AnalyticsCardsProps) {
  const metrics: Metric[] = [
    {
      label: "Total sitting time tracked",
      value: formatSessionLength(totalSessionSeconds),
      hint: "Time tracked across saved sessions",
      icon: Clock3,
      iconClass: "border-brand/15 bg-brand-soft text-brand",
    },
    {
      label: "Average posture score",
      value: String(Math.round(averageScore)),
      hint: "Mean score from 0 to 100",
      icon: Gauge,
      iconClass: "border-spine/20 bg-spine-soft text-spine",
    },
    {
      label: "Slump frequency",
      value: String(slumpCount),
      hint: "Times posture dropped into a slump",
      icon: TriangleAlert,
      iconClass: "border-posture-slump/20 bg-posture-slump/10 text-posture-slump-ink",
    },
  ];

  return (
    <section aria-label="Session summary" className="grid gap-3 sm:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <article
            key={metric.label}
            className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-ink-soft">{metric.label}</h2>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${metric.iconClass}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-ink">
              {metric.value}
            </p>
            <p className="mt-1.5 text-sm text-ink-soft">{metric.hint}</p>
          </article>
        );
      })}
    </section>
  );
}

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
      label: "Total session time",
      value: formatSessionLength(totalSessionSeconds),
      hint: "Time tracked across saved sessions",
      icon: Clock3,
      iconClass: "bg-mist text-ink",
    },
    {
      label: "Average posture score",
      value: String(Math.round(averageScore)),
      hint: "Mean score from 0 to 100",
      icon: Gauge,
      iconClass: "bg-accent-soft text-accent",
    },
    {
      label: "Slump frequency",
      value: String(slumpCount),
      hint: "Times posture dropped into a slump",
      icon: TriangleAlert,
      iconClass: "bg-posture-slump/10 text-posture-slump-ink",
    },
  ];

  return (
    <section aria-label="Session summary" className="grid gap-4 sm:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <article
            key={metric.label}
            className="rounded-3xl border border-line bg-canvas p-5 shadow-card"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-ink-soft">{metric.label}</h2>
              <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${metric.iconClass}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-ink">{metric.value}</p>
            <p className="mt-2 text-sm text-ink-soft">{metric.hint}</p>
          </article>
        );
      })}
    </section>
  );
}

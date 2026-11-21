"use client";

import { useEffect, useState } from "react";

interface ModelMetrics {
  model_loaded: boolean;
  algorithm: string;
  accuracy: number;
  macro_f1: number;
  classes: { posture_class: string }[];
}

type LoadState =
  | { status: "loading" }
  | { status: "live"; metrics: ModelMetrics }
  | { status: "offline" };

const BASELINE_ALGORITHM = "Calibrated Random Forest";
const BASELINE_CLASSES = [
  "Optimal Upright",
  "Forward Head",
  "Rounded Shoulders",
  "Lateral Lean",
  "Reclined Slouch",
  "Deep Slouch",
];

const METRICS_URL = `${
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
}/api/v1/model-metrics`;

function isModelMetrics(value: unknown): value is ModelMetrics {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ModelMetrics>;
  return (
    candidate.model_loaded === true &&
    typeof candidate.algorithm === "string" &&
    typeof candidate.accuracy === "number" &&
    typeof candidate.macro_f1 === "number" &&
    Array.isArray(candidate.classes)
  );
}

export function ModelHealthCard() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetch(METRICS_URL, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        setState(
          isModelMetrics(payload)
            ? { status: "live", metrics: payload }
            : { status: "offline" },
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "offline" });
      });

    return () => controller.abort();
  }, []);

  const metrics = state.status === "live" ? state.metrics : null;
  const classes = metrics
    ? metrics.classes.map((item) => item.posture_class)
    : BASELINE_CLASSES;
  const statusLabel =
    state.status === "live"
      ? "Live"
      : state.status === "loading"
        ? "Checking"
        : "Baseline";
  const statusStyle =
    state.status === "live"
      ? "bg-emerald-50 text-[#059669]"
      : "bg-slate-100 text-slate-600";

  const figures = [
    ["Validation accuracy", metrics ? `${(metrics.accuracy * 100).toFixed(1)}%` : "Unavailable"],
    ["Macro F1 score", metrics ? metrics.macro_f1.toFixed(3) : "Unavailable"],
  ] as const;

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Model health</h2>
          <p className="mt-1 text-xs text-slate-500">
            {metrics?.algorithm ?? BASELINE_ALGORITHM} posture classifier
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle}`}>
          {statusLabel}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        {figures.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[#F8FAFC] px-4 py-3">
            <dt className="text-xs font-medium text-slate-500">{label}</dt>
            <dd
              className={`mt-1 text-2xl font-semibold tabular-nums ${
                metrics ? "text-[#2563EB]" : "text-slate-400"
              }`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {state.status === "offline" ? (
        <p className="mt-3 text-xs text-slate-500">
          The analysis service is offline. Showing the validated six class Random Forest baseline.
        </p>
      ) : null}

      <div className="mt-5">
        <p className="text-xs font-medium text-slate-500">
          Active posture classes ({classes.length})
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {classes.map((label) => (
            <li
              key={label}
              className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";

interface StretchBreakModalProps {
  onClose: () => void;
}

const EXERCISE_SECONDS = 10;

const EXERCISES = [
  {
    name: "Chin Tucks",
    instruction:
      "Sit tall and glide your chin straight back as if making a double chin. Hold briefly, release, and repeat slowly.",
  },
  {
    name: "Shoulder Blade Squeeze",
    instruction:
      "Draw both shoulder blades toward each other and down your back. Keep your neck long and breathe steadily.",
  },
  {
    name: "Seated Chest Opener",
    instruction:
      "Clasp your hands behind your back, lift your chest, and gently raise your hands. Keep your ribs relaxed.",
  },
] as const;

const TOTAL_SECONDS = EXERCISE_SECONDS * EXERCISES.length;
const TOTAL_MS = TOTAL_SECONDS * 1000;

export function StretchBreakModal({ onClose }: StretchBreakModalProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Math.min(TOTAL_MS, Date.now() - startedAt);
      setElapsedMs(elapsed);
      if (elapsed >= TOTAL_MS) window.clearInterval(interval);
    }, 100);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const finished = elapsedMs >= TOTAL_MS;
  const index = Math.min(EXERCISES.length - 1, Math.floor(elapsedMs / (EXERCISE_SECONDS * 1000)));
  const exercise = EXERCISES[index];
  const remaining = Math.max(0, Math.ceil((TOTAL_MS - elapsedMs) / 1000));
  const progress = (elapsedMs / TOTAL_MS) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stretch-break-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
              Stretch break
            </p>
            <h2 id="stretch-break-title" className="mt-2 text-xl font-bold text-slate-900">
              {finished ? "Recovery complete" : exercise.name}
            </h2>
          </div>
          <time
            className="font-mono text-3xl font-semibold tabular-nums text-slate-900"
            aria-label={`${remaining} seconds remaining`}
          >
            {remaining}s
          </time>
        </div>

        <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">
          {finished
            ? "Nice work. Return to your desk with an open chest and a long neck."
            : exercise.instruction}
        </p>

        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-[#F8FAFC] ring-1 ring-slate-200"
          role="progressbar"
          aria-label="Stretch routine progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-100 ease-linear ${
              finished ? "bg-[#059669]" : "bg-[#2563EB]"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol className="mt-4 grid grid-cols-3 gap-2">
          {EXERCISES.map((item, position) => (
            <li
              key={item.name}
              className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ${
                position < index || finished
                  ? "bg-emerald-50 text-[#059669]"
                  : position === index
                    ? "bg-blue-50 text-[#2563EB]"
                    : "bg-[#F8FAFC] text-slate-500"
              }`}
            >
              {item.name}
            </li>
          ))}
        </ol>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex h-10 items-center rounded-xl px-5 text-sm font-semibold ${
              finished
                ? "bg-[#059669] text-white hover:bg-emerald-700"
                : "border border-slate-200 bg-white text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB]"
            }`}
          >
            {finished ? "Complete" : "Skip"}
          </button>
        </div>
      </div>
    </div>
  );
}

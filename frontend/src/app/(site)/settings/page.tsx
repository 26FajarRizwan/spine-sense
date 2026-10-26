import type { Metadata } from "next";
import { SettingsForm } from "@/components/SettingsForm";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Configure SpineSense email reports, posture sensitivity, and audio alerts.",
};

export default function SettingsPage() {
  return (
    <div className="relative overflow-x-hidden bg-white">
      <div className="relative container mx-auto max-w-3xl px-6 py-8 lg:py-9">
        <div className="mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
            Account
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
            Personalize email reports, slouch detection sensitivity, and audio alerts.
          </p>
        </div>

        <SettingsForm />
      </div>
    </div>
  );
}

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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_70%_80%_at_90%_0%,rgba(0,90,241,0.08),transparent_55%),radial-gradient(ellipse_45%_55%_at_5%_30%,rgba(1,170,108,0.07),transparent_50%),linear-gradient(180deg,#F5F8FF_0%,#FFFFFF_100%)]"
      />

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

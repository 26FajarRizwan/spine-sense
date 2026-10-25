"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  Mail,
  Ruler,
  Volume2,
} from "lucide-react";
import { playCriticalSlumpAlert, playTestCriticalAlert } from "@/utils/audioAlert";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type GracePeriodSeconds,
  type ReportFrequency,
  type UserSettings,
} from "@/lib/settings";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabaseClient";

export function SettingsForm() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function guard() {
      const configured = isSupabaseConfigured();
      const supabase = getSupabaseBrowserClient();

      if (configured && supabase) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!data.session) {
          router.replace("/login");
          return;
        }
      }

      if (!cancelled) {
        setSettings(loadSettings());
        setAuthChecking(false);
      }
    }

    void guard();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!savedFlash) return;
    const id = window.setTimeout(() => setSavedFlash(false), 2800);
    return () => window.clearTimeout(id);
  }, [savedFlash]);

  function patch<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    saveSettings(settings);
    setSavedFlash(true);
  }

  function handleTestSound() {
    playCriticalSlumpAlert(settings.audioVolume);
  }

  function handleTestCritical() {
    playTestCriticalAlert(Math.max(settings.audioVolume, 0.85));
  }

  if (authChecking) {
    return (
      <div className="rounded-2xl border border-line bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-ink-soft">Checking your session…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {savedFlash ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-spine/25 bg-spine-soft px-4 py-3 text-sm font-medium text-spine-deep"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Preferences saved. Your next sessions will use these settings.
        </div>
      ) : null}

      {!isSupabaseConfigured() ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          Supabase is not configured — settings are stored in this browser only.
          Sign-in protection activates once{" "}
          <code className="rounded bg-white px-1 py-0.5 text-xs">.env.local</code>{" "}
          keys are set.
        </p>
      ) : null}

      {/* Section 1 — Email reports */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/15 bg-brand-soft text-brand">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">
              Automated email posture reports
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-soft">
              Receive sitting duration, average posture scores, and slouch reduction
              metrics directly in your inbox.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4 border-t border-line pt-5">
          <ToggleRow
            id="email-reports"
            label="Enable automated email reports"
            description="Send posture summaries to your account email."
            checked={settings.emailReportsEnabled}
            onChange={(checked) => patch("emailReportsEnabled", checked)}
          />

          <label className="block max-w-md">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              Report frequency
            </span>
            <select
              value={settings.reportFrequency}
              disabled={!settings.emailReportsEnabled}
              onChange={(event) =>
                patch("reportFrequency", event.target.value as ReportFrequency)
              }
              className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="weekly">Weekly Summary (Every Monday)</option>
              <option value="monthly">Monthly Progress Report</option>
            </select>
          </label>
        </div>
      </section>

      {/* Section 2 — Sensitivity */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-spine/20 bg-spine-soft text-spine">
            <Ruler className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">
              Posture sensitivity &amp; detection
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-soft">
              Tune how quickly SpineSense flags a slouch and when audio alerts fire.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5 border-t border-line pt-5">
          <div className="max-w-lg">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="slouch-angle" className="text-sm font-semibold text-ink">
                Slouch sensitivity angle
              </label>
              <span className="tabular-nums text-sm font-semibold text-brand">
                {settings.slouchSensitivityDeg}°
              </span>
            </div>
            <input
              id="slouch-angle"
              type="range"
              min={15}
              max={30}
              step={1}
              value={settings.slouchSensitivityDeg}
              onChange={(event) =>
                patch("slouchSensitivityDeg", Number(event.target.value))
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand"
            />
            <div className="mt-1.5 flex justify-between text-xs text-ink-soft">
              <span>15° (strict)</span>
              <span>30° (relaxed)</span>
            </div>
          </div>

          <label className="block max-w-md">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              Grace period before alert
            </span>
            <select
              value={settings.gracePeriodSeconds}
              onChange={(event) =>
                patch(
                  "gracePeriodSeconds",
                  Number(event.target.value) as GracePeriodSeconds,
                )
              }
              className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
            >
              <option value={3}>3 Seconds</option>
              <option value={5}>5 Seconds</option>
              <option value={10}>10 Seconds</option>
            </select>
          </label>
        </div>
      </section>

      {/* Section 3 — Audio */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/15 bg-brand-soft text-brand">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">Audio &amp; notifications</h2>
            <p className="mt-1 text-sm leading-6 text-ink-soft">
              Control dynamic beep alerts when posture drops into a slump.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5 border-t border-line pt-5">
          <ToggleRow
            id="audio-alerts"
            label="Dynamic audio beep alerts"
            description="Play a short tone after the grace period when slumping is detected."
            checked={settings.audioAlertsEnabled}
            onChange={(checked) => patch("audioAlertsEnabled", checked)}
          />

          <div className="max-w-lg">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="audio-volume" className="text-sm font-semibold text-ink">
                Alert volume
              </label>
              <span className="tabular-nums text-sm font-semibold text-ink">
                {Math.round(settings.audioVolume * 100)}%
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                id="audio-volume"
                type="range"
                min={0}
                max={100}
                step={1}
                disabled={!settings.audioAlertsEnabled}
                value={Math.round(settings.audioVolume * 100)}
                onChange={(event) =>
                  patch("audioVolume", Number(event.target.value) / 100)
                }
                className="h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleTestSound}
                disabled={!settings.audioAlertsEnabled}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold text-ink transition-colors hover:border-brand/30 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Volume2 className="h-4 w-4" aria-hidden="true" />
                Test Sound
              </button>
            </div>
            <button
              type="button"
              onClick={handleTestCritical}
              disabled={!settings.audioAlertsEnabled}
              className="mt-3 inline-flex h-10 w-full max-w-lg items-center justify-center gap-2 rounded-xl border border-posture-slump/30 bg-posture-slump/10 px-3.5 text-sm font-semibold text-posture-slump-ink transition-colors hover:bg-posture-slump/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Test Critical Alert
            </button>
            <p className="mt-2 max-w-lg text-xs leading-5 text-ink-soft">
              Plays the high-priority dual-tone slump warning (880Hz ↔ 1046Hz, 3 sharp pulses).
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={() => setSettings(loadSettings())}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-mist"
        >
          Reset unsaved
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        <p className="mt-0.5 text-sm leading-6 text-ink-soft">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand" : "bg-slate-300"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

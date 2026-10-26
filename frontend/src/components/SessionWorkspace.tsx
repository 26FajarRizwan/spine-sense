"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { CameraFeed } from "@/components/CameraFeed";
import { PostureHUD } from "@/components/PostureHUD";
import { playCriticalSlumpAlert, playWarningAlert } from "@/utils/audioAlert";
import { loadSettings } from "@/lib/settings";
import { statusFromScore } from "@/lib/posture";
import type { PostureStatus } from "@/types/posture";
import { useAuth } from "@/lib/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

interface SessionWorkspaceProps {
  mode?: "demo" | "authenticated";
}

export function SessionWorkspace({ mode = "demo" }: SessionWorkspaceProps) {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const protectedMode = mode === "authenticated";
  const [active, setActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [score, setScore] = useState(86);
  const [scoreTotal, setScoreTotal] = useState(86);
  const [scoreSamples, setScoreSamples] = useState(1);
  const [slumpCount, setSlumpCount] = useState(0);
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0.7);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const lastAlertRef = useRef<PostureStatus>("GOOD");
  const scoreRef = useRef(86);

  useEffect(() => {
    if (protectedMode && !authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, protectedMode, router]);

  useEffect(() => {
    if (!protectedMode) {
      const settings = loadSettings();
      setAudioAlerts(settings.audioAlertsEnabled);
      setAudioVolume(settings.audioVolume);
      return;
    }
    if (!user) return;

    let cancelled = false;
    async function loadAudioPreferences() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setSettingsError("Supabase is not configured. Audio preferences could not be loaded.");
        return;
      }
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("audio_alerts_enabled, audio_volume")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          setSettingsError(`Could not load audio preferences: ${error.message}`);
          return;
        }
        if (data) {
          setAudioAlerts(data.audio_alerts_enabled);
          setAudioVolume(Number(data.audio_volume));
        }
      } catch (error) {
        if (!cancelled) {
          setSettingsError(
            `Could not load audio preferences: ${
              error instanceof Error ? error.message : "unexpected error"
            }`,
          );
        }
      }
    }

    void loadAudioPreferences();
    return () => {
      cancelled = true;
    };
  }, [protectedMode, user]);

  const onActiveChange = useCallback((next: boolean) => {
    if (next) {
      setElapsedSeconds(0);
      setScore(86);
      scoreRef.current = 86;
      setScoreTotal(86);
      setScoreSamples(1);
      setSlumpCount(0);
      setSaveError(null);
      setSaved(false);
      lastAlertRef.current = "GOOD";
    }
    setActive(next);
  }, []);

  useEffect(() => {
    if (!active) return;

    const id = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
      const previous = scoreRef.current;
      const drift = Math.random() * 6 - 2.4;
      const next = Math.round(Math.min(98, Math.max(38, previous + drift)));
      scoreRef.current = next;
      setScore(next);
      setScoreTotal((total) => total + next);
      setScoreSamples((samples) => samples + 1);
      if (
        statusFromScore(previous) !== "SLUMPING" &&
        statusFromScore(next) === "SLUMPING"
      ) {
        setSlumpCount((count) => count + 1);
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [active]);

  const status = statusFromScore(score);

  async function handleEndAndSave() {
    if (!user || elapsedSeconds === 0) return;
    setSaving(true);
    setSaveError(null);

    try {
      setActive(false);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase is not configured. Session data was not saved.");
      }

      const { error } = await supabase.from("posture_sessions").insert({
        user_id: user.id,
        duration_seconds: elapsedSeconds,
        average_score: scoreTotal / scoreSamples,
        slump_count: slumpCount,
      });
      if (error) throw new Error(`Could not save session: ${error.message}`);

      setSaved(true);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save this session.",
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!active || !audioAlerts) {
      lastAlertRef.current = status;
      return;
    }

    if (status === lastAlertRef.current) return;
    lastAlertRef.current = status;

    if (status === "WARNING") playWarningAlert(audioVolume);
    if (status === "SLUMPING") playCriticalSlumpAlert(audioVolume);
  }, [active, audioAlerts, audioVolume, status]);

  if (protectedMode && (authLoading || !isAuthenticated)) {
    return (
      <div className="container mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-sm font-medium text-ink-soft">
          {authLoading ? "Checking your session…" : "Redirecting to sign in…"}
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-hidden bg-white">
      <div className="relative container mx-auto px-6 py-8 lg:py-9">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-spine">
              {protectedMode ? "Live workspace" : "Demo mode · Guest"}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {protectedMode ? "Live session" : "Live demo session"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
              {protectedMode
                ? "Track live posture, hear critical slump alerts, and save your session summary to your account."
                : "Enable the camera to test skeleton overlay, live score, and optional audio alerts — no account required."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAudioAlerts((value) => !value)}
            aria-pressed={audioAlerts}
            className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${
              audioAlerts
                ? "border-spine bg-spine text-white hover:bg-spine-hover"
                : "border-line bg-white text-ink-soft hover:border-brand/30 hover:text-brand"
            }`}
          >
            {audioAlerts ? (
              <Bell className="h-4 w-4" aria-hidden="true" />
            ) : (
              <BellOff className="h-4 w-4" aria-hidden="true" />
            )}
            Audio {audioAlerts ? "on" : "off"}
          </button>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <CameraFeed
            active={active}
            postureStatus={status}
            onActiveChange={onActiveChange}
          />
          <div className="lg:sticky lg:top-24">
            <PostureHUD
              score={score}
              status={status}
              elapsedSeconds={elapsedSeconds}
              running={active}
              audioAlerts={audioAlerts}
            />
          </div>
        </div>

        {protectedMode ? (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-5 text-sm">
              {settingsError ? (
                <p role="alert" className="text-amber-800">{settingsError}</p>
              ) : saveError ? (
                <p role="alert" className="text-red-700">{saveError}</p>
              ) : saved ? (
                <p role="status" className="font-medium text-spine-deep">
                  Session summary saved to your dashboard.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void handleEndAndSave()}
              disabled={saving || elapsedSeconds === 0}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving session…" : "End Session & Save"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

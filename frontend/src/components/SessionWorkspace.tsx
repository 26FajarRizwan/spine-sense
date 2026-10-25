"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { CameraFeed } from "@/components/CameraFeed";
import { PostureHUD } from "@/components/PostureHUD";
import { playAlertBeep } from "@/lib/audio";
import { statusFromScore } from "@/lib/posture";
import type { PostureStatus } from "@/types/posture";

export function SessionWorkspace() {
  const [active, setActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [score, setScore] = useState(86);
  const [audioAlerts, setAudioAlerts] = useState(true);
  const lastAlertRef = useRef<PostureStatus>("GOOD");

  const onActiveChange = useCallback((next: boolean) => {
    setActive(next);
  }, []);

  useEffect(() => {
    if (!active) return;

    const id = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
      setScore((value) => {
        const drift = Math.random() * 6 - 2.4;
        return Math.round(Math.min(98, Math.max(38, value + drift)));
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [active]);

  const status = statusFromScore(score);

  useEffect(() => {
    if (!active || !audioAlerts) {
      lastAlertRef.current = status;
      return;
    }

    if (status === lastAlertRef.current) return;
    lastAlertRef.current = status;

    if (status === "WARNING") playAlertBeep("warning");
    if (status === "SLUMPING") playAlertBeep("slump");
  }, [active, audioAlerts, status]);

  return (
    <div className="relative overflow-x-hidden bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_70%_80%_at_85%_0%,rgba(0,90,241,0.08),transparent_55%),radial-gradient(ellipse_45%_55%_at_5%_30%,rgba(1,170,108,0.08),transparent_50%),linear-gradient(180deg,#F5F8FF_0%,#FFFFFF_100%)]"
      />

      <div className="relative container mx-auto px-6 py-8 lg:py-9">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-spine">
              Demo Mode · Guest
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Live demo session
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
              Enable the camera to test skeleton overlay, live score, and optional audio
              alerts — no account required.
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
      </div>
    </div>
  );
}

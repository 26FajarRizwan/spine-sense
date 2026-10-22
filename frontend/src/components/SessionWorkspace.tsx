"use client";

import { useCallback, useEffect, useState } from "react";
import { CameraFeed } from "@/components/CameraFeed";
import { PostureHUD } from "@/components/PostureHUD";
import { statusFromScore } from "@/lib/posture";

export function SessionWorkspace() {
  const [active, setActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [score, setScore] = useState(86);

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Live session</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
          Watch the camera, the skeleton overlay, and the posture score update together.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <CameraFeed active={active} postureStatus={status} onActiveChange={onActiveChange} />
        <div className="lg:sticky lg:top-24">
          <PostureHUD score={score} status={status} elapsedSeconds={elapsedSeconds} running={active} />
        </div>
      </div>
    </div>
  );
}

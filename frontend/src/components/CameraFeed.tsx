"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import { useSessionConnection } from "@/components/SessionProvider";
import { DEMO_BONES, DEMO_JOINTS, drawSkeleton } from "@/lib/skeleton";
import type { PostureStatus } from "@/types/posture";

interface CameraFeedProps {
  active: boolean;
  postureStatus: PostureStatus;
  onActiveChange: (active: boolean) => void;
}

export function CameraFeed({ active, postureStatus, onActiveChange }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const postureRef = useRef(postureStatus);
  const offlineRef = useRef(false);
  const { setConnection } = useSessionConnection();
  const [error, setError] = useState<string | null>(null);

  postureRef.current = postureStatus;

  useEffect(() => {
    if (!active) {
      if (!offlineRef.current) setConnection("standby");
      return;
    }

    offlineRef.current = false;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let stream: MediaStream | null = null;
    let frame = 0;
    let cancelled = false;

    const paint = () => {
      if (cancelled) return;
      const context = canvas.getContext("2d");
      const width = video.clientWidth;
      const height = video.clientHeight;

      if (context && width > 0 && height > 0) {
        const ratio = window.devicePixelRatio || 1;
        const pixelWidth = Math.floor(width * ratio);
        const pixelHeight = Math.floor(height * ratio);
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
          canvas.width = pixelWidth;
          canvas.height = pixelHeight;
        }
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        drawSkeleton(context, width, height, DEMO_JOINTS, DEMO_BONES, postureRef.current);
      }

      frame = window.requestAnimationFrame(paint);
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        offlineRef.current = true;
        setError("This browser cannot open a camera.");
        setConnection("offline");
        onActiveChange(false);
        return;
      }

      try {
        setError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        setConnection("live");
        paint();
      } catch {
        if (cancelled) return;
        offlineRef.current = true;
        setError("Camera permission was blocked. Allow access and try again.");
        setConnection("offline");
        onActiveChange(false);
      }
    };

    void start();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
      if (!offlineRef.current) setConnection("standby");
    };
  }, [active, onActiveChange, setConnection]);

  return (
    <section
      aria-label="Live camera"
      className="overflow-hidden rounded-3xl border border-line bg-canvas shadow-card"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-ink">Camera feed</h2>
          <p className="text-xs text-ink-soft">Skeleton overlay draws on the canvas above the video.</p>
        </div>
        <button
          type="button"
          onClick={() => onActiveChange(!active)}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5]"
        >
          {active ? <CameraOff className="h-4 w-4" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
          {active ? "Stop camera" : "Enable camera"}
        </button>
      </div>

      <div className="relative aspect-video min-h-72 bg-mist">
        <video
          ref={videoRef}
          className={`h-full w-full -scale-x-100 object-cover ${active ? "opacity-100" : "opacity-0"}`}
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          className={`pointer-events-none absolute inset-0 h-full w-full -scale-x-100 ${active ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
        />

        {active ? (
          <p className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-ink/75 px-3 py-1 text-xs font-medium text-white">
            Skeleton overlay
          </p>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <CameraOff className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-semibold text-ink">Camera inactive</p>
              <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-ink-soft">
                {error ?? "Enable the camera to begin real-time skeleton tracking."}
              </p>
            </div>
          </div>
        )}

        <span className="pointer-events-none absolute left-3 top-3 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-accent/80" />
        <span className="pointer-events-none absolute right-3 top-3 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-accent/80" />
        <span className="pointer-events-none absolute bottom-3 left-3 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-accent/80" />
        <span className="pointer-events-none absolute bottom-3 right-3 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-accent/80" />
      </div>
    </section>
  );
}

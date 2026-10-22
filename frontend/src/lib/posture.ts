import type { PostureStatus } from "@/types/posture";

export function statusFromScore(score: number): PostureStatus {
  if (score >= 80) return "GOOD";
  if (score >= 60) return "WARNING";
  return "SLUMPING";
}

export function formatTimer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export function formatSessionLength(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}m`;
}

export function postureLabel(status: PostureStatus): string {
  if (status === "GOOD") return "Good";
  if (status === "WARNING") return "Warning";
  return "Slumping";
}

export function postureCue(status: PostureStatus): string {
  if (status === "GOOD") return "Spine aligned. Hold this posture.";
  if (status === "WARNING") return "Slight drift. Lengthen through the crown.";
  return "Slump detected. Sit back and open the chest.";
}

import type { Metadata } from "next";
import { SessionWorkspace } from "@/components/SessionWorkspace";

export const metadata: Metadata = {
  title: "Live session",
  description: "Monitor posture in real time with a camera feed, skeleton overlay, and score.",
};

export default function SessionPage() {
  return <SessionWorkspace />;
}

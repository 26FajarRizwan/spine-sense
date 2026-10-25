import type { Metadata } from "next";
import { SessionWorkspace } from "@/components/SessionWorkspace";

export const metadata: Metadata = {
  title: "Demo session",
  description:
    "Guest demo mode: test the camera feed, skeleton overlay, score gauge, and audio alerts.",
};

export default function SessionPage() {
  return <SessionWorkspace />;
}

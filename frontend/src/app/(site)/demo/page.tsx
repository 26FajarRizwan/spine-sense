import type { Metadata } from "next";
import { SessionWorkspace } from "@/components/SessionWorkspace";

export const metadata: Metadata = {
  title: "Demo session",
  description:
    "Try the camera feed, skeleton overlay, score gauge, and audio alerts in guest demo mode.",
};

export default function DemoPage() {
  return <SessionWorkspace mode="demo" />;
}

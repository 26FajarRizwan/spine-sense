import type { Metadata } from "next";
import { SessionWorkspace } from "@/components/SessionWorkspace";

export const metadata: Metadata = {
  title: "Live session",
  description:
    "Track your live posture score, session duration, and slump alerts.",
};

export default function SessionPage() {
  return <SessionWorkspace mode="authenticated" />;
}

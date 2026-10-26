import type { Metadata } from "next";
import { DashboardWorkspace } from "@/components/DashboardWorkspace";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Review posture score trends, session time, and slump frequency.",
};

export default function DashboardPage() {
  return <DashboardWorkspace />;
}

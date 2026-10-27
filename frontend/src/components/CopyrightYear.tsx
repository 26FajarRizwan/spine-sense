"use client";

import { useHydrated } from "@/lib/useHydrated";

export function CopyrightYear() {
  const hydrated = useHydrated();
  return <>{hydrated ? new Date().getFullYear() : ""}</>;
}

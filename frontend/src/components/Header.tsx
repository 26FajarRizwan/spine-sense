"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Video, type LucideIcon } from "lucide-react";
import { useSessionConnection } from "@/components/SessionProvider";
import type { ConnectionState } from "@/types/posture";

const NAV_ITEMS: readonly { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/session", label: "Session", icon: Video },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const CONNECTION_LABEL: Record<ConnectionState, string> = {
  live: "Live",
  standby: "Standby",
  offline: "Offline",
};

function BrandMark() {
  return (
    <svg viewBox="0 0 36 36" className="h-9 w-9" aria-hidden="true">
      <rect width="36" height="36" rx="10" fill="#EEF2FF" />
      <circle cx="21" cy="11" r="3.6" fill="none" stroke="#2563EB" strokeWidth="1.7" />
      <path
        d="M15.5 16.5c-2.6 2-4.2 5.2-4.2 9.2M25.2 15.2c2.4 1.8 3.8 4.4 3.8 7.6"
        fill="none"
        stroke="#2563EB"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="18.4" cy="16.2" r="1.25" fill="#0F766E" />
      <circle cx="17.6" cy="20" r="1.45" fill="#10B981" />
      <circle cx="16.8" cy="24.2" r="2" fill="#10B981" />
      <circle cx="16.1" cy="28.6" r="1.35" fill="#0F172A" />
    </svg>
  );
}

function ConnectionBadge() {
  const { connection } = useSessionConnection();
  const label = CONNECTION_LABEL[connection];
  const tone =
    connection === "live"
      ? "border-posture-good/30 bg-posture-good/10 text-posture-good-ink"
      : connection === "offline"
        ? "border-posture-slump/30 bg-posture-slump/10 text-posture-slump-ink"
        : "border-line bg-mist text-ink-soft";
  const dot =
    connection === "live"
      ? "bg-posture-good"
      : connection === "offline"
        ? "bg-posture-slump"
        : "bg-ink-soft";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
      role="status"
      aria-label={`Connection status: ${label}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {connection === "live" ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-posture-good opacity-70 motion-reduce:animate-none" />
        ) : null}
        <span className={`relative h-2 w-2 rounded-full ${dot}`} />
      </span>
      {label}
    </span>
  );
}

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-canvas"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 lg:px-8">
        <Link href="/" className="mr-auto flex items-center gap-2.5 rounded-xl">
          <BrandMark />
          <span className="text-lg font-semibold tracking-tight">
            <span className="text-posture-good-ink">Spine</span>
            <span className="text-brand">Sense</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <ConnectionBadge />
          <nav
            aria-label="Primary"
            className="flex rounded-full bg-mist p-1 ring-1 ring-line"
          >
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-canvas text-ink shadow-sm ring-1 ring-line"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          </nav>
        </div>
      </div>
    </header>
  );
}

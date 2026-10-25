"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Settings, UserRound } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (isSupabaseConfigured() && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || (isSupabaseConfigured() && !isAuthenticated)) {
    return (
      <div className="container mx-auto max-w-xl px-6 py-16 text-center">
        <p className="text-sm text-ink-soft">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-hidden bg-white">
      <div className="container mx-auto max-w-xl px-6 py-8 lg:py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
          Account
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Your SpineSense account details from signup.
        </p>

        <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white">
              {user?.initials ?? "U"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">
                {user?.fullName || "SpineSense user"}
              </p>
              <p className="truncate text-sm text-ink-soft">
                {user?.email || "Email not available"}
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-ink-soft">Full name</dt>
              <dd className="font-semibold text-ink">{user?.fullName || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-ink-soft">Email</dt>
              <dd className="font-semibold text-ink">{user?.email || "—"}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/settings"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Settings
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-ink hover:bg-mist"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

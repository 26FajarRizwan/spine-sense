"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, LockKeyhole, Save, UserRound } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";

const DESK_SETUPS = ["Laptop Only", "Laptop with Stand", "External Monitor"] as const;
type Notice = { tone: "success" | "error"; text: string } | null;

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState("");
  const [sittingTarget, setSittingTarget] = useState("8");
  const [deskSetup, setDeskSetup] = useState<(typeof DESK_SETUPS)[number]>("Laptop Only");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isSupabaseConfigured() && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => setFullName(user.fullName ?? ""));
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      const metadata = data.user?.user_metadata as Record<string, unknown> | undefined;
      if (typeof metadata?.daily_sitting_target === "number") {
        setSittingTarget(String(metadata.daily_sitting_target));
      }
      if (
        typeof metadata?.primary_desk_setup === "string" &&
        DESK_SETUPS.includes(metadata.primary_desk_setup as (typeof DESK_SETUPS)[number])
      ) {
        setDeskSetup(metadata.primary_desk_setup as (typeof DESK_SETUPS)[number]);
      }
    });
  }, [user]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const hours = Number(sittingTarget);
    if (!fullName.trim()) {
      setNotice({ tone: "error", text: "Full name is required" });
      return;
    }
    if (!Number.isInteger(hours) || hours < 4 || hours > 12) {
      setNotice({ tone: "error", text: "Choose a daily sitting target from 4 to 12 hours" });
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setNotice({ tone: "error", text: "Supabase is not configured" });
      return;
    }

    setSaving("profile");
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          daily_sitting_target: hours,
          primary_desk_setup: deskSetup,
        },
      });
      if (error) throw error;
      setNotice({ tone: "success", text: "Profile details saved successfully" });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Profile details could not be saved",
      });
    } finally {
      setSaving(null);
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    if (newPassword.length < 8) {
      setNotice({ tone: "error", text: "Password must be at least 8 characters" });
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setNotice({ tone: "error", text: "Password needs an uppercase letter, a lowercase letter, and a number" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ tone: "error", text: "Passwords do not match" });
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setNotice({ tone: "error", text: "Supabase is not configured" });
      return;
    }

    setSaving("password");
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setNotice({ tone: "success", text: "Password updated successfully" });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Password could not be updated",
      });
    } finally {
      setSaving(null);
    }
  }

  if (loading || (isSupabaseConfigured() && !isAuthenticated)) {
    return (
      <div className="container mx-auto max-w-xl px-6 py-16 text-center">
        <p className="text-sm text-ink-soft">Loading profile</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="container mx-auto max-w-3xl px-6 py-8 lg:py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Account</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">My Profile</h1>
        <p className="mt-2 text-sm text-ink-soft">Manage your account details and ergonomics preferences.</p>

        <div className="mt-8 flex items-center gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white">
            {user?.initials ?? "U"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-ink">{user?.fullName || "SpineSense user"}</p>
            <p className="truncate text-sm text-ink-soft">{user?.email || "Email not available"}</p>
          </div>
        </div>

        <form onSubmit={(event) => void saveProfile(event)} className="mt-5 rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-brand" aria-hidden="true" />
            <h2 className="text-base font-semibold text-ink">Profile details</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-ink">
              Full name
              <input className={inputClass} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
            </label>
            <label className="text-sm font-semibold text-ink">
              Email address
              <input className={`${inputClass} bg-slate-50`} value={user?.email ?? ""} readOnly />
            </label>
            <label className="text-sm font-semibold text-ink">
              Daily sitting target
              <select className={inputClass} value={sittingTarget} onChange={(event) => setSittingTarget(event.target.value)}>
                {Array.from({ length: 9 }, (_, index) => String(index + 4)).map((hours) => (
                  <option key={hours} value={hours}>{hours} hours</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-ink">
              Primary desk setup
              <select className={inputClass} value={deskSetup} onChange={(event) => setDeskSetup(event.target.value as (typeof DESK_SETUPS)[number])}>
                {DESK_SETUPS.map((setup) => <option key={setup} value={setup}>{setup}</option>)}
              </select>
            </label>
          </div>
          <button type="submit" disabled={saving !== null} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving === "profile" ? "Saving" : "Save profile"}
          </button>
        </form>

        <form onSubmit={(event) => void updatePassword(event)} className="mt-5 rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-brand" aria-hidden="true" />
            <h2 className="text-base font-semibold text-ink">Update password</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-ink">
              New password
              <input className={inputClass} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" />
            </label>
            <label className="text-sm font-semibold text-ink">
              Confirm password
              <input className={inputClass} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
            </label>
          </div>
          <button type="submit" disabled={saving !== null} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-ink hover:bg-mist disabled:opacity-60">
            {saving === "password" ? "Updating" : "Update password"}
          </button>
        </form>

        {notice ? (
          <p role={notice.tone === "error" ? "alert" : "status"} className={`mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${notice.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
            {notice.tone === "success" ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
            {notice.text}
          </p>
        ) : null}

        <Link href="/session" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
          Open live session
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

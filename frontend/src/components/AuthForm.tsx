"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AudioLines,
  ChartLine,
  ShieldCheck,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { DEFAULT_USER_SETTINGS } from "@/lib/auth";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabaseClient";

interface AuthFormProps {
  initialSignupOpen?: boolean;
}

type AuthMode = "signIn" | "signUp";
type Notice = { tone: "error" | "success"; text: string } | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-[#0F172A] outline-none transition focus:border-[#005AF1] focus:ring-4 focus:ring-[#005AF1]/10";

const features = [
  { title: "Live skeleton overlay", icon: Activity, tone: "text-[#005AF1] bg-[#E8F0FF]" },
  { title: "Instant posture score", icon: ShieldCheck, tone: "text-[#059669] bg-[#ECFDF5]" },
  { title: "Audio slump alerts", icon: AudioLines, tone: "text-[#005AF1] bg-[#E8F0FF]" },
  { title: "Session analytics", icon: ChartLine, tone: "text-[#059669] bg-[#ECFDF5]" },
] as const;

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required";
  if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password needs an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password needs a lowercase letter";
  if (!/\d/.test(password)) return "Password needs a number";
  return null;
}

function NoticeMessage({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const styles =
    notice.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <p
      role={notice.tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-3 py-2.5 text-sm ${styles}`}
    >
      {notice.text}
    </p>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.45a5.51 5.51 0 0 1-2.39 3.62v3.02h3.87c2.27-2.09 3.56-5.17 3.56-8.67Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3.02c-1.07.72-2.43 1.15-4.06 1.15-3.13 0-5.79-2.11-6.74-4.95H1.26v3.12A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.26 14.27A7.22 7.22 0 0 1 4.88 12c0-.79.14-1.56.38-2.27V6.61H1.26A12 12 0 0 0 0 12c0 1.93.46 3.75 1.26 5.39l4-3.12Z" />
      <path fill="#EA4335" d="M12 4.78c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.94 1.16 15.24 0 12 0A12 12 0 0 0 1.26 6.61l4 3.12C6.21 6.89 8.87 4.78 12 4.78Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M17.05 12.54c-.02-2.16 1.76-3.2 1.84-3.25a3.96 3.96 0 0 0-3.12-1.69c-1.31-.14-2.57.78-3.24.78-.68 0-1.72-.76-2.82-.74a4.15 4.15 0 0 0-3.49 2.13c-1.5 2.6-.38 6.43 1.06 8.54.7 1.03 1.52 2.18 2.61 2.14 1.06-.04 1.46-.69 2.74-.69 1.28 0 1.64.69 2.75.67 1.14-.02 1.85-1.04 2.55-2.07a8.52 8.52 0 0 0 1.16-2.4 3.72 3.72 0 0 1-2.04-3.42ZM14.92 6.21a3.8 3.8 0 0 0 .87-2.72 3.86 3.86 0 0 0-2.5 1.3 3.62 3.62 0 0 0-.9 2.61 3.19 3.19 0 0 0 2.53-1.19Z" />
    </svg>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  tone,
}: {
  icon: typeof features[number]["icon"];
  title: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
      <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
      </span>
      <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
    </div>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />;
}

export function AuthForm({ initialSignupOpen = false }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(initialSignupOpen ? "signUp" : "signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [notice, setNotice] = useState<Notice>(() => {
    const message =
      searchParams.get("error") ?? searchParams.get("error_description");
    return message ? { tone: "error", text: message } : null;
  });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const isSignup = mode === "signUp";
  const configured = isSupabaseConfigured();

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setNotice(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setNotice({ tone: "error", text: emailError ?? passwordError ?? "Check your details" });
      return;
    }

    if (isSignup && !fullName.trim()) {
      setNotice({ tone: "error", text: "Full name is required" });
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setNotice({ tone: "error", text: "Passwords do not match" });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase || !configured) {
      setNotice({ tone: "error", text: "Authentication is not configured" });
      return;
    }

    setLoadingAction("email");
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        if (data.session && data.user) {
          const { error: settingsError } = await supabase.from("user_settings").upsert(
            { user_id: data.user.id, ...DEFAULT_USER_SETTINGS },
            { onConflict: "user_id" },
          );
          if (settingsError) throw settingsError;
          router.push("/dashboard");
          router.refresh();
          return;
        }
        setNotice({ tone: "success", text: "Account created. Check your email to confirm" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setNotice({ tone: "success", text: "Signed in successfully. Redirecting" });
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setNotice({ tone: "error", text: messageFrom(error, "Authentication failed") });
    } finally {
      setLoadingAction(null);
    }
  }

  async function forgotPassword() {
    setNotice(null);
    const emailError = validateEmail(email);
    if (emailError) {
      setNotice({
        tone: "error",
        text: email.trim() ? emailError : "Enter your email address first to reset your password",
      });
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !configured) {
      setNotice({ tone: "error", text: "Authentication is not configured" });
      return;
    }
    setLoadingAction("reset");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setNotice({ tone: "success", text: "Password reset link sent to your email" });
    } catch (error) {
      setNotice({ tone: "error", text: messageFrom(error, "Password reset failed") });
    } finally {
      setLoadingAction(null);
    }
  }

  async function oauth(provider: "google" | "apple") {
    setNotice(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !configured) {
      setNotice({ tone: "error", text: "Authentication is not configured" });
      return;
    }
    setLoadingAction(provider);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
      if (!data.url) throw new Error("OAuth redirect was not returned");
      window.location.assign(data.url);
    } catch (error) {
      setLoadingAction(null);
      setNotice({ tone: "error", text: messageFrom(error, `${provider} sign in failed`) });
    }
  }

  const busy = loadingAction !== null;

  return (
    <main className="min-h-screen bg-white text-[#0F172A]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,0.95fr)]">
        <aside className="hidden bg-[#F8FAFC] px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-20">
          <div className="max-w-xl pt-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#005AF1]">SpineSense</p>
            <h1 className="mt-8 text-5xl font-bold leading-[1.08] tracking-[-0.04em] text-[#0F172A] xl:text-6xl">
              Better posture.
              <span className="block text-[#059669]">Healthier you.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-500">Your ergonomics workspace starts here</p>
            <div className="mt-12 grid max-w-lg grid-cols-2 gap-4">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-500">
            AI assisted posture workflows <span className="mx-2 text-slate-300">·</span>
            Realtime skeleton visibility <span className="mx-2 text-slate-300">·</span>
            <span className="font-semibold text-[#059669]">Green when aligned</span>
          </p>
        </aside>

        <section className="flex min-h-screen items-center bg-white px-6 py-10 sm:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-[25rem]">
            <div className="text-center">
              <Link href="/" className="inline-flex items-center gap-2" aria-label="SpineSense home">
                <Image src="/brand-mark.png" alt="" width={36} height={64} priority className="h-10 w-auto" />
                <span className="text-xl font-bold tracking-tight">
                  <span className="text-[#0F766E]">Spine</span>
                  <span className="text-[#005AF1]">Sense</span>
                </span>
              </Link>
              <h2 className="mt-8 text-2xl font-bold">{isSignup ? "Create your account" : "Welcome back"}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {isSignup ? "Start building healthier posture habits" : "Sign in to continue to SpineSense"}
              </p>
            </div>

            <div className="mt-8 grid gap-3">
              <button type="button" onClick={() => void oauth("google")} disabled={busy} className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50 disabled:opacity-60">
                <GoogleMark />
                {loadingAction === "google" ? <><Spinner /> Connecting</> : "Continue with Google"}
              </button>
              <button type="button" onClick={() => void oauth("apple")} disabled={busy} className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl bg-[#0F172A] text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                <AppleMark />
                {loadingAction === "apple" ? <><Spinner /> Connecting</> : "Continue with Apple"}
              </button>
            </div>

            <div className="my-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              Or email
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={(event) => void submitEmail(event)} className="space-y-4" noValidate>
              {isSignup ? (
                <label className="block text-sm font-semibold">
                  Full name
                  <input className={inputClass} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
                </label>
              ) : null}
              <label className="block text-sm font-semibold">
                Email address
                <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              </label>
              <div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <label htmlFor="auth-password">Password</label>
                  {!isSignup ? (
                    <button type="button" onClick={() => void forgotPassword()} disabled={busy} className="font-medium text-slate-500 hover:text-[#005AF1]">
                      Forgot password?
                    </button>
                  ) : null}
                </div>
                <input id="auth-password" className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isSignup ? "new-password" : "current-password"} />
              </div>
              {isSignup ? (
                <label className="block text-sm font-semibold">
                  Confirm password
                  <input className={inputClass} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
                </label>
              ) : null}
              <NoticeMessage notice={notice} />
              <button type="submit" disabled={busy} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                {loadingAction === "email" ? <><Spinner /> Please wait</> : isSignup ? "Create account" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isSignup ? "Already have an account" : "Do not have an account"}{" "}
              <button type="button" onClick={() => changeMode(isSignup ? "signIn" : "signUp")} className="font-semibold text-[#005AF1] hover:underline">
                {isSignup ? "Sign in" : "Sign up"}
              </button>
            </p>
            <p className="mt-8 text-center text-xs text-slate-400">
              <Link href="/" className="hover:text-[#005AF1]">Back to home</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DEFAULT_USER_SETTINGS } from "@/lib/auth";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

interface AuthFormProps {
  initialSignupOpen?: boolean;
}

type AuthMode = "signIn" | "signUp";
type Notice = { tone: "error" | "success"; text: string } | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-[#0F172A] outline-none transition focus:border-[#005AF1] focus:ring-4 focus:ring-[#005AF1]/10";

function getErrorMessage(error: unknown, fallback: string): string {
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
  const classes =
    notice.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-700";
  return (
    <p
      role={notice.tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-3 py-2.5 text-sm ${classes}`}
    >
      {notice.text}
    </p>
  );
}

export function AuthForm({ initialSignupOpen = false }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialSignupOpen ? "signUp" : "signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const configured = isSupabaseConfigured();
  const isSignUp = mode === "signUp";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setNotice(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setNotice({ tone: "error", text: emailError ?? passwordError ?? "Check your details" });
      return;
    }
    if (isSignUp && !fullName.trim()) {
      setNotice({ tone: "error", text: "Full name is required" });
      return;
    }
    if (isSignUp && password !== confirmPassword) {
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
      if (isSignUp) {
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
      setNotice({ tone: "error", text: getErrorMessage(error, "Authentication failed") });
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleForgotPassword() {
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
      setNotice({ tone: "error", text: getErrorMessage(error, "Password reset failed") });
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
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
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      if (!data.url) throw new Error("OAuth redirect was not returned");
      window.location.assign(data.url);
    } catch (error) {
      setLoadingAction(null);
      setNotice({ tone: "error", text: getErrorMessage(error, `${provider} sign in failed`) });
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#0F172A]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10 lg:px-12">
        <section className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="SpineSense home">
              <Image src="/brand-mark.png" alt="" width={36} height={64} priority className="h-10 w-auto" />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-[#0F766E]">Spine</span>
                <span className="text-[#005AF1]">Sense</span>
              </span>
            </Link>
            <h1 className="mt-8 text-2xl font-bold">{isSignUp ? "Create your account" : "Welcome back"}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {isSignUp ? "Start building healthier posture habits" : "Sign in to continue to SpineSense"}
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void handleOAuth("google")}
              disabled={loadingAction !== null}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60"
            >
              <span className="text-base font-bold text-[#4285F4]">G</span>
              {loadingAction === "google" ? "Connecting" : "Continue with Google"}
            </button>
            <button
              type="button"
              onClick={() => void handleOAuth("apple")}
              disabled={loadingAction !== null}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[#0F172A] bg-[#0F172A] text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              <span aria-hidden="true">●</span>
              {loadingAction === "apple" ? "Connecting" : "Continue with Apple"}
            </button>
          </div>

          <div className="my-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            Or email
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={(event) => void handleEmailSubmit(event)} className="space-y-4" noValidate>
            {isSignUp ? (
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
                {!isSignUp ? (
                  <button type="button" onClick={() => void handleForgotPassword()} disabled={loadingAction !== null} className="font-medium text-slate-500 hover:text-[#005AF1]">
                    Forgot password?
                  </button>
                ) : null}
              </div>
              <input id="auth-password" className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isSignUp ? "new-password" : "current-password"} />
            </div>
            {isSignUp ? (
              <label className="block text-sm font-semibold">
                Confirm password
                <input className={inputClass} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
              </label>
            ) : null}

            <NoticeMessage notice={notice} />
            <button type="submit" disabled={loadingAction !== null} className="flex h-11 w-full items-center justify-center rounded-xl bg-[#0F172A] text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
              {loadingAction === "email" ? "Please wait" : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isSignUp ? "Already have an account" : "Do not have an account"}{" "}
            <button type="button" onClick={() => switchMode(isSignUp ? "signIn" : "signUp")} className="font-semibold text-[#005AF1] hover:underline">
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AudioLines,
  ChartLine,
  ShieldCheck,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES = [
  {
    title: "Live skeleton overlay",
    icon: Activity,
    tone: "brand" as const,
  },
  {
    title: "Instant posture score",
    icon: ShieldCheck,
    tone: "spine" as const,
  },
  {
    title: "Audio slump alerts",
    icon: AudioLines,
    tone: "brand" as const,
  },
  {
    title: "Session analytics",
    icon: ChartLine,
    tone: "spine" as const,
  },
] as const;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const configured = isSupabaseConfigured();

  function validate(): boolean {
    const next: { email?: string; password?: string } = {};
    const trimmed = email.trim();

    if (!trimmed) next.email = "Email is required.";
    else if (!EMAIL_RE.test(trimmed)) next.email = "Enter a valid email address.";

    if (!password) next.password = "Password is required.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!validate()) {
      setError("Please fix the highlighted fields and try again.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable auth.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        setMessage("Signed in successfully. Redirecting…");
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        setMessage("Account created. Check your email to confirm, then sign in.");
      }
    } catch (err) {
      setMessage(null);
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setMessage(null);
    setFieldErrors({});

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable auth.");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
      {/* Left — value props (reference-style panel) */}
      <aside className="relative hidden flex-col border-r border-line bg-[#F5F7FB] px-10 py-12 xl:px-14 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_12%_18%,rgba(0,90,241,0.10),transparent_55%),radial-gradient(ellipse_45%_40%_at_88%_78%,rgba(1,170,108,0.10),transparent_50%)]"
        />

        <div className="relative flex flex-1 flex-col justify-center">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold leading-[1.12] tracking-tight text-ink xl:text-[2.75rem]">
              Better posture.
              <span className="mt-1 block text-spine">Healthier you.</span>
            </h1>
            <p className="mt-4 text-base text-ink-soft">
              Your ergonomics workspace starts here
            </p>

            <ul className="mt-9 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {FEATURES.map((item) => {
                const Icon = item.icon;
                const tone =
                  item.tone === "spine"
                    ? "from-spine-soft/90 to-white text-spine"
                    : "from-brand-soft to-white text-brand";
                return (
                  <li
                    key={item.title}
                    className={`flex min-h-[8.25rem] flex-col justify-between rounded-2xl border border-white/90 bg-gradient-to-b p-4 shadow-[0_10px_28px_-18px_rgba(15,23,42,0.35)] ${tone}`}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                    <p className="text-sm font-medium leading-5 text-ink">{item.title}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <p className="relative mt-10 text-sm text-ink-soft">
          AI-assisted posture workflows
          <span className="mx-2 text-slate-300">·</span>
          <span className="font-medium text-brand">Real-time skeleton visibility</span>
          <span className="mx-2 text-slate-300">·</span>
          <span className="font-medium text-spine">Green when aligned</span>
        </p>
      </aside>

      {/* Right — form */}
      <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-[22rem]">
          <div className="mb-8 flex flex-col items-center text-center lg:mb-10">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="SpineSense home">
              <Image
                src="/brand-mark.png"
                alt=""
                width={40}
                height={72}
                priority
                className="h-10 w-auto object-contain"
                aria-hidden="true"
              />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-spine">Spine</span>
                <span className="text-brand">Sense</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-ink-soft lg:hidden">
              {mode === "login"
                ? "Sign in to sync sessions and posture history."
                : "Create an account to save analytics across desks."}
            </p>
          </div>

          {!configured ? (
            <p
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              role="status"
            >
              Supabase is not configured yet. Copy{" "}
              <code className="rounded bg-white px-1 py-0.5 text-xs">.env.local.example</code> to{" "}
              <code className="rounded bg-white px-1 py-0.5 text-xs">.env.local</code>.
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm font-semibold text-ink transition-colors hover:bg-mist disabled:opacity-60"
          >
            <GoogleMark />
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <span className="h-px flex-1 bg-line" />
            or email
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={(event) => void handleEmailAuth(event)} className="space-y-4" noValidate>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Email address</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.email)}
                className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink outline-none transition focus:ring-4 ${
                  fieldErrors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                    : "border-line focus:border-brand focus:ring-brand/10"
                }`}
                placeholder="you@company.com"
              />
              {fieldErrors.email ? (
                <span className="mt-1 block text-xs text-red-600" role="alert">
                  {fieldErrors.email}
                </span>
              ) : null}
            </label>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="auth-password" className="text-sm font-semibold text-ink">
                  Password
                </label>
                {mode === "login" ? (
                  <span className="text-xs font-medium text-ink-soft">Forgot password?</span>
                ) : null}
              </div>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink outline-none transition focus:ring-4 ${
                  fieldErrors.password
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                    : "border-line focus:border-brand focus:ring-brand/10"
                }`}
                placeholder="••••••••"
              />
              {fieldErrors.password ? (
                <span className="mt-1 block text-xs text-red-600" role="alert">
                  {fieldErrors.password}
                </span>
              ) : null}
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p
                className="rounded-xl border border-spine/25 bg-spine-soft px-3 py-2 text-sm text-spine-deep"
                role="status"
              >
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0B1F4D] text-sm font-semibold text-white transition-colors hover:bg-[#071536] disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-semibold text-brand hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-brand hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>

          <p className="mt-8 text-center text-xs text-slate-400">
            <Link href="/" className="hover:text-brand">
              ← Back to home
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.1-1.3H12z"
      />
      <path
        fill="#34A853"
        d="M3.9 7.5 6.9 9.7C7.7 7.7 9.7 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.6 2.8 12 2.8 8.3 2.8 5.1 4.9 3.9 7.5z"
      />
      <path
        fill="#4A90E2"
        d="M12 21.2c2.5 0 4.6-.8 6.1-2.2l-2.9-2.3c-.8.6-1.9 1-3.2 1-2.4 0-4.4-1.6-5.1-3.8l-3 2.3C5.1 19.1 8.3 21.2 12 21.2z"
      />
      <path
        fill="#FBBC05"
        d="M6.9 13.9c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7L3.9 8.2C3.3 9.3 3 10.6 3 12s.3 2.7.9 3.8l3-2z"
      />
    </svg>
  );
}

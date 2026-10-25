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

type FieldErrors = Partial<
  Record<
    | "fullName"
    | "age"
    | "phone"
    | "gender"
    | "occupation"
    | "email"
    | "password"
    | "confirmPassword",
    string
  >
>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s()-]{10,16}$/;

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

const GENDER_OPTIONS = [
  { value: "", label: "Select gender" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not", label: "Prefer not to say" },
] as const;

const OCCUPATION_OPTIONS = [
  { value: "", label: "Select work setup" },
  { value: "desk_office", label: "Office / desk job" },
  { value: "remote", label: "Remote / WFH" },
  { value: "student", label: "Student" },
  { value: "healthcare", label: "Healthcare" },
  { value: "other", label: "Other" },
] as const;

const inputClass = (hasError: boolean) =>
  `h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink outline-none transition focus:ring-4 ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
      : "border-line focus:border-brand focus:ring-brand/10"
  }`;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const configured = isSupabaseConfigured();
  const isSignup = mode === "signup";

  function clearField(key: keyof FieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(): boolean {
    const next: FieldErrors = {};
    const trimmedEmail = email.trim();

    if (isSignup) {
      const name = fullName.trim();
      if (!name) next.fullName = "Full name is required.";
      else if (name.length < 2) next.fullName = "Enter your full name.";

      const ageNum = Number(age);
      if (!age.trim()) next.age = "Age is required.";
      else if (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 100) {
        next.age = "Enter a valid age (13–100).";
      }

      const phoneTrim = phone.trim();
      if (!phoneTrim) next.phone = "Contact number is required.";
      else if (!PHONE_RE.test(phoneTrim)) {
        next.phone = "Enter a valid phone number.";
      }

      if (!gender) next.gender = "Please select an option.";
      if (!occupation) next.occupation = "Please select your work setup.";

      if (!confirmPassword) next.confirmPassword = "Confirm your password.";
      else if (confirmPassword !== password) {
        next.confirmPassword = "Passwords do not match.";
      }
    }

    if (!trimmedEmail) next.email = "Email is required.";
    else if (!EMAIL_RE.test(trimmedEmail)) next.email = "Enter a valid email address.";

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
          options: {
            data: {
              full_name: fullName.trim(),
              age: Number(age),
              phone: phone.trim(),
              gender,
              occupation,
            },
          },
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
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.9fr)]">
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

      <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:max-h-screen lg:overflow-y-auto lg:px-12 xl:px-16">
        <div className={`mx-auto w-full ${isSignup ? "max-w-md" : "max-w-[22rem]"}`}>
          <div className="mb-7 flex flex-col items-center text-center lg:mb-8">
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
            <p className="mt-3 text-sm text-ink-soft">
              {isSignup
                ? "Tell us a bit about you so we can personalize posture coaching."
                : "Sign in to sync sessions and posture history."}
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

          <form onSubmit={(event) => void handleEmailAuth(event)} className="space-y-3.5" noValidate>
            {isSignup ? (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink">Full name</span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      clearField("fullName");
                    }}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    className={inputClass(Boolean(fieldErrors.fullName))}
                    placeholder="Ayesha Khan"
                  />
                  {fieldErrors.fullName ? (
                    <span className="mt-1 block text-xs text-red-600" role="alert">
                      {fieldErrors.fullName}
                    </span>
                  ) : null}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-ink">Age</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={13}
                      max={100}
                      value={age}
                      onChange={(event) => {
                        setAge(event.target.value);
                        clearField("age");
                      }}
                      aria-invalid={Boolean(fieldErrors.age)}
                      className={inputClass(Boolean(fieldErrors.age))}
                      placeholder="28"
                    />
                    {fieldErrors.age ? (
                      <span className="mt-1 block text-xs text-red-600" role="alert">
                        {fieldErrors.age}
                      </span>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-ink">Gender</span>
                    <select
                      value={gender}
                      onChange={(event) => {
                        setGender(event.target.value);
                        clearField("gender");
                      }}
                      aria-invalid={Boolean(fieldErrors.gender)}
                      className={`${inputClass(Boolean(fieldErrors.gender))} ${
                        gender ? "text-ink" : "text-slate-400"
                      }`}
                    >
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option.value || "empty"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.gender ? (
                      <span className="mt-1 block text-xs text-red-600" role="alert">
                        {fieldErrors.gender}
                      </span>
                    ) : null}
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink">Contact number</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      clearField("phone");
                    }}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    className={inputClass(Boolean(fieldErrors.phone))}
                    placeholder="+92 300 1234567"
                  />
                  {fieldErrors.phone ? (
                    <span className="mt-1 block text-xs text-red-600" role="alert">
                      {fieldErrors.phone}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink">Work setup</span>
                  <select
                    value={occupation}
                    onChange={(event) => {
                      setOccupation(event.target.value);
                      clearField("occupation");
                    }}
                    aria-invalid={Boolean(fieldErrors.occupation)}
                    className={`${inputClass(Boolean(fieldErrors.occupation))} ${
                      occupation ? "text-ink" : "text-slate-400"
                    }`}
                  >
                    {OCCUPATION_OPTIONS.map((option) => (
                      <option key={option.value || "empty"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.occupation ? (
                    <span className="mt-1 block text-xs text-red-600" role="alert">
                      {fieldErrors.occupation}
                    </span>
                  ) : null}
                </label>
              </>
            ) : null}

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Email address</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearField("email");
                }}
                aria-invalid={Boolean(fieldErrors.email)}
                className={inputClass(Boolean(fieldErrors.email))}
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
                {!isSignup ? (
                  <span className="text-xs font-medium text-ink-soft">Forgot password?</span>
                ) : null}
              </div>
              <input
                id="auth-password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearField("password");
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                className={inputClass(Boolean(fieldErrors.password))}
                placeholder="••••••••"
              />
              {fieldErrors.password ? (
                <span className="mt-1 block text-xs text-red-600" role="alert">
                  {fieldErrors.password}
                </span>
              ) : null}
            </div>

            {isSignup ? (
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">Confirm password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    clearField("confirmPassword");
                  }}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  className={inputClass(Boolean(fieldErrors.confirmPassword))}
                  placeholder="••••••••"
                />
                {fieldErrors.confirmPassword ? (
                  <span className="mt-1 block text-xs text-red-600" role="alert">
                    {fieldErrors.confirmPassword}
                  </span>
                ) : null}
              </label>
            ) : null}

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
              {loading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-brand hover:underline">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-semibold text-brand hover:underline">
                  Sign up
                </Link>
              </>
            )}
          </p>

          <p className="mt-6 text-center text-xs text-slate-400">
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

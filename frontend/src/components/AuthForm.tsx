"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AudioLines,
  ChartLine,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { signInUser, signUpUser } from "@/lib/auth";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

interface AuthFormProps {
  /** Open the signup modal on first paint (e.g. /signup route). */
  initialSignupOpen?: boolean;
}

type LoginErrors = Partial<Record<"email" | "password", string>>;
type SignupErrors = Partial<
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
  { title: "Live skeleton overlay", icon: Activity, tone: "brand" as const },
  { title: "Instant posture score", icon: ShieldCheck, tone: "spine" as const },
  { title: "Audio slump alerts", icon: AudioLines, tone: "brand" as const },
  { title: "Session analytics", icon: ChartLine, tone: "spine" as const },
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

export function AuthForm({ initialSignupOpen = false }: AuthFormProps) {
  const router = useRouter();
  const titleId = useId();
  const [signupOpen, setSignupOpen] = useState(initialSignupOpen);
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupErrors, setSignupErrors] = useState<SignupErrors>({});
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupMessage, setSignupMessage] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!signupOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSignupOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [signupOpen]);

  function validateLogin(): boolean {
    const next: LoginErrors = {};
    const trimmed = email.trim();
    if (!trimmed) next.email = "Email is required.";
    else if (!EMAIL_RE.test(trimmed)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setLoginErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateSignup(): boolean {
    const next: SignupErrors = {};
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
    else if (!PHONE_RE.test(phoneTrim)) next.phone = "Enter a valid phone number.";

    if (!gender) next.gender = "Please select an option.";
    if (!occupation) next.occupation = "Please select your work setup.";

    const mail = signupEmail.trim();
    if (!mail) next.email = "Email is required.";
    else if (!EMAIL_RE.test(mail)) next.email = "Enter a valid email address.";

    if (!signupPassword) next.password = "Password is required.";
    else if (signupPassword.length < 6) next.password = "Password must be at least 6 characters.";

    if (!confirmPassword) next.confirmPassword = "Confirm your password.";
    else if (confirmPassword !== signupPassword) next.confirmPassword = "Passwords do not match.";

    setSignupErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);
    setLoginMessage(null);
    if (!validateLogin()) {
      setLoginError("Please fix the highlighted fields and try again.");
      return;
    }

    if (!configured) {
      setLoginError("Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable auth.");
      return;
    }

    setLoading(true);
    try {
      await signInUser(email.trim(), password);
      setLoginMessage("Signed in successfully. Redirecting…");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupError(null);
    setSignupMessage(null);
    if (!validateSignup()) {
      setSignupError("Please fix the highlighted fields and try again.");
      return;
    }

    if (!configured) {
      setSignupError("Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable auth.");
      return;
    }

    setLoading(true);
    try {
      const { session } = await signUpUser(
        signupEmail.trim(),
        signupPassword,
        fullName.trim(),
        {
          age: Number(age),
          phone: phone.trim(),
          gender,
          occupation,
        },
      );

      if (session) {
        setSignupMessage("Account created. Redirecting to your dashboard…");
        router.push("/dashboard");
        router.refresh();
      } else {
        setSignupMessage(
          "Account created. Check your email to confirm, then sign in.",
        );
      }
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setLoginError(null);
    setSignupError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      const msg = "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable auth.";
      if (signupOpen) setSignupError(msg);
      else setLoginError(msg);
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (authError) throw authError;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : provider === "apple"
            ? "Apple sign-in failed."
            : "Google sign-in failed.";
      if (signupOpen) setSignupError(msg);
      else setLoginError(msg);
      setLoading(false);
    }
  }

  const modal =
    mounted && signupOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
              aria-label="Close signup dialog"
              onClick={() => setSignupOpen(false)}
            />

            <div className="relative flex max-h-[min(92vh,44rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <button
                type="button"
                onClick={() => setSignupOpen(false)}
                className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-slate-600 transition-colors hover:bg-mist"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="overflow-y-auto px-6 py-7 sm:px-8 sm:py-8">
                <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                  <Link href="/" className="inline-flex items-center gap-2" aria-label="SpineSense home">
                    <Image
                      src="/brand-mark.png"
                      alt=""
                      width={36}
                      height={64}
                      className="h-9 w-auto object-contain"
                      aria-hidden="true"
                    />
                    <span className="text-lg font-bold tracking-tight">
                      <span className="text-spine">Spine</span>
                      <span className="text-brand">Sense</span>
                    </span>
                  </Link>
                  <h2 id={titleId} className="mt-4 text-2xl font-bold tracking-tight text-ink">
                    Create your account
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-soft">
                    Share a few details so we can personalize posture coaching.
                  </p>
                </div>

                {!configured ? (
                  <p
                    className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                    role="status"
                  >
                    Supabase is not configured yet. Copy{" "}
                    <code className="rounded bg-white px-1 py-0.5 text-xs">.env.local.example</code> to{" "}
                    <code className="rounded bg-white px-1 py-0.5 text-xs">.env.local</code>.
                  </p>
                ) : null}

                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void handleOAuth("google")}
                    disabled={loading}
                    className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl border border-line bg-white text-sm font-semibold text-ink transition-colors hover:bg-mist disabled:opacity-60"
                  >
                    <GoogleMark />
                    Continue with Google
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleOAuth("apple")}
                    disabled={loading}
                    className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl border border-ink bg-ink text-sm font-semibold text-white transition-colors hover:bg-[#1e293b] disabled:opacity-60"
                  >
                    <AppleMark />
                    Continue with Apple
                  </button>
                </div>

                <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span className="h-px flex-1 bg-line" />
                  or email
                  <span className="h-px flex-1 bg-line" />
                </div>

                <form onSubmit={(event) => void handleSignup(event)} className="space-y-3.5" noValidate>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-ink">Full name</span>
                    <input
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setSignupErrors((p) => ({ ...p, fullName: undefined }));
                      }}
                      className={inputClass(Boolean(signupErrors.fullName))}
                      placeholder="Ayesha Khan"
                    />
                    {signupErrors.fullName ? (
                      <span className="mt-1 block text-xs text-red-600">{signupErrors.fullName}</span>
                    ) : null}
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">Age</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={13}
                        max={100}
                        value={age}
                        onChange={(e) => {
                          setAge(e.target.value);
                          setSignupErrors((p) => ({ ...p, age: undefined }));
                        }}
                        className={inputClass(Boolean(signupErrors.age))}
                        placeholder="28"
                      />
                      {signupErrors.age ? (
                        <span className="mt-1 block text-xs text-red-600">{signupErrors.age}</span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">Gender</span>
                      <select
                        value={gender}
                        onChange={(e) => {
                          setGender(e.target.value);
                          setSignupErrors((p) => ({ ...p, gender: undefined }));
                        }}
                        className={`${inputClass(Boolean(signupErrors.gender))} ${
                          gender ? "text-ink" : "text-slate-400"
                        }`}
                      >
                        {GENDER_OPTIONS.map((o) => (
                          <option key={o.value || "empty"} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {signupErrors.gender ? (
                        <span className="mt-1 block text-xs text-red-600">{signupErrors.gender}</span>
                      ) : null}
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">Contact number</span>
                      <input
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setSignupErrors((p) => ({ ...p, phone: undefined }));
                        }}
                        className={inputClass(Boolean(signupErrors.phone))}
                        placeholder="+92 300 1234567"
                      />
                      {signupErrors.phone ? (
                        <span className="mt-1 block text-xs text-red-600">{signupErrors.phone}</span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">Work setup</span>
                      <select
                        value={occupation}
                        onChange={(e) => {
                          setOccupation(e.target.value);
                          setSignupErrors((p) => ({ ...p, occupation: undefined }));
                        }}
                        className={`${inputClass(Boolean(signupErrors.occupation))} ${
                          occupation ? "text-ink" : "text-slate-400"
                        }`}
                      >
                        {OCCUPATION_OPTIONS.map((o) => (
                          <option key={o.value || "empty"} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {signupErrors.occupation ? (
                        <span className="mt-1 block text-xs text-red-600">{signupErrors.occupation}</span>
                      ) : null}
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-ink">Email address</span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={signupEmail}
                      onChange={(e) => {
                        setSignupEmail(e.target.value);
                        setSignupErrors((p) => ({ ...p, email: undefined }));
                      }}
                      className={inputClass(Boolean(signupErrors.email))}
                      placeholder="you@company.com"
                    />
                    {signupErrors.email ? (
                      <span className="mt-1 block text-xs text-red-600">{signupErrors.email}</span>
                    ) : null}
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">Password</span>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={signupPassword}
                        onChange={(e) => {
                          setSignupPassword(e.target.value);
                          setSignupErrors((p) => ({ ...p, password: undefined }));
                        }}
                        className={inputClass(Boolean(signupErrors.password))}
                        placeholder="••••••••"
                      />
                      {signupErrors.password ? (
                        <span className="mt-1 block text-xs text-red-600">{signupErrors.password}</span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">Confirm password</span>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setSignupErrors((p) => ({ ...p, confirmPassword: undefined }));
                        }}
                        className={inputClass(Boolean(signupErrors.confirmPassword))}
                        placeholder="••••••••"
                      />
                      {signupErrors.confirmPassword ? (
                        <span className="mt-1 block text-xs text-red-600">
                          {signupErrors.confirmPassword}
                        </span>
                      ) : null}
                    </label>
                  </div>

                  {signupError ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {signupError}
                    </p>
                  ) : null}
                  {signupMessage ? (
                    <p className="rounded-xl border border-spine/25 bg-spine-soft px-3 py-2 text-sm text-spine-deep">
                      {signupMessage}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0B1F4D] text-sm font-semibold text-white transition-colors hover:bg-[#071536] disabled:opacity-60"
                  >
                    {loading ? "Please wait…" : "Create account"}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-ink-soft">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setSignupOpen(false)}
                    className="font-semibold text-brand hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {/* Orbix-style split: both panes min-h-screen, content vertically centered */}
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <aside className="relative flex flex-col justify-between bg-[#F5F7FB] px-8 py-10 sm:px-12 lg:px-14 lg:py-12">
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
              <p className="mt-4 text-base text-ink-soft">Your ergonomics workspace starts here</p>

              <ul className="mt-10 grid grid-cols-2 gap-3 xl:grid-cols-4">
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

        <section className="flex flex-col justify-center bg-white px-6 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-[22rem]">
            <div className="flex flex-col items-center text-center">
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
            </div>

            {!configured ? (
              <p
                className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                role="status"
              >
                Supabase is not configured yet. Copy{" "}
                <code className="rounded bg-white px-1 py-0.5 text-xs">.env.local.example</code> to{" "}
                <code className="rounded bg-white px-1 py-0.5 text-xs">.env.local</code>.
              </p>
            ) : null}

            <div className="mt-8 grid gap-2.5">
              <button
                type="button"
                onClick={() => void handleOAuth("google")}
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-white text-sm font-semibold text-ink transition-colors hover:bg-mist disabled:opacity-60"
              >
                <GoogleMark />
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => void handleOAuth("apple")}
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-ink bg-ink text-sm font-semibold text-white transition-colors hover:bg-[#1e293b] disabled:opacity-60"
              >
                <AppleMark />
                Continue with Apple
              </button>
            </div>

            <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span className="h-px flex-1 bg-line" />
              or email
              <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={(event) => void handleLogin(event)} className="space-y-4" noValidate>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">Email address</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLoginErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className={inputClass(Boolean(loginErrors.email))}
                  placeholder="you@company.com"
                />
                {loginErrors.email ? (
                  <span className="mt-1 block text-xs text-red-600">{loginErrors.email}</span>
                ) : null}
              </label>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="login-password" className="text-sm font-semibold text-ink">
                    Password
                  </label>
                  <span className="text-xs font-medium text-ink-soft">Forgot password?</span>
                </div>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginErrors((p) => ({ ...p, password: undefined }));
                  }}
                  className={inputClass(Boolean(loginErrors.password))}
                  placeholder="Enter your password"
                />
                {loginErrors.password ? (
                  <span className="mt-1 block text-xs text-red-600">{loginErrors.password}</span>
                ) : null}
              </div>

              {loginError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {loginError}
                </p>
              ) : null}
              {loginMessage ? (
                <p className="rounded-xl border border-spine/25 bg-spine-soft px-3 py-2 text-sm text-spine-deep">
                  {loginMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0B1F4D] text-sm font-semibold text-white transition-colors hover:bg-[#071536] disabled:opacity-60"
              >
                {loading ? "Please wait…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-soft">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setSignupOpen(true)}
                className="font-semibold text-brand hover:underline"
              >
                Sign up
              </button>
            </p>

            <p className="mt-8 text-center text-xs text-slate-400">
              <Link href="/" className="hover:text-brand">
                ← Back to home
              </Link>
            </p>
          </div>
        </section>
      </div>

      {modal}
    </>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.42 2.23-1.18 3.1-.79.9-2.1 1.6-3.2 1.5-.14-1.1.4-2.26 1.14-3.12.8-.92 2.2-1.6 3.24-1.48ZM19.5 17.2c-.55 1.26-.82 1.82-1.54 2.93-.99 1.5-2.39 3.37-4.13 3.39-1.54.02-1.94-.99-4.04-.98-2.1.01-2.54 1-4.08.98-1.74-.02-3.07-1.7-4.06-3.2-2.77-4.2-3.06-9.14-1.35-11.74 1.2-1.82 3.1-2.88 4.88-2.88 1.82 0 2.96 1 4.46 1 1.45 0 2.33-1.01 4.43-1.01 1.58 0 3.25.86 4.44 2.35-3.9 2.14-3.27 7.7.99 9.16Z" />
    </svg>
  );
}

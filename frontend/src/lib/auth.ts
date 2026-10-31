import type { AuthError, Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

export const DEFAULT_USER_SETTINGS = {
  email_reports_enabled: true,
  report_frequency: "weekly" as const,
  slouch_sensitivity: 20,
  grace_period_seconds: 3,
  audio_alerts_enabled: true,
};

export type SignUpResult = {
  user: User;
  session: Session | null;
};

export type SignInResult = {
  user: User;
  session: Session;
  /** Access token (JWT) for the active session. */
  accessToken: string;
};

function requireClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return client;
}

function authMessage(error: AuthError | Error | null | undefined, fallback: string) {
  if (!error) return fallback;
  return error.message || fallback;
}

/**
 * Registers a user with Supabase Auth and inserts default `user_settings`.
 */
export async function signUpUser(
  email: string,
  password: string,
  fullName: string,
  metadata?: Record<string, unknown>,
): Promise<SignUpResult> {
  const supabase = requireClient();
  const trimmedEmail = email.trim();
  const trimmedName = fullName.trim();

  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      data: {
        full_name: trimmedName,
        ...metadata,
      },
    },
  });

  if (error) throw new Error(authMessage(error, "Sign up failed."));
  if (!data.user) throw new Error("Sign up failed: no user returned.");

  // Prefer authenticated session insert; fall back to upsert when session exists.
  // If email confirmation is required and there is no session, a DB trigger
  // (see supabase/migrations) still creates the row on auth.users insert.
  if (data.session) {
    const { error: settingsError } = await supabase.from("user_settings").upsert(
      {
        user_id: data.user.id,
        ...DEFAULT_USER_SETTINGS,
      },
      { onConflict: "user_id" },
    );

    if (settingsError) {
      throw new Error(
        settingsError.message ||
          "Account created, but default settings could not be saved.",
      );
    }
  }

  return { user: data.user, session: data.session };
}

/**
 * Logs in with email/password and returns the session JWT.
 */
export async function signInUser(
  email: string,
  password: string,
): Promise<SignInResult> {
  const supabase = requireClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw new Error(authMessage(error, "Sign in failed."));
  if (!data.session || !data.user) {
    throw new Error("Sign in failed: no session returned.");
  }

  return {
    user: data.user,
    session: data.session,
    accessToken: data.session.access_token,
  };
}

/** Clears the active Supabase Auth session. */
export async function signOutUser(): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(authMessage(error, "Sign out failed."));
}

/**
 * Starts Google / Apple OAuth. Requires the provider to be enabled in
 * Supabase Dashboard → Authentication → Providers (with Client ID + Secret).
 */
export async function signInWithOAuthProvider(
  provider: "google" | "apple",
  redirectTo?: string,
): Promise<void> {
  const supabase = requireClient();

  // Server-side probe → clear in-app error instead of a raw Supabase 400 page.
  try {
    const check = await fetch(`/api/auth/oauth-check?provider=${provider}`);
    const payload = (await check.json()) as {
      ok?: boolean;
      message?: string;
    };
    if (payload.ok === false) {
      throw new Error(
        payload.message ||
          `${provider === "apple" ? "Apple" : "Google"} sign-in is not available.`,
      );
    }
  } catch (err) {
    if (err instanceof Error && /not enabled in Supabase|not available/i.test(err.message)) {
      throw err;
    }
    // Probe unavailable — continue with normal OAuth redirect.
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo:
        redirectTo ??
        (typeof window !== "undefined"
          ? `${window.location.origin}/dashboard`
          : undefined),
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    const raw = authMessage(error, `${provider} sign-in failed.`);
    if (/not enabled|unsupported provider/i.test(raw)) {
      throw new Error(
        `${provider === "apple" ? "Apple" : "Google"} sign-in is not enabled in Supabase yet. Turn it on under Authentication → Providers and add Client ID + Secret.`,
      );
    }
    throw new Error(raw);
  }

  if (!data.url) {
    throw new Error(
      `${provider === "apple" ? "Apple" : "Google"} sign-in failed: no redirect URL.`,
    );
  }

  window.location.assign(data.url);
}

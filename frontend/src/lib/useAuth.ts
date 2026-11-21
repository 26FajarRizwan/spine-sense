"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { signOutUser } from "@/lib/auth";
import {
  resolveSettings,
  saveSettings,
  settingsFromMetadata,
  type UserSettings,
} from "@/lib/settings";
import {
  getSupabaseBrowserClient,
} from "@/lib/supabaseClient";

export interface AuthUserInfo {
  id: string;
  email: string | null;
  fullName: string | null;
  initials: string;
  settings: Partial<UserSettings>;
}

function toInfo(user: User): AuthUserInfo {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fullName =
    typeof meta?.full_name === "string" && meta.full_name.trim()
      ? meta.full_name.trim()
      : null;
  const email = user.email ?? null;
  const source = fullName || email || "U";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const initials = (
    parts.length >= 2
      ? `${parts[0]![0]}${parts[1]![0]}`
      : source.slice(0, 2)
  ).toUpperCase();

  return { id: user.id, email, fullName, initials, settings: settingsFromMetadata(meta) };
}

function hydrateStoredSettings(user: User): void {
  const stored = settingsFromMetadata(user.user_metadata);
  if (Object.keys(stored).length > 0) saveSettings(resolveSettings(stored));
}

export function useAuth() {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<AuthUserInfo | null>(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));

  useEffect(() => {
    let cancelled = false;

    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session?.user) hydrateStoredSettings(data.session.user);
      setUser(data.session?.user ? toInfo(data.session.user) : null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user) hydrateStoredSettings(session.user);
      setUser(session?.user ? toInfo(session.user) : null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    try {
      if (supabase) await signOutUser();
    } finally {
      setUser(null);
    }
  }

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    signOut,
  };
}

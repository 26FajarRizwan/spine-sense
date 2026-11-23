"use client";

import { useEffect, useRef, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
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
  displayName: string;
  initials: string;
  settings: Partial<UserSettings>;
}

function metadataName(meta: Record<string, unknown> | undefined): string | null {
  for (const key of ["full_name", "display_name"]) {
    const value = meta?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function toInfo(user: User, profileName: string | null = null): AuthUserInfo {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fullName = metadataName(meta) ?? profileName;
  const email = user.email ?? null;
  const displayName = fullName || email?.split("@")[0] || "Account";
  const source = fullName || email || "U";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const initials = (
    parts.length >= 2
      ? `${parts[0]![0]}${parts[1]![0]}`
      : source.slice(0, 2)
  ).toUpperCase();

  return {
    id: user.id,
    email,
    fullName,
    displayName,
    initials,
    settings: settingsFromMetadata(meta),
  };
}

function hydrateStoredSettings(user: User): void {
  const stored = settingsFromMetadata(user.user_metadata);
  if (Object.keys(stored).length > 0) saveSettings(resolveSettings(stored));
}

async function loadProfileName(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    if (error || typeof data?.full_name !== "string") return null;
    return data.full_name.trim() || null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<AuthUserInfo | null>(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const profileNameRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!supabase) {
      return;
    }

    async function refreshFromServer(fallback: User) {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const fresh = data.user ?? fallback;
      hydrateStoredSettings(fresh);
      profileNameRef.current = metadataName(
        fresh.user_metadata as Record<string, unknown> | undefined,
      )
        ? null
        : await loadProfileName(supabase, fresh.id);
      if (!cancelled) setUser(toInfo(fresh, profileNameRef.current));
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const sessionUser = data.session?.user;
      if (sessionUser) hydrateStoredSettings(sessionUser);
      setUser(sessionUser ? toInfo(sessionUser, profileNameRef.current) : null);
      setLoading(false);
      if (sessionUser) void refreshFromServer(sessionUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      const sessionUser = session?.user;
      if (sessionUser) hydrateStoredSettings(sessionUser);
      setUser(sessionUser ? toInfo(sessionUser, profileNameRef.current) : null);
      setLoading(false);
      if (event === "SIGNED_IN" && sessionUser) {
        window.setTimeout(() => void refreshFromServer(sessionUser), 0);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    if (supabase) await signOutUser();
  }

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    signOut,
  };
}

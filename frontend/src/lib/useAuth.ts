"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export interface AuthUserInfo {
  id: string;
  email: string | null;
  fullName: string | null;
  initials: string;
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

  return { id: user.id, email, fullName, initials };
}

export function useAuth() {
  const [user, setUser] = useState<AuthUserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!isSupabaseConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setUser(null);
      setLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setUser(data.session?.user ? toInfo(data.session.user) : null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ? toInfo(session.user) : null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    signOut,
  };
}

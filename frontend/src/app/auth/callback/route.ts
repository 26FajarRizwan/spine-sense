import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_USER_SETTINGS } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = request.nextUrl.origin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!code || !url || !anonKey) {
    return NextResponse.redirect(new URL("/login?error=oauth_callback_failed", origin));
  }

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session || !data.user) {
    return NextResponse.redirect(new URL("/login?error=oauth_callback_failed", origin));
  }

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  const { error: settingsError } = await supabase.from("user_settings").upsert(
    { user_id: data.user.id, ...DEFAULT_USER_SETTINGS },
    { onConflict: "user_id" },
  );

  if (settingsError) {
    return NextResponse.redirect(new URL("/login?error=settings_setup_failed", origin));
  }

  return NextResponse.redirect(new URL("/dashboard", origin));
}

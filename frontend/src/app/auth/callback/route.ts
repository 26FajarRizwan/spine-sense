import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_USER_SETTINGS } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function loginRedirect(request: NextRequest, message: string) {
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
  );
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const errorDescription = request.nextUrl.searchParams.get("error_description");

  if (errorDescription) {
    return loginRedirect(request, errorDescription);
  }

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const otpType = request.nextUrl.searchParams.get("type") as EmailOtpType | null;

  if (!code && !(tokenHash && otpType)) {
    return loginRedirect(request, "Authorization code is missing");
  }

  const next = request.nextUrl.searchParams.get("next");
  const destination = next && /^\/(?![/\\])/.test(next) ? next : "/dashboard";
  const response = NextResponse.redirect(new URL(destination, request.url));
  const supabase = createSupabaseServerClient(request, response);
  const { data, error } =
    code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: otpType! });

  if (error && /code verifier|flow state/i.test(error.message)) {
    return NextResponse.redirect(new URL("/login?verified=true", request.url));
  }

  if (error || !data.user) {
    return loginRedirect(
      request,
      error?.message ?? "Authentication callback failed",
    );
  }

  const { error: settingsError } = await supabase.from("user_settings").upsert(
    { user_id: data.user.id, ...DEFAULT_USER_SETTINGS },
    { onConflict: "user_id", ignoreDuplicates: true },
  );

  if (settingsError) {
    return loginRedirect(request, settingsError.message);
  }

  return response;
}

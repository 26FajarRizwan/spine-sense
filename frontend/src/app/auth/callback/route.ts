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

  if (!code) {
    return loginRedirect(request, "Authorization code is missing");
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  const supabase = createSupabaseServerClient(request, response);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

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

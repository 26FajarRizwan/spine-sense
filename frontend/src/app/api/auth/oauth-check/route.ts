import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");

  if (provider !== "google" && provider !== "apple") {
    return NextResponse.json(
      { ok: false, message: "Unsupported provider." },
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, message: "Supabase env vars are missing." },
      { status: 500 },
    );
  }

  const origin = new URL(request.url).origin;
  const authorize = new URL(`${url}/auth/v1/authorize`);
  authorize.searchParams.set("provider", provider);
  authorize.searchParams.set("redirect_to", `${origin}/dashboard`);

  try {
    const res = await fetch(authorize.toString(), {
      method: "GET",
      redirect: "manual",
      headers: { apikey: anonKey },
    });

    if (res.status >= 400) {
      let detail = "";
      try {
        const body = (await res.json()) as { msg?: string; message?: string };
        detail = body.msg || body.message || "";
      } catch {
        /* ignore */
      }

      const disabled = /not enabled|unsupported provider/i.test(detail);
      return NextResponse.json(
        {
          ok: false,
          disabled,
          message: disabled
            ? `${provider === "apple" ? "Apple" : "Google"} sign-in is not enabled in Supabase yet. Turn it on under Authentication → Providers and add Client ID + Secret.`
            : detail || `${provider} sign-in failed (${res.status}).`,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    // If the probe fails, let the client continue the normal OAuth redirect.
    return NextResponse.json({ ok: true, probeSkipped: true });
  }
}

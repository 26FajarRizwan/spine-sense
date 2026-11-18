"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CopyrightYear } from "@/components/CopyrightYear";
import { useAuth } from "@/lib/useAuth";

const GUEST_NAV = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo Session" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Sign Up" },
] as const;

const AUTH_NAV = [
  { href: "/", label: "Home" },
  { href: "/session", label: "Live Session" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "My Profile" },
] as const;

const GUEST_PRODUCT = [
  { href: "/demo", label: "Live demo" },
  { href: "/dashboard", label: "Analytics" },
  { href: "/signup", label: "Create account" },
] as const;

const AUTH_PRODUCT = [
  { href: "/profile", label: "My Profile" },
  { href: "/session", label: "Live Session" },
] as const;

export function Footer() {
  const router = useRouter();
  const { isAuthenticated, signOut } = useAuth();
  const navigation = isAuthenticated ? AUTH_NAV : GUEST_NAV;
  const product = isAuthenticated ? AUTH_PRODUCT : GUEST_PRODUCT;

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/70 backdrop-blur-sm">
      <div className="container mx-auto grid gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center" aria-label="SpineSense home">
            <span className="inline-flex items-center gap-2.5">
              <Image src="/brand-mark.png" alt="" width={48} height={86} aria-hidden="true" className="h-12 w-auto object-contain" />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-spine">Spine</span>
                <span className="text-brand">Sense</span>
              </span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
            Realtime AI posture and ergonomics assistant for healthier desk sessions.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <a href="mailto:hello@spinesense.app" className="block font-medium text-brand underline-offset-2 hover:underline">
              hello@spinesense.app
            </a>
            <a href="tel:+18005550123" className="block font-medium text-slate-700 underline-offset-2 hover:underline">
              +1 800 555 0123
            </a>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Navigation</h2>
          <ul className="mt-4 space-y-2.5">
            {navigation.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="text-sm text-slate-700 transition-colors hover:text-brand">{item.label}</Link>
              </li>
            ))}
            {isAuthenticated ? (
              <li>
                <button type="button" onClick={() => void handleSignOut()} className="text-sm text-slate-700 transition-colors hover:text-brand">
                  Sign out
                </button>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Product</h2>
          <ul className="mt-4 space-y-2.5">
            {product.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="text-sm text-slate-700 transition-colors hover:text-brand">{item.label}</Link>
              </li>
            ))}
            {isAuthenticated ? (
              <li>
                <button type="button" onClick={() => void handleSignOut()} className="text-sm text-slate-700 transition-colors hover:text-brand">
                  Sign out
                </button>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Features</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
            <li>Live skeleton overlay</li>
            <li>Realtime posture score</li>
            <li>Slump audio alerts</li>
            <li>Session analytics</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="container mx-auto flex flex-col gap-2 px-6 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© <CopyrightYear /> SpineSense. Better posture · healthier you.</p>
          {isAuthenticated ? (
            <p className="flex items-center gap-3">
              <Link href="/profile" className="hover:text-brand">My Profile</Link>
              <Link href="/session" className="hover:text-brand">Live Session</Link>
              <button type="button" onClick={() => void handleSignOut()} className="hover:text-brand">Sign out</button>
            </p>
          ) : (
            <p className="flex items-center gap-3">
              <Link href="/login" className="hover:text-brand">Login</Link>
              <Link href="/signup" className="hover:text-brand">Sign up</Link>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}

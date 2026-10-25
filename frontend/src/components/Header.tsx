"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/useAuth";

const GUEST_NAV = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/session", label: "Demo Session" },
] as const;

const AUTH_NAV = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/session", label: "Demo Session" },
] as const;

function BrandLockup() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/brand-mark.png"
        alt=""
        width={40}
        height={72}
        priority
        aria-hidden="true"
        className="h-10 w-auto object-contain object-center"
      />
      <span className="leading-none">
        <span className="block text-base font-bold tracking-tight sm:text-lg">
          <span className="text-spine">Spine</span>
          <span className="text-brand">Sense</span>
        </span>
        <span className="mt-1 hidden text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500 xl:block">
          Better posture <span className="text-spine">•</span> healthier you
        </span>
      </span>
    </span>
  );
}

function isActivePath(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = isAuthenticated ? AUTH_NAV : GUEST_NAV;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function handleSignOut() {
    setMenuOpen(false);
    setOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  const drawer =
    mounted && open
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] md:hidden"
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="absolute inset-0 flex flex-col bg-white">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4 sm:px-5">
                <Link
                  href="/"
                  aria-label="SpineSense home"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2"
                >
                  <Image
                    src="/brand-mark.png"
                    alt=""
                    width={28}
                    height={50}
                    className="h-8 w-auto object-contain"
                    aria-hidden="true"
                  />
                  <span className="text-base font-bold tracking-tight">
                    <span className="text-spine">Spine</span>
                    <span className="text-brand">Sense</span>
                  </span>
                </Link>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line text-slate-700"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav
                aria-label="Mobile"
                className="flex flex-1 flex-col gap-1 overflow-y-auto p-4"
              >
                {navItems.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`rounded-xl px-4 py-3.5 text-base font-medium ${
                        active ? "bg-brand-soft text-brand" : "text-slate-700"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="rounded-xl px-4 py-3.5 text-base font-medium text-slate-700"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setOpen(false)}
                      className="rounded-xl px-4 py-3.5 text-base font-medium text-slate-700"
                    >
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      className="rounded-xl px-4 py-3.5 text-left text-base font-medium text-red-600"
                    >
                      Sign Out
                    </button>
                  </>
                ) : null}
              </nav>

              {!isAuthenticated ? (
                <div className="shrink-0 space-y-3 border-t border-line p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-line text-sm font-semibold text-ink"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-12 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/95 backdrop-blur-md">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-brand focus:px-3 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>

        <div className="container relative mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="relative z-10 inline-flex min-w-0 shrink-0"
            aria-label="SpineSense home"
          >
            <BrandLockup />
          </Link>

          <nav
            aria-label="Primary"
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex"
          >
            {!authLoading
              ? navItems.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative whitespace-nowrap px-3.5 py-2 text-sm font-medium transition-colors ${
                        active ? "text-brand" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-brand"
                        />
                      ) : null}
                    </Link>
                  );
                })
              : null}
          </nav>

          <div className="relative z-10 flex shrink-0 items-center justify-end gap-2">
            {!authLoading && !isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="hidden h-10 items-center justify-center whitespace-nowrap rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-brand/30 hover:text-brand md:inline-flex"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="hidden h-10 items-center justify-center whitespace-nowrap rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover md:inline-flex"
                >
                  Sign Up
                </Link>
              </>
            ) : null}

            {!authLoading && isAuthenticated && user ? (
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  type="button"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white py-1 pl-1 pr-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand/30"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
                    {user.initials}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
                </button>

                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg"
                  >
                    <div className="border-b border-line px-3 py-2">
                      <p className="truncate text-sm font-semibold text-ink">
                        {user.fullName || "Account"}
                      </p>
                      {user.email ? (
                        <p className="truncate text-xs text-ink-soft">{user.email}</p>
                      ) : null}
                    </div>
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink hover:bg-mist"
                    >
                      <UserRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      My Profile
                    </Link>
                    <Link
                      href="/settings"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink hover:bg-mist"
                    >
                      <Settings className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      Settings
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign Out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-slate-700 md:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav-drawer"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>
      {drawer}
    </>
  );
}

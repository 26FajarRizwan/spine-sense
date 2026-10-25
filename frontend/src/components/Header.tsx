"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const NAV_ITEMS = [
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

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
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
                {NAV_ITEMS.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
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
              </nav>

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
                <div className="space-y-2 px-1 text-sm">
                  <a
                    href="mailto:hello@spinesense.app"
                    className="block font-medium text-brand underline-offset-2 hover:underline"
                  >
                    hello@spinesense.app
                  </a>
                  <a
                    href="tel:+18005550123"
                    className="block font-medium text-slate-700 underline-offset-2 hover:underline"
                  >
                    +1 (800) 555-0123
                  </a>
                </div>
              </div>
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
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
            })}
          </nav>

          <div className="relative z-10 flex shrink-0 items-center justify-end gap-2">
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

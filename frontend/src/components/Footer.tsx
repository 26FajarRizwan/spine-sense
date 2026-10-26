import Image from "next/image";
import Link from "next/link";
import { CopyrightYear } from "@/components/CopyrightYear";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo Session" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Sign Up" },
] as const;

const PRODUCT = [
  { href: "/demo", label: "Live demo" },
  { href: "/dashboard", label: "Analytics" },
  { href: "/signup", label: "Create account" },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="container mx-auto grid gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center" aria-label="SpineSense home">
            <span className="inline-flex items-center gap-2.5">
              <Image
                src="/brand-mark.png"
                alt=""
                width={48}
                height={86}
                aria-hidden="true"
                className="h-12 w-auto object-contain"
              />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-spine">Spine</span>
                <span className="text-brand">Sense</span>
              </span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
            Real-time AI posture and ergonomics assistant for healthier desk sessions.
          </p>
          <div className="mt-4 space-y-2 text-sm">
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

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Navigation
          </h2>
          <ul className="mt-4 space-y-2.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-slate-700 transition-colors hover:text-brand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Product
          </h2>
          <ul className="mt-4 space-y-2.5">
            {PRODUCT.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-sm text-slate-700 transition-colors hover:text-brand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Features
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
            <li>Live skeleton overlay</li>
            <li>Real-time posture score</li>
            <li>Slump audio alerts</li>
            <li>Session analytics</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="container mx-auto flex flex-col gap-2 px-6 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CopyrightYear /> SpineSense. Better posture · healthier you.
          </p>
          <p>
            <Link href="/login" className="hover:text-brand">
              Login
            </Link>
            {" · "}
            <Link href="/signup" className="hover:text-brand">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

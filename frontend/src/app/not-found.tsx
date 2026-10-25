import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you requested does not exist on SpineSense.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-ink-soft">
          That route does not exist. Head home, open the dashboard, or try a live demo session.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 min-w-[7.5rem] items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Go home
          </Link>
          <Link
            href="/session"
            className="inline-flex h-11 min-w-[7.5rem] items-center justify-center rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-spine/30 hover:text-spine"
          >
            Live demo
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

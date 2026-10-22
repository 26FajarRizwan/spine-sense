import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SpineSense",
    template: "%s · SpineSense",
  },
  description:
    "AI-powered smart posture and ergonomics assistant. Monitor alignment, score your posture, and review session analytics.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-mist font-sans text-ink">
        <SessionProvider>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}

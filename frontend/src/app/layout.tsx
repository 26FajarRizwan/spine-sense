import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "SpineSense",
    template: "%s · SpineSense",
  },
  description:
    "AI-powered smart posture and ergonomics assistant. Monitor alignment, score your posture, and review session analytics.",
  applicationName: "SpineSense",
  keywords: [
    "posture",
    "ergonomics",
    "AI",
    "skeleton tracking",
    "desk health",
    "SpineSense",
  ],
  authors: [{ name: "SpineSense" }],
  openGraph: {
    title: "SpineSense",
    description:
      "Real-time AI posture and ergonomics assistant with live skeleton tracking.",
    type: "website",
    siteName: "SpineSense",
  },
  twitter: {
    card: "summary",
    title: "SpineSense",
    description:
      "Real-time AI posture and ergonomics assistant with live skeleton tracking.",
  },
  icons: {
    icon: [{ url: "/brand-mark.png", type: "image/png" }],
    apple: [{ url: "/brand-mark.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#005AF1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} antialiased`}>
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-white font-sans text-ink antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

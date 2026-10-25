import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="min-h-screen overflow-x-hidden bg-white">
      {children}
    </main>
  );
}

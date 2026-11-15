import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to SpineSense with email or Google via Supabase Auth.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <AuthForm />
    </Suspense>
  );
}

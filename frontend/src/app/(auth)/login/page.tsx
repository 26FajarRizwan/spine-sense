import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to SpineSense with email or Google via Supabase Auth.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}

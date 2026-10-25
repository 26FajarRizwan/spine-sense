import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a SpineSense account with email or Google via Supabase Auth.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}

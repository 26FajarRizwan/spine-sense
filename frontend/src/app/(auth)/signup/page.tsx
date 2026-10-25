import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign up",
  description:
    "Create a SpineSense account with your name, age, contact, work setup, and email.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}

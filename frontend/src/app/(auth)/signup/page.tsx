import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign up",
  description:
    "Create a SpineSense account with your name, age, contact, work setup, and email.",
};

/** Same split login shell; signup opens as a modal (fixes long-form alignment). */
export default function SignupPage() {
  return <AuthForm initialSignupOpen />;
}

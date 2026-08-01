import type { Metadata } from "next";
import SignInForm from "@/components/forms/SignInForm";

export const metadata: Metadata = {
  title: "Sign In — LearnHub",
  description: "Sign in to your LearnHub account to access your courses.",
};

export default function SignInPage() {
  return (
    <>
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ letterSpacing: "-0.03em", color: "var(--text-primary)" }}
        >
          Welcome back
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Sign in to continue learning
        </p>
      </div>
      <SignInForm />
    </>
  );
}

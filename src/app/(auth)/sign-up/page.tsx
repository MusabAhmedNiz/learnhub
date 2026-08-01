import type { Metadata } from "next";
import SignUpForm from "@/components/forms/SignUpForm";

export const metadata: Metadata = {
  title: "Create Account — LearnHub",
  description: "Join LearnHub and start learning from industry experts today.",
};

export default function SignUpPage() {
  return (
    <>
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ letterSpacing: "-0.03em", color: "var(--text-primary)" }}
        >
          Create your account
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Join thousands of learners today
        </p>
      </div>
      <SignUpForm />
    </>
  );
}

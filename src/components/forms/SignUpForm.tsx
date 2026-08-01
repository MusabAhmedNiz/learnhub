"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { getFieldError } from "@/lib/form-utils";

export default function SignUpForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);

      if (value.password !== value.confirmPassword) {
        setServerError("Passwords do not match.");
        return;
      }

      const { error } = await authClient.signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
      });
      if (error) {
        setServerError(error.message ?? "Something went wrong. Please try again.");
        return;
      }
      router.push("/");
      router.refresh();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      {/* Name */}
      <form.Field
        name="name"
        validators={{
          onChange: z.string().min(2, "Name must be at least 2 characters"),
        }}
      >
        {(field) => (
          <Input
            id="sign-up-name"
            label="Full name"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={getFieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>

      {/* Email */}
      <form.Field
        name="email"
        validators={{
          onChange: z.string().email("Invalid email address"),
        }}
      >
        {(field) => (
          <Input
            id="sign-up-email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={getFieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>

      {/* Password */}
      <form.Field
        name="password"
        validators={{
          onChange: z
            .string()
            .min(8, "Minimum 8 characters")
            .regex(/[A-Z]/, "Must contain an uppercase letter")
            .regex(/[0-9]/, "Must contain a number"),
        }}
      >
        {(field) => (
          <Input
            id="sign-up-password"
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={getFieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>

      {/* Confirm Password */}
      <form.Field
        name="confirmPassword"
        validators={{
          onChange: z.string().min(1, "Please confirm your password"),
        }}
      >
        {(field) => (
          <Input
            id="sign-up-confirm"
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={getFieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>

      {/* Server Error */}
      {serverError && (
        <div
          className="form-error p-3 rounded-lg"
          style={{ background: "var(--error-light)", color: "var(--error)" }}
          role="alert"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {serverError}
        </div>
      )}

      {/* Submit */}
      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting as boolean}
            disabled={!canSubmit}
            className="mt-2"
          >
            Create Account
          </Button>
        )}
      </form.Subscribe>

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <Link href="/sign-in" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { signInSchema } from "@/lib/validations";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { getFieldError } from "@/lib/form-utils";

export default function SignInForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: {
      onChange: signInSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const { error } = await authClient.signIn.email({
        email: value.email,
        password: value.password,
      });
      if (error) {
        setServerError(error.message ?? "Invalid credentials. Please try again.");
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
      {/* Email */}
      <form.Field
        name="email"
        validators={{ onChange: z.string().email("Invalid email address") }}
      >
        {(field) => (
          <Input
            id="sign-in-email"
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
        validators={{ onChange: z.string().min(1, "Password is required") }}
      >
        {(field) => (
          <Input
            id="sign-in-password"
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
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
            Sign In
          </Button>
        )}
      </form.Subscribe>

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Create one
        </Link>
      </p>
    </form>
  );
}

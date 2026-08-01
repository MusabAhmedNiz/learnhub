"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Button from "@/components/ui/Button";
import { useState } from "react";

interface NavbarProps {
  user: { name: string; email: string; role?: string | null } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header
      className="glass sticky top-0 z-50"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              boxShadow: "0 0 16px rgba(139,92,246,0.4)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="none"
              />
              <path d="M8 1V15M2 4.5L14 11.5M14 4.5L2 11.5" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
            </svg>
          </div>
          <span
            className="font-bold text-lg"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
          >
            Learn<span className="gradient-text">Hub</span>
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="btn btn-ghost btn-sm no-underline"
            style={{ color: "var(--text-secondary)" }}
          >
            Courses
          </Link>
          {user && (
            <Link
              href="/courses"
              className="btn btn-ghost btn-sm no-underline"
              style={{ color: "var(--text-secondary)" }}
            >
              My Learning
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              href="/dashboard"
              className="btn btn-ghost btn-sm no-underline"
              style={{ color: "var(--text-secondary)" }}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "var(--accent-light)", color: "#a78bfa" }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {user.name.split(" ")[0]}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={signingOut}
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="btn btn-ghost btn-sm no-underline">
                Sign In
              </Link>
              <Link href="/sign-up" className="btn btn-primary btn-sm no-underline">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

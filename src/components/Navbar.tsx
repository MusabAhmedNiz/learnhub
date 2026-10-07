"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Brand from "@/components/Brand";
import { useState } from "react";

interface NavbarProps {
  user: { name: string; email: string; role?: string | null } | null;
}
export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const client = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  async function handleSignOut() {
    setSigningOut(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Could not sign out. Try again.");
      client.clear();
      router.push("/sign-in");
      router.refresh();
    } catch {
      setError("Could not sign out. Try again.");
    } finally {
      setSigningOut(false);
    }
  }
  return (
    <header className="site-header">
      <nav className="page-width navbar" aria-label="Main navigation">
        <Brand />
        <div className="nav-links">
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={`no-underline nav-link ${pathname === "/" ? "active" : ""}`}
          >
            Explore courses
          </Link>
          <Link
            href={user ? "/courses" : "/sign-in"}
            aria-current={pathname === "/courses" ? "page" : undefined}
            className={`no-underline nav-link ${pathname === "/courses" ? "active" : ""}`}
          >
            My learning
          </Link>
          {user?.role === "admin" && (
            <Link href="/dashboard" className="no-underline nav-link">
              Dashboard
            </Link>
          )}
        </div>
        <div className="nav-account">
          {user ? (
            <>
              <span className="user-name">{user.name.split(" ")[0]}</span>
              <Button
                variant="secondary"
                size="sm"
                loading={signingOut}
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="nav-signin no-underline">
                Log in
              </Link>
              <Link href="/sign-up" className="btn btn-primary no-underline">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
      {error && (
        <p role="alert" className="text-center text-sm py-2">
          {error}
        </p>
      )}
    </header>
  );
}

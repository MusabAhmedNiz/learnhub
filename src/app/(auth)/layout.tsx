import Brand from "@/components/Brand";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Redirect already-authenticated users away from auth pages
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");

  return (
    <div className="auth-layout">
      <header className="auth-header">
        <Brand />
      </header>
      <main className="auth-form-panel">
        <div className="auth-form-content">{children}</div>
      </main>
    </div>
  );
}

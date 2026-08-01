import { auth } from "@/auth";
import { headers } from "next/headers";
import Navbar from "@/components/Navbar";
import { ReactNode } from "react";

export default async function MainLayout({ children }: { children: ReactNode }) {
  // Session is fetched here once and passed down — no redirect (public pages allowed)
  const session = await auth.api.getSession({ headers: await headers() });

  const user = session
    ? {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} />
      <main className="flex-1">{children}</main>
      <footer
        className="text-center py-8 text-sm"
        style={{
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border)",
        }}
      >
        © {new Date().getFullYear()} LearnHub. All rights reserved.
      </footer>
    </div>
  );
}

import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Auth check — require session AND admin role
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/");

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-content">{children}</main>
    </div>
  );
}

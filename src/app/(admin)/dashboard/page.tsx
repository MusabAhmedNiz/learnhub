import type { Metadata } from "next";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminOverview from "@/components/AdminOverview";

export const metadata: Metadata = { title: "Dashboard — LearnHub" };
export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") redirect("/");
  return (
    <div className="max-w-5xl">
      <div className="mb-10">
        <h1 className="text-4xl mb-3">Course dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage your courses and view purchase activity.
        </p>
      </div>
      <AdminOverview userId={session.user.id} />
    </div>
  );
}

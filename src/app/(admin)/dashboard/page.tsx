import type { Metadata } from "next";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin Dashboard — LearnHub",
  description: "Manage courses and content on LearnHub.",
};

export default async function AdminDashboardPage() {
  // Redundant check (layout already gates), but added for per-page security
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/");

  const [courseCount, purchaseCount] = await Promise.all([
    prisma.course.count(),
    prisma.purchase.count(),
  ]);

  const recentCourses = await prisma.course.findMany({
    orderBy: { id: "desc" },
    take: 5,
    select: { id: true, title: true, price: true },
  });

  const stats = [
    {
      label: "Total Courses",
      value: courseCount,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.12)",
    },
    {
      label: "Total Sales",
      value: purchaseCount,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      color: "#22c55e",
      bg: "rgba(34,197,94,0.12)",
    },
  ];

  return (
    <div className="animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-1" style={{ letterSpacing: "-0.03em" }}>
          Dashboard
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Welcome back, {session.user.name.split(" ")[0]} 👋
        </p>
      </div>

      {/* Stats */}
      <div
        className="stagger-children"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2.5rem",
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-2xl p-6 flex items-start gap-4"
          >
            <div
              className="rounded-xl p-2.5 flex-shrink-0"
              style={{ background: stat.bg, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-3xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Courses */}
      <div className="glass rounded-2xl overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="font-semibold">Recent Courses</h2>
          <Link
            href="/courses/new"
            className="btn btn-primary btn-sm no-underline"
          >
            + New Course
          </Link>
        </div>

        {recentCourses.length === 0 ? (
          <div className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
            No courses yet.{" "}
            <Link href="/courses/new" style={{ color: "var(--accent)" }}>
              Create one
            </Link>
          </div>
        ) : (
          <div>
            {recentCourses.map((course, i) => (
              <div
                key={course.id}
                className="flex items-center justify-between px-6 py-4"
                style={{
                  borderBottom:
                    i < recentCourses.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div>
                  <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                    {course.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    ${parseFloat(course.price.toString()).toFixed(2)}
                  </p>
                </div>
                <Link
                  href={`/courses/${course.id}/edit`}
                  className="btn btn-ghost btn-sm no-underline"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

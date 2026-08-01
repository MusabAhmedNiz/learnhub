import type { Metadata } from "next";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CourseForm from "@/components/forms/CourseForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "New Course — LearnHub Admin",
  description: "Create a new course on LearnHub.",
};

export default async function NewCoursePage() {
  // Per-page auth check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/");

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
        <Link href="/dashboard" style={{ color: "var(--text-muted)" }} className="no-underline hover:underline">
          Dashboard
        </Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span style={{ color: "var(--text-secondary)" }}>New Course</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ letterSpacing: "-0.03em" }}>
          Create New Course
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Fill in the details below to publish a new course.
        </p>
      </div>

      <div
        className="glass rounded-2xl p-8"
        style={{ border: "1px solid var(--border)" }}
      >
        <CourseForm mode="create" />
      </div>
    </div>
  );
}

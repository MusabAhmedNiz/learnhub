import type { Metadata } from "next";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import CourseForm from "@/components/forms/CourseForm";
import DeleteCourseButton from "@/components/DeleteCourseButton";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id }, select: { title: true } });
  return {
    title: course ? `Edit: ${course.title} — LearnHub Admin` : "Edit Course — LearnHub Admin",
  };
}

export default async function EditCoursePage({ params }: Props) {
  // Per-page auth check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/");

  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
        <Link href="/dashboard" style={{ color: "var(--text-muted)" }} className="no-underline hover:underline">
          Dashboard
        </Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span style={{ color: "var(--text-secondary)" }}>Edit Course</span>
      </nav>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ letterSpacing: "-0.03em" }}>
            Edit Course
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {course.title}
          </p>
        </div>
        <DeleteCourseButton courseId={course.id} />
      </div>

      <div
        className="glass rounded-2xl p-8"
        style={{ border: "1px solid var(--border)" }}
      >
        <CourseForm
          mode="edit"
          courseId={course.id}
          defaultValues={{
            title: course.title,
            price: course.price.toString(),
            productId: course.productId,
            image: course.image,
            video: course.video,
          }}
        />
      </div>
    </div>
  );
}

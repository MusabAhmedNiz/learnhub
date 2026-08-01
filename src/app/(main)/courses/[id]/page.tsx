import type { Metadata } from "next";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import BuyButton from "@/components/BuyButton";
import VideoPlayer from "@/components/VideoPlayer";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: course ? `${course.title} — LearnHub` : "Course — LearnHub",
  };
}

export default async function WatchCoursePage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });

  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  // Check purchase (only possible if logged in)
  const purchase = session
    ? await prisma.purchase.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: id } },
      })
    : null;

  // Not purchased (or not logged in) — show course preview + buy prompt
  if (!purchase) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center animate-fade-in">
        {/* Course thumbnail preview */}
        {course.image && course.image.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden mb-8 mx-auto"
            style={{ maxWidth: 560, border: "1px solid var(--border)" }}
          >
            <Image
              src={course.image}
              alt={course.title}
              width={560}
              height={315}
              style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
            />
          </div>
        )}

        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "var(--accent-light)" }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-3">{course.title}</h1>
        <p className="text-lg font-bold mb-2" style={{ color: "var(--accent)" }}>
          ${parseFloat(course.price.toString()).toFixed(2)}
        </p>
        <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
          Purchase this course to unlock the full video content.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <BuyButton
            productId={course.productId}
            courseId={id}
            price={parseFloat(course.price.toString()).toFixed(2)}
          />
          <Link href={`/sign-up?redirect=/courses/${id}`} className="btn btn-secondary btn-lg no-underline">
            Create Account
          </Link>
          <Link href="/" className="btn btn-ghost no-underline">
            ← All Courses
          </Link>
        </div>
      </div>
    );
  }

  // Purchased — show the video player

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
        <Link href="/" style={{ color: "var(--text-muted)" }} className="no-underline hover:underline">
          Courses
        </Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span style={{ color: "var(--text-secondary)" }}>{course.title}</span>
      </nav>

      {/* Video Player */}
      <div
        className="rounded-2xl overflow-hidden mb-8"
        style={{
          background: "#000",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border)",
        }}
      >
        <VideoPlayer courseId={id} />
      </div>

      {/* Course Info */}
      <div className="glass rounded-2xl p-6">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ letterSpacing: "-0.02em" }}
        >
          {course.title}
        </h1>
        <div className="flex items-center gap-3 mt-3">
          <span className="badge badge-success">Enrolled</span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Full access
          </span>
        </div>
      </div>
    </div>
  );
}

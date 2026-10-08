import { thumbnailSrc } from "@/lib/media";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import BuyButton from "@/components/BuyButton";
import VideoPlayer from "@/components/VideoPlayer";
import CoursePlaceholder from "@/components/CoursePlaceholder";

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
  if (!purchase && session?.user.role !== "admin") {
    return (
      <div className="page-width course-detail">
        <Link href="/#explore" className="detail-back">
          ← All courses
        </Link>
        <div className="detail-grid">
          <div className="detail-image">
            {course.image ? (
              <Image
                src={thumbnailSrc(course.id)}
                unoptimized
                alt={course.title}
                width={720}
                height={450}
                className="w-full h-full object-cover"
              />
            ) : (
              <CoursePlaceholder />
            )}
          </div>
          <div className="detail-copy">
            <p className="eyebrow">Course overview</p>
            <h1>{course.title}</h1>
            <p className="detail-description">
              Access the full course video and learn at your own pace.
            </p>
            <div className="detail-perks">
              <span>▷ Video learning</span>
              <span>◷ Go at your own pace</span>
            </div>
            <div className="detail-purchase">
              <p className="detail-price">
                ${Number(course.price).toFixed(2)}{" "}
                <span>USD · One-time purchase</span>
              </p>
              <BuyButton
                courseId={id}
                price={Number(course.price).toFixed(2)}
              />
              {!session && (
                <p className="detail-account">
                  New to LearnHub?{" "}
                  <Link href={`/sign-up?redirect=/courses/${id}`}>
                    Create an account
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Purchased — show the video player

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-2 text-sm mb-6"
        aria-label="Breadcrumb"
      >
        <Link
          href="/"
          style={{ color: "var(--text-muted)" }}
          className="no-underline hover:underline"
        >
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
        <VideoPlayer key={id} courseId={id} />
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

import type { Metadata } from "next";
import { auth } from "@/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import CourseCard from "@/components/CourseCard";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LearnHub — Level Up Your Skills",
  description:
    "Browse premium courses taught by industry experts. Learn at your own pace.",
};

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const [courses, purchases] = await Promise.all([
    prisma.course.findMany({
      select: { id: true, title: true, price: true, image: true, productId: true },
    }),
    session
      ? prisma.purchase.findMany({
          where: { userId: session.user.id },
          select: { courseId: true },
        })
      : [],
  ]);

  const purchasedIds = new Set(purchases.map((p) => p.courseId));

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.2) 0%, transparent 70%)",
          padding: "6rem 1.5rem 5rem",
          textAlign: "center",
        }}
      >
        <div className="max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-6">
            <span
              className="badge badge-accent"
              style={{ fontSize: "0.8125rem", padding: "0.3rem 0.875rem" }}
            >
              ✦ New courses added weekly
            </span>
          </div>

          <h1
            className="text-5xl sm:text-6xl font-bold mb-6"
            style={{ letterSpacing: "-0.04em", lineHeight: 1.1 }}
          >
            Level Up Your{" "}
            <span className="gradient-text">Skills</span>
          </h1>
          <p
            className="text-lg mb-10 max-w-xl mx-auto"
            style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
          >
            Premium courses from industry experts. Learn at your own pace and
            advance your career.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {session ? (
              <Link href="/courses" className="btn btn-primary btn-lg no-underline">
                My Learning →
              </Link>
            ) : (
              <>
                <Link href="/sign-up" className="btn btn-primary btn-lg no-underline">
                  Start Learning Free
                </Link>
                <Link href="/sign-in" className="btn btn-secondary btn-lg no-underline">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Decorative grid */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 20%, transparent 80%)",
            pointerEvents: "none",
          }}
        />
      </section>

      {/* Course Grid */}
      <section
        className="max-w-7xl mx-auto px-6 py-16"
        aria-labelledby="courses-heading"
      >
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2
              id="courses-heading"
              className="text-3xl font-bold mb-2"
              style={{ letterSpacing: "-0.03em" }}
            >
              All Courses
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {courses.length} course{courses.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>

        {courses.length === 0 ? (
          <div
            className="glass rounded-2xl flex flex-col items-center justify-center py-24 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "var(--accent-light)" }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Check back soon — new content is added regularly.
            </p>
          </div>
        ) : (
          <div
            className="stagger-children"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                price={course.price.toString()}
                image={course.image}
                productId={course.productId}
                purchased={purchasedIds.has(course.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

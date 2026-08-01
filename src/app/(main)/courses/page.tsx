import type { Metadata } from "next";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CourseCard from "@/components/CourseCard";

export const metadata: Metadata = {
  title: "My Courses — LearnHub",
  description: "Access all the courses you've purchased on LearnHub.",
};

export default async function MyCoursesPage() {
  // Auth check — no middleware
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const purchases = await prisma.purchase.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          price: true,
          image: true,
          productId: true,
        },
      },
    },
  });

  const courses = purchases.map((p) => p.course);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10 animate-fade-in">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ letterSpacing: "-0.03em" }}
        >
          My Learning
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {courses.length} course{courses.length !== 1 ? "s" : ""} purchased
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="glass rounded-2xl flex flex-col items-center justify-center py-24 text-center animate-fade-in">
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
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">No courses yet</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Browse our catalogue and start learning today.
          </p>
          <a href="/" className="btn btn-primary no-underline">
            Browse Courses
          </a>
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
              purchased={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/queries";
import Link from "next/link";

interface Overview {
  courseCount: number;
  purchaseCount: number;
  courses: { id: string; title: string; price: string }[];
}
export default function AdminOverview({ userId }: { userId: string }) {
  const query = useQuery({
    queryKey: ["courses", "admin", userId],
    queryFn: ({ signal }) =>
      fetchJson<Overview>("/api/admin/overview", { signal }),
  });
  if (query.isPending)
    return (
      <div
        className="skeleton h-64"
        role="status"
        aria-label="Loading dashboard"
      />
    );
  if (query.isError)
    return (
      <div className="query-state" role="alert">
        <p>{query.error.message}</p>
        <button className="btn btn-primary" onClick={() => query.refetch()}>
          Try again
        </button>
      </div>
    );
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-5 mb-8">
        {[
          {
            label: "Courses in your collection",
            value: query.data.courseCount,
          },
          { label: "Total course purchases", value: query.data.purchaseCount },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-6">
            <p className="eyebrow">{stat.label}</p>
            <p className="text-4xl">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] gap-4">
          <h2>Your courses</h2>
          <Link href="/courses/new" className="btn btn-primary btn-sm">
            + New course
          </Link>
        </div>
        {query.data.courses.length ? (
          query.data.courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between p-5 gap-4 border-b border-[var(--border)] last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{course.title}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  ${Number(course.price).toFixed(2)}
                </p>
              </div>
              <Link
                href={`/courses/${course.id}/edit`}
                className="btn btn-secondary btn-sm"
              >
                Edit ↗
              </Link>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">
            Your collection starts here. Create your first course.
          </div>
        )}
      </div>
    </>
  );
}

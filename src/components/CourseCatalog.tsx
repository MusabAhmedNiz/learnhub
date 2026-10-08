"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { courseQueries } from "@/lib/queries";
import CourseCard from "@/components/CourseCard";

export default function CourseCatalog({
  libraryUserId,
  checkoutCourseId,
}: {
  libraryUserId?: string;
  checkoutCourseId?: string;
}) {
  const [waitingForPurchase, setWaitingForPurchase] = useState(!!checkoutCourseId);
  useEffect(() => {
    if (!checkoutCourseId) return;
    const timer = setTimeout(() => setWaitingForPurchase(false), 60_000);
    return () => clearTimeout(timer);
  }, [checkoutCourseId]);
  const { data: session } = authClient.useSession();
  const userId = libraryUserId ?? session?.user.id;
  const catalog = useQuery({
    ...courseQueries.catalog(),
    enabled: !libraryUserId,
  });
  const library = useQuery({
    ...courseQueries.library(userId ?? "anonymous"),
    enabled: !!userId,
    refetchInterval: waitingForPurchase && checkoutCourseId
      ? (query) => query.state.data?.some((course) => course.id === checkoutCourseId) ? false : 2_000
      : false,
  });
  const query = libraryUserId ? library : catalog;
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("title");
  const courses = (query.data ?? [])
    .filter((course) =>
      course.title.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? Number(a.price) - Number(b.price)
        : sort === "high"
          ? Number(b.price) - Number(a.price)
          : a.title.localeCompare(b.title),
    );
  const purchased = new Set(library.data?.map((course) => course.id));
  const Heading = libraryUserId ? "h1" : "h2";
  const ResultsHeading = libraryUserId ? "h2" : "h3";
  return (
    <section
      id="explore"
      className="page-width catalog"
      aria-labelledby="catalog-heading"
    >
      <div className="section-heading">
        <div>
          <Heading id="catalog-heading">
            {libraryUserId ? "My learning" : "Explore courses"}
          </Heading>
          <p>
            {libraryUserId
              ? "Your purchased courses, ready when you are."
              : "Practical video courses. Learn at your own pace."}
          </p>
        </div>
        {libraryUserId && (
          <Link href="/" className="btn btn-secondary">
            Browse courses <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
      {checkoutCourseId && !library.data?.some((course) => course.id === checkoutCourseId) && (
        <p role="status">
          {waitingForPurchase ? "Confirming your course access…" : "Course access is taking longer than expected. Please refresh in a moment."}
        </p>
      )}
      <div className="catalog-toolbar">
        <label className="search-field">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            type="search"
            aria-label="Search courses"
            placeholder="Search courses…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="sort-field">
          Sort by{" "}
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort courses"
          >
            <option value="title">Name: A–Z</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </label>
      </div>
      {query.isPending ? (
        <div className="course-grid" role="status" aria-label="Loading courses">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="course-skeleton">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <div className="query-state" role="alert">
          <span className="state-symbol" aria-hidden="true">
            ↻
          </span>
          <ResultsHeading>Unable to load courses</ResultsHeading>
          <p>{query.error.message}</p>
          <button
            className="btn btn-primary"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            {query.isFetching ? "Loading…" : "Try again"}
          </button>
        </div>
      ) : (
        <>
          <div className="catalog-results">
            <ResultsHeading>
              {search
                ? "Search results"
                : libraryUserId
                  ? "Your courses"
                  : "All courses"}
            </ResultsHeading>
            <p className="results-count" role="status">
              {courses.length} course{courses.length !== 1 ? "s" : ""}
              {search ? ` matching “${search}”` : ""}
              {query.isFetching ? " · Updating…" : ""}
            </p>
          </div>
          {courses.length ? (
            <div className="course-grid">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  {...course}
                  purchased={!!libraryUserId || purchased.has(course.id)}
                />
              ))}
            </div>
          ) : (
            <div className="query-state">
              <ResultsHeading>
                {search
                  ? "No matching courses"
                  : libraryUserId
                    ? "No purchased courses yet"
                    : "No courses available yet"}
              </ResultsHeading>
              <p>
                {search
                  ? "Try another course name or clear your search."
                  : libraryUserId
                    ? "Browse the catalog to find your first course."
                    : "Check back soon for new courses."}
              </p>
              {search ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </button>
              ) : libraryUserId ? (
                <Link href="/" className="btn btn-primary no-underline">
                  Browse courses
                </Link>
              ) : null}
            </div>
          )}
        </>
      )}
    </section>
  );
}

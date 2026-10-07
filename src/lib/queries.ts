import { queryOptions } from "@tanstack/react-query";

export interface CourseSummary {
  id: string;
  title: string;
  price: string;
  image: string;
  productId: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      body?.error ?? "Something went wrong. Please try again.",
      response.status,
    );
  }
  return response.json();
}

export const courseQueries = {
  all: ["courses"] as const,
  catalog: () =>
    queryOptions({
      queryKey: ["courses", "catalog"],
      queryFn: ({ signal }) =>
        fetchJson<CourseSummary[]>("/api/courses", { signal }),
    }),
  library: (userId: string) =>
    queryOptions({
      queryKey: ["courses", "library", userId],
      queryFn: ({ signal }) =>
        fetchJson<CourseSummary[]>("/api/my-courses", { signal }),
    }),
  video: (courseId: string) =>
    queryOptions({
      queryKey: ["courses", "video", courseId],
      queryFn: ({ signal }) =>
        fetchJson<{ url: string }>(
          `/api/courses/${encodeURIComponent(courseId)}`,
          { signal },
        ),
      staleTime: 30 * 60_000,
      gcTime: 0,
      refetchOnWindowFocus: false,
    }),
};

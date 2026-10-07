import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { ApiError, courseQueries, fetchJson } from "../src/lib/queries";

afterEach(() => vi.unstubAllGlobals());

describe("course data loading", () => {
  it("rejects failed mutations instead of reporting success", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
        ),
    );
    await expect(
      fetchJson("/api/courses/example", { method: "DELETE" }),
    ).rejects.toMatchObject({ message: "Forbidden", status: 403 });
  });

  it("provides a usable error for non-JSON server failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("Service unavailable", { status: 503 }),
        ),
    );
    await expect(fetchJson("/api/courses")).rejects.toBeInstanceOf(ApiError);
  });

  it("keeps purchased course caches separate for different accounts", () => {
    const client = new QueryClient();
    client.setQueryData(courseQueries.library("alice").queryKey, [
      { id: "alice-course", title: "Private course", price: "10", image: "", productId: "product" },
    ]);
    expect(
      client.getQueryData(courseQueries.library("bob").queryKey),
    ).toBeUndefined();
    client.clear();
  });

  it("cancels the catalog request when its query is cancelled", async () => {
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url, init) => {
        requestSignal = init.signal;
        return new Promise((_resolve, reject) =>
          init.signal.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          ),
        );
      }),
    );
    const client = new QueryClient();
    const request = client
      .fetchQuery(courseQueries.catalog())
      .catch(() => undefined);
    await client.cancelQueries({ queryKey: courseQueries.all });
    await request;
    expect(requestSignal?.aborted).toBe(true);
    client.clear();
  });
});

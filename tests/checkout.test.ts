import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ checkout: vi.fn(), handler: vi.fn(), session: vi.fn(), course: vi.fn() }));
vi.mock("@polar-sh/nextjs", () => ({ Checkout: mocks.checkout }));
vi.mock("@/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("@/lib/prisma", () => ({ default: { course: { findUnique: mocks.course } } }));
const request = (query = "courseId=chosen-course") => new NextRequest(`https://learnhub-demo.vercel.app/api/checkout?${query}`);

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  mocks.checkout.mockReturnValue(mocks.handler);
  mocks.handler.mockResolvedValue(new Response(null, { status: 307 }));
  mocks.session.mockResolvedValue({ user: { id: "signed-in-user" } });
  mocks.course.mockResolvedValue({ id: "chosen-course", productId: "stored-product" });
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("POLAR_ACCESS_TOKEN", "test-token");
  vi.stubEnv("BETTER_AUTH_URL", "https://learnhub-demo.vercel.app");
});
afterEach(() => vi.unstubAllEnvs());

it.each([undefined, "sandbox", "production"])("uses the explicit payment environment (%s)", async (server) => {
  vi.stubEnv("POLAR_SERVER", server);
  const { GET } = await import("../src/app/api/checkout/route");
  await GET(request());
  expect(mocks.checkout).toHaveBeenCalledWith(expect.objectContaining({ server: server ?? "sandbox" }));
  const success = new URL(mocks.checkout.mock.calls[0][0].successUrl);
  expect(success.searchParams.get("courseId")).toBe("chosen-course");
  expect(success.searchParams.get("success")).toBe("true");
});

it("rejects a misspelled payment environment", async () => {
  vi.stubEnv("POLAR_SERVER", "sandobx");
  await expect(import("../src/app/api/checkout/route")).rejects.toThrow("POLAR_SERVER must be sandbox or production");
  expect(mocks.checkout).not.toHaveBeenCalled();
});

it("binds payment to the authenticated buyer and stored course, ignoring caller overrides", async () => {
  const { GET } = await import("../src/app/api/checkout/route");
  await GET(request("courseId=chosen-course&products=cheap-product&customerExternalId=another-user&metadata=%7B%22courseId%22%3A%22other-course%22%7D"));
  const forwarded = new URL(mocks.handler.mock.calls[0][0].url);
  expect(forwarded.searchParams.getAll("products")).toEqual(["stored-product"]);
  expect(forwarded.searchParams.get("customerExternalId")).toBe("signed-in-user");
  expect(JSON.parse(forwarded.searchParams.get("metadata")!)).toEqual({ courseId: "chosen-course" });
});

it("does not create checkouts for anonymous buyers or missing courses", async () => {
  const { GET } = await import("../src/app/api/checkout/route");
  mocks.session.mockResolvedValue(null);
  expect((await GET(request())).status).toBe(401);
  mocks.session.mockResolvedValue({ user: { id: "buyer" } });
  expect((await GET(request(""))).status).toBe(400);
  mocks.course.mockResolvedValue(null);
  expect((await GET(request())).status).toBe(404);
  expect(mocks.checkout).not.toHaveBeenCalled();
});

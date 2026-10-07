import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), purchase: vi.fn(), course: vi.fn(), sign: vi.fn(), upload: vi.fn(), verify: vi.fn() }));
vi.mock("@/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/prisma", () => ({ default: { purchase: { findFirst: mocks.purchase }, course: { findUnique: mocks.course } } }));
vi.mock("@/lib/storage", () => ({ signedMediaUrl: mocks.sign, createUpload: mocks.upload, verifyMedia: mocks.verify }));
import { GET } from "../src/app/api/courses/[id]/route";
import { POST } from "../src/app/api/upload/route";
import { POST as complete } from "../src/app/api/upload/complete/route";
import { GET as thumbnail } from "../src/app/api/courses/[id]/thumbnail/route";
const params = { params: Promise.resolve({ id: "course" }) };
const request = () => new Request("http://localhost/api/upload", { method: "POST", body: JSON.stringify({ kind: "video", contentType: "video/mp4", size: 20 }) });
beforeEach(() => vi.resetAllMocks());
it("rejects anonymous and non-admin uploads, including completion", async () => {
  mocks.session.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(401);
  expect((await complete(request())).status).toBe(401);
  mocks.session.mockResolvedValue({ user: { id: "user", role: "user" } });
  expect((await POST(request())).status).toBe(403);
  expect((await complete(request())).status).toBe(403);
  expect(mocks.upload).not.toHaveBeenCalled();
  expect(mocks.verify).not.toHaveBeenCalled();
});
it("does not sign video URLs without a session and purchase", async () => {
  mocks.session.mockResolvedValue(null);
  expect((await GET(request(), params)).status).toBe(401);
  mocks.session.mockResolvedValue({ user: { id: "user" } });
  mocks.purchase.mockResolvedValue(null);
  expect((await GET(request(), params)).status).toBe(403);
  expect(mocks.sign).not.toHaveBeenCalled();
});
it.each(["admin", "user"])("signs private playback for authorized %s without caching", async (role) => {
  mocks.session.mockResolvedValue({ user: { id: "user", role } });
  mocks.purchase.mockResolvedValue({ id: "purchase" });
  const key = "videos/12345678-1234-1234-1234-123456789abc.mp4";
  mocks.course.mockResolvedValue({ video: key });
  mocks.sign.mockResolvedValue("https://storage.example/signed");
  const result = await GET(request(), params);
  expect(result.status).toBe(200);
  expect(result.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.sign).toHaveBeenCalledWith(key, "video");
  if (role === "admin") expect(mocks.purchase).not.toHaveBeenCalled();
});
it("rejects failed completion checks", async () => {
  mocks.session.mockResolvedValue({ user: { role: "admin" } });
  mocks.verify.mockRejectedValue(new Error("Wrong size"));
  const req = new Request("http://localhost/api/upload/complete", { method: "POST", body: JSON.stringify({ kind: "video", contentType: "video/mp4", size: 20, key: "videos/12345678-1234-1234-1234-123456789abc.mp4" }) });
  expect((await complete(req)).status).toBe(400);
});
it("never signs a video through the public thumbnail route", async () => {
  mocks.course.mockResolvedValue({ image: "videos/12345678-1234-1234-1234-123456789abc.mp4" });
  expect((await thumbnail(request(), params)).status).toBe(404);
  expect(mocks.sign).not.toHaveBeenCalled();
});

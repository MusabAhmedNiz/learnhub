import { describe, expect, it, vi, beforeEach } from "vitest";
import { uploadSchema, isMediaKey, thumbnailSrc } from "../src/lib/media";
import { courseApiSchema } from "../src/lib/validations";
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@aws-sdk/client-s3", async (original) => ({
  ...await original<typeof import("@aws-sdk/client-s3")>(),
  S3Client: class { send = send; },
}));
import { verifyMedia } from "../src/lib/storage";
import { verifyCourseMedia } from "../src/lib/course-media";
const image = "images/12345678-1234-1234-1234-123456789abc.png";

beforeEach(() => {
  vi.stubEnv("S3_ENDPOINT", "http://localhost:9000");
  vi.stubEnv("S3_ACCESS_KEY_ID", "local");
  vi.stubEnv("S3_SECRET_ACCESS_KEY", "local-secret");
  vi.stubEnv("S3_BUCKET", "local");
  send.mockReset();
});
describe("media validation", () => {
  it("rejects empty, oversized, and unsupported uploads", () => {
    for (const data of [
      { kind: "image", contentType: "image/png", size: 0 },
      { kind: "image", contentType: "image/png", size: 11 * 1024 ** 2 },
      { kind: "video", contentType: "video/mp4", size: 1024 ** 3 + 1 },
      { kind: "image", contentType: "image/svg+xml", size: 50 },
      { kind: "image", contentType: "toString", size: 50 },
    ]) expect(uploadSchema.safeParse(data).success).toBe(false);
  });
  it("keeps video keys out of public thumbnail delivery", () => {
    expect(isMediaKey(image, "image")).toBe(true);
    expect(isMediaKey(image.replace("images", "videos"), "image")).toBe(false);
    expect(isMediaKey("images/../../private.mp4", "image")).toBe(false);
    expect(thumbnailSrc("course")).toBe("/api/courses/course/thumbnail");
  });
  it("verifies actual size and type, including the declared upload size", async () => {
    send.mockResolvedValue({ ContentLength: 25, ContentType: "image/png" });
    await expect(verifyMedia(image, "image", { size: 25, contentType: "image/png" })).resolves.toBeUndefined();
    await expect(verifyMedia(image, "image", { size: 30, contentType: "image/png" })).rejects.toThrow();
    send.mockResolvedValue({ ContentLength: 25, ContentType: "video/mp4" });
    await expect(verifyMedia(image, "image")).rejects.toThrow();
  });
  it("rejects missing objects and external media URLs", async () => {
    send.mockRejectedValue(new Error("Not found"));
    await expect(verifyCourseMedia({ image, video: "" })).rejects.toThrow();
    const external = { image: "https://example.com/image.png", video: "https://example.com/video.mp4" };
    await expect(verifyCourseMedia(external)).rejects.toThrow();
    expect(courseApiSchema.safeParse({ title: "Course", price: 12, productId: "product", ...external }).success).toBe(false);
  });
  it("rejects invalid course prices on the server", () => {
    const course = { title: "Course", image, video: "videos/12345678-1234-1234-1234-123456789abc.mp4", productId: "product" };
    for (const price of [-1, Infinity, "12"]) expect(courseApiSchema.safeParse({ ...course, price }).success).toBe(false);
  });
});

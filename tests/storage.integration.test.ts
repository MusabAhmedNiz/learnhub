import "dotenv/config";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createUpload, signedMediaUrl, storageBucket, storageClient, verifyMedia } from "../src/lib/storage";

// Opt in against a local private bucket initialized with `pnpm storage:init`.
describe.skipIf(process.env.TEST_STORAGE !== "1")("local S3 integration", () => {
  const keys: string[] = [];
  beforeAll(() => {
    const endpoint = new URL(process.env.S3_ENDPOINT || "http://localhost:9000");
    if (!["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname)) {
      throw new Error("Run storage integration tests against local storage only.");
    }
  });
  afterAll(async () => {
    for (const Key of keys) await storageClient().send(new DeleteObjectCommand({ Bucket: storageBucket(), Key }));
  });
  it("uploads, checks metadata, serves byte ranges, and rejects unsigned/expired requests", async () => {
    const body = Buffer.from("small local video transport fixture");
    const { key, url } = await createUpload({ kind: "video", contentType: "video/mp4", size: body.length });
    keys.push(key);
    expect((await fetch(url, { method: "PUT", headers: { "Content-Type": "video/mp4" }, body })).status).toBe(200);
    await verifyMedia(key, "video", { contentType: "video/mp4", size: body.length });
    const signed = await signedMediaUrl(key, "video");
    const partial = await fetch(signed, { headers: { Range: "bytes=6-10" } });
    expect(partial.status).toBe(206);
    expect(partial.headers.get("content-range")).toBe(`bytes 6-10/${body.length}`);
    expect(await partial.text()).toBe(body.subarray(6, 11).toString());
    const unsigned = new URL(signed); unsigned.search = "";
    expect((await fetch(unsigned)).status).toBe(403);
    const expired = await getSignedUrl(storageClient(), new GetObjectCommand({ Bucket: storageBucket(), Key: key }), {
      expiresIn: 60, signingDate: new Date(Date.now() - 120000),
    });
    expect((await fetch(expired)).status).toBe(403);
    const changedType = await fetch(url, { method: "PUT", headers: { "Content-Type": "video/webm" }, body });
    expect(changedType.status).toBe(403);
  });
  it("uploads and verifies a thumbnail and allows browser preflight", async () => {
    const body = Buffer.from("local image transport fixture");
    const { key, url } = await createUpload({ kind: "image", contentType: "image/png", size: body.length });
    keys.push(key);
    const origin = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const preflight = await fetch(url, { method: "OPTIONS", headers: {
      Origin: origin, "Access-Control-Request-Method": "PUT", "Access-Control-Request-Headers": "content-type",
    } });
    expect(preflight.ok).toBe(true);
    expect(preflight.headers.get("access-control-allow-origin")).toBe(origin);
    expect((await fetch(url, { method: "PUT", headers: { "Content-Type": "image/png" }, body })).ok).toBe(true);
    await verifyMedia(key, "image", { size: body.length, contentType: "image/png" });
    expect(await (await fetch(await signedMediaUrl(key, "image"))).text()).toBe(body.toString());
  });
});

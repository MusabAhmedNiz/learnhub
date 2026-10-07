import { randomUUID } from "node:crypto";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isMediaKey, mediaLimits, mediaTypes, uploadSchema, type MediaKind } from "./media";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing storage configuration: ${name}`);
  return value;
}

export function storageClient() {
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: required("S3_ENDPOINT"),
    forcePathStyle: true,
    credentials: {
      accessKeyId: required("S3_ACCESS_KEY_ID"),
      secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}
export function storageBucket() { return required("S3_BUCKET"); }

export async function createUpload(input: { kind: MediaKind; contentType: string; size: number }) {
  const data = uploadSchema.parse(input);
  const types: Record<string, string> = mediaTypes[data.kind];
  const key = `${data.kind}s/${randomUUID()}.${types[data.contentType]}`;
  const url = await getSignedUrl(storageClient(), new PutObjectCommand({
    Bucket: storageBucket(), Key: key, ContentType: data.contentType, ContentLength: data.size,
  }), { expiresIn: 900, signableHeaders: new Set(["content-type", "content-length"]) });
  return { key, url };
}

export async function verifyMedia(key: string, kind: MediaKind, expected?: { size: number; contentType: string }) {
  if (!isMediaKey(key, kind)) throw new Error("Invalid media key");
  const object = await storageClient().send(new HeadObjectCommand({ Bucket: storageBucket(), Key: key }));
  const types: Record<string, string> = mediaTypes[kind];
  if (!object.ContentLength || object.ContentLength > mediaLimits[kind] ||
      !object.ContentType || !Object.hasOwn(types, object.ContentType) ||
      !key.endsWith(`.${types[object.ContentType]}`) ||
      (expected && (object.ContentLength !== expected.size || object.ContentType !== expected.contentType))) {
    throw new Error("Uploaded media has an invalid size or content type");
  }
}

export async function signedMediaUrl(key: string, kind: MediaKind) {
  if (!isMediaKey(key, kind)) throw new Error("Invalid media key");
  return getSignedUrl(storageClient(), new GetObjectCommand({
    Bucket: storageBucket(), Key: key,
  }), { expiresIn: 3600 });
}

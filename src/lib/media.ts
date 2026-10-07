import { z } from "zod";

export const mediaTypes = {
  image: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
  video: { "video/mp4": "mp4", "video/webm": "webm" },
} as const;
export type MediaKind = keyof typeof mediaTypes;
export const mediaLimits = { image: 10 * 1024 ** 2, video: 1024 ** 3 };

export function isMediaKey(value: string, kind: MediaKind) {
  const extensions = Object.values(mediaTypes[kind]).join("|");
  return new RegExp(`^${kind}s/[0-9a-f-]{36}\\.(${extensions})$`).test(value);
}

export const uploadSchema = z.object({
  kind: z.enum(["image", "video"]),
  contentType: z.string(),
  size: z.number().int().positive(),
}).superRefine((value, ctx) => {
  if (!Object.hasOwn(mediaTypes[value.kind], value.contentType)) {
    ctx.addIssue({ code: "custom", message: "Use JPEG, PNG or WebP images, or MP4 or WebM videos." });
  }
  if (value.size > mediaLimits[value.kind]) {
    ctx.addIssue({ code: "custom", message: value.kind === "image" ? "Images must be 10 MiB or smaller." : "Videos must be 1 GiB or smaller." });
  }
});

export function thumbnailSrc(id: string) {
  return `/api/courses/${encodeURIComponent(id)}/thumbnail`;
}

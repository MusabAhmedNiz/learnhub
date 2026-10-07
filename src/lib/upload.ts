import { uploadSchema, type MediaKind } from "./media";

async function post(url: string, body: unknown, signal: AbortSignal) {
  const response = await fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Upload failed. Please try again.");
  return data;
}

export async function uploadMedia(file: File, kind: MediaKind, onProgress: (progress: number) => void, signal: AbortSignal) {
  const parsed = uploadSchema.safeParse({ kind, contentType: file.type, size: file.size });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const details = parsed.data;
  const { key, url } = await post("/api/upload", details, signal);
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => { xhr.abort(); reject(new Error("Upload cancelled.")); };
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100));
    };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed. Please try again."));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and storage CORS settings."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.onloadend = () => signal.removeEventListener("abort", abort);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort(); else xhr.send(file);
  });
  const completed = await post("/api/upload/complete", { ...details, key }, signal);
  return completed.key as string;
}

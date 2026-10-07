import { verifyMedia } from "./storage";

export async function verifyCourseMedia(data: { image: string; video: string }) {
  for (const kind of ["image", "video"] as const) {
    await verifyMedia(data[kind], kind);
  }
}

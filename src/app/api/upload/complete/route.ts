import { auth } from "@/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { uploadSchema } from "@/lib/media";
import { verifyMedia } from "@/lib/storage";

const completionSchema = uploadSchema.and(z.object({ key: z.string() }));
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const data = completionSchema.safeParse(await request.json().catch(() => null));
  if (!data.success) return NextResponse.json({ error: "Invalid upload details" }, { status: 400 });
  try {
    await verifyMedia(data.data.key, data.data.kind, data.data);
    return NextResponse.json({ key: data.data.key });
  } catch {
    return NextResponse.json({ error: "Could not verify the upload. Please upload the file again." }, { status: 400 });
  }
}

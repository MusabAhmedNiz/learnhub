import { auth } from "@/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { uploadSchema } from "@/lib/media";
import { createUpload } from "@/lib/storage";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const data = uploadSchema.safeParse(await request.json().catch(() => null));
  if (!data.success) return NextResponse.json({ error: data.error.issues[0].message }, { status: 400 });
  try {
    return NextResponse.json(await createUpload(data.data), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Upload authorization failed", error);
    return NextResponse.json({ error: "Storage is unavailable. Please try again." }, { status: 503 });
  }
}

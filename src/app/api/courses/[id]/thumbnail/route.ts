import prisma from "@/lib/prisma";
import { isMediaKey } from "@/lib/media";
import { signedMediaUrl } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id }, select: { image: true } });
  if (!course || !isMediaKey(course.image, "image")) {
    return new NextResponse(null, { status: 404 });
  }
  try {
    // Public delivery is restricted to an image attached to a published course.
    return new NextResponse(null, { status: 307, headers: {
      Location: await signedMediaUrl(course.image, "image"), "Cache-Control": "no-store",
    } });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}

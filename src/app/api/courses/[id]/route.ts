import { courseApiSchema } from "@/lib/validations";
import { verifyCourseMedia } from "@/lib/course-media";
import { signedMediaUrl } from "@/lib/storage";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

async function adminCheck() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  if (session.user.role !== "admin") return null;
  return session.user;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = session.user.role === "admin";

    if (!isAdmin) {
      const purchase = await prisma.purchase.findFirst({
        where: {
          userId: session.user.id,
          courseId: id,
        },
      });
      if (!purchase) {
        return NextResponse.json({ error: "Not purchased" }, { status: 403 });
      }
    }

    const course = await prisma.course.findUnique({
      where: { id },
      select: { video: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const videoUrl = await signedMediaUrl(course.video, "video");

    return NextResponse.json({ url: videoUrl }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Could not load the video" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await adminCheck();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const parsed = courseApiSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    try { await verifyCourseMedia(parsed.data); } catch {
      return NextResponse.json({ error: "Upload valid course media before saving." }, { status: 400 });
    }
    const data = parsed.data;
    await prisma.course.update({
      where: {
        id: id,
      },
      data: {
        title: data.title,
        price: data.price,
        image: data.image,
        productId: data.productId,
        video: data.video,
      },
    });

    return NextResponse.json({ message: "course updated" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await adminCheck();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await prisma.course.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: "Course deleted" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

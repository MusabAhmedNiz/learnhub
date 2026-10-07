import { courseApiSchema } from "@/lib/validations";
import { verifyCourseMedia } from "@/lib/course-media";
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

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, price: true, image: true, productId: true },
    });
    return NextResponse.json(courses);
  } catch {
    return NextResponse.json({ error: "The course catalog could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await adminCheck();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = courseApiSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    try { await verifyCourseMedia(parsed.data); } catch {
      return NextResponse.json({ error: "Upload valid course media before saving." }, { status: 400 });
    }
    const { title, price, image, productId, video } = parsed.data;
    await prisma.course.create({
      data: {
        title,
        price,
        image,
        productId,
        video,
      },
    });
    return NextResponse.json({ message: "Course created" }, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({  error: "Server Error" }, { status: 500 });
  }
}

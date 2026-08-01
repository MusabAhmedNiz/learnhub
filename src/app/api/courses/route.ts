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
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      price: true,
      image: true,
      productId: true,
    },
  });
  return NextResponse.json(courses , { status: 200 });
}

export async function POST(request: Request) {
  try {
    const admin = await adminCheck();
    if (!admin) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

    const { title, price, image, productId, video } = await request.json();
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

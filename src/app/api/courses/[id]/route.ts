import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import ImageKit from "@imagekit/nodejs";

async function adminCheck() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  if (session.user.role !== "admin") return null;
  return session.user;
}

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

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
        }
      })
      if(!purchase){
        return NextResponse.json({ error: "Not purchased" }, { status: 403 });
      }
    }

  const course = await prisma.course.findUnique({
    where: {
      id: id,
    },
    select: { video: true },
  });
  if(!course){
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  
  const videoUrl = imagekit.helper.buildSrc({
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
    src: course.video,
    signed : true,
    expiresIn: 60 * 60, 
  });
  
  return NextResponse.json({ url: videoUrl } , { status: 200 });
  } catch (error) {
    return NextResponse.json({error:"server error"},{status:500})
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
    const data = await request.json();
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
  } catch (error) {
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
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json(
        { error: "Please sign in to see your courses." },
        { status: 401 },
      );
    const purchases = await prisma.purchase.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            image: true,
            productId: true,
          },
        },
      },
    });
    return NextResponse.json(
      purchases.map(({ course }) => course),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Your courses could not be loaded." },
      { status: 500 },
    );
  }
}

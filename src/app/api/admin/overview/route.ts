import { auth } from "@/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const [courseCount, purchaseCount, courses] = await Promise.all([
      prisma.course.count(),
      prisma.purchase.count(),
      prisma.course.findMany({
        orderBy: { title: "asc" },
        select: { id: true, title: true, price: true },
      }),
    ]);
    return NextResponse.json(
      { courseCount, purchaseCount, courses },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "The dashboard could not be loaded." },
      { status: 500 },
    );
  }
}

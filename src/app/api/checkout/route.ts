import { Checkout } from "@polar-sh/nextjs";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function paymentServer(): "sandbox" | "production" {
  const server = process.env.POLAR_SERVER ?? "sandbox";
  if (server !== "sandbox" && server !== "production") {
    throw new Error("POLAR_SERVER must be sandbox or production");
  }
  return server;
}
const server = paymentServer();

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courseId = request.nextUrl.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "Choose a course" }, { status: 400 });
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, productId: true },
  });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const success = new URL("/courses", process.env.BETTER_AUTH_URL || "http://localhost:3000");
  success.searchParams.set("success", "true");
  success.searchParams.set("courseId", course.id);
  const checkout = Checkout({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    successUrl: success.toString(),
    server,
  });
  const url = new URL(request.url);
  url.search = "";
  url.searchParams.set("products", course.productId);
  url.searchParams.set("customerExternalId", session.user.id);
  url.searchParams.set("metadata", JSON.stringify({ courseId: course.id }));
  return checkout(new NextRequest(url, { headers: request.headers }));
}

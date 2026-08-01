import prisma from "@/lib/prisma";
import { Webhooks } from "@polar-sh/nextjs";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onOrderPaid: async (payload) => {
    const userId = payload.data.customer.externalId;
    const productId = payload.data.product?.id;
    if (!productId) return;
    const course = await prisma.course.findFirst({
      where: { productId: productId },
    });
    console.log("course:", course);
    console.log("userId", userId);
    if (!course || !userId) return;

    await prisma.purchase.upsert({
      where: { userId_courseId: { userId, courseId: course.id } },
      create: { userId, courseId: course.id },
      update: {},
    });
  },
});

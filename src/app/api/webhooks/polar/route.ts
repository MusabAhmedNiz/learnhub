import prisma from "@/lib/prisma";
import { Webhooks } from "@polar-sh/nextjs";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onOrderPaid: async (payload) => {
    const userId = payload.data.customer.externalId;
    const productId = payload.data.product?.id;
    if (!productId || !userId) return;

    const courseId = payload.data.metadata.courseId;
    let course;
    if (typeof courseId === "string") {
      course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course || course.productId !== productId) {
        throw new Error(`Paid order ${payload.data.id} does not match its course`);
      }
    } else {
      const matches = await prisma.course.findMany({ where: { productId }, take: 2 });
      if (matches.length > 1) {
        // Old checkouts did not identify the selected course. Recover these
        // payments manually rather than granting an arbitrary matching course.
        console.error("Legacy paid order needs course reconciliation", { orderId: payload.data.id, productId });
        return;
      }
      course = matches[0];
      if (!course) return;
    }

    await prisma.purchase.upsert({
      where: { userId_courseId: { userId, courseId: course.id } },
      create: { userId, courseId: course.id },
      update: {},
    });
    console.info("Course purchase recorded", { orderId: payload.data.id, courseId: course.id });
  },
});

import { beforeEach, expect, it, vi } from "vitest";

type PaidPayload = { data: { id: string; customer: { externalId: string | null }; product: { id: string }; metadata: Record<string, string> } };
const mocks = vi.hoisted(() => ({ course: vi.fn(), matches: vi.fn(), upsert: vi.fn(), handler: undefined as undefined | ((payload: PaidPayload) => Promise<void>) }));
vi.mock("@/lib/prisma", () => ({ default: { course: { findUnique: mocks.course, findMany: mocks.matches }, purchase: { upsert: mocks.upsert } } }));
vi.mock("@polar-sh/nextjs", () => ({ Webhooks: (config: { onOrderPaid: (payload: PaidPayload) => Promise<void> }) => { mocks.handler = config.onOrderPaid; return vi.fn(); } }));
import "../src/app/api/webhooks/polar/route";
const payload = (metadata: Record<string, string> = { courseId: "selected-course" }): PaidPayload => ({ data: { id: "paid-order", customer: { externalId: "buyer" }, product: { id: "shared-product" }, metadata } });
beforeEach(() => vi.clearAllMocks());

it("unlocks the selected course when two courses share a product", async () => {
  mocks.course.mockResolvedValue({ id: "selected-course", productId: "shared-product" });
  await mocks.handler!(payload());
  expect(mocks.upsert).toHaveBeenCalledWith({ where: { userId_courseId: { userId: "buyer", courseId: "selected-course" } }, create: { userId: "buyer", courseId: "selected-course" }, update: {} });
  expect(mocks.matches).not.toHaveBeenCalled();
});

it("rejects metadata pointing to a course for a different product", async () => {
  mocks.course.mockResolvedValue({ id: "selected-course", productId: "other-product" });
  await expect(mocks.handler!(payload())).rejects.toThrow("does not match its course");
  expect(mocks.upsert).not.toHaveBeenCalled();
});

it("keeps legacy payments working when the product identifies one course", async () => {
  mocks.matches.mockResolvedValue([{ id: "legacy-course" }]);
  await mocks.handler!(payload({}));
  expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { userId: "buyer", courseId: "legacy-course" } }));
});

it("reports ambiguous legacy payments without granting an arbitrary course", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.matches.mockResolvedValue([{ id: "one" }, { id: "two" }]);
  await mocks.handler!(payload({}));
  expect(mocks.upsert).not.toHaveBeenCalled();
  expect(error).toHaveBeenCalledWith("Legacy paid order needs course reconciliation", { orderId: "paid-order", productId: "shared-product" });
  error.mockRestore();
});

it("ignores payments without a linked account", async () => {
  const event = payload(); event.data.customer.externalId = null;
  await mocks.handler!(event);
  expect(mocks.upsert).not.toHaveBeenCalled();
});

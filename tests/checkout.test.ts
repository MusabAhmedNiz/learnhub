import { afterEach, beforeEach, expect, it, vi } from "vitest";

const checkout = vi.hoisted(() => vi.fn(() => vi.fn()));
vi.mock("@polar-sh/nextjs", () => ({ Checkout: checkout }));

beforeEach(() => {
  vi.resetModules();
  checkout.mockClear();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("POLAR_ACCESS_TOKEN", "test-token");
  vi.stubEnv("BETTER_AUTH_URL", "https://learnhub-demo.vercel.app");
});
afterEach(() => vi.unstubAllEnvs());

it.each([undefined, "sandbox"])("keeps a hosted test build in sandbox with POLAR_SERVER=%s", async (server) => {
  vi.stubEnv("POLAR_SERVER", server);
  await import("../src/app/api/checkout/route");
  expect(checkout).toHaveBeenCalledWith(expect.objectContaining({
    server: "sandbox",
    successUrl: "https://learnhub-demo.vercel.app/courses?success=true",
  }));
});

it("enables live checkout only with an explicit production setting", async () => {
  vi.stubEnv("POLAR_SERVER", "production");
  await import("../src/app/api/checkout/route");
  expect(checkout).toHaveBeenCalledWith(expect.objectContaining({ server: "production" }));
});

it("rejects a misspelled payment environment", async () => {
  vi.stubEnv("POLAR_SERVER", "sandobx");
  await expect(import("../src/app/api/checkout/route")).rejects.toThrow("POLAR_SERVER must be sandbox or production");
  expect(checkout).not.toHaveBeenCalled();
});

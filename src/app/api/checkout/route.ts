import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/courses?success=true`,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

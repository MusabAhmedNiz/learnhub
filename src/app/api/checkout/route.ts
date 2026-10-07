import { Checkout } from "@polar-sh/nextjs";

const server = process.env.POLAR_SERVER ?? "sandbox";
if (server !== "sandbox" && server !== "production") {
  throw new Error("POLAR_SERVER must be sandbox or production");
}

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/courses?success=true`,
  server,
});

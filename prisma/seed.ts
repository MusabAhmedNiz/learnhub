import { auth } from "@/auth";

async function main() {
  try {
    const newUser = await auth.api.createUser({
      body: {
        email: process.env.EMAIL || "example@email.com",
        password: process.env.PASSWORD || "pass",
        name: process.env.NAME || "jhon",
        role: "admin",
      },
    });
    console.log("Created admin:", newUser);
  } catch (error) {
    console.log("Seed failed:", error);
  }
}
main();

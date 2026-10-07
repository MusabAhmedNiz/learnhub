import type { Metadata } from "next";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CourseCatalog from "@/components/CourseCatalog";

export const metadata: Metadata = { title: "My Learning — LearnHub" };
export default async function MyCoursesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return <CourseCatalog libraryUserId={session.user.id} />;
}

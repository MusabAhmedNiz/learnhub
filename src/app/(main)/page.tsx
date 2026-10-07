import type { Metadata } from "next";
import CourseCatalog from "@/components/CourseCatalog";
import HomeHero from "@/components/HomeHero";

export const metadata: Metadata = {
  title: "Explore Courses — LearnHub",
  description:
    "Browse practical video courses on LearnHub. Find your next skill and learn at your own pace.",
};

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <CourseCatalog />
    </>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ImageKitProvider } from "@imagekit/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LearnHub — Level Up Your Skills",
  description:
    "Premium online courses to accelerate your career. Learn from industry experts at your own pace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col antialiased">
        <ImageKitProvider urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}>
          {children}
        </ImageKitProvider>
      </body>
    </html>
  );
}

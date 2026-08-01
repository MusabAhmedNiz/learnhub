import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  // Redirect already-authenticated users away from auth pages
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.15) 0%, transparent 70%), var(--bg-base)",
      }}
    >
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "15%",
          left: "10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: "15%",
          right: "10%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="glass animate-fade-in w-full"
        style={{
          maxWidth: "420px",
          borderRadius: "var(--radius-xl)",
          padding: "2.5rem",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Logo mark */}
        <div className="flex items-center gap-2 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              boxShadow: "0 0 20px rgba(139,92,246,0.4)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M8 1V15M2 4.5L14 11.5M14 4.5L2 11.5"
                stroke="white"
                strokeWidth="1"
                strokeOpacity="0.5"
              />
            </svg>
          </div>
          <span
            className="font-bold text-lg"
            style={{ letterSpacing: "-0.03em", color: "var(--text-primary)" }}
          >
            Learn<span className="gradient-text">Hub</span>
          </span>
        </div>

        {children}
      </div>
    </div>
  );
}

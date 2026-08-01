"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { authClient } from "@/lib/auth-client";

interface CourseCardProps {
  id: string;
  title: string;
  price: string | number;
  image: string;
  productId: string;
  purchased?: boolean;
}

export default function CourseCard({
  id,
  title,
  price,
  image,
  productId,
  purchased = false,
}: CourseCardProps) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const priceNum = typeof price === "string" ? parseFloat(price) : price;
  const courseUrl = `/courses/${id}`;

  function handleBuy() {
    if (!session?.user) {
      // Not signed in — redirect to sign-in with a return path
      router.push(`/sign-in?redirect=/courses/${id}`);
      return;
    }
    // Build checkout URL with user ID so Polar knows who's buying
    const url = `/api/checkout?products=${productId}&customerExternalId=${session.user.id}`;
    window.location.href = url;
  }

  return (
    <article
      className="card"
      style={{ display: "flex", flexDirection: "column" }}
    >
      {/* Clickable image → course page */}
      <Link href={courseUrl} className="relative overflow-hidden block" style={{ aspectRatio: "16/9" }}>
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          style={{ transition: "transform 0.4s ease" }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLImageElement).style.transform = "scale(1)";
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(8,12,20,0.8) 0%, transparent 50%)" }}
        />
        {purchased && (
          <div className="absolute top-3 right-3">
            <Badge variant="success">Enrolled</Badge>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        <Link href={courseUrl} className="flex-1 no-underline" style={{ color: "var(--text-primary)" }}>
          <h3
            className="font-semibold text-base leading-snug"
            style={{ transition: "color 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLHeadingElement).style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLHeadingElement).style.color = "var(--text-primary)"; }}
          >
            {title}
          </h3>
        </Link>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xl font-bold" style={{ color: "var(--accent)" }}>
            ${priceNum.toFixed(2)}
          </span>

          {purchased ? (
            <Link href={courseUrl} className="btn btn-primary btn-sm no-underline">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
              Watch Now
            </Link>
          ) : (
            <button onClick={handleBuy} className="btn btn-primary btn-sm">
              {session?.user ? "Buy Course" : "Sign In to Buy"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

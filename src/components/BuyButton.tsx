"use client";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface BuyButtonProps {
  courseId: string;
  price: string;
}

export default function BuyButton({ courseId, price }: BuyButtonProps) {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  function handleBuy() {
    if (!session?.user) {
      router.push(`/sign-in?redirect=/courses/${courseId}`);
      return;
    }
    window.location.href = `/api/checkout?courseId=${encodeURIComponent(courseId)}`;
  }

  return (
    <button onClick={handleBuy} className="btn btn-primary btn-lg">
      {session?.user
        ? `Buy Now — $${price}`
        : "Sign In to Buy"}
    </button>
  );
}

"use client";
import { thumbnailSrc } from "@/lib/media";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import CoursePlaceholder from "@/components/CoursePlaceholder";

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
  purchased = false,
}: CourseCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className="course-card">
      <Link
        href={`/courses/${id}`}
        className="course-cover no-underline"
        tabIndex={-1}
        aria-hidden="true"
      >
        {image && !imageFailed ? (
          <Image
            src={thumbnailSrc(id)}
            unoptimized
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 33vw"
            onError={() => setImageFailed(true)}
            className="object-cover"
          />
        ) : (
          <CoursePlaceholder />
        )}
        {purchased && <span className="cover-tag">Purchased</span>}
      </Link>
      <div className="course-card-body">
        <h3>
          <Link href={`/courses/${id}`} className="no-underline">
            {title}
          </Link>
        </h3>
        <p className="course-format">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <path d="m10 8 6 4-6 4V8Z" />
          </svg>
          Video course <span aria-hidden="true">·</span> Self-paced
        </p>
        <div className="course-card-footer">
          <strong>
            {purchased
              ? "Full access"
              : new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(Number(price))}
          </strong>
          <Link href={`/courses/${id}`} className="course-link no-underline">
            {purchased ? "Start learning" : "View course"}{" "}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

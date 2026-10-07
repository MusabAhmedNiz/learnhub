import Link from "next/link";
export default function Brand() {
  return (
    <Link href="/" className="brand no-underline" aria-label="LearnHub home">
      <span className="brand-mark" aria-hidden="true">
        <svg
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M3 5c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2V5Z" />
          <path d="M12 7v14" />
        </svg>
      </span>
      LearnHub
    </Link>
  );
}

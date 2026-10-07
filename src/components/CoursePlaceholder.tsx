export default function CoursePlaceholder() {
  return (
    <div className="course-placeholder" aria-hidden="true">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect
          x="5"
          y="9"
          width="38"
          height="30"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="m20 17 11 7-11 7V17Z" fill="currentColor" />
      </svg>
    </div>
  );
}

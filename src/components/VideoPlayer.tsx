"use client";

import { useEffect, useState } from "react";
import { Video } from "@imagekit/next";
import Spinner from "@/components/ui/Spinner";

interface VideoPlayerProps {
  courseId: string;
}

export default function VideoPlayer({ courseId }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to load video");
          return;
        }
        const data = await res.json();
        setVideoUrl(data.url);
      } catch {
        setError("Failed to load video");
      }
    }

    fetchSignedUrl();
  }, [courseId]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center py-20"
        style={{ color: "var(--error)" }}
      >
        <p>{error}</p>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <Video
      src={videoUrl}
      controls
      className="w-full"
      style={{ maxHeight: "560px", display: "block" }}
    />
  );
}

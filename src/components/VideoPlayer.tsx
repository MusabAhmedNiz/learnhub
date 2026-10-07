"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Spinner from "@/components/ui/Spinner";
import { courseQueries } from "@/lib/queries";

export default function VideoPlayer({ courseId }: { courseId: string }) {
  const video = useQuery(courseQueries.video(courseId));
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const position = useRef(0);

  if (video.isPending)
    return (
      <div
        className="flex items-center justify-center py-20"
        role="status"
        aria-label="Loading video"
      >
        <Spinner size={32} />
      </div>
    );
  if (video.isError || playbackError)
    return (
      <div className="query-state" role="alert">
        <p>{playbackError || video.error?.message}</p>
        <button
          className="btn btn-secondary"
          disabled={video.isFetching}
          onClick={async () => {
            const result = await video.refetch();
            if (result.isSuccess) setPlaybackError(null);
          }}
        >
          {video.isFetching ? "Loading…" : "Reload video"}
        </button>
      </div>
    );

  return (
    <video
      key={video.data.url}
      aria-label="Course video"
      src={video.data.url}
      controls
      playsInline
      preload="metadata"
      className="w-full"
      style={{ maxHeight: 560, display: "block" }}
      onTimeUpdate={(event) => {
        position.current = event.currentTarget.currentTime;
      }}
      onLoadedMetadata={(event) => {
        event.currentTarget.currentTime = position.current;
      }}
      onError={() =>
        setPlaybackError(
          "Playback failed or the link expired. Reload to get a fresh link. If it still fails, the video format may not be supported.",
        )
      }
    />
  );
}

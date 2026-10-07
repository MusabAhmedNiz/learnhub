"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { courseQueries, fetchJson } from "@/lib/queries";
import Button from "@/components/ui/Button";

export default function DeleteCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const deletion = useMutation({
    mutationFn: () =>
      fetchJson(`/api/courses/${encodeURIComponent(courseId)}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: courseQueries.all });
      router.push("/dashboard");
      router.refresh();
    },
  });
  return (
    <div>
      {confirming ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm">Delete this course?</span>
          <Button
            variant="danger"
            size="sm"
            loading={deletion.isPending}
            onClick={() => deletion.mutate()}
          >
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setConfirming(false);
              deletion.reset();
            }}
            disabled={deletion.isPending}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
          Delete course
        </Button>
      )}
      {deletion.isError && (
        <p role="alert" className="form-error mt-2">
          {deletion.error.message}
        </p>
      )}
    </div>
  );
}

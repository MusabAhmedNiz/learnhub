"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { courseQueries, fetchJson } from "@/lib/queries";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { courseSchema, type CourseValues } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { uploadMedia } from "@/lib/upload";
import { type MediaKind } from "@/lib/media";
import { getFieldError } from "@/lib/form-utils";

interface CourseFormProps {
  mode: "create" | "edit";
  courseId?: string;
  defaultValues?: Partial<CourseValues>;
}

export default function CourseForm({
  mode,
  courseId,
  defaultValues,
}: CourseFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const saveCourse = useMutation({
    mutationFn: (value: CourseValues) =>
      fetchJson(
        mode === "create" ? "/api/courses" : `/api/courses/${courseId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...value, price: Number(value.price) }),
        },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: courseQueries.all }),
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [progress, setProgress] = useState({ image: 0, video: 0 });
  const controllers = useRef<Partial<Record<MediaKind, AbortController>>>({});
  useEffect(() => {
    const active = controllers.current;
    return () => {
      active.image?.abort();
      active.video?.abort();
    };
  }, []);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      title: defaultValues?.title ?? "",
      price: defaultValues?.price ?? "",
      productId: defaultValues?.productId ?? "",
      image: defaultValues?.image ?? "",
      video: defaultValues?.video ?? "",
    },
    validators: { onChange: courseSchema },
    onSubmit: async ({ value }) => {
      if (imageUploading || videoUploading) return;
      setServerError(null);
      setServerSuccess(null);

      try {
        await saveCourse.mutateAsync(value);
        setServerSuccess(
          mode === "create"
            ? "Course created successfully!"
            : "Course updated successfully!",
        );
        if (mode === "create") router.push("/dashboard");
        router.refresh();
      } catch (error) {
        setServerError(
          error instanceof Error
            ? error.message
            : "Could not save this course. Please try again.",
        );
      }
    },
  });

  async function handleFileUpload(
    file: File,
    kind: MediaKind,
    setUploading: (v: boolean) => void,
    onSuccess: (key: string) => void,
  ) {
    setServerError(null);
    setServerSuccess(null);
    setUploading(true);
    setProgress((previous) => ({ ...previous, [kind]: 0 }));
    const controller = new AbortController();
    controllers.current[kind] = controller;
    try {
      const key = await uploadMedia(
        file,
        kind,
        (value) => {
          setProgress((previous) => ({ ...previous, [kind]: value }));
        },
        controller.signal,
      );
      onSuccess(key);
    } catch (error) {
      setServerError(
        controller.signal.aborted
          ? "Upload cancelled."
          : error instanceof Error
            ? error.message
            : "Upload failed. Please try again.",
      );
    } finally {
      delete controllers.current[kind];
      setUploading(false);
      const input =
        kind === "image" ? imageInputRef.current : videoInputRef.current;
      if (input) input.value = "";
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      noValidate
      className="flex flex-col gap-6"
    >
      {/* Title */}
      <form.Field
        name="title"
        validators={{ onChange: z.string().min(3, "At least 3 characters") }}
      >
        {(field) => (
          <Input
            id="course-title"
            label="Course Title"
            type="text"
            placeholder="e.g. Complete React Developer"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={getFieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>

      {/* Price */}
      <form.Field
        name="price"
        validators={{
          onChange: z
            .string()
            .min(1, "Price is required")
            .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
              message: "Enter a valid non-negative number",
            }),
        }}
      >
        {(field) => (
          <Input
            id="course-price"
            label="Price (USD)"
            type="number"
            min="0"
            step="0.01"
            placeholder="29.99"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={getFieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>

      {/* Polar Product ID */}
      <form.Field
        name="productId"
        validators={{
          onChange: z.string().min(1, "Polar product ID is required"),
        }}
      >
        {(field) => (
          <Input
            id="course-product-id"
            label="Polar Product ID"
            type="text"
            placeholder="prod_xxxxxxxxxxxxxxxx"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={getFieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>

      {/* Image Upload */}
      <form.Field name="image">
        {(field) => (
          <div className="form-field">
            <label className="form-label" htmlFor="course-image-upload">
              Course Thumbnail
            </label>
            <div
              className="flex flex-col gap-3 p-4 rounded-xl"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              {field.state.value && (
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--success)" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Image uploaded
                </div>
              )}
              <input
                ref={imageInputRef}
                id="course-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={imageUploading}
                className="form-input"
                style={{ cursor: "pointer", paddingTop: "0.4rem" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  handleFileUpload(file, "image", setImageUploading, (url) =>
                    field.handleChange(url),
                  );
                }}
              />
              {imageUploading && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {progress.image === 100
                    ? "Verifying upload…"
                    : `Uploading image… ${progress.image}%`}{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => controllers.current.image?.abort()}
                  >
                    Cancel upload
                  </button>
                </p>
              )}
              {field.state.value && (
                <p
                  className="text-xs truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {field.state.value}
                </p>
              )}
            </div>
            {getFieldError(field.state.meta.errors) && (
              <span className="form-error">
                {getFieldError(field.state.meta.errors)}
              </span>
            )}
          </div>
        )}
      </form.Field>

      <p className="text-sm">
        Thumbnails: JPEG, PNG or WebP, up to 10 MiB. Videos: MP4 or WebM, up to
        1 GiB. Use H.264/AAC MP4 for broad browser support.
      </p>

      {/* Video Upload */}
      <form.Field name="video">
        {(field) => (
          <div className="form-field">
            <label className="form-label" htmlFor="course-video-upload">
              Course Video
            </label>
            <div
              className="flex flex-col gap-3 p-4 rounded-xl"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              {field.state.value && (
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--success)" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Video uploaded
                </div>
              )}
              <input
                ref={videoInputRef}
                id="course-video-upload"
                type="file"
                accept="video/mp4,video/webm"
                disabled={videoUploading}
                className="form-input"
                style={{ cursor: "pointer", paddingTop: "0.4rem" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  handleFileUpload(file, "video", setVideoUploading, (url) =>
                    field.handleChange(url),
                  );
                }}
              />
              {videoUploading && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {progress.video === 100
                    ? "Verifying upload…"
                    : `Uploading video… ${progress.video}%`}{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => controllers.current.video?.abort()}
                  >
                    Cancel upload
                  </button>
                </p>
              )}
              {field.state.value && (
                <p
                  className="text-xs truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {field.state.value}
                </p>
              )}
            </div>
            {getFieldError(field.state.meta.errors) && (
              <span className="form-error">
                {getFieldError(field.state.meta.errors)}
              </span>
            )}
          </div>
        )}
      </form.Field>

      {/* Server messages */}
      {serverError && (
        <div
          className="form-error p-3 rounded-lg"
          style={{ background: "var(--error-light)", color: "var(--error)" }}
          role="alert"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {serverError}
        </div>
      )}
      {serverSuccess && (
        <div
          className="p-3 rounded-lg flex items-center gap-2 text-sm"
          style={{
            background: "rgba(34,197,94,0.1)",
            color: "var(--success)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
          role="status"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {serverSuccess}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              fullWidth
              loading={isSubmitting as boolean}
              disabled={!canSubmit || imageUploading || videoUploading}
            >
              {mode === "create" ? "Create Course" : "Save Changes"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

# LearnHub improvement plan

Status: proposal based on the current source. The redesign and Cloudflare migration have not been implemented. Performance findings below are code-review observations, not measured benchmark results.

## 1. Frontend direction

Build a quiet, content-first course application. Start with one catalog screen and one course screen to agree on the design before applying it throughout the app.

- Warm off-white page background, white surfaces, dark text, and one restrained blue accent for interactive elements.
- One font family, a consistent spacing scale, subtle borders, and modest corner radii.
- Remove decorative gradients, glass blur, glowing buttons, background grids, and staggered entrance animations.
- Lead with the actual catalog rather than a large marketing hero. Replace claims such as "new courses added weekly" and "industry experts" with copy supported by the content.
- Show real course thumbnails, titles, prices, and purchase states. Add duration or instructor information only when the data model supports it.
- Give the course page a clear video/content area and a compact purchase or access panel.
- Keep admin screens practical: readable tables, visible upload progress, field errors, and explicit save states.
- Make navigation, forms, and grids work at narrow mobile widths; provide keyboard focus states, sufficient contrast, and reduced-motion support.

Primary files: `src/app/globals.css`, `src/app/(main)/page.tsx`, `src/components/CourseCard.tsx`, shared UI components, auth pages, and admin layouts.

## 2. Fix behavior and measure performance

### Form and upload reliability

`src/components/forms/CourseForm.tsx` currently compares the parsed response against a few strings, while the course API returns JSON objects and HTTP error statuses. A failed request can therefore reach the success state.

- Check `res.ok`, handle network failures, and display the API's error message without reporting a successful save.
- Check upload-authorization responses before passing their contents to the upload SDK.
- Show progress, file size/type validation, cancellation, and retry. Clear stale success/error state when a new action starts.
- Validate course payloads on the server as well as in the form.

### Rendering and data

- Capture mobile Lighthouse and browser-network baselines for the catalog, course page, and admin form before changing code.
- The homepage fetches the entire course catalog and all of the user's purchases. Add bounded queries and pagination as the catalog grows, and fetch purchase state only for visible courses.
- Retain server rendering for database-backed pages; keep client components focused on interactive controls.
- Audit image dimensions, responsive sizes, and loading priority. Avoid layout shifts and loading full-resolution thumbnails unnecessarily.
- Replace the current 300px-minimum card grid with a layout that also fits narrow viewports with page padding.
- Measure again under the same conditions. Target mobile LCP ≤2.5s and CLS ≤0.1; assess field INP when real usage data is available.

## 3. Cloudflare media proposal

Current flow: the browser obtains admin-only authorization from `/api/upload`, then uploads directly to ImageKit. File bodies already bypass the Next.js server. Before migrating, identify the actual constraint: upload-size limit, quota, processing time, cost, connection failure, or playback performance.

### Recommended split

| Media | Proposed service | Reason |
| --- | --- | --- |
| Course thumbnails and attachments | Cloudflare R2 | S3-compatible object storage and direct uploads |
| Paid course videos | Cloudflare Stream | Managed video processing, adaptive playback, resumable uploads, and signed access |

R2 alone is reasonable for small, pre-encoded MP4 files, but it does not transcode video or automatically provide adaptive streaming. Replacing ImageKit video URLs with R2 URLs is not a complete video-platform migration.

### Upload and playback flow

1. An admin requests an upload session from Next.js. The server validates the intended file and generates a unique asset identifier.
2. For R2, return a short-lived presigned PUT URL with the expected content type. Configure bucket CORS for the application's origins; retain credentials only on the server.
3. For Stream, provision a one-time direct-upload URL with signed playback required. Use tus for resumable uploads; Cloudflare requires it for videos over 200 MB.
4. The browser uploads directly to Cloudflare and displays progress. After upload, verify the R2 object or confirm Stream processing status before allowing the asset to be attached to a published course. A successful upload is not the same as playable video.
5. Store an object key or Stream video ID, provider, and processing state in the database, rather than a temporary playback URL.
6. Keep course purchase checks on the server. After authorization, issue a short-lived Stream playback token (or a presigned GET for private R2 files).

Public thumbnails and paid media need separate delivery policies. R2 S3 presigned URLs use the R2 API hostname and cannot simply be rewritten to a custom CDN domain.

### Migration sequence

1. Confirm typical video sizes/durations, expected viewing volume, the ImageKit limitation, and the acceptable monthly budget.
2. Configure a development R2 bucket and Stream access; prove one thumbnail upload and one signed video playback.
3. Add provider-aware media fields and support both existing ImageKit assets and new Cloudflare assets during the transition.
4. Replace the upload UI and player integration; preserve the existing purchase gate.
5. Copy existing assets, verify processing/playback, and switch course references in batches. Retain the original references for rollback until verification is complete.
6. Remove the old provider integration after all active assets and access flows have been checked.

Acceptance checks: non-admin upload rejection, non-purchaser playback rejection, expired-token rejection, successful purchaser playback, interrupted-upload recovery, processing failure display, and repeated payment-webhook delivery without duplicate purchases.

References:
- [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Stream direct creator uploads](https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/)
- [Stream signed playback](https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/)

## 4. Demo and screenshots

- Use the existing demo recording as a linked walkthrough once its URL or file is available.
- Capture a catalog screenshot, a course/player screenshot, and an admin upload screenshot with representative demo content.
- Keep compressed screenshots in `docs/screenshots/` and link a video thumbnail to the hosted recording rather than committing a large video binary.
- Prefer a dedicated demo deployment using an explicit Polar sandbox setting. The current code ties Polar's environment to `NODE_ENV`, so production-hosted demos need a code/configuration change before they can safely advertise test checkout.

## Suggested delivery order

1. Correct form error handling and upload feedback.
2. Agree on the catalog/course visual design, then apply shared design tokens and components.
3. Address measured performance problems and responsive/accessibility issues.
4. Implement and verify the media-provider migration.
5. Refresh screenshots and the recorded walkthrough to match the shipped interface.

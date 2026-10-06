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

Current flow: the browser obtains admin-only authorization from `/api/upload`, then uploads directly to ImageKit. File bodies already bypass the Next.js server. The confirmed constraint is ImageKit's free-tier quota being consumed during development as well as production. The target is to stay within a free allowance and keep routine development independent of cloud quotas.

### Agreed direction: original-file uploads and R2 playback

LearnHub is a personal project. The goal is straightforward file uploads and playback at the uploaded video's original resolution. Keep the implementation small and easy to understand.

| Media | Proposed service | Reason |
| --- | --- | --- |
| Course thumbnails and attachments | Cloudflare R2 Standard | S3-compatible object storage and direct uploads |
| Paid course videos | Private Cloudflare R2 Standard objects | Original-resolution playback through purchase-authorized, expiring GET URLs |
| Routine development | Local S3-compatible storage, such as MinIO | Test uploads and access flows without consuming the cloud allowance |

Upload and serve the original video file, and use a native `<video controls preload="metadata">` player. R2 supports byte-range requests, allowing the browser to request portions of the file and seek without first downloading the entire video. It does not generate different resolutions, which is fine for this project's scope.

The source file still needs to use codecs the target browsers can play; MP4 with H.264 video and AAC audio is a practical choice. Resolution and codec compatibility are separate concerns. For compatible MP4s, moving metadata to the beginning of the file with `ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4` can improve playback startup without re-encoding or changing resolution.

Cloudflare's published R2 Standard free allowance, checked on October 6, 2026, is 10 GB-month of storage, 1 million Class A operations, and 10 million Class B operations per month, with free direct R2 egress. This is a metered allowance, not an unlimited service or automatic hard spending cap. Infrequent Access storage is not included in the free tier.

Separate development and production buckets isolate assets and credentials, but share the account's allowance. Use small local media fixtures for routine development, a disposable R2 development bucket for occasional integration checks, and a separate production bucket. Expire temporary development objects and abort unfinished multipart uploads. Storage expiration reduces future consumption; it does not undo operations already used.

### Upload and playback flow

1. An admin requests an upload session from Next.js. The server validates the intended file and generates a unique asset identifier.
2. Return a short-lived presigned PUT URL with the expected content type. Configure bucket CORS for the application's origins; retain credentials only on the server. Use the same application-side storage interface with a configurable local S3 endpoint during development.
3. The browser uploads directly to storage and displays progress. Start with a single PUT upload; add multipart uploads only if actual file sizes or interrupted uploads justify them. Client-side file checks improve feedback; the completion endpoint must also validate the stored object's size and metadata before accepting it.
4. Verify the object before attaching it to the course. Use a browser-compatible source video, since R2 stores and serves the file without processing it.
5. Store the stable object key rather than the temporary upload or playback URL. Reuse the current course image/video structure where practical rather than building a general media-management subsystem.
6. Keep the existing course purchase checks on the server. After authorization, issue an expiring presigned GET for the private video. Test playback and seeking, and provide a way to obtain a fresh URL after rechecking access when the old one expires.

Public thumbnails and paid media need separate delivery policies. R2 S3 presigned URLs use the R2 API hostname and cannot simply be rewritten to a custom CDN domain.

### Migration sequence

1. Estimate total original-file storage against R2's allowance. Start with a small representative catalog.
2. Prove one thumbnail upload and one signed MP4 playback against R2. Configure local S3-compatible storage for routine upload development so repeated tests do not consume the cloud allowance.
3. Make the smallest schema change needed for stable object keys. For this personal project, use a one-time asset migration; keep temporary compatibility with ImageKit only if the existing catalog needs it during the switch.
4. Replace the upload UI and player integration; preserve the existing purchase gate.
5. Copy existing assets, verify file integrity and playback, and switch course references in batches. Retain the original references for rollback until verification is complete.
6. Remove the old provider integration after all active assets and access flows have been checked.

Acceptance checks: non-admin upload rejection, non-purchaser playback rejection, expired-URL rejection, successful purchaser playback and seeking, failed-upload feedback and retry, and upload validation failure display. Verify that routine development uses local fixtures/storage and that temporary cloud assets are cleaned up. Payment behavior should remain consistent through the migration.

References:
- [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [R2 pricing and free allowance](https://developers.cloudflare.com/r2/pricing/)

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

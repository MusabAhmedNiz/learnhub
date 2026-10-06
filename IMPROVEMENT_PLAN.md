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

### Recommended starting point: R2 and local development storage

| Media | Proposed service | Reason |
| --- | --- | --- |
| Course thumbnails and attachments | Cloudflare R2 Standard | S3-compatible object storage and direct uploads |
| Paid course videos | Private Cloudflare R2 Standard objects | Pre-encoded MP4 playback through purchase-authorized, expiring GET URLs |
| Routine development | Local S3-compatible storage, such as MinIO | Test uploads and access flows without consuming the cloud allowance |

R2 is suitable for an initial portfolio-scale implementation using pre-encoded, browser-compatible MP4 files. It does not transcode video or automatically provide adaptive streaming. Prepare H.264/AAC video with MP4 fast-start metadata locally, and test seeking and playback on mobile. Use a native video player with `preload="metadata"`; add a way to refresh an expired playback URL after rechecking access.

Cloudflare's published R2 Standard free allowance, checked on October 6, 2026, is 10 GB-month of storage, 1 million Class A operations, and 10 million Class B operations per month, with free direct R2 egress. This is a metered allowance, not an unlimited service or automatic hard spending cap. Infrequent Access storage is not included in the free tier.

Separate development and production buckets isolate assets and credentials, but share the account's allowance. Use small local media fixtures for routine development, a disposable R2 development bucket for occasional integration checks, and a separate production bucket. Expire temporary development objects and abort unfinished multipart uploads. Storage expiration reduces future consumption; it does not undo operations already used.

Cloudflare Stream is a future paid upgrade if adaptive video becomes necessary. Its current published price is $5/month per 1,000 stored minutes plus $1 per 1,000 delivered minutes; it is not part of R2's free tier.

### Upload and playback flow

1. An admin requests an upload session from Next.js. The server validates the intended file and generates a unique asset identifier.
2. Return a short-lived presigned PUT URL with the expected content type. Configure bucket CORS for the application's origins; retain credentials only on the server. Use the same application-side storage interface with a configurable local S3 endpoint during development.
3. The browser uploads directly to storage and displays progress. Use multipart uploads for large files, with retryable parts and explicit completion/abort handling. Client-side file checks improve feedback; the completion endpoint must also validate the stored object's size and metadata before accepting it.
4. Verify the object before allowing it to be attached to a published course. Encode and check video compatibility before upload, since R2 does not process the video.
5. Store an object key, provider, and upload state in the database, rather than a temporary playback URL.
6. Keep course purchase checks on the server. After authorization, issue a short-lived presigned GET for the private video. Test byte-range requests and expiry behavior during seeking.

Public thumbnails and paid media need separate delivery policies. R2 S3 presigned URLs use the R2 API hostname and cannot simply be rewritten to a custom CDN domain.

### Migration sequence

1. Estimate total encoded video storage and expected viewing volume against R2's allowance. Start with a small representative catalog.
2. Configure local S3-compatible storage and a disposable R2 development bucket; prove one thumbnail upload and one signed MP4 playback against both. Use integration checks to catch differences between local S3 behavior and R2.
3. Add provider-aware media fields and support both existing ImageKit assets and new Cloudflare assets during the transition.
4. Replace the upload UI and player integration; preserve the existing purchase gate.
5. Copy existing assets, verify file integrity and playback, and switch course references in batches. Retain the original references for rollback until verification is complete.
6. Remove the old provider integration after all active assets and access flows have been checked.

Acceptance checks: non-admin upload rejection, non-purchaser playback rejection, expired-URL rejection, successful purchaser playback and seeking, interrupted-upload recovery, upload validation failure display, and repeated payment-webhook delivery without duplicate purchases. Verify that development points to local storage by default and that temporary cloud assets are cleaned up.

References:
- [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [R2 pricing and free allowance](https://developers.cloudflare.com/r2/pricing/)
- [Stream pricing, for a future paid upgrade](https://developers.cloudflare.com/stream/pricing/)

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

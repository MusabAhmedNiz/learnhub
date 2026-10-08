# LearnHub

A full-stack course platform built with Next.js and PostgreSQL. LearnHub connects account creation, course checkout, payment webhooks, and purchase-gated video access, with an admin dashboard for managing the catalog.

**[Live demo](https://learnhub-eight-phi.vercel.app/)** · [Source](https://github.com/MusabAhmedNiz/learnhub)

For test deployments, set `POLAR_SERVER=sandbox` and use Polar sandbox credentials and products.

## Features

- Email/password authentication with Better Auth.
- Public course catalog and a signed-in user's purchased courses.
- Admin-only course creation, editing, deletion, and upload authorization.
- Direct browser uploads to Cloudflare R2 (or local MinIO), with progress, cancellation, and server verification.
- Polar checkout and a paid-order webhook that records purchases.
- A video endpoint that checks the session and purchase (or admin role) before issuing a time-limited private video URL.

## Stack

| Layer | Technology |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| UI and forms | Tailwind CSS 4, TanStack Form, Zod |
| Client data | TanStack Query 5 |
| Database | PostgreSQL, Prisma 7 with the PostgreSQL driver adapter |
| Authentication | Better Auth with its admin plugin |
| Payments | Polar |
| Media | Cloudflare R2 / S3-compatible storage |

## How a purchase becomes course access

1. A course stores the ID of its corresponding Polar product.
2. The checkout endpoint reads the selected course and signed-in user on the server, and includes the course ID in Polar metadata.
3. Polar sends a paid-order event to `/api/webhooks/polar`; the SDK handler verifies its signature and checks that the selected course matches the paid product.
4. The handler maps the product to a course and upserts a `Purchase`. The database's unique `(userId, courseId)` constraint prevents duplicate purchases for the same user and course.
5. The player requests `/api/courses/[id]`. After checking access, the server returns a signed video URL with a one-hour expiry. Reloading a failed or expired video rechecks access and preserves the playback position.

Keep the R2 bucket private: do not enable an r2.dev URL or public custom domain. Thumbnails have a public course-specific redirect endpoint; videos are signed only after authorization.

For a protected Vercel preview, configure Polar with the exact `/api/webhooks/polar` URL, without a trailing slash, and append `?x-vercel-protection-bypass=<automation-bypass-secret>`. Keep that full URL private. Vercel otherwise returns 401 before the webhook handler runs. Polar does not follow redirect responses. See [Vercel's webhook bypass instructions](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).

After checkout, the library checks for the selected course for up to one minute while the webhook arrives. Older orders without course metadata can be matched only when their product identifies a single course. If multiple courses share that product, the webhook logs the order ID for manual reconciliation rather than granting an arbitrary course.

## Run locally

### Requirements

- Node.js 20.19+ (or a newer Prisma-compatible LTS) and pnpm.
- A PostgreSQL database.
- Docker for local MinIO storage, or a private Cloudflare R2 bucket.
- A Polar sandbox account, access token, product, and webhook secret for testing the purchase flow.

### Setup

```bash
git clone git@github.com:MusabAhmedNiz/learnhub.git
cd learnhub
pnpm install --frozen-lockfile
cp .env.example .env
```

Fill in `.env` using the comments in [`.env.example`](./.env.example). Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32`.

```bash
docker compose -f compose.storage.yml up -d --wait
pnpm storage:init
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm dev
```

Open [localhost:3000](http://localhost:3000).

### Create an admin

Set `EMAIL`, `PASSWORD`, and `NAME` in `.env`, then run:

```bash
pnpm exec prisma db seed
```

These variables are used by the existing seed script to create an admin through Better Auth. Set all three rather than relying on the script's fallback values. Use a new email address and check the seed output: the current script logs failures rather than returning a failing exit code.

### Configure payments and media

1. Set `POLAR_SERVER=sandbox` and use Polar **sandbox** credentials for testing, including hosted and local production builds. Live payments require an explicit `POLAR_SERVER=production` setting and matching production credentials and products.
2. Create a Polar product and use its ID when creating the corresponding course in the admin dashboard.
3. Configure a paid-order webhook pointing to `/api/webhooks/polar` on your application's reachable HTTPS URL. For local development, forward a tunnel to port 3000 and use the appropriate application URL in `BETTER_AUTH_URL`.
4. For local uploads, use the S3 values in `.env.example`, start `compose.storage.yml`, and run `pnpm storage:init`. MinIO serves the private bucket at `http://localhost:9000` and allows browser requests from `BETTER_AUTH_URL`. The browser must be able to reach `S3_ENDPOINT`.
5. For R2, set `S3_ENDPOINT` to `https://<account-id>.r2.cloudflarestorage.com`, `S3_REGION=auto`, the bucket name, and bucket-scoped Object Read & Write access keys. Never expose these keys through `NEXT_PUBLIC_` variables.
6. Apply this bucket CORS policy, replacing the origin with your application URL (add localhost only to a development bucket):

```json
[
  {
    "AllowedOrigins": ["https://your-app.example"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Range"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
    "MaxAgeSeconds": 3600
  }
]
```

See Cloudflare's [presigned URL](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) and [CORS](https://developers.cloudflare.com/r2/buckets/cors/) documentation.

### Development workflow

MinIO runs on your computer and implements the S3 storage API used by R2. In development, uploads and video requests go to `http://localhost:9000`; production uses your R2 endpoint and credentials. Both run the same application upload and access-control code. Local media does not consume R2 storage or requests.

The Compose setup uses a digest-pinned [Coollabs community image](https://github.com/coollabsio/minio), built from upstream MinIO source. The first start downloads the image; later starts reuse it.

After the initial setup, start a development session with:

```bash
docker compose -f compose.storage.yml up -d --wait
pnpm dev
```

Sign in as an admin and upload a thumbnail and a small demo video through **New course**. The catalog starts empty until you create a course. Check playback as an admin; use a test purchase to exercise purchaser access. Media is stored in the local `minio-data` Docker volume, while course records live in the database configured by `DATABASE_URL`. Use a separate development database so local media references do not affect production courses.

Open [localhost:9001](http://localhost:9001) to inspect the MinIO bucket. Its local credentials are `learnhub-local` / `learnhub-local-password`, matching `.env.example`. `pnpm storage:init` creates the private `learnhub` bucket and is safe to rerun.

To stop MinIO:

```bash
docker compose -f compose.storage.yml down
```

Stopping the container preserves uploaded files. Adding `-v` deletes the local media volume. Local files are separate from R2: when setting up production, configure R2 in the deployment and upload your demo there.

### Media files

Courses store stable `images/…` and `videos/…` object keys. Single PUT uploads are limited to 10 MiB for JPEG/PNG/WebP thumbnails and 1 GiB for MP4/WebM videos. Video files are served at their original resolution without transcoding; H.264/AAC MP4 is a practical browser-compatible source format. Size and Content-Type metadata are verified, but codec compatibility is not inspected on the server.

Uploads are not automatically deleted when cancelled, replaced, or when a course is deleted. Clean up unreferenced objects separately; do not apply blanket expiration to the production media prefixes.

## Deploy a test instance to Vercel

Use a hosted PostgreSQL database, a private R2 bucket, and Polar sandbox. Local MinIO is for development; the hosted application cannot use your computer's `localhost:9000`. Upload the demo course again on the hosted instance so its object keys refer to files in R2.

Commit and push the application changes, then import this GitHub repository into Vercel, or update the existing connected project. Select **Next.js**, leave the root directory at the repository root, and choose **Node.js 24.x**. The checked-in `vercel.json` sets the build command to:

```bash
pnpm vercel-build
```

This command applies committed database migrations, generates Prisma Client, and builds Next.js. Use a database dedicated to this test instance. If its runtime connection is pooled, provide the direct connection as `DIRECT_URL` for migrations.

Use the stable project URL, such as `https://your-project.vercel.app`, throughout the configuration. A test instance can use Vercel's **Production** deployment environment while keeping Polar in **sandbox**. Local environment files are excluded from CLI uploads by `.vercelignore`. Add these variables to that environment in Vercel:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Hosted PostgreSQL connection string; use the provider's pooled URL for runtime if available |
| `DIRECT_URL` | Optional direct connection to the same database, for migrations |
| `BETTER_AUTH_URL` | Exact stable HTTPS application origin, without a trailing slash |
| `BETTER_AUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_REGION` | `auto` |
| `S3_BUCKET` | Name of the private R2 test bucket |
| `S3_ACCESS_KEY_ID` | Bucket-scoped R2 Object Read & Write access key |
| `S3_SECRET_ACCESS_KEY` | Matching R2 secret access key |
| `POLAR_SERVER` | `sandbox` |
| `POLAR_ACCESS_TOKEN` | Access token created in Polar sandbox |
| `POLAR_WEBHOOK_SECRET` | Signing secret of the sandbox webhook described below |

Apply the R2 CORS policy shown above, with `AllowedOrigins` set to the exact application origin, then deploy. In [Polar sandbox](https://sandbox.polar.sh), create a product and an `order.paid` webhook pointing to `https://your-project.vercel.app/api/webhooks/polar`. Copy its signing secret into `POLAR_WEBHOOK_SECRET` and redeploy after changing environment variables. If Vercel Deployment Protection covers this endpoint, configure its [webhook protection bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) so Polar can deliver events.

If this database already has your admin account, sign in with it. Otherwise, put the hosted database connection, auth URL, auth secret, and your chosen `EMAIL`, `PASSWORD`, and `NAME` in a separate `.env.vercel.local` file, then create the admin locally:

```bash
pnpm exec prisma generate
node --env-file=.env.vercel.local --import tsx prisma/seed.ts
```

The file is ignored by Git. Use a new email and a strong password, and check for `Created admin` in the seed output. This does not change your local `.env` or run the seed on every deployment.

Test the complete flow:

1. Sign in as the admin, create a course using the sandbox product ID, and upload a small thumbnail and video. Check thumbnail display, video playback, and seeking.
2. Sign up as a separate learner. Confirm the course is locked before purchase, and that the learner cannot open the admin dashboard.
3. Buy the course using sandbox card `4242 4242 4242 4242`, a future expiry, and any CVC. Check that Polar reports a successful `order.paid` delivery to the webhook.
4. Open the learner's purchased courses and play the video. Refresh and sign in again to check that access persists.

If something fails, use Vercel's runtime logs for API errors, Polar's webhook delivery log for purchase failures, and the browser Network panel for R2/CORS errors.

References: [Vercel deployment](https://vercel.com/docs/deployments), [Prisma on Vercel](https://www.prisma.io/docs/orm/v7/prisma-client/deployment/serverless/deploy-to-vercel), and [Polar sandbox testing](https://polar.sh/docs/integrate/sandbox).

## Useful commands

```bash
pnpm dev                         # Development server
pnpm lint                        # ESLint
pnpm test                        # Media, access-control, and checkout tests
TEST_STORAGE=1 pnpm test         # Also exercise local S3 (requires .env and storage:init)
pnpm exec tsc --noEmit            # Type checking (after client generation)
pnpm build                       # Generate Prisma Client and build Next.js
pnpm vercel-build                # Apply database migrations, then build for deployment
pnpm start                       # Run a production build
pnpm exec prisma studio          # Inspect the development database
```

## Project layout

```text
prisma/                  Schema, migrations, and admin seed
src/app/(main)/          Catalog and purchased-course pages
src/app/(auth)/          Sign-in and sign-up
src/app/(admin)/         Dashboard and course management
src/app/api/             Auth, courses, checkout, uploads, and Polar webhook
src/components/          Forms, cards, navigation, and video player
src/lib/                 Database client and form utilities
```

## Current scope

Each course currently has one video. Multi-lesson curricula and progress tracking are not implemented. The visual design and media-upload experience are areas for further work.

## Frontend data loading

The responsive frontend pairs a blue-accented learning hero with searchable course cards, price sorting, and shared loading, empty, and retry states. Catalog, purchased-course library, admin overview, and signed video URL requests run through TanStack Query. The root `QueryProvider` owns the browser cache; query definitions and HTTP error handling live in `src/lib/queries.ts`.

Course mutations invalidate the shared course queries. Library and admin queries include the account ID in their cache keys, and authentication changes clear the cache. Video URLs stay fresh for 30 minutes and are removed when their player unmounts. Page-level authentication, purchase checks, course metadata, and admin authorization remain on the server.

The catalog uses real API data; no demo courses are bundled. Configure the database and service environment described above to exercise authenticated learning and checkout locally.

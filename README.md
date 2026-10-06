# LearnHub

A full-stack course platform built with Next.js and PostgreSQL. LearnHub connects account creation, course checkout, payment webhooks, and purchase-gated video access, with an admin dashboard for managing the catalog.

**[Live demo](https://learnhub-eight-phi.vercel.app/)** · [Source](https://github.com/MusabAhmedNiz/learnhub)

The deployed checkout selects Polar's production environment. Treat checkout as a real purchase flow; use your own local sandbox configuration to test payments.

## Features

- Email/password authentication with Better Auth.
- Public course catalog and a signed-in user's purchased courses.
- Admin-only course creation, editing, deletion, and upload authorization.
- Browser-to-ImageKit uploads for course thumbnails and videos.
- Polar checkout and a paid-order webhook that records purchases.
- A video endpoint that checks the session and purchase (or admin role) before issuing a time-limited ImageKit URL.

## Stack

| Layer | Technology |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| UI and forms | Tailwind CSS 4, TanStack Form, Zod |
| Database | PostgreSQL, Prisma 7 with the PostgreSQL driver adapter |
| Authentication | Better Auth with its admin plugin |
| Payments | Polar |
| Media | ImageKit |

## How a purchase becomes course access

1. A course stores the ID of its corresponding Polar product.
2. The checkout flow associates the customer with the signed-in user's ID.
3. Polar sends a paid-order event to `/api/webhooks/polar`; the SDK handler uses the configured webhook secret for verification.
4. The handler maps the product to a course and upserts a `Purchase`. The database's unique `(userId, courseId)` constraint prevents duplicate purchases for the same user and course.
5. The player requests `/api/courses/[id]`. After checking access, the server returns an ImageKit video URL with a one-hour expiry.

Media-provider settings must also require signed delivery for paid videos; an application access check alone does not make a publicly accessible source URL private.

## Run locally

### Requirements

- Node.js 20.19+ (or a newer Prisma-compatible LTS) and pnpm.
- A PostgreSQL database.
- ImageKit credentials and a URL endpoint.
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

1. Use Polar **sandbox** credentials for `pnpm dev`. The checkout route currently selects sandbox outside production and production when `NODE_ENV=production`; a local production build therefore needs matching production credentials.
2. Create a Polar product and use its ID when creating the corresponding course in the admin dashboard.
3. Configure a paid-order webhook pointing to `/api/webhooks/polar` on your application's reachable HTTPS URL. For local development, forward a tunnel to port 3000 and use the appropriate application URL in `BETTER_AUTH_URL`.
4. Set both ImageKit URL endpoint variables to the same endpoint. The server uses `IMAGEKIT_URL_ENDPOINT` for signed playback; the client provider uses `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`.
5. Configure paid-video delivery to require valid signed URLs in ImageKit, and check that unsigned video requests are rejected.

## Useful commands

```bash
pnpm dev                         # Development server
pnpm lint                        # ESLint
pnpm exec tsc --noEmit            # Type checking (after client generation)
pnpm build                       # Production build; requires service configuration
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

Each course currently has one video. Multi-lesson curricula, progress tracking, and automated tests are not implemented. The visual design and media-upload experience are areas for further work.

The current implementation uses ImageKit; a move to Cloudflare is being evaluated, not yet implemented. See the [frontend and media improvement plan](./IMPROVEMENT_PLAN.md) for the proposed direction and implementation order.

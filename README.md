# DocLens

Precision document sharing with page-level readership analytics and self-destruct links. Upload a document, share a tracked link, and see exactly which pages every viewer reads.

## Features

- **Per-page readership tracking** -- know which pages each viewer reads, not just if they opened the document
- **Viewer attribution** -- require name and email before access; every page view is linked to a real identity
- **Self-destruct links** -- documents automatically become inaccessible after the first view
- **Time-limited expiry** -- set links to expire after a configurable duration (1 hour to 7 days)
- **View limits** -- cap the total number of times a link can be accessed
- **PDF rendering** -- in-browser PDF viewer with real-time page change tracking
- **Dashboard analytics** -- per-document stats, readership heatmaps, and full activity logs
- **No account required for viewers** -- recipients only need a name and email, stored locally

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma 7 with Neon adapter |
| File storage | Vercel Blob |
| Auth | JWT (jose), bcryptjs |
| PDF viewer | pdfjs-dist (canvas-based) |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- A Neon database (free tier available at [neon.tech](https://neon.tech))
- A Vercel account with Blob storage enabled

### Environment Variables

Copy `.env.example` or create a `.env` file:

```env
DATABASE_URL=postgresql://user:***@ep-xxx-pooler.aws.neon.tech/neondb?sslmode=require
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
JWT_SECRET=your-random-secret
```

- `DATABASE_URL` -- Neon pooled connection string (use the pooled endpoint from your Neon dashboard)
- `BLOB_READ_WRITE_TOKEN` -- from Vercel Dashboard > Storage > Blob > your store
- `JWT_SECRET` -- any random string for signing auth tokens

### Local Development

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

The app runs on `http://localhost:3000`.

### Database Setup

DocLens uses Prisma with PostgreSQL. Run migrations against your Neon database:

```bash
npx prisma migrate deploy
```

If your network blocks port 5432, run the migration SQL directly via the Neon SQL Editor (console.neon.tech). The migration file is at `prisma/migrations/20260727000000_init/migration.sql`.

## Deployment

### Vercel

1. Push the repository to GitHub
2. Import the project in Vercel
3. Add the three environment variables (`DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `JWT_SECRET`)
4. Deploy

Vercel automatically detects the Next.js framework and uses the build command from `vercel.json`. The `postinstall` script runs `prisma generate` during the build.

### Blob Storage

Create a Blob store in Vercel Dashboard > Storage > Blob. Set the store access to **public** -- DocLens serves files via direct blob URLs.

## Project Structure

```
src/
  app/
    api/                    -- API routes
      analytics/            -- tracking and stats endpoints
      auth/                 -- login, register, logout, me
      documents/            -- upload endpoint
      files/[slug]/         -- file serving (redirects to blob URL)
      links/                -- create and validate share links
    d/[slug]/               -- public document viewer page
    dashboard/              -- user dashboard with analytics
    login/                  -- login page
    register/               -- registration page
    page.tsx                -- homepage with upload and share flow
  components/
    auth-context.tsx        -- React context for auth state
    pdf-canvas-viewer.tsx   -- PDF viewer with page tracking
  lib/
    auth.ts                 -- JWT helpers and middleware
    file-storage.ts         -- Vercel Blob wrapper (put, get, delete)
    nanoid.ts               -- slug generation
    prisma.ts               -- Prisma client with Neon adapter
prisma/
  schema.prisma             -- database schema
  migrations/               -- Prisma migration files
  prisma.config.ts          -- Prisma 7 configuration
```

## API

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/register` | POST | -- | Register a new user |
| `/api/auth/login` | POST | -- | Login, returns JWT cookie |
| `/api/auth/logout` | POST | -- | Clear auth cookie |
| `/api/auth/me` | GET | Required | Get current user |
| `/api/documents/upload` | POST | Optional | Upload a document |
| `/api/links/create` | POST | Optional | Create a share link |
| `/api/links/[slug]` | GET | -- | Validate and return document info |
| `/api/files/[slug]` | GET | -- | Redirect to blob download URL |
| `/api/analytics/track` | POST | -- | Record a page view |
| `/api/analytics/stats` | GET | Required | Get analytics data |

## License

MIT

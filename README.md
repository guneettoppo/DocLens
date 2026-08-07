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

## Architecture

### High-Level System Diagram

```mermaid
flowchart LR
    subgraph Client["BROWSER"]
        B["User Interface"]
    end

    subgraph App["NEXT.JS APP (Vercel)"]
        direction TB
        subgraph Routes["API Routes"]
            AUTH["Auth"]
            UPLOAD["Upload"]
            LINKS["Share Links"]
            FILES["File Serving"]
            TRACK["Analytics"]
        end
        VIEWER["Document Viewer"]
        DASH["Dashboard"]
    end

    subgraph Services["DATA SERVICES"]
        PG[("Neon Postgres")]
        BLOB[("Vercel Blob")]
    end

    B -->|"HTTPS"| App
    App --> VIEWER
    App --> DASH
    VIEWER --> FILES
    VIEWER --> TRACK
    DASH --> TRACK
    DASH --> FILES
    AUTH --> PG
    UPLOAD --> BLOB
    UPLOAD --> PG
    LINKS --> PG
    FILES --> BLOB
    TRACK --> PG

    style B fill:#0F172A,color:#FFFFFF,stroke:#0F172A,stroke-width:2px
    style App fill:#F1F5F9,color:#0F172A,stroke:#94A3B8,stroke-width:2px
    style Routes fill:#FFFFFF,color:#0F172A,stroke:#CBD5E1,stroke-width:1px
    style AUTH fill:#FEE2E2,color:#991B1B,stroke:#FCA5A5
    style UPLOAD fill:#FEE2E2,color:#991B1B,stroke:#FCA5A5
    style LINKS fill:#FEE2E2,color:#991B1B,stroke:#FCA5A5
    style FILES fill:#FEE2E2,color:#991B1B,stroke:#FCA5A5
    style TRACK fill:#FEE2E2,color:#991B1B,stroke:#FCA5A5
    style VIEWER fill:#FEF3C7,color:#92400E,stroke:#FCD34D
    style DASH fill:#FEF3C7,color:#92400E,stroke:#FCD34D
    style PG fill:#ECFDF5,color:#065F46,stroke:#6EE7B7
    style BLOB fill:#F5F3FF,color:#5B21B6,stroke:#C4B5FD
```

### Data Flow: Upload to Share to Track

```mermaid
sequenceDiagram
    autonumber
    participant Uploader as Uploader
    participant App as DocLens App
    participant Blob as Vercel Blob
    participant DB as Neon Postgres
    participant Viewer as Viewer

    Note over Uploader,DB: PHASE 1 - UPLOAD
    Uploader->>App: Drop file (PDF / PPT / DOC)
    App->>Blob: Store file
    Blob-->>App: Public URL
    App->>DB: Save document record
    App-->>Uploader: Document ready

    Note over Uploader,DB: PHASE 2 - CREATE SHARE LINK
    Uploader->>App: Set options (self-destruct, expiry, max views)
    App->>DB: Create share link
    DB-->>App: Link slug
    App-->>Uploader: Share URL (copyable)

    Note over Uploader,DB: PHASE 3 - VIEWER READS
    Viewer->>App: Open share URL
    App->>DB: Validate link (active, expiry, views)
    DB-->>App: Valid document info
    App-->>Viewer: Load PDF viewer

    Note over Uploader,DB: PHASE 4 - TRACKING
    Viewer->>App: Page change (page n)
    App->>DB: Record page view
    DB-->>App: Saved
```

## Database Schema

```mermaid
erDiagram
    USER ||--o{ DOCUMENT : owns
    DOCUMENT ||--o{ SHARELINK : has
    DOCUMENT ||--o{ PAGEVIEW : tracks
    SHARELINK ||--o{ PAGEVIEW : records

    USER {
        string id PK
        string name
        string email UK
        string password
        datetime createdAt
    }

    DOCUMENT {
        string id PK
        string slug UK
        string originalName
        string mimeType
        int fileSize
        string filePath
        int pages
        string thumbnail
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    SHARELINK {
        string id PK
        string slug UK
        string documentId FK
        boolean isDestruct
        datetime expiresAt
        int maxViews
        int viewCount
        boolean isActive
        datetime createdAt
    }

    PAGEVIEW {
        string id PK
        string documentId FK
        string linkId FK
        int pageNumber
        string viewerName
        string viewerEmail
        string viewerIp
        string userAgent
        datetime createdAt
    }
```

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

## Self-Destruct & Link Validation Flow

```mermaid
flowchart TD
    A["GET /api/links/[slug]"] --> B{Link exists?}
    B -- "No" --> C["404 Not Found"]
    B -- "Yes" --> D{isActive?}
    D -- "No" --> C
    D -- "Yes" --> E{isDestruct?}
    E -- "Yes" --> F{viewCount >= 1?}
    F -- "Yes" --> G["410 Gone — self-destructed"]
    F -- "No" --> H{Expired?}
    E -- "No" --> H
    H -- "Yes" --> I["410 Gone — expired"]
    H -- "No" --> J{viewCount >= maxViews?}
    J -- "Yes" --> K["410 Gone — limit reached"]
    J -- "No" --> L["Increment viewCount"]
    L --> M["Return document + PDF URL"]
    M --> N["Viewer loads PDF.js"]
    N --> O["Each page change fires /api/analytics/track"]
```

## Deployment

### Vercel

```mermaid
flowchart LR
    subgraph Local["Local"]
        CODE["Code + Git"]
    end
    subgraph GitHub["GitHub"]
        REPO["guneettoppo/DocLens"]
    end
    subgraph Vercel["Vercel"]
        BUILD["Build: prisma generate + next build"]
        ENV["Env Vars"]
        DEPLOY["Deploy"]
    end
    subgraph Services["Services"]
        NEON[("Neon Postgres")]
        BLOB[("Vercel Blob")]
    end

    CODE -->|"git push"| REPO
    REPO -->|"auto-import"| BUILD
    BUILD --> DEPLOY
    ENV --> DEPLOY
    DEPLOY --> NEON
    DEPLOY --> BLOB
```

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

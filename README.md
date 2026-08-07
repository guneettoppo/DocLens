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
    subgraph Client["Client"]
        B["Browser"]
    end

    subgraph Vercel["Vercel Edge"]
        NG["Next.js 16 App"]
        subgraph API["API Routes"]
            AUTH["/api/auth/*"]
            UPLOAD["/api/documents/upload"]
            LINKS["/api/links/*"]
            FILES["/api/files/[slug]"]
            TRACK["/api/analytics/*"]
        end
        VIEWER["/d/[slug] Viewer"]
        DASH["/dashboard"]
    end

    subgraph Services["Managed Services"]
        PG[("Neon Postgres")]
        BLOB[("Vercel Blob")]
    end

    B --> NG
    NG --> API
    NG --> VIEWER
    NG --> DASH
    API --> AUTH
    API --> UPLOAD
    API --> LINKS
    API --> FILES
    API --> TRACK
    AUTH --> PG
    UPLOAD --> BLOB
    UPLOAD --> PG
    LINKS --> PG
    FILES --> BLOB
    TRACK --> PG
    DASH --> PG
    DASH --> BLOB
```

### Data Flow: Upload to Share to Track

```mermaid
sequenceDiagram
    autonumber
    participant U as User (Uploader)
    participant W as Web App
    participant A as API Routes
    participant B as Vercel Blob
    participant D as Neon Postgres

    rect rgb(240, 248, 255)
        Note over U,D: Upload Phase
        U->>W: Drop file (PDF/PPT/DOC)
        W->>A: POST /api/documents/upload
        A->>B: put(file, { access: public })
        B-->>A: Blob URL
        A->>D: create Document record
        D-->>A: Document (id, slug)
        A-->>W: Document metadata
        W-->>U: "Uploaded ✓"
    end

    rect rgb(255, 248, 240)
        Note over U,D: Share Phase
        U->>W: Set options (self-destruct, expiry, max views)
        W->>A: POST /api/links/create
        A->>D: create ShareLink record
        D-->>A: ShareLink (slug)
        A-->>W: Full share URL
        W-->>U: Share link (copy)
    end

    rect rgb(245, 255, 240)
        Note over U,D: Track Phase
        U->>W: Open share URL /d/[slug]
        W->>A: GET /api/links/[slug]
        A->>D: Validate link (active, expiry, views)
        D-->>A: Document info
        A-->>W: Valid + PDF URL
        W->>A: POST /api/analytics/track (page n)
        A->>D: create PageView record
    end
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

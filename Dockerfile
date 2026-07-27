# syntax = docker/dockerfile:1
FROM node:22-alpine AS base

# ------------------------------------------------------------------
# Install ALL production deps (includes prisma CLI + better-sqlite3 native)
# ------------------------------------------------------------------
FROM base AS deps
RUN apk add --no-cache python3 make g++ sqlite
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && rm -rf /root/.npm /tmp/*

# ------------------------------------------------------------------
# Full build stage
# ------------------------------------------------------------------
FROM deps AS build
RUN apk add --no-cache python3 make g++ sqlite
WORKDIR /app
COPY package*.json ./
RUN npm ci && rm -rf /root/.npm /tmp/*
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ------------------------------------------------------------------
# Production runner
# ------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=8080

# Create data volume mount points
RUN mkdir -p /data/uploads

# Copy Next.js standalone output (optimized runtime)
COPY --from=build /app/.next/standalone ./

# Overwrite node_modules with full production deps (includes prisma CLI for startup migration)
COPY --from=deps /app/node_modules ./node_modules

# Ensure prisma schema + migrations are present
COPY --from=build /app/prisma ./prisma

# Startup script
RUN printf '#!/bin/sh\n\
  set -e\n\
  export DATABASE_URL="file:/data/doclens.db"\n\
  export UPLOADS_DIR="/data/uploads"\n\
  echo "→ Running database migrations..."\n\
  npx prisma migrate deploy --schema=./prisma/schema.prisma 2>&1\n\
  echo "→ Starting DocLens on port ${PORT}..."\n\
  exec node server.js\n\
' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]

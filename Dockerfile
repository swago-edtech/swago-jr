# syntax=docker/dockerfile:1
# =============================================================================
# Swago Jr. — Production Multi-Stage Dockerfile
#
# Build targets:
#   docker build --target runner-web   -t swago-web   .
#   docker build --target runner-admin -t swago-admin .
#
# Requires: DOCKER_BUILDKIT=1
# =============================================================================

# ── Stage 1: Base ────────────────────────────────────────────────────────────
# Shared Alpine base with Node.js and pnpm installed.
# All subsequent stages inherit from this.
FROM node:20-alpine AS base

# Install system dependencies required by native modules
RUN apk add --no-cache libc6-compat

# Enable corepack for pnpm management
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app


# ── Stage 2: Dependencies ────────────────────────────────────────────────────
# Install ALL dependencies (dev + prod) for building.
# Uses BuildKit cache mount to persist the pnpm store across builds.
FROM base AS deps

# Copy workspace config & lockfile first (maximizes layer caching)
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY .npmrc ./
COPY package.json ./

# Copy workspace package.json files (needed for pnpm to resolve workspace deps)
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

# Install dependencies with BuildKit cache mount for pnpm store
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile


# ── Stage 3: Builder (Web) ───────────────────────────────────────────────────
# Builds the web app with Next.js standalone output.
FROM deps AS builder-web

# Copy shared packages source
COPY packages/ ./packages/

# Copy web app source
COPY apps/web/ ./apps/web/

# Set build-time env vars
# NEXT_TELEMETRY_DISABLED prevents Next.js from phoning home during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the web app
RUN pnpm --filter web build


# ── Stage 4: Builder (Admin) ─────────────────────────────────────────────────
# Builds the admin app with Next.js standalone output.
FROM deps AS builder-admin

# Copy shared packages source
COPY packages/ ./packages/

# Copy admin app source
COPY apps/admin/ ./apps/admin/

# Set build-time env vars
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the admin app
RUN pnpm --filter admin build


# ── Stage 5: Runner (Web) ───────────────────────────────────────────────────
# Minimal production image for the web app.
# Contains ONLY the standalone server + static assets.
FROM node:20-alpine AS runner-web

WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy public assets (images, fonts, etc.)
COPY --from=builder-web /app/apps/web/public ./apps/web/public

# Create .next directory owned by nextjs user (for runtime cache)
RUN mkdir -p .next && chown nextjs:nodejs .next

# Copy the standalone server (includes only traced dependencies)
COPY --from=builder-web --chown=nextjs:nodejs \
    /app/apps/web/.next/standalone ./

# Copy static build output (JS/CSS bundles)
COPY --from=builder-web --chown=nextjs:nodejs \
    /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

# Health check — verify the server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the standalone Next.js server
CMD ["node", "apps/web/server.js"]


# ── Stage 6: Runner (Admin) ─────────────────────────────────────────────────
# Minimal production image for the admin app.
FROM node:20-alpine AS runner-admin

WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Copy public assets
COPY --from=builder-admin /app/apps/admin/public ./apps/admin/public

# Create .next directory owned by nextjs user
RUN mkdir -p .next && chown nextjs:nodejs .next

# Copy the standalone server
COPY --from=builder-admin --chown=nextjs:nodejs \
    /app/apps/admin/.next/standalone ./

# Copy static build output
COPY --from=builder-admin --chown=nextjs:nodejs \
    /app/apps/admin/.next/static ./apps/admin/.next/static

USER nextjs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Start the standalone Next.js server
CMD ["node", "apps/admin/server.js"]

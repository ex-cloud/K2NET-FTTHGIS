# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copy root workspace and lock files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files for dependency caching
COPY packages/auth/package.json           ./packages/auth/
COPY packages/api-client/package.json     ./packages/api-client/
COPY packages/design-system/package.json  ./packages/design-system/
COPY packages/map/package.json            ./packages/map/
COPY packages/types/package.json          ./packages/types/
COPY packages/ui/package.json             ./packages/ui/
COPY apps/studio-admin/package.json       ./apps/studio-admin/

# Install ALL dependencies (workspace-aware)
RUN pnpm install --frozen-lockfile

# Copy actual source code
COPY packages/ ./packages/
COPY apps/studio-admin/ ./apps/studio-admin/

# Build shared workspace packages first
RUN pnpm --filter "./packages/*" build

# Vite build args (baked into static bundle at build time)
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID
ARG VITE_API_BASE_URL
ARG VITE_GIT_BRANCH
ARG VITE_GIT_COMMIT

ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL \
    VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_GIT_BRANCH=$VITE_GIT_BRANCH \
    VITE_GIT_COMMIT=$VITE_GIT_COMMIT

# Build the Vite SPA → outputs to apps/studio-admin/dist
RUN pnpm --filter @k2net/studio-admin build

# ─── Stage 2: Runtime (Nginx Alpine ≤20MB RAM) ────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom SPA nginx config
COPY apps/studio-admin/nginx.conf /etc/nginx/conf.d/studio-admin.conf

# Copy Vite static bundle
COPY --from=builder /app/apps/studio-admin/dist /usr/share/nginx/html

# Nginx listens on port 3001 to match existing docker-compose service config
EXPOSE 3001

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

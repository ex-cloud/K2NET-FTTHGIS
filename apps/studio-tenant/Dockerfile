# Multi-stage Dockerfile for Vite SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack and pnpm
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Copy monorepo structure for pnpm workspace resolution
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY apps/studio-tenant/ ./apps/studio-tenant/

# Install dependencies
RUN pnpm --filter @k2net/studio-tenant... install --frozen-lockfile

# Build Vite SPA production bundle
WORKDIR /app/apps/studio-tenant
RUN pnpm build

# Production static stage with minimal Nginx Alpine (<20MB RAM)
FROM nginx:1.27-alpine

COPY apps/studio-tenant/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/studio-tenant/dist /usr/share/nginx/html

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:3002/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

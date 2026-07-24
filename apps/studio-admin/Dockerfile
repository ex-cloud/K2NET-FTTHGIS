FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copy root workspace and lock files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all package.json files for dependency analysis (pruning cache)
COPY packages/auth/package.json ./packages/auth/
COPY packages/design-system/package.json ./packages/design-system/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY apps/studio-admin/package.json ./apps/studio-admin/

# Install dependencies (will only cache dependencies)
RUN pnpm install --frozen-lockfile

# Copy actual source code
COPY packages/ ./packages/
COPY apps/studio-admin/ ./apps/studio-admin/

# Build shared workspace packages first (generates dist/index.d.ts for types, auth, etc.)
RUN pnpm --filter "@k2net/*" build

# Build the studio-admin application
ARG NEXT_PUBLIC_GIT_BRANCH
ARG NEXT_PUBLIC_GIT_COMMIT
ENV NEXT_PUBLIC_GIT_BRANCH=$NEXT_PUBLIC_GIT_BRANCH
ENV NEXT_PUBLIC_GIT_COMMIT=$NEXT_PUBLIC_GIT_COMMIT
RUN pnpm --filter @k2net/studio-admin build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy public assets and built pages
COPY --from=builder /app/apps/studio-admin/public ./apps/studio-admin/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/studio-admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/studio-admin/.next/static ./apps/studio-admin/.next/static

USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Standalone builds run server.js in the app's directory
CMD ["node", "apps/studio-admin/server.js"]

# ─── PropOS API ─────────────────────────────────────────────────────────
# Build context must be the monorepo ROOT (pnpm workspace + lockfile live there).
#   docker build -f apps/api/Dockerfile -t propos-api .
FROM node:22-slim

# Prisma needs openssl
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Use the exact pnpm pinned in package.json's packageManager field, non-interactively
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# Copy the whole monorepo (node_modules excluded via .dockerignore)
COPY . .

# Install all workspace deps, generate Prisma client, build the API.
# CI=false keeps pnpm's "ignored build scripts" notice non-fatal (prisma
# generate runs explicitly below regardless).
RUN CI=false pnpm install --frozen-lockfile
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/api/dist/main"]

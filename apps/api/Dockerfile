# ─── PropOS API ─────────────────────────────────────────────────────────
# Build context must be the monorepo ROOT (pnpm workspace + lockfile live there).
#   docker build -f apps/api/Dockerfile -t propos-api .
FROM node:22-slim

# Prisma needs openssl
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app

# Copy the whole monorepo (node_modules excluded via .dockerignore)
COPY . .

# Install all workspace deps, generate Prisma client, build the API
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/api/dist/main"]

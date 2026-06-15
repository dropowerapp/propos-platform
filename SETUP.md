# PropOS — Setup Guide

## Prerequisites
- Node.js 20+
- pnpm 8+
- PostgreSQL 15+ (local or Railway/Supabase)

---

## 1. Install dependencies

```bash
cd propos-platform
pnpm install
```

---

## 2. Configure environment variables

### Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
```

### Backend (`apps/api/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/propos"
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=propos-uploads
RESEND_API_KEY=re_...
FRONTEND_URL=http://localhost:3000
PORT=3001
```

---

## 3. Setup database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed prop firm data
pnpm db:seed
```

---

## 4. Configure Clerk

1. Create project at clerk.com
2. Enable Organizations (for multi-tenancy)
3. Copy keys to `.env.local` and `.env`
4. Set webhook endpoint: `https://your-api.com/v1/auth/webhook`
5. Enable events: `user.created`, `user.updated`, `organization.created`

---

## 5. Start development

```bash
# Start both frontend + backend
pnpm dev

# Or individually:
pnpm --filter web dev       # http://localhost:3000
pnpm --filter api start:dev # http://localhost:3001
```

---

## 6. API Documentation

Once the API is running: `http://localhost:3001/docs`

---

## Deployment

### Frontend → Vercel
```bash
vercel deploy --prod
```

### Backend → Railway
1. Connect GitHub repo
2. Add service for `apps/api`
3. Set env vars in Railway dashboard
4. Add PostgreSQL and Redis plugins
5. Deploy

### Database → Railway PostgreSQL
```bash
# After Railway provisioning, run:
DATABASE_URL=railway_url pnpm db:migrate
DATABASE_URL=railway_url pnpm db:seed
```

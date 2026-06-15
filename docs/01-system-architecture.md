# PropOS — System Architecture

## Platform Name: PropOS
> The Operating System for Prop Traders

---

## 1. HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENTS                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Web App     │  │ Mobile App   │  │  Chrome Ext  │  │  API Users  │ │
│  │  (Next.js)   │  │  (React Nav) │  │  (MT4/5 sync)│  │  (Webhooks) │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
└─────────┼─────────────────┼─────────────────┼─────────────────┼────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CDN / Edge (Cloudflare)                          │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                     API GATEWAY (Kong / AWS API Gateway)                 │
│                    Rate Limiting · Auth · Request Routing                │
└──────┬──────────────┬────────────────┬──────────────┬───────────────────┘
       │              │                │              │
       ▼              ▼                ▼              ▼
┌────────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────┐
│  Core API  │ │ Import API │ │  AI Service │ │ Monitor Svc  │
│ (NestJS)   │ │ (NestJS)   │ │ (NestJS)    │ │ (NestJS)     │
│            │ │            │ │             │ │              │
│ Auth       │ │ MT4/MT5    │ │ OpenAI      │ │ Prop Firm    │
│ Trades     │ │ cTrader    │ │ Claude      │ │ Rule Crawler │
│ Journal    │ │ DXTrade    │ │ Vector DB   │ │ Change Detect│
│ Analytics  │ │ Rithmic    │ │ RAG Engine  │ │ Notification │
│ PropFirms  │ │ TV Webhook │ │             │ │              │
└─────┬──────┘ └─────┬──────┘ └──────┬──────┘ └──────┬───────┘
      │              │               │               │
      └──────────────┴───────────────┴───────────────┘
                              │
              ┌───────────────┼───────────────────┐
              ▼               ▼                   ▼
       ┌────────────┐  ┌─────────────┐    ┌──────────────┐
       │ PostgreSQL │  │    Redis    │    │  pgvector /  │
       │ (Primary)  │  │  (Cache +   │    │  Pinecone    │
       │            │  │   Queues)   │    │  (AI Embeds) │
       └────────────┘  └─────────────┘    └──────────────┘
              │
       ┌──────┴──────┐
       │  Read       │
       │  Replicas   │
       └─────────────┘

       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │  AWS S3     │  │  BullMQ     │  │  WebSockets │
       │  (Files,    │  │  (Job       │  │  (Real-time │
       │  Screenshots│  │   Queues)   │  │   Alerts)   │
       └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 2. MICROSERVICES BREAKDOWN

### Core API Service (`api.propos.io`)
Handles: Authentication, Trades, Journal, Analytics, PropFirms, Payouts, Alerts

### Import Service (`import.propos.io`)
Handles: File parsing, broker API polling, data normalization, deduplication

### AI Service (`ai.propos.io`)
Handles: Performance coaching, recommendations, embeddings, RAG queries

### Monitor Service (internal)
Handles: Prop Firm rule crawling, change detection, user notifications

### Notification Service (internal)
Handles: Email (Resend), Push (OneSignal), In-app (WebSocket)

---

## 3. FRONTEND ARCHITECTURE

```
Next.js 14 App Router
├── app/
│   ├── (auth)/          — Clerk auth pages
│   ├── (dashboard)/
│   │   ├── overview/    — Executive Dashboard
│   │   ├── journal/     — Trading Journal
│   │   ├── analytics/   — Performance Analytics
│   │   ├── accounts/    — Prop Firm Accounts
│   │   ├── challenges/  — Challenge Tracker
│   │   ├── firms/       — Prop Firm Directory
│   │   ├── payouts/     — Payout & ROI
│   │   ├── backtest/    — Backtesting Engine
│   │   ├── ai-coach/    — AI Coach
│   │   └── alerts/      — Alert Center
│   └── api/             — Next.js API routes (BFF layer)
├── components/
│   ├── ui/              — Shadcn primitives
│   ├── charts/          — TradingView + Recharts wrappers
│   ├── journal/         — Journal-specific components
│   ├── analytics/       — Analytics widgets
│   └── propfirm/        — Prop Firm components
├── lib/
│   ├── api/             — tRPC or REST client
│   ├── hooks/           — React Query hooks
│   └── stores/          — Zustand global state
└── types/               — Shared TypeScript types
```

### Key Frontend Libraries
| Purpose | Library |
|---|---|
| UI Components | Shadcn UI + Radix UI |
| Styling | TailwindCSS |
| Charts | TradingView Lightweight Charts |
| Analytics Charts | Recharts / Victory |
| State | TanStack Query + Zustand |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Dates | date-fns |
| File Upload | react-dropzone |
| Real-time | Socket.io client |
| Toasts | Sonner |
| Tour/Onboarding | Shepherd.js |

---

## 4. BACKEND ARCHITECTURE

### NestJS Module Structure
```
src/
├── modules/
│   ├── auth/            — Clerk webhook sync, session mgmt
│   ├── users/           — User profiles, preferences
│   ├── tenants/         — Multi-tenancy, workspaces
│   ├── trades/          — Trade CRUD, deduplication
│   ├── journal/         — Journal entries, screenshots
│   ├── analytics/       — Metric computation, aggregation
│   ├── import/          — Import pipeline, parsers
│   ├── prop-firms/      — Firm directory, rules DB
│   ├── accounts/        — User prop firm accounts
│   ├── challenges/      — Challenge progress tracking
│   ├── payouts/         — Revenue/cost tracking
│   ├── monitor/         — Rule change monitoring
│   ├── ai/              — AI coach, embeddings, RAG
│   ├── alerts/          — Alert engine, notification dispatch
│   ├── backtest/        — Backtest job management
│   └── community/       — Reviews, ratings, trust scores
├── common/
│   ├── guards/          — Auth, tenant, subscription guards
│   ├── interceptors/    — Logging, transform, cache
│   ├── decorators/      — CurrentUser, Tenant, etc.
│   ├── filters/         — Global exception filters
│   └── pipes/           — Validation pipes
├── infrastructure/
│   ├── database/        — Prisma ORM, migrations
│   ├── cache/           — Redis service
│   ├── queue/           — BullMQ producers/consumers
│   ├── storage/         — S3 service
│   └── events/          — EventEmitter2 bus
└── config/              — Configuration modules
```

---

## 5. DATA FLOW — TRADE IMPORT

```
User uploads file / connects broker
          │
          ▼
    Import Service
          │
    ┌─────┴──────┐
    │  Parser    │  (MT4 HTML / MT5 CSV / cTrader JSON / etc.)
    └─────┬──────┘
          │
    ┌─────▼──────┐
    │ Normalizer │  Maps to Universal Trade Schema
    └─────┬──────┘
          │
    ┌─────▼──────┐
    │ Dedup      │  Checks hash(broker_id + ticket + account)
    └─────┬──────┘
          │
    ┌─────▼──────┐
    │ Enricher   │  Adds session, instrument category, R-multiple
    └─────┬──────┘
          │
    ┌─────▼──────┐
    │ Classifier │  Tags strategy, session, setup via ML
    └─────┬──────┘
          │
    ┌─────▼──────┐
    │  Database  │  Writes to trades table + triggers analytics job
    └─────┬──────┘
          │
    ┌─────▼──────┐
    │  AI Index  │  Updates vector embeddings for AI coach
    └────────────┘
```

---

## 6. MULTI-TENANCY MODEL

**Strategy: Schema-per-tenant with shared infrastructure**

- Each organization (workspace) gets isolated data via `tenant_id` row-level security in PostgreSQL
- Clerk Organizations = PropOS Workspaces
- Row Level Security (RLS) enforced at DB level for data isolation
- Subscription tier gates features and API rate limits
- Team members share accounts within a workspace

---

## 7. REAL-TIME ARCHITECTURE

```
WebSocket Gateway (Socket.io + Redis Adapter)
│
├── challenge-progress/{accountId}   — Live P&L vs target
├── alerts/{userId}                  — Instant risk/rule alerts
├── import-progress/{importId}       — File processing status
└── ai-stream/{sessionId}           — AI coach response streaming
```

Challenge progress updates triggered by:
1. New trade imported → recalculates P&L vs targets
2. Drawdown threshold crossed → instant alert
3. Prop Firm rule change detected → firm-wide notification

---

## 8. INFRASTRUCTURE & DEPLOYMENT

### Production Stack
| Component | Service |
|---|---|
| Frontend | Vercel (Edge Functions) |
| API Services | Railway (auto-scale containers) |
| Database | Railway PostgreSQL / Supabase |
| Cache | Railway Redis / Upstash |
| Storage | AWS S3 + CloudFront |
| CDN | Cloudflare |
| Email | Resend |
| Push Notifications | OneSignal |
| Monitoring | Sentry + Datadog |
| Logging | Axiom |
| CI/CD | GitHub Actions |
| Secrets | Doppler |

### Scaling Strategy (100k+ Users)
1. **Database**: Read replicas for analytics queries, connection pooling via PgBouncer
2. **Caching**: Redis cluster for session data, computed metrics cached with 5-min TTL
3. **Import jobs**: BullMQ with autoscaling worker pods on Railway
4. **AI queries**: Response caching + rate limiting per tier
5. **Analytics**: Pre-compute daily rollups via scheduled jobs, store in materialized views
6. **CDN**: All static assets + screenshot uploads served via CloudFront
7. **Horizontal scaling**: Stateless API pods, scale via container orchestration

---

## 9. SECURITY ARCHITECTURE

### Authentication & Authorization
- **Auth Provider**: Clerk (handles MFA, SSO, session management)
- **API Auth**: JWT tokens verified on every request via Clerk SDK
- **Authorization**: RBAC (Owner, Admin, Member, Viewer) per workspace
- **API Keys**: Hashed with bcrypt, stored only as hash, prefix shown in UI

### Data Security
- **Encryption at rest**: PostgreSQL Transparent Data Encryption (TDE)
- **Encryption in transit**: TLS 1.3 everywhere
- **Secret management**: Doppler for env vars, never in code
- **PII handling**: Minimal PII collection, GDPR-compliant data export/deletion
- **File uploads**: Pre-signed S3 URLs, virus scanning via ClamAV lambda

### API Security
- **Rate limiting**: Per-user and per-IP via Redis sliding window
- **Input validation**: Zod schemas on all endpoints, class-validator in NestJS
- **SQL injection**: Prisma ORM parameterized queries, no raw SQL with user input
- **CORS**: Allowlist of known origins only
- **Security headers**: Helmet.js (CSP, HSTS, X-Frame-Options)
- **Audit logs**: All destructive actions logged with user, IP, timestamp

### Compliance
- GDPR: Right to deletion, data portability, privacy policy
- SOC 2 Type II: Target for Series A stage
- Financial data: No storage of broker credentials (OAuth flows only)

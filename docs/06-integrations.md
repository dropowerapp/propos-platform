# PropOS — Third-Party Integrations

## 1. BROKER INTEGRATIONS

### MetaTrader 4 / MetaTrader 5
- **Method 1 — HTML Statement**: Parser reads MT4/MT5 exported HTML report
- **Method 2 — CSV Export**: Standard MT4/MT5 CSV format parser
- **Method 3 — MT-Bridge (future)**: Node.js bridge via MQL Expert Advisor → WebSocket
- **Parser library**: Custom NestJS parser with cheerio (HTML) + csv-parse (CSV)
- **Normalization**: Map MT fields → Universal Trade Schema

### cTrader
- **Primary**: cTrader Open API (OAuth 2.0)
- **Fallback**: CSV export parser
- **Scopes**: `trading` (read trades), `accounts` (account info)
- **Polling**: Every 15 minutes for open trades, every 5 minutes if active session
- **Docs**: developer.ctrader.com

### DXTrade
- **Primary**: DXTrade REST API with API key auth
- **Fallback**: CSV export parser
- **Endpoints**: GET /api/account/orders, GET /api/account/positions
- **Rate limit**: Handle 429 with exponential backoff

### Rithmic
- **Primary**: Rithmic R|Protocol (FIX-based binary protocol) via rapi wrapper
- **Alternative**: Rithmic R|Trader API
- **Note**: Requires broker-specific credentials — implement as "Powered by Rithmic"

### Tradovate
- **Primary**: Tradovate REST API (OAuth 2.0)
- **Endpoints**: GET /order/list, GET /trade/list
- **Scope**: `trading` (read-only)
- **Sandbox**: Available for testing

### NinjaTrader
- **Primary**: NinjaTrader Trade Performance export (CSV/XML)
- **Alternative**: NinjaTrader ATM Strategy webhooks
- **Parser**: Custom XML + CSV parser

### TradingView
- **Webhook integration**: User sets up TradingView alert → propOS webhook
- **Endpoint**: POST /webhooks/tradingview
- **Payload**: JSON with symbol, action, price, quantity, alert time
- **Use case**: Import paper trades and strategy signals

### MatchTrader
- **Status**: CSV import available; REST API when publicly released
- **Monitor**: matchtrader.com developer announcements

---

## 2. AI INTEGRATIONS

### OpenAI
- **Models**: GPT-4o (coach conversations), text-embedding-3-small (trade embeddings)
- **Use cases**:
  - AI Coach Q&A (RAG + function calling)
  - Trade journal auto-summarization
  - Sentiment analysis of journal entries
  - Prop Firm comparison explanations
- **Cost optimization**: Cache common responses in Redis (24h TTL), use GPT-4o-mini for summarization

### Anthropic Claude
- **Model**: claude-opus-4-8 (complex analysis), claude-sonnet-4-6 (streaming coach)
- **Use cases**:
  - Deep performance analysis reports
  - Strategy backtesting interpretation
  - Prop Firm rule change analysis
- **Integration**: `@anthropic-ai/sdk` with streaming support

### Vector Database — pgvector
- **Embedded in PostgreSQL** (no extra service for MVP)
- **Dimensions**: 1536 (OpenAI text-embedding-3-small)
- **Index**: IVFFlat for approximate nearest neighbor
- **Use cases**: Similar trade search, relevant journal entry retrieval for AI context

### Pinecone (Scale upgrade)
- Migrate from pgvector when > 1M embeddings
- Better performance for similarity search at scale

---

## 3. AUTHENTICATION

### Clerk
- **Features used**: User auth, Organizations (multi-tenancy), JWT templates, Webhooks
- **SDK**: `@clerk/nextjs` (frontend), `@clerk/clerk-sdk-node` (backend)
- **Webhook events**: `user.created`, `organization.created`, `organizationMembership.created`
- **JWT claims**: `org_id` → tenant_id mapping

---

## 4. PAYMENTS

### Stripe
- **Products**: Subscription plans (Starter, Pro, Elite, Team)
- **Features**: Subscriptions, Customer Portal, Webhook events
- **Webhook events**: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- **SDK**: `stripe` npm package
- **Trial**: 14-day free trial on Pro plan

---

## 5. NOTIFICATIONS

### Resend (Email)
- **Transactional emails**: Welcome, import complete, payout recorded, alert triggered
- **Templates**: React Email templates
- **SDK**: `resend` npm package

### OneSignal (Push)
- **Web push + Mobile push** (future React Native app)
- **Use cases**: Real-time risk alerts, challenge completion, rule changes
- **REST API**: POST /notifications with user filters

### WebSocket (In-App)
- Socket.io with Redis adapter for horizontal scaling
- Real-time alerts, import progress, challenge updates

---

## 6. PROP FIRM MONITORING

### Web Crawler (Custom)
- **Tech**: Playwright (headless browser for JS-heavy sites)
- **Schedule**: Daily at 02:00 UTC via BullMQ cron job
- **Firms monitored**: 20+ firms with custom selectors per site
- **Change detection**: 
  1. Fetch current rules
  2. Compare with latest snapshot
  3. If diff detected → create `prop_firm_rules` version + notify affected users
- **Storage**: `prop_firm_rule_snapshots` table (90-day retention)

### Diff Algorithm
```typescript
// Pseudo-code
const changes = deepDiff(previousRules, currentRules);
if (changes.length > 0) {
  await createNewRuleVersion(firmId, currentRules, changes);
  await notifyAffectedUsers(firmId, changes);
}
```

---

## 7. INFRASTRUCTURE SERVICES

### Vercel
- **Frontend**: Next.js App Router deployment
- **Edge Functions**: Middleware (auth check, tenant resolution)
- **Analytics**: Vercel Analytics for page performance

### Railway
- **Services**: NestJS API, Import Worker, AI Service, Monitor Service
- **Database**: PostgreSQL with automatic backups
- **Redis**: For queues and caching

### AWS S3 + CloudFront
- **Bucket structure**:
  - `propos-screenshots/{tenantId}/{userId}/{tradeId}/`
  - `propos-imports/{tenantId}/{userId}/{importJobId}/`
  - `propos-payout-proofs/{tenantId}/{userId}/`
- **Access**: Pre-signed URLs (15 min expiry for uploads)
- **CDN**: CloudFront for screenshot delivery

### BullMQ (Queue System)
```
Queues:
├── import-processing    — File imports (concurrency: 10)
├── analytics-compute    — Metric recalculation after import
├── ai-embedding         — Generate trade embeddings (concurrency: 5)
├── firm-crawl           — Daily prop firm rule crawl (cron)
├── challenge-snapshot   — Daily challenge state save (cron)
├── notification-dispatch — Send emails/push (concurrency: 20)
└── ai-report-gen        — Generate weekly AI reports (cron)
```

### Sentry
- Error tracking for both Next.js frontend and NestJS backend
- Performance monitoring for slow API endpoints
- Alert on error rate spikes

### Doppler
- Environment variable management across all services
- Syncs secrets to Railway/Vercel automatically

---

## 8. MONITORING & OBSERVABILITY

### Datadog / Axiom
- Centralized logging from all services
- Custom dashboards: import success rates, AI latency, crawl status
- Alerts: API error rate > 1%, DB query > 2s, queue depth > 1000

### Uptime monitoring
- BetterStack for endpoint monitoring
- Alert on `/health` endpoint failures

---

## 9. BACKTESTING INTEGRATIONS

### VectorBT (Python)
- Deploy as separate FastAPI microservice
- Accepts strategy params via REST, returns results JSON
- Run in Railway Python worker

### QuantConnect LEAN
- Self-hosted LEAN engine for professional backtests
- Docker container per backtest job
- Results stored in S3, summary in DB

### TradingView Pine Script
- Users paste Pine Script → propOS sends to TV via webhook alerts
- TV executes backtest, results imported via propOS webhook
- Limited: depends on user's TradingView plan

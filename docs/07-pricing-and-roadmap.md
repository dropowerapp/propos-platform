# PropOS — Pricing Model, Roadmaps & Effort Estimates

---

## SAAS PRICING MODEL

### Plans

| Feature | Starter (Free) | Pro ($39/mo) | Elite ($79/mo) | Team ($149/mo) |
|---|---|---|---|---|
| Trading Accounts | 1 | 5 | 15 | 30 |
| Trade History | 500 trades | Unlimited | Unlimited | Unlimited |
| Prop Firm Accounts | 2 | 10 | Unlimited | Unlimited |
| Journal Entries | 50 | Unlimited | Unlimited | Unlimited |
| Screenshot Storage | 500 MB | 10 GB | 50 GB | 100 GB |
| Broker Imports | Manual CSV | All sources | All + API sync | All + API sync |
| Analytics | Basic | Full | Full + Custom | Full + Custom |
| AI Coach | 10 questions/mo | 100/mo | Unlimited | Unlimited |
| AI Insights | — | Weekly report | Daily report | Daily report |
| Prop Firm Monitoring | 3 firms | 10 firms | All firms | All firms |
| Challenge Tracker | ✅ | ✅ | ✅ | ✅ |
| Backtesting | — | Basic | Advanced | Advanced |
| Alerts | 3 | 25 | Unlimited | Unlimited |
| Team Members | 1 | 1 | 1 | 5 |
| API Access | — | — | ✅ | ✅ |
| Priority Support | — | — | ✅ | ✅ |
| White-label | — | — | — | Optional add-on |

### Pricing Rationale
- **Starter Free**: Drives acquisition; limited to 1 account creates natural upgrade pressure
- **Pro $39**: Core product for serious prop traders; most popular tier (target 60% of paid users)
- **Elite $79**: For full-time funded traders managing multiple accounts
- **Team $149**: Trading groups, copy trading communities, prop firm coaching businesses

### Annual Pricing (2 months free)
- Pro: $390/year ($32.50/mo)
- Elite: $790/year ($65.83/mo)
- Team: $1,490/year ($124.17/mo)

### Add-ons
| Add-on | Price |
|---|---|
| Extra storage (50 GB) | +$9/mo |
| White-label branding | +$49/mo (Team only) |
| API access | +$29/mo (Elite) |
| Additional team seat | +$19/mo/seat |
| Dedicated account manager | $299/mo |

### Revenue Projections
| Users | MRR | ARR |
|---|---|---|
| 1,000 paid (Month 6) | ~$45,000 | ~$540,000 |
| 5,000 paid (Month 18) | ~$210,000 | ~$2.5M |
| 20,000 paid (Month 36) | ~$820,000 | ~$9.8M |
| 100,000 paid (Month 60) | ~$3.9M | ~$47M |

---

## MVP ROADMAP (Months 1–4)

### Month 1 — Foundation
- [ ] Project setup: Next.js + NestJS monorepo
- [ ] Clerk auth + multi-tenant architecture
- [ ] PostgreSQL schema (trades, journal, accounts)
- [ ] Basic CRUD: trading accounts, manual trade entry
- [ ] MT4/MT5 HTML + CSV import parser
- [ ] Basic trade list + simple P&L display
- [ ] Stripe subscription integration (Starter + Pro)
- [ ] User onboarding flow

### Month 2 — Core Journal & Analytics
- [ ] Full journal with psychology tracking
- [ ] Screenshot upload (S3 + presigned URLs)
- [ ] Tags system (custom + preset)
- [ ] Performance analytics: win rate, PF, expectancy, Sharpe
- [ ] Equity curve chart (Lightweight Charts)
- [ ] Breakdown by session, symbol, strategy, day of week
- [ ] Performance heatmap (day × session)
- [ ] Mobile-responsive dashboard

### Month 3 — Prop Firm Core
- [ ] Prop Firm directory (seed 10 major firms)
- [ ] User prop firm accounts CRUD
- [ ] Challenge progress tracker (real-time progress bars)
- [ ] Daily drawdown monitoring
- [ ] Payout tracking + ROI calculator
- [ ] Basic alert engine (in-app + email)
- [ ] cTrader CSV import
- [ ] WebSocket: live challenge updates

### Month 4 — AI & Monitoring
- [ ] AI Coach (GPT-4o + RAG with trade history)
- [ ] Trade embeddings (OpenAI + pgvector)
- [ ] Basic prop firm rule crawler (5 firms)
- [ ] Rule change detection + notifications
- [ ] Prop Firm recommendation engine (basic)
- [ ] Weekly AI insight report (email)
- [ ] Public launch (Product Hunt)

**MVP Target Metrics:**
- 500 beta users
- 50 paying customers
- NPS > 50

---

## V2 ROADMAP (Months 5–10)

### Month 5–6 — Broker API Connections
- [ ] cTrader Open API (live sync)
- [ ] Tradovate API
- [ ] DXTrade API
- [ ] Rithmic API
- [ ] Broker connection management UI
- [ ] Auto-sync every 15 minutes for open accounts
- [ ] Deduplication engine improvements

### Month 7 — Advanced Analytics
- [ ] Sortino, Calmar, Recovery Factor
- [ ] Monte Carlo simulation
- [ ] Probability of ruin calculator
- [ ] Custom date range comparisons
- [ ] Benchmark comparison (SPY, BTC, etc.)
- [ ] Trade replay (playback open → close on chart)
- [ ] Advanced R-multiple analysis

### Month 8 — Backtesting Engine
- [ ] VectorBT integration (Python microservice)
- [ ] Strategy builder UI
- [ ] Walk-forward analysis
- [ ] Monte Carlo backtest
- [ ] Results visualization (equity curve, drawdown, MAE/MFE)
- [ ] Optimization grid (parameter sweep)

### Month 9 — Community Features
- [ ] Prop Firm review system
- [ ] Trust Score algorithm (reviews + payout reliability + rule stability)
- [ ] Community leaderboard (opt-in, anonymous)
- [ ] "How traders like me do with [Firm]" — aggregate stats
- [ ] Prop Firm comparison table (side-by-side rules)

### Month 10 — Scale & Polish
- [ ] Mobile app (React Native — iOS first)
- [ ] Chrome extension (MT4/MT5 1-click import)
- [ ] Advanced alert builder (custom conditions)
- [ ] Team workspaces (shared journals, performance comparison)
- [ ] White-label mode for Team plan
- [ ] Advanced AI: psychology coaching, behavioral pattern detection

**V2 Target Metrics:**
- 5,000 paying customers
- < 5% monthly churn
- Profitable (CAC payback < 6 months)

---

## V3 ROADMAP (Months 11–18)

### Infrastructure & Enterprise
- [ ] SOC 2 Type II certification
- [ ] EU data residency option (GDPR)
- [ ] Enterprise plan (unlimited everything + SLA)
- [ ] API access for external tools (Notion, Zapier, etc.)
- [ ] Webhooks for external integrations

### Advanced AI
- [ ] Proprietary fine-tuned model on trading data
- [ ] Natural language trade import ("I bought EURUSD at 1.0850 this morning")
- [ ] AI-generated trading plan based on journal patterns
- [ ] Automated pattern recognition (setups that consistently work)
- [ ] Predictive challenge success probability

### Ecosystem
- [ ] Marketplace: strategy templates, checklists, setups
- [ ] Prop Firm partnerships (affiliate tracking, exclusive discounts)
- [ ] Prop Firm dashboard (firms can see aggregate trader performance)
- [ ] TradingView integration (display propOS stats in TV)
- [ ] Notion/Obsidian export for journal
- [ ] Discord bot for alerts

### International
- [ ] Multi-currency support for all displays
- [ ] Localization: Portuguese, Spanish, Arabic, Chinese
- [ ] Region-specific prop firm databases

**V3 Target Metrics:**
- 25,000 paying customers
- Expand to enterprise segment
- Series A funding

---

## DEVELOPMENT EFFORT ESTIMATES

### Team Required
| Role | MVP | V2 | V3 |
|---|---|---|---|
| Full-Stack (Next.js + NestJS) | 2 | 3 | 4 |
| Backend Engineer | 1 | 2 | 3 |
| AI/ML Engineer | 0 | 1 | 2 |
| DevOps/Infrastructure | 0.5 | 1 | 1 |
| Product Designer | 1 | 1 | 2 |
| **Total FTE** | **4.5** | **8** | **12** |

### Feature Effort (Story Points)

| Module | MVP Effort | Notes |
|---|---|---|
| Auth + Multi-tenancy | M (2 weeks) | Clerk handles heavy lifting |
| DB Schema + API Core | L (3 weeks) | Foundation work |
| MT4/MT5 Import | M (2 weeks) | Custom parser needed |
| Journal + Screenshots | M (2 weeks) | S3 integration |
| Analytics Engine | L (3 weeks) | Complex SQL aggregations |
| Prop Firm Directory | M (2 weeks) | Seeding 10 firms |
| Challenge Tracker | M (2 weeks) | Real-time WebSocket |
| Payout + ROI | S (1 week) | Straightforward CRUD |
| Alert Engine | M (2 weeks) | Multi-channel delivery |
| AI Coach (basic) | L (3 weeks) | RAG + embeddings |
| Monitoring Crawler | M (2 weeks) | Playwright per firm |
| Billing (Stripe) | M (2 weeks) | Subscription flows |
| **MVP Total** | **~24 weeks / 4 devs** | **~6 months** |

### Cost Estimates (Monthly at 1,000 users)
| Service | Cost/mo |
|---|---|
| Railway (API + DB + Redis) | $150 |
| Vercel (Frontend) | $20 |
| AWS S3 + CloudFront | $30 |
| OpenAI API (AI coach) | $200 |
| Clerk (Auth) | $25 |
| Resend (Email) | $20 |
| Sentry (Errors) | $26 |
| **Total infra** | **~$471/mo** |

---

## SCALING STRATEGY FOR 100,000+ USERS

### Database Scaling
1. **Connection pooling**: PgBouncer in transaction mode (max pool: 200)
2. **Read replicas**: 2 replicas for analytics queries, 1 for monitoring
3. **Partitioning**: Partition `trades` table by `tenant_id` range for largest tenants
4. **Materialized views**: Nightly refresh of `analytics_daily_rollups`
5. **Archive**: Move trades > 2 years old to cold storage (S3 Parquet via DuckDB)

### Application Scaling
1. **Stateless APIs**: All NestJS services stateless, scale horizontally
2. **Import workers**: Autoscale BullMQ workers (Railway: 2–20 pods based on queue depth)
3. **AI requests**: Queue AI requests, stream responses; avoid blocking web threads
4. **Caching layers**:
   - L1: In-memory (NestJS cache manager, 1 min)
   - L2: Redis (computed metrics, 5 min; prop firm data, 1 hour)
   - L3: CDN (screenshots, static assets, 30 days)

### Cost at 100,000 users
| Service | Cost/mo |
|---|---|
| Railway (API cluster 10 pods) | $800 |
| PostgreSQL + 2 replicas | $600 |
| Redis Cluster | $200 |
| AWS S3 (50 TB) | $1,150 |
| OpenAI API | $8,000 |
| Vercel Enterprise | $400 |
| Clerk | $500 |
| Datadog | $600 |
| **Total infra** | **~$12,250/mo** |

At $39 avg ARPU × 100,000 users = $3.9M MRR, infra is 0.3% of revenue ✅

---

## COMPETITIVE DIFFERENTIATION — DEFENSIBLE MOATS

### 1. Prop Firm Intelligence Network (Strongest moat)
- **What**: Proprietary database of prop firm rules, changes, and community performance data
- **Why defensible**: Network effect — more users = better aggregate data = better insights
- **No competitor** tracks historical rule changes with user-level alerts

### 2. AI Coach Trained on Prop Trading Data
- **What**: Fine-tune an LLM on prop trading journals, challenge pass/fail patterns
- **Why defensible**: Unique training data from user journal entries (with consent) + outcomes
- **Insight**: "Traders with your psychological profile pass challenges 34% more often when..."

### 3. Challenge Pass Rate Predictor
- **What**: ML model predicting probability of passing a specific challenge based on trader profile
- **Input**: Win rate, drawdown patterns, consistency, holding times
- **Output**: "You have a 67% chance of passing FTMO Phase 1 with your current performance"
- **Why unique**: No platform currently does this

### 4. The Prop Firm Trust Score
- **What**: Proprietary score (0–100) combining verified payout speed, rule stability, user reviews
- **Why defensible**: Becomes the "Yelp" or "Glassdoor" of prop firms — traders trust community data

### 5. ROI-Optimized Firm Routing
- **What**: "Given your performance stats, here's how to maximize your ROI across firms"
- **Example**: "Your style fits E8's consistency rule — you should have an 82% pass rate at lower cost than FTMO"
- **First-of-kind**: No tool currently tells traders which firm to use based on their actual data

### 6. Cross-Account Portfolio View
- **What**: Single view of all funded accounts, challenges, risk exposure across all firms
- **Why needed**: Top traders manage 5–15 funded accounts simultaneously
- **Risk management**: "You have $2.3M in total funded capital — your max correlated exposure is..."

### 7. Behavioral Pattern Library
- **What**: Library of identified behavioral patterns (overtrading after wins, FOMO entries, etc.)
- **AI detection**: Automatically tag journal entries with detected patterns
- **Improvement tracking**: Show pattern frequency over time → measure improvement

### 8. Prop Firm Affiliate + Discovery Engine
- **What**: When a user's data suggests they'd pass a new firm, surface it with personalized ROI estimate
- **Revenue**: Prop firm affiliate partnerships (firms pay $50–$200/new trader)
- **Example**: "Based on your profile, FundingPips has a 78% pass rate for traders like you. Try their $49 challenge."

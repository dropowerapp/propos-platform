# PropOS — Entity Relationship Diagram

## Core ERD (Text Representation)

```
TENANTS ─────────────────────────────────────────────────────────
  id (PK)
  clerk_org_id
  name, slug, plan
  stripe_customer_id
  └── has many: users, trading_accounts, trades, journal_entries,
                prop_firm_accounts, payouts, alerts, import_jobs

USERS ────────────────────────────────────────────────────────────
  id (PK)
  tenant_id (FK → tenants)
  clerk_user_id, email, role
  └── has many: trading_accounts, trades, journal_entries,
                prop_firm_accounts, payouts, ai_conversations

TRADING_ACCOUNTS ─────────────────────────────────────────────────
  id (PK)
  tenant_id (FK → tenants)
  user_id (FK → users)
  broker_connection_id (FK → broker_connections)
  prop_firm_account_id (FK → prop_firm_accounts) [nullable]
  └── has many: trades, import_jobs, analytics_daily_rollups

BROKER_CONNECTIONS ───────────────────────────────────────────────
  id (PK)
  tenant_id, user_id
  broker_type, credentials (encrypted), sync_status
  └── has many: trading_accounts

TRADES ───────────────────────────────────────────────────────────
  id (PK)
  tenant_id, user_id
  trading_account_id (FK → trading_accounts)
  symbol, direction, open_time, close_time
  open_price, close_price, lots, net_pnl, r_multiple
  session, outcome
  ├── has one: journal_entry [optional]
  ├── has one: trade_embedding
  ├── has many: trade_executions
  ├── has many: trade_tags → tags
  └── has many: trade_strategies → strategies

JOURNAL_ENTRIES ──────────────────────────────────────────────────
  id (PK)
  tenant_id, user_id
  trade_id (FK → trades) [nullable]
  entry_date, entry_type
  notes, trading_plan, mistakes, lessons
  emotional_state, confidence_level, discipline_score
  strategy_id (FK → strategies)
  ai_embedding (vector)
  ├── has many: journal_screenshots
  └── has many: journal_tags → tags

STRATEGIES ───────────────────────────────────────────────────────
  id (PK)
  tenant_id, user_id
  name, description, timeframes[], instruments[]
  └── referenced by: trades (via trade_strategies), journal_entries

TAGS ─────────────────────────────────────────────────────────────
  id (PK)
  tenant_id, user_id
  name, color, category
  ├── linked to trades via: trade_tags
  └── linked to journal via: journal_tags

PROP_FIRMS (Global Directory) ────────────────────────────────────
  id (PK)
  name, slug, logo_url
  trust_score, community_rating
  ├── has many: prop_firm_challenge_types
  ├── has many: prop_firm_rules (versioned)
  ├── has many: prop_firm_rule_snapshots (daily)
  └── has many: prop_firm_reviews (from users)

PROP_FIRM_CHALLENGE_TYPES ────────────────────────────────────────
  id (PK)
  prop_firm_id (FK → prop_firms)
  name (1-Step | 2-Step | Instant | etc.)
  └── has many: prop_firm_account_sizes, prop_firm_rules

PROP_FIRM_RULES (versioned) ──────────────────────────────────────
  id (PK)
  prop_firm_id, challenge_type_id, phase
  profit_target_pct, daily_drawdown_pct, max_drawdown_pct
  min_trading_days, news_trading_allowed, profit_split_pct
  effective_from, effective_to, is_current
  └── referenced by: prop_firm_accounts (rules_snapshot_id)

PROP_FIRM_ACCOUNTS (User Accounts) ──────────────────────────────
  id (PK)
  tenant_id, user_id
  trading_account_id (FK → trading_accounts)
  prop_firm_id (FK → prop_firms)
  challenge_type_id, rules_snapshot_id
  account_size, status, current_phase
  challenge_cost, total_cost, total_pnl
  ├── has many: payouts
  ├── has many: challenge_daily_snapshots
  └── has many: alert_rules

PAYOUTS ──────────────────────────────────────────────────────────
  id (PK)
  tenant_id, user_id
  prop_firm_account_id (FK → prop_firm_accounts)
  prop_firm_id (FK → prop_firms)
  amount, payout_date, profit_split_pct, status
  processing_days

CHALLENGE_DAILY_SNAPSHOTS ────────────────────────────────────────
  id (PK)
  prop_firm_account_id (FK → prop_firm_accounts)
  snapshot_date, balance, equity
  daily_pnl, daily_drawdown_pct, max_drawdown_pct

ALERT_RULES ──────────────────────────────────────────────────────
  id (PK)
  tenant_id, user_id
  prop_firm_account_id [nullable]
  alert_type, threshold_value, channels[]
  └── triggers: alert_events

ALERT_EVENTS ─────────────────────────────────────────────────────
  id (PK)
  alert_rule_id, tenant_id, user_id
  alert_type, severity, title, body
  is_read, is_dismissed, sent_at

AI_CONVERSATIONS ─────────────────────────────────────────────────
  id (PK)
  tenant_id, user_id
  title, context_type, context_id
  └── has many: ai_messages

BACKTESTS ────────────────────────────────────────────────────────
  id (PK)
  tenant_id, user_id
  strategy_id [nullable]
  symbol, timeframe, start_date, end_date
  status, win_rate, profit_factor, sharpe_ratio
  equity_curve (JSONB), results_json (JSONB)

PROP_FIRM_REVIEWS ────────────────────────────────────────────────
  id (PK)
  prop_firm_id (FK → prop_firms)
  user_id (FK → users)
  payout_speed, execution_quality, overall_rating
  review_title, review_body, is_approved
```

---

## Relationship Summary Table

| From | Relationship | To |
|---|---|---|
| Tenant | 1:N | Users |
| Tenant | 1:N | Trading Accounts |
| Tenant | 1:N | Prop Firm Accounts |
| User | 1:N | Trading Accounts |
| User | 1:N | Trades |
| User | 1:N | Journal Entries |
| User | 1:N | Prop Firm Accounts |
| User | 1:N | Payouts |
| User | 1:N | AI Conversations |
| User | 1:N | Backtests |
| Trading Account | 1:N | Trades |
| Trading Account | 1:1 | Prop Firm Account (optional) |
| Trade | 1:1 | Journal Entry (optional) |
| Trade | N:M | Tags |
| Trade | N:M | Strategies |
| Trade | 1:1 | Trade Embedding (AI) |
| Trade | 1:N | Trade Executions |
| Prop Firm | 1:N | Challenge Types |
| Prop Firm | 1:N | Rules (versioned) |
| Prop Firm | 1:N | Rule Snapshots (daily) |
| Prop Firm | 1:N | Reviews |
| Prop Firm Account | 1:N | Payouts |
| Prop Firm Account | 1:N | Daily Snapshots |
| Prop Firm Account | 1:N | Alert Rules |
| Strategy | 1:N | Backtests |
| AI Conversation | 1:N | AI Messages |

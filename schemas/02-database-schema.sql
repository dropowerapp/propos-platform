-- =============================================================
-- PropOS — Complete PostgreSQL Database Schema
-- =============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- For full-text search
CREATE EXTENSION IF NOT EXISTS "vector";      -- pgvector for AI embeddings

-- =============================================================
-- TENANCY & USERS
-- =============================================================

CREATE TABLE tenants (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id   VARCHAR(255) UNIQUE,
  name           VARCHAR(255) NOT NULL,
  slug           VARCHAR(100) UNIQUE NOT NULL,
  plan           VARCHAR(50) NOT NULL DEFAULT 'starter',   -- starter | pro | elite | team
  plan_expires_at TIMESTAMPTZ,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  settings       JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id  VARCHAR(255) UNIQUE NOT NULL,
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email          VARCHAR(255) NOT NULL,
  full_name      VARCHAR(255),
  avatar_url     TEXT,
  role           VARCHAR(50) NOT NULL DEFAULT 'member',    -- owner | admin | member | viewer
  timezone       VARCHAR(100) NOT NULL DEFAULT 'UTC',
  currency       VARCHAR(10) NOT NULL DEFAULT 'USD',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  preferences    JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TRADING ACCOUNTS
-- =============================================================

CREATE TABLE broker_connections (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_type    VARCHAR(50) NOT NULL,  -- mt4 | mt5 | ctrader | dxtrade | rithmic | tradovate | ninjatrader | matchtrader
  connection_name VARCHAR(255) NOT NULL,
  credentials    JSONB,                 -- encrypted OAuth tokens or API keys (never plaintext passwords)
  account_number VARCHAR(100),
  server         VARCHAR(255),
  last_synced_at TIMESTAMPTZ,
  sync_status    VARCHAR(50) DEFAULT 'idle',  -- idle | syncing | error | paused
  sync_error     TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trading_accounts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_connection_id UUID REFERENCES broker_connections(id) ON DELETE SET NULL,
  name           VARCHAR(255) NOT NULL,
  account_number VARCHAR(100),
  broker_type    VARCHAR(50),
  currency       VARCHAR(10) NOT NULL DEFAULT 'USD',
  initial_balance DECIMAL(20,6) NOT NULL DEFAULT 0,
  current_balance DECIMAL(20,6),
  account_type   VARCHAR(50),          -- live | demo | funded | challenge
  prop_firm_account_id UUID,           -- FK set after prop_firm_accounts table
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  color          VARCHAR(20),          -- User-assigned color for UI
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TRADES
-- =============================================================

CREATE TABLE instruments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol         VARCHAR(50) NOT NULL,
  display_name   VARCHAR(100),
  category       VARCHAR(50),          -- forex | crypto | indices | commodities | stocks | futures
  base_currency  VARCHAR(10),
  quote_currency VARCHAR(10),
  pip_size       DECIMAL(20,10),
  contract_size  DECIMAL(20,6),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(symbol, category)
);

CREATE TABLE trades (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,

  -- Broker identifiers (for deduplication)
  broker_trade_id  VARCHAR(255),
  broker_ticket    VARCHAR(255),
  import_hash      VARCHAR(64),         -- SHA256 of key fields to prevent duplicates

  -- Trade basics
  symbol           VARCHAR(50) NOT NULL,
  instrument_id    UUID REFERENCES instruments(id),
  direction        VARCHAR(10) NOT NULL,  -- long | short
  status           VARCHAR(20) NOT NULL DEFAULT 'closed',  -- open | closed | cancelled

  -- Execution
  open_time        TIMESTAMPTZ NOT NULL,
  close_time       TIMESTAMPTZ,
  open_price       DECIMAL(20,8) NOT NULL,
  close_price      DECIMAL(20,8),
  stop_loss        DECIMAL(20,8),
  take_profit      DECIMAL(20,8),
  lots             DECIMAL(20,6) NOT NULL,

  -- P&L
  gross_pnl        DECIMAL(20,6),
  commission       DECIMAL(20,6) DEFAULT 0,
  swap             DECIMAL(20,6) DEFAULT 0,
  net_pnl          DECIMAL(20,6),
  pips             DECIMAL(20,4),

  -- Risk metrics (calculated)
  risk_percent     DECIMAL(10,4),
  risk_reward      DECIMAL(10,4),       -- planned R:R
  r_multiple       DECIMAL(10,4),       -- actual outcome in R
  position_size_usd DECIMAL(20,6),

  -- Duration
  duration_seconds INTEGER,

  -- Session classification
  session          VARCHAR(20),         -- london | new_york | asian | sydney | overlap
  day_of_week      SMALLINT,           -- 0=Monday ... 4=Friday
  week_of_year     SMALLINT,
  month            SMALLINT,
  quarter          SMALLINT,
  year             SMALLINT,

  -- Outcome
  outcome          VARCHAR(20),         -- win | loss | breakeven
  is_manual        BOOLEAN DEFAULT FALSE,

  -- Metadata
  raw_data         JSONB,              -- Original broker data preserved
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trades_tenant_user ON trades(tenant_id, user_id);
CREATE INDEX idx_trades_account ON trades(trading_account_id);
CREATE INDEX idx_trades_open_time ON trades(open_time DESC);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_import_hash ON trades(import_hash) WHERE import_hash IS NOT NULL;

-- Partial executions (for trades with multiple entries)
CREATE TABLE trade_executions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id       UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  execution_type VARCHAR(20) NOT NULL,  -- open | partial_close | close | sl_move | tp_move
  price          DECIMAL(20,8) NOT NULL,
  lots           DECIMAL(20,6) NOT NULL,
  executed_at    TIMESTAMPTZ NOT NULL,
  pnl            DECIMAL(20,6),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- JOURNAL
-- =============================================================

CREATE TABLE journal_entries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_id       UUID REFERENCES trades(id) ON DELETE SET NULL,
  trading_account_id UUID REFERENCES trading_accounts(id) ON DELETE SET NULL,

  entry_date     DATE NOT NULL,
  entry_type     VARCHAR(20) NOT NULL DEFAULT 'trade',  -- trade | daily | weekly | monthly | freeform

  -- Journal content
  notes          TEXT,
  trading_plan   TEXT,
  mistakes       TEXT,
  lessons        TEXT,
  market_analysis TEXT,

  -- Psychology
  emotional_state    VARCHAR(50),       -- calm | excited | anxious | fearful | overconfident | bored | revengeful
  confidence_level   SMALLINT CHECK (confidence_level BETWEEN 1 AND 10),
  stress_level       SMALLINT CHECK (stress_level BETWEEN 1 AND 10),
  discipline_score   SMALLINT CHECK (discipline_score BETWEEN 1 AND 10),
  energy_level       SMALLINT CHECK (energy_level BETWEEN 1 AND 10),
  focus_score        SMALLINT CHECK (focus_score BETWEEN 1 AND 10),

  -- Classification
  strategy_id    UUID,                 -- FK to strategies
  setup_type     VARCHAR(100),
  market_condition VARCHAR(50),        -- trending | ranging | volatile | choppy | news_driven
  followed_plan  BOOLEAN,

  -- AI analysis
  ai_sentiment   VARCHAR(20),          -- positive | negative | neutral
  ai_summary     TEXT,
  ai_embedding   vector(1536),         -- For similarity search

  -- Metadata
  word_count     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_tenant_user ON journal_entries(tenant_id, user_id);
CREATE INDEX idx_journal_date ON journal_entries(entry_date DESC);
CREATE INDEX idx_journal_trade ON journal_entries(trade_id);
CREATE INDEX idx_journal_embedding ON journal_entries USING ivfflat (ai_embedding vector_cosine_ops);

CREATE TABLE journal_screenshots (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  trade_id       UUID REFERENCES trades(id) ON DELETE CASCADE,
  s3_key         VARCHAR(500) NOT NULL,
  s3_url         TEXT NOT NULL,
  thumbnail_url  TEXT,
  filename       VARCHAR(255),
  file_size      INTEGER,
  mime_type      VARCHAR(100),
  caption        TEXT,
  timeframe      VARCHAR(20),          -- M1 | M5 | M15 | H1 | H4 | D1
  chart_type     VARCHAR(30),          -- entry | exit | analysis | pre_trade | post_trade
  sort_order     SMALLINT DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  color          VARCHAR(20),
  category       VARCHAR(50),          -- strategy | mistake | setup | custom
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id, name)
);

CREATE TABLE trade_tags (
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  tag_id   UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (trade_id, tag_id)
);

CREATE TABLE journal_tags (
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  tag_id           UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (journal_entry_id, tag_id)
);

-- =============================================================
-- STRATEGIES
-- =============================================================

CREATE TABLE strategies (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  timeframes     TEXT[],
  instruments    TEXT[],
  rules          TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  color          VARCHAR(20),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE journal_entries ADD CONSTRAINT fk_journal_strategy FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE SET NULL;

CREATE TABLE trade_strategies (
  trade_id     UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  strategy_id  UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  PRIMARY KEY (trade_id, strategy_id)
);

-- =============================================================
-- PROP FIRM DIRECTORY
-- =============================================================

CREATE TABLE prop_firms (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(255) NOT NULL,
  slug           VARCHAR(100) UNIQUE NOT NULL,
  logo_url       TEXT,
  website_url    TEXT,
  country        VARCHAR(100),
  founded_year   SMALLINT,
  description    TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  is_verified    BOOLEAN DEFAULT FALSE,

  -- Metadata
  instruments    TEXT[],              -- forex | futures | crypto | stocks
  platforms      TEXT[],             -- mt4 | mt5 | ctrader | dxtrade | rithmic
  payout_methods TEXT[],
  headquarters   VARCHAR(255),

  -- Monitoring
  last_crawled_at TIMESTAMPTZ,
  crawl_url      TEXT,
  crawl_selectors JSONB,

  -- Aggregate scores (updated nightly)
  trust_score    DECIMAL(5,2),       -- 0-100
  community_rating DECIMAL(3,2),     -- 1-5
  review_count   INTEGER DEFAULT 0,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prop_firm_challenge_types (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prop_firm_id   UUID NOT NULL REFERENCES prop_firms(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,            -- 1-Step | 2-Step | Instant Funding | Evaluation
  slug           VARCHAR(100) NOT NULL,
  description    TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prop_firm_account_sizes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_type_id UUID NOT NULL REFERENCES prop_firm_challenge_types(id) ON DELETE CASCADE,
  account_size   INTEGER NOT NULL,               -- in USD: 10000, 25000, 50000, etc.
  price          DECIMAL(10,2),
  currency       VARCHAR(10) DEFAULT 'USD',
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prop_firm_rules (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prop_firm_id   UUID NOT NULL REFERENCES prop_firms(id) ON DELETE CASCADE,
  challenge_type_id UUID REFERENCES prop_firm_challenge_types(id),
  account_size_id UUID REFERENCES prop_firm_account_sizes(id),
  phase          SMALLINT DEFAULT 1,             -- 1 = Phase 1, 2 = Phase 2, 3 = Funded

  -- Profit rules
  profit_target_pct     DECIMAL(5,2),
  profit_target_abs     DECIMAL(10,2),

  -- Drawdown rules
  daily_drawdown_pct    DECIMAL(5,2),
  daily_drawdown_type   VARCHAR(30),            -- balance | equity | trailing_equity
  max_drawdown_pct      DECIMAL(5,2),
  max_drawdown_type     VARCHAR(30),
  trailing_drawdown     BOOLEAN DEFAULT FALSE,

  -- Time rules
  min_trading_days      SMALLINT,
  max_trading_days      SMALLINT,
  max_challenge_duration_days SMALLINT,

  -- Lot rules
  max_lot_size          DECIMAL(10,2),
  max_daily_trades      SMALLINT,

  -- Restrictions
  news_trading_allowed  BOOLEAN DEFAULT TRUE,
  overnight_holding_allowed BOOLEAN DEFAULT TRUE,
  weekend_holding_allowed BOOLEAN DEFAULT TRUE,
  ea_allowed            BOOLEAN DEFAULT TRUE,
  copy_trading_allowed  BOOLEAN DEFAULT FALSE,
  high_frequency_allowed BOOLEAN DEFAULT TRUE,

  -- Consistency rules
  consistency_rule      BOOLEAN DEFAULT FALSE,
  consistency_pct       DECIMAL(5,2),           -- max % of profit from single day
  min_trade_duration_seconds INTEGER,

  -- Payout
  profit_split_pct      DECIMAL(5,2),
  payout_frequency      VARCHAR(50),           -- on_demand | weekly | biweekly | monthly
  min_payout_amount     DECIMAL(10,2),
  scaling_plan          JSONB,                 -- growth schedule

  -- Version tracking
  effective_from        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to          TIMESTAMPTZ,           -- NULL means current
  is_current            BOOLEAN DEFAULT TRUE,
  change_description    TEXT,
  changed_by_crawler    BOOLEAN DEFAULT FALSE,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rules_firm ON prop_firm_rules(prop_firm_id, is_current);
CREATE INDEX idx_rules_effective ON prop_firm_rules(effective_from DESC);

-- Snapshots for historical comparison
CREATE TABLE prop_firm_rule_snapshots (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prop_firm_id   UUID NOT NULL REFERENCES prop_firms(id) ON DELETE CASCADE,
  snapshot_date  DATE NOT NULL,
  rules_json     JSONB NOT NULL,
  prices_json    JSONB,
  crawled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(prop_firm_id, snapshot_date)
);

-- =============================================================
-- USER PROP FIRM ACCOUNTS
-- =============================================================

CREATE TABLE prop_firm_accounts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trading_account_id UUID REFERENCES trading_accounts(id) ON DELETE SET NULL,

  prop_firm_id   UUID NOT NULL REFERENCES prop_firms(id),
  challenge_type_id UUID REFERENCES prop_firm_challenge_types(id),
  rules_snapshot_id UUID REFERENCES prop_firm_rules(id),  -- Rules at time of purchase

  -- Account details
  account_name   VARCHAR(255),
  account_number VARCHAR(100),
  account_size   INTEGER NOT NULL,               -- USD
  current_phase  SMALLINT NOT NULL DEFAULT 1,
  status         VARCHAR(30) NOT NULL DEFAULT 'active', -- active | passed | failed | funded | expired | reset

  -- Dates
  purchased_at   DATE,
  activated_at   DATE,
  phase_started_at DATE,
  passed_at      DATE,
  failed_at      DATE,
  funded_at      DATE,
  expired_at     DATE,

  -- Financial tracking
  challenge_cost DECIMAL(10,2),
  activation_fee DECIMAL(10,2) DEFAULT 0,
  reset_count    SMALLINT DEFAULT 0,
  total_reset_fees DECIMAL(10,2) DEFAULT 0,
  addon_costs    DECIMAL(10,2) DEFAULT 0,
  total_cost     DECIMAL(10,2) GENERATED ALWAYS AS (
    COALESCE(challenge_cost,0) + COALESCE(activation_fee,0) + COALESCE(total_reset_fees,0) + COALESCE(addon_costs,0)
  ) STORED,

  -- Live rule snapshot (updated from trading data)
  current_balance     DECIMAL(20,6),
  peak_balance        DECIMAL(20,6),
  current_drawdown_pct DECIMAL(10,4),
  daily_pnl           DECIMAL(20,6),
  total_pnl           DECIMAL(20,6),
  trading_days_count  SMALLINT DEFAULT 0,

  -- Status computed
  is_at_risk     BOOLEAN DEFAULT FALSE,
  notes          TEXT,
  color          VARCHAR(20),

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pfa_tenant_user ON prop_firm_accounts(tenant_id, user_id);
CREATE INDEX idx_pfa_status ON prop_firm_accounts(status);

-- Add FK back to trading_accounts
ALTER TABLE trading_accounts ADD CONSTRAINT fk_ta_prop_account
  FOREIGN KEY (prop_firm_account_id) REFERENCES prop_firm_accounts(id) ON DELETE SET NULL;

-- Daily snapshots of account state
CREATE TABLE challenge_daily_snapshots (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prop_firm_account_id UUID NOT NULL REFERENCES prop_firm_accounts(id) ON DELETE CASCADE,
  snapshot_date  DATE NOT NULL,
  balance        DECIMAL(20,6),
  equity         DECIMAL(20,6),
  daily_pnl      DECIMAL(20,6),
  daily_drawdown_pct DECIMAL(10,4),
  max_drawdown_pct DECIMAL(10,4),
  trading_days   SMALLINT,
  status         VARCHAR(30),
  UNIQUE(prop_firm_account_id, snapshot_date)
);

-- =============================================================
-- PAYOUTS & ROI
-- =============================================================

CREATE TABLE payouts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prop_firm_account_id UUID NOT NULL REFERENCES prop_firm_accounts(id) ON DELETE CASCADE,
  prop_firm_id   UUID NOT NULL REFERENCES prop_firms(id),

  amount         DECIMAL(10,2) NOT NULL,
  currency       VARCHAR(10) DEFAULT 'USD',
  payout_date    DATE NOT NULL,
  profit_split_pct DECIMAL(5,2),
  gross_profit   DECIMAL(10,2),

  status         VARCHAR(30) NOT NULL DEFAULT 'pending',  -- pending | paid | rejected | delayed
  payment_method VARCHAR(100),
  transaction_ref VARCHAR(255),
  notes          TEXT,
  proof_url      TEXT,                 -- S3 URL to payout screenshot

  processing_days INTEGER,            -- Days from request to payment

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- ANALYTICS (Materialized / Precomputed)
-- =============================================================

CREATE TABLE analytics_daily_rollups (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  date           DATE NOT NULL,

  total_trades   INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades  INTEGER DEFAULT 0,
  breakeven_trades INTEGER DEFAULT 0,
  win_rate       DECIMAL(5,4),
  gross_pnl      DECIMAL(20,6),
  net_pnl        DECIMAL(20,6),
  commission     DECIMAL(20,6),
  largest_win    DECIMAL(20,6),
  largest_loss   DECIMAL(20,6),
  avg_win        DECIMAL(20,6),
  avg_loss       DECIMAL(20,6),
  profit_factor  DECIMAL(10,4),
  expectancy     DECIMAL(10,4),
  avg_r_multiple DECIMAL(10,4),
  max_drawdown   DECIMAL(10,4),

  UNIQUE(trading_account_id, date)
);

-- =============================================================
-- ALERTS
-- =============================================================

CREATE TABLE alert_rules (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prop_firm_account_id UUID REFERENCES prop_firm_accounts(id) ON DELETE CASCADE,

  alert_type     VARCHAR(100) NOT NULL,
  -- daily_drawdown_warning | max_drawdown_warning | profit_target_close
  -- losing_streak | challenge_passed | firm_rule_change | payout_delay
  -- min_days_complete | news_time | consistency_breach

  threshold_value DECIMAL(10,4),
  threshold_type VARCHAR(30),          -- pct | absolute | count
  is_active      BOOLEAN DEFAULT TRUE,
  channels       TEXT[],              -- email | push | in_app | sms
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE alert_events (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_rule_id  UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prop_firm_account_id UUID REFERENCES prop_firm_accounts(id) ON DELETE SET NULL,

  alert_type     VARCHAR(100) NOT NULL,
  severity       VARCHAR(20) NOT NULL DEFAULT 'info',  -- info | warning | critical
  title          VARCHAR(255) NOT NULL,
  body           TEXT,
  data           JSONB,

  is_read        BOOLEAN DEFAULT FALSE,
  is_dismissed   BOOLEAN DEFAULT FALSE,
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at        TIMESTAMPTZ
);

-- =============================================================
-- COMMUNITY FEATURES
-- =============================================================

CREATE TABLE prop_firm_reviews (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prop_firm_id   UUID NOT NULL REFERENCES prop_firms(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Ratings (1-5)
  payout_speed       SMALLINT CHECK (payout_speed BETWEEN 1 AND 5),
  customer_support   SMALLINT CHECK (customer_support BETWEEN 1 AND 5),
  execution_quality  SMALLINT CHECK (execution_quality BETWEEN 1 AND 5),
  slippage           SMALLINT CHECK (slippage BETWEEN 1 AND 5),
  transparency       SMALLINT CHECK (transparency BETWEEN 1 AND 5),
  dashboard_ux       SMALLINT CHECK (dashboard_ux BETWEEN 1 AND 5),
  overall_rating     SMALLINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),

  -- Context
  account_size_traded INTEGER,
  verified_trader     BOOLEAN DEFAULT FALSE,
  review_title       VARCHAR(255),
  review_body        TEXT,
  pros               TEXT,
  cons               TEXT,

  -- Moderation
  is_approved        BOOLEAN DEFAULT FALSE,
  upvotes            INTEGER DEFAULT 0,
  downvotes          INTEGER DEFAULT 0,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(prop_firm_id, user_id)
);

-- =============================================================
-- BACKTESTING
-- =============================================================

CREATE TABLE backtests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strategy_id    UUID REFERENCES strategies(id) ON DELETE SET NULL,

  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  engine         VARCHAR(50) NOT NULL,  -- tradingview | vectorbt | quantconnect | custom

  -- Parameters
  symbol         VARCHAR(50) NOT NULL,
  timeframe      VARCHAR(20) NOT NULL,
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  initial_capital DECIMAL(20,6) NOT NULL,
  params         JSONB,                -- Strategy-specific parameters

  -- Status
  status         VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | running | completed | failed
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  error_message  TEXT,

  -- Results summary
  total_trades   INTEGER,
  win_rate       DECIMAL(5,4),
  profit_factor  DECIMAL(10,4),
  expectancy     DECIMAL(10,4),
  sharpe_ratio   DECIMAL(10,4),
  sortino_ratio  DECIMAL(10,4),
  calmar_ratio   DECIMAL(10,4),
  max_drawdown_pct DECIMAL(10,4),
  total_return_pct DECIMAL(10,4),
  annualized_return_pct DECIMAL(10,4),
  prob_of_ruin   DECIMAL(5,4),

  results_json   JSONB,               -- Full trade-by-trade results
  equity_curve   JSONB,               -- Array of {date, equity} for charting

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- AI & EMBEDDINGS
-- =============================================================

CREATE TABLE ai_conversations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(255),
  context_type   VARCHAR(50),         -- general | account_analysis | trade_review | firm_comparison
  context_id     UUID,                -- Related entity ID
  message_count  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role           VARCHAR(20) NOT NULL,  -- user | assistant | system
  content        TEXT NOT NULL,
  tokens_used    INTEGER,
  model          VARCHAR(100),
  latency_ms     INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trade-level embeddings for similarity search
CREATE TABLE trade_embeddings (
  trade_id       UUID PRIMARY KEY REFERENCES trades(id) ON DELETE CASCADE,
  embedding      vector(1536) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trade_embeddings ON trade_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================
-- IMPORTS
-- =============================================================

CREATE TABLE import_jobs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,

  source         VARCHAR(50) NOT NULL,  -- mt4_html | mt4_csv | mt5_html | mt5_csv | ctrader_api | dxtrade_api | rithmic_api | tradovate_api | manual_csv | tv_webhook
  filename       VARCHAR(500),
  file_size      INTEGER,
  s3_key         VARCHAR(500),

  status         VARCHAR(20) NOT NULL DEFAULT 'queued',  -- queued | processing | completed | failed | partial
  progress_pct   SMALLINT DEFAULT 0,
  total_rows     INTEGER,
  imported_rows  INTEGER DEFAULT 0,
  skipped_rows   INTEGER DEFAULT 0,
  error_rows     INTEGER DEFAULT 0,

  errors         JSONB,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- SUBSCRIPTIONS & BILLING
-- =============================================================

CREATE TABLE subscription_plans (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(100) NOT NULL,       -- Starter | Pro | Elite | Team
  slug           VARCHAR(50) UNIQUE NOT NULL,
  price_monthly  DECIMAL(10,2),
  price_yearly   DECIMAL(10,2),
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly  VARCHAR(255),
  features       JSONB NOT NULL DEFAULT '{}',  -- Feature flags
  limits         JSONB NOT NULL DEFAULT '{}',  -- Account/trade/etc limits
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subscription_events (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type     VARCHAR(100) NOT NULL,        -- subscription.created | upgraded | downgraded | cancelled | renewed
  from_plan      VARCHAR(50),
  to_plan        VARCHAR(50),
  stripe_event_id VARCHAR(255),
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- ROW LEVEL SECURITY (Tenant isolation)
-- =============================================================

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prop_firm_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (applied for all tenant-scoped tables)
CREATE POLICY tenant_isolation ON trades
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- =============================================================
-- USEFUL VIEWS
-- =============================================================

CREATE OR REPLACE VIEW v_account_roi AS
SELECT
  pfa.id,
  pfa.user_id,
  pfa.prop_firm_id,
  pf.name AS firm_name,
  pfa.account_size,
  pfa.total_cost,
  COALESCE(SUM(p.amount), 0) AS total_payouts,
  COALESCE(SUM(p.amount), 0) - pfa.total_cost AS net_profit,
  CASE
    WHEN pfa.total_cost > 0
    THEN ROUND(((COALESCE(SUM(p.amount), 0) - pfa.total_cost) / pfa.total_cost * 100)::numeric, 2)
    ELSE 0
  END AS roi_pct
FROM prop_firm_accounts pfa
JOIN prop_firms pf ON pf.id = pfa.prop_firm_id
LEFT JOIN payouts p ON p.prop_firm_account_id = pfa.id AND p.status = 'paid'
GROUP BY pfa.id, pfa.user_id, pfa.prop_firm_id, pf.name, pfa.account_size, pfa.total_cost;

CREATE OR REPLACE VIEW v_challenge_progress AS
SELECT
  pfa.id AS account_id,
  pfa.user_id,
  pfa.account_size,
  pfa.current_phase,
  pfa.status,
  pfr.profit_target_pct,
  pfr.daily_drawdown_pct,
  pfr.max_drawdown_pct,
  pfr.min_trading_days,
  pfa.total_pnl / pfa.account_size * 100 AS current_profit_pct,
  pfa.current_drawdown_pct,
  pfa.trading_days_count,
  pfr.profit_target_pct - (pfa.total_pnl / pfa.account_size * 100) AS remaining_profit_pct,
  pfr.daily_drawdown_pct - ABS(LEAST(pfa.daily_pnl / pfa.account_size * 100, 0)) AS daily_remaining_pct,
  pfr.max_drawdown_pct - ABS(pfa.current_drawdown_pct) AS max_remaining_pct,
  GREATEST(0, pfr.min_trading_days - pfa.trading_days_count) AS remaining_days
FROM prop_firm_accounts pfa
LEFT JOIN prop_firm_rules pfr ON pfr.id = pfa.rules_snapshot_id
WHERE pfa.status = 'active';

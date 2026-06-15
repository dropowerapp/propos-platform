-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "clerk_org_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "plan_expires_at" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_connections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "broker_type" TEXT NOT NULL,
    "connection_name" TEXT NOT NULL,
    "credentials" JSONB,
    "account_number" TEXT,
    "server" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "sync_status" TEXT NOT NULL DEFAULT 'idle',
    "sync_error" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "broker_connection_id" TEXT,
    "prop_firm_account_id" TEXT,
    "name" TEXT NOT NULL,
    "account_number" TEXT,
    "broker_type" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "initial_balance" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "current_balance" DECIMAL(20,6),
    "account_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trading_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trading_account_id" TEXT NOT NULL,
    "broker_trade_id" TEXT,
    "broker_ticket" TEXT,
    "import_hash" TEXT,
    "symbol" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'closed',
    "open_time" TIMESTAMP(3) NOT NULL,
    "close_time" TIMESTAMP(3),
    "open_price" DECIMAL(20,8) NOT NULL,
    "close_price" DECIMAL(20,8),
    "stop_loss" DECIMAL(20,8),
    "take_profit" DECIMAL(20,8),
    "lots" DECIMAL(20,6) NOT NULL,
    "gross_pnl" DECIMAL(20,6),
    "commission" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "swap" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "net_pnl" DECIMAL(20,6),
    "pips" DECIMAL(20,4),
    "risk_percent" DECIMAL(10,4),
    "risk_reward" DECIMAL(10,4),
    "r_multiple" DECIMAL(10,4),
    "duration_seconds" INTEGER,
    "session" TEXT,
    "day_of_week" INTEGER,
    "month" INTEGER,
    "year" INTEGER,
    "outcome" TEXT,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "raw_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_executions" (
    "id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "execution_type" TEXT NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "lots" DECIMAL(20,6) NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL,
    "pnl" DECIMAL(20,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trade_id" TEXT,
    "trading_account_id" TEXT,
    "strategy_id" TEXT,
    "entry_date" DATE NOT NULL,
    "entry_type" TEXT NOT NULL DEFAULT 'trade',
    "notes" TEXT,
    "trading_plan" TEXT,
    "mistakes" TEXT,
    "lessons" TEXT,
    "market_analysis" TEXT,
    "emotional_state" TEXT,
    "confidence_level" INTEGER,
    "stress_level" INTEGER,
    "discipline_score" INTEGER,
    "energy_level" INTEGER,
    "focus_score" INTEGER,
    "setup_type" TEXT,
    "market_condition" TEXT,
    "followed_plan" BOOLEAN,
    "ai_sentiment" TEXT,
    "ai_summary" TEXT,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_screenshots" (
    "id" TEXT NOT NULL,
    "journal_entry_id" TEXT,
    "s3_key" TEXT NOT NULL,
    "s3_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "filename" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "caption" TEXT,
    "timeframe" TEXT,
    "chart_type" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_screenshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_tags" (
    "trade_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "trade_tags_pkey" PRIMARY KEY ("trade_id","tag_id")
);

-- CreateTable
CREATE TABLE "journal_tags" (
    "journal_entry_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "journal_tags_pkey" PRIMARY KEY ("journal_entry_id","tag_id")
);

-- CreateTable
CREATE TABLE "strategies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "timeframes" TEXT[],
    "instruments" TEXT[],
    "rules" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_strategies" (
    "trade_id" TEXT NOT NULL,
    "strategy_id" TEXT NOT NULL,

    CONSTRAINT "trade_strategies_pkey" PRIMARY KEY ("trade_id","strategy_id")
);

-- CreateTable
CREATE TABLE "prop_firms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "website_url" TEXT,
    "country" TEXT,
    "founded_year" INTEGER,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "instruments" TEXT[],
    "platforms" TEXT[],
    "payout_methods" TEXT[],
    "headquarters" TEXT,
    "last_crawled_at" TIMESTAMP(3),
    "crawl_url" TEXT,
    "crawl_selectors" JSONB,
    "trust_score" DECIMAL(5,2),
    "community_rating" DECIMAL(3,2),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prop_firms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prop_firm_challenge_types" (
    "id" TEXT NOT NULL,
    "prop_firm_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prop_firm_challenge_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prop_firm_account_sizes" (
    "id" TEXT NOT NULL,
    "challenge_type_id" TEXT NOT NULL,
    "account_size" INTEGER NOT NULL,
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prop_firm_account_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prop_firm_rules" (
    "id" TEXT NOT NULL,
    "prop_firm_id" TEXT NOT NULL,
    "challenge_type_id" TEXT,
    "phase" INTEGER NOT NULL DEFAULT 1,
    "profit_target_pct" DECIMAL(5,2),
    "daily_drawdown_pct" DECIMAL(5,2),
    "daily_drawdown_type" TEXT,
    "max_drawdown_pct" DECIMAL(5,2),
    "max_drawdown_type" TEXT,
    "trailing_drawdown" BOOLEAN NOT NULL DEFAULT false,
    "min_trading_days" INTEGER,
    "max_trading_days" INTEGER,
    "max_challenge_duration_days" INTEGER,
    "max_lot_size" DECIMAL(10,2),
    "news_trading_allowed" BOOLEAN NOT NULL DEFAULT true,
    "overnight_holding_allowed" BOOLEAN NOT NULL DEFAULT true,
    "weekend_holding_allowed" BOOLEAN NOT NULL DEFAULT true,
    "ea_allowed" BOOLEAN NOT NULL DEFAULT true,
    "copy_trading_allowed" BOOLEAN NOT NULL DEFAULT false,
    "consistency_rule" BOOLEAN NOT NULL DEFAULT false,
    "consistency_pct" DECIMAL(5,2),
    "min_trade_duration_seconds" INTEGER,
    "profit_split_pct" DECIMAL(5,2),
    "payout_frequency" TEXT,
    "min_payout_amount" DECIMAL(10,2),
    "scaling_plan" JSONB,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "change_description" TEXT,
    "changed_by_crawler" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prop_firm_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prop_firm_rule_snapshots" (
    "id" TEXT NOT NULL,
    "prop_firm_id" TEXT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "rules_json" JSONB NOT NULL,
    "prices_json" JSONB,
    "crawled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prop_firm_rule_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prop_firm_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prop_firm_id" TEXT NOT NULL,
    "challenge_type_id" TEXT,
    "rules_snapshot_id" TEXT,
    "account_name" TEXT,
    "account_number" TEXT,
    "account_size" INTEGER NOT NULL,
    "current_phase" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "purchased_at" DATE,
    "activated_at" DATE,
    "phase_started_at" DATE,
    "passed_at" DATE,
    "failed_at" DATE,
    "funded_at" DATE,
    "challenge_cost" DECIMAL(10,2),
    "activation_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reset_count" INTEGER NOT NULL DEFAULT 0,
    "total_reset_fees" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "addon_costs" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "current_balance" DECIMAL(20,6),
    "peak_balance" DECIMAL(20,6),
    "current_drawdown_pct" DECIMAL(10,4),
    "daily_pnl" DECIMAL(20,6),
    "total_pnl" DECIMAL(20,6),
    "trading_days_count" INTEGER NOT NULL DEFAULT 0,
    "is_at_risk" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prop_firm_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_daily_snapshots" (
    "id" TEXT NOT NULL,
    "prop_firm_account_id" TEXT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "balance" DECIMAL(20,6),
    "equity" DECIMAL(20,6),
    "daily_pnl" DECIMAL(20,6),
    "daily_drawdown_pct" DECIMAL(10,4),
    "max_drawdown_pct" DECIMAL(10,4),
    "trading_days" INTEGER,
    "status" TEXT,

    CONSTRAINT "challenge_daily_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prop_firm_account_id" TEXT NOT NULL,
    "prop_firm_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payout_date" DATE NOT NULL,
    "profit_split_pct" DECIMAL(5,2),
    "gross_profit" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "transaction_ref" TEXT,
    "notes" TEXT,
    "proof_url" TEXT,
    "processing_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_daily_rollups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trading_account_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_trades" INTEGER NOT NULL DEFAULT 0,
    "winning_trades" INTEGER NOT NULL DEFAULT 0,
    "losing_trades" INTEGER NOT NULL DEFAULT 0,
    "win_rate" DECIMAL(5,4),
    "gross_pnl" DECIMAL(20,6),
    "net_pnl" DECIMAL(20,6),
    "commission" DECIMAL(20,6),
    "largest_win" DECIMAL(20,6),
    "largest_loss" DECIMAL(20,6),
    "avg_win" DECIMAL(20,6),
    "avg_loss" DECIMAL(20,6),
    "profit_factor" DECIMAL(10,4),
    "expectancy" DECIMAL(10,4),
    "avg_r_multiple" DECIMAL(10,4),
    "max_drawdown" DECIMAL(10,4),

    CONSTRAINT "analytics_daily_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prop_firm_account_id" TEXT,
    "alert_type" TEXT NOT NULL,
    "threshold_value" DECIMAL(10,4),
    "threshold_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "channels" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_events" (
    "id" TEXT NOT NULL,
    "alert_rule_id" TEXT,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prop_firm_account_id" TEXT,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_dismissed" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prop_firm_reviews" (
    "id" TEXT NOT NULL,
    "prop_firm_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payout_speed" INTEGER,
    "customer_support" INTEGER,
    "execution_quality" INTEGER,
    "slippage" INTEGER,
    "transparency" INTEGER,
    "dashboard_ux" INTEGER,
    "overall_rating" INTEGER NOT NULL,
    "account_size_traded" INTEGER,
    "verified_trader" BOOLEAN NOT NULL DEFAULT false,
    "review_title" TEXT,
    "review_body" TEXT,
    "pros" TEXT,
    "cons" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prop_firm_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backtests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "strategy_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "engine" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "initial_capital" DECIMAL(20,6) NOT NULL,
    "params" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "total_trades" INTEGER,
    "win_rate" DECIMAL(5,4),
    "profit_factor" DECIMAL(10,4),
    "expectancy" DECIMAL(10,4),
    "sharpe_ratio" DECIMAL(10,4),
    "sortino_ratio" DECIMAL(10,4),
    "calmar_ratio" DECIMAL(10,4),
    "max_drawdown_pct" DECIMAL(10,4),
    "total_return_pct" DECIMAL(10,4),
    "prob_of_ruin" DECIMAL(5,4),
    "results_json" JSONB,
    "equity_curve" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backtests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "context_type" TEXT,
    "context_id" TEXT,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokens_used" INTEGER,
    "model" TEXT,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trading_account_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "filename" TEXT,
    "file_size" INTEGER,
    "s3_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progress_pct" INTEGER NOT NULL DEFAULT 0,
    "total_rows" INTEGER,
    "imported_rows" INTEGER NOT NULL DEFAULT 0,
    "skipped_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prop_firm_rule_changes" (
    "id" TEXT NOT NULL,
    "prop_firm_id" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "field_name" TEXT,
    "previous_val" TEXT,
    "current_val" TEXT,
    "impact_level" TEXT NOT NULL DEFAULT 'medium',
    "source_url" TEXT,
    "source_label" TEXT,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prop_firm_rule_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firm_recommendations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "prop_firm_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "compatibility_pct" DECIMAL(5,2) NOT NULL,
    "reasons" JSONB NOT NULL,
    "cautions" JSONB NOT NULL,
    "input_snapshot" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "firm_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playbook_setups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rules" TEXT,
    "timeframes" TEXT[],
    "instruments" TEXT[],
    "direction" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playbook_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_playbook_tags" (
    "trade_id" TEXT NOT NULL,
    "setup_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_playbook_tags_pkey" PRIMARY KEY ("trade_id","setup_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_clerk_org_id_key" ON "tenants"("clerk_org_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_user_id_key" ON "users"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trades_import_hash_key" ON "trades"("import_hash");

-- CreateIndex
CREATE INDEX "trades_tenant_id_user_id_idx" ON "trades"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "trades_trading_account_id_idx" ON "trades"("trading_account_id");

-- CreateIndex
CREATE INDEX "trades_open_time_idx" ON "trades"("open_time" DESC);

-- CreateIndex
CREATE INDEX "trades_symbol_idx" ON "trades"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_trade_id_key" ON "journal_entries"("trade_id");

-- CreateIndex
CREATE INDEX "journal_entries_tenant_id_user_id_idx" ON "journal_entries"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "journal_entries_entry_date_idx" ON "journal_entries"("entry_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "tags_tenant_id_user_id_name_key" ON "tags"("tenant_id", "user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "prop_firms_slug_key" ON "prop_firms"("slug");

-- CreateIndex
CREATE INDEX "prop_firm_rules_prop_firm_id_is_current_idx" ON "prop_firm_rules"("prop_firm_id", "is_current");

-- CreateIndex
CREATE UNIQUE INDEX "prop_firm_rule_snapshots_prop_firm_id_snapshot_date_key" ON "prop_firm_rule_snapshots"("prop_firm_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "prop_firm_accounts_tenant_id_user_id_idx" ON "prop_firm_accounts"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "prop_firm_accounts_status_idx" ON "prop_firm_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_daily_snapshots_prop_firm_account_id_snapshot_dat_key" ON "challenge_daily_snapshots"("prop_firm_account_id", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_daily_rollups_trading_account_id_date_key" ON "analytics_daily_rollups"("trading_account_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "prop_firm_reviews_prop_firm_id_user_id_key" ON "prop_firm_reviews"("prop_firm_id", "user_id");

-- CreateIndex
CREATE INDEX "prop_firm_rule_changes_prop_firm_id_detected_at_idx" ON "prop_firm_rule_changes"("prop_firm_id", "detected_at");

-- CreateIndex
CREATE INDEX "prop_firm_rule_changes_change_type_idx" ON "prop_firm_rule_changes"("change_type");

-- CreateIndex
CREATE INDEX "firm_recommendations_user_id_rank_idx" ON "firm_recommendations"("user_id", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "firm_recommendations_user_id_prop_firm_id_key" ON "firm_recommendations"("user_id", "prop_firm_id");

-- CreateIndex
CREATE INDEX "playbook_setups_tenant_id_user_id_idx" ON "playbook_setups"("tenant_id", "user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_connections" ADD CONSTRAINT "broker_connections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_connections" ADD CONSTRAINT "broker_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trading_accounts" ADD CONSTRAINT "trading_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trading_accounts" ADD CONSTRAINT "trading_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trading_accounts" ADD CONSTRAINT "trading_accounts_broker_connection_id_fkey" FOREIGN KEY ("broker_connection_id") REFERENCES "broker_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trading_accounts" ADD CONSTRAINT "trading_accounts_prop_firm_account_id_fkey" FOREIGN KEY ("prop_firm_account_id") REFERENCES "prop_firm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_trading_account_id_fkey" FOREIGN KEY ("trading_account_id") REFERENCES "trading_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_executions" ADD CONSTRAINT "trade_executions_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_screenshots" ADD CONSTRAINT "journal_screenshots_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_tags" ADD CONSTRAINT "trade_tags_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_tags" ADD CONSTRAINT "trade_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_tags" ADD CONSTRAINT "journal_tags_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_tags" ADD CONSTRAINT "journal_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_strategies" ADD CONSTRAINT "trade_strategies_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_strategies" ADD CONSTRAINT "trade_strategies_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prop_firm_challenge_types" ADD CONSTRAINT "prop_firm_challenge_types_prop_firm_id_fkey" FOREIGN KEY ("prop_firm_id") REFERENCES "prop_firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prop_firm_account_sizes" ADD CONSTRAINT "prop_firm_account_sizes_challenge_type_id_fkey" FOREIGN KEY ("challenge_type_id") REFERENCES "prop_firm_challenge_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prop_firm_rules" ADD CONSTRAINT "prop_firm_rules_prop_firm_id_fkey" FOREIGN KEY ("prop_firm_id") REFERENCES "prop_firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prop_firm_rules" ADD CONSTRAINT "prop_firm_rules_challenge_type_id_fkey" FOREIGN KEY ("challenge_type_id") REFERENCES "prop_firm_challenge_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prop_firm_rule_snapshots" ADD CONSTRAINT "prop_firm_rule_snapshots_prop_firm_id_fkey" FOREIGN KEY ("prop_firm_id") REFERENCES "prop_firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prop_firm_accounts" ADD CONSTRAINT "prop_firm_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prop_firm_accounts" ADD CONSTRAINT "prop_firm_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prop_firm_accounts" ADD CONSTRAINT "prop_firm_accounts_prop_firm_id_fkey" FOREIGN KEY ("prop_firm_id") REFERENCES "prop_firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prop_firm_accounts" ADD CONSTRAINT "prop_firm_accounts_challenge_type_id_fkey" FOREIGN KEY ("challenge_type_id") REFERENCES "prop_firm_challenge_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prop_firm_accounts" ADD CONSTRAINT "prop_firm_accounts_rules_snapshot_id_fkey" FOREIGN KEY ("rules_snapshot_id") REFERENCES "prop_firm_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_daily_snapshots" ADD CONSTRAINT "challenge_daily_snapshots_prop_firm_account_id_fkey" FOREIGN KEY ("prop_firm_account_id") REFERENCES "prop_firm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_prop_firm_account_id_fkey" FOREIGN KEY ("prop_firm_account_id") REFERENCES "prop_firm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_prop_firm_id_fkey" FOREIGN KEY ("prop_firm_id") REFERENCES "prop_firms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_daily_rollups" ADD CONSTRAINT "analytics_daily_rollups_trading_account_id_fkey" FOREIGN KEY ("trading_account_id") REFERENCES "trading_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_prop_firm_account_id_fkey" FOREIGN KEY ("prop_firm_account_id") REFERENCES "prop_firm_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_prop_firm_account_id_fkey" FOREIGN KEY ("prop_firm_account_id") REFERENCES "prop_firm_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_alert_rule_id_fkey" FOREIGN KEY ("alert_rule_id") REFERENCES "alert_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prop_firm_reviews" ADD CONSTRAINT "prop_firm_reviews_prop_firm_id_fkey" FOREIGN KEY ("prop_firm_id") REFERENCES "prop_firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prop_firm_reviews" ADD CONSTRAINT "prop_firm_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backtests" ADD CONSTRAINT "backtests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backtests" ADD CONSTRAINT "backtests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backtests" ADD CONSTRAINT "backtests_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_trading_account_id_fkey" FOREIGN KEY ("trading_account_id") REFERENCES "trading_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prop_firm_rule_changes" ADD CONSTRAINT "prop_firm_rule_changes_prop_firm_id_fkey" FOREIGN KEY ("prop_firm_id") REFERENCES "prop_firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firm_recommendations" ADD CONSTRAINT "firm_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firm_recommendations" ADD CONSTRAINT "firm_recommendations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firm_recommendations" ADD CONSTRAINT "firm_recommendations_prop_firm_id_fkey" FOREIGN KEY ("prop_firm_id") REFERENCES "prop_firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playbook_setups" ADD CONSTRAINT "playbook_setups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playbook_setups" ADD CONSTRAINT "playbook_setups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_playbook_tags" ADD CONSTRAINT "trade_playbook_tags_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_playbook_tags" ADD CONSTRAINT "trade_playbook_tags_setup_id_fkey" FOREIGN KEY ("setup_id") REFERENCES "playbook_setups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

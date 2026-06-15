# PropOS — REST API Design

## Base URLs
- Production: `https://api.propos.io/v1`
- Staging: `https://api.staging.propos.io/v1`

## Authentication
All requests require `Authorization: Bearer <clerk_jwt>` header.
Multi-tenant context resolved from JWT's `org_id` claim.

## Standard Response Envelope
```json
{
  "data": {},
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 340,
    "totalPages": 7
  },
  "error": null
}
```

---

## MODULE 1 — TRADES

### `GET /trades`
List trades with filtering.
```
Query params:
  accountId       UUID
  symbol          string
  direction       long | short
  outcome         win | loss | breakeven
  session         london | new_york | asian
  strategyId      UUID
  tagIds          UUID[] (comma-separated)
  dateFrom        ISO date
  dateTo          ISO date
  page            number (default 1)
  limit           number (default 50, max 500)
  sort            open_time | net_pnl | r_multiple
  order           asc | desc
```

### `POST /trades`
Manually create trade.
```json
{
  "tradingAccountId": "uuid",
  "symbol": "EURUSD",
  "direction": "long",
  "openTime": "2024-01-15T09:30:00Z",
  "closeTime": "2024-01-15T14:45:00Z",
  "openPrice": 1.0850,
  "closePrice": 1.0920,
  "stopLoss": 1.0800,
  "takeProfit": 1.0950,
  "lots": 0.5,
  "commission": -3.50,
  "swap": 0
}
```

### `GET /trades/:id`
Get single trade with journal entry, screenshots, tags.

### `PATCH /trades/:id`
Update trade fields (risk%, strategy, notes, tags).

### `DELETE /trades/:id`
Soft delete.

### `POST /trades/bulk-delete`
```json
{ "ids": ["uuid1", "uuid2"] }
```

---

## MODULE 2 — JOURNAL

### `GET /journal`
```
Query: accountId, dateFrom, dateTo, entryType, emotionalState, page, limit
```

### `POST /journal`
```json
{
  "tradeId": "uuid",
  "tradingAccountId": "uuid",
  "entryDate": "2024-01-15",
  "entryType": "trade",
  "notes": "Executed perfectly. Waited for confirmation.",
  "tradingPlan": "Wait for London open break of Asian range...",
  "mistakes": null,
  "lessons": "Patience paid off today",
  "emotionalState": "calm",
  "confidenceLevel": 8,
  "stressLevel": 3,
  "disciplineScore": 9,
  "followedPlan": true,
  "marketCondition": "trending",
  "strategyId": "uuid",
  "tagIds": ["uuid1", "uuid2"]
}
```

### `POST /journal/:id/screenshots`
Upload screenshots (multipart/form-data).
```
Fields: file, caption, timeframe, chartType
```

### `DELETE /journal/:id/screenshots/:screenshotId`

---

## MODULE 3 — ANALYTICS

### `GET /analytics/overview`
```
Query: accountId, dateFrom, dateTo
Response includes all core metrics.
```
```json
{
  "data": {
    "totalTrades": 187,
    "winRate": 0.624,
    "profitFactor": 2.31,
    "expectancy": 0.42,
    "netPnl": 18450.20,
    "sharpeRatio": 1.87,
    "sortinoRatio": 2.41,
    "calmarRatio": 3.12,
    "maxDrawdownPct": 4.2,
    "avgRMultiple": 1.34,
    "avgTradeDurationSeconds": 7320,
    "bestDay": { "date": "2024-01-10", "pnl": 3420 },
    "worstDay": { "date": "2024-01-22", "pnl": -890 }
  }
}
```

### `GET /analytics/breakdown`
```
Query: groupBy (strategy|session|symbol|dayOfWeek|month|account), accountId, dateFrom, dateTo
```

### `GET /analytics/equity-curve`
```
Query: accountId, dateFrom, dateTo, interval (daily|weekly|monthly)
```

### `GET /analytics/heatmap`
Returns day-of-week × session PnL matrix.

### `GET /analytics/streaks`
Returns win/loss streak analysis.

### `GET /analytics/distributions`
Returns PnL distribution, R-multiple distribution, duration distribution.

---

## MODULE 4 — IMPORT

### `POST /import/file`
Upload statement file (multipart).
```
Fields:
  tradingAccountId  UUID (required)
  source           mt4_html | mt4_csv | mt5_html | mt5_csv | ctrader_csv | dxtrade_csv
  file             File
```
Returns `{ importJobId: "uuid" }`.

### `GET /import/jobs`
List import jobs for user.

### `GET /import/jobs/:id`
Poll import status.
```json
{
  "data": {
    "id": "uuid",
    "status": "processing",
    "progressPct": 45,
    "totalRows": 400,
    "importedRows": 178,
    "skippedRows": 2,
    "errorRows": 0
  }
}
```

### `DELETE /import/jobs/:id`
Cancel queued import.

### `POST /import/broker-connection`
Connect live broker via API.
```json
{
  "brokerType": "ctrader",
  "tradingAccountId": "uuid",
  "credentials": {
    "clientId": "...",
    "clientSecret": "...",
    "accountId": "..."
  }
}
```

---

## MODULE 5 — PROP FIRMS (Directory)

### `GET /prop-firms`
```
Query: search, instruments[], platforms[], hasInstantFunding, page, limit
```

### `GET /prop-firms/:slug`
Get firm details with current rules and community ratings.

### `GET /prop-firms/:slug/rules`
```
Query: challengeType, accountSize, phase
```

### `GET /prop-firms/:slug/history`
Rule change history with diffs.

### `GET /prop-firms/:slug/reviews`
Community reviews.

### `POST /prop-firms/:slug/reviews`
Submit review (requires verified account).

---

## MODULE 6 — USER PROP FIRM ACCOUNTS

### `GET /accounts`
List all user prop firm accounts.
```
Query: status (active|passed|failed|funded), propFirmId, page, limit
```

### `POST /accounts`
Create new prop firm account.
```json
{
  "propFirmId": "uuid",
  "challengeTypeId": "uuid",
  "accountSize": 100000,
  "accountName": "FTMO 100k - Jan 2024",
  "challengeCost": 540,
  "activationFee": 0,
  "purchasedAt": "2024-01-05",
  "phase": 1
}
```

### `GET /accounts/:id`
Full account detail with challenge progress, linked trades.

### `PATCH /accounts/:id`
Update account (phase, status, costs).

### `POST /accounts/:id/reset`
Record a reset.
```json
{ "resetFee": 199, "resetDate": "2024-02-01" }
```

### `GET /accounts/:id/progress`
Live challenge progress vs rules.

### `GET /accounts/:id/daily-snapshots`
Historical balance/drawdown snapshots.

---

## MODULE 7 — PAYOUTS

### `GET /payouts`
List payouts. Query: propFirmId, accountId, status, dateFrom, dateTo.

### `POST /payouts`
Record payout.
```json
{
  "propFirmAccountId": "uuid",
  "amount": 1500,
  "payoutDate": "2024-02-15",
  "profitSplitPct": 80,
  "status": "paid",
  "paymentMethod": "bank_wire",
  "processingDays": 3
}
```

### `GET /payouts/roi-summary`
Global ROI and per-firm ROI.
```json
{
  "data": {
    "globalRoi": {
      "totalCosts": 4200,
      "totalPayouts": 28500,
      "netProfit": 24300,
      "roiPct": 578.6
    },
    "byFirm": [
      {
        "firmName": "FundingPips",
        "totalCosts": 1200,
        "totalPayouts": 8500,
        "roiPct": 608.3
      }
    ]
  }
}
```

---

## MODULE 8 — AI COACH

### `POST /ai/conversations`
Start new AI conversation.
```json
{
  "contextType": "general",
  "title": "Performance Review - January"
}
```

### `POST /ai/conversations/:id/messages`
Send message (supports streaming via SSE).
```json
{
  "content": "Why am I losing money on Friday afternoons?",
  "stream": true
}
```
Streaming response via `text/event-stream`.

### `GET /ai/conversations`
List conversations.

### `GET /ai/conversations/:id`
Get conversation with messages.

### `POST /ai/insights`
Generate one-off insight report.
```json
{
  "insightType": "weekly_summary" | "firm_recommendation" | "strategy_analysis" | "psychology_report",
  "accountId": "uuid",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-01-31"
}
```

### `GET /ai/firm-recommendations`
Get personalized prop firm recommendations.
```json
{
  "data": {
    "recommendations": [
      {
        "propFirm": { "id": "uuid", "name": "FundingPips", "slug": "fundingpips" },
        "score": 94,
        "grade": "A+",
        "reasons": ["Your avg drawdown of 2.1% is well within their 5% daily limit", "Your trade frequency matches their min 3 days requirement", "No scalping restrictions for your avg 4h hold time"],
        "concerns": ["Their consistency rule may limit your best days impact"],
        "estimatedPassRate": 0.78
      }
    ]
  }
}
```

---

## MODULE 9 — ALERTS

### `GET /alerts`
List alert events. Query: isRead, severity, alertType.

### `PATCH /alerts/:id/read`
Mark as read.

### `POST /alerts/mark-all-read`

### `GET /alert-rules`
List configured alert rules.

### `POST /alert-rules`
```json
{
  "propFirmAccountId": "uuid",
  "alertType": "daily_drawdown_warning",
  "thresholdValue": 80,
  "thresholdType": "pct",
  "channels": ["email", "in_app"]
}
```

### `PATCH /alert-rules/:id`
Update rule.

### `DELETE /alert-rules/:id`

---

## MODULE 10 — BACKTESTING

### `POST /backtests`
Create and queue backtest.
```json
{
  "name": "London Breakout - EUR/USD",
  "strategyId": "uuid",
  "engine": "vectorbt",
  "symbol": "EURUSD",
  "timeframe": "H1",
  "startDate": "2022-01-01",
  "endDate": "2024-01-01",
  "initialCapital": 10000,
  "params": {
    "riskPerTrade": 1,
    "stopLossPips": 20,
    "takeProfitPips": 40
  }
}
```

### `GET /backtests`
List backtests.

### `GET /backtests/:id`
Full results with equity curve.

### `DELETE /backtests/:id`

---

## WEBHOOKS (Inbound)

### `POST /webhooks/tradingview`
TradingView alert webhook.
```json
{
  "token": "user_webhook_token",
  "symbol": "EURUSD",
  "action": "buy",
  "price": 1.0850,
  "qty": 0.5,
  "time": "2024-01-15T09:30:00Z"
}
```

### `POST /webhooks/stripe`
Stripe billing events.

---

## WEBSOCKET EVENTS

### Connection
`wss://api.propos.io/ws?token=<clerk_jwt>`

### Subscribe to account
```json
{ "action": "subscribe", "channel": "account", "accountId": "uuid" }
```

### Events emitted by server
```json
{ "event": "trade.new", "data": { "tradeId": "uuid", "netPnl": 450 } }
{ "event": "alert.triggered", "data": { "alertType": "daily_drawdown_warning", "severity": "warning" } }
{ "event": "import.progress", "data": { "importJobId": "uuid", "progressPct": 67 } }
{ "event": "challenge.status_change", "data": { "accountId": "uuid", "newStatus": "at_risk" } }
{ "event": "firm.rule_change", "data": { "propFirmId": "uuid", "firmName": "FTMO", "changes": [...] } }
```

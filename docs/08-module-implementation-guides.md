# PropOS — Module Implementation Guides

---

## MODULE 1 — TRADE IMPORT ENGINE

### Universal Trade Schema (TypeScript)
```typescript
interface UniversalTrade {
  // Source identifiers
  brokerTradeId?: string;
  brokerTicket?: string;
  importHash: string;          // SHA256 dedup key

  // Core fields
  symbol: string;
  direction: 'long' | 'short';
  openTime: Date;
  closeTime?: Date;
  openPrice: number;
  closePrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  lots: number;

  // P&L
  grossPnl?: number;
  commission?: number;
  swap?: number;
  netPnl?: number;
  pips?: number;

  // Calculated
  rMultiple?: number;
  durationSeconds?: number;
  session?: 'london' | 'new_york' | 'asian' | 'sydney' | 'overlap';
  outcome?: 'win' | 'loss' | 'breakeven';

  // Raw data preserved
  rawData: Record<string, unknown>;
}
```

### Parser Architecture
```typescript
// Base parser interface
abstract class BrokerParser {
  abstract parse(input: Buffer | string): Promise<UniversalTrade[]>;

  protected calculateImportHash(trade: Partial<UniversalTrade>): string {
    const key = `${trade.brokerTradeId}:${trade.symbol}:${trade.openTime?.toISOString()}`;
    return createHash('sha256').update(key).digest('hex');
  }

  protected classifySession(openTime: Date): string {
    const utcHour = openTime.getUTCHours();
    if (utcHour >= 8 && utcHour < 16) return 'london';
    if (utcHour >= 13 && utcHour < 22) return 'new_york';
    if (utcHour >= 0 && utcHour < 8) return 'asian';
    return 'sydney';
  }
}

// MT4 HTML parser example
class MT4HtmlParser extends BrokerParser {
  async parse(html: Buffer): Promise<UniversalTrade[]> {
    const $ = cheerio.load(html);
    const trades: UniversalTrade[] = [];

    $('table tr').each((_, row) => {
      // Parse row into trade...
      // Map MT4 fields: Ticket, Open Time, Type, Size, Item, Price, S/L, T/P, Close Price, Profit
    });

    return trades;
  }
}
```

### Import Pipeline (BullMQ)
```
Job: { importJobId, s3Key, source, tradingAccountId }
  │
  ├── Download file from S3
  ├── Select parser by source
  ├── Parse → raw trades[]
  ├── Dedup check (hash lookup)
  ├── Enrich (session, R-multiple, instrument category)
  ├── Bulk insert (batches of 100)
  ├── Trigger analytics recalculation job
  └── Trigger AI embedding job
```

---

## MODULE 3 — ANALYTICS ENGINE

### Metric Computation SQL

```sql
-- Win Rate
SELECT
  COUNT(*) FILTER (WHERE outcome = 'win')::FLOAT / COUNT(*) AS win_rate
FROM trades WHERE trading_account_id = $1;

-- Profit Factor
SELECT
  SUM(net_pnl) FILTER (WHERE outcome = 'win') /
  ABS(SUM(net_pnl) FILTER (WHERE outcome = 'loss')) AS profit_factor
FROM trades WHERE trading_account_id = $1;

-- Expectancy (per trade)
SELECT
  AVG(net_pnl) AS expectancy
FROM trades WHERE trading_account_id = $1;

-- Sharpe Ratio (annualized)
WITH daily_returns AS (
  SELECT date_trunc('day', close_time) AS day, SUM(net_pnl) AS daily_pnl
  FROM trades WHERE trading_account_id = $1
  GROUP BY 1
)
SELECT
  (AVG(daily_pnl) / NULLIF(STDDEV(daily_pnl), 0)) * SQRT(252) AS sharpe_ratio
FROM daily_returns;

-- Max Drawdown
WITH equity_curve AS (
  SELECT
    close_time,
    SUM(net_pnl) OVER (ORDER BY close_time) AS cumulative_pnl,
    MAX(SUM(net_pnl) OVER (ORDER BY close_time)) OVER (ORDER BY close_time) AS running_peak
  FROM trades WHERE trading_account_id = $1
)
SELECT MIN((cumulative_pnl - running_peak) / running_peak * 100) AS max_drawdown_pct
FROM equity_curve;
```

---

## MODULE 5 — PROP FIRM MONITORING

### Crawler Architecture
```typescript
@Injectable()
class PropFirmCrawlerService {
  async crawlFirm(firmId: string): Promise<PropFirmRules> {
    const firm = await this.firmsRepo.findById(firmId);
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();

    await page.goto(firm.crawlUrl, { waitUntil: 'networkidle' });

    // Use firm-specific selectors from DB
    const rules = await this.extractRules(page, firm.crawlSelectors);

    await browser.close();
    return rules;
  }

  async detectChanges(firmId: string, newRules: PropFirmRules) {
    const current = await this.rulesRepo.getCurrent(firmId);
    const diff = deepDiff(current, newRules);

    if (diff.length > 0) {
      await this.rulesRepo.createVersion(firmId, newRules, diff);
      await this.notifyAffectedUsers(firmId, diff);
    }

    await this.snapshotsRepo.save(firmId, newRules);
  }
}
```

### Cron Schedule
```typescript
// BullMQ cron job
await crawlQueue.add('crawl-all-firms',
  {},
  { repeat: { cron: '0 2 * * *' } }  // Daily at 02:00 UTC
);
```

---

## MODULE 6 — RECOMMENDATION ENGINE

### Algorithm
```typescript
interface TraderProfile {
  winRate: number;              // e.g. 0.63
  avgDrawdown: number;          // e.g. 0.021 (2.1%)
  avgHoldingTimeSeconds: number; // e.g. 14400 (4h)
  tradeFrequencyPerWeek: number; // e.g. 12
  consistencyScore: number;     // stddev of daily PnL (lower = more consistent)
  scalpingBehavior: boolean;    // avg trade < 5 min
  newsTrader: boolean;          // trades around news events
}

function scoreTraderAgainstFirm(
  trader: TraderProfile,
  rules: PropFirmRules
): number {
  let score = 100;

  // Drawdown compatibility (0-30 points)
  const drawdownBuffer = rules.dailyDrawdownPct - (trader.avgDrawdown * 100);
  score -= drawdownBuffer < 1 ? 30 : drawdownBuffer < 2 ? 15 : 0;

  // Scalping restriction (0-25 points)
  if (trader.scalpingBehavior && rules.minTradeDurationSeconds > 60) {
    score -= 25;
  }

  // News trading (0-15 points)
  if (trader.newsTrader && !rules.newsTradingAllowed) {
    score -= 15;
  }

  // Trade frequency vs min days requirement
  const projectedDays = rules.minTradingDays / (trader.tradeFrequencyPerWeek / 5);
  if (projectedDays > rules.maxChallengeDurationDays * 0.8) {
    score -= 10;
  }

  // Consistency rule impact
  if (rules.consistencyRule) {
    // Check if trader's best days would violate consistency pct
    score -= trader.consistencyScore > 0.3 ? 15 : 5;
  }

  return Math.max(0, Math.min(100, score));
}
```

---

## MODULE 10 — AI PERFORMANCE COACH

### RAG Architecture
```typescript
@Injectable()
class AICoachService {
  async answer(userId: string, question: string): Promise<string> {
    // 1. Embed the question
    const questionEmbedding = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: question
    });

    // 2. Retrieve relevant trades and journal entries
    const relevantTrades = await this.db.query(`
      SELECT t.*, je.notes, je.emotional_state
      FROM trade_embeddings te
      JOIN trades t ON t.id = te.trade_id
      LEFT JOIN journal_entries je ON je.trade_id = t.id
      WHERE te.embedding <=> $1 < 0.3
        AND t.user_id = $2
      ORDER BY te.embedding <=> $1
      LIMIT 20
    `, [questionEmbedding.data[0].embedding, userId]);

    // 3. Build context from trader's stats
    const stats = await this.analyticsService.getOverview(userId);
    const propFirmAccounts = await this.accountsService.getAll(userId);

    // 4. Construct system prompt with context
    const systemPrompt = buildTradingCoachPrompt(stats, relevantTrades, propFirmAccounts);

    // 5. Stream response
    const stream = await this.anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }]
    });

    return stream;
  }
}

function buildTradingCoachPrompt(stats, trades, accounts): string {
  return `
You are PropOS AI Coach, an expert trading performance analyst.

TRADER STATISTICS (last 90 days):
- Win Rate: ${(stats.winRate * 100).toFixed(1)}%
- Profit Factor: ${stats.profitFactor}
- Expectancy: $${stats.expectancy}
- Avg R-Multiple: ${stats.avgRMultiple}R
- Sharpe Ratio: ${stats.sharpeRatio}
- Max Drawdown: ${stats.maxDrawdownPct}%
- Best Session: ${stats.bestSession} (${stats.bestSessionWinRate}% win rate)
- Worst Day: ${stats.worstDayOfWeek}

PROP FIRM ACCOUNTS:
${accounts.map(a => `- ${a.firmName} ${a.accountSize}: ${a.status}, ${a.currentProfitPct}% profit`).join('\n')}

RELEVANT TRADES (most similar to the question):
${trades.slice(0, 10).map(t =>
  `${t.open_time}: ${t.symbol} ${t.direction} ${t.net_pnl > 0 ? '+' : ''}$${t.net_pnl} | Journal: "${t.notes?.slice(0, 100)}"`
).join('\n')}

Answer the trader's question using their data. Be specific, data-driven, and actionable.
Reference actual numbers from their trading history. Avoid generic advice.
  `;
}
```

---

## MODULE 11 — SMART ALERT ENGINE

### Alert Evaluator
```typescript
// Runs after every trade imported or at 5-minute intervals for live accounts
@Injectable()
class AlertEvaluatorService {
  async evaluateAccount(accountId: string) {
    const account = await this.accountsRepo.getWithProgress(accountId);
    const rules = account.rules;

    // Daily drawdown warning
    const dailyDrawdownUsedPct = Math.abs(account.dailyPnl / account.accountSize * 100);
    const dailyDrawdownRatio = dailyDrawdownUsedPct / rules.dailyDrawdownPct;

    if (dailyDrawdownRatio >= 0.9 && !await this.alertSentToday(accountId, 'daily_drawdown_critical')) {
      await this.fireAlert(accountId, 'daily_drawdown_critical', {
        severity: 'critical',
        title: '⛔ Daily Drawdown Critical — Stop Trading Now',
        body: `You've used ${(dailyDrawdownRatio * 100).toFixed(0)}% of your daily limit. $${Math.abs(account.dailyPnl).toFixed(0)} used of $${(account.accountSize * rules.dailyDrawdownPct / 100).toFixed(0)} allowed.`
      });
    } else if (dailyDrawdownRatio >= 0.7 && !await this.alertSentToday(accountId, 'daily_drawdown_warning')) {
      await this.fireAlert(accountId, 'daily_drawdown_warning', {
        severity: 'warning',
        title: '⚠️ Daily Drawdown at 70% — Reduce Risk',
        body: `Approaching daily limit. $${(account.accountSize * rules.dailyDrawdownPct / 100 - Math.abs(account.dailyPnl)).toFixed(0)} remaining buffer.`
      });
    }

    // Profit target close
    const profitPct = account.totalPnl / account.accountSize * 100;
    const profitRatio = profitPct / rules.profitTargetPct;
    if (profitRatio >= 0.9 && !await this.alertSentThisPhase(accountId, 'profit_target_close')) {
      await this.fireAlert(accountId, 'profit_target_close', {
        severity: 'info',
        title: '🎯 Almost There! Profit target 90% reached',
        body: `You're at ${profitPct.toFixed(2)}% profit. Need ${(rules.profitTargetPct - profitPct).toFixed(2)}% more to pass!`
      });
    }
  }
}
```

---

## MULTI-TENANT MIDDLEWARE

```typescript
// NestJS guard that sets tenant context on every request
@Injectable()
export class TenantGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clerkUserId = request.auth.userId;
    const clerkOrgId = request.auth.orgId;

    // Resolve tenant from Clerk org
    const tenant = await this.tenantsService.findByClerkOrgId(clerkOrgId);
    if (!tenant) throw new ForbiddenException('Tenant not found');

    // Inject into request context
    request.tenant = tenant;
    request.currentUser = await this.usersService.findByClerkId(clerkUserId);

    // Set PostgreSQL session variable for RLS
    await this.db.query(`SET LOCAL app.current_tenant_id = '${tenant.id}'`);

    return true;
  }
}
```

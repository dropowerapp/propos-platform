# PropOS — Screen Wireframes & User Flows

## NAVIGATION STRUCTURE

```
Sidebar (collapsible)
├── 🏠  Overview          — Executive Dashboard
├── 📊  Analytics         — Performance Analytics
├── 📔  Journal           — Trading Journal
├── 📁  Trades            — Trade Log
├── 🏦  Accounts          — Prop Firm Accounts
├── 🎯  Challenges        — Challenge Tracker
├── 🏢  Firms             — Prop Firm Directory
├── 💰  Payouts           — ROI & Revenue
├── 🤖  AI Coach          — AI Performance Coach
├── 🔁  Backtesting       — Strategy Validation
├── 🔔  Alerts            — Alert Center
└── ⚙️  Settings          — User Preferences
```

---

## SCREEN 1 — EXECUTIVE DASHBOARD (`/overview`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PropOS                         🔔 3      [Avatar] John Doe   [Plan: Pro]│
├──────┬───────────────────────────────────────────────────────────────────┤
│      │                                                                    │
│  Nav │  Good morning, John. Here's your trading business overview.       │
│      │                                                                    │
│      │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│      │  │ Total Capital│ │ Total Payout │ │  Global ROI  │ │ Accounts ││
│      │  │ Invested     │ │ Received     │ │              │ │          ││
│      │  │              │ │              │ │              │ │          ││
│      │  │   $12,400    │ │   $84,200    │ │   579%  ▲   │ │  Active:6││
│      │  │ ─────────── │ │ ─────────── │ │             │ │  Funded:3││
│      │  │  ↑ $540 MTD  │ │  ↑ $6,500 MTD│ │   ↑ vs LM   │ │  Failed:2││
│      │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│
│      │                                                                    │
│      │  ┌──────────────────────────────────┐ ┌───────────────────────┐  │
│      │  │  Portfolio Equity Curve          │ │  Active Challenges    │  │
│      │  │                                  │ │                       │  │
│      │  │      $84k ▄▄▄▄▄▄▄▄▟▟▟▟▟        │ │  FTMO 100k  ████ 73% │  │
│      │  │      $60k ▄▄▄▄▄▟▟▟             │ │  Phase 2    On Track  │  │
│      │  │      $40k ▄▄▄▟▟▟               │ │                       │  │
│      │  │           Jan  Feb  Mar  Apr    │ │  FP 200k   ██░░░ 41% │  │
│      │  │                                  │ │  Phase 1    ⚠️ At Risk│  │
│      │  │  [1M] [3M] [6M] [1Y] [All]      │ │                       │  │
│      │  └──────────────────────────────────┘ │  E8 50k     ███ 60%  │  │
│      │                                        │  Phase 1    On Track  │  │
│      │  ┌─────────────────┐ ┌──────────────┐ └───────────────────────┘  │
│      │  │ ROI by Firm     │ │ Monthly P&L  │                            │
│      │  │                 │ │              │                            │
│      │  │ FundingPips 608%│ │ ██ ██    ██ │                            │
│      │  │ FTMO       421% │ │    ██ ██ ██ │                            │
│      │  │ The5ers    312% │ │ Jan Feb Mar  │                            │
│      │  │ E8 Markets 187% │ │              │                            │
│      │  └─────────────────┘ └──────────────┘                            │
│      │                                                                    │
│      │  ┌──────────────────────────────────────────────────────────────┐ │
│      │  │ ⚡ Recent Alerts                                              │ │
│      │  │ 🔴 FP 200k — Daily drawdown at 78% of limit    2 min ago    │ │
│      │  │ 🟡 FTMO — 1 more trading day needed            1h ago       │ │
│      │  │ 🟢 E8 Markets changed payout policy            3h ago       │ │
│      │  └──────────────────────────────────────────────────────────────┘ │
└──────┴───────────────────────────────────────────────────────────────────┘
```

---

## SCREEN 2 — ANALYTICS DASHBOARD (`/analytics`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Performance Analytics          [Account: FTMO 100k ▼]  [Jan 2024 ▼]   │
├──────┬───────────────────────────────────────────────────────────────────┤
│      │                                                                    │
│  Nav │  [Overview] [By Strategy] [By Session] [By Symbol] [Psychology]  │
│      │                                                                    │
│      │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌─────┐│
│      │  │WinRate │ │Prof.Fc.│ │Expect. │ │Sharpe  │ │Max DD  │ │Avg R││
│      │  │        │ │        │ │        │ │        │ │        │ │     ││
│      │  │ 63.4%  │ │  2.31  │ │ +$124  │ │  1.87  │ │ -4.2%  │ │1.34R││
│      │  │ ↑ 3.1% │ │ ↑ 0.2  │ │ ↑ $18  │ │ ↑ 0.12 │ │ ↓ 0.8% │ │     ││
│      │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └─────┘│
│      │                                                                    │
│      │  ┌──────────────────────────────┐ ┌────────────────────────────┐ │
│      │  │ Equity Curve                 │ │ PnL Distribution           │ │
│      │  │ [Cumulative] [Daily]         │ │                            │ │
│      │  │                              │ │    ▇                       │ │
│      │  │  $12k ───────────────▄▄▄▄  │ │  ▃ ▇ ▇ ▃                  │ │
│      │  │   $8k ──────────▄▄▄▄        │ │ ▁ ▃ ▇ ▇ ▇ ▃ ▁            │ │
│      │  │   $4k ──────▄▄▄             │ │         Loss  0  Win       │ │
│      │  │      0 ─────                │ │                            │ │
│      │  └──────────────────────────────┘ └────────────────────────────┘ │
│      │                                                                    │
│      │  ┌──────────────────────────────┐ ┌────────────────────────────┐ │
│      │  │ Performance Heatmap          │ │ By Session                 │ │
│      │  │ (Day of Week × Session)      │ │                            │ │
│      │  │          Mon Tue Wed Thu Fri │ │  London   Win: 68% $+8,400│ │
│      │  │  London   ▓   ░   ▓   ▓  ▓ │ │  NY       Win: 61% $+5,100│ │
│      │  │  New York  ▓   ▓   ░   ░  ░ │ │  Asian    Win: 41% $-820  │ │
│      │  │  Asian     ░   ░   ░   ░  ░ │ │  Overlap  Win: 71% $+3,200│ │
│      │  │  ▓=profit  ░=loss            │ │                            │ │
│      │  └──────────────────────────────┘ └────────────────────────────┘ │
│      │                                                                    │
│      │  ┌──────────────────────────────────────────────────────────────┐ │
│      │  │ Strategy Breakdown                                            │ │
│      │  │ Strategy         Trades WinRate  PnL    PF    Avg R          │ │
│      │  │ London Breakout    84   71.4%  +$9,200  3.1   1.8R   ████  │ │
│      │  │ Supply/Demand      52   58.1%  +$4,100  1.9   1.2R   ███   │ │
│      │  │ News Fade          31   51.6%  +$1,200  1.4   0.9R   ██    │ │
│      │  │ ICT Concepts       20   45.0%    -$800  0.9   0.7R   █     │ │
│      │  └──────────────────────────────────────────────────────────────┘ │
└──────┴───────────────────────────────────────────────────────────────────┘
```

---

## SCREEN 3 — TRADING JOURNAL (`/journal`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Trading Journal         [+ New Entry]  [Calendar View] [List View]     │
├──────┬───────────────────────────────────────────────────────────────────┤
│      │                                                                    │
│  Nav │  ┌──────────────────────────────────────────────────────────────┐ │
│      │  │ January 15, 2024                                              │ │
│      │  │                                                               │ │
│      │  │ Trade: EURUSD Long  +$480  1.8R              [Edit] [Delete] │ │
│      │  │                                                               │ │
│      │  │ 📸 [Chart screenshot] [Entry screenshot]                      │ │
│      │  │                                                               │ │
│      │  │ 📝 Notes                                                      │ │
│      │  │ "Waited patiently for the London open. Price broke the Asian  │ │
│      │  │ range high with a strong bullish candle. Entered on retest.  │ │
│      │  │ Managed the trade well, moved SL to breakeven at 1R."        │ │
│      │  │                                                               │ │
│      │  │ 🧠 Psychology                                                 │ │
│      │  │ Emotional State: 😊 Calm                                      │ │
│      │  │ Confidence: ████████░░ 8/10                                  │ │
│      │  │ Discipline: █████████░ 9/10                                   │ │
│      │  │ Stress:     ███░░░░░░░ 3/10                                   │ │
│      │  │                                                               │ │
│      │  │ 🏷️  Tags: #london-breakout  #asian-range  #patience          │ │
│      │  │ Strategy: London Breakout  |  Setup: Range Break              │ │
│      │  │ Followed Plan: ✅                                             │ │
│      │  └──────────────────────────────────────────────────────────────┘ │
│      │                                                                    │
│      │  ┌──────────────────────────────────────────────────────────────┐ │
│      │  │ January 14, 2024                                              │ │
│      │  │                                                               │ │
│      │  │ Daily Review — 3 trades  Net: -$120  Win: 1/3               │ │
│      │  │                                                               │ │
│      │  │ 📝 "Overtraded today. Revenge traded after first loss..."     │ │
│      │  │ Emotional State: 😤 Frustrated  Discipline: 4/10             │ │
│      │  └──────────────────────────────────────────────────────────────┘ │
│      │                                                                    │
│      │  Psychology Trend (30 days)                                        │
│      │  Confidence  ────────────────────╮                               │
│      │  Discipline  ──────────────────╮ │                               │
│      │  Stress      ─────────────────╯ ╰────                           │
│      │              Jan 1        Jan 15    Jan 30                        │
└──────┴───────────────────────────────────────────────────────────────────┘
```

---

## SCREEN 4 — CHALLENGE TRACKER (`/challenges`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Challenge Progress              [+ Add Account]   [View: Cards | Table] │
├──────┬───────────────────────────────────────────────────────────────────┤
│      │                                                                    │
│  Nav │  ┌─────────────────────────────────────────────────────────────┐  │
│      │  │  🟢 FTMO 100k — Phase 2             [Manage] [View Trades]  │  │
│      │  │  ─────────────────────────────────────────────────────────  │  │
│      │  │  Profit Target: 5%                                           │  │
│      │  │  ████████████████████████░░░░░░░  73%  ($3,650 / $5,000)   │  │
│      │  │                                                              │  │
│      │  │  Daily Drawdown: 5%                                          │  │
│      │  │  ████░░░░░░░░░░░░░░░░░░░░░░░░░  18%  ($180 / $1,000)       │  │
│      │  │  ✅ Within limits                                            │  │
│      │  │                                                              │  │
│      │  │  Max Drawdown: 10%                                           │  │
│      │  │  ██████░░░░░░░░░░░░░░░░░░░░░░░  28%  ($2,800 / $10,000)    │  │
│      │  │  ✅ Within limits                                            │  │
│      │  │                                                              │  │
│      │  │  Trading Days: 5 required                                    │  │
│      │  │  ████████████████████████████░  4/5 completed               │  │
│      │  │  🏁 1 more trading day needed!                               │  │
│      │  │                                                              │  │
│      │  │  Status: ✅ ON TRACK — Est. pass: Jan 17, 2024              │  │
│      │  │  Started: Jan 10  |  Day 6 of unlimited                      │  │
│      │  └─────────────────────────────────────────────────────────────┘  │
│      │                                                                    │
│      │  ┌─────────────────────────────────────────────────────────────┐  │
│      │  │  🔴 FundingPips 200k — Phase 1      [Manage] [View Trades]  │  │
│      │  │  ─────────────────────────────────────────────────────────  │  │
│      │  │  Profit Target: 8%                                           │  │
│      │  │  ████████░░░░░░░░░░░░░░░░░░░░░░  41%  ($3,280 / $8,000)    │  │
│      │  │                                                              │  │
│      │  │  Daily Drawdown: 4%                 ⚠️  AT RISK              │  │
│      │  │  ███████████████████████████░░░░  79%  ($6,320 / $8,000)    │  │
│      │  │  ⚠️  Close to daily limit — $1,680 buffer remaining         │  │
│      │  │                                                              │  │
│      │  │  Status: ⚠️ AT RISK — Reduce trading today                  │  │
│      │  └─────────────────────────────────────────────────────────────┘  │
└──────┴───────────────────────────────────────────────────────────────────┘
```

---

## SCREEN 5 — PROP FIRM DIRECTORY (`/firms`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Prop Firm Directory                        [Compare Firms]  [My Match] │
├──────┬───────────────────────────────────────────────────────────────────┤
│      │                                                                    │
│  Nav │  [Search firms...]   [Instruments ▼] [Platform ▼] [Sort by ▼]   │
│      │                                                                    │
│      │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│      │  │ FundingPips│  │   FTMO     │  │  The5ers   │  │FundedNext  │  │
│      │  │    [logo]  │  │  [logo]    │  │  [logo]    │  │  [logo]    │  │
│      │  │            │  │            │  │            │  │            │  │
│      │  │ Trust: 94  │  │ Trust: 91  │  │ Trust: 89  │  │ Trust: 86  │  │
│      │  │ ★★★★½ 4.6 │  │ ★★★★★ 4.8 │  │ ★★★★░ 4.3 │  │ ★★★★░ 4.1 │  │
│      │  │ 1,247 rev  │  │ 3,891 rev  │  │ 982 rev    │  │ 741 rev    │  │
│      │  │            │  │            │  │            │  │            │  │
│      │  │ From $49   │  │ From $155  │  │ From $95   │  │ From $59   │  │
│      │  │ Up to $200k│  │ Up to $200k│  │ Up to $100k│  │ Up to $300k│  │
│      │  │            │  │            │  │            │  │            │  │
│      │  │ [View] [+] │  │ [View] [+] │  │ [View] [+] │  │ [View] [+] │  │
│      │  └────────────┘  └────────────┘  └────────────┘  └────────────┘  │
│      │                                                                    │
│      │  ┌──────────────────────────────────────────────────────────────┐ │
│      │  │ 🤖 My Firm Match  (based on your trading profile)            │ │
│      │  │                                                              │ │
│      │  │ Based on: Win Rate 63% | Avg DD 2.1% | Holds 4h avg         │ │
│      │  │                                                              │ │
│      │  │ #1  FundingPips   ████████████████████  94%  [View Details] │ │
│      │  │ #2  FTMO          ████████████████████  90%  [View Details] │ │
│      │  │ #3  The5ers       ████████████████░░░░  85%  [View Details] │ │
│      │  └──────────────────────────────────────────────────────────────┘ │
└──────┴───────────────────────────────────────────────────────────────────┘
```

---

## SCREEN 6 — AI COACH (`/ai-coach`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  AI Performance Coach                    [New Chat]  [History]          │
├──────┬───────────────────────────────────────────────────────────────────┤
│      │  ┌─────────────────────────────────────────────┐                  │
│      │  │ Suggested Questions                          │                  │
│      │  │ [Why am I losing on Fridays?]                │                  │
│      │  │ [Best setup this month?]                     │                  │
│      │  │ [Which firm fits my style?]                  │                  │
│      │  │ [Review my last 30 days]                     │                  │
│      │  └─────────────────────────────────────────────┘                  │
│      │                                                                    │
│      │  ╔══════════════════════════════════════════════════════════════╗  │
│      │  ║  🤖 PropOS AI Coach                                         ║  │
│      │  ║                                                              ║  │
│      │  ║  Hello John! I've analyzed your last 187 trades. Here's     ║  │
│      │  ║  what I found:                                               ║  │
│      │  ║                                                              ║  │
│      │  ║  **Your Key Insight:** You're profitable on Monday-          ║  │
│      │  ║  Wednesday (Win Rate: 71%) but consistently lose on          ║  │
│      │  ║  Thursday-Friday (Win Rate: 42%).                            ║  │
│      │  ║                                                              ║  │
│      │  ║  **Root cause:** Your Thursday/Friday losses correlate       ║  │
│      │  ║  with your journal entries showing "FOMO" and "impatient"   ║  │
│      │  ║  tags. You also tend to increase position size after 2+      ║  │
│      │  ║  winning days — classic overconfidence pattern.              ║  │
│      │  ║                                                              ║  │
│      │  ║  **Recommendation:** Consider a Thursday/Friday trading      ║  │
│      │  ║  rule: maximum 1 trade per session, size 50% of normal.     ║  │
│      │  ║  Estimated improvement: +$2,100/month based on your data.   ║  │
│      │  ╚══════════════════════════════════════════════════════════════╝  │
│      │                                                                    │
│      │  ┌───────────────────────────────────────────────────────────┐    │
│      │  │ 👤 Why do I lose money after winning streaks?              │    │
│      │  └───────────────────────────────────────────────────────────┘    │
│      │                                                                    │
│      │  [Message AI Coach...]                            [Send ▶]       │
└──────┴───────────────────────────────────────────────────────────────────┘
```

---

## SCREEN 7 — ROI & PAYOUTS (`/payouts`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Payout & ROI Tracker                    [+ Record Payout]              │
├──────┬───────────────────────────────────────────────────────────────────┤
│      │                                                                    │
│  Nav │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│      │  │ Total Invested│ │ Total Earned │ │  Net Profit  │ │ ROI      ││
│      │  │   $12,400    │ │   $84,200    │ │   $71,800    │ │  579%    ││
│      │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│
│      │                                                                    │
│      │  ┌──────────────────────────────────────────────────────────────┐ │
│      │  │ ROI by Prop Firm                                              │ │
│      │  │                                                               │ │
│      │  │  Firm          Invested  Earned    Net      ROI              │ │
│      │  │  ─────────────────────────────────────────────────────────  │ │
│      │  │  FundingPips   $1,200    $8,500    $7,300   608%  ████████  │ │
│      │  │  FTMO          $4,200    $38,000   $33,800  805%  █████████ │ │
│      │  │  The5ers       $3,800    $22,000   $18,200  479%  ██████    │ │
│      │  │  E8 Markets    $1,800    $9,200    $7,400   411%  ██████    │ │
│      │  │  Alpha Capital $1,400    $6,500    $5,100   364%  █████     │ │
│      │  └──────────────────────────────────────────────────────────────┘ │
│      │                                                                    │
│      │  ┌──────────────────────────────────────────────────────────────┐ │
│      │  │ Payout History                              [Export CSV]     │ │
│      │  │                                                              │ │
│      │  │  Date        Firm        Account     Amount  Status  Days   │ │
│      │  │  Feb 15      FTMO        100k Funded  $4,200  ✅ Paid   2   │ │
│      │  │  Feb 10      FundingPips 200k Funded  $2,800  ✅ Paid   1   │ │
│      │  │  Jan 28      The5ers     50k Funded   $1,400  ✅ Paid   5   │ │
│      │  │  Jan 15      E8 Markets  100k Funded  $3,100  ⏳ Pending -  │ │
│      │  └──────────────────────────────────────────────────────────────┘ │
└──────┴───────────────────────────────────────────────────────────────────┘
```

---

## USER FLOW — ONBOARDING

```
Sign Up (Clerk)
      │
      ▼
Welcome Screen
"Let's set up your trading command center"
      │
      ▼
Step 1: Add Trading Account
  - Select broker (MT4/MT5/cTrader/etc.)
  - Import existing statements OR connect API
      │
      ▼
Step 2: Add Prop Firm Account (optional)
  - Select prop firm
  - Select challenge type & size
  - Enter challenge cost
      │
      ▼
Step 3: Set Alert Preferences
  - Drawdown alerts (default: 70%, 90%)
  - Email / Push notifications
      │
      ▼
Step 4: Let AI Analyze
  - Shows "Analyzing your 187 trades..."
  - Displays first AI insight summary
      │
      ▼
Dashboard (complete)
```

---

## USER FLOW — TRADE IMPORT

```
Click "Import Trades"
      │
      ▼
Select broker type
  [MT4] [MT5] [cTrader] [DXTrade] [Manual CSV]
      │
      ▼
Choose method:
  [Upload File] [Connect API] [Paste CSV]
      │
      ▼
File upload / API credentials
      │
      ▼
Preview import (first 5 rows shown)
Match columns → field mapping (if CSV)
      │
      ▼
"Import 412 trades?" [Cancel] [Confirm]
      │
      ▼
Progress bar: "Processing... 187/412"
WebSocket live updates
      │
      ▼
Import complete:
  ✅ 408 imported
  ⚠️  3 duplicates skipped
  ❌  1 error (show details)
      │
      ▼
Auto-redirect to Analytics with new data
```

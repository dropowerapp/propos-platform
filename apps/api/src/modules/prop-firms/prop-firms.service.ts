import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateReviewDto {
  overallRating: number;
  payoutSpeed?: number;
  customerSupport?: number;
  executionQuality?: number;
  slippage?: number;
  transparency?: number;
  dashboardUx?: number;
  reviewTitle?: string;
  reviewBody?: string;
}

@Injectable()
export class PropFirmsService {
  constructor(private prisma: PrismaService) {}

  async list(query: { search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const skip = (page - 1) * limit;

    const where = query.search
      ? { name: { contains: query.search, mode: 'insensitive' as const }, isActive: true }
      : { isActive: true };

    const [firms, total] = await Promise.all([
      this.prisma.propFirm.findMany({
        where, skip, take: limit,
        orderBy: { trustScore: 'desc' },
        include: {
          challengeTypes: {
            where: { isActive: true },
            include: { accountSizes: { where: { isActive: true }, orderBy: { accountSize: 'asc' } } },
          },
        },
      }),
      this.prisma.propFirm.count({ where }),
    ]);

    return { data: firms, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findBySlug(slug: string) {
    const firm = await this.prisma.propFirm.findUnique({
      where: { slug },
      include: {
        challengeTypes: {
          where: { isActive: true },
          include: {
            accountSizes: { where: { isActive: true }, orderBy: { accountSize: 'asc' } },
            rules: { where: { isCurrent: true }, orderBy: { phase: 'asc' } },
          },
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!firm) throw new NotFoundException('Prop firm not found');
    return { data: firm };
  }

  async getRuleHistory(slug: string) {
    const firm = await this.prisma.propFirm.findUnique({ where: { slug } });
    if (!firm) throw new NotFoundException('Prop firm not found');

    const history = await this.prisma.propFirmRule.findMany({
      where: { propFirmId: firm.id },
      orderBy: { effectiveFrom: 'desc' },
      take: 50,
    });

    return { data: history };
  }

  // ─── Reviews ───────────────────────────────────────────────────────────────

  async listReviews(slug: string) {
    const firm = await this.prisma.propFirm.findUnique({ where: { slug } });
    if (!firm) throw new NotFoundException('Prop firm not found');

    const reviews = await this.prisma.propFirmReview.findMany({
      where: { propFirmId: firm.id, isApproved: true },
      include: { user: { select: { fullName: true } } },
      orderBy: [{ verifiedTrader: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    const agg = this.aggregateReviews(reviews);
    return { data: reviews, meta: agg };
  }

  private aggregateReviews(reviews: any[]) {
    const n = reviews.length;
    if (n === 0) {
      return { count: 0, verifiedCount: 0, overall: 0, criteria: {} };
    }
    const avg = (key: string) => {
      const vals = reviews.map(r => r[key]).filter((v) => v != null);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    };
    return {
      count: n,
      verifiedCount: reviews.filter(r => r.verifiedTrader).length,
      overall: Number(avg('overallRating').toFixed(2)),
      criteria: {
        payoutSpeed: Number(avg('payoutSpeed').toFixed(2)),
        customerSupport: Number(avg('customerSupport').toFixed(2)),
        executionQuality: Number(avg('executionQuality').toFixed(2)),
        slippage: Number(avg('slippage').toFixed(2)),
        transparency: Number(avg('transparency').toFixed(2)),
        dashboardUx: Number(avg('dashboardUx').toFixed(2)),
      },
    };
  }

  /** Firms the user owns an account with — eligible for a *verified* review. */
  async getReviewEligibility(userId: string, tenantId: string) {
    const accounts = await this.prisma.propFirmAccount.findMany({
      where: { userId, tenantId },
      select: { propFirmId: true, propFirm: { select: { name: true, slug: true } } },
      distinct: ['propFirmId'],
    });
    return { data: accounts.map(a => ({ propFirmId: a.propFirmId, name: a.propFirm.name, slug: a.propFirm.slug })) };
  }

  async createReview(userId: string, tenantId: string, slug: string, dto: CreateReviewDto) {
    const firm = await this.prisma.propFirm.findUnique({ where: { slug } });
    if (!firm) throw new NotFoundException('Prop firm not found');

    // Verified = the reviewer actually owns (or owned) an account with this firm.
    // This is the trust signal a scraped review can never carry.
    const ownedAccount = await this.prisma.propFirmAccount.findFirst({
      where: { userId, tenantId, propFirmId: firm.id },
      orderBy: { createdAt: 'desc' },
      select: { accountSize: true },
    });
    const verified = !!ownedAccount;

    const data = {
      payoutSpeed: dto.payoutSpeed,
      customerSupport: dto.customerSupport,
      executionQuality: dto.executionQuality,
      slippage: dto.slippage,
      transparency: dto.transparency,
      dashboardUx: dto.dashboardUx,
      overallRating: dto.overallRating,
      reviewTitle: dto.reviewTitle,
      reviewBody: dto.reviewBody,
      accountSizeTraded: ownedAccount ? Number(ownedAccount.accountSize) : undefined,
      verifiedTrader: verified,
      // Verified reviews publish immediately; unverified wait for moderation.
      isApproved: verified,
    };

    const review = await this.prisma.propFirmReview.upsert({
      where: { propFirmId_userId: { propFirmId: firm.id, userId } },
      update: data,
      create: { ...data, propFirmId: firm.id, userId },
    });

    // Refresh the firm's denormalised community rating + count
    await this.refreshFirmRating(firm.id);

    return { data: review, verified };
  }

  private async refreshFirmRating(propFirmId: string) {
    const reviews = await this.prisma.propFirmReview.findMany({
      where: { propFirmId, isApproved: true },
      select: { overallRating: true },
    });
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + r.overallRating, 0) / count : 0;
    await this.prisma.propFirm.update({
      where: { id: propFirmId },
      data: { communityRating: avg, reviewCount: count },
    });
  }

  async getRecommendations(userId: string, tenantId: string) {
    // Compute trader profile from trade history
    const trades = await this.prisma.trade.findMany({
      where: { userId, tenantId, status: 'closed' },
      select: { netPnl: true, outcome: true, durationSeconds: true, session: true },
    });

    if (trades.length < 5) return { data: [], message: 'Need at least 5 trades for recommendations' };

    const wins = trades.filter(t => t.outcome === 'win').length;
    const winRate = wins / trades.length;
    const avgDuration = trades.reduce((s, t) => s + (t.durationSeconds ?? 0), 0) / trades.length;
    const isScalper = avgDuration < 300; // avg < 5 min
    const tradeFreqPerWeek = Math.min(trades.length / 4, 100); // rough estimate over last month

    const firms = await this.prisma.propFirm.findMany({
      where: { isActive: true },
      include: {
        challengeTypes: {
          where: { isActive: true },
          include: { rules: { where: { isCurrent: true, phase: 1 } } },
        },
      },
    });

    const scored = firms.map(firm => {
      let score = 100;
      const rules = firm.challengeTypes.flatMap(ct => ct.rules)[0];
      if (!rules) return { firm, score: 50, reasons: [], concerns: [] };

      const reasons: string[] = [];
      const concerns: string[] = [];

      // Drawdown compatibility
      const ddBuffer = Number(rules.dailyDrawdownPct ?? 5) - 2;
      if (ddBuffer >= 3) { score += 5; reasons.push(`Generous daily DD limit (${rules.dailyDrawdownPct}%)`); }
      else if (ddBuffer < 1) { score -= 20; concerns.push('Tight daily drawdown may be challenging'); }

      // Scalping restriction
      if (isScalper && rules.minTradeDurationSeconds && rules.minTradeDurationSeconds > 60) {
        score -= 25; concerns.push('Scalping restriction conflicts with your trading style');
      }

      // Win rate alignment
      if (winRate >= 0.6) { score += 10; reasons.push(`Your ${(winRate * 100).toFixed(0)}% win rate handles consistency rules well`); }

      // Profit split
      if (Number(rules.profitSplitPct ?? 80) >= 90) { score += 10; reasons.push(`High profit split: ${rules.profitSplitPct}%`); }

      // Payout frequency
      if (rules.payoutFrequency === 'On Demand') { score += 5; reasons.push('On-demand payouts for flexibility'); }

      return { firm: { id: firm.id, name: firm.name, slug: firm.slug, logoUrl: firm.logoUrl, trustScore: firm.trustScore }, score: Math.max(0, Math.min(100, score)), reasons, concerns };
    });

    return {
      data: scored.sort((a, b) => b.score - a.score).slice(0, 5),
      profile: { winRate, avgDurationSeconds: Math.round(avgDuration), isScalper, tradeFreqPerWeek: Math.round(tradeFreqPerWeek), totalTrades: trades.length },
    };
  }
}

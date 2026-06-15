import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateAccountDto {
  propFirmId?: string;
  firmName?: string;       // alternative to propFirmId — resolved (or created) by name
  challengeTypeId?: string;
  accountSize: number;
  accountName?: string;
  accountNumber?: string;
  challengeCost?: number;
  activationFee?: number;
  purchasedAt?: string;
  phase?: number;
  status?: string;         // active (default) | funded — used by onboarding
  color?: string;
}

export interface ResetAccountDto {
  resetFee: number;
  resetDate?: string;
}

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, userId: string, status?: string) {
    const accounts = await this.prisma.propFirmAccount.findMany({
      where: { tenantId, userId, ...(status && status !== 'all' ? { status } : {}) },
      include: {
        propFirm: { select: { id: true, name: true, slug: true, logoUrl: true } },
        challengeType: { select: { id: true, name: true } },
        rulesSnapshot: {
          select: {
            profitTargetPct: true, dailyDrawdownPct: true, maxDrawdownPct: true,
            minTradingDays: true, profitSplitPct: true, payoutFrequency: true,
            newsTradingAllowed: true, consistencyRule: true,
          },
        },
        payouts: { where: { status: 'paid' }, select: { amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute total cost and ROI per account
    const enriched = accounts.map(a => {
      const totalCost = Number(a.challengeCost ?? 0) + Number(a.activationFee) + Number(a.totalResetFees) + Number(a.addonCosts);
      const totalPayouts = a.payouts.reduce((s, p) => s + Number(p.amount), 0);
      const roi = totalCost > 0 ? ((totalPayouts - totalCost) / totalCost) * 100 : 0;
      return { ...a, totalCost, totalPayouts, roiPct: parseFloat(roi.toFixed(2)) };
    });

    return { data: enriched };
  }

  async findOne(id: string, tenantId: string) {
    const account = await this.prisma.propFirmAccount.findFirst({
      where: { id, tenantId },
      include: {
        propFirm: true,
        challengeType: { include: { accountSizes: true } },
        rulesSnapshot: true,
        dailySnapshots: { orderBy: { snapshotDate: 'desc' }, take: 30 },
        payouts: { orderBy: { payoutDate: 'desc' } },
        tradingAccounts: { select: { id: true, name: true, currency: true } },
      },
    });
    if (!account) throw new NotFoundException('Account not found');

    // Build challenge progress
    const rules = account.rulesSnapshot;
    const progress = rules ? {
      profitTargetPct: Number(rules.profitTargetPct ?? 0),
      currentProfitPct: account.accountSize > 0
        ? parseFloat((Number(account.totalPnl ?? 0) / account.accountSize * 100).toFixed(2))
        : 0,
      dailyDrawdownAllowed: Number(rules.dailyDrawdownPct ?? 0),
      dailyDrawdownUsed: parseFloat((Math.abs(Number(account.dailyPnl ?? 0)) / account.accountSize * 100).toFixed(2)),
      maxDrawdownAllowed: Number(rules.maxDrawdownPct ?? 0),
      maxDrawdownUsed: parseFloat((Number(account.currentDrawdownPct ?? 0)).toFixed(2)),
      minTradingDays: rules.minTradingDays ?? 0,
      tradingDaysCompleted: account.tradingDaysCount,
    } : null;

    return { data: { ...account, progress } };
  }

  async create(tenantId: string, userId: string, dto: CreateAccountDto) {
    // Resolve firm by id or by name (find-or-create for onboarding flexibility)
    let propFirmId = dto.propFirmId;
    if (!propFirmId && dto.firmName) {
      const slug = dto.firmName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const firm = await this.prisma.propFirm.upsert({
        where: { slug },
        update: {},
        create: { name: dto.firmName, slug },
      });
      propFirmId = firm.id;
    }
    if (!propFirmId) throw new NotFoundException('propFirmId or firmName is required');

    // Snapshot current rules
    const rules = dto.challengeTypeId
      ? await this.prisma.propFirmRule.findFirst({
          where: { challengeTypeId: dto.challengeTypeId, isCurrent: true, phase: dto.phase ?? 1 },
          orderBy: { effectiveFrom: 'desc' },
        })
      : null;

    const account = await this.prisma.propFirmAccount.create({
      data: {
        tenantId, userId,
        propFirmId,
        status: dto.status === 'funded' ? 'funded' : 'active',
        fundedAt: dto.status === 'funded' ? new Date() : undefined,
        challengeTypeId: dto.challengeTypeId,
        rulesSnapshotId: rules?.id,
        accountSize: dto.accountSize,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        challengeCost: dto.challengeCost,
        activationFee: dto.activationFee ?? 0,
        currentPhase: dto.phase ?? 1,
        purchasedAt: dto.purchasedAt ? new Date(dto.purchasedAt) : new Date(),
        phaseStartedAt: new Date(),
        color: dto.color,
        currentBalance: dto.accountSize,
        peakBalance: dto.accountSize,
      },
    });

    return { data: account };
  }

  async update(id: string, tenantId: string, dto: Partial<CreateAccountDto & {
    status: string; passedAt: string; failedAt: string; fundedAt: string;
    addonCosts: number; activationFee: number;
  }>) {
    const account = await this.prisma.propFirmAccount.findFirst({ where: { id, tenantId } });
    if (!account) throw new NotFoundException('Account not found');

    const updated = await this.prisma.propFirmAccount.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.accountName !== undefined && { accountName: dto.accountName }),
        ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber }),
        ...(dto.phase !== undefined && { currentPhase: dto.phase }),
        ...(dto.challengeCost !== undefined && { challengeCost: dto.challengeCost }),
        ...(dto.activationFee !== undefined && { activationFee: dto.activationFee }),
        ...(dto.addonCosts !== undefined && { addonCosts: dto.addonCosts }),
        ...(dto.passedAt && { passedAt: new Date(dto.passedAt), status: 'passed' }),
        ...(dto.failedAt && { failedAt: new Date(dto.failedAt), status: 'failed' }),
        ...(dto.fundedAt && { fundedAt: new Date(dto.fundedAt), status: 'funded' }),
        ...(dto.color && { color: dto.color }),
      },
    });

    return { data: updated };
  }

  async reset(id: string, tenantId: string, dto: ResetAccountDto) {
    const account = await this.prisma.propFirmAccount.findFirst({ where: { id, tenantId } });
    if (!account) throw new NotFoundException('Account not found');

    const updated = await this.prisma.propFirmAccount.update({
      where: { id },
      data: {
        resetCount: { increment: 1 },
        totalResetFees: { increment: dto.resetFee },
        status: 'active',
        currentPhase: 1,
        totalPnl: 0,
        dailyPnl: 0,
        currentDrawdownPct: 0,
        tradingDaysCount: 0,
        phaseStartedAt: dto.resetDate ? new Date(dto.resetDate) : new Date(),
      },
    });

    return { data: updated };
  }

  async getPortfolioSummary(tenantId: string, userId: string) {
    const [accounts, payouts] = await Promise.all([
      this.prisma.propFirmAccount.findMany({ where: { tenantId, userId } }),
      this.prisma.payout.findMany({ where: { tenantId, userId, status: 'paid' } }),
    ]);

    const totalInvested = accounts.reduce((s, a) =>
      s + Number(a.challengeCost ?? 0) + Number(a.activationFee) + Number(a.totalResetFees) + Number(a.addonCosts), 0);
    const totalPayouts = payouts.reduce((s, p) => s + Number(p.amount), 0);
    const netProfit = totalPayouts - totalInvested;
    const globalRoi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

    const byStatus = accounts.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      data: {
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        totalPayouts: parseFloat(totalPayouts.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        globalRoiPct: parseFloat(globalRoi.toFixed(2)),
        byStatus,
        totalAccounts: accounts.length,
        totalFundedCapital: accounts.filter(a => a.status === 'funded').reduce((s, a) => s + a.accountSize, 0),
      },
    };
  }
}

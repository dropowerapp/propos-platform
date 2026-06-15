import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreatePayoutDto {
  propFirmAccountId: string;
  propFirmId: string;
  amount: number;
  currency?: string;
  payoutDate: string;
  profitSplitPct?: number;
  grossProfit?: number;
  status?: string;
  paymentMethod?: string;
  transactionRef?: string;
  notes?: string;
  processingDays?: number;
}

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, userId: string, query: {
    propFirmId?: string; accountId?: string; status?: string;
    dateFrom?: string; dateTo?: string; page?: number; limit?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(200, query.limit ?? 50);

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where: {
          tenantId, userId,
          ...(query.propFirmId && { propFirmId: query.propFirmId }),
          ...(query.accountId && { propFirmAccountId: query.accountId }),
          ...(query.status && { status: query.status }),
          ...(query.dateFrom || query.dateTo ? {
            payoutDate: {
              ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
              ...(query.dateTo && { lte: new Date(query.dateTo) }),
            },
          } : {}),
        },
        orderBy: { payoutDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          propFirm: { select: { id: true, name: true, slug: true } },
          propFirmAccount: { select: { id: true, accountName: true, accountSize: true } },
        },
      }),
      this.prisma.payout.count({ where: { tenantId, userId } }),
    ]);

    return { data: payouts, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getRoiSummary(tenantId: string, userId: string) {
    const [accounts, payouts] = await Promise.all([
      this.prisma.propFirmAccount.findMany({
        where: { tenantId, userId },
        include: { propFirm: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.payout.findMany({
        where: { tenantId, userId, status: 'paid' },
        include: { propFirm: { select: { id: true, name: true } } },
      }),
    ]);

    const totalInvested = accounts.reduce((s, a) =>
      s + Number(a.challengeCost ?? 0) + Number(a.activationFee) + Number(a.totalResetFees) + Number(a.addonCosts), 0);
    const totalPayouts = payouts.reduce((s, p) => s + Number(p.amount), 0);
    const netProfit = totalPayouts - totalInvested;
    const globalRoiPct = totalInvested > 0 ? ((netProfit / totalInvested) * 100) : 0;

    // ROI by firm
    const firmMap: Record<string, { name: string; invested: number; earned: number }> = {};
    for (const a of accounts) {
      const fid = a.propFirmId;
      if (!firmMap[fid]) firmMap[fid] = { name: a.propFirm.name, invested: 0, earned: 0 };
      firmMap[fid].invested += Number(a.challengeCost ?? 0) + Number(a.activationFee) + Number(a.totalResetFees);
    }
    for (const p of payouts) {
      if (firmMap[p.propFirmId]) firmMap[p.propFirmId].earned += Number(p.amount);
    }

    const byFirm = Object.entries(firmMap).map(([id, f]) => ({
      propFirmId: id,
      firmName: f.name,
      totalCosts: parseFloat(f.invested.toFixed(2)),
      totalPayouts: parseFloat(f.earned.toFixed(2)),
      netProfit: parseFloat((f.earned - f.invested).toFixed(2)),
      roiPct: f.invested > 0 ? parseFloat(((f.earned - f.invested) / f.invested * 100).toFixed(2)) : 0,
    })).sort((a, b) => b.roiPct - a.roiPct);

    // Monthly breakdown (last 12 months)
    const monthly: Record<string, number> = {};
    for (const p of payouts) {
      const key = p.payoutDate.toISOString().slice(0, 7);
      monthly[key] = (monthly[key] ?? 0) + Number(p.amount);
    }

    return {
      data: {
        globalRoiPct: parseFloat(globalRoiPct.toFixed(2)),
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        totalPayouts: parseFloat(totalPayouts.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        byFirm,
        monthlyRevenue: Object.entries(monthly)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, amount]) => ({ month, amount: parseFloat(amount.toFixed(2)) })),
      },
    };
  }

  async create(tenantId: string, userId: string, dto: CreatePayoutDto) {
    const payout = await this.prisma.payout.create({
      data: {
        tenantId, userId,
        propFirmAccountId: dto.propFirmAccountId,
        propFirmId: dto.propFirmId,
        amount: dto.amount,
        currency: dto.currency ?? 'USD',
        payoutDate: new Date(dto.payoutDate),
        profitSplitPct: dto.profitSplitPct,
        grossProfit: dto.grossProfit,
        status: dto.status ?? 'pending',
        paymentMethod: dto.paymentMethod,
        transactionRef: dto.transactionRef,
        notes: dto.notes,
        processingDays: dto.processingDays,
      },
    });
    return { data: payout };
  }

  async updateStatus(id: string, tenantId: string, status: string) {
    const payout = await this.prisma.payout.findFirst({ where: { id, tenantId } });
    if (!payout) throw new NotFoundException('Payout not found');
    const updated = await this.prisma.payout.update({ where: { id }, data: { status } });
    return { data: updated };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';

export interface ListTradesQuery {
  accountId?: string;
  symbol?: string;
  direction?: string;
  outcome?: string;
  session?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface CreateTradeDto {
  tradingAccountId: string;
  symbol: string;
  direction: 'long' | 'short';
  openTime: string;
  closeTime?: string;
  openPrice: number;
  closePrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  lots: number;
  commission?: number;
  swap?: number;
  grossPnl?: number;
  notes?: string;
}

@Injectable()
export class TradesService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, userId: string, query: ListTradesQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(500, query.limit ?? 50);
    const skip = (page - 1) * limit;

    const where: Prisma.TradeWhereInput = {
      tenantId,
      userId,
      ...(query.accountId && { tradingAccountId: query.accountId }),
      ...(query.symbol && { symbol: query.symbol.toUpperCase() }),
      ...(query.direction && { direction: query.direction }),
      ...(query.outcome && { outcome: query.outcome }),
      ...(query.session && { session: query.session }),
      ...(query.dateFrom || query.dateTo
        ? {
            openTime: {
              ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
              ...(query.dateTo && { lte: new Date(query.dateTo) }),
            },
          }
        : {}),
    };

    const orderBy: Prisma.TradeOrderByWithRelationInput = {
      [(query.sort as string) === 'net_pnl'
        ? 'netPnl'
        : query.sort === 'r_multiple'
          ? 'rMultiple'
          : 'openTime']: query.order ?? 'desc',
    };

    const [trades, total] = await Promise.all([
      this.prisma.trade.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          journalEntry: { select: { id: true, notes: true, emotionalState: true } },
          tradeTags: { include: { tag: true } },
          tradeStrategies: { include: { strategy: { select: { id: true, name: true, color: true } } } },
        },
      }),
      this.prisma.trade.count({ where }),
    ]);

    return {
      data: trades,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const trade = await this.prisma.trade.findFirst({
      where: { id, tenantId },
      include: {
        journalEntry: { include: { screenshots: true, journalTags: { include: { tag: true } } } },
        tradeTags: { include: { tag: true } },
        tradeStrategies: { include: { strategy: true } },
        executions: { orderBy: { executedAt: 'asc' } },
        tradingAccount: { select: { id: true, name: true, currency: true } },
      },
    });

    if (!trade) throw new NotFoundException('Trade not found');
    return { data: trade };
  }

  async create(tenantId: string, userId: string, dto: CreateTradeDto) {
    const netPnl =
      dto.grossPnl != null
        ? dto.grossPnl - Math.abs(dto.commission ?? 0) - Math.abs(dto.swap ?? 0)
        : undefined;

    const outcome = netPnl != null ? (netPnl > 0 ? 'win' : netPnl < 0 ? 'loss' : 'breakeven') : undefined;

    const openTime = new Date(dto.openTime);
    const closeTime = dto.closeTime ? new Date(dto.closeTime) : undefined;
    const durationSeconds = closeTime
      ? Math.round((closeTime.getTime() - openTime.getTime()) / 1000)
      : undefined;

    const session = this.classifySession(openTime);

    const importHash = createHash('sha256')
      .update(`manual:${userId}:${dto.symbol}:${dto.openTime}:${dto.lots}`)
      .digest('hex');

    const trade = await this.prisma.trade.create({
      data: {
        tenantId,
        userId,
        tradingAccountId: dto.tradingAccountId,
        symbol: dto.symbol.toUpperCase(),
        direction: dto.direction,
        openTime,
        closeTime,
        openPrice: dto.openPrice,
        closePrice: dto.closePrice,
        stopLoss: dto.stopLoss,
        takeProfit: dto.takeProfit,
        lots: dto.lots,
        commission: dto.commission ?? 0,
        swap: dto.swap ?? 0,
        grossPnl: dto.grossPnl,
        netPnl,
        outcome,
        durationSeconds,
        session,
        dayOfWeek: openTime.getDay(),
        month: openTime.getMonth() + 1,
        year: openTime.getFullYear(),
        isManual: true,
        importHash,
        status: closeTime ? 'closed' : 'open',
        rMultiple: this.calculateRMultiple(dto),
      },
    });

    return { data: trade };
  }

  async update(id: string, tenantId: string, updates: Partial<CreateTradeDto>) {
    const trade = await this.prisma.trade.findFirst({ where: { id, tenantId } });
    if (!trade) throw new NotFoundException('Trade not found');

    const updated = await this.prisma.trade.update({
      where: { id },
      data: {
        ...(updates.stopLoss !== undefined && { stopLoss: updates.stopLoss }),
        ...(updates.takeProfit !== undefined && { takeProfit: updates.takeProfit }),
        ...(updates.closePrice !== undefined && { closePrice: updates.closePrice }),
        ...(updates.commission !== undefined && { commission: updates.commission }),
      },
    });

    return { data: updated };
  }

  async remove(id: string, tenantId: string) {
    const trade = await this.prisma.trade.findFirst({ where: { id, tenantId } });
    if (!trade) throw new NotFoundException('Trade not found');
    await this.prisma.trade.delete({ where: { id } });
    return { data: { deleted: true } };
  }

  private classifySession(openTime: Date): string {
    const hour = openTime.getUTCHours();
    if (hour >= 8 && hour < 16) return 'london';
    if (hour >= 13 && hour < 22) return 'new_york';
    if (hour >= 0 && hour < 8) return 'asian';
    return 'sydney';
  }

  private calculateRMultiple(dto: CreateTradeDto): number | undefined {
    if (!dto.stopLoss || !dto.grossPnl) return undefined;
    const risk = Math.abs(dto.openPrice - dto.stopLoss) * dto.lots * 100000;
    if (risk === 0) return undefined;
    return parseFloat((dto.grossPnl / risk).toFixed(2));
  }
}

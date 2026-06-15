import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateJournalDto {
  tradeId?: string;
  tradingAccountId?: string;
  strategyId?: string;
  entryDate: string;
  entryType?: string;
  notes?: string;
  tradingPlan?: string;
  mistakes?: string;
  lessons?: string;
  marketAnalysis?: string;
  emotionalState?: string;
  confidenceLevel?: number;
  stressLevel?: number;
  disciplineScore?: number;
  energyLevel?: number;
  focusScore?: number;
  setupType?: string;
  marketCondition?: string;
  followedPlan?: boolean;
  tagIds?: string[];
}

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, userId: string, query: {
    accountId?: string; entryType?: string; emotionalState?: string;
    dateFrom?: string; dateTo?: string; page?: number; limit?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: Prisma.JournalEntryWhereInput = {
      tenantId, userId,
      ...(query.accountId && { tradingAccountId: query.accountId }),
      ...(query.entryType && { entryType: query.entryType }),
      ...(query.emotionalState && { emotionalState: query.emotionalState }),
      ...(query.dateFrom || query.dateTo ? {
        entryDate: {
          ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
          ...(query.dateTo && { lte: new Date(query.dateTo) }),
        },
      } : {}),
    };

    const [entries, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where, skip, take: limit,
        orderBy: { entryDate: 'desc' },
        include: {
          screenshots: { orderBy: { sortOrder: 'asc' } },
          journalTags: { include: { tag: true } },
          strategy: { select: { id: true, name: true, color: true } },
          trade: { select: { id: true, symbol: true, direction: true, netPnl: true, rMultiple: true, openTime: true } },
        },
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return { data: entries, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, tenantId: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, tenantId },
      include: {
        screenshots: { orderBy: { sortOrder: 'asc' } },
        journalTags: { include: { tag: true } },
        strategy: true,
        trade: true,
      },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return { data: entry };
  }

  async create(tenantId: string, userId: string, dto: CreateJournalDto) {
    const wordCount = [dto.notes, dto.tradingPlan, dto.mistakes, dto.lessons]
      .filter(Boolean).join(' ').split(/\s+/).length;

    const entry = await this.prisma.journalEntry.create({
      data: {
        tenantId, userId,
        tradeId: dto.tradeId,
        tradingAccountId: dto.tradingAccountId,
        strategyId: dto.strategyId,
        entryDate: new Date(dto.entryDate),
        entryType: dto.entryType ?? 'trade',
        notes: dto.notes,
        tradingPlan: dto.tradingPlan,
        mistakes: dto.mistakes,
        lessons: dto.lessons,
        marketAnalysis: dto.marketAnalysis,
        emotionalState: dto.emotionalState,
        confidenceLevel: dto.confidenceLevel,
        stressLevel: dto.stressLevel,
        disciplineScore: dto.disciplineScore,
        energyLevel: dto.energyLevel,
        focusScore: dto.focusScore,
        setupType: dto.setupType,
        marketCondition: dto.marketCondition,
        followedPlan: dto.followedPlan,
        wordCount,
        ...(dto.tagIds?.length ? {
          journalTags: { create: dto.tagIds.map(tagId => ({ tagId })) },
        } : {}),
      },
    });
    return { data: entry };
  }

  async update(id: string, tenantId: string, dto: Partial<CreateJournalDto>) {
    const entry = await this.prisma.journalEntry.findFirst({ where: { id, tenantId } });
    if (!entry) throw new NotFoundException('Journal entry not found');
    const updated = await this.prisma.journalEntry.update({ where: { id }, data: { ...dto as any } });
    return { data: updated };
  }

  async remove(id: string, tenantId: string) {
    const entry = await this.prisma.journalEntry.findFirst({ where: { id, tenantId } });
    if (!entry) throw new NotFoundException('Journal entry not found');
    await this.prisma.journalEntry.delete({ where: { id } });
    return { data: { deleted: true } };
  }

  async getPsychologyStats(tenantId: string, userId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const entries = await this.prisma.journalEntry.findMany({
      where: { tenantId, userId, entryDate: { gte: since }, confidenceLevel: { not: null } },
      select: { entryDate: true, confidenceLevel: true, stressLevel: true, disciplineScore: true, emotionalState: true, followedPlan: true },
      orderBy: { entryDate: 'asc' },
    });

    const withPlan = entries.filter(e => e.followedPlan !== null);
    const followedPlanRate = withPlan.length
      ? withPlan.filter(e => e.followedPlan).length / withPlan.length
      : 0;

    const emotionCounts: Record<string, number> = {};
    for (const e of entries) {
      if (e.emotionalState) emotionCounts[e.emotionalState] = (emotionCounts[e.emotionalState] ?? 0) + 1;
    }

    return {
      data: {
        trend: entries.map(e => ({
          date: e.entryDate,
          confidence: e.confidenceLevel,
          stress: e.stressLevel,
          discipline: e.disciplineScore,
        })),
        followedPlanRate: parseFloat(followedPlanRate.toFixed(4)),
        avgConfidence: avg(entries.map(e => e.confidenceLevel).filter(Boolean) as number[]),
        avgStress: avg(entries.map(e => e.stressLevel).filter(Boolean) as number[]),
        avgDiscipline: avg(entries.map(e => e.disciplineScore).filter(Boolean) as number[]),
        emotionBreakdown: emotionCounts,
        totalEntries: entries.length,
      },
    };
  }
}

function avg(arr: number[]): number {
  return arr.length ? parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2)) : 0;
}

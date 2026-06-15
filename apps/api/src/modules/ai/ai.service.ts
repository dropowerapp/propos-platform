import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';

export interface CreateConversationDto {
  title?: string;
  contextType?: string;
  contextId?: string;
}

export interface SendMessageDto {
  content: string;
}

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  // ─── Conversations ────────────────────────────────────────────────────────

  async listConversations(tenantId: string, userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { tenantId, userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  async createConversation(tenantId: string, userId: string, dto: CreateConversationDto) {
    return this.prisma.aiConversation.create({
      data: {
        tenantId,
        userId,
        title: dto.title ?? 'New conversation',
        contextType: dto.contextType ?? null,
        contextId: dto.contextId ?? null,
      },
    });
  }

  async getConversation(id: string, tenantId: string) {
    const conv = await this.prisma.aiConversation.findFirst({
      where: { id, tenantId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async deleteConversation(id: string, tenantId: string) {
    const conv = await this.prisma.aiConversation.findFirst({ where: { id, tenantId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    await this.prisma.aiConversation.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Build trader context for system prompt ───────────────────────────────

  private async buildTraderContext(tenantId: string, userId: string): Promise<string> {
    try {
      // Fetch recent analytics
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [tradeStats, accounts, journalCount, recentTrades] = await Promise.all([
        this.prisma.trade.aggregate({
          where: { tenantId, userId, closeTime: { gte: thirtyDaysAgo } },
          _count: true,
          _sum: { netPnl: true },
          _avg: { rMultiple: true },
        }),
        this.prisma.propFirmAccount.findMany({
          where: { tenantId, userId, status: { in: ['active', 'funded'] } },
          include: { propFirm: { select: { name: true } }, rulesSnapshot: true },
          take: 5,
        }),
        this.prisma.journalEntry.count({ where: { tenantId, userId } }),
        this.prisma.trade.findMany({
          where: { tenantId, userId },
          orderBy: { closeTime: 'desc' },
          take: 5,
          select: { symbol: true, direction: true, netPnl: true, outcome: true, session: true },
        }),
      ]);

      const wins = await this.prisma.trade.count({
        where: { tenantId, userId, outcome: 'win', closeTime: { gte: thirtyDaysAgo } },
      });
      const total = Number(tradeStats._count ?? 0);
      const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 'N/A';
      const netPnl = Number(tradeStats._sum?.netPnl ?? 0).toFixed(2);
      const avgR = Number(tradeStats._avg?.rMultiple ?? 0).toFixed(2);

      const accountSummary = accounts.map(a =>
        `${a.propFirm.name} $${(Number(a.accountSize) / 1000).toFixed(0)}k (${a.status})`
      ).join(', ') || 'None';

      const recentSummary = recentTrades.map(t =>
        `${t.symbol} ${t.direction} ${t.outcome} $${Number(t.netPnl).toFixed(0)}`
      ).join(', ') || 'No recent trades';

      return `
TRADER CONTEXT (Last 30 days):
- Total trades: ${total}
- Win rate: ${winRate}%
- Net P&L: $${netPnl}
- Avg R-Multiple: ${avgR}R
- Journal entries: ${journalCount}
- Active accounts: ${accountSummary}
- Recent trades: ${recentSummary}
      `.trim();
    } catch {
      return 'No trading data available yet.';
    }
  }

  // ─── Send message (non-streaming) ────────────────────────────────────────

  async sendMessage(conversationId: string, tenantId: string, userId: string, dto: SendMessageDto) {
    const conv = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, tenantId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    // Persist user message
    await this.prisma.aiMessage.create({
      data: { conversationId, role: 'user', content: dto.content },
    });

    if (!this.openai) {
      const reply = 'AI is not configured. Please add an OPENAI_API_KEY to your environment variables.';
      const msg = await this.prisma.aiMessage.create({
        data: { conversationId, role: 'assistant', content: reply, model: 'none' },
      });
      await this.prisma.aiConversation.update({
        where: { id: conversationId },
        data: { messageCount: { increment: 2 } },
      });
      return msg;
    }

    const traderContext = await this.buildTraderContext(tenantId, userId);

    const systemPrompt = `You are PropOS AI Coach — an expert prop trading performance analyst. You help traders improve their performance, manage prop firm challenges, and understand their trading psychology.

${traderContext}

Guidelines:
- Be specific and data-driven. Reference the trader's actual statistics when relevant.
- Focus on actionable insights, not generic advice.
- Be concise but thorough. Use markdown for formatting.
- When discussing prop firm rules, be precise about drawdown percentages and targets.
- Always prioritize capital preservation and rule compliance.`;

    const history = conv.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const start = Date.now();
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: dto.content },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const latencyMs = Date.now() - start;
    const content = completion.choices[0]?.message?.content ?? 'No response generated.';
    const tokensUsed = completion.usage?.total_tokens ?? null;

    const [assistantMsg] = await Promise.all([
      this.prisma.aiMessage.create({
        data: {
          conversationId,
          role: 'assistant',
          content,
          tokensUsed,
          model: completion.model,
          latencyMs,
        },
      }),
      this.prisma.aiConversation.update({
        where: { id: conversationId },
        data: { messageCount: { increment: 2 }, updatedAt: new Date() },
      }),
    ]);

    return assistantMsg;
  }

  // ─── Streaming message (SSE) ──────────────────────────────────────────────

  async *streamMessage(
    conversationId: string,
    tenantId: string,
    userId: string,
    content: string,
  ): AsyncGenerator<string> {
    const conv = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, tenantId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    // Persist user message
    await this.prisma.aiMessage.create({
      data: { conversationId, role: 'user', content },
    });

    if (!this.openai) {
      yield 'data: ' + JSON.stringify({ content: 'AI not configured. Add OPENAI_API_KEY.' }) + '\n\n';
      yield 'data: [DONE]\n\n';
      return;
    }

    const traderContext = await this.buildTraderContext(tenantId, userId);

    const systemPrompt = `You are PropOS AI Coach — an expert prop trading performance analyst. You help traders improve their performance, manage prop firm challenges, and understand their trading psychology.

${traderContext}

Guidelines:
- Be specific and data-driven. Reference the trader's actual statistics when relevant.
- Focus on actionable insights, not generic advice.
- Be concise but thorough. Use markdown for formatting.
- When discussing prop firm rules, be precise about drawdown percentages and targets.
- Always prioritize capital preservation and rule compliance.`;

    const history = conv.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content },
      ],
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    });

    let fullContent = '';
    let totalTokens = 0;
    const start = Date.now();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        fullContent += delta;
        yield 'data: ' + JSON.stringify({ content: delta }) + '\n\n';
      }
      if (chunk.usage) totalTokens = chunk.usage.total_tokens;
    }

    yield 'data: [DONE]\n\n';

    // Persist assistant message after streaming
    await Promise.all([
      this.prisma.aiMessage.create({
        data: {
          conversationId,
          role: 'assistant',
          content: fullContent,
          tokensUsed: totalTokens || null,
          model: 'gpt-4o-mini',
          latencyMs: Date.now() - start,
        },
      }),
      this.prisma.aiConversation.update({
        where: { id: conversationId },
        data: { messageCount: { increment: 2 }, updatedAt: new Date() },
      }),
    ]);
  }

  // ─── Quick insights (no conversation) ────────────────────────────────────

  async getInsight(tenantId: string, userId: string, insightType: string): Promise<string> {
    if (!this.openai) {
      return 'AI not configured. Add OPENAI_API_KEY to enable insights.';
    }

    const traderContext = await this.buildTraderContext(tenantId, userId);

    const prompts: Record<string, string> = {
      daily_summary: 'Generate a concise daily performance summary based on the trader data above. Highlight what went well and what needs attention.',
      best_setup: 'Based on the trading data, identify the trader\'s highest-probability setup. Include win rate, R-multiple, and best conditions.',
      psychology_check: 'Analyze the trader\'s psychological patterns based on their trading data. Identify emotional biases and suggest improvements.',
      firm_recommendation: 'Based on the trader\'s stats, recommend the most suitable prop firm challenge type and size.',
    };

    const userPrompt = prompts[insightType] ?? `Provide a brief ${insightType} insight based on the trading data.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are PropOS AI Coach — a prop trading performance analyst.\n\n${traderContext}`,
        },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.6,
    });

    return completion.choices[0]?.message?.content ?? 'Unable to generate insight.';
  }
}

import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertsGateway } from './alerts.gateway';

export interface CreateAlertRuleDto {
  propFirmAccountId?: string;
  alertType: string;
  thresholdValue?: number;
  thresholdType?: string;
  channels?: string[];
}

export interface ListAlertsQuery {
  severity?: string;
  isRead?: string;
  limit?: string;
  cursor?: string;
}

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private gateway?: AlertsGateway,
  ) {}

  // ─── Alert Events (notifications) ────────────────────────────────────────

  async listEvents(tenantId: string, userId: string, query: ListAlertsQuery) {
    const where: any = {
      tenantId,
      userId,
      isDismissed: false,
    };

    if (query.severity) where.severity = query.severity;
    if (query.isRead === 'false') where.isRead = false;

    const limit = Math.min(parseInt(query.limit ?? '50'), 100);

    const events = await this.prisma.alertEvent.findMany({
      where,
      include: {
        alertRule: { select: { alertType: true, thresholdValue: true } },
        propFirmAccount: {
          select: {
            id: true,
            accountName: true,
            accountSize: true,
            propFirm: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: limit,
      ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
    });

    const unreadCount = await this.prisma.alertEvent.count({
      where: { tenantId, userId, isRead: false, isDismissed: false },
    });

    return { events, unreadCount };
  }

  async markRead(id: string, tenantId: string, userId: string) {
    const event = await this.prisma.alertEvent.findFirst({ where: { id, tenantId, userId } });
    if (!event) throw new NotFoundException('Alert not found');

    const updated = await this.prisma.alertEvent.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
    this.gateway?.emitAlertRead(tenantId, id);
    return updated;
  }

  async markAllRead(tenantId: string, userId: string) {
    const result = await this.prisma.alertEvent.updateMany({
      where: { tenantId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    this.gateway?.emitAllRead(tenantId);
    return { updated: result.count };
  }

  async dismiss(id: string, tenantId: string, userId: string) {
    const event = await this.prisma.alertEvent.findFirst({ where: { id, tenantId, userId } });
    if (!event) throw new NotFoundException('Alert not found');

    return this.prisma.alertEvent.update({
      where: { id },
      data: { isDismissed: true },
    });
  }

  // ─── Alert Rules ─────────────────────────────────────────────────────────

  async listRules(tenantId: string, userId: string) {
    return this.prisma.alertRule.findMany({
      where: { tenantId, userId },
      include: {
        propFirmAccount: {
          select: {
            id: true,
            accountName: true,
            propFirm: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(tenantId: string, userId: string, dto: CreateAlertRuleDto) {
    return this.prisma.alertRule.create({
      data: {
        tenantId,
        userId,
        propFirmAccountId: dto.propFirmAccountId ?? null,
        alertType: dto.alertType,
        thresholdValue: dto.thresholdValue ?? null,
        thresholdType: dto.thresholdType ?? null,
        channels: dto.channels ?? ['in_app'],
        isActive: true,
      },
    });
  }

  async updateRule(id: string, tenantId: string, dto: Partial<CreateAlertRuleDto>) {
    const rule = await this.prisma.alertRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Alert rule not found');

    return this.prisma.alertRule.update({
      where: { id },
      data: {
        ...(dto.alertType && { alertType: dto.alertType }),
        ...(dto.thresholdValue !== undefined && { thresholdValue: dto.thresholdValue }),
        ...(dto.thresholdType && { thresholdType: dto.thresholdType }),
        ...(dto.channels && { channels: dto.channels }),
      },
    });
  }

  async toggleRule(id: string, tenantId: string) {
    const rule = await this.prisma.alertRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Alert rule not found');

    return this.prisma.alertRule.update({
      where: { id },
      data: { isActive: !rule.isActive },
    });
  }

  async deleteRule(id: string, tenantId: string) {
    const rule = await this.prisma.alertRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Alert rule not found');

    await this.prisma.alertRule.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Alert Evaluation Engine ──────────────────────────────────────────────
  // Called internally (e.g. after trade import, on schedule) to fire alerts.

  async evaluateAccountAlerts(tenantId: string, accountId: string) {
    const account = await this.prisma.propFirmAccount.findFirst({
      where: { id: accountId, tenantId },
      include: {
        rulesSnapshot: true,
        propFirm: { select: { name: true } },
      },
    });
    if (!account || !account.rulesSnapshot) return;

    const rules = await this.prisma.alertRule.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [{ propFirmAccountId: accountId }, { propFirmAccountId: null }],
      },
    });

    const snapshot = account.rulesSnapshot;
    const currentPnlPct = account.accountSize > 0
      ? (Number(account.totalPnl) / Number(account.accountSize)) * 100
      : 0;
    const maxDDPct = Number(snapshot.maxDrawdownPct ?? 10);
    const dailyDDPct = Number(snapshot.dailyDrawdownPct ?? 5);
    const profitTargetPct = Number(snapshot.profitTargetPct ?? 10);

    const events: Array<{
      type: string;
      severity: string;
      title: string;
      body: string;
    }> = [];

    for (const rule of rules) {
      const threshold = rule.thresholdValue ? Number(rule.thresholdValue) : null;

      if (rule.alertType === 'drawdown_warning') {
        const remainingDD = maxDDPct + currentPnlPct; // how much buffer remains
        const triggerAt = threshold ?? maxDDPct * 0.8;
        if (remainingDD < triggerAt && remainingDD >= 0) {
          events.push({
            type: 'drawdown_warning',
            severity: 'warning',
            title: `⚠️ Drawdown Warning — ${account.propFirm.name}`,
            body: `You have ${remainingDD.toFixed(2)}% drawdown buffer remaining. Max allowed: ${maxDDPct}%.`,
          });
        }
      }

      if (rule.alertType === 'drawdown_critical') {
        const remainingDD = maxDDPct + currentPnlPct;
        const triggerAt = threshold ?? maxDDPct * 0.5;
        if (remainingDD < triggerAt && remainingDD >= 0) {
          events.push({
            type: 'drawdown_critical',
            severity: 'critical',
            title: `🚨 Critical Drawdown — ${account.propFirm.name}`,
            body: `Only ${remainingDD.toFixed(2)}% buffer left! You are at risk of failing the challenge.`,
          });
        }
      }

      if (rule.alertType === 'profit_target_near') {
        const triggerAt = threshold ?? profitTargetPct * 0.9;
        if (currentPnlPct >= triggerAt && currentPnlPct < profitTargetPct) {
          events.push({
            type: 'profit_target_near',
            severity: 'info',
            title: `🎯 Profit Target Almost Reached — ${account.propFirm.name}`,
            body: `You're at ${currentPnlPct.toFixed(2)}%. Target: ${profitTargetPct}%. Trade carefully!`,
          });
        }
      }

      if (rule.alertType === 'profit_target_hit') {
        if (currentPnlPct >= profitTargetPct) {
          events.push({
            type: 'profit_target_hit',
            severity: 'success',
            title: `✅ Profit Target Hit — ${account.propFirm.name}`,
            body: `Congratulations! You've hit the ${profitTargetPct}% profit target. Time to request your payout or advance to the next phase.`,
          });
        }
      }
    }

    // Persist unique events (avoid duplicates within 24h)
    for (const ev of events) {
      const recentDuplicate = await this.prisma.alertEvent.findFirst({
        where: {
          tenantId,
          propFirmAccountId: accountId,
          alertType: ev.type,
          sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (recentDuplicate) continue;

      const created = await this.prisma.alertEvent.create({
        data: {
          tenantId,
          userId: account.userId,
          propFirmAccountId: accountId,
          alertType: ev.type,
          severity: ev.severity,
          title: ev.title,
          body: ev.body,
        },
      });

      // Push to connected WebSocket clients in real-time
      this.gateway?.emitAlert(tenantId, {
        id: created.id,
        type: ev.type,
        severity: ev.severity,
        title: ev.title,
        message: ev.body,
        createdAt: created.sentAt,
      });
    }

    return { fired: events.length };
  }
}

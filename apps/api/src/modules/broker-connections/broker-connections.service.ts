import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportService } from '../import/import.service';
import { encryptToken, decryptToken } from './token-crypto';
import * as ctrader from './ctrader.client';
import * as tradovate from './tradovate.client';

type BrokerType = 'ctrader' | 'tradovate';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  obtainedAt: number;
}

@Injectable()
export class BrokerConnectionsService {
  constructor(
    private prisma: PrismaService,
    private importService: ImportService,
  ) {}

  // ─── OAuth: start ──────────────────────────────────────────────────────────
  // `state` carries the user+tenant so the callback knows who connected.
  getAuthUrl(broker: BrokerType, userId: string, tenantId: string): { url: string } {
    const state = Buffer.from(JSON.stringify({ userId, tenantId, broker })).toString('base64url');
    if (broker === 'ctrader') {
      if (!process.env.CTRADER_CLIENT_ID) throw new BadRequestException('cTrader is not configured');
      return { url: ctrader.buildAuthUrl(state) };
    }
    if (broker === 'tradovate') {
      if (!process.env.TRADOVATE_CLIENT_ID) throw new BadRequestException('Tradovate is not configured');
      return { url: tradovate.buildAuthUrl(state) };
    }
    throw new BadRequestException(`Unknown broker: ${broker}`);
  }

  // ─── OAuth: callback ───────────────────────────────────────────────────────
  async handleCallback(broker: BrokerType, code: string, state: string): Promise<{ tenantId: string }> {
    let parsed: { userId: string; tenantId: string };
    try {
      parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid OAuth state');
    }
    const { userId, tenantId } = parsed;

    if (broker === 'ctrader') {
      const tokens = await ctrader.exchangeCode(code);
      const accounts = await ctrader.getTradingAccounts(tokens.accessToken);
      await this.prisma.brokerConnection.create({
        data: {
          tenantId, userId, brokerType: 'ctrader',
          connectionName: accounts[0]?.brokerName ? `cTrader · ${accounts[0].brokerName}` : 'cTrader',
          credentials: this.packCredentials(tokens, accounts),
          accountNumber: accounts[0]?.traderLogin ? String(accounts[0].traderLogin) : null,
          syncStatus: 'idle', isActive: true,
        },
      });
    } else if (broker === 'tradovate') {
      const tokens = await tradovate.exchangeCode(code);
      const accounts = await tradovate.getAccounts(tokens.accessToken);
      await this.prisma.brokerConnection.create({
        data: {
          tenantId, userId, brokerType: 'tradovate',
          connectionName: accounts[0]?.name ? `Tradovate · ${accounts[0].name}` : 'Tradovate',
          credentials: this.packCredentials(tokens, accounts),
          accountNumber: accounts[0]?.id ? String(accounts[0].id) : null,
          syncStatus: 'idle', isActive: true,
        },
      });
    } else {
      throw new BadRequestException(`Unknown broker: ${broker}`);
    }

    return { tenantId };
  }

  // ─── List / disconnect ─────────────────────────────────────────────────────
  async list(userId: string, tenantId: string) {
    const connections = await this.prisma.brokerConnection.findMany({
      where: { userId, tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return {
      data: connections.map(c => ({
        id: c.id,
        brokerType: c.brokerType,
        connectionName: c.connectionName,
        accountNumber: c.accountNumber,
        lastSyncedAt: c.lastSyncedAt,
        syncStatus: c.syncStatus,
        syncError: c.syncError,
        createdAt: c.createdAt,
      })),
    };
  }

  async disconnect(id: string, userId: string, tenantId: string) {
    const conn = await this.prisma.brokerConnection.findFirst({ where: { id, userId, tenantId } });
    if (!conn) throw new NotFoundException('Connection not found');
    await this.prisma.brokerConnection.update({
      where: { id },
      data: { isActive: false, syncStatus: 'disconnected' },
    });
    return { data: { disconnected: true } };
  }

  // ─── Sync ──────────────────────────────────────────────────────────────────
  // Pulls fresh trades and routes them through the shared dedup/persist pipeline.
  async sync(id: string, userId: string, tenantId: string, propFirmAccountId: string) {
    const conn = await this.prisma.brokerConnection.findFirst({ where: { id, userId, tenantId, isActive: true } });
    if (!conn) throw new NotFoundException('Connection not found');
    if (!propFirmAccountId) throw new BadRequestException('propFirmAccountId is required to route imported trades');

    await this.prisma.brokerConnection.update({ where: { id }, data: { syncStatus: 'syncing', syncError: null } });

    try {
      let { tokens, accounts } = this.unpackCredentials(conn.credentials);
      const broker = conn.brokerType as BrokerType;
      const fromMs = conn.lastSyncedAt ? conn.lastSyncedAt.getTime() : Date.now() - 1000 * 60 * 60 * 24 * 90;
      const acct = accounts[0];
      let rawDeals: any[] = [];

      // Refresh near-expiry token, then fetch deals — per broker
      if (broker === 'ctrader') {
        if (Date.now() > tokens.obtainedAt + (tokens.expiresIn - 300) * 1000) {
          tokens = await ctrader.refreshTokens(tokens.refreshToken);
          await this.prisma.brokerConnection.update({ where: { id }, data: { credentials: this.packCredentials(tokens, accounts) } });
        }
        rawDeals = acct
          ? (await ctrader.getDeals(tokens.accessToken, acct.ctidTraderAccountId, fromMs, Date.now(), acct.isLive ?? true))
              .map((d: any) => this.ctraderDealToParsed(d))
          : [];
      } else if (broker === 'tradovate') {
        if (Date.now() > tokens.obtainedAt + (tokens.expiresIn - 120) * 1000) {
          tokens = await tradovate.refreshTokens(tokens.accessToken, acct?.isLive ?? true);
          await this.prisma.brokerConnection.update({ where: { id }, data: { credentials: this.packCredentials(tokens, accounts) } });
        }
        rawDeals = acct
          ? (await tradovate.getDeals(tokens.accessToken, acct.id, fromMs, Date.now(), acct.isLive ?? true))
              .map((d: any) => this.tradovateDealToParsed(d))
          : [];
      }

      const result = rawDeals.length
        ? await this.importService.persistTrades(tenantId, userId, propFirmAccountId, rawDeals)
        : { imported: 0, skipped: 0, errors: 0 };

      await this.prisma.brokerConnection.update({
        where: { id },
        data: { syncStatus: 'idle', lastSyncedAt: new Date(), syncError: null },
      });

      return { data: { ...result, fetched: rawDeals.length } };
    } catch (err: any) {
      await this.prisma.brokerConnection.update({
        where: { id },
        data: { syncStatus: 'error', syncError: err.message?.slice(0, 500) ?? 'sync failed' },
      });
      throw err;
    }
  }

  // ─── helpers ───────────────────────────────────────────────────────────────

  private packCredentials(tokens: StoredTokens, accounts: any[]) {
    return {
      accessToken: encryptToken(tokens.accessToken),
      refreshToken: encryptToken(tokens.refreshToken),
      expiresIn: tokens.expiresIn,
      obtainedAt: tokens.obtainedAt,
      accounts,
    };
  }

  private unpackCredentials(credentials: any): { tokens: StoredTokens; accounts: any[] } {
    return {
      tokens: {
        accessToken: decryptToken(credentials.accessToken),
        refreshToken: decryptToken(credentials.refreshToken),
        expiresIn: credentials.expiresIn,
        obtainedAt: credentials.obtainedAt,
      },
      accounts: credentials.accounts ?? [],
    };
  }

  // cTrader normalised deal → ParsedTrade
  private ctraderDealToParsed(d: any) {
    const { createHash } = require('crypto');
    const symbol = String(d.symbolName ?? 'UNKNOWN').toUpperCase().replace('/', '');
    const lots = Number(d.volume ?? 0) / 1e7; // FX default: 100k units/lot = 1e7 cents
    return {
      symbol,
      direction: d.tradeSide === 'short' ? 'short' as const : 'long' as const,
      lots: lots > 0 ? lots : Number(d.volume ?? 0) / 100,
      openPrice: Number(d.openPrice ?? 0),
      closePrice: Number(d.closePrice ?? 0),
      openedAt: d.openedAt instanceof Date ? d.openedAt : new Date(d.openedAt),
      closedAt: d.closedAt instanceof Date ? d.closedAt : new Date(d.closedAt),
      stopLoss: null, takeProfit: null,
      grossPnl: Number(d.grossPnl ?? 0),
      commission: Number(d.commission ?? 0),
      swap: Number(d.swap ?? 0),
      comment: null,
      importHash: createHash('sha256').update(`ctrader:${d.dealId}`).digest('hex'),
    };
  }

  // Tradovate fill-pair → ParsedTrade
  private tradovateDealToParsed(d: any) {
    const { createHash } = require('crypto');
    return {
      symbol: String(d.symbol ?? 'UNKNOWN').toUpperCase(),
      direction: d.tradeSide === 'short' ? 'short' as const : 'long' as const,
      lots: Number(d.qty ?? 1),
      openPrice: Number(d.openPrice ?? 0),
      closePrice: Number(d.closePrice ?? 0),
      openedAt: d.openedAt instanceof Date ? d.openedAt : new Date(d.openedAt),
      closedAt: d.closedAt instanceof Date ? d.closedAt : new Date(d.closedAt),
      stopLoss: null, takeProfit: null,
      grossPnl: Number(d.grossPnl ?? 0),
      commission: Number(d.commission ?? 0),
      swap: Number(d.swap ?? 0),
      comment: null,
      importHash: createHash('sha256').update(`tradovate:${d.dealId}`).digest('hex'),
    };
  }
}

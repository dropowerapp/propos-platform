import { Controller, Get, Post, Delete, Param, Query, Body, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { BrokerConnectionsService } from './broker-connections.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, CurrentTenant } from '../../common/decorators/current-user.decorator';
import type { User, Tenant } from '@prisma/client';

const SUPPORTED = ['ctrader', 'tradovate'] as const;
type BrokerType = typeof SUPPORTED[number];

function assertBroker(b: string): BrokerType {
  if (!SUPPORTED.includes(b as BrokerType)) throw new BadRequestException(`Unsupported broker: ${b}`);
  return b as BrokerType;
}

@ApiTags('broker-connections')
@Controller('broker-connections')
export class BrokerConnectionsController {
  constructor(private service: BrokerConnectionsService) {}

  // Start OAuth for a broker — returns the consent URL for the frontend to open
  @Get(':broker/connect')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  connect(@Param('broker') broker: string, @CurrentUser() user: User, @CurrentTenant() tenant: Tenant) {
    return this.service.getAuthUrl(assertBroker(broker), user.id, tenant.id);
  }

  // OAuth redirect target — public (identity travels in `state`)
  @Get(':broker/callback')
  async callback(
    @Param('broker') broker: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontend = process.env.FRONTEND_URL ?? 'http://localhost:3002';
    try {
      await this.service.handleCallback(assertBroker(broker), code, state);
      res.redirect(`${frontend}/accounts?connected=${broker}`);
    } catch (err: any) {
      res.redirect(`${frontend}/accounts?connect_error=${encodeURIComponent(err.message ?? 'failed')}`);
    }
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  list(@CurrentUser() user: User, @CurrentTenant() tenant: Tenant) {
    return this.service.list(user.id, tenant.id);
  }

  @Post(':id/sync')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  sync(
    @Param('id') id: string,
    @Body('propFirmAccountId') propFirmAccountId: string,
    @CurrentUser() user: User,
    @CurrentTenant() tenant: Tenant,
  ) {
    return this.service.sync(id, user.id, tenant.id, propFirmAccountId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  disconnect(@Param('id') id: string, @CurrentUser() user: User, @CurrentTenant() tenant: Tenant) {
    return this.service.disconnect(id, user.id, tenant.id);
  }
}

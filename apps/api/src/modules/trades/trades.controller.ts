import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TradesService } from './trades.service';
import type { ListTradesQuery, CreateTradeDto } from './trades.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, CurrentTenant } from '../../common/decorators/current-user.decorator';
import type { User, Tenant } from '@prisma/client';

@ApiTags('trades')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('trades')
export class TradesController {
  constructor(private tradesService: TradesService) {}

  @Get()
  list(@CurrentTenant() tenant: Tenant, @CurrentUser() user: User, @Query() query: ListTradesQuery) {
    return this.tradesService.list(tenant.id, user.id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    return this.tradesService.findOne(id, tenant.id);
  }

  @Post()
  create(@CurrentTenant() tenant: Tenant, @CurrentUser() user: User, @Body() dto: CreateTradeDto) {
    return this.tradesService.create(tenant.id, user.id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentTenant() tenant: Tenant, @Body() dto: Partial<CreateTradeDto>) {
    return this.tradesService.update(id, tenant.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    return this.tradesService.remove(id, tenant.id);
  }
}

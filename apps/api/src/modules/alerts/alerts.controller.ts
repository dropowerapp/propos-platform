import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import type { ListAlertsQuery, CreateAlertRuleDto } from './alerts.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, CurrentTenant } from '../../common/decorators/current-user.decorator';
import type { User, Tenant } from '@prisma/client';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  // ─── Alert Events ─────────────────────────────────────────────────────────

  @Get()
  listEvents(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: User,
    @Query() query: ListAlertsQuery,
  ) {
    return this.alertsService.listEvents(tenant.id, user.id, query);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentTenant() tenant: Tenant, @CurrentUser() user: User) {
    return this.alertsService.markRead(id, tenant.id, user.id);
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentTenant() tenant: Tenant, @CurrentUser() user: User) {
    return this.alertsService.markAllRead(tenant.id, user.id);
  }

  @Patch(':id/dismiss')
  dismiss(@Param('id') id: string, @CurrentTenant() tenant: Tenant, @CurrentUser() user: User) {
    return this.alertsService.dismiss(id, tenant.id, user.id);
  }

  // ─── Alert Rules ─────────────────────────────────────────────────────────

  @Get('rules')
  listRules(@CurrentTenant() tenant: Tenant, @CurrentUser() user: User) {
    return this.alertsService.listRules(tenant.id, user.id);
  }

  @Post('rules')
  createRule(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: User,
    @Body() dto: CreateAlertRuleDto,
  ) {
    return this.alertsService.createRule(tenant.id, user.id, dto);
  }

  @Patch('rules/:id')
  updateRule(
    @Param('id') id: string,
    @CurrentTenant() tenant: Tenant,
    @Body() dto: Partial<CreateAlertRuleDto>,
  ) {
    return this.alertsService.updateRule(id, tenant.id, dto);
  }

  @Patch('rules/:id/toggle')
  toggleRule(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    return this.alertsService.toggleRule(id, tenant.id);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.OK)
  deleteRule(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    return this.alertsService.deleteRule(id, tenant.id);
  }
}

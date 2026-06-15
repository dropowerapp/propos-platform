import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, CurrentTenant } from '../../common/decorators/current-user.decorator';
import type { User, Tenant } from '@prisma/client';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  overview(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: User,
    @Query('accountId') accountId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.getOverview(tenant.id, user.id, accountId, dateFrom, dateTo);
  }

  @Get('breakdown')
  breakdown(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: User,
    @Query('groupBy') groupBy: string = 'session',
    @Query('accountId') accountId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.getBreakdown(tenant.id, user.id, groupBy, accountId, dateFrom, dateTo);
  }
}

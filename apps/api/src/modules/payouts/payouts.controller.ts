import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import type { CreatePayoutDto } from './payouts.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, CurrentTenant } from '../../common/decorators/current-user.decorator';
import type { User, Tenant } from '@prisma/client';

@ApiTags('payouts')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('payouts')
export class PayoutsController {
  constructor(private payoutsService: PayoutsService) {}

  @Get()
  list(@CurrentTenant() t: Tenant, @CurrentUser() u: User, @Query() query: any) {
    return this.payoutsService.list(t.id, u.id, query);
  }

  @Get('roi-summary')
  roiSummary(@CurrentTenant() t: Tenant, @CurrentUser() u: User) {
    return this.payoutsService.getRoiSummary(t.id, u.id);
  }

  @Post()
  create(@CurrentTenant() t: Tenant, @CurrentUser() u: User, @Body() dto: CreatePayoutDto) {
    return this.payoutsService.create(t.id, u.id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @CurrentTenant() t: Tenant, @Body('status') status: string) {
    return this.payoutsService.updateStatus(id, t.id, status);
  }
}

import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import type { CreateAccountDto, ResetAccountDto } from './accounts.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, CurrentTenant } from '../../common/decorators/current-user.decorator';
import type { User, Tenant } from '@prisma/client';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  list(@CurrentTenant() t: Tenant, @CurrentUser() u: User, @Query('status') status?: string) {
    return this.accountsService.list(t.id, u.id, status);
  }

  @Get('portfolio-summary')
  portfolioSummary(@CurrentTenant() t: Tenant, @CurrentUser() u: User) {
    return this.accountsService.getPortfolioSummary(t.id, u.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() t: Tenant) {
    return this.accountsService.findOne(id, t.id);
  }

  @Post()
  create(@CurrentTenant() t: Tenant, @CurrentUser() u: User, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(t.id, u.id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentTenant() t: Tenant, @Body() dto: any) {
    return this.accountsService.update(id, t.id, dto);
  }

  @Post(':id/reset')
  @HttpCode(200)
  reset(@Param('id') id: string, @CurrentTenant() t: Tenant, @Body() dto: ResetAccountDto) {
    return this.accountsService.reset(id, t.id, dto);
  }
}

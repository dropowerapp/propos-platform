import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JournalService } from './journal.service';
import type { CreateJournalDto } from './journal.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, CurrentTenant } from '../../common/decorators/current-user.decorator';
import type { User, Tenant } from '@prisma/client';

@ApiTags('journal')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('journal')
export class JournalController {
  constructor(private journalService: JournalService) {}

  @Get()
  list(@CurrentTenant() tenant: Tenant, @CurrentUser() user: User, @Query() query: any) {
    return this.journalService.list(tenant.id, user.id, query);
  }

  @Get('psychology-stats')
  psychologyStats(@CurrentTenant() tenant: Tenant, @CurrentUser() user: User, @Query('days') days?: string) {
    return this.journalService.getPsychologyStats(tenant.id, user.id, days ? +days : 30);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    return this.journalService.findOne(id, tenant.id);
  }

  @Post()
  create(@CurrentTenant() tenant: Tenant, @CurrentUser() user: User, @Body() dto: CreateJournalDto) {
    return this.journalService.create(tenant.id, user.id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentTenant() tenant: Tenant, @Body() dto: Partial<CreateJournalDto>) {
    return this.journalService.update(id, tenant.id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    return this.journalService.remove(id, tenant.id);
  }
}

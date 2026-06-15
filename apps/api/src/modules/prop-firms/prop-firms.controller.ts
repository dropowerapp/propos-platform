import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PropFirmsService } from './prop-firms.service';
import type { CreateReviewDto } from './prop-firms.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, CurrentTenant } from '../../common/decorators/current-user.decorator';
import type { User, Tenant } from '@prisma/client';

@ApiTags('prop-firms')
@Controller('prop-firms')
export class PropFirmsController {
  constructor(private propFirmsService: PropFirmsService) {}

  @Get()
  list(@Query() query: any) {
    return this.propFirmsService.list(query);
  }

  @Get('recommendations')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  recommendations(@CurrentUser() user: User, @CurrentTenant() tenant: Tenant) {
    return this.propFirmsService.getRecommendations(user.id, tenant.id);
  }

  // Firms the signed-in user can leave a *verified* review for (owns an account)
  @Get('review-eligibility')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  reviewEligibility(@CurrentUser() user: User, @CurrentTenant() tenant: Tenant) {
    return this.propFirmsService.getReviewEligibility(user.id, tenant.id);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.propFirmsService.findBySlug(slug);
  }

  @Get(':slug/history')
  ruleHistory(@Param('slug') slug: string) {
    return this.propFirmsService.getRuleHistory(slug);
  }

  @Get(':slug/reviews')
  listReviews(@Param('slug') slug: string) {
    return this.propFirmsService.listReviews(slug);
  }

  @Post(':slug/reviews')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  createReview(
    @Param('slug') slug: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: User,
    @CurrentTenant() tenant: Tenant,
  ) {
    return this.propFirmsService.createReview(user.id, tenant.id, slug, dto);
  }
}

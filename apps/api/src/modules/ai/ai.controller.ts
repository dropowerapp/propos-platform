import {
  Controller, Get, Post, Delete, Body, Param, Query,
  UseGuards, Res, HttpCode, HttpStatus, Sse,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { Observable, fromEventPattern } from 'rxjs';
import { AiService } from './ai.service';
import type { CreateConversationDto, SendMessageDto } from './ai.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, CurrentTenant } from '../../common/decorators/current-user.decorator';
import type { User, Tenant } from '@prisma/client';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  // ─── Conversations ────────────────────────────────────────────────────────

  @Get('conversations')
  listConversations(@CurrentTenant() tenant: Tenant, @CurrentUser() user: User) {
    return this.aiService.listConversations(tenant.id, user.id);
  }

  @Post('conversations')
  createConversation(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: User,
    @Body() dto: CreateConversationDto,
  ) {
    return this.aiService.createConversation(tenant.id, user.id, dto);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    return this.aiService.getConversation(id, tenant.id);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.OK)
  deleteConversation(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    return this.aiService.deleteConversation(id, tenant.id);
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') id: string,
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: User,
    @Body() dto: SendMessageDto,
  ) {
    return this.aiService.sendMessage(id, tenant.id, user.id, dto);
  }

  // ─── Streaming (SSE) ──────────────────────────────────────────────────────

  @Get('conversations/:id/stream')
  async streamMessage(
    @Param('id') id: string,
    @Query('content') content: string,
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    try {
      for await (const chunk of this.aiService.streamMessage(id, tenant.id, user.id, content)) {
        res.write(chunk);
      }
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message ?? 'Stream error' })}\n\n`);
    } finally {
      res.end();
    }
  }

  // ─── Quick Insights ───────────────────────────────────────────────────────

  @Get('insights')
  async getInsight(
    @Query('insightType') insightType: string,
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: User,
  ) {
    const content = await this.aiService.getInsight(tenant.id, user.id, insightType);
    return { insightType, content };
  }
}

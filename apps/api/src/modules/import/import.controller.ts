import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile,
  HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ImportService } from './import.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, CurrentTenant } from '../../common/decorators/current-user.decorator';
import type { User, Tenant } from '@prisma/client';

@ApiTags('import')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('import')
export class ImportController {
  constructor(private importService: ImportService) {}

  /**
   * Preview a file without saving (returns parsed trades + duplicate count)
   */
  @Post('preview')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async preview(
    @UploadedFile() file: Express.Multer.File,
    @Body('source') source: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const result = await this.importService.parseFile(file.buffer, file.originalname, source ?? 'mt4_html');
    return {
      totalRows: result.totalRows,
      duplicates: result.duplicates,
      new: result.totalRows - result.duplicates,
      preview: result.trades.slice(0, 5).map(t => ({
        symbol: t.symbol,
        direction: t.direction,
        lots: t.lots,
        openedAt: t.openedAt,
        closedAt: t.closedAt,
        grossPnl: t.grossPnl,
      })),
    };
  }

  /**
   * Upload and import a file into the database
   */
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('source') source: string,
    @Body('accountId') accountId: string,
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: User,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!accountId) throw new BadRequestException('accountId is required');

    return this.importService.importTrades(
      tenant.id,
      user.id,
      accountId,
      file.buffer,
      file.originalname,
      source ?? 'mt4_html',
    );
  }

  /**
   * List import history
   */
  @Get('jobs')
  listJobs(@CurrentTenant() tenant: Tenant, @CurrentUser() user: User) {
    return this.importService.listJobs(tenant.id, user.id);
  }

  /**
   * Get a specific import job
   */
  @Get('jobs/:id')
  getJob(@Param('id') id: string, @CurrentTenant() tenant: Tenant) {
    return this.importService.getJob(id, tenant.id);
  }
}

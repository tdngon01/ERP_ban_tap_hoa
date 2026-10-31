import { Controller, Get, Post, Body, Query, Res, Inject } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Response } from 'express';

@Controller('api/settings')
export class SettingsController {
  constructor(@Inject(SettingsService) private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Post()
  async updateSettings(@Body() body: any) {
    return this.settingsService.updateSettings(body);
  }

  @Post('backup')
  async createBackup() {
    return this.settingsService.createDatabaseBackup();
  }

  @Get('backups')
  async listBackups() {
    return this.settingsService.listBackups();
  }

  @Get('export/csv')
  async exportCsv(@Query('type') type: 'orders' | 'inventory' | 'debt', @Res() res: Response) {
    const csvContent = await this.settingsService.exportReportCsv(type || 'orders');
    const filename = `bao_cao_${type || 'don_hang'}_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  }
}

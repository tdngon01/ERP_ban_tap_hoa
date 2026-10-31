import { Controller, Get, Post, Body, Query, Inject } from '@nestjs/common';
import { GoogleSheetsService } from './google-sheets.service';

@Controller('api/google-sheets')
export class GoogleSheetsController {
  constructor(@Inject(GoogleSheetsService) private readonly googleSheetsService: GoogleSheetsService) {}

  @Get('config')
  async getConfig() {
    return this.googleSheetsService.getConfig();
  }

  @Post('config')
  async updateConfig(@Body() body: any) {
    return this.googleSheetsService.updateConfig(body);
  }

  @Get('template-guide')
  getGuide() {
    return this.googleSheetsService.getTemplateInstructions();
  }

  @Post('sync/products')
  async syncProducts(@Body() body: { spreadsheetId?: string }) {
    return this.googleSheetsService.syncProductsFromSheet(body?.spreadsheetId);
  }

  @Post('sync/outlets')
  async syncOutlets(@Body() body: { spreadsheetId?: string }) {
    return this.googleSheetsService.syncOutletsFromSheet(body?.spreadsheetId);
  }

  @Get('export/orders')
  async exportOrders() {
    return this.googleSheetsService.exportOrdersToSheet();
  }

  @Get('export/inventory')
  async exportInventory() {
    return this.googleSheetsService.exportInventoryToSheet();
  }
}


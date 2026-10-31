import { Controller, Get, Post, Body, Inject } from '@nestjs/common';
import { DebtService } from './debt.service';

@Controller('api/debt')
export class DebtController {
  constructor(@Inject(DebtService) private readonly debtService: DebtService) {}

  @Get('ledger')
  async getLedger() {
    return this.debtService.getLedger();
  }

  @Post('vietqr/generate')
  async generateVietQr(@Body() body: any) {
    return this.debtService.generateVietQr(body);
  }

  @Post('payment')
  async recordPayment(@Body() body: any) {
    return this.debtService.recordPayment(body);
  }

  @Get('receipts')
  async getReceipts() {
    return this.debtService.getReceipts();
  }
}


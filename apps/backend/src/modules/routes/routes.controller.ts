import { Controller, Get, Post, Body, Query, Inject } from '@nestjs/common';
import { RoutesService } from './routes.service';

@Controller('api/routes')
export class RoutesController {
  constructor(@Inject(RoutesService) private readonly routesService: RoutesService) {}

  @Get()
  async findAll() {
    return this.routesService.findAll();
  }

  @Get('mcp/today')
  async getTodayMcp(
    @Query('dayOfWeek') dayOfWeek?: string,
    @Query('salesRepName') salesRepName?: string,
  ) {
    return this.routesService.getTodayMcp(dayOfWeek, salesRepName);
  }

  @Post('checkin')
  async checkIn(@Body() body: any) {
    return this.routesService.checkIn(body);
  }

  @Post('checkout')
  async checkOut(@Body() body: any) {
    return this.routesService.checkOut(body);
  }

  @Get('visits')
  async getVisits(@Query('limit') limit?: number) {
    return this.routesService.getVisitHistory(limit ? Number(limit) : 20);
  }
}


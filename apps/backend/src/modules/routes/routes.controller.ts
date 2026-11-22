import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { RoutesService } from './routes.service';

@Controller('api/routes')
export class RoutesController {
  constructor(@Inject(RoutesService) private readonly routesService: RoutesService) {}

  @Get()
  async findAll() {
    return this.routesService.findAll();
  }

  @Post()
  async createRoute(@Body() body: {
    code?: string;
    name: string;
    dayOfWeek: string;
    salesRepName?: string;
  }) {
    return this.routesService.createRoute(body);
  }

  @Put(':id')
  async updateRoute(@Param('id') id: string, @Body() body: any) {
    return this.routesService.updateRoute(id, body);
  }

  @Delete(':id')
  async deleteRoute(@Param('id') id: string) {
    return this.routesService.deleteRoute(id);
  }

  @Post(':id/assign-outlets')
  async assignOutlets(@Param('id') id: string, @Body() body: { outletIds: string[] }) {
    return this.routesService.assignOutletsToRoute(id, body.outletIds || []);
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


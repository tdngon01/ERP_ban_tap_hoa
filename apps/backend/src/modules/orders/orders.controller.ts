import { Controller, Get, Post, Put, Body, Param, Query, Inject } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('api/orders')
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Query('status') status?: string, @Query('outletId') outletId?: string) {
    return this.ordersService.findAll(status, outletId);
  }

  @Get('promotions')
  async getPromotions() {
    return this.ordersService.getPromotions();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.ordersService.createOrder(body);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(id, body.status);
  }
}


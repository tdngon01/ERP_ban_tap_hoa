import { Controller, Get, Post, Body, Query, Param, Inject } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('api/inventory')
export class InventoryController {
  constructor(@Inject(InventoryService) private readonly inventoryService: InventoryService) {}

  @Get('warehouses')
  async getWarehouses() {
    return this.inventoryService.getWarehouses();
  }

  @Get('lots')
  async getLots(
    @Query('warehouseId') warehouseId?: string,
    @Query('fefoFilter') fefoFilter?: string,
  ) {
    return this.inventoryService.findAllLots(warehouseId, fefoFilter);
  }

  @Post('fefo/recommend')
  async recommendFefo(
    @Body() body: { productId: string; requiredBaseQty: number; warehouseId?: string },
  ) {
    return this.inventoryService.recommendFefoAllocation(
      body.productId,
      body.requiredBaseQty,
      body.warehouseId,
    );
  }

  @Post('inbound')
  async inboundLot(@Body() body: any) {
    return this.inventoryService.createInboundLot(body);
  }

  @Get('picking-list')
  async getPickingList(@Query('status') status?: string) {
    return this.inventoryService.getPickingList(status);
  }

  // Quản lý Tồn kho xe & Soạn hàng lên xe (Van Sales Stock)
  @Get('van-stock')
  async getVanStock(@Query('salesRepName') salesRepName?: string) {
    return this.inventoryService.getVanStock(salesRepName);
  }

  @Post('van-stock/load')
  async loadItemsToVan(@Body() body: any) {
    return this.inventoryService.loadItemsToVan(body);
  }

  // Quản lý Ghi chú Nợ hàng / Giao bổ sung cho khách
  @Get('backorders')
  async getBackorders(
    @Query('status') status?: string,
    @Query('salesRepName') salesRepName?: string,
  ) {
    return this.inventoryService.getBackorderReminders(status, salesRepName);
  }

  @Post('backorders')
  async createBackorder(@Body() body: any) {
    return this.inventoryService.createBackorderReminder(body);
  }

  @Post('backorders/:id/resolve')
  async resolveBackorder(@Param('id') id: string) {
    return this.inventoryService.resolveBackorderReminder(id);
  }
}


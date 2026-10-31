import { Controller, Get, Post, Body, Query, Inject } from '@nestjs/common';
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
}


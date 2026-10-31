import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getWarehouses() {
    return this.prisma.warehouse.findMany({
      include: {
        _count: {
          select: { inventoryLots: true },
        },
      },
    });
  }

  /**
   * Danh sách Lô hàng tồn kho kèm phân loại cảnh báo FEFO
   */
  async findAllLots(warehouseId?: string, fefoFilter?: string) {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;

    const lots = await this.prisma.inventoryLot.findMany({
      where,
      include: {
        product: {
          include: { uoms: true },
        },
        warehouse: true,
      },
      orderBy: { expiryDate: 'asc' }, // Sắp xếp FEFO: Hết hạn trước lên đầu
    });

    const now = new Date();
    const evaluatedLots = lots.map((lot) => {
      const diffTime = new Date(lot.expiryDate).getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let fefoStatus: 'CRITICAL' | 'WARNING' | 'SAFE' | 'EXPIRED' = 'SAFE';
      let fefoLabel = 'An toàn';

      if (daysRemaining < 0) {
        fefoStatus = 'EXPIRED';
        fefoLabel = 'Đã hết hạn';
      } else if (daysRemaining <= 30) {
        fefoStatus = 'CRITICAL';
        fefoLabel = `Cận date (${daysRemaining} ngày) - Ưu tiên xuất!`;
      } else if (daysRemaining <= 60) {
        fefoStatus = 'WARNING';
        fefoLabel = `Cảnh báo (${daysRemaining} ngày)`;
      } else {
        fefoStatus = 'SAFE';
        fefoLabel = `Còn ${daysRemaining} ngày`;
      }

      return {
        ...lot,
        daysRemaining,
        fefoStatus,
        fefoLabel,
      };
    });

    if (fefoFilter) {
      return evaluatedLots.filter((l) => l.fefoStatus === fefoFilter);
    }

    return evaluatedLots;
  }

  /**
   * Thuật toán FEFO (First Expired, First Out):
   * Tự động đề xuất bốc hàng từ lô có Hạn sử dụng gần nhất còn khả dụng
   */
  async recommendFefoAllocation(productId: string, requiredBaseQty: number, warehouseId?: string) {
    const where: any = {
      productId,
      availableQty: { gt: 0 },
    };
    if (warehouseId) where.warehouseId = warehouseId;

    const availableLots = await this.prisma.inventoryLot.findMany({
      where,
      orderBy: { expiryDate: 'asc' }, // FEFO sort
      include: { warehouse: true },
    });

    let remainingNeeded = requiredBaseQty;
    const allocations: Array<{
      lotId: string;
      batchCode: string;
      warehouseName: string;
      expiryDate: Date;
      allocatedQty: number;
    }> = [];

    for (const lot of availableLots) {
      if (remainingNeeded <= 0) break;
      const canTake = Math.min(lot.availableQty, remainingNeeded);
      allocations.push({
        lotId: lot.id,
        batchCode: lot.batchCode,
        warehouseName: lot.warehouse.name,
        expiryDate: lot.expiryDate,
        allocatedQty: canTake,
      });
      remainingNeeded -= canTake;
    }

    if (remainingNeeded > 0) {
      throw new BadRequestException(
        `Không đủ tồn kho khả dụng! Còn thiếu ${remainingNeeded} đơn vị cơ sở cho sản phẩm này.`
      );
    }

    return allocations;
  }

  /**
   * Nhập kho PO mới kèm số lô và hạn sử dụng
   */
  async createInboundLot(data: {
    warehouseId: string;
    productId: string;
    batchCode: string;
    manufactureDate: string;
    expiryDate: string;
    quantity: number;
    uomName?: string;
    notes?: string;
  }) {
    // Quy đổi nếu nhập theo Thùng / Hộp
    let baseQty = data.quantity;
    if (data.uomName) {
      const uom = await this.prisma.productUom.findUnique({
        where: {
          productId_uomName: { productId: data.productId, uomName: data.uomName },
        },
      });
      if (uom) {
        baseQty = data.quantity * uom.conversionFactor;
      }
    }

    // Upsert Lô tồn kho
    const lot = await this.prisma.inventoryLot.upsert({
      where: {
        warehouseId_productId_batchCode: {
          warehouseId: data.warehouseId,
          productId: data.productId,
          batchCode: data.batchCode,
        },
      },
      update: {
        physicalQty: { increment: baseQty },
        availableQty: { increment: baseQty },
      },
      create: {
        warehouseId: data.warehouseId,
        productId: data.productId,
        batchCode: data.batchCode,
        manufactureDate: new Date(data.manufactureDate),
        expiryDate: new Date(data.expiryDate),
        physicalQty: baseQty,
        availableQty: baseQty,
        reservedQty: 0,
      },
    });

    // Ghi nhật ký dịch chuyển kho
    await this.prisma.stockMovement.create({
      data: {
        warehouseId: data.warehouseId,
        productId: data.productId,
        batchCode: data.batchCode,
        type: 'INBOUND_PO',
        quantity: baseQty,
        uomName: data.uomName,
        notes: data.notes || 'Nhập kho mua hàng từ nhà máy',
      },
    });

    return lot;
  }
}


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

  /**
   * Bảng kê Soạn hàng Tổng hợp (Picking List) cho Thủ Kho & Xe Tải Giao Hàng
   */
  async getPickingList(orderStatus = 'CONFIRMED') {
    const orders = await this.prisma.salesOrder.findMany({
      where: {
        status: orderStatus,
      },
      include: {
        outlet: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summaryMap = new Map<string, {
      productId: string;
      productCode: string;
      productName: string;
      uomName: string;
      totalQty: number;
      allocatedBatch: string;
      outletBreakdown: Array<{ orderCode: string; outletName: string; quantity: number }>;
    }>();

    for (const ord of orders) {
      for (const item of ord.items) {
        const key = `${item.productId}_${item.uomName}_${item.allocatedBatch || 'DEFAULT'}`;
        if (!summaryMap.has(key)) {
          summaryMap.set(key, {
            productId: item.productId,
            productCode: item.product.code,
            productName: item.product.name,
            uomName: item.uomName,
            totalQty: 0,
            allocatedBatch: item.allocatedBatch || 'Lô Tự Động',
            outletBreakdown: [],
          });
        }

        const entry = summaryMap.get(key)!;
        entry.totalQty += item.quantity;
        entry.outletBreakdown.push({
          orderCode: ord.orderCode,
          outletName: ord.outlet.name,
          quantity: item.quantity,
        });
      }
    }

    return {
      totalOrdersCount: orders.length,
      orders,
      pickingItems: Array.from(summaryMap.values()),
    };
  }

  /**
   * Lấy danh sách tồn kho thực tế trên xe tải đi bán (Van Stock)
   */
  async getVanStock(salesRepName = 'Nguyễn Văn Hùng') {
    let vanWarehouse = await this.prisma.warehouse.findFirst({
      where: { type: 'VAN' },
      include: {
        inventoryLots: {
          include: { product: { include: { uoms: true } } },
          where: { physicalQty: { gt: 0 } },
        },
      },
    });

    if (!vanWarehouse) {
      vanWarehouse = await this.prisma.warehouse.create({
        data: {
          code: 'VAN-XE-01',
          name: 'Kho Xe Tải Van Sales 01 (Biển số 51D-889.21)',
          type: 'VAN',
          assignedSalesId: salesRepName,
        },
        include: {
          inventoryLots: {
            include: { product: { include: { uoms: true } } },
          },
        },
      });
    }

    // Nhóm số lượng theo từng mặt hàng và quy đổi ra Thùng / Hộp
    const stockMap = new Map<string, {
      productId: string;
      productCode: string;
      productName: string;
      baseUom: string;
      totalBaseQty: number;
      availableCases: number;
      availableBoxes: number;
      availablePacks: number;
      lots: Array<{ batchCode: string; expiryDate: Date; qty: number }>;
    }>();

    for (const lot of vanWarehouse.inventoryLots) {
      if (!stockMap.has(lot.productId)) {
        stockMap.set(lot.productId, {
          productId: lot.productId,
          productCode: lot.product.code,
          productName: lot.product.name,
          baseUom: lot.product.baseUom,
          totalBaseQty: 0,
          availableCases: 0,
          availableBoxes: 0,
          availablePacks: 0,
          lots: [],
        });
      }

      const item = stockMap.get(lot.productId)!;
      item.totalBaseQty += lot.physicalQty;
      item.lots.push({
        batchCode: lot.batchCode,
        expiryDate: lot.expiryDate,
        qty: lot.physicalQty,
      });

      // Tính số Thùng, Hộp
      const caseUom = lot.product.uoms.find((u) => u.uomName === 'Thùng');
      const boxUom = lot.product.uoms.find((u) => u.uomName === 'Hộp' || u.uomName === 'Dây');

      if (caseUom && caseUom.conversionFactor > 0) {
        item.availableCases = Math.floor(item.totalBaseQty / caseUom.conversionFactor);
      }
      if (boxUom && boxUom.conversionFactor > 0) {
        item.availableBoxes = Math.floor(item.totalBaseQty / boxUom.conversionFactor);
      }
      item.availablePacks = Math.round(item.totalBaseQty);
    }

    return {
      vanWarehouse: {
        id: vanWarehouse.id,
        code: vanWarehouse.code,
        name: vanWarehouse.name,
        assignedSales: salesRepName,
      },
      items: Array.from(stockMap.values()),
    };
  }

  /**
   * Soạn hàng bốc lên xe đầu ngày (Load stock to Van)
   */
  async loadItemsToVan(data: {
    items: Array<{ productId: string; uomName: string; quantity: number }>;
    salesRepName?: string;
    notes?: string;
  }) {
    let vanWarehouse = await this.prisma.warehouse.findFirst({
      where: { type: 'VAN' },
    });
    if (!vanWarehouse) {
      vanWarehouse = await this.prisma.warehouse.create({
        data: {
          code: 'VAN-XE-01',
          name: 'Kho Xe Tải Van Sales 01 (Biển số 51D-889.21)',
          type: 'VAN',
          assignedSalesId: data.salesRepName || 'Nguyễn Văn Hùng',
        },
      });
    }

    const centralWarehouse = await this.prisma.warehouse.findFirst({
      where: { type: 'CENTRAL' },
    });

    for (const item of data.items) {
      if (item.quantity <= 0) continue;

      // Tìm hệ số quy đổi
      const uom = await this.prisma.productUom.findUnique({
        where: {
          productId_uomName: { productId: item.productId, uomName: item.uomName },
        },
      });
      const conversion = uom?.conversionFactor || 1;
      const baseQty = item.quantity * conversion;

      // Tìm lô hàng cận date từ kho tổng để bốc lên xe theo FEFO
      const availableLots = await this.prisma.inventoryLot.findMany({
        where: {
          warehouseId: centralWarehouse?.id,
          productId: item.productId,
          availableQty: { gt: 0 },
        },
        orderBy: { expiryDate: 'asc' },
      });

      let remainingToLoad = baseQty;
      for (const srcLot of availableLots) {
        if (remainingToLoad <= 0) break;
        const takeQty = Math.min(srcLot.availableQty, remainingToLoad);

        // Trừ kho tổng
        await this.prisma.inventoryLot.update({
          where: { id: srcLot.id },
          data: {
            physicalQty: { decrement: takeQty },
            availableQty: { decrement: takeQty },
          },
        });

        // Tăng kho xe
        await this.prisma.inventoryLot.upsert({
          where: {
            warehouseId_productId_batchCode: {
              warehouseId: vanWarehouse.id,
              productId: item.productId,
              batchCode: srcLot.batchCode,
            },
          },
          update: {
            physicalQty: { increment: takeQty },
            availableQty: { increment: takeQty },
          },
          create: {
            warehouseId: vanWarehouse.id,
            productId: item.productId,
            batchCode: srcLot.batchCode,
            manufactureDate: srcLot.manufactureDate,
            expiryDate: srcLot.expiryDate,
            physicalQty: takeQty,
            availableQty: takeQty,
          },
        });

        // Ghi lịch sử chuyển kho lên xe
        await this.prisma.stockMovement.create({
          data: {
            warehouseId: vanWarehouse.id,
            productId: item.productId,
            batchCode: srcLot.batchCode,
            type: 'TRANSFER_VAN',
            quantity: takeQty,
            uomName: item.uomName,
            notes: data.notes || `Soạn hàng lên xe cho ${data.salesRepName || 'Sale thị trường'}`,
          },
        });

        remainingToLoad -= takeQty;
      }
    }

    return this.getVanStock(data.salesRepName);
  }

  /**
   * Lấy danh sách ghi nhớ Nợ Hàng / Giao Bổ Sung cho khách
   */
  async getBackorderReminders(status?: string, salesRepName?: string) {
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (salesRepName) where.salesRepName = salesRepName;

    return this.prisma.backorderReminder.findMany({
      where,
      include: {
        outlet: true,
        product: {
          include: { uoms: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Tạo phiếu ghi chú nợ hàng / giao bù khi xe bị thiếu hàng
   */
  async createBackorderReminder(data: {
    outletId: string;
    productId: string;
    uomName: string;
    quantity: number;
    promisedDate?: string;
    reason?: string;
    salesRepName?: string;
    notes?: string;
  }) {
    return this.prisma.backorderReminder.create({
      data: {
        outletId: data.outletId,
        productId: data.productId,
        uomName: data.uomName || 'Thùng',
        quantity: data.quantity,
        promisedDate: data.promisedDate ? new Date(data.promisedDate) : new Date(Date.now() + 86400000), // Mặc định ngày mai
        reason: data.reason || 'Hết hàng trên xe lúc giao',
        salesRepName: data.salesRepName || 'Nguyễn Văn Hùng',
        notes: data.notes,
        status: 'PENDING',
      },
      include: {
        outlet: true,
        product: true,
      },
    });
  }

  /**
   * Đánh dấu đã giao bổ sung / giao bù thành công cho khách
   */
  async resolveBackorderReminder(id: string) {
    return this.prisma.backorderReminder.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
      include: {
        outlet: true,
        product: true,
      },
    });
  }
}



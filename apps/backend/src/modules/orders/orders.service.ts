import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(InventoryService) private readonly inventoryService: InventoryService,
  ) {}

  async getPromotions() {
    return this.prisma.promotionRule.findMany({
      where: { isActive: true },
    });
  }

  async findAll(status?: string, outletId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (outletId) where.outletId = outletId;

    return this.prisma.salesOrder.findMany({
      where,
      include: {
        outlet: true,
        items: {
          include: { product: true },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: {
        outlet: true,
        items: {
          include: { product: true },
        },
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }

  /**
   * Bộ máy Khuyến Mãi (Promotion Engine):
   * Tự động tính toán Mua X tặng Y và Chiết khấu bậc thang theo giá trị đơn hàng
   */
  async evaluatePromotions(
    items: Array<{ productId: string; uomName: string; quantity: number }>,
    subTotal: number,
  ) {
    const activePromos = await this.prisma.promotionRule.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    const giftItems: Array<{
      productId: string;
      uomName: string;
      quantity: number;
      baseQty: number;
      unitPrice: number;
      totalPrice: number;
      isGiftItem: boolean;
      promotionRuleId: string;
    }> = [];

    let discountAmount = 0;

    for (const promo of activePromos) {
      // 1. Khuyến mãi Mua X tặng Y
      if (promo.type === 'BUY_X_GET_Y' && promo.buyProductId && promo.giftProductId) {
        const matchingItem = items.find(
          (i) => i.productId === promo.buyProductId && (!promo.buyUom || i.uomName === promo.buyUom),
        );

        if (matchingItem && matchingItem.quantity >= (promo.buyQty || 1)) {
          const promoMultipliers = Math.floor(matchingItem.quantity / (promo.buyQty || 1));
          const freeQty = promoMultipliers * (promo.giftQty || 1);

          // Lấy thông tin UoM của hàng tặng
          const giftUom = await this.prisma.productUom.findUnique({
            where: {
              productId_uomName: {
                productId: promo.giftProductId,
                uomName: promo.giftUom || 'Gói',
              },
            },
          });

          giftItems.push({
            productId: promo.giftProductId,
            uomName: promo.giftUom || 'Gói',
            quantity: freeQty,
            baseQty: freeQty * (giftUom?.conversionFactor || 1),
            unitPrice: 0, // Hàng tặng giá 0đ
            totalPrice: 0,
            isGiftItem: true,
            promotionRuleId: promo.id,
          });
        }
      }

      // 2. Chiết khấu theo giá trị đơn hàng
      if (promo.type === 'ORDER_DISCOUNT_PERCENT' && promo.minOrderAmount) {
        if (subTotal >= promo.minOrderAmount && promo.discountPercent) {
          discountAmount += (subTotal * promo.discountPercent) / 100;
        }
      }
    }

    return {
      giftItems,
      discountAmount,
    };
  }

  /**
   * Tạo Đơn hàng mới (Pre-sales / Van sales) kèm phân bổ Lô FEFO và Giữ chỗ tồn kho (Soft Reservation)
   */
  async createOrder(data: {
    outletId: string;
    salesRepName: string;
    orderType?: string; // PRE_SALES, VAN_SALES
    items: Array<{ productId: string; uomName: string; quantity: number }>;
    notes?: string;
  }) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: data.outletId },
    });
    if (!outlet) throw new NotFoundException('Không tìm thấy tiệm tạp hóa');

    // 1. Tính toán chi tiết các dòng hàng bán
    let subTotal = 0;
    const processedSaleItems = [];

    for (const item of data.items) {
      const uom = await this.prisma.productUom.findUnique({
        where: {
          productId_uomName: { productId: item.productId, uomName: item.uomName },
        },
      });
      if (!uom) {
        throw new BadRequestException(`Không tìm thấy đơn vị tính ${item.uomName} của sản phẩm ${item.productId}`);
      }

      const itemTotal = item.quantity * uom.price;
      const baseQty = item.quantity * uom.conversionFactor;
      subTotal += itemTotal;

      processedSaleItems.push({
        productId: item.productId,
        uomName: item.uomName,
        quantity: item.quantity,
        baseQty,
        unitPrice: uom.price,
        totalPrice: itemTotal,
        isGiftItem: false,
      });
    }

    // 2. Chạy Promotion Engine để lấy Hàng tặng KM và Chiết khấu
    const { giftItems, discountAmount } = await this.evaluatePromotions(data.items, subTotal);
    const totalAmount = Math.max(0, subTotal - discountAmount);

    // 3. Kiểm tra Hạn mức Công nợ (Credit Limit Check)
    if (outlet.currentDebt + totalAmount > outlet.creditLimit) {
      throw new BadRequestException(
        `Đơn hàng vượt quá hạn mức công nợ! Hạn mức: ${outlet.creditLimit.toLocaleString('vi-VN')}đ, Nợ hiện tại: ${outlet.currentDebt.toLocaleString('vi-VN')}đ, Đơn mới: ${totalAmount.toLocaleString('vi-VN')}đ.`
      );
    }

    // 4. Sinh mã đơn hàng
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `ORD-${dateStr}-${randomSuffix}`;

    // 5. Gộp hàng bán và hàng tặng để phân bổ Lô FEFO và Giữ chỗ tồn kho (Soft Reservation)
    const allOrderItems = [...processedSaleItems, ...giftItems];
    const finalItemsWithBatches = [];

    for (const line of allOrderItems) {
      // Phân bổ lô theo FEFO (Lô gần hết hạn nhất được xuất trước)
      let allocatedBatch = 'LOT-DEFAULT';
      try {
        const allocations = await this.inventoryService.recommendFefoAllocation(
          line.productId,
          line.baseQty,
        );
        if (allocations.length > 0) {
          allocatedBatch = allocations[0].batchCode;
          // Giữ chỗ tồn kho (Soft Reservation)
          await this.prisma.inventoryLot.update({
            where: { id: allocations[0].lotId },
            data: {
              reservedQty: { increment: line.baseQty },
              availableQty: { decrement: line.baseQty },
            },
          });
        }
      } catch (err) {
        // Nếu là hàng tặng hoặc môi trường demo, gán mã lô tượng trưng
        allocatedBatch = 'LOT-AUTO-ALLOC';
      }

      finalItemsWithBatches.push({
        ...line,
        allocatedBatch,
      });
    }

    // 6. Lưu Đơn hàng vào CSDL
    const order = await this.prisma.salesOrder.create({
      data: {
        orderCode,
        outletId: data.outletId,
        salesRepName: data.salesRepName,
        orderType: data.orderType || 'PRE_SALES',
        status: data.orderType === 'VAN_SALES' ? 'DELIVERED' : 'CONFIRMED',
        paymentStatus: 'UNPAID',
        subTotal,
        discountAmount,
        totalAmount,
        notes: data.notes,
        items: {
          create: finalItemsWithBatches.map((i) => ({
            productId: i.productId,
            uomName: i.uomName,
            quantity: i.quantity,
            baseQty: i.baseQty,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            isGiftItem: i.isGiftItem,
            promotionRuleId: (i as any).promotionRuleId,
            allocatedBatch: i.allocatedBatch,
          })),
        },
      },
      include: {
        outlet: true,
        items: {
          include: { product: true },
        },
      },
    });

    // 7. Cập nhật nợ gối đầu của tiệm tạp hóa
    await this.prisma.outlet.update({
      where: { id: data.outletId },
      data: {
        currentDebt: { increment: totalAmount },
      },
    });

    return {
      success: true,
      message: `Tạo đơn hàng ${orderCode} thành công! Đã tự động phân bổ lô theo FEFO và áp dụng ${giftItems.length} khuyến mãi.`,
      order,
    };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.salesOrder.update({
      where: { id },
      data: { status },
    });
  }
}


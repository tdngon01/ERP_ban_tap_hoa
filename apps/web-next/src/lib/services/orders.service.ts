import prisma from '../prisma';
import { inventoryService } from './inventory.service';

export const ordersService = {
  async getPromotions() {
    return prisma.promotionRule.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createPromotion(data: {
    code: string;
    name: string;
    type: string;
    buyProductId?: string;
    buyUom?: string;
    buyQty?: number;
    giftProductId?: string;
    giftUom?: string;
    giftQty?: number;
    minOrderAmount?: number;
    discountPercent?: number;
    startDate?: string;
    endDate?: string;
  }) {
    return prisma.promotionRule.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        buyProductId: data.buyProductId,
        buyUom: data.buyUom,
        buyQty: data.buyQty,
        giftProductId: data.giftProductId,
        giftUom: data.giftUom,
        giftQty: data.giftQty,
        minOrderAmount: data.minOrderAmount,
        discountPercent: data.discountPercent,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : new Date(Date.now() + 30 * 86400000),
      },
    });
  },

  async updatePromotion(id: string, data: any) {
    return prisma.promotionRule.update({
      where: { id },
      data,
    });
  },

  async deletePromotion(id: string) {
    return prisma.promotionRule.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async findAll(status?: string, outletId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (outletId) where.outletId = outletId;

    return prisma.salesOrder.findMany({
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
  },

  async findOne(id: string) {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        outlet: true,
        items: {
          include: { product: true },
        },
        payments: true,
      },
    });
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    return order;
  },

  async evaluatePromotions(
    items: Array<{ productId: string; uomName: string; quantity: number }>,
    subTotal: number,
  ) {
    const activePromos = await prisma.promotionRule.findMany({
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
      if (promo.type === 'BUY_X_GET_Y' && promo.buyProductId && promo.giftProductId) {
        const matchingItem = items.find(
          (i) => i.productId === promo.buyProductId && (!promo.buyUom || i.uomName === promo.buyUom),
        );

        if (matchingItem && matchingItem.quantity >= (promo.buyQty || 1)) {
          const promoMultipliers = Math.floor(matchingItem.quantity / (promo.buyQty || 1));
          const freeQty = promoMultipliers * (promo.giftQty || 1);

          const giftUom = await prisma.productUom.findUnique({
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
            unitPrice: 0,
            totalPrice: 0,
            isGiftItem: true,
            promotionRuleId: promo.id,
          });
        }
      }

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
  },

  async createOrder(data: {
    outletId: string;
    salesRepName: string;
    orderType?: string;
    items: Array<{ productId: string; uomName: string; quantity: number }>;
    notes?: string;
  }) {
    const outlet = await prisma.outlet.findUnique({
      where: { id: data.outletId },
    });
    if (!outlet) throw new Error('Không tìm thấy tiệm tạp hóa');

    let subTotal = 0;
    const processedSaleItems = [];

    for (const item of data.items) {
      const uom = await prisma.productUom.findUnique({
        where: {
          productId_uomName: { productId: item.productId, uomName: item.uomName },
        },
      });
      if (!uom) {
        throw new Error(`Không tìm thấy đơn vị tính ${item.uomName} của sản phẩm ${item.productId}`);
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

    const { giftItems, discountAmount } = await this.evaluatePromotions(data.items, subTotal);
    const totalAmount = Math.max(0, subTotal - discountAmount);

    if (outlet.currentDebt + totalAmount > outlet.creditLimit) {
      throw new Error(
        `Đơn hàng vượt quá hạn mức công nợ! Hạn mức: ${outlet.creditLimit.toLocaleString('vi-VN')}đ, Nợ hiện tại: ${outlet.currentDebt.toLocaleString('vi-VN')}đ, Đơn mới: ${totalAmount.toLocaleString('vi-VN')}đ.`
      );
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `ORD-${dateStr}-${randomSuffix}`;

    const allOrderItems = [...processedSaleItems, ...giftItems];
    const finalItemsWithBatches = [];

    for (const line of allOrderItems) {
      let allocatedBatch = line.isGiftItem ? 'LOT-KHUYEN-MAI' : 'LOT-CHUA-PHAN-BO';
      try {
        const allocations = await inventoryService.recommendFefoAllocation(
          line.productId,
          line.baseQty,
        );
        if (allocations.length > 0) {
          allocatedBatch = allocations[0].batchCode;
          await prisma.inventoryLot.update({
            where: { id: allocations[0].lotId },
            data: {
              reservedQty: { increment: line.baseQty },
              availableQty: { decrement: line.baseQty },
            },
          });
        }
      } catch (err: any) {
        if (data.orderType === 'VAN_SALES' && !line.isGiftItem) {
          throw new Error(`Xe không đủ tồn kho khả dụng để xuất bán mặt hàng này ngay: ${err.message}`);
        }
        // Với đơn đặt trước (Pre-sales), đánh dấu chờ bổ sung tồn kho
        allocatedBatch = line.isGiftItem ? 'LOT-KHUYEN-MAI' : 'CHO-BO-SUNG-KHO';
      }

      finalItemsWithBatches.push({
        ...line,
        allocatedBatch,
      });
    }

    const order = await prisma.salesOrder.create({
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

    await prisma.outlet.update({
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
  },

  async createReturnOrder(data: {
    outletId: string;
    salesRepName?: string;
    reason: string;
    notes?: string;
    items: Array<{
      productId: string;
      uomName: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    const outlet = await prisma.outlet.findUnique({
      where: { id: data.outletId },
    });
    if (!outlet) throw new Error('Không tìm thấy điểm bán / tiệm tạp hóa');

    if (!data.items || data.items.length === 0) {
      throw new Error('Vui lòng chọn ít nhất 1 sản phẩm cần đổi trả');
    }

    const returnTotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const returnCode = `RET-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const prevDebt = outlet.currentDebt;
    const newDebt = Math.max(0, prevDebt - returnTotal);
    await prisma.outlet.update({
      where: { id: data.outletId },
      data: { currentDebt: newDebt },
    });

    const receipt = await prisma.paymentReceipt.create({
      data: {
        receiptCode: returnCode,
        outletId: data.outletId,
        amount: returnTotal,
        paymentMethod: 'RETURN_REFUND',
        status: 'CONFIRMED_BY_ACCOUNTANT',
        notes: `Phiếu đổi trả / thu hồi hàng lỗi: ${data.reason}. Giảm trừ công nợ từ ${prevDebt.toLocaleString('vi-VN')}đ xuống ${newDebt.toLocaleString('vi-VN')}đ. Ghi chú: ${data.notes || 'Không có'}`,
      },
    });

    const targetWarehouse =
      (await prisma.warehouse.findFirst({
        where: { type: 'PROMOTION' },
      })) || (await prisma.warehouse.findFirst());

    if (targetWarehouse) {
      for (const item of data.items) {
        await prisma.stockMovement.create({
          data: {
            warehouseId: targetWarehouse.id,
            productId: item.productId,
            batchCode: 'LOT-RETURNED',
            type: data.reason.includes('date') ? 'RETURN_EXPIRED' : 'ADJUSTMENT_DAMAGE',
            quantity: item.quantity,
            uomName: item.uomName,
            refOrderCode: returnCode,
            notes: `Thu hồi từ ${outlet.name} (${outlet.code}) - ${data.reason}`,
          },
        });
      }
    }

    return {
      success: true,
      returnCode,
      returnTotal,
      prevDebt,
      newDebt,
      receipt,
      message: `Đã tạo phiếu trả hàng ${returnCode} và giảm trừ ${returnTotal.toLocaleString('vi-VN')}đ công nợ cho tiệm ${outlet.name}!`,
    };
  },

  async getReturnHistory() {
    return prisma.paymentReceipt.findMany({
      where: { paymentMethod: 'RETURN_REFUND' },
      include: { outlet: true },
      orderBy: { receiptDate: 'desc' },
    });
  },

  async updateStatus(id: string, status: string) {
    return prisma.salesOrder.update({
      where: { id },
      data: { status },
    });
  },

  async cancelOrder(id: string, reason?: string) {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { outlet: true, items: true },
    });
    if (!order) throw new Error('Không tìm thấy đơn hàng cần hủy');
    if (order.status === 'CANCELLED') throw new Error('Đơn hàng này đã được hủy trước đó');

    // 1. Hoàn trả tồn kho giữ chỗ (Un-reserve)
    for (const item of order.items) {
      if (item.allocatedBatch) {
        const lot = await prisma.inventoryLot.findFirst({
          where: {
            productId: item.productId,
            batchCode: item.allocatedBatch,
          },
        });
        if (lot) {
          await prisma.inventoryLot.update({
            where: { id: lot.id },
            data: {
              reservedQty: { decrement: Math.min(lot.reservedQty, item.baseQty) },
              availableQty: { increment: item.baseQty },
            },
          });
        }
      }
    }

    // 2. Giảm công nợ chưa thanh toán tương ứng cho tiệm
    const unpaidAmount = Math.max(0, order.totalAmount - order.paidAmount);
    if (unpaidAmount > 0 && order.outlet) {
      await prisma.outlet.update({
        where: { id: order.outletId },
        data: {
          currentDebt: { decrement: Math.min(order.outlet.currentDebt, unpaidAmount) },
        },
      });
    }

    // 3. Cập nhật trạng thái
    const updated = await prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: order.notes ? `${order.notes} | [ĐÃ HỦY: ${reason || 'Không rõ lý do'}]` : `[ĐÃ HỦY: ${reason || 'Không rõ lý do'}]`,
      },
    });

    return {
      success: true,
      message: `Đã hủy đơn hàng ${order.orderCode}, giải phóng tồn kho giữ chỗ và hoàn trả công nợ gối đầu!`,
      order: updated,
    };
  },
};

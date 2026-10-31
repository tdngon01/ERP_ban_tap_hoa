import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getMetrics() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Thống kê Đơn hàng hôm nay & Tổng doanh số
    const orders = await this.prisma.salesOrder.findMany();
    const todayOrders = orders.filter((o) => new Date(o.createdAt) >= startOfToday);

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // 2. Thống kê Điểm bán & Công nợ
    const outlets = await this.prisma.outlet.findMany();
    const totalOutlets = outlets.length;
    const totalDebt = outlets.reduce((sum, o) => sum + o.currentDebt, 0);
    const totalCreditLimit = outlets.reduce((sum, o) => sum + o.creditLimit, 0);

    // 3. Cảnh báo Lô hàng Cận date (FEFO)
    const lots = await this.prisma.inventoryLot.findMany({
      include: { product: true, warehouse: true },
      orderBy: { expiryDate: 'asc' },
    });

    let criticalNearDateLots = 0;
    let warningLots = 0;

    const nearDateLotsList = lots
      .map((lot) => {
        const daysLeft = Math.ceil(
          (new Date(lot.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24),
        );
        if (daysLeft <= 30 && daysLeft >= 0) criticalNearDateLots++;
        else if (daysLeft <= 60 && daysLeft > 30) warningLots++;

        return {
          id: lot.id,
          productName: lot.product.name,
          category: lot.product.category,
          batchCode: lot.batchCode,
          warehouseName: lot.warehouse.name,
          expiryDate: lot.expiryDate,
          daysLeft,
          availableQty: lot.availableQty,
          baseUom: lot.product.baseUom,
          status: daysLeft <= 30 ? 'CRITICAL' : daysLeft <= 60 ? 'WARNING' : 'SAFE',
        };
      })
      .filter((l) => l.daysLeft <= 60)
      .slice(0, 5);

    // 4. Tiến độ đi tuyến hôm nay
    const todayVisits = await this.prisma.storeVisit.findMany({
      where: {
        visitDate: { gte: startOfToday },
      },
    });

    const successfulOrdersVisits = todayVisits.filter((v) => v.hasOrder).length;
    const strikeRate = todayVisits.length > 0
      ? Math.round((successfulOrdersVisits / todayVisits.length) * 100)
      : 0;

    return {
      kpi: {
        todayRevenue,
        totalRevenue,
        todayOrdersCount: todayOrders.length,
        totalOrdersCount: orders.length,
        totalOutlets,
        totalDebt,
        totalCreditLimit,
        criticalNearDateCount: criticalNearDateLots,
        warningNearDateCount: warningLots,
        todayVisitsCount: todayVisits.length,
        strikeRatePercent: strikeRate,
      },
      nearDateLots: nearDateLotsList,
      recentOrders: orders.slice(0, 5),
    };
  }
}


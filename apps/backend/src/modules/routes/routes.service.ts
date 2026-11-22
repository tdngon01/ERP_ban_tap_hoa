import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RoutesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.route.findMany({
      include: {
        outlets: {
          select: {
            id: true,
            code: true,
            name: true,
            ownerName: true,
            phone: true,
            address: true,
            latitude: true,
            longitude: true,
            currentDebt: true,
          },
        },
        _count: {
          select: { visits: true },
        },
      },
    });
  }

  /**
   * Lấy lịch trình viếng thăm (MCP) trong ngày theo Thứ trong tuần
   */
  async getTodayMcp(dayOfWeek?: string, salesRepName?: string) {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = dayOfWeek || days[new Date().getDay()];

    const routes = await this.prisma.route.findMany({
      where: {
        dayOfWeek: currentDay,
        ...(salesRepName ? { salesRepName } : {}),
      },
      include: {
        outlets: {
          include: {
            visits: {
              where: {
                visitDate: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    return {
      dayOfWeek: currentDay,
      date: new Date().toLocaleDateString('vi-VN'),
      routes,
    };
  }

  /**
   * Tính khoảng cách địa lý theo công thức Haversine (đơn vị: mét)
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Bán kính Trái Đất (mét)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c * 10) / 10; // Làm tròn 1 chữ số thập phân
  }

  /**
   * Thực hiện Check-in GPS tại tiệm tạp hóa
   */
  async checkIn(data: {
    outletId: string;
    routeId?: string;
    salesRepName: string;
    latitude: number;
    longitude: number;
    storePhotoUrl?: string;
    displayPhotoUrl?: string;
    storeInventoryNotes?: string;
  }) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: data.outletId },
    });
    if (!outlet) throw new NotFoundException('Không tìm thấy điểm bán tạp hóa');

    // Tính khoảng cách lệch giữa vị trí Sale check-in và vị trí tiệm
    const distanceMeters = this.calculateHaversineDistance(
      data.latitude,
      data.longitude,
      outlet.latitude,
      outlet.longitude,
    );

    // Cho phép dung sai GPS tối đa 100 mét
    const isGpsValid = distanceMeters <= 100;

    const visit = await this.prisma.storeVisit.create({
      data: {
        outletId: data.outletId,
        routeId: data.routeId || outlet.routeId,
        salesRepName: data.salesRepName,
        checkInTime: new Date(),
        checkInLat: data.latitude,
        checkInLng: data.longitude,
        distanceMeters,
        isGpsValid,
        storePhotoUrl: data.storePhotoUrl,
        displayPhotoUrl: data.displayPhotoUrl,
        storeInventoryNotes: data.storeInventoryNotes,
      },
      include: { outlet: true },
    });

    return {
      success: true,
      message: isGpsValid
        ? `Check-in thành công! Cách tiệm ${distanceMeters}m (Hợp lệ).`
        : `Cảnh báo: Vị trí của bạn lệch ${distanceMeters}m so với tọa độ tiệm (Vượt quá 100m).`,
      visit,
    };
  }

  /**
   * Hoàn tất Check-out viếng thăm
   */
  async checkOut(data: {
    visitId: string;
    hasOrder: boolean;
    noOrderReason?: string;
    notes?: string;
  }) {
    return this.prisma.storeVisit.update({
      where: { id: data.visitId },
      data: {
        checkOutTime: new Date(),
        hasOrder: data.hasOrder,
        noOrderReason: data.noOrderReason,
        notes: data.notes,
      },
    });
  }

  /**
   * Lịch sử viếng thăm
   */
  async getVisitHistory(limit = 20) {
    return this.prisma.storeVisit.findMany({
      include: { outlet: true, route: true },
      orderBy: { checkInTime: 'desc' },
      take: limit,
    });
  }

  /**
   * Tạo Tuyến bán hàng mới
   */
  async createRoute(data: {
    code?: string;
    name: string;
    dayOfWeek: string;
    salesRepName?: string;
  }) {
    let code = data.code;
    if (!code) {
      const count = await this.prisma.route.count();
      code = `RO-${String(count + 1).padStart(3, '0')}`;
    }

    return this.prisma.route.create({
      data: {
        code,
        name: data.name,
        dayOfWeek: data.dayOfWeek,
        salesRepName: data.salesRepName || 'Nguyễn Văn Hùng',
      },
      include: { outlets: true },
    });
  }

  /**
   * Cập nhật thông tin Tuyến bán hàng
   */
  async updateRoute(id: string, data: any) {
    return this.prisma.route.update({
      where: { id },
      data: {
        name: data.name,
        dayOfWeek: data.dayOfWeek,
        salesRepName: data.salesRepName,
      },
      include: { outlets: true },
    });
  }

  /**
   * Xóa tuyến bán hàng
   */
  async deleteRoute(id: string) {
    await this.prisma.outlet.updateMany({
      where: { routeId: id },
      data: { routeId: null },
    });
    return this.prisma.route.delete({ where: { id } });
  }

  /**
   * Gán hàng loạt điểm bán vào tuyến bán hàng
   */
  async assignOutletsToRoute(routeId: string, outletIds: string[]) {
    // Bỏ gán các điểm bán cũ thuộc tuyến này nếu không còn trong danh sách
    await this.prisma.outlet.updateMany({
      where: {
        routeId,
        id: { notIn: outletIds },
      },
      data: { routeId: null },
    });

    // Gán các điểm bán trong danh sách vào tuyến này
    if (outletIds.length > 0) {
      await this.prisma.outlet.updateMany({
        where: { id: { in: outletIds } },
        data: { routeId },
      });
    }

    return this.prisma.route.findUnique({
      where: { id: routeId },
      include: { outlets: true },
    });
  }
}


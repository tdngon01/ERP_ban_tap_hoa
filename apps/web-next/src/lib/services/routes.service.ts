import prisma from '../prisma';

export const routesService = {
  async findAll() {
    return prisma.route.findMany({
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
  },

  async getTodayMcp(dayOfWeek?: string, salesRepName?: string) {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = dayOfWeek || days[new Date().getDay()];

    const routes = await prisma.route.findMany({
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
  },

  calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Mét
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c * 10) / 10;
  },

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
    const outlet = await prisma.outlet.findUnique({
      where: { id: data.outletId },
    });
    if (!outlet) throw new Error('Không tìm thấy điểm bán tạp hóa');

    const distanceMeters = this.calculateHaversineDistance(
      data.latitude,
      data.longitude,
      outlet.latitude,
      outlet.longitude,
    );

    const isGpsValid = distanceMeters <= 100;

    const visit = await prisma.storeVisit.create({
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
  },

  async checkOut(data: {
    visitId: string;
    hasOrder: boolean;
    noOrderReason?: string;
    notes?: string;
  }) {
    return prisma.storeVisit.update({
      where: { id: data.visitId },
      data: {
        checkOutTime: new Date(),
        hasOrder: data.hasOrder,
        noOrderReason: data.noOrderReason,
        notes: data.notes,
      },
    });
  },

  async getVisitHistory(limit = 20) {
    return prisma.storeVisit.findMany({
      include: { outlet: true, route: true },
      orderBy: { checkInTime: 'desc' },
      take: limit,
    });
  },

  async createRoute(data: {
    code?: string;
    name: string;
    dayOfWeek: string;
    salesRepName?: string;
  }) {
    let code = data.code;
    if (!code) {
      const count = await prisma.route.count();
      code = `RO-${String(count + 1).padStart(3, '0')}`;
    }

    return prisma.route.create({
      data: {
        code,
        name: data.name,
        dayOfWeek: data.dayOfWeek,
        salesRepName: data.salesRepName || 'Nguyễn Văn Hùng',
      },
      include: { outlets: true },
    });
  },

  async updateRoute(id: string, data: any) {
    return prisma.route.update({
      where: { id },
      data: {
        name: data.name,
        dayOfWeek: data.dayOfWeek,
        salesRepName: data.salesRepName,
      },
      include: { outlets: true },
    });
  },

  async deleteRoute(id: string) {
    await prisma.outlet.updateMany({
      where: { routeId: id },
      data: { routeId: null },
    });
    return prisma.route.delete({ where: { id } });
  },

  async assignOutletsToRoute(routeId: string, outletIds: string[]) {
    await prisma.outlet.updateMany({
      where: {
        routeId,
        id: { notIn: outletIds },
      },
      data: { routeId: null },
    });

    if (outletIds.length > 0) {
      await prisma.outlet.updateMany({
        where: { id: { in: outletIds } },
        data: { routeId },
      });
    }

    return prisma.route.findUnique({
      where: { id: routeId },
      include: { outlets: true },
    });
  },
};

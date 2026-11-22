import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OutletsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(routeId?: string, search?: string) {
    const where: any = { isActive: true };
    if (routeId) where.routeId = routeId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { ownerName: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    return this.prisma.outlet.findMany({
      where,
      include: {
        route: true,
        _count: {
          select: { orders: true, visits: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id },
      include: {
        route: true,
        visits: {
          orderBy: { visitDate: 'desc' },
          take: 5,
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { items: true },
        },
        payments: {
          orderBy: { receiptDate: 'desc' },
          take: 5,
        },
      },
    });
    if (!outlet) throw new NotFoundException('Không tìm thấy điểm bán');
    return outlet;
  }

  async create(data: {
    code?: string;
    name: string;
    ownerName: string;
    phone: string;
    address: string;
    district?: string;
    province?: string;
    latitude?: number;
    longitude?: number;
    creditLimit?: number;
    routeId?: string;
    routeCode?: string;
    tier?: string;
  }) {
    let code = data.code;
    if (!code) {
      const count = await this.prisma.outlet.count();
      code = `TH-${String(count + 1).padStart(3, '0')}`;
    }

    let routeId = data.routeId;
    if (!routeId && data.routeCode) {
      const foundRoute = await this.prisma.route.findUnique({
        where: { code: data.routeCode },
      });
      if (foundRoute) routeId = foundRoute.id;
    }

    return this.prisma.outlet.create({
      data: {
        code,
        name: data.name,
        ownerName: data.ownerName,
        phone: data.phone,
        address: data.address,
        district: data.district || 'Quận 1',
        province: data.province || 'Hồ Chí Minh',
        latitude: data.latitude ?? 10.7769,
        longitude: data.longitude ?? 106.7009,
        creditLimit: data.creditLimit || 10000000,
        routeId,
        tier: data.tier || 'STANDARD',
      },
      include: { route: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.outlet.update({
      where: { id },
      data,
    });
  }
}


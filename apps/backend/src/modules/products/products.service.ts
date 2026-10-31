import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(search?: string, category?: string) {
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { brand: { contains: search } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        uoms: true,
        inventoryLots: {
          select: {
            batchCode: true,
            expiryDate: true,
            availableQty: true,
            physicalQty: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        uoms: true,
        inventoryLots: {
          include: { warehouse: true },
          orderBy: { expiryDate: 'asc' },
        },
      },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return product;
  }

  async create(data: {
    code: string;
    name: string;
    category: string;
    brand: string;
    baseUom: string;
    shelfLifeDays?: number;
    barcode?: string;
    imageUrl?: string;
    description?: string;
    uoms?: Array<{
      uomName: string;
      conversionFactor: number;
      price: number;
      isDefaultSaleUom?: boolean;
    }>;
  }) {
    const { uoms, ...productData } = data;
    return this.prisma.product.create({
      data: {
        ...productData,
        uoms: uoms ? { create: uoms } : undefined,
      },
      include: { uoms: true },
    });
  }

  /**
   * Tính toán quy đổi số lượng và giá tiền theo đơn vị tính yêu cầu
   */
  async calculateConversion(productId: string, uomName: string, quantity: number) {
    const uom = await this.prisma.productUom.findUnique({
      where: {
        productId_uomName: { productId, uomName },
      },
    });
    if (!uom) throw new NotFoundException(`Không tìm thấy đơn vị tính ${uomName} cho sản phẩm này`);

    const baseQty = quantity * uom.conversionFactor;
    const totalPrice = quantity * uom.price;

    return {
      productId,
      uomName,
      quantity,
      conversionFactor: uom.conversionFactor,
      baseQty,
      unitPrice: uom.price,
      totalPrice,
    };
  }
}


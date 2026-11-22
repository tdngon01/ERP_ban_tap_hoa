import prisma from '../prisma';

export const productsService = {
  async findAll(search?: string, category?: string) {
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.product.findMany({
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
  },

  async findOne(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        uoms: true,
        inventoryLots: {
          include: { warehouse: true },
          orderBy: { expiryDate: 'asc' },
        },
      },
    });
    if (!product) throw new Error('Không tìm thấy sản phẩm');
    return product;
  },

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
    return prisma.product.create({
      data: {
        ...productData,
        uoms: uoms && uoms.length > 0 ? { create: uoms } : undefined,
      },
      include: { uoms: true },
    });
  },

  async update(id: string, data: any) {
    const { uoms, ...productData } = data;
    return prisma.product.update({
      where: { id },
      data: productData,
      include: { uoms: true },
    });
  },

  async delete(id: string) {
    // Soft-delete để bảo toàn lịch sử hóa đơn và số liệu kho cũ
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async convertUom(productId: string, uomName: string, quantity: number) {
    const uom = await prisma.productUom.findUnique({
      where: {
        productId_uomName: { productId, uomName },
      },
    });

    if (!uom) {
      throw new Error(`Không tìm thấy đơn vị tính ${uomName} cho sản phẩm này`);
    }

    const baseQuantity = quantity * uom.conversionFactor;
    return {
      productId,
      uomName,
      inputQuantity: quantity,
      conversionFactor: uom.conversionFactor,
      baseQuantity,
      price: uom.price,
      totalAmount: quantity * uom.price,
    };
  },
};

import prisma from '../prisma';

export const debtService = {
  bankBin: process.env.VIETQR_BANK_ID || '970422',
  accountNo: process.env.VIETQR_ACCOUNT_NO || '0988889999',
  accountName: process.env.VIETQR_ACCOUNT_NAME || 'NPP BANH KEO AN PHAT',

  async getLedger() {
    const outlets = await prisma.outlet.findMany({
      include: {
        route: true,
        orders: {
          where: { paymentStatus: { not: 'PAID' } },
          select: {
            id: true,
            orderCode: true,
            totalAmount: true,
            paidAmount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { currentDebt: 'desc' },
    });

    const now = new Date();

    return outlets.map((outlet) => {
      const creditUtilization =
        outlet.creditLimit > 0
          ? Math.round((outlet.currentDebt / outlet.creditLimit) * 100)
          : 0;

      let overdueDebt = 0;
      for (const order of outlet.orders) {
        const orderAgeDays = Math.ceil(
          (now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 3600 * 24)
        );
        if (orderAgeDays > 30) {
          overdueDebt += order.totalAmount - order.paidAmount;
        }
      }

      let riskLevel: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';
      if (creditUtilization >= 90 || overdueDebt > 0) {
        riskLevel = 'DANGER';
      } else if (creditUtilization >= 70) {
        riskLevel = 'WARNING';
      }

      return {
        outletId: outlet.id,
        code: outlet.code,
        name: outlet.name,
        ownerName: outlet.ownerName,
        phone: outlet.phone,
        routeName: outlet.route?.name || 'Chưa xếp tuyến',
        creditLimit: outlet.creditLimit,
        currentDebt: outlet.currentDebt,
        creditUtilization,
        overdueDebt,
        riskLevel,
        unpaidOrdersCount: outlet.orders.length,
      };
    });
  },

  async generateVietQr(data: {
    outletId: string;
    orderId?: string;
    amount: number;
    description?: string;
  }) {
    const outlet = await prisma.outlet.findUnique({
      where: { id: data.outletId },
    });
    if (!outlet) throw new Error('Không tìm thấy điểm bán');

    const setting = await prisma.systemSetting.findUnique({
      where: { id: 'default' },
    });

    const bankBin = setting?.bankBin || this.bankBin;
    const accountNo = setting?.bankAccountNo || this.accountNo;
    const accountName = setting?.bankAccountName || this.accountName;
    const bankName = setting?.bankName || 'MBBank (Ngân hàng Quân Đội)';

    let addInfo = data.description;
    if (!addInfo) {
      if (data.orderId) {
        const order = await prisma.salesOrder.findUnique({
          where: { id: data.orderId },
        });
        addInfo = `THANHTOAN ${order?.orderCode || ''} ${outlet.code}`;
      } else {
        addInfo = `THUNO ${outlet.code} ${outlet.name.slice(0, 15)}`;
      }
    }

    const sanitizedInfo = addInfo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim()
      .replace(/\s+/g, '%20');

    const qrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?amount=${Math.round(
      data.amount
    )}&addInfo=${sanitizedInfo}&accountName=${encodeURIComponent(accountName)}`;

    return {
      success: true,
      bankBin,
      bankName,
      accountNo,
      accountName,
      amount: data.amount,
      content: decodeURIComponent(sanitizedInfo.replace(/%20/g, ' ')),
      qrImageUrl: qrUrl,
      outletName: outlet.name,
    };
  },

  async recordPayment(data: {
    outletId: string;
    orderId?: string;
    amount: number;
    paymentMethod?: string;
    vietQrRefCode?: string;
    notes?: string;
  }) {
    const outlet = await prisma.outlet.findUnique({
      where: { id: data.outletId },
    });
    if (!outlet) throw new Error('Không tìm thấy điểm bán');

    const receiptDate = new Date();
    const dateStr = receiptDate.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const receiptCode = `REC-${dateStr}-${randomSuffix}`;

    const receipt = await prisma.paymentReceipt.create({
      data: {
        receiptCode,
        outletId: data.outletId,
        orderId: data.orderId,
        amount: data.amount,
        paymentMethod: data.paymentMethod || 'VIETQR_TRANSFER',
        vietQrRefCode: data.vietQrRefCode,
        status: 'CONFIRMED_BY_ACCOUNTANT',
        notes: data.notes,
      },
    });

    const newDebt = Math.max(0, outlet.currentDebt - data.amount);
    await prisma.outlet.update({
      where: { id: data.outletId },
      data: { currentDebt: newDebt },
    });

    if (data.orderId) {
      const order = await prisma.salesOrder.findUnique({
        where: { id: data.orderId },
      });
      if (order) {
        const newPaid = order.paidAmount + data.amount;
        const newStatus = newPaid >= order.totalAmount ? 'PAID' : 'PARTIALLY_PAID';
        await prisma.salesOrder.update({
          where: { id: data.orderId },
          data: {
            paidAmount: newPaid,
            paymentStatus: newStatus,
          },
        });
      }
    }

    return {
      success: true,
      message: `Đã lập phiếu thu ${receiptCode} thành công! Đã gạch nợ ${data.amount.toLocaleString(
        'vi-VN'
      )}đ cho tiệm ${outlet.name}.`,
      receipt,
      remainingDebt: newDebt,
    };
  },

  async getReceipts() {
    return prisma.paymentReceipt.findMany({
      include: {
        outlet: true,
        order: true,
      },
      orderBy: { receiptDate: 'desc' },
      take: 50,
    });
  },
};

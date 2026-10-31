import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DebtService {
  private readonly bankBin = process.env.VIETQR_BANK_ID || '970422'; // MBBank BIN
  private readonly accountNo = process.env.VIETQR_ACCOUNT_NO || '0988889999';
  private readonly accountName = process.env.VIETQR_ACCOUNT_NAME || 'NPP BANH KEO AN PHAT';

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Báo cáo Sổ cái Công nợ & Tuổi nợ (Debt Aging) của các tiệm tạp hóa
   */
  async getLedger() {
    const outlets = await this.prisma.outlet.findMany({
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
      const creditUtilization = outlet.creditLimit > 0
        ? Math.round((outlet.currentDebt / outlet.creditLimit) * 100)
        : 0;

      // Tính tuổi nợ (nợ quá hạn > 30 ngày)
      let overdueDebt = 0;
      for (const order of outlet.orders) {
        const orderAgeDays = Math.ceil(
          (now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 3600 * 24),
        );
        if (orderAgeDays > 30) {
          overdueDebt += (order.totalAmount - order.paidAmount);
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
  }

  /**
   * Sinh mã VietQR động chuẩn EMVCo/Napas để khách quét thanh toán tự động
   */
  async generateVietQr(data: {
    outletId: string;
    orderId?: string;
    amount: number;
    description?: string;
  }) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: data.outletId },
    });
    if (!outlet) throw new NotFoundException('Không tìm thấy điểm bán');

    let addInfo = data.description;
    if (!addInfo) {
      if (data.orderId) {
        const order = await this.prisma.salesOrder.findUnique({
          where: { id: data.orderId },
        });
        addInfo = `THANHTOAN ${order?.orderCode || ''} ${outlet.code}`;
      } else {
        addInfo = `THUNO ${outlet.code} ${outlet.name.slice(0, 15)}`;
      }
    }

    // Làm sạch ký tự dấu tiếng Việt trong nội dung chuyển khoản theo chuẩn ngân hàng
    const sanitizedInfo = addInfo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim()
      .replace(/\s+/g, '%20');

    const qrUrl = `https://img.vietqr.io/image/${this.bankBin}-${this.accountNo}-compact2.png?amount=${Math.round(
      data.amount,
    )}&addInfo=${sanitizedInfo}&accountName=${encodeURIComponent(this.accountName)}`;

    return {
      success: true,
      bankBin: this.bankBin,
      bankName: 'MBBank (Ngân hàng Quân Đội)',
      accountNo: this.accountNo,
      accountName: this.accountName,
      amount: data.amount,
      content: decodeURIComponent(sanitizedInfo.replace(/%20/g, ' ')),
      qrImageUrl: qrUrl,
      outletName: outlet.name,
    };
  }

  /**
   * Ghi nhận Phiếu thu tiền (Tiền mặt hoặc VietQR) và tự động gạch nợ
   */
  async recordPayment(data: {
    outletId: string;
    orderId?: string;
    amount: number;
    paymentMethod?: string; // CASH, VIETQR_TRANSFER
    vietQrRefCode?: string;
    notes?: string;
  }) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: data.outletId },
    });
    if (!outlet) throw new NotFoundException('Không tìm thấy điểm bán');

    const receiptDate = new Date();
    const dateStr = receiptDate.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const receiptCode = `REC-${dateStr}-${randomSuffix}`;

    // 1. Tạo phiếu thu
    const receipt = await this.prisma.paymentReceipt.create({
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

    // 2. Trừ công nợ của tiệm tạp hóa
    const newDebt = Math.max(0, outlet.currentDebt - data.amount);
    await this.prisma.outlet.update({
      where: { id: data.outletId },
      data: { currentDebt: newDebt },
    });

    // 3. Nếu thu theo đơn hàng cụ thể, cập nhật trạng thái đơn
    if (data.orderId) {
      const order = await this.prisma.salesOrder.findUnique({
        where: { id: data.orderId },
      });
      if (order) {
        const newPaid = order.paidAmount + data.amount;
        const newStatus = newPaid >= order.totalAmount ? 'PAID' : 'PARTIALLY_PAID';
        await this.prisma.salesOrder.update({
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
      message: `Đã lập phiếu thu ${receiptCode} thành công! Đã gạch nợ ${data.amount.toLocaleString('vi-VN')}đ cho tiệm ${outlet.name}.`,
      receipt,
      remainingDebt: newDebt,
    };
  }

  /**
   * Danh sách phiếu thu gần nhất
   */
  async getReceipts() {
    return this.prisma.paymentReceipt.findMany({
      include: {
        outlet: true,
        order: true,
      },
      orderBy: { receiptDate: 'desc' },
      take: 50,
    });
  }
}


import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SettingsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getSettings() {
    let setting = await this.prisma.systemSetting.findUnique({
      where: { id: 'default' },
    });

    if (!setting) {
      setting = await this.prisma.systemSetting.create({
        data: {
          id: 'default',
          distributorName: 'NHÀ PHÂN PHỐI BÁNH KẸO AN PHÁT',
          phone: '0908.123.456 - 028.3888.9999',
          address: 'Số 150 Đường Song Hành, TP. Thủ Đức, TP. Hồ Chí Minh',
          taxCode: '0312345678',
          bankName: 'MBBank (Ngân Hàng Quân Đội)',
          bankBin: '970422',
          bankAccountNo: '0988889999',
          bankAccountName: 'NPP BANH KEO AN PHAT',
          autoBackupDays: 1,
          invoiceNotes: 'Cảm ơn Quý khách! Vui lòng kiểm tra kỹ số lượng, hạn sử dụng bánh kẹo và quét mã QR thanh toán.',
        },
      });
    }

    return setting;
  }

  async updateSettings(dto: any) {
    await this.getSettings(); // Đảm bảo đã có bản ghi
    return this.prisma.systemSetting.update({
      where: { id: 'default' },
      data: dto,
    });
  }

  /**
   * Tạo bản sao lưu CSDL SQLite (.db) kèm dấu thời gian
   */
  async createDatabaseBackup() {
    const dbSource = path.join(__dirname, '..', '..', '..', 'dev.db');
    const backupDir = path.join(__dirname, '..', '..', '..', 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `erp_fmcg_backup_${timestamp}.db`;
    const destPath = path.join(backupDir, backupFileName);

    if (fs.existsSync(dbSource)) {
      fs.copyFileSync(dbSource, destPath);
      const stats = fs.statSync(destPath);

      return {
        success: true,
        message: `Đã tạo bản sao lưu dữ liệu thành công: ${backupFileName}`,
        fileName: backupFileName,
        filePath: destPath,
        sizeBytes: stats.size,
        sizeFormatted: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
        createdAt: new Date(),
      };
    } else {
      throw new NotFoundException('Không tìm thấy tệp CSDL dev.db để sao lưu');
    }
  }

  /**
   * Danh sách các tệp sao lưu có sẵn trong máy
   */
  async listBackups() {
    const backupDir = path.join(__dirname, '..', '..', '..', 'backups');
    if (!fs.existsSync(backupDir)) return [];

    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.db'));
    return files
      .map((f) => {
        const fullPath = path.join(backupDir, f);
        const stats = fs.statSync(fullPath);
        return {
          fileName: f,
          sizeBytes: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Xuất Báo cáo tổng hợp ra định dạng CSV chuẩn UTF-8 (có BOM để mở tiếng Việt trên Excel)
   */
  async exportReportCsv(type: 'orders' | 'inventory' | 'debt') {
    const BOM = '\uFEFF'; // Byte Order Mark giúp Excel hiển thị đúng tiếng Việt

    if (type === 'orders') {
      const orders = await this.prisma.salesOrder.findMany({
        include: {
          outlet: true,
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      let csv = BOM + 'Mã Đơn Hàng,Ngày Tạo,Tiệm Tạp Hóa,Số Điện Thoại,Sale Thị Trường,Loại Đơn,Mặt Hàng Chi Tiết,Tổng Tiền (VNĐ),Đã Thu,Còn Nợ,Trạng Thái Đơn,Trạng Thái Thanh Toán\n';

      for (const o of orders) {
        const itemsStr = o.items
          .map((i) => `${i.product.name} (${i.quantity} ${i.uomName}${i.isGiftItem ? ' - TẶNG KM' : ''})`)
          .join(' | ')
          .replace(/"/g, '""');

        csv += `"${o.orderCode}","${new Date(o.createdAt).toLocaleString('vi-VN')}","${o.outlet.name}","${o.outlet.phone}","${o.salesRepName}","${o.orderType}","${itemsStr}","${o.totalAmount}","${o.paidAmount}","${o.totalAmount - o.paidAmount}","${o.status}","${o.paymentStatus}"\n`;
      }

      return csv;
    }

    if (type === 'inventory') {
      const lots = await this.prisma.inventoryLot.findMany({
        include: { product: true, warehouse: true },
        orderBy: { expiryDate: 'asc' },
      });

      let csv = BOM + 'Kho Lưu Trữ,Mã SKU,Tên Bánh Kẹo,Mã Lô,Ngày Sản Xuất,Hạn Sử Dụng,Số Ngày Còn Lại,Tồn Thực Tế,Đang Giữ Chỗ,Khả Dụng Bán,ĐVT Cơ Sở\n';
      const now = new Date();

      for (const l of lots) {
        const daysLeft = Math.ceil((new Date(l.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
        csv += `"${l.warehouse.name}","${l.product.code}","${l.product.name}","${l.batchCode}","${new Date(l.manufactureDate).toLocaleDateString('vi-VN')}","${new Date(l.expiryDate).toLocaleDateString('vi-VN')}","${daysLeft}","${l.physicalQty}","${l.reservedQty}","${l.availableQty}","${l.product.baseUom}"\n`;
      }

      return csv;
    }

    // Default: debt ledger
    const outlets = await this.prisma.outlet.findMany({
      include: { route: true },
      orderBy: { currentDebt: 'desc' },
    });

    let csv = BOM + 'Mã Điểm Bán,Tên Tạp Hóa,Chủ Tiệm,Số Điện Thoại,Địa Chỉ,Tuyến Bán Hàng,Hạn Mức Nợ (VNĐ),Nợ Gối Đầu Hiện Tại (VNĐ),Tỷ Lệ Chạm Trần (%)\n';

    for (const out of outlets) {
      const percent = out.creditLimit > 0 ? Math.round((out.currentDebt / out.creditLimit) * 100) : 0;
      csv += `"${out.code}","${out.name}","${out.ownerName}","${out.phone}","${out.address}","${out.route?.name || 'Chưa xếp tuyến'}","${out.creditLimit}","${out.currentDebt}","${percent}%"\n`;
    }

    return csv;
  }
}

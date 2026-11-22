import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Cấu hình CORS bảo mật: chỉ cho phép các domain tin cậy từ .env
  const rawCors = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173';
  const allowedOrigins = rawCors.split(',').map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép request từ cùng máy (no origin) hoặc nằm trong danh sách được cấp phép
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Bị chặn bởi chính sách CORS: ${origin}`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);

  logger.log(`🚀 ERP & DMS FMCG Backend API đang chạy tại: http://localhost:${port}`);
  logger.log(`📊 Google Sheets Sync API: http://localhost:${port}/api/google-sheets/config`);
  logger.log(`🛒 Quản lý Đa ĐVT & Bánh Kẹo: http://localhost:${port}/api/products`);
  logger.log(`📦 Quản lý Kho & Lô FEFO: http://localhost:${port}/api/inventory/lots`);
  logger.log(`📍 Điểm bán Tạp Hóa & Check-in GPS: http://localhost:${port}/api/outlets`);
  logger.log(`💰 Công Nợ & Sinh mã VietQR: http://localhost:${port}/api/debt/ledger`);
}

bootstrap();


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Cho phép kết nối từ Web Admin và Mobile SFA
  app.enableCors({
    origin: '*',
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


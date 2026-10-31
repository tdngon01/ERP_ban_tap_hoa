import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { GoogleSheetsModule } from './modules/google-sheets/google-sheets.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OutletsModule } from './modules/outlets/outlets.module';
import { RoutesModule } from './modules/routes/routes.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DebtModule } from './modules/debt/debt.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    PrismaModule,
    GoogleSheetsModule,
    ProductsModule,
    InventoryModule,
    OutletsModule,
    RoutesModule,
    OrdersModule,
    DebtModule,
    DashboardModule,
    SettingsModule,
  ],
})
export class AppModule {}


import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TableTypesModule } from './modules/table-types/table-types.module';
import { TablesModule } from './modules/tables/tables.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ServicesModule } from './modules/services/services.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './modules/health/health.module';
import { PricingRulesModule } from './modules/pricing-rules/pricing-rules.module';
import { MembershipModule } from './modules/membership/membership.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120, // 120 requests per minute
      },
    ]),
    PrismaModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    TableTypesModule,
    TablesModule,
    BookingsModule,
    ServicesModule,
    InvoicesModule,
    DashboardModule,
    ReportsModule,
    PricingRulesModule,
    MembershipModule,
    VouchersModule,
    HealthModule,
  ],
})
export class AppModule {}


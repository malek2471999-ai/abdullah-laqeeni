import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { loadConfig } from './config/env';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MaintenanceService } from './maintenance/maintenance.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [loadConfig], cache: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    PrismaModule,
    CommonModule,
    AuthModule,
    DevicesModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    MaintenanceService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

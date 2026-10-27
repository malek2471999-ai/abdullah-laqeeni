import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DeviceController } from './device.controller';
import { DevicesService } from './devices.service';
import { DeviceAuthGuard } from '../common/device-auth.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DevicesController, DeviceController],
  providers: [DevicesService, DeviceAuthGuard],
  exports: [DevicesService],
})
export class DevicesModule {}

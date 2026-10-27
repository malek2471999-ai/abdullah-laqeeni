import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../common/device-auth.guard';
import { CurrentDevice } from '../common/decorators';
import { DevicePrincipal } from '../common/auth-user';
import { DevicesService } from './devices.service';
import {
  CommandAckDto,
  HeartbeatDto,
  LocationDto,
  PushTokenDto,
} from './devices.dto';

/** Endpoints authenticated with a device-scoped token, never a user token. */
@UseGuards(DeviceAuthGuard)
@Controller('device')
export class DeviceController {
  constructor(private readonly devices: DevicesService) {}

  @Get('me')
  me(@CurrentDevice() device: DevicePrincipal) {
    return this.devices.deviceMe(device);
  }

  @Post('heartbeat')
  @HttpCode(200)
  heartbeat(@CurrentDevice() device: DevicePrincipal, @Body() dto: HeartbeatDto) {
    return this.devices.heartbeat(device, dto);
  }

  @Post('location')
  @HttpCode(201)
  location(@CurrentDevice() device: DevicePrincipal, @Body() dto: LocationDto) {
    return this.devices.deviceLocation(device, dto);
  }

  @Get('commands/pending')
  pending(@CurrentDevice() device: DevicePrincipal) {
    return this.devices.pendingCommands(device);
  }

  @Post('commands/:id/ack')
  @HttpCode(200)
  ack(
    @CurrentDevice() device: DevicePrincipal,
    @Param('id') id: string,
    @Body() dto: CommandAckDto,
  ) {
    return this.devices.acknowledge(device, id, dto);
  }

  @Post('push-token')
  @HttpCode(200)
  pushToken(@CurrentDevice() device: DevicePrincipal, @Body() dto: PushTokenDto) {
    return this.devices.updatePushToken(device, dto.token);
  }
}

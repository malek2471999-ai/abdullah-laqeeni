import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser, RequestMeta } from '../common/decorators';
import { AuthUser } from '../common/auth-user';
import { DevicesService } from './devices.service';
import {
  FlashDto,
  HistoryQueryDto,
  LostModeDto,
  PairDeviceDto,
  RecoveryMessageDto,
  RingDto,
  UpdateDeviceDto,
  VibrateDto,
} from './devices.dto';
import { AuthMeta } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Post('pairing')
  createPairing(@CurrentUser() user: AuthUser) {
    return this.devices.createPairing(user.id);
  }

  @Post('pair')
  pair(
    @CurrentUser() user: AuthUser,
    @Body() dto: PairDeviceDto,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.devices.pairDevice(user.id, dto, meta);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.devices.listDevices(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.devices.getDevice(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDeviceDto,
  ) {
    return this.devices.updateDevice(user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.devices.deleteDevice(user.id, id, meta);
  }

  @Get(':id/location')
  location(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.devices.getLocation(user.id, id);
  }

  @Get(':id/status')
  status(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.devices.getStatus(user.id, id);
  }

  @Get(':id/history')
  history(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: HistoryQueryDto,
  ) {
    return this.devices.history(user.id, id, query);
  }

  @Get(':id/commands')
  commands(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.devices.recentCommands(user.id, id);
  }

  @Post(':id/ring')
  @HttpCode(202)
  ring(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RingDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.devices.ring(user.id, id, dto, idempotencyKey, meta);
  }

  @Post(':id/stop-ring')
  @HttpCode(202)
  stopRing(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.devices.stopRing(user.id, id, idempotencyKey, meta);
  }

  @Post(':id/lost-mode')
  @HttpCode(202)
  lostMode(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: LostModeDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.devices.setLostMode(user.id, id, dto, idempotencyKey, meta);
  }

  @Post(':id/message')
  @HttpCode(202)
  message(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RecoveryMessageDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.devices.sendMessage(user.id, id, dto, idempotencyKey, meta);
  }

  @Post(':id/locate')
  @HttpCode(202)
  locate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.devices.locate(user.id, id, idempotencyKey, meta);
  }

  @Post(':id/vibrate')
  @HttpCode(202)
  vibrate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: VibrateDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.devices.vibrate(user.id, id, dto, idempotencyKey, meta);
  }

  @Post(':id/flash')
  @HttpCode(202)
  flash(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: FlashDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.devices.flash(user.id, id, dto, idempotencyKey, meta);
  }

  @Post(':id/request-status')
  @HttpCode(202)
  requestStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.devices.requestStatus(user.id, id, idempotencyKey, meta);
  }
}

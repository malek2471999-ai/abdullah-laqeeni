import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandStatus,
  CommandType,
  Device,
  NotificationType,
  PairingStatus,
  Prisma,
  SecurityEventType,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../common/crypto.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../common/push.service';
import { DevicePrincipal } from '../common/auth-user';
import {
  CommandAckDto,
  FlashDto,
  HeartbeatDto,
  HistoryQueryDto,
  LocationDto,
  LostModeDto,
  PairDeviceDto,
  RecoveryMessageDto,
  RingDto,
  UpdateDeviceDto,
  VibrateDto,
} from './devices.dto';

const ONLINE_THRESHOLD_MS = 150_000;
const STALE_LOCATION_MS = 5 * 60_000;

type DeviceWithRelations = Prisma.DeviceGetPayload<{
  include: { status: true; location: true };
}>;

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  // ───────────────────────────── Pairing ─────────────────────────────

  async createPairing(userId: string) {
    await this.prisma.pairingRequest.updateMany({
      where: { userId, status: PairingStatus.PENDING },
      data: { status: PairingStatus.CANCELLED },
    });

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const rawCode = this.crypto.newPairingCode();
      const codeHash = this.crypto.hashToken(`pairing:${rawCode}`);
      const exists = await this.prisma.pairingRequest.findUnique({
        where: { codeHash },
        select: { id: true },
      });
      if (exists) continue;
      const expiresAt = new Date(Date.now() + 10 * 60_000);
      const pairing = await this.prisma.pairingRequest.create({
        data: { userId, codeHash, expiresAt },
      });
      const formatted = `${rawCode.slice(0, 4)}-${rawCode.slice(4)}`;
      return {
        pairingId: pairing.id,
        code: formatted,
        normalizedCode: rawCode,
        expiresAt,
        qrPayload: `laqeeni://pair?code=${rawCode}`,
      };
    }
    throw new HttpException('Could not allocate a pairing code', HttpStatus.SERVICE_UNAVAILABLE);
  }

  async pairDevice(userId: string, dto: PairDeviceDto, meta: { ip?: string; userAgent?: string }) {
    const normalized = this.crypto.normalizePairingCode(dto.code);
    if (normalized.length !== 8) throw new BadRequestException('Pairing code must have 8 characters');
    const codeHash = this.crypto.hashToken(`pairing:${normalized}`);
    const pairing = await this.prisma.pairingRequest.findUnique({ where: { codeHash } });
    if (!pairing || pairing.userId !== userId) {
      throw new BadRequestException('Pairing code is invalid');
    }
    if (pairing.status !== PairingStatus.PENDING || pairing.consumedAt) {
      throw new ConflictException('Pairing code has already been used');
    }
    if (pairing.expiresAt < new Date()) {
      await this.prisma.pairingRequest.update({
        where: { id: pairing.id },
        data: { status: PairingStatus.EXPIRED },
      });
      throw new BadRequestException('Pairing code has expired');
    }
    const deviceCount = await this.prisma.device.count({
      where: { userId, revokedAt: null },
    });
    if (deviceCount >= 10) {
      throw new ConflictException('This account has reached the 10-device limit');
    }

    const deviceId = randomUUID();
    const secret = this.crypto.randomToken(48);
    const deviceToken = `${deviceId}.${secret}`;
    const tokenPrefix = `****${secret.slice(-4)}`;
    const device = await this.prisma.$transaction(async (tx) => {
      const created = await tx.device.create({
        data: {
          id: deviceId,
          userId,
          name: dto.name.trim().slice(0, 80),
          manufacturer: dto.manufacturer.slice(0, 80),
          model: dto.model.slice(0, 80),
          androidVersion: dto.androidVersion.slice(0, 40),
          appVersion: dto.appVersion?.slice(0, 40),
          fcmToken: dto.fcmToken?.slice(0, 4096),
          tokenHash: this.crypto.hashToken(deviceToken),
          tokenPrefix,
          lastSeenAt: new Date(),
          status: { create: { networkConnected: true, lastSyncAt: new Date() } },
        },
        include: { status: true, location: true },
      });
      await tx.pairingRequest.update({
        where: { id: pairing.id },
        data: { status: PairingStatus.CONSUMED, consumedAt: new Date(), deviceId: created.id },
      });
      return created;
    });

    await this.notifications.create({
      userId,
      deviceId: device.id,
      type: NotificationType.SECURITY,
      title: 'تم ربط جهاز جديد',
      body: `تم ربط ${device.name} بحسابك. إن لم تكن أنت، احذف الجهاز فورًا.`,
      data: { deviceId: device.id },
    });
    await this.audit(userId, SecurityEventType.DEVICE_PAIRED, meta, {
      deviceId: device.id,
      deviceName: device.name,
    });

    return {
      device: await this.present(device),
      deviceToken,
      warning: 'Store this token securely on the device. It will not be shown again.',
    };
  }

  // ───────────────────────────── Owner API ─────────────────────────────

  async listDevices(userId: string) {
    const devices = await this.prisma.device.findMany({
      where: { userId, revokedAt: null },
      include: { status: true, location: true },
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(devices.map((device) => this.present(device)));
  }

  async getDevice(userId: string, deviceId: string) {
    const device = await this.requireOwned(userId, deviceId);
    return this.present(device);
  }

  async updateDevice(userId: string, deviceId: string, dto: UpdateDeviceDto) {
    await this.requireOwned(userId, deviceId);
    const device = await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        name: dto.name?.trim(),
        lostMessage: dto.lostMessage,
        contactPhone: dto.contactPhone,
        locationHistoryEnabled: dto.locationHistoryEnabled,
        historyRetentionDays: dto.historyRetentionDays,
        notifyOnReconnect: dto.notifyOnReconnect,
      },
      include: { status: true, location: true },
    });
    return this.present(device);
  }

  async deleteDevice(
    userId: string,
    deviceId: string,
    meta: { ip?: string; userAgent?: string },
  ) {
    const device = await this.requireOwned(userId, deviceId);
    await this.audit(userId, SecurityEventType.DEVICE_UNPAIRED, meta, {
      deviceId,
      deviceName: device.name,
    });
    await this.prisma.device.delete({ where: { id: deviceId } });
    return { ok: true };
  }

  async getLocation(userId: string, deviceId: string) {
    const device = await this.requireOwned(userId, deviceId);
    return this.presentLocation(device);
  }

  async getStatus(userId: string, deviceId: string) {
    const device = await this.requireOwned(userId, deviceId);
    return this.presentStatus(device);
  }

  async history(userId: string, deviceId: string, query: HistoryQueryDto) {
    const device = await this.requireOwned(userId, deviceId);
    const points = await this.prisma.locationHistory.findMany({
      where: {
        deviceId,
        capturedAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined,
        },
      },
      orderBy: { capturedAt: 'desc' },
      take: query.limit ?? 200,
    });
    return {
      deviceId,
      historyEnabled: device.locationHistoryEnabled,
      retentionDays: device.historyRetentionDays,
      points: points.flatMap((point) => {
        try {
          return [
            {
              id: point.id,
              latitude: this.crypto.decryptCoordinate(point.latitudeEnc),
              longitude: this.crypto.decryptCoordinate(point.longitudeEnc),
              accuracyMeters: point.accuracyMeters,
              isMock: point.isMock,
              capturedAt: point.capturedAt,
            },
          ];
        } catch {
          this.logger.error(`Could not decrypt history point ${point.id}`);
          return [];
        }
      }),
    };
  }

  async recentCommands(userId: string, deviceId: string) {
    await this.requireOwned(userId, deviceId);
    return this.prisma.remoteCommand.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        type: true,
        status: true,
        payload: true,
        createdAt: true,
        acknowledgedAt: true,
        expiresAt: true,
        failureReason: true,
      },
    });
  }

  // ───────────────────────────── Commands ─────────────────────────────

  async ring(
    userId: string,
    deviceId: string,
    dto: RingDto,
    idempotencyKey: string | undefined,
    meta: { ip?: string; userAgent?: string },
  ) {
    const device = await this.requireOwned(userId, deviceId);
    const recent = await this.prisma.remoteCommand.findFirst({
      where: {
        deviceId,
        type: CommandType.RING,
        createdAt: { gt: new Date(Date.now() - 10_000) },
        status: { in: [CommandStatus.PENDING, CommandStatus.DELIVERED, CommandStatus.ACKNOWLEDGED] },
      },
      select: { id: true },
    });
    if (recent) {
      throw new HttpException(
        'An alarm was requested moments ago. Wait a few seconds.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return this.createCommand(
      device,
      CommandType.RING,
      {
        durationSeconds: dto.durationSeconds ?? 180,
        sound: dto.sound ?? 'siren',
        vibration: dto.vibration ?? true,
        flash: dto.flash ?? true,
      },
      idempotencyKey,
      meta,
    );
  }

  async stopRing(
    userId: string,
    deviceId: string,
    idempotencyKey: string | undefined,
    meta: { ip?: string; userAgent?: string },
  ) {
    const device = await this.requireOwned(userId, deviceId);
    await this.prisma.remoteCommand.updateMany({
      where: {
        deviceId,
        type: CommandType.RING,
        status: { in: [CommandStatus.PENDING, CommandStatus.DELIVERED] },
      },
      data: { status: CommandStatus.CANCELLED },
    });
    return this.createCommand(device, CommandType.STOP_RING, {}, idempotencyKey, meta);
  }

  async setLostMode(
    userId: string,
    deviceId: string,
    dto: LostModeDto,
    idempotencyKey: string | undefined,
    meta: { ip?: string; userAgent?: string },
  ) {
    const device = await this.requireOwned(userId, deviceId);
    const updated = await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        lostMode: dto.enabled,
        lostMessage: dto.message ?? device.lostMessage,
        contactPhone: dto.contactPhone ?? device.contactPhone,
      },
      include: { status: true, location: true },
    });
    const command = await this.createCommand(
      updated,
      dto.enabled ? CommandType.LOST_MODE_ON : CommandType.LOST_MODE_OFF,
      {
        message: updated.lostMessage ?? 'هذا الهاتف مفقود. يرجى التواصل مع صاحبه.',
        contactPhone: updated.contactPhone ?? null,
      },
      idempotencyKey,
      meta,
      dto.enabled ? 24 : 1,
    );
    await this.notifications.create({
      userId,
      deviceId,
      type: NotificationType.LOST_MODE,
      title: dto.enabled ? 'تم تفعيل وضع الفقدان' : 'تم إيقاف وضع الفقدان',
      body: dto.enabled
        ? `سيتم عرض رسالة الاسترجاع على ${updated.name} عند اتصاله.`
        : `عاد ${updated.name} إلى الوضع الطبيعي.`,
    });
    return { device: await this.present(updated), command };
  }

  async sendMessage(
    userId: string,
    deviceId: string,
    dto: RecoveryMessageDto,
    idempotencyKey: string | undefined,
    meta: { ip?: string; userAgent?: string },
  ) {
    const device = await this.requireOwned(userId, deviceId);
    const updated = await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        lostMessage: dto.message,
        contactPhone: dto.contactPhone ?? device.contactPhone,
      },
      include: { status: true, location: true },
    });
    return this.createCommand(
      updated,
      CommandType.MESSAGE,
      {
        message: dto.message,
        contactPhone: updated.contactPhone ?? null,
      },
      idempotencyKey,
      meta,
      24,
    );
  }

  async locate(
    userId: string,
    deviceId: string,
    idempotencyKey: string | undefined,
    meta: { ip?: string; userAgent?: string },
  ) {
    const device = await this.requireOwned(userId, deviceId);
    const recent = await this.prisma.remoteCommand.findFirst({
      where: {
        deviceId,
        type: CommandType.LOCATE,
        createdAt: { gt: new Date(Date.now() - 5000) },
        status: { in: [CommandStatus.PENDING, CommandStatus.DELIVERED] },
      },
      select: { id: true },
    });
    if (recent) {
      throw new HttpException('A location request is already in progress', HttpStatus.TOO_MANY_REQUESTS);
    }
    return this.createCommand(
      device,
      CommandType.LOCATE,
      { highAccuracy: true },
      idempotencyKey,
      meta,
    );
  }

  async vibrate(
    userId: string,
    deviceId: string,
    dto: VibrateDto,
    idempotencyKey: string | undefined,
    meta: { ip?: string; userAgent?: string },
  ) {
    const device = await this.requireOwned(userId, deviceId);
    return this.createCommand(
      device,
      CommandType.VIBRATE,
      { durationSeconds: dto.durationSeconds ?? 10 },
      idempotencyKey,
      meta,
    );
  }

  async flash(
    userId: string,
    deviceId: string,
    dto: FlashDto,
    idempotencyKey: string | undefined,
    meta: { ip?: string; userAgent?: string },
  ) {
    const device = await this.requireOwned(userId, deviceId);
    return this.createCommand(
      device,
      CommandType.FLASH,
      { durationSeconds: dto.durationSeconds ?? 15 },
      idempotencyKey,
      meta,
    );
  }

  async requestStatus(
    userId: string,
    deviceId: string,
    idempotencyKey: string | undefined,
    meta: { ip?: string; userAgent?: string },
  ) {
    const device = await this.requireOwned(userId, deviceId);
    return this.createCommand(device, CommandType.REQUEST_STATUS, {}, idempotencyKey, meta);
  }

  private async createCommand(
    device: Device,
    type: CommandType,
    payload: Prisma.InputJsonValue,
    idempotencyKey: string | undefined,
    meta: { ip?: string; userAgent?: string },
    ttlHours = type === CommandType.RING ? 5 / 60 : 0.25,
  ) {
    const key = `${type}:${idempotencyKey?.slice(0, 90) ?? this.crypto.randomToken(18)}`;
    try {
      const command = await this.prisma.remoteCommand.create({
        data: {
          deviceId: device.id,
          type,
          payload,
          idempotencyKey: key,
          expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
        },
      });
      await this.audit(device.userId, SecurityEventType.COMMAND_SENT, meta, {
        deviceId: device.id,
        type,
        commandId: command.id,
      });
      if (device.fcmToken) {
        void this.push.sendDataMessage(device.fcmToken, {
          type: 'COMMAND',
          commandId: command.id,
          deviceId: device.id,
          commandType: type,
        });
      }
      return this.presentCommand(command);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.remoteCommand.findUnique({
          where: { deviceId_idempotencyKey: { deviceId: device.id, idempotencyKey: key } },
        });
        if (existing) return this.presentCommand(existing);
      }
      throw error;
    }
  }

  // ───────────────────────────── Device API ─────────────────────────────

  async deviceMe(principal: DevicePrincipal) {
    const device = await this.prisma.device.findUniqueOrThrow({
      where: { id: principal.id },
      include: { status: true, location: true },
    });
    return {
      device: await this.present(device),
      serverTime: new Date(),
    };
  }

  async heartbeat(principal: DevicePrincipal, dto: HeartbeatDto) {
    const previous = await this.prisma.device.findUniqueOrThrow({
      where: { id: principal.id },
      include: { status: true },
    });
    const now = new Date();
    const wasOffline =
      previous.lastSeenAt !== null &&
      now.getTime() - previous.lastSeenAt.getTime() > ONLINE_THRESHOLD_MS;

    const device = await this.prisma.device.update({
      where: { id: principal.id },
      data: {
        lastSeenAt: now,
        appVersion: dto.appVersion?.slice(0, 40) ?? previous.appVersion,
        status: {
          upsert: {
            create: {
              batteryLevel: dto.batteryLevel,
              charging: dto.charging,
              networkConnected: dto.networkConnected ?? true,
              networkType: dto.networkType?.slice(0, 40),
              lastSyncAt: now,
              appVersion: dto.appVersion,
            },
            update: {
              batteryLevel: dto.batteryLevel,
              charging: dto.charging,
              networkConnected: dto.networkConnected ?? true,
              networkType: dto.networkType?.slice(0, 40),
              lastSyncAt: now,
              appVersion: dto.appVersion,
            },
          },
        },
      },
      include: { status: true, location: true },
    });

    if (wasOffline && device.notifyOnReconnect) {
      await this.notifications.create({
        userId: device.userId,
        deviceId: device.id,
        type: NotificationType.DEVICE_ONLINE,
        title: 'عاد جهازك إلى الإنترنت',
        body: `${device.name} متصل الآن ويمكنه استقبال الأوامر.`,
      });
    }

    const previousBattery = previous.status?.batteryLevel;
    if (
      typeof dto.batteryLevel === 'number' &&
      dto.batteryLevel <= 15 &&
      dto.charging !== true &&
      (previousBattery === null || previousBattery === undefined || previousBattery > 15)
    ) {
      const recentAlert = await this.prisma.notification.findFirst({
        where: {
          deviceId: device.id,
          type: NotificationType.BATTERY_LOW,
          createdAt: { gt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
        },
      });
      if (!recentAlert) {
        await this.notifications.create({
          userId: device.userId,
          deviceId: device.id,
          type: NotificationType.BATTERY_LOW,
          title: 'بطارية منخفضة',
          body: `بطارية ${device.name} عند ${dto.batteryLevel}% وغير متصلة بالشاحن.`,
        });
      }
    }

    return {
      ok: true,
      serverTime: now,
      online: true,
      lostMode: device.lostMode,
      lostMessage: device.lostMessage,
      contactPhone: device.contactPhone,
      locationHistoryEnabled: device.locationHistoryEnabled,
    };
  }

  async deviceLocation(principal: DevicePrincipal, dto: LocationDto) {
    const capturedAt = new Date(dto.capturedAt);
    if (capturedAt.getTime() > Date.now() + 2 * 60_000) {
      throw new BadRequestException('Location timestamp is in the future');
    }
    const device = await this.prisma.device.findUniqueOrThrow({
      where: { id: principal.id },
      include: { location: true },
    });
    const latest = device.location;
    const isNewer = !latest || capturedAt >= latest.capturedAt;
    const latEnc = this.crypto.encryptCoordinate(dto.latitude);
    const lngEnc = this.crypto.encryptCoordinate(dto.longitude);

    await this.prisma.$transaction(async (tx) => {
      if (isNewer) {
        await tx.deviceLocation.upsert({
          where: { deviceId: principal.id },
          create: {
            deviceId: principal.id,
            latitudeEnc: latEnc,
            longitudeEnc: lngEnc,
            accuracyMeters: dto.accuracyMeters,
            altitudeMeters: dto.altitudeMeters,
            speedMps: dto.speedMps,
            headingDegrees: dto.headingDegrees,
            source: dto.source ?? 'fused',
            isMock: dto.isMock ?? false,
            capturedAt,
          },
          update: {
            latitudeEnc: latEnc,
            longitudeEnc: lngEnc,
            accuracyMeters: dto.accuracyMeters,
            altitudeMeters: dto.altitudeMeters,
            speedMps: dto.speedMps,
            headingDegrees: dto.headingDegrees,
            source: dto.source ?? 'fused',
            isMock: dto.isMock ?? false,
            capturedAt,
            recordedAt: new Date(),
          },
        });
        await tx.deviceStatus.upsert({
          where: { deviceId: principal.id },
          create: { deviceId: principal.id, lastLocationAt: capturedAt, lastSyncAt: new Date() },
          update: { lastLocationAt: capturedAt, lastSyncAt: new Date() },
        });
      }
      if (device.locationHistoryEnabled) {
        await tx.locationHistory.create({
          data: {
            deviceId: principal.id,
            latitudeEnc: latEnc,
            longitudeEnc: lngEnc,
            accuracyMeters: dto.accuracyMeters,
            isMock: dto.isMock ?? false,
            capturedAt,
          },
        });
      }
    });

    if (device.lostMode) {
      const recent = await this.prisma.notification.findFirst({
        where: {
          deviceId: device.id,
          type: NotificationType.LOCATION_UPDATE,
          createdAt: { gt: new Date(Date.now() - 5 * 60_000) },
        },
      });
      if (!recent) {
        await this.notifications.create({
          userId: device.userId,
          deviceId: device.id,
          type: NotificationType.LOCATION_UPDATE,
          title: 'موقع جديد للجهاز المفقود',
          body: `تم استلام موقع جديد من ${device.name}.`,
        });
      }
    }

    return {
      ok: true,
      accepted: isNewer,
      capturedAt,
      historySaved: device.locationHistoryEnabled,
    };
  }

  async pendingCommands(principal: DevicePrincipal) {
    const now = new Date();
    await this.prisma.remoteCommand.updateMany({
      where: {
        deviceId: principal.id,
        status: { in: [CommandStatus.PENDING, CommandStatus.DELIVERED] },
        expiresAt: { lt: now },
      },
      data: { status: CommandStatus.EXPIRED },
    });
    const commands = await this.prisma.remoteCommand.findMany({
      where: {
        deviceId: principal.id,
        expiresAt: { gt: now },
        OR: [
          { status: CommandStatus.PENDING },
          {
            status: CommandStatus.DELIVERED,
            deliveredAt: { lt: new Date(now.getTime() - 25_000) },
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });
    if (commands.length) {
      await this.prisma.remoteCommand.updateMany({
        where: { id: { in: commands.map((command) => command.id) } },
        data: { status: CommandStatus.DELIVERED, deliveredAt: now },
      });
    }
    return {
      commands: commands.map((command) => this.presentCommand(command)),
      serverTime: now,
      lostMode: (await this.prisma.device.findUnique({
        where: { id: principal.id },
        select: { lostMode: true, lostMessage: true, contactPhone: true },
      })) ?? undefined,
    };
  }

  async acknowledge(
    principal: DevicePrincipal,
    commandId: string,
    dto: CommandAckDto,
  ) {
    const command = await this.prisma.remoteCommand.findFirst({
      where: { id: commandId, deviceId: principal.id },
      include: { device: true },
    });
    if (!command) throw new NotFoundException('Command not found');
    const success = dto.status === 'SUCCESS';
    await this.prisma.$transaction([
      this.prisma.remoteCommand.update({
        where: { id: command.id },
        data: {
          status: success ? CommandStatus.ACKNOWLEDGED : CommandStatus.FAILED,
          acknowledgedAt: new Date(),
          failureReason: success ? null : dto.message?.slice(0, 500),
          result: { message: dto.message ?? null },
        },
      }),
      this.prisma.commandAcknowledgement.upsert({
        where: { commandId: command.id },
        create: {
          commandId: command.id,
          deviceId: principal.id,
          status: dto.status,
          message: dto.message?.slice(0, 500),
          result: { message: dto.message ?? null },
        },
        update: {
          status: dto.status,
          message: dto.message?.slice(0, 500),
          result: { message: dto.message ?? null },
        },
      }),
    ]);
    await this.notifications.create({
      userId: command.device.userId,
      deviceId: principal.id,
      type: NotificationType.COMMAND_ACK,
      title: success ? 'تم تنفيذ الأمر' : 'تعذر تنفيذ الأمر',
      body: success
        ? `نفّذ ${command.device.name} الأمر ${command.type}.`
        : `${command.device.name}: ${dto.message ?? 'فشل تنفيذ الأمر'}`,
      data: { commandId: command.id, type: command.type },
    });
    return { ok: true };
  }

  async updatePushToken(principal: DevicePrincipal, token: string) {
    await this.prisma.device.update({
      where: { id: principal.id },
      data: { fcmToken: token.slice(0, 4096) },
    });
    return { ok: true };
  }

  // ───────────────────────────── Helpers ─────────────────────────────

  private async requireOwned(userId: string, deviceId: string): Promise<DeviceWithRelations> {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId, revokedAt: null },
      include: { status: true, location: true },
    });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  private isOnline(lastSeenAt: Date | null): boolean {
    return Boolean(lastSeenAt && Date.now() - lastSeenAt.getTime() < ONLINE_THRESHOLD_MS);
  }

  private presentLocation(device: DeviceWithRelations) {
    if (!device.location) {
      return { location: null, stale: true, ageSeconds: null };
    }
    let latitude: number;
    let longitude: number;
    try {
      latitude = this.crypto.decryptCoordinate(device.location.latitudeEnc);
      longitude = this.crypto.decryptCoordinate(device.location.longitudeEnc);
    } catch {
      this.logger.error(`Could not decrypt location for device ${device.id}`);
      return { location: null, stale: true, ageSeconds: null, error: 'decryption_failed' };
    }
    const ageSeconds = Math.max(
      0,
      Math.floor((Date.now() - device.location.capturedAt.getTime()) / 1000),
    );
    return {
      location: {
        latitude,
        longitude,
        accuracyMeters: device.location.accuracyMeters,
        altitudeMeters: device.location.altitudeMeters,
        speedMps: device.location.speedMps,
        headingDegrees: device.location.headingDegrees,
        source: device.location.source,
        isMock: device.location.isMock,
        capturedAt: device.location.capturedAt,
        recordedAt: device.location.recordedAt,
      },
      ageSeconds,
      stale: ageSeconds * 1000 > STALE_LOCATION_MS,
      live: ageSeconds * 1000 <= STALE_LOCATION_MS,
    };
  }

  private presentStatus(device: DeviceWithRelations) {
    const online = this.isOnline(device.lastSeenAt);
    return {
      online,
      lastSeenAt: device.lastSeenAt,
      batteryLevel: device.status?.batteryLevel ?? null,
      charging: device.status?.charging ?? null,
      networkConnected: device.status?.networkConnected ?? null,
      networkType: device.status?.networkType ?? null,
      lastLocationAt: device.status?.lastLocationAt ?? device.location?.capturedAt ?? null,
      lastSyncAt: device.status?.lastSyncAt ?? null,
      appVersion: device.status?.appVersion ?? device.appVersion ?? null,
      locationStale:
        !device.location ||
        Date.now() - device.location.capturedAt.getTime() > STALE_LOCATION_MS,
    };
  }

  private async present(device: DeviceWithRelations) {
    const location = this.presentLocation(device);
    return {
      id: device.id,
      name: device.name,
      manufacturer: device.manufacturer,
      model: device.model,
      androidVersion: device.androidVersion,
      appVersion: device.appVersion,
      online: this.isOnline(device.lastSeenAt),
      lastSeenAt: device.lastSeenAt,
      pairedAt: device.pairedAt,
      lostMode: device.lostMode,
      lostMessage: device.lostMessage,
      contactPhone: device.contactPhone,
      locationHistoryEnabled: device.locationHistoryEnabled,
      historyRetentionDays: device.historyRetentionDays,
      notifyOnReconnect: device.notifyOnReconnect,
      batteryLevel: device.status?.batteryLevel ?? null,
      charging: device.status?.charging ?? null,
      networkConnected: device.status?.networkConnected ?? null,
      networkType: device.status?.networkType ?? null,
      lastSyncAt: device.status?.lastSyncAt ?? null,
      location: location.location,
      locationAgeSeconds: location.ageSeconds,
      locationStale: location.stale,
      locationLive: location.live ?? false,
      createdAt: device.createdAt,
    };
  }

  private presentCommand(command: {
    id: string;
    type: CommandType;
    payload: Prisma.JsonValue;
    status: CommandStatus;
    createdAt: Date;
    expiresAt: Date;
  }) {
    return {
      id: command.id,
      type: command.type,
      payload: command.payload,
      status: command.status,
      createdAt: command.createdAt,
      expiresAt: command.expiresAt,
    };
  }

  private async audit(
    userId: string | null,
    type: SecurityEventType,
    meta: { ip?: string; userAgent?: string },
    metadata: Record<string, unknown>,
  ) {
    try {
      await this.prisma.securityEvent.create({
        data: {
          userId,
          type,
          ip: meta.ip,
          userAgent: meta.userAgent?.slice(0, 500),
          metadata: metadata as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      this.logger.warn(`Audit write failed: ${String(error)}`);
    }
  }
}

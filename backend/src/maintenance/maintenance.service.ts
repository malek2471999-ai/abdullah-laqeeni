import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommandStatus, NotificationType, PairingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async updateOfflineDevices(): Promise<void> {
    const cutoff = new Date(Date.now() - 3 * 60_000);
    const devices = await this.prisma.device.findMany({
      where: {
        revokedAt: null,
        lostMode: false,
        lastSeenAt: { lt: cutoff, gt: new Date(Date.now() - 24 * 60 * 60_000) },
        status: { networkConnected: true },
      },
      select: { id: true, userId: true, name: true },
      take: 100,
    });
    for (const device of devices) {
      const recent = await this.prisma.notification.findFirst({
        where: {
          deviceId: device.id,
          type: NotificationType.DEVICE_OFFLINE,
          createdAt: { gt: new Date(Date.now() - 6 * 60 * 60_000) },
        },
        select: { id: true },
      });
      if (recent) continue;
      await this.notifications.create({
        userId: device.userId,
        deviceId: device.id,
        type: NotificationType.DEVICE_OFFLINE,
        title: 'انقطع اتصال جهازك',
        body: `لم يتصل ${device.name} بالإنترنت مؤخرًا. آخر موقع محفوظ ما زال متاحًا.`,
      });
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanup(): Promise<void> {
    const now = new Date();
    const [pairings, commands, sessions, tokens] = await this.prisma.$transaction([
      this.prisma.pairingRequest.updateMany({
        where: { status: PairingStatus.PENDING, expiresAt: { lt: now } },
        data: { status: PairingStatus.EXPIRED },
      }),
      this.prisma.remoteCommand.updateMany({
        where: {
          status: { in: [CommandStatus.PENDING, CommandStatus.DELIVERED] },
          expiresAt: { lt: now },
        },
        data: { status: CommandStatus.EXPIRED },
      }),
      this.prisma.session.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60_000) } }],
        },
      }),
      this.prisma.emailToken.deleteMany({
        where: { expiresAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60_000) } },
      }),
    ]);

    const devices = await this.prisma.device.findMany({
      where: { revokedAt: null },
      select: { id: true, historyRetentionDays: true },
    });
    let historyDeleted = 0;
    for (const device of devices) {
      const cutoff = new Date(
        now.getTime() - Math.min(Math.max(device.historyRetentionDays, 1), 90) * 24 * 60 * 60_000,
      );
      const result = await this.prisma.locationHistory.deleteMany({
        where: { deviceId: device.id, capturedAt: { lt: cutoff } },
      });
      historyDeleted += result.count;
    }

    const oldNotifications = await this.prisma.notification.deleteMany({
      where: {
        readAt: { not: null },
        createdAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60_000) },
      },
    });
    const oldSecurity = await this.prisma.securityEvent.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - 180 * 24 * 60 * 60_000) } },
    });

    this.logger.log(
      `Cleanup: ${pairings.count} pairings, ${commands.count} commands, ${sessions.count} sessions, ` +
        `${tokens.count} e-mail tokens, ${historyDeleted} history points, ` +
        `${oldNotifications.count} notifications, ${oldSecurity.count} security events`,
    );
  }
}

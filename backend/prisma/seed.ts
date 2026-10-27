/**
 * Development seed for Abdullah Laqeeni.
 *
 * Usage (from backend/):
 *   copy .env.example .env    # then adjust secrets
 *   npm.cmd run prisma:push
 *   npm.cmd run seed
 *
 * The seed refuses to run in production unless SEED_ALLOW_PRODUCTION=true.
 * It is idempotent: the demo user/device are updated in place, never duplicated.
 */
import 'dotenv/config';
import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import {
  CommandStatus,
  CommandType,
  NotificationType,
  PairingStatus,
  PrismaClient,
  SecurityEventType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CryptoService } from '../src/common/crypto.service';

const prisma = new PrismaClient();
const DEMO_EMAIL = 'demo@laqeeni.app';
const DEMO_PASSWORD = 'Laqeeni#2026';
const DEMO_DEVICE_ID = '11111111-1111-4111-8111-111111111111';
const DEMO_DEVICE_SECRET = 'demo-device-secret-do-not-use-in-production-0001';
const DEMO_DEVICE_TOKEN = `${DEMO_DEVICE_ID}.${DEMO_DEVICE_SECRET}`;
const DEMO_PAIRING_CODE = 'DEMO2026';

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
    throw new Error('Refusing to seed production. Set SEED_ALLOW_PRODUCTION=true to override.');
  }

  const crypto = new CryptoService(new ConfigService());
  const now = new Date();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      name: 'عبدالله',
      passwordHash,
      emailVerifiedAt: now,
      deletedAt: null,
    },
    create: {
      email: DEMO_EMAIL,
      name: 'عبدالله',
      passwordHash,
      emailVerifiedAt: now,
    },
  });

  const device = await prisma.device.upsert({
    where: { id: DEMO_DEVICE_ID },
    update: {
      userId: user.id,
      name: 'Galaxy S23 — تجريبي',
      manufacturer: 'Samsung',
      model: 'SM-S911B',
      androidVersion: '14',
      appVersion: '1.0.0',
      tokenHash: crypto.hashToken(DEMO_DEVICE_TOKEN),
      tokenPrefix: `****${DEMO_DEVICE_SECRET.slice(-4)}`,
      locationHistoryEnabled: true,
      historyRetentionDays: 30,
      lostMode: false,
      lastSeenAt: now,
      revokedAt: null,
      status: {
        upsert: {
          create: {
            batteryLevel: 72,
            charging: false,
            networkConnected: true,
            networkType: 'wifi',
            lastLocationAt: now,
            lastSyncAt: now,
            appVersion: '1.0.0',
          },
          update: {
            batteryLevel: 72,
            charging: false,
            networkConnected: true,
            networkType: 'wifi',
            lastLocationAt: now,
            lastSyncAt: now,
            appVersion: '1.0.0',
          },
        },
      },
      location: {
        upsert: {
          create: {
            latitudeEnc: crypto.encryptCoordinate(25.2048493),
            longitudeEnc: crypto.encryptCoordinate(55.2707828),
            accuracyMeters: 12,
            source: 'fused',
            capturedAt: now,
          },
          update: {
            latitudeEnc: crypto.encryptCoordinate(25.2048493),
            longitudeEnc: crypto.encryptCoordinate(55.2707828),
            accuracyMeters: 12,
            source: 'fused',
            isMock: false,
            capturedAt: now,
            recordedAt: now,
          },
        },
      },
    },
    create: {
      id: DEMO_DEVICE_ID,
      userId: user.id,
      name: 'Galaxy S23 — تجريبي',
      manufacturer: 'Samsung',
      model: 'SM-S911B',
      androidVersion: '14',
      appVersion: '1.0.0',
      tokenHash: crypto.hashToken(DEMO_DEVICE_TOKEN),
      tokenPrefix: `****${DEMO_DEVICE_SECRET.slice(-4)}`,
      locationHistoryEnabled: true,
      historyRetentionDays: 30,
      lastSeenAt: now,
      status: {
        create: {
          batteryLevel: 72,
          charging: false,
          networkConnected: true,
          networkType: 'wifi',
          lastLocationAt: now,
          lastSyncAt: now,
          appVersion: '1.0.0',
        },
      },
      location: {
        create: {
          latitudeEnc: crypto.encryptCoordinate(25.2048493),
          longitudeEnc: crypto.encryptCoordinate(55.2707828),
          accuracyMeters: 12,
          source: 'fused',
          capturedAt: now,
        },
      },
    },
  });

  const demoCodeHash = crypto.hashToken(`pairing:${crypto.normalizePairingCode(DEMO_PAIRING_CODE)}`);
  await prisma.pairingRequest.deleteMany({ where: { codeHash: demoCodeHash } });
  await prisma.pairingRequest.create({
    data: {
      userId: user.id,
      codeHash: demoCodeHash,
      expiresAt: new Date(now.getTime() + 10 * 60_000),
      status: PairingStatus.PENDING,
    },
  });

  await prisma.locationHistory.deleteMany({ where: { deviceId: device.id } });
  const trail = [
    [25.2048493, 55.2707828],
    [25.197197, 55.274376],
    [25.189128, 55.279621],
  ];
  for (let index = 0; index < trail.length; index += 1) {
    await prisma.locationHistory.create({
      data: {
        deviceId: device.id,
        latitudeEnc: crypto.encryptCoordinate(trail[index][0]),
        longitudeEnc: crypto.encryptCoordinate(trail[index][1]),
        accuracyMeters: 10 + index * 4,
        capturedAt: new Date(now.getTime() - (trail.length - index) * 6 * 60_000),
      },
    });
  }

  // Keep one representative command in each important state so the dashboard
  // can render its full command timeline during development.
  await prisma.remoteCommand.deleteMany({ where: { deviceId: device.id } });
  await prisma.remoteCommand.create({
    data: {
      deviceId: device.id,
      type: CommandType.RING,
      payload: { durationSeconds: 120, sound: 'siren', vibration: true, flash: true },
      status: CommandStatus.ACKNOWLEDGED,
      idempotencyKey: `seed:ring:${now.getTime()}`,
      expiresAt: new Date(now.getTime() + 10 * 60_000),
      deliveredAt: new Date(now.getTime() - 4 * 60_000),
      acknowledgedAt: new Date(now.getTime() - 4 * 60_000 + 2_000),
      result: { message: 'seed' },
    },
  });
  await prisma.remoteCommand.create({
    data: {
      deviceId: device.id,
      type: CommandType.LOCATE,
      payload: { highAccuracy: true },
      status: CommandStatus.DELIVERED,
      idempotencyKey: `seed:locate:${now.getTime()}`,
      expiresAt: new Date(now.getTime() + 15 * 60_000),
      deliveredAt: now,
    },
  });

  await prisma.notification.deleteMany({ where: { userId: user.id } });
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        deviceId: device.id,
        type: NotificationType.DEVICE_ONLINE,
        title: 'الجهاز متصل',
        body: 'Galaxy S23 — تجريبي متصل الآن ويمكنه استقبال الأوامر.',
      },
      {
        userId: user.id,
        deviceId: device.id,
        type: NotificationType.COMMAND_ACK,
        title: 'تم تنفيذ الأمر',
        body: 'نفّذ Galaxy S23 — تجريبي أمر الرنين.',
      },
    ],
  });

  await prisma.securityEvent.create({
    data: {
      userId: user.id,
      email: user.email,
      type: SecurityEventType.DEVICE_PAIRED,
      metadata: { deviceId: device.id, source: 'seed' },
    },
  });

  // eslint-disable-next-line no-console
  console.log(`
✅ Seed complete.

Demo owner
  e-mail:   ${DEMO_EMAIL}
  password: ${DEMO_PASSWORD}

Demo device
  id:       ${device.id}
  auth:     Authorization: Device ${DEMO_DEVICE_TOKEN}

Demo pairing code
  code:     ${DEMO_PAIRING_CODE.slice(0, 4)}-${DEMO_PAIRING_CODE.slice(4)} (valid 10 minutes)
  qr:       laqeeni://pair?code=${DEMO_PAIRING_CODE}

Open the web dashboard at http://localhost:3000 and sign in with the demo owner.
`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

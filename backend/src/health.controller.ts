import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { PushService } from './common/push.service';

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  @Get()
  root() {
    return {
      name: 'Abdullah Laqeeni API',
      version: '1.0.0',
      status: 'online',
      documentation: '/health',
    };
  }

  @Get('health')
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'degraded', database: 'unreachable' });
    }
    return {
      status: 'ok',
      database: 'ok',
      push: this.push.enabled ? 'fcm' : 'polling-only',
      time: new Date().toISOString(),
    };
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';
import { DevicePrincipal } from './auth-user';

/**
 * Authenticates a physical phone with a device-scoped bearer token:
 *   Authorization: Device <deviceId>.<secret>
 * The secret is never stored in plaintext.
 */
@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { device?: DevicePrincipal }>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Device ')) {
      throw new UnauthorizedException('Missing device credentials');
    }
    const token = header.slice('Device '.length).trim();
    const separator = token.indexOf('.');
    if (separator <= 0) throw new UnauthorizedException('Malformed device token');
    const deviceId = token.slice(0, separator);
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, revokedAt: null },
      select: { id: true, userId: true, name: true, tokenHash: true, tokenPrefix: true },
    });
    if (!device || !this.crypto.safeEqualHashed(token, device.tokenHash)) {
      throw new UnauthorizedException('Invalid device credentials');
    }
    request.device = {
      id: device.id,
      userId: device.userId,
      name: device.name,
      tokenPrefix: device.tokenPrefix,
    };
    return true;
  }
}

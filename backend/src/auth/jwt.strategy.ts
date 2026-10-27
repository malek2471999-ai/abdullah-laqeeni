import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/auth-user';

interface AccessPayload {
  sub: string;
  email: string;
  sid: string;
  type: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-only-access-secret',
    });
  }

  async validate(payload: AccessPayload): Promise<AuthUser> {
    if (payload.type !== 'access' || !payload.sub || !payload.sid) {
      throw new UnauthorizedException('Invalid access token');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    if (!user) throw new UnauthorizedException('Account is unavailable');
    return {
      id: user.id,
      email: user.email,
      sessionId: payload.sid,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }
}

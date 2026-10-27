import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EmailTokenType, Prisma, SecurityEventType, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { authenticator } from 'otplib';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../common/crypto.service';
import { MailService } from '../common/mail.service';
import { AuthMeta } from './auth.types';
import {
  ChangePasswordDto,
  DeleteAccountDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  TwoFactorCodeDto,
  TwoFactorDisableDto,
  VerifyEmailDto,
} from './auth.dto';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient?: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
    private readonly mail: MailService,
  ) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (clientId) this.googleClient = new OAuth2Client(clientId);
  }

  private get accessSecret(): string {
    return this.config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-only-access-secret';
  }

  private get refreshDays(): number {
    return Number(this.config.get('REFRESH_TOKEN_TTL_DAYS') ?? 30);
  }

  private get exposeDevTokens(): boolean {
    return (this.config.get('EXPOSE_DEV_TOKENS') ?? 'true') === 'true';
  }

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: Boolean(user.emailVerifiedAt),
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
    };
  }

  private async signAccess(user: User, sessionId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.id, email: user.email, sid: sessionId, type: 'access' },
      { secret: this.accessSecret, expiresIn: this.config.get('ACCESS_TOKEN_TTL') ?? '15m' },
    );
  }

  private async createSession(user: User, meta: AuthMeta): Promise<AuthResult> {
    const sessionId = randomUUID();
    const secret = this.crypto.randomToken(48);
    const refreshToken = `${sessionId}.${secret}`;
    const expiresAt = new Date(Date.now() + this.refreshDays * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: this.crypto.hashToken(refreshToken),
        userAgent: meta.userAgent?.slice(0, 500),
        ip: meta.ip,
        expiresAt,
      },
    });
    return {
      accessToken: await this.signAccess(user, sessionId),
      refreshToken,
      expiresIn: 900,
      user: this.toPublicUser(user),
    };
  }

  async register(dto: RegisterDto, meta: AuthMeta): Promise<AuthResult & { verificationToken?: string }> {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      select: { id: true },
    });
    if (existing) throw new ConflictException('An account with this e-mail already exists');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name.trim(),
        passwordHash: await bcrypt.hash(dto.password, 12),
      },
    });
    await this.recordSecurity(user.id, SecurityEventType.REGISTER, meta, { email: user.email });
    const verificationToken = await this.issueEmailToken(user, EmailTokenType.VERIFY_EMAIL);
    void this.mail.sendVerification(user.email, verificationToken).catch((error) => {
      this.logger.warn(`Verification e-mail failed: ${String(error)}`);
    });
    const result = await this.createSession(user, meta);
    return this.exposeDevTokens ? { ...result, verificationToken } : result;
  }

  async login(dto: LoginDto, meta: AuthMeta): Promise<AuthResult | { twoFactorRequired: true; challengeToken: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    const valid = user?.passwordHash ? await bcrypt.compare(dto.password, user.passwordHash) : false;
    if (!user || !valid) {
      await this.recordSecurity(user?.id ?? null, SecurityEventType.LOGIN_FAILED, meta, {
        email: dto.email,
      });
      throw new UnauthorizedException('Invalid e-mail or password');
    }
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const challengeToken = await this.jwt.signAsync(
        { sub: user.id, purpose: '2fa' },
        { secret: this.accessSecret, expiresIn: '5m' },
      );
      return { twoFactorRequired: true, challengeToken };
    }
    await this.recordSecurity(user.id, SecurityEventType.LOGIN_SUCCESS, meta, {});
    return this.createSession(user, meta);
  }

  async verifyTwoFactor(
    challengeToken: string,
    code: string,
    meta: AuthMeta,
  ): Promise<AuthResult> {
    let payload: { sub?: string; purpose?: string };
    try {
      payload = await this.jwt.verifyAsync(challengeToken, { secret: this.accessSecret });
    } catch {
      throw new UnauthorizedException('Two-factor challenge expired');
    }
    if (payload.purpose !== '2fa' || !payload.sub) {
      throw new UnauthorizedException('Invalid two-factor challenge');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user?.twoFactorSecret || !user.twoFactorEnabled) {
      throw new UnauthorizedException('Two-factor authentication is not enabled');
    }
    const secret = this.crypto.decryptText(user.twoFactorSecret);
    if (!authenticator.verify({ token: code, secret })) {
      await this.recordSecurity(user.id, SecurityEventType.LOGIN_FAILED, meta, { reason: '2fa' });
      throw new UnauthorizedException('Invalid authentication code');
    }
    await this.recordSecurity(user.id, SecurityEventType.LOGIN_SUCCESS, meta, { twoFactor: true });
    return this.createSession(user, meta);
  }

  async refresh(dto: RefreshDto, meta: AuthMeta): Promise<AuthResult> {
    const separator = dto.refreshToken.indexOf('.');
    if (separator <= 0) throw new UnauthorizedException('Invalid refresh token');
    const sessionId = dto.refreshToken.slice(0, separator);
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.user.deletedAt ||
      !this.crypto.safeEqualHashed(dto.refreshToken, session.refreshTokenHash)
    ) {
      if (session && !session.revokedAt) {
        await this.prisma.session.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Session expired, please sign in again');
    }
    const newSecret = this.crypto.randomToken(48);
    const newToken = `${session.id}.${newSecret}`;
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this.crypto.hashToken(newToken),
        lastUsedAt: new Date(),
        userAgent: meta.userAgent?.slice(0, 500) ?? session.userAgent,
        ip: meta.ip ?? session.ip,
      },
    });
    return {
      accessToken: await this.signAccess(session.user, session.id),
      refreshToken: newToken,
      expiresIn: 900,
      user: this.toPublicUser(session.user),
    };
  }

  async logout(userId: string, sessionId: string, meta: AuthMeta): Promise<{ ok: true }> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.recordSecurity(userId, SecurityEventType.LOGOUT_ALL, meta, { scope: 'session' });
    return { ok: true };
  }

  async logoutAll(userId: string, currentSessionId: string, meta: AuthMeta): Promise<{ revoked: number }> {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null, id: { not: currentSessionId } },
      data: { revokedAt: new Date() },
    });
    await this.recordSecurity(userId, SecurityEventType.LOGOUT_ALL, meta, {
      revoked: result.count,
    });
    return { revoked: result.count };
  }

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ip: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    });
    return sessions.map((session) => ({ ...session, current: session.id === currentSessionId }));
  }

  async revokeSession(userId: string, sessionId: string, currentSessionId: string, meta: AuthMeta) {
    const result = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (!result.count) throw new BadRequestException('Session not found');
    await this.recordSecurity(userId, SecurityEventType.LOGOUT_ALL, meta, {
      revokedSession: sessionId,
      current: sessionId === currentSessionId,
    });
    return { ok: true };
  }

  async changePassword(
    userId: string,
    currentSessionId: string,
    dto: ChangePasswordDto,
    meta: AuthMeta,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) throw new BadRequestException('Password sign-in is not enabled');
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 12) },
    });
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null, id: { not: currentSessionId } },
      data: { revokedAt: new Date() },
    });
    await this.recordSecurity(userId, SecurityEventType.PASSWORD_CHANGED, meta, {});
    return { ok: true };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ ok: true; resetToken?: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (!user) return { ok: true };
    const token = await this.issueEmailToken(user, EmailTokenType.RESET_PASSWORD, 30);
    void this.mail.sendPasswordReset(user.email, token).catch((error) => {
      this.logger.warn(`Reset e-mail failed: ${String(error)}`);
    });
    return this.exposeDevTokens ? { ok: true, resetToken: token } : { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto, meta: AuthMeta): Promise<{ ok: true }> {
    const tokenHash = this.crypto.hashToken(dto.token);
    const record = await this.prisma.emailToken.findFirst({
      where: {
        tokenHash,
        type: EmailTokenType.RESET_PASSWORD,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
    if (!record || record.user.deletedAt) {
      throw new BadRequestException('Reset link is invalid or expired');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          passwordHash: await bcrypt.hash(dto.password, 12),
          emailVerifiedAt: record.user.emailVerifiedAt ?? new Date(),
        },
      }),
      this.prisma.emailToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await this.recordSecurity(record.userId, SecurityEventType.PASSWORD_RESET, meta, {});
    return { ok: true };
  }

  async verifyEmail(token: string): Promise<{ ok: true }> {
    const tokenHash = this.crypto.hashToken(token);
    const record = await this.prisma.emailToken.findFirst({
      where: {
        tokenHash,
        type: EmailTokenType.VERIFY_EMAIL,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!record) throw new BadRequestException('Verification link is invalid or expired');
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
    ]);
    return { ok: true };
  }

  async resendVerification(userId: string): Promise<{ ok: true; verificationToken?: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.emailVerifiedAt) return { ok: true };
    const token = await this.issueEmailToken(user, EmailTokenType.VERIFY_EMAIL);
    void this.mail.sendVerification(user.email, token);
    return this.exposeDevTokens ? { ok: true, verificationToken: token } : { ok: true };
  }

  async googleLogin(dto: GoogleLoginDto, meta: AuthMeta): Promise<AuthResult> {
    if (!this.googleClient) {
      throw new ServiceUnavailableException('Google sign-in is not configured on this server');
    }
    let payload: { sub?: string; email?: string; email_verified?: boolean; name?: string };
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: this.config.get<string>('GOOGLE_CLIENT_ID'),
      });
      payload = ticket.getPayload() ?? {};
    } catch {
      throw new UnauthorizedException('Google token is invalid');
    }
    if (!payload.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('Google account e-mail is not verified');
    }
    const email = payload.email.toLowerCase();
    let user = await this.prisma.user.findFirst({
      where: { deletedAt: null, OR: [{ googleId: payload.sub }, { email }] },
    });
    if (user) {
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: payload.sub, emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          name: payload.name?.slice(0, 80) || email.split('@')[0],
          googleId: payload.sub,
          emailVerifiedAt: new Date(),
        },
      });
      await this.recordSecurity(user.id, SecurityEventType.REGISTER, meta, { provider: 'google' });
    }
    await this.recordSecurity(user.id, SecurityEventType.LOGIN_SUCCESS, meta, {
      provider: 'google',
    });
    return this.createSession(user, meta);
  }

  async setupTwoFactor(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.twoFactorEnabled) throw new ConflictException('Two-factor is already enabled');
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: this.crypto.encryptText(secret) },
    });
    return {
      secret,
      otpauthUrl: authenticator.keyuri(user.email, 'Abdullah Laqeeni', secret),
    };
  }

  async enableTwoFactor(userId: string, code: string, meta: AuthMeta) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) throw new BadRequestException('Start two-factor setup first');
    const secret = this.crypto.decryptText(user.twoFactorSecret);
    if (!authenticator.verify({ token: code, secret })) {
      throw new BadRequestException('Invalid authentication code');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
    await this.recordSecurity(userId, SecurityEventType.TWO_FACTOR_ENABLED, meta, {});
    return { ok: true };
  }

  async disableTwoFactor(
    userId: string,
    dto: TwoFactorDisableDto,
    meta: AuthMeta,
  ): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor is not enabled');
    }
    if (!user.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Password is incorrect');
    }
    const secret = this.crypto.decryptText(user.twoFactorSecret);
    if (!authenticator.verify({ token: dto.code, secret })) {
      throw new BadRequestException('Invalid authentication code');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    await this.recordSecurity(userId, SecurityEventType.TWO_FACTOR_DISABLED, meta, {});
    return { ok: true };
  }

  async deleteAccount(userId: string, dto: DeleteAccountDto, meta: AuthMeta): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.passwordHash && !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Password is incorrect');
    }
    await this.prisma.$transaction([
      this.prisma.device.deleteMany({ where: { userId } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.pairingRequest.deleteMany({ where: { userId } }),
      this.prisma.emailToken.deleteMany({ where: { userId } }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.securityEvent.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted+${userId}@laqeeni.invalid`,
          name: 'Deleted account',
          passwordHash: null,
          googleId: null,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          deletedAt: new Date(),
        },
      }),
    ]);
    this.logger.log(`Account ${userId} deleted (${meta.ip ?? 'unknown ip'})`);
    return { ok: true };
  }

  async securityEvents(userId: string) {
    return this.prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, type: true, ip: true, userAgent: true, metadata: true, createdAt: true },
    });
  }

  private async issueEmailToken(
    user: User,
    type: EmailTokenType,
    minutes = 30,
  ): Promise<string> {
    const token = this.crypto.randomToken(32);
    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        tokenHash: this.crypto.hashToken(token),
        type,
        expiresAt: new Date(Date.now() + minutes * 60 * 1000),
      },
    });
    return token;
  }

  private async recordSecurity(
    userId: string | null,
    type: SecurityEventType,
    meta: AuthMeta,
    metadata: Record<string, unknown>,
  ): Promise<void> {
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
      this.logger.warn(`Could not write security event: ${String(error)}`);
    }
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
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
  TwoFactorVerifyDto,
  VerifyEmailDto,
} from './auth.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser, RequestMeta } from '../common/decorators';
import { AuthUser } from '../common/auth-user';
import { AuthMeta } from './auth.types';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto, @RequestMeta() meta: AuthMeta) {
    return this.auth.register(dto, meta);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: LoginDto, @RequestMeta() meta: AuthMeta) {
    return this.auth.login(dto, meta);
  }

  @Post('google')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  google(@Body() dto: GoogleLoginDto, @RequestMeta() meta: AuthMeta) {
    return this.auth.googleLogin(dto, meta);
  }

  @Post('2fa/verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyTwoFactor(@Body() dto: TwoFactorVerifyDto, @RequestMeta() meta: AuthMeta) {
    return this.auth.verifyTwoFactor(dto.challengeToken, dto.code, meta);
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  refresh(@Body() dto: RefreshDto, @RequestMeta() meta: AuthMeta) {
    return this.auth.refresh(dto, meta);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const record = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return this.auth.toPublicUser(record);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  logout(@CurrentUser() user: AuthUser, @RequestMeta() meta: AuthMeta) {
    return this.auth.logout(user.id, user.sessionId, meta);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(200)
  logoutAll(@CurrentUser() user: AuthUser, @RequestMeta() meta: AuthMeta) {
    return this.auth.logoutAll(user.id, user.sessionId, meta);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  sessions(@CurrentUser() user: AuthUser) {
    return this.auth.listSessions(user.id, user.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  revoke(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.auth.revokeSession(user.id, id, user.sessionId, meta);
  }

  @UseGuards(JwtAuthGuard)
  @Post('password')
  @HttpCode(200)
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.auth.changePassword(user.id, user.sessionId, dto, meta);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  resetPassword(@Body() dto: ResetPasswordDto, @RequestMeta() meta: AuthMeta) {
    return this.auth.resetPassword(dto, meta);
  }

  @Post('verify-email')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  @HttpCode(200)
  resendVerification(@CurrentUser() user: AuthUser) {
    return this.auth.resendVerification(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  setupTwoFactor(@CurrentUser() user: AuthUser) {
    return this.auth.setupTwoFactor(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  enableTwoFactor(
    @CurrentUser() user: AuthUser,
    @Body() dto: TwoFactorCodeDto,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.auth.enableTwoFactor(user.id, dto.code, meta);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  disableTwoFactor(
    @CurrentUser() user: AuthUser,
    @Body() dto: TwoFactorDisableDto,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.auth.disableTwoFactor(user.id, dto, meta);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  @HttpCode(200)
  deleteAccount(
    @CurrentUser() user: AuthUser,
    @Body() dto: DeleteAccountDto,
    @RequestMeta() meta: AuthMeta,
  ) {
    return this.auth.deleteAccount(user.id, dto, meta);
  }

  @UseGuards(JwtAuthGuard)
  @Get('security-events')
  securityEvents(@CurrentUser() user: AuthUser) {
    return this.auth.securityEvents(user.id);
  }
}

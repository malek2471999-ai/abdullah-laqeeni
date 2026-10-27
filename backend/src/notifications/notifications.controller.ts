import { Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/auth-user';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('limit') limit?: string) {
    return this.notifications.list(user.id, limit ? Number(limit) : 50);
  }

  @Get('unread-count')
  async unread(@CurrentUser() user: AuthUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Post(':id/read')
  @HttpCode(200)
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Post('read-all')
  @HttpCode(200)
  markAll(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.id);
  }
}

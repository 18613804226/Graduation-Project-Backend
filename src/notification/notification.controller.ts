// src/notification/notification.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; // 根据你的守卫路径调整
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { success } from 'src/common/dto/response.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  private getUserIdFromRequest(req: Request): number {
    // 假设你的 JWT payload 中有 userId
    // 例如：req.user = { userId: 123, role: 'STUDENT' }
    return (req as any).user?.userId;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  async getUnreadCount(@Req() req: Request) {
    const userId = this.getUserIdFromRequest(req);
    const count = await this.notificationService.findAllUnreadCount(userId);
    return { unreadCount: count };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  async getNotifications(
    @Req() req: Request & { user?: { id: number } },
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    // 🔐 1. 从 Guard 注入的 user 获取 ID（安全！）
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // 🧮 2. 安全解析分页参数（允许空/非法值）
    const page = this.parsePositiveInt(pageStr, 1);
    const limit = this.parsePositiveInt(limitStr, 20, 100); // 最大 100

    // 📥 3. 查询（Service 内部也会按 userId 过滤）
    const res = await this.notificationService.findAllForUser(
      userId,
      page,
      limit,
    );
    return success(res);
  }
  private parsePositiveInt(
    value: string | undefined,
    defaultValue: number,
    max?: number,
  ): number {
    if (value === undefined || value === '') {
      return defaultValue;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) {
      return defaultValue;
    }
    return max ? Math.min(num, max) : num;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('mark-as-read')
  async markAsRead(@Req() req: Request, @Body() body: MarkAsReadDto) {
    const userId = this.getUserIdFromRequest(req);
    await this.notificationService.markAsRead(userId, body.ids);
    return success({ success: true });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('mark-all-as-read')
  async markAllAsRead(@Req() req: Request) {
    const userId = this.getUserIdFromRequest(req);
    await this.notificationService.markAllAsRead(userId);
    return success({ success: true });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('clear')
  async clearAll(@Req() req: Request) {
    const userId = this.getUserIdFromRequest(req);
    await this.notificationService.clearAll(userId);
    return success({ success: true });
  }
  @Delete(':id')
  async deleteNotification(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;
    await this.notificationService.deleteOne(userId, id);
    return success({ success: true });
  }
  // ❗ 内部使用：其他服务调用（如 CertificateService）
  // 不暴露给前端，仅用于模块间调用
  // async createNotification(userId: number, dto: CreateNotificationDto) {
  //   return this.notificationService.create(userId, dto);
  // }
}

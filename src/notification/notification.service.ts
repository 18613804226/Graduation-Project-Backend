// src/notification/notification.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // 根据你的路径调整
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationGateway } from './notification.gateway'; // ✅ 注入
@Injectable()
export class NotificationService {
  createNotification(
    id: number,
    arg1: { title: string; content: string; type: string },
  ) {
    throw new Error('Method not implemented.');
  }
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway, // ✅ 注入
  ) {}

  async create(userId: number, createDto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        ...createDto,
      },
    });

    // ✅ 推送实时通知！
    this.notificationGateway.emitToUser(userId, 'new_notification', {
      id: notification.id,
      title: notification.title,
      content: notification.content,
      type: notification.type,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  async findAllUnreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async findAllForUser(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.notification.count({
      where: { userId },
    });

    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(userId: number, ids: number[]) {
    // 只允许操作自己的通知
    const notifications = await this.prisma.notification.findMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    if (notifications.length !== ids.length) {
      throw new NotFoundException('部分通知不存在或无权限');
    }

    return this.prisma.notification.updateMany({
      where: {
        id: { in: ids },
        userId,
      },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async clearAll(userId: number) {
    // 注意：这里是物理删除，也可改为软删除
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }

  async deleteOne(userId: number, id: number) {
    // 先校验是否存在且属于该用户
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在或无权限删除');
    }

    return this.prisma.notification.delete({
      where: { id },
    });
  }
}

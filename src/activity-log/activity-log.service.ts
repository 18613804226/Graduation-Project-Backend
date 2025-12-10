// src/activity-log/activity-log.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
type TransactionPrisma = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;
@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  // 原有方法：独立调用（自动开事务）
  async createLog(
    userId: number,
    actionType: string,
    content: string,
    options?: {
      targetId?: number;
      targetType?: string;
      isPublic?: boolean;
    },
  ) {
    return this.prisma.$transaction((prisma) =>
      this._createLog(prisma, userId, actionType, content, options),
    );
  }

  // 新增：供其他服务在事务中调用（关键！）
  async createLogInTransaction(
    prisma: TransactionPrisma,
    userId: number,
    actionType: string,
    content: string,
    options?: {
      targetId?: number;
      targetType?: string;
      isPublic?: boolean;
    },
  ) {
    return this._createLog(prisma, userId, actionType, content, options);
  }

  // 私有核心逻辑（不依赖 this.prisma）
  private async _createLog(
    prisma: TransactionPrisma,
    userId: number,
    actionType: string,
    content: string,
    options?: {
      targetId?: number;
      targetType?: string;
      isPublic?: boolean;
    },
  ) {
    return prisma.activityLog.create({
      data: {
        userId,
        actionType,
        content,
        targetId: options?.targetId,
        targetType: options?.targetType,
        isPublic: options?.isPublic ?? true,
      },
    });
  }

  async findLatestPublic(limit = 20) {
    return this.prisma.activityLog.findMany({
      where: { isPublic: true },
      include: { user: { select: { username: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

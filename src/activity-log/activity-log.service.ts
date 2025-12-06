// src/activity-log/activity-log.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.activityLog.create({
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

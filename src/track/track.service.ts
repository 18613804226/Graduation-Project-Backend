// src/track/track.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrackService {
  constructor(private prisma: PrismaService) {}

  async recordPageView(ip: string, userId: number | null, path: string = '/') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 同一用户（或 IP）今天是否已访问
    const exists = await this.prisma.pageView.findFirst({
      where: {
        ...(userId ? { userId } : { ip }),
        path,
        viewedAt: { gte: today },
      },
    });

    if (!exists) {
      await this.prisma.pageView.create({
        data: {
          ip,
          userId,
          path,
        },
      });
    }
  }
}

// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DashboardResponse,
  MonthVisit,
  TrafficPoint,
} from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(): Promise<DashboardResponse> {
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    // 👇 新增：获取最近12个月的访问量（按自然月）
    const monthlyVisits = await this.getMonthlyVisits();
    const [
      userCount,
      totalUsers,
      visitCount,
      totalVisits,
      downloadCount,
      totalDownloads,
      usageCount,
      totalUsage,
    ] = await Promise.all([
      this.prisma.user.count(), // 所有用户（因无 status 字段）
      this.prisma.user.count(),
      this.prisma.pageView.count({ where: { viewedAt: { gte: oneDayAgo } } }),
      this.prisma.pageView.count(),
      this.prisma.resourceDownload.count({
        where: { createdAt: { gte: oneDayAgo } },
      }),
      this.prisma.resourceDownload.count(),
      this.prisma.studyLog
        .aggregate({
          _sum: { duration: true },
          where: { createdAt: { gte: oneDayAgo } },
        })
        .then((res) => res._sum?.duration || 0),
      this.prisma.studyLog
        .aggregate({
          _sum: { duration: true },
        })
        .then((res) => res._sum?.duration || 0),
    ]);

    const trafficTrend = await this.getTrafficTrend();

    return {
      userCount,
      totalUsers,
      visitCount,
      totalVisits,
      downloadCount,
      totalDownloads,
      usageCount,
      totalUsage,
      trafficTrend,
      monthlyVisits, // ← 返回
    };
  }

  // src/dashboard/dashboard.service.ts
  // 👇 新增方法：获取近12个月的访问量
  private async getMonthlyVisits(): Promise<MonthVisit[]> {
    // 获取当前年月
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // 构造最近12个月的年月列表（从12个月前到本月）
    const months: { year: number; month: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(), // 0-11
      });
    }

    // 查询每个月的 PageView 数量
    const results = await Promise.all(
      months.map(async ({ year, month }) => {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1); // 下个月1号

        const count = await this.prisma.pageView.count({
          where: {
            viewedAt: {
              gte: start,
              lt: end,
            },
          },
        });

        // 格式化为 "1月", "2月", ..., "12月"
        const monthLabel = `${month + 1}月`;
        return { month: monthLabel, value: count };
      }),
    );

    return results;
  }

  private async getTrafficTrend(): Promise<TrafficPoint[]> {
    const now = new Date();
    // 因为 TZ=Europe/Minsk，now.getFullYear() 等就是本地日历
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 3600 * 1000);

    // ✅ 关键：使用 'Europe/Minsk' 而不是 'Asia/Shanghai'
    const results = await this.prisma.$queryRaw<
      { hour: number; uv_count: bigint }[]
    >`
    SELECT 
      EXTRACT(HOUR FROM "viewedAt" AT TIME ZONE 'Europe/Minsk') AS hour,
      COUNT(DISTINCT "userId") AS uv_count
    FROM "PageView"
    WHERE 
      "viewedAt" >= ${startOfDay} 
      AND "viewedAt" < ${endOfDay}
      AND "userId" IS NOT NULL
    GROUP BY EXTRACT(HOUR FROM "viewedAt" AT TIME ZONE 'Europe/Minsk')
    ORDER BY hour;
  `;

    const hours: TrafficPoint[] = Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      value: 0,
    }));

    for (const row of results) {
      const hour = Number(row.hour);
      if (hour >= 0 && hour < 24) {
        hours[hour].value = Number(row.uv_count);
      }
    }

    return hours;
  }
}

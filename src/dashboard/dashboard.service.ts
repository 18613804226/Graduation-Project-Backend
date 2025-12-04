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
    // Step 1: 查询数据库中按明斯克时区分组的月度访问量
    const dbResults = await this.prisma.$queryRaw<
      { year: number; month: number; count: bigint }[]
    >`
      SELECT 
        EXTRACT(YEAR FROM "viewedAt" AT TIME ZONE 'Europe/Minsk')::INTEGER AS year,
        EXTRACT(MONTH FROM "viewedAt" AT TIME ZONE 'Europe/Minsk')::INTEGER AS month,
        COUNT(*) AS count
      FROM "PageView"
      WHERE 
        "viewedAt" >= NOW() - INTERVAL '12 months'
      GROUP BY 
        EXTRACT(YEAR FROM "viewedAt" AT TIME ZONE 'Europe/Minsk'),
        EXTRACT(MONTH FROM "viewedAt" AT TIME ZONE 'Europe/Minsk')
      ORDER BY year, month;
    `;

    // 转为 Map 便于查找：key = "2025-12"
    const dbMap = new Map<string, number>();
    for (const row of dbResults) {
      const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
      dbMap.set(key, Number(row.count));
    }

    // Step 2: 构造最近 12 个自然月（基于当前明斯克时间）
    const nowInMinsk = new Date(); // 注意：这个 Date 是 UTC，但我们只用它算日历
    // 由于 Render 是 UTC，我们手动模拟“如果现在是明斯克时间”的年月
    // 实际上，我们只需要生成连续的 12 个月字符串，不依赖服务器时区

    const allMonths: MonthVisit[] = [];
    const today = new Date();
    // 回溯 11 个月 + 当前月 = 12 个月
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1; // JS 月份是 0-11，+1 变成 1-12
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const label = `${m}月`;
      const value = dbMap.get(key) || 0;
      allMonths.push({ month: label, value });
    }

    return allMonths;
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

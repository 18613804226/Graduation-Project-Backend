// src/dashboard/dto/dashboard-response.dto.ts
export interface TrafficPoint {
  time: string;
  value: number;
}
// 新增类型
export interface MonthVisit {
  month: string; // 如 "1月"
  value: number; // 访问量
}
export interface DashboardResponse {
  userCount: number;
  totalUsers: number;
  visitCount: number;
  totalVisits: number;
  downloadCount: number;
  totalDownloads: number;
  usageCount: number;
  totalUsage: number;
  trafficTrend: TrafficPoint[];
  monthlyVisits: MonthVisit[]; // ← 新增
}

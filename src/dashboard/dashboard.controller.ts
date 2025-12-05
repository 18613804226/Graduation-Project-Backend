import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResponse } from './dto/dashboard-response.dto';
import { ApiResponse, success } from 'src/common/dto/response.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { PrismaService } from 'prisma/prisma.service';
@Controller('admin')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('dashboard')
  async getDashboard(): Promise<ApiResponse<DashboardResponse>> {
    const res = await this.dashboardService.getDashboardData();
    return success(res);
  }
  // @Get('debug-time')
  // @Public()
  // async debugTime() {
  //   const now = new Date();
  //   const sampleView = await this.prisma.pageView.findFirst({
  //     orderBy: { id: 'desc' },
  //   });

  //   // 明斯克 = UTC+3（全年固定）
  //   const toMinskString = (utcDate: Date) => {
  //     const minsk = new Date(utcDate.getTime() + 3 * 60 * 60 * 1000);
  //     return minsk.toISOString().replace('T', ' ').slice(0, 19);
  //   };

  //   return {
  //     serverNow_UTC: now.toISOString(),
  //     lastVisit_UTC: sampleView?.viewedAt?.toISOString() || null,
  //     lastVisit_Minsk: sampleView?.viewedAt
  //       ? toMinskString(new Date(sampleView.viewedAt))
  //       : null,
  //   };
  // }
}

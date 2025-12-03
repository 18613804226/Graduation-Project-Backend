import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResponse } from './dto/dashboard-response.dto';
import { ApiResponse, success } from 'src/common/dto/response.dto';

@Controller('admin')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard')
  async getDashboard(): Promise<ApiResponse<DashboardResponse>> {
    const res = await this.dashboardService.getDashboardData();
    return success(res);
  }
}

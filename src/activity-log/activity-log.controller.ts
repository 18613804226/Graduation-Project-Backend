// src/activity-log/activity-log.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { success } from 'src/common/dto/response.dto';

@Controller('activity-log')
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  @Get('latest')
  async getLatestFeed() {
    const res = await this.activityLogService.findLatestPublic(20);
    return success(res);
  }
}

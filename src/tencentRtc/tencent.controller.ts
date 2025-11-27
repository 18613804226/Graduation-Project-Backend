// src/tencent/tencent.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { TencentService } from './tencent.service';
import { success } from 'src/common/dto/response.dto';

@Controller('tencentRtc')
export class TencentController {
  constructor(private tencentService: TencentService) {}

  @Get('get-user-sig')
  getUserSig(@Query('userId') userId: string) {
    if (!userId) {
      return { code: 1, msg: 'userId is required' };
    }
    try {
      const userSig = this.tencentService.generateUserSig(userId);
      return success({ code: 0, userSig });
    } catch (err) {
      return { code: 2, msg: err.message };
    }
  }
}

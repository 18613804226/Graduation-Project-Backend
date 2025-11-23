import { Controller, Get, Req } from '@nestjs/common';
import express from 'express';
import { UserService } from './user.service';
import { success } from '../common/dto/response.dto'; // 👈 导入

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('info')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getInfo(@Req() req: express.Request) {
    // 从请求头获取 token，解析后获取用户 ID（实际需 JWT 验证）
    const userId = 1; // 模拟用户 ID
    try {
    const userInfo = await this.userService.getUserInfo(userId);
    return success(userInfo); // 使用统一响应格式
  } catch (error) {
    return fail('用户信息获取失败');
  }
  }
}

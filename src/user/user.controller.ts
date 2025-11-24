import { Controller, Get, Req } from '@nestjs/common';
import express from 'express';
import { UserService } from './user.service';
import { success, fail } from '../common/dto/response.dto'; // 👈 导入

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('info')
  async getCurrentUser(@Req() req: Request) {
    try {
      // 从请求头 Authorization: Bearer <token> 中提取 token
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return fail('请先登录');
      }
      const token = authHeader.substring(7); // 去掉 'Bearer '

      const userInfo = await this.userService.getCurrentUserInfo(token);
      return success(userInfo);
    } catch (error) {
      return fail(error.message || '获取用户信息失败');
    }
  }
}

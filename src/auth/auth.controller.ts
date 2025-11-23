/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import type { Request } from 'express'; // 👈 用 import type
import { AuthService } from './auth.service';
import { success } from '../common/dto/response.dto'; // 👈 导入
import { UserService } from '../user/user.service'; // 👈 新增导入

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );
    if (!user) {
      throw new Error('用户名或密码错误');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // return { accessToken: user.accessToken };
    // ✅ 按照 vben-admin 格式返回
    return success({
      id: user.id,
      username: user.username,
      realName: user.nickname || user.username,
      roles: [user.role],
      accessToken: user.accessToken,
    });
  }
  // ✅ 新增：获取当前用户的权限码
  @Get('codes')
  async getPermissionCodes(@Req() req: Request) {
    try {
      // TODO: 从 JWT 中解析真实用户 ID（当前先模拟）
      const userId = 1; // 模拟已登录用户 ID
      const permissions = await this.userService.getUserPermissions(userId);
      return success(permissions);
    } catch (error) {
      return fail('获取权限码失败');
    }
  }
}

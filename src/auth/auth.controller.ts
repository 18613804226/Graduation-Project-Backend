/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express'; // 👈 用 import type
import { AuthService } from './auth.service';
import { success, fail } from '../common/dto/response.dto'; // 👈 导入
import { UserService } from '../user/user.service'; // 👈 新增导入
import { RegisterDto } from './dto/register.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { verifyToken } from './jwt.utils';
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('login')
  @Public()
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );
    if (!user) {
      return fail('Username or password incorrect 用户名或密码错误'); // ✅ 使用统一的失败响应格式
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // return { accessToken: user.accessToken };
    // ✅ 按照 vben-admin 格式返回
    return success({
      id: user.id,
      username: user.username,
      realName: user.name || user.username,
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
      return fail('Failed to obtain permission code');
    }
  }

  // auth.controller.ts
  @Post('logout')
  @Public()
  // @UseGuards(JwtAuthGuard) ← 删除这一行！
  async logout(@Req() req, @Res() res) {
    // 可选：尝试解析 token 获取用户 ID（用于日志）
    const authHeader = req.headers['authorization'];
    let userId = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = verifyToken(token); // 你的验证函数
        userId = payload?.id;
      } catch (e) {
        // token 无效？没关系，继续登出
      }
    }
    // 如果你用了 Redis 黑名单，这里可以加（但非必须）
    // await this.redisService.setex(`blacklist:${userId}`, ttl, '1');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
  // ✅ 新增：注册接口
  @Post('register')
  @Public()
  async register(@Body() dto: RegisterDto) {
    try {
      const user = await this.authService.register(dto);
      return success({
        id: user.id,
        username: user.username,
        // email: user.email,
        roles: [user.role],
        accessToken: user.accessToken,
      });
    } catch (error) {
      return fail(error.message);
    }
  }
}

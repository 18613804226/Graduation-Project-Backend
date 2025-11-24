import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import express from 'express'; // 👈 显式导入 Express Request
import { UserService } from './user.service';
import { success, fail } from '../common/dto/response.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @Get('info')
  async getCurrentUser(@Req() req: express.Request) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return fail('请先登录');
      }
      const token = authHeader.substring(7);
      const userInfo = await this.userService.getCurrentUserInfo(token);
      return success(userInfo);
    } catch (error) {
      return fail(error.message || '获取用户信息失败');
    }
  }
  // ✅ 新增：查询所有用户（分页 + 搜索）
  @UseGuards(JwtAuthGuard) // 需要登录才能查看用户列表
  @Get('list')
  async getAllUsers(@Query() query: Record<string, string>) {
    try {
      const result = await this.userService.getAllUsers(query);
      return success(result);
    } catch (error) {
      return fail(error.message || '获取用户列表失败');
    }
  }
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteUser(
    @Param('id') userId: string,
    @CurrentUser('id') currentUserId: number, // 假设 token payload 里有 id
  ) {
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      throw new BadRequestException('无效的用户ID');
    }
    await this.userService.deleteUser(id, currentUserId);
    return success({ success: true, message: '用户删除成功' });
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import express from 'express'; // 👈 显式导入 Express Request
import { UserService } from './user.service';
import { success, fail } from '../common/dto/response.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import type { User } from '@prisma/client';
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @Get('info')
  async getCurrentUser(@Req() req: express.Request) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return fail('Please log in first.');
      }
      const token = authHeader.substring(7);
      const userInfo = await this.userService.getCurrentUserInfo(token);
      return success(userInfo);
    } catch (error) {
      return fail(error.message || 'Failed to retrieve user information');
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
      throw new BadRequestException('Invalid user ID');
    }
    await this.userService.deleteUser(id, currentUserId);
    return success({ success: true, message: 'User Delete Success' });
  }
  // 修改个人信息
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    this.userService.updateUser(currentUser.id, dto, currentUser);
    return success({ success: true, message: 'User Info Update Success' });
  }

  @Put(':id') // 管理员修改他人信息
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('id') id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    this.userService.updateUser(id, dto, currentUser);
    return success({ success: true, message: 'User Info Update Success' });
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { verifyToken } from 'src/auth/jwt.utils';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { compare, hash } from 'bcryptjs';
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // ✅ 新增：通过 accessToken 获取当前用户信息
  async getCurrentUserInfo(accessToken: string) {
    if (!accessToken) {
      throw new UnauthorizedException('No access token provided');
    }
    // 1. 验证并解析 token
    const payload = verifyToken(accessToken);
    if (!payload || !payload.id) {
      throw new UnauthorizedException('Invalid or expired tokens');
    }
    // 🔥 确保 id 是 number
    const userId = Number(payload.id);
    if (isNaN(userId)) {
      throw new UnauthorizedException('Invalid user ID in token');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User does not exist.'); // ✅ 会返回 404
    }
    // 3. 返回标准化用户信息（vben-admin 格式）
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      realName: user.name || user.username,
      role: user.role,
      roles: [user.role],
      avatar: user.avatar || 'https://via.placeholder.com/100',
      // email: user.email, // 可选：加上邮箱
    };
  }
  // 根据ID查询用户
  async getUserInfo(userId: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    // ✅ 关键：如果 user 为 null，抛出错误或返回默认值
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      roles: [user.role], // 映射 role 字段为 roles 数组
      avatar: user.avatar || 'https://via.placeholder.com/100',
    };
  }
  // ✅ 新增：获取用户权限码列表
  async getUserPermissions(userId: number): Promise<string[]> {
    // 查询用户及其角色、权限
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        // role: {
        //   include: {
        //     permissions: true, // 获取关联的权限
        //   },
        // },
      },
    });

    if (!user || !user.role) {
      return [];
    }

    // 根据 role 字符串返回对应权限码
    const rolePermissionMap: Record<string, string[]> = {
      ADMIN: ['AC_100100', 'AC_100110', 'AC_100120', 'AC_100010'],
      USER: ['AC_100110'],
      GUEST: [],
    };

    return rolePermissionMap[user.role] || []; // ✅ user.role 是字符串
  }
  // ✅ 新增：获取所有用户（带分页、搜索、筛选）
  async getAllUsers(query: Record<string, string> = {}) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize || '10', 10)),
    );
    const { keyword, role, status, username, name, startDate, endDate } = query;

    const where: any = {};
    // if (keyword) {
    //   where.OR = [
    //     { username: { contains: keyword, mode: 'insensitive' } },
    //     { nickname: { contains: keyword, mode: 'insensitive' } },
    //     { email: { contains: keyword, mode: 'insensitive' } },
    //   ];
    // }
    // 支持 username 模糊搜索（如输入 "12" 匹配 "123"）
    if (username && username.trim()) {
      where.username = { contains: username.trim(), mode: 'insensitive' };
    }
    // 处理日期范围
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      where.createdAt = {
        gte: start,
        lte: end,
      };
    }
    if (role) where.role = role;
    if (status) where.status = status;
    try {
      const [list, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            username: true,
            nickname: true,
            name: true,
            // email: true,
            role: true,
            // status: true,
            avatar: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        list: list.map((u) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          // email: u.email || '',
          role: u.role,
          // status: u.status,
          avatar: u.avatar || 'https://via.placeholder.com/100',
          createdAt: u.createdAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve user list');
    }
  }
  // ✅ 新增：删除用户（禁止删除 ADMIN）
  async deleteUser(userId: number, currentUserId: number): Promise<void> {
    // 1. 不能删除自己
    if (userId === currentUserId) {
      throw new BadRequestException(
        'Cannot delete the currently logged-in user',
      );
    }

    // 2. 查询目标用户
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new BadRequestException('User does not exist.');
    }

    // 3. 禁止删除 ADMIN 用户
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot delete administrator user');
    }

    // 4. 执行删除（硬删除）
    await this.prisma.user.delete({
      where: { id: userId },
    });

    // 💡 如果你使用软删除（有 deletedAt 字段），请改用：
    // await this.prisma.user.update({
    //   where: { id: userId },
    //   data: { deletedAt: new Date() },
    // });
  }
  // ✅ 新增：更改用户信息
  async updateUser(
    userId: number,
    dto: UpdateUserDto,
    currentUser: User,
  ): Promise<User> {
    const { name, username, newPassword, oldPassword, role } = dto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Invalid credentials.');
    }

    const updateData: Partial<User> = {};

    // 处理密码更新
    if (newPassword) {
      if (!oldPassword) {
        throw new BadRequestException(
          'Old password is required when changing password.',
        );
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        throw new BadRequestException('Invalid credentials.');
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // 处理其他字段
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (role !== undefined && currentUser.role === 'ADMIN') {
      updateData.role = role;
    }

    if (Object.keys(updateData).length === 0) {
      return user;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }
}

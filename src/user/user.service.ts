/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { verifyToken } from 'src/auth/jwt.utils';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // ✅ 新增：通过 accessToken 获取当前用户信息
  async getCurrentUserInfo(accessToken: string) {
    if (!accessToken) {
      throw new UnauthorizedException('未提供访问令牌');
    }
    // 1. 验证并解析 token
    const payload = verifyToken(accessToken);

    if (!payload || !payload.id) {
      throw new UnauthorizedException('无效或过期的令牌');
    }
    // 2. 查询用户
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    // 3. 返回标准化用户信息（vben-admin 格式）
    return {
      id: user.id,
      username: user.username,
      realName: user.nickname || user.username,
      roles: [user.role],
      avatar: user.avatar || 'https://via.placeholder.com/100',
      // email: user.email, // 可选：加上邮箱
    };
  }

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
      realName: user.nickname || user.username,
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
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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

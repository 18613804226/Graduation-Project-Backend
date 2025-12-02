/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import { RegisterDto } from './dto/register.dto';
import { generateToken } from './jwt.utils';
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async validateUser(username: string, password: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      console.log(`❌ 用户不存在: ${username}`);
      return null;
    }
    try {
      if (user && (await bcrypt.compare(password, user.password))) {
        // 生成真实 JWT
        const accessToken = generateToken({
          id: user.id,
          username: user.username,
          role: user.role,
        });
        return {
          ...user,
          accessToken: accessToken, // 实际项目应生成真实 JWT
        };
      }
    } catch (error) {
      console.error('❌ 密码比对失败:', error);
    }
    return null;
  }

  // ✅ 新增：注册用户
  async register(dto: RegisterDto): Promise<any> {
    const { password, username } = dto;

    // 检查用户名是否已存在
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    // const existingEmail = await this.prisma.user.findUnique({
    //   where: { email },
    // });
    // if (existingEmail) {
    //   throw new Error('邮箱已存在');
    // }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        username,
        // email,
        password: hashedPassword,
        role: 'STUDENT', // 默认角色
      },
    });
    const accessToken = generateToken({ id: user.id, username: user.username });

    return {
      ...user,
      accessToken: accessToken,
    };
  }
}

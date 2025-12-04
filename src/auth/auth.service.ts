// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
// import { generateToken } from './jwt.utils'; // ← 删除
import { GuestLoginDto } from './dto/guest-login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { sign } from 'jsonwebtoken';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService, // ✅ 已注入
    private configService: ConfigService,
  ) {}
  // 👇 新增这个方法
  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch (err) {
      console.error('❌ JWT Verification Failed:', err.name, err.message);
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (err.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token signature');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.log(`❌ 用户不存在: ${username}`);
      return null;
    }

    // 关键：游客等无密码用户不能走密码登录
    if (!user.password) {
      console.log(`❌ 用户 ${username} 未设置密码`);
      return null;
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return null;

      // ✅ 使用 JwtService 生成 token
      const accessToken = this.jwtService.sign({
        sub: user.id,
        username: user.username,
        role: user.role,
      });

      return {
        ...user,
        accessToken,
      };
    } catch (error) {
      console.error('❌ 密码比对失败:', error);
      return null;
    }
  }

  async register(dto: RegisterDto): Promise<any> {
    const { password, username } = dto;

    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new Error('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'STUDENT',
      },
    });

    // ✅ 统一使用 JwtService
    const accessToken = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      ...user,
      accessToken,
    };
  }
  async createByAdmin(createUserDto: CreateUserDto) {
    const { email, password, username, role } = createUserDto;

    // 1. 检查 username 是否已存在（必查！因为 username 是 @unique 且必填）
    const existingByUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingByUsername) {
      throw new ConflictException('The username has already been registered.');
    }

    // 2. 如果提供了 email，才检查邮箱是否已存在
    if (email != null && email.trim() !== '') {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingByEmail) {
        throw new ConflictException(
          'This email address has already been registered.',
        );
      }
    }

    // 3. 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. 创建用户
    const user = await this.prisma.user.create({
      data: {
        email, // 可为 undefined → Prisma 会存为 NULL
        password: hashedPassword,
        username,
        role: role || 'USER',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }
  async guestLogin(dto: GuestLoginDto) {
    // 1. 生成唯一用户名（避免冲突）
    const username = `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // 2. 创建游客用户
    const user = await this.prisma.user.create({
      data: {
        username,
        name: 'Guest', // 显示名
        role: 'GUEST', // 角色
        avatar: null, // 可选：留空或设默认图
      },
    });

    // ✅ 直接用 jsonwebtoken 签发，无类型问题
    const accessToken = sign(
      { sub: user.id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );

    // 4. 返回标准化响应（适配 vben-admin / 前端）
    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        realName: user.name,
        role: user.role,
        roles: [user.role],
        avatar: user.avatar || 'https://via.placeholder.com/100?text=Guest',
      },
    };
  }
}

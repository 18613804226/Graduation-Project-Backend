// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // 🔒 1. 检查 payload 是否存在
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid Token: User ID Missing');
    }

    // 🔒 2. 确保 sub 是字符串（防止类型不匹配）
    const userId = Number(payload.sub);

    // 校验是否为有效数字
    if (isNaN(userId)) {
      throw new UnauthorizedException('Invalid user ID');
    }
    // 🔒 3. 查询用户
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    // 🔒 4. 用户不存在
    if (!user) {
      throw new UnauthorizedException(
        'User does not exist or Token has expired',
      );
    }

    return user;
  }
}

// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { verifyToken } from './jwt.utils';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { id: number; username: string }) {
    // 可选：查数据库确认用户是否存在
    // const user = await this.userService.findById(payload.id);
    // if (!user) throw new UnauthorizedException();
    return payload;
  }
}

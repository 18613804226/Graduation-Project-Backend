// src/auth/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    if (err) throw err;
    if (!user) {
      const message = info?.message || 'Invalid or expired token';
      throw new UnauthorizedException(message);
    }

    // ✅ 白名单：允许游客访问的特殊接口
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;
    const allowedPaths = ['/api/v1/track/page-view', '/api/v1/video/get-url'];
    // ✅ 关键：禁止游客执行非 GET 请求
    if (
      user.role === 'GUEST' &&
      request.method !== 'GET' &&
      !allowedPaths.includes(path)
    ) {
      throw new ForbiddenException('Guest accounts only support viewing.');
    }

    return user;
  }
}
